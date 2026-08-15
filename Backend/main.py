from fastapi import  FastAPI ,UploadFile ,File , HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from services.text_splitter import split_text
from services.embedding import create_embeddings
from services.DataBase import (
    initialize_database,
    create_document,
    get_document_by_hash,
    save_chunks,
    search_chunks,
    get_all_documents,
    delete_document,
    create_chat_session,
    save_chat_message,
    get_all_chat_sessions,
    get_chat_messages,
    delete_chat_session
)
import hashlib
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import os
import io
load_dotenv()
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def Healt():
    return {"message": "RAG System API is Working"}


@app.on_event("startup")
def startup():
    initialize_database()


@app.post('/upload-pdf')
async def Upload_PDF(file:UploadFile = File(...)):
    if file.content_type!="application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
                )

    content = await file.read()
    file_hash = hashlib.sha256(
        content
    ).hexdigest()
    existing_document = get_document_by_hash(
        file_hash
    )

    if existing_document:
        return {
            "message": "PDF already exists",
            "document_id": str(existing_document[0]),
            "filename": existing_document[1]
        }
    reader = PdfReader(
        io.BytesIO(content)
    )
    text =""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text+'\n'
    chunks = split_text(text)


    if not chunks:

        raise HTTPException(

            status_code=400,

            detail="Could not extract text from PDF"

        )
    embeddings = create_embeddings(chunks)

    document_id = create_document(
        file.filename,
        file_hash
    )

    save_chunks(
        document_id,
        chunks,
        embeddings
    )
    return {

        "message": "PDF processed successfully",

        "document_id": str(document_id),

        "filename": file.filename,

        "pages": len(reader.pages),

        "total_characters": len(text),

        "total_chunks": len(chunks),

        "embedding_dimensions": len(embeddings[0])

    }



class ChatMessage(BaseModel):
    role: str
    text: str

class QuestionRequest(BaseModel):
    question: str
    session_id: str | None = None

def generate_session_title(query: str) -> str:
    prompt = f"""
Generate a short, concise, and professional title (maximum 3-5 words) summarizing this question. Do not use quotes or markdown:
Question: {query}
Title:"""
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )
        title = response.text.strip() if response.text else ""
        if title:
            return title
    except Exception as e:
        print("Error generating session title:", e)
    return query[:30] + "..." if len(query) > 30 else query

def get_standalone_question(question: str, history: list[tuple]) -> str:
    if not history:
        return question

    history_str = ""
    for role, text, _ in history:
        role_name = "User" if role == "user" else "Assistant"
        history_str += f"{role_name}: {text}\n"

    prompt = f"""
Given the following conversation history and a follow-up question, rephrase the follow-up question to be a standalone question that can be searched for in a document database.
Do NOT answer the question. Just output the rephrased standalone question.

CONVERSATION HISTORY:
{history_str}

FOLLOW-UP QUESTION:
{question}

STANDALONE QUESTION:"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )
        standalone = response.text.strip() if response.text else ""
        return standalone if standalone else question
    except Exception as e:
        print("Error generating standalone question:", e)
        return question

def generate_answers(question, history, results):
    context = "\n\n".join(results)

    history_str = ""
    for role, text, _ in history:
        role_name = "User" if role == "user" else "Assistant"
        history_str += f"{role_name}: {text}\n"

    prompt = f"""
You are a PDF question-answering assistant.

Answer the user's question using ONLY the information provided in the PDF context below. You may also refer to the conversation history if it provides useful context.

Do not use outside knowledge.

If the answer is not available in the context, say:
"I couldn't find the answer in the uploaded PDF."

Keep the answer concise and directly answer the question.

PDF CONTEXT:
-------------------------
{context}
-------------------------

CONVERSATION HISTORY:
-------------------------
{history_str}
-------------------------

USER QUESTION:
{question}
"""

    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash",
            contents=prompt
        )

        return {
            "success": True,
            "answer": response.text,
            "error": None
        }

    except Exception as e:
        error_msg = str(e)

        # Gemini API failed
        print("Gemini API Error:", error_msg)

        return {
            "success": False,
            "answer": None,
            "error": "Gemini API is currently unavailable.",
            "details": error_msg
        }

@app.post("/search")
def search_pdf(request: QuestionRequest):

    question = request.question
    session_id = request.session_id
    generated_title = None

    # If no session_id is provided, create a new session
    if not session_id:
        generated_title = generate_session_title(question)
        session_id = str(create_chat_session(generated_title))

    # Retrieve history from DB
    db_history = get_chat_messages(session_id)

    # Get standalone search query based on chat history
    search_query = get_standalone_question(question, db_history)

    # Question → embedding
    query_embedding = create_embeddings(
        [search_query]
    )[0]

    # PostgreSQL vector search
    rows = search_chunks(
        query_embedding,
        top_k=5
    )

    # Get only the chunk text
    results = [
        row[0]
        for row in rows
    ]

    # Send retrieved chunks & history to Gemini
    answer = generate_answers(
        question,
        db_history,
        results
    )

    # Save messages to database
    save_chat_message(session_id, "user", question)
    if answer.get("success") and answer.get("answer"):
        save_chat_message(session_id, "assistant", answer["answer"])
    else:
        save_chat_message(session_id, "assistant", "⚠️ Gemini API is currently unavailable.")

    return {
        "session_id": session_id,
        "title": generated_title,
        "question": question,
        "answer": answer,
        "sources": results
    }


@app.get("/documents")
def list_documents():
    try:
        docs = get_all_documents()
        return [
            {
                "id": str(doc[0]),
                "filename": doc[1],
                "created_at": doc[2].isoformat() if doc[2] else None
            }
            for doc in docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/documents/{document_id}")
def remove_document(document_id: str):
    try:
        delete_document(document_id)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat-sessions")
def list_chat_sessions():
    try:
        sessions = get_all_chat_sessions()
        return [
            {
                "id": str(s[0]),
                "title": s[1],
                "created_at": s[2].isoformat() if s[2] else None
            }
            for s in sessions
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat-sessions/{session_id}/messages")
def list_chat_messages(session_id: str):
    try:
        messages = get_chat_messages(session_id)
        return [
            {
                "role": m[0],
                "text": m[1],
                "created_at": m[2].isoformat() if m[2] else None
            }
            for m in messages
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/chat-sessions/{session_id}")
def remove_chat_session(session_id: str):
    try:
        delete_chat_session(session_id)
        return {"message": "Chat session deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
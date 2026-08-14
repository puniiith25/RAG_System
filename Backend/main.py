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
    delete_document
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



class QuestionRequest(BaseModel):
    question: str

def generate_answers(question,results):
    context = "\n\n".join(
        results
    )
    prompt = f"""
    You are a PDF question-answering assistant.
    Answer the user's question using ONLY the
    information provided in the PDF context.
    Do not use outside knowledge.
    Give a concise answer.
    If multiple documents provide relevant information,
    combine them carefully.
    If the answer is not available in the
    provided context, say:
    "I couldn't find the answer in the uploaded PDF."
    PDF CONTEXT:
    -------------------------
    {context}
    -------------------------
    USER QUESTION:
    {question}
    """
    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt
    )
    return response.text



@app.post("/search")
def search_pdf(request: QuestionRequest):

    question = request.question

    # Question → embedding
    query_embedding = create_embeddings(
        [question]
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

    # Send retrieved chunks to Gemini
    answer = generate_answers(
        question,
        results
    )

    return {
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
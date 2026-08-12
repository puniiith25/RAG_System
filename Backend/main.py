from fastapi import  FastAPI ,UploadFile ,File , HTTPException
from pypdf import PdfReader
from services.text_splitter import split_text
from services.embedding import create_embeddings
from services.vector_store import Vector_Store
from pydantic import BaseModel
from google import genai
from dotenv import load_dotenv
import os

load_dotenv()
client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)
app = FastAPI()
vector_store = Vector_Store()
# To Store a User Uploaded File in this Uploads Folder Directory
UPLOAD_DIR="Uploads"
os.makedirs(UPLOAD_DIR,exist_ok=True)

@app.get("/healt")
def Healt():
    return {"Message:RAG System API is Working"}

@app.post('/upload-pdf')
async def Upload_PDF(file:UploadFile = File(...)):
    if file.content_type!="application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
                )
    file_path = os.path.join(UPLOAD_DIR,file.filename)
    with open(file_path,"wb") as buffer:
        content = await file.read()
        buffer.write(content)
    reader = PdfReader(file_path)
    text =""
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text += page_text+'\n'
    chunks = split_text(text)

    embeddings = create_embeddings(chunks)
    vector_store.add_embeddings(
        embeddings,
        chunks
    )
    return {
        "filename": file.filename,
        "pages": len(reader.pages),
        "total_characters": len(text),
        "total_chunks": len(chunks),
        "chunks": chunks,
        "embedding":len(embeddings[0])
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




@app.post('/search')
def search_pdf(request:QuestionRequest):
    question = request.question
    query_embedding=create_embeddings(
        [question]
    )[0]
    results = vector_store.search(query_embedding, top_k=5)
    answer = generate_answers(
        question,
        results
    )
    return {
        "question": question,
        "results": answer,
        "Source":results
    }
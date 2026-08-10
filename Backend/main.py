from fastapi import  FastAPI ,UploadFile ,File , HTTPException
from pypdf import PdfReader
from services.text_splitter import split_text

import os


app = FastAPI()

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


    return {
        "filename": file.filename,
        "pages": len(reader.pages),
        "total_characters": len(text),
        "total_chunks": len(chunks),
        "chunks": chunks
    }

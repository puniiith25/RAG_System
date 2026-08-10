from fastapi import  FastAPI ,UploadFile ,File , HTTPException
from pypdf import PdfReader
import os


app = FastAPI()

# To Store a User Uploaded File in this Uploads Folder Directory# To Store a User Uploaded File in this Uploads Folder Directory

# To Store a User Uploaded File in this Uploads Folder Directory# To Store a User Uploaded File in this Uploads Folder Directory

UPLOAD_DIR="Uploads"
os.makedirs(UPLOAD_DIR,exist_ok=True)

@app.get("/Healt")
def Healt():
    return {"Message:RAG System API is Working"}

@app.post('/upload-pdf')
async def Upload_PDF(file:UploadFile = File(...)):
    if file.content_type!="application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
                )
    file_path = os.path.join(Upload_PDF,file.filename)
    with open(file_path,"wb") as buffer:
        content = await file.read()
        buffer.write(content)
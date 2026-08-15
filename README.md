# RAG System: AI-Powered Document Assistant

An advanced, full-stack Retrieval-Augmented Generation (RAG) system that allows users to upload PDF documents, index their content into a vector database, and perform intelligent, context-aware queries using Google's Gemini API.

![RAG System Banner](Frontend/public/rag_system_thumbnail.jpg)

---

## Key Features

- **Document Management**: Drag-and-drop or file browser upload for PDF documents. Preprocesses and splits text dynamically into semantic chunks.
- **De-duplication**: Uses SHA256 hashing to prevent duplicate uploads of identical files.
- **PostgreSQL Vector Storage**: Leverages the `pgvector` extension to store 384-dimensional dense vector embeddings of text chunks for fast similarity searches.
- **Gemini 3.5 Flash Integration**: Powered by the Google GenAI SDK to rewrite history-aware search queries and formulate precise answers based *only* on the retrieved document context.
- **Interactive Multi-Session Chat**: Real-time chat workspace supporting markdown-rendered responses, session histories grouped by time (e.g. Today, Yesterday), session management, and citations showing the exact source chunks.

---

## Technical Architecture

### Tech Stack
- **Frontend**: React (18+), Vite, Tailwind CSS, Lucide React, React Markdown.
- **Backend**: FastAPI, PyPDF (text extraction), Sentence-Transformers (embedding generation), Google GenAI SDK.
- **Database**: PostgreSQL with `pgvector` extension.

```mermaid
graph TD
    A[Frontend React Client] -->|Upload PDF| B[FastAPI Backend]
    A -->|Ask Question| B
    B -->|Extract & Chunk Text| C(Sentence Transformers)
    C -->|Generate 384-dim Embeddings| D[PostgreSQL + pgvector]
    B -->|Search Query Embeddings| D
    D -->|Retrieve Relevant Chunks| B
    B -->|Prompt + Context + History| E[Gemini 3.5 Flash]
    E -->|Generated Answer| B
    B -->|Answer + Sources| A
```

---

## Getting Started

### Prerequisites
- **Node.js** (v18+ recommended)
- **Python** (v3.10+ recommended)
- **PostgreSQL** database (with administrative access to create extensions)
- **Google Gemini API Key**

---

### Step 1: Database Setup

1. Connect to your PostgreSQL instance and create a new database:
   ```sql
   CREATE DATABASE rag_system;
   ```
2. Enable the `pgvector` extension and create the required schema by running the [Database Schema Script](file:///Users/punith25/Desktop/RAG_System/Backend/Database/schema.sql):
   ```bash
   psql -U your_postgres_user -d rag_system -f Backend/Database/schema.sql
   ```
   *Alternatively, the backend automatically initializes the database schema on startup if it does not exist.*

---

### Step 2: Backend Configuration & Start

1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables template and configure your parameters:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your details:
   - `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://username:password@localhost:5432/rag_system`)
   - `GEMINI_API_KEY`: Your Gemini developer token.
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will be running at `http://127.0.0.1:8000`.

---

### Step 3: Frontend Configuration & Start

1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install the node packages:
   ```bash
   npm install
   ```
3. Verify or create a `.env` file containing the backend URL:
   ```env
   VITE_API_URL=http://127.0.0.1:8000
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The application will be accessible locally at the URL output by Vite (usually `http://localhost:5173`).

---

## Project Structure

```
├── Backend/
│   ├── Database/
│   │   └── schema.sql       # Database schema setup (tables, vector extensions)
│   ├── services/
│   │   ├── DataBase.py      # PostgreSQL connections & queries
│   │   ├── embedding.py     # Sentence embedding generation
│   │   └── text_splitter.py # Semantic text chunking utilities
│   ├── main.py              # FastAPI endpoints & application logic
│   └── requirements.txt     # Backend python dependencies
│
└── Frontend/
    ├── public/
    │   └── rag_system_thumbnail.jpg  # Project thumbnail image banner
    ├── src/
    │   ├── components/
    │   │   ├── ChatContainer.jsx     # Workspace chat messages and controls
    │   │   └── Sidebar.jsx           # PDF Uploader & session manager sidebar
    │   ├── App.jsx                   # Central page state & network actions
    │   ├── index.css                 # Base theme and global classes
    │   └── main.jsx                  # React application mount
    └── package.json                  # Frontend dependencies and scripts
```

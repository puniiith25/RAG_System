import os
import psycopg

from pathlib import Path
from dotenv import load_dotenv


load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE URL EXISTS:", bool(DATABASE_URL))


def DB_Connection():

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is missing from .env"
        )

    conn = psycopg.connect(
        DATABASE_URL
    )

    return conn


def initialize_database():

    base_dir = Path(__file__).resolve().parent.parent

    schema_path = (
        base_dir /
        "Database" /
        "schema.sql"
    )

    print("Schema path:", schema_path)

    if not schema_path.exists():

        raise FileNotFoundError(
            f"Schema file not found: {schema_path}"
        )

    with DB_Connection() as conn:

        with conn.cursor() as cur:

            with open(
                schema_path,
                "r"
            ) as file:

                sql = file.read()

            cur.execute(sql)

            conn.commit()

    print(
        "Database initialized successfully"
    )


def create_document(filename, file_hash):

    with DB_Connection() as conn:

        with conn.cursor() as cur:

            cur.execute(
                """
                INSERT INTO documents (
                    filename,
                    file_hash
                )
                VALUES (%s, %s)
                RETURNING id
                """,
                (
                    filename,
                    file_hash
                )
            )

            document_id = cur.fetchone()[0]

            conn.commit()

            return document_id

def get_document_by_hash(file_hash):

    with DB_Connection() as conn:

        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT id, filename
                FROM documents
                WHERE file_hash = %s
                """,
                (file_hash,)
            )

            return cur.fetchone()
def save_chunks(document_id, chunks, embeddings):

    with DB_Connection() as conn:

        with conn.cursor() as cur:

            for index, (chunk, embedding) in enumerate(
                zip(chunks, embeddings)
            ):

                # numpy array → Python list
                embedding = embedding.tolist()

                cur.execute(
                    """
                    INSERT INTO document_chunks
                    (
                        document_id,
                        chunk_index,
                        content,
                        embedding
                    )
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        document_id,
                        index,
                        chunk,
                        embedding
                    )
                )

            conn.commit()

    print(
        f"{len(chunks)} chunks saved successfully"
    )
def search_chunks(query_embedding, top_k=5):

    # NumPy array → Python list
    query_embedding = query_embedding.tolist()

    with DB_Connection() as conn:

        with conn.cursor() as cur:

            cur.execute(
                """
                SELECT
                    content,
                    document_id,
                    chunk_index,
                    page_number
                FROM document_chunks
                ORDER BY embedding <=> %s::vector
                LIMIT %s
                """,
                (
                    query_embedding,
                    top_k
                )
            )

            rows = cur.fetchall()

    return rows
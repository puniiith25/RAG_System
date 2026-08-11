import faiss
import numpy as np
from sympy.codegen.fnodes import dimension


class Vector_Store:
    def __init__(self):
        self.index= None
        self.chunks = []
    def add_embeddings(self,embeddings,chunks):
        embeddings =np.array(
            embeddings
        ).astype('float32')
        dimension =embeddings.shape[1]
        self.index = faiss.IndexFlatL2(dimension)
        self.index.add(embeddings)
        self.chunks = chunks
    def search(self,query_embedding,top_k=5):
        query_embedding = np.array(
            [query_embedding]
        ).astype('float32')

        distances,indices = self.index.search(
            query_embedding,
            top_k
        )
        results = []
        for index in indices[0]:
            if index < len(self.chunks):
                results.append(
                    self.chunks[index]
                )
        return results
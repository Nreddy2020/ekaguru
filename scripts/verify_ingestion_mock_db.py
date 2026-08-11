import asyncio
import sys
import io
import os
from unittest.mock import MagicMock, AsyncMock

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.ingestion.app.extractors.pdf import extract_pdf
from services.ingestion.app.chunker import chunk_text
from services.ingestion.app.embedder import embed_chunks

# Create a dummy PDF for testing
from reportlab.pdfgen import canvas

def create_dummy_pdf() -> bytes:
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer)
    p.drawString(100, 750, "Chapter 1: The Basics of Photosynthesis")
    p.drawString(100, 730, "Photosynthesis is the process by which plants use sunlight, water, and carbon dioxide to create oxygen and energy in the form of sugar.")
    p.drawString(100, 710, "It takes place in the chloroplasts.")
    p.showPage()
    p.drawString(100, 750, "Chapter 2: Cellulose")
    p.drawString(100, 730, "Cellulose is an important structural component of the primary cell wall of green plants.")
    p.save()
    buffer.seek(0)
    return buffer.read()

async def verify_pipeline():
    print("🚀 Starting Ingestion Pipeline Verification...")
    
    # 1. Test PDF Extraction
    print("\n📄 Testing PDF Extraction...")
    pdf_content = create_dummy_pdf()
    pages = extract_pdf(pdf_content)
    print(f"   ✅ Extracted {len(pages)} pages.")
    assert len(pages) == 2, "Should have 2 pages"
    assert "Photosynthesis" in pages[0]["text"], "Page 1 content missing"
    
    # 2. Test Chunking
    print("\n✂️  Testing Chunking...")
    # Reduce chunk size for this small text
    chunks = chunk_text(pages, min_chunk_size=10) 
    print(f"   ✅ Generated {len(chunks)} chunks.")
    assert len(chunks) >= 2, "Should have at least 2 chunks"
    
    # 3. Test Embedding
    print("\n🧠 Testing Embedding Generation...")
    print("   (This might take a moment to download the model first time...)")
    embeddings = embed_chunks(chunks)
    print(f"   ✅ Generated {len(embeddings)} embeddings.")
    print(f"   ℹ️  Embedding dimension: {len(embeddings[0])}")
    
    assert len(embeddings) == len(chunks), "Mismatch between chunks and embeddings"
    assert len(embeddings[0]) == 384, "Unexpected embedding dimension (should be 384 for MiniLM)"
    
    print("\n🎉 Verification Successful! The logic pipeline works.")

if __name__ == "__main__":
    asyncio.run(verify_pipeline())

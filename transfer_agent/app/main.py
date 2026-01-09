from fastapi import FastAPI
from .models import TransferRequest, TransferResponse
from .engine import generate_transfer_tasks

app = FastAPI(title="Knowledge Transfer Agent")

@app.post("/transfer", response_model=TransferResponse)
def run_transfer(req: TransferRequest):
    """Generate knowledge transfer tasks to test true understanding"""
    response = generate_transfer_tasks(req)
    return response

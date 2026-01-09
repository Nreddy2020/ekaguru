# Knowledge Memory Service

This service acts as the "brain" of the tutor, managing student cognitive states, concepts, and learning events.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment:
   - Create `.env` file (optional, defaults to local postgres/sqlite settings in logic).
   - Set `DATABASE_URL` if using a real Postgres database.

## Running the Service

```bash
uvicorn app.main:app --reload
```

## API Documentation

Once running, visit: http://127.0.0.1:8000/docs

## Verification

To verify the service locally (using in-memory SQLite):
```bash
python verify_service.py
```

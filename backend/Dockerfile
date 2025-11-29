FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN mkdir -p /app/data

# dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# app
COPY app/ ./app

# tests (para que Jenkins pueda ejecutarlos dentro del contenedor)
COPY tests/ ./tests

# robustez para imports
ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

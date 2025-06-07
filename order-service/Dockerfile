FROM python:3.11-slim AS base

# Argumenty budowania
ARG ENVIRONMENT=development
ARG PORT=8001

# Zainstaluj curl do health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Zmienne środowiskowe
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Etap instalacji zależności
FROM base AS deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Etap deweloperski  
FROM deps AS development
ENV ENVIRONMENT=development
ENV PORT=${PORT}
COPY . .
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE ${PORT}
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]

# Etap produkcyjny
FROM deps AS production  
ENV ENVIRONMENT=production
ENV PORT=${PORT}
COPY . .
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --gid 1001 appuser
RUN chown -R appuser:appgroup /app
USER appuser
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
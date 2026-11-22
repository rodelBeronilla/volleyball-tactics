# Volleyball Tactics sync API — runs on your server (docker compose) or anywhere else.
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY pyproject.toml ./
COPY vt_api ./vt_api
RUN pip install .

RUN useradd --system --uid 10001 --create-home app
USER app
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import sys, urllib.request; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8080/healthz', timeout=3).status == 200 else 1)"

# Migrate (idempotent, locks against concurrent replicas) then serve.
CMD ["sh", "-c", "vt-api migrate && vt-api serve --port 8080"]

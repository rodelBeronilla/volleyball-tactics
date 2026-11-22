# Volleyball Tactics pipeline — the same image runs on your server (schedule loop,
# extract next to Postgres) and as a Cloud Run job (load/transform/check next to BigQuery).
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app
COPY pyproject.toml ./
COPY vt_pipeline ./vt_pipeline
RUN pip install ".[gcp]"

RUN useradd --system --uid 10001 --create-home app \
 && mkdir -p /lake /scoresheets && chown -R app /lake /scoresheets
USER app
VOLUME ["/lake"]

ENTRYPOINT ["vt-pipeline"]
CMD ["schedule", "--every", "900"]

FROM pytorch/pytorch:2.6.0-cuda12.4-cudnn9-runtime

ENV DEBIAN_FRONTEND=noninteractive \
    HF_HOME=/data/hf_cache \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsndfile1 sox git curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

RUN pip install --no-cache-dir "omnivoice>=0.2" "fastapi>=0.115" "uvicorn[standard]>=0.32" "soundfile>=0.12" \
    && pip cache purge

COPY . /app/

RUN mkdir -p /data/hf_cache \
    && groupadd -r appuser \
    && useradd -r -g appuser -d /app appuser \
    && chown -R appuser:appuser /app /data

USER appuser

EXPOSE 8880

HEALTHCHECK --interval=30s --timeout=10s --start-period=600s --retries=3 \
    CMD curl -fsS http://localhost:8880/health >/dev/null || exit 1

CMD ["python", "omnivoice-proxy.py", "--host", "0.0.0.0", "--port", "8880", "--device", "cuda"]

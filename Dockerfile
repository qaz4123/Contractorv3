# Dockerfile for Google Cloud Run deployment
# Build: docker build -t property-analyzer .
# Deploy: gcloud run deploy property-analyzer --image gcr.io/[PROJECT-ID]/property-analyzer

FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expose port (Cloud Run will inject PORT env variable)
ENV PORT=8080
EXPOSE 8080

# Run application with gunicorn
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 src.api.app:app

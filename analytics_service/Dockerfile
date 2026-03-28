FROM mcr.microsoft.com/playwright/python:v1.39.0-jammy

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV PYTHONPATH=/app

# Install dependencies
COPY requirements.txt .

RUN pip install --no-cache-dir gunicorn
RUN pip install --no-cache-dir -r requirements.txt

# Create non-root user for security
RUN adduser --disabled-password --gecos '' myuser

# Copy application code
COPY . /app

# Final permission configurations
RUN chown -R myuser:myuser /app
USER myuser

# Expose port
EXPOSE 8000

# Start Gunicorn via uvicorn workers
CMD ["gunicorn", "-k", "uvicorn.workers.UvicornWorker", "-c", "gunicorn_conf.py", "main:app"]

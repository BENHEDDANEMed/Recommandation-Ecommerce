FROM python:3.10-slim

# Install Java (required for PySpark)
RUN apt-get update && \
    apt-get install -y default-jre-headless curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set Java environment variables
ENV JAVA_HOME=/usr/lib/jvm/default-java

# Set working directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Command to run the API
CMD ["python", "api.py"]

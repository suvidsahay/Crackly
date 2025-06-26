# Use official Python image
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend code (copy the whole backend folder into /app)
COPY backend/ ./backend

# Expose the backend port
EXPOSE 8000

# Run the app as a module
CMD ["python3", "-m", "backend.app"]
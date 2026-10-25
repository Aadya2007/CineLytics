# ============================================================
# Stage 1: Build the React frontend
# ============================================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ============================================================
# Stage 2: Serve FastAPI backend + built React SPA
# ============================================================
FROM python:3.11-slim
WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend application and pre-built SQLite database
COPY backend/ ./backend/

# Copy built frontend SPA from builder stage
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 8001
ENV PORT=8001

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --app-dir backend"]

# ---------- Build React ----------
FROM node:20 AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# ---------- Backend ----------
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./backend /app/backend
COPY --from=frontend /app/dist ./static

## ערכי ברירת-מחדל — יוחלפו ע״י docker-compose/.env בזמן run
#ENV DATABASE_URL=placeholder
#ENV GCP_SA_JSON=placeholder

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
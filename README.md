# Inventory & Order Management System

A full-stack web application for managing product inventory, customers, and orders. The system provides real-time stock validation on order creation, automatic stock restoration on order cancellation, and a low-stock alert mechanism — all exposed through a RESTful API backed by an async PostgreSQL database.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | FastAPI, SQLAlchemy (async), asyncpg, PostgreSQL 16 |
| **Frontend** | React 18, Tailwind CSS, React Router, Axios |
| **Infrastructure** | Docker, Docker Compose, nginx |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- [Node.js 20+](https://nodejs.org/) — for local frontend development only
- [Python 3.12+](https://www.python.org/) — for local backend development only

## Quick Start (Docker)

```bash
git clone <repo-url>
cd inventory-system
cp .env.example .env   # open .env and set secure passwords
docker compose up --build
```

- Frontend: http://localhost:3000
- API docs (Swagger): http://localhost:8000/docs
- API docs (ReDoc): http://localhost:8000/redoc

## Local Development

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Requires a running PostgreSQL instance; update DATABASE_URL in your shell or .env
export DATABASE_URL=postgresql+asyncpg://inventoryuser:devpassword123@localhost:5432/inventorydb
export CORS_ORIGINS=http://localhost:3000

uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install

# Point the frontend at the local backend
export REACT_APP_API_URL=http://localhost:8000

npm start
```

The React dev server starts at http://localhost:3000 with hot-reload enabled.

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | /products | Create product |
| GET | /products | List products (?low_stock=true) |
| GET | /products/{id} | Get product |
| PUT | /products/{id} | Update product |
| DELETE | /products/{id} | Delete product |
| POST | /customers | Create customer |
| GET | /customers | List customers |
| GET | /customers/{id} | Get customer |
| DELETE | /customers/{id} | Delete customer |
| POST | /orders | Create order (validates stock) |
| GET | /orders | List orders |
| GET | /orders/{id} | Get order detail |
| DELETE | /orders/{id} | Cancel order (restores stock) |

Full interactive documentation is available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password — use a strong value in production |
| `DATABASE_URL` | Full async connection string used by SQLAlchemy (`postgresql+asyncpg://...`) |
| `CORS_ORIGINS` | Comma-separated list of allowed CORS origins (e.g. `http://localhost:3000,https://app.example.com`) |
| `REACT_APP_API_URL` | Base URL the frontend uses to reach the backend API |

## Deployment Guide

### Database — Render PostgreSQL (free tier)

1. Go to [render.com](https://render.com) and create a new **PostgreSQL** instance.
2. Copy the **External Database URL** from the dashboard.
3. Update `DATABASE_URL` in your backend service's environment variables (replace `postgresql://` with `postgresql+asyncpg://` for async compatibility).

### Backend — Render Web Service (free tier)

1. Push this repository to GitHub.
2. On Render, create a new **Web Service** and connect your GitHub repo.
3. Select **Docker** as the runtime; set **Dockerfile Path** to `./backend/Dockerfile`.
4. Under **Environment Variables**, add:
   - `DATABASE_URL` — the asyncpg connection string from the step above
   - `CORS_ORIGINS` — your Vercel frontend URL (e.g. `https://your-app.vercel.app`)
5. Deploy. Render will build and run the container automatically on every push to `main`.

Alternatively, the `backend/render.yaml` file in this repo can be used with Render's Infrastructure-as-Code (Blueprint) feature for automated setup.

### Frontend — Vercel

1. Import the repository on [vercel.com](https://vercel.com).
2. Set the **Root Directory** to `frontend`.
3. Under **Environment Variables**, add:
   - `REACT_APP_API_URL` — the public URL of your Render backend (e.g. `https://inventory-backend.onrender.com`)
4. Deploy. Vercel rebuilds on every push to `main`.

## Docker Hub

Build and push images manually for use in other environments:

```bash
# Backend
docker build -t your-dockerhub-username/inventory-backend:latest ./backend
docker push your-dockerhub-username/inventory-backend:latest

# Frontend (pass the API URL as a build arg)
docker build \
  --build-arg REACT_APP_API_URL=https://your-backend-url \
  -t your-dockerhub-username/inventory-frontend:latest \
  ./frontend
docker push your-dockerhub-username/inventory-frontend:latest
```

To use published images instead of building locally, replace the `build:` blocks in `docker-compose.yml` with `image: your-dockerhub-username/inventory-backend:latest` (and equivalent for frontend).

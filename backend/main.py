"""
Backend FastAPI Server — C2-App-038
Exposes the AI Agent as a REST API with guardrails protection.
"""
import time
import sys
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

# Add project root to path so we can import src.*
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.routers import chat, products

# ── Prometheus Metrics ─────────────────────────────────────────────────────────
REQUEST_COUNT = Counter(
    "api_requests_total",
    "Total number of API requests",
    ["method", "endpoint", "status_code"]
)
REQUEST_LATENCY = Histogram(
    "api_request_latency_seconds",
    "API request latency in seconds",
    ["endpoint"]
)
GUARDRAIL_BLOCKS = Counter(
    "guardrail_blocks_total",
    "Total number of requests blocked by guardrails",
    ["guard_type"]
)

# ── App Lifespan ───────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    print("=" * 50)
    print("  SlabAI Backend API — Starting up")
    print("  Docs: http://localhost:8000/docs")
    print("  Metrics: http://localhost:8000/api/metrics")
    print("=" * 50)
    yield
    print("\nSlabAI Backend API — Shutting down")

# ── App Instance ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="SlabAI Backend API",
    description=(
        "REST API for the SlabAI AI Agent with LLM Guard protection "
        "and Prometheus metrics. Built for C2-App-038."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS Middleware ────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",   # Next.js dev server
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Prometheus Instrumentation Middleware ──────────────────────────────────────
@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time

    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code
    ).inc()
    REQUEST_LATENCY.labels(endpoint=request.url.path).observe(duration)

    return response

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(chat.router,     prefix="/api", tags=["Chat"])
app.include_router(products.router, prefix="/api", tags=["Products"])

# ── Core Endpoints ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "SlabAI Backend API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }

@app.get("/api/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "service": "slabai-backend",
    }

@app.get("/api/metrics", tags=["Monitoring"])
async def metrics():
    """Prometheus metrics endpoint — scraped by Prometheus server."""
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )

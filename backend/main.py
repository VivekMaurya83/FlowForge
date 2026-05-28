from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routes.generate import router as generate_router
from routes.modify import router as modify_router
from routes.version import router as version_router
from services import mongodb_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    # Startup
    try:
        await mongodb_service.connect()
    except Exception as e:
        print(f"⚠️  MongoDB connection failed (version history disabled): {e}")
    yield
    # Shutdown
    await mongodb_service.disconnect()


app = FastAPI(
    title="FlowForge AI API",
    description="AI-powered diagram intelligence backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server + Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        # Add your Vercel URL here before deploying
        # "https://flowforge-ai.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register all routers ──────────────────────────────────────────────────────
app.include_router(generate_router, prefix="/api")
app.include_router(modify_router, prefix="/api")
app.include_router(version_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "service": "FlowForge AI API",
        "version": "1.0.0",
        "status": "online",
        "endpoints": {
            "generate": "POST /api/generate-diagram",
            "modify":   "POST /api/modify-diagram",
            "save":     "POST /api/versions/save",
            "list":     "GET  /api/versions/{diagram_id}",
            "restore":  "GET  /api/versions/restore/{version_id}",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok"}

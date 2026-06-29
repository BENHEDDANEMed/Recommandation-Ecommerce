# =============================================================================
# main.py — Point d'entrée de l'application FastAPI
# =============================================================================
# Architecture asynchrone, CORS configuré pour le frontend React,
# health check avec vérification de la connexion MongoDB en temps réel.
# =============================================================================

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import os

from database import db_manager, get_db

# ---------------------------------------------------------------------------
# Import des routers (à décommenter au fur et à mesure de leur création)
# ---------------------------------------------------------------------------
from routers import products, recommendations, events, admin, stats
from prometheus_fastapi_instrumentator import Instrumentator

# ---------------------------------------------------------------------------
# Configuration du logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — Gestion du cycle de vie de l'application (startup / shutdown)
# Remplace les anciens décorateurs @app.on_event("startup") / "shutdown"
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestion du cycle de vie de l'application FastAPI.
    - Démarrage : Initialise le pool de connexions MongoDB et le Consumer Kafka
    - Arrêt     : Ferme proprement le Producer Kafka, le Consumer, et MongoDB
    """
    logger.info("Démarrage de l'application...")
    await db_manager.connect()
    from routers import events
    await events.start_consumer()
    yield
    logger.info("Arrêt de l'application...")
    await events.stop_consumer()
    await events.stop_producer()
    await db_manager.disconnect()


# ---------------------------------------------------------------------------
# Création de l'instance FastAPI
# ---------------------------------------------------------------------------
app = FastAPI(
    title="API Recommandation E-commerce",
    description=(
        "API asynchrone pour le système de recommandation de produits. "
        "Consomme les modèles ML depuis MinIO, les événements depuis Kafka, "
        "et gère le catalogue produits dans MongoDB."
    ),
    version="2.0.0",
    docs_url="/docs",        # Swagger UI : http://localhost:8000/docs
    redoc_url="/redoc",      # ReDoc     : http://localhost:8000/redoc
    lifespan=lifespan,
)


# ---------------------------------------------------------------------------
# Middleware CORS — Autoriser le Frontend React (http://localhost:5173)
# En production, remplacer par le domaine exact du frontend déployé.
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         # Autorise toutes les origines
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,                           # Cache des preflight CORS (1h)
)


# ---------------------------------------------------------------------------
# Inclusion des routers
# Chaque router gère un domaine fonctionnel isolé (produits, events, etc.)
# ---------------------------------------------------------------------------
app.include_router(products.router,        prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(events.router,          prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1/admin")
app.include_router(stats.router, prefix="/api/v1/stats")

# Prometheus — expose /metrics pour Prometheus scraping
Instrumentator().instrument(app).expose(app)


# ---------------------------------------------------------------------------
# Routes de base
# ---------------------------------------------------------------------------

@app.get("/", tags=["Root"], summary="Page d'accueil de l'API")
async def root():
    """Retourne les informations générales de l'API et les routes disponibles."""
    return {
        "application": "API Recommandation E-commerce",
        "version": "2.0.0",
        "status": "running",
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
        },
        "endpoints": {
            "health": "/health",
            "recommendations": "/api/v1/recommend/{user_id}",
            "products": "/api/v1/products",
            "ingest_event": "POST /api/v1/events",
        },
    }


@app.get("/health", tags=["Monitoring"], summary="Vérification de l'état du service")
async def health_check(db=Depends(get_db)):
    """
    Endpoint de santé (health check).

    Vérifie en temps réel :
    - Que le serveur FastAPI répond correctement.
    - Que la connexion à MongoDB est active (commande 'ping').

    Utilisé par Docker Compose, Kubernetes et Prometheus pour le monitoring.
    """
    mongo_status = "unreachable"
    mongo_latency_ms = -1

    try:
        import time
        start = time.monotonic()
        # Envoi d'une commande ping au serveur MongoDB
        await db.command("ping")
        mongo_latency_ms = round((time.monotonic() - start) * 1000, 2)
        mongo_status = "connected"
    except Exception as e:
        logger.error(f"Échec du ping MongoDB : {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "degraded",
                "services": {
                    "fastapi": "ok",
                    "mongodb": mongo_status,
                },
                "error": str(e),
            },
        )

    return {
        "status": "healthy",
        "services": {
            "fastapi": "ok",
            "mongodb": mongo_status,
        },
        "mongodb_latency_ms": mongo_latency_ms,
        "environment": os.getenv("ENVIRONMENT", "development"),
    }

# =============================================================================
# database.py — Connexion asynchrone à MongoDB via Motor
# =============================================================================
# Motor est le driver officiel MongoDB pour Python asynchrone (asyncio).
# Il wrappe PyMongo et retourne des coroutines compatibles avec FastAPI/asyncio.
# =============================================================================

from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration — Lecture depuis les variables d'environnement (Docker Compose)
# En développement local, des valeurs par défaut sont utilisées comme fallback.
# ---------------------------------------------------------------------------
MONGODB_URL: str = os.getenv(
    "MONGODB_URL",
    "mongodb://127.0.0.1:27017/recommender_db"
)
MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "recommender_db")


# ---------------------------------------------------------------------------
# Singleton de connexion — Le client Motor est partagé sur toute l'application.
# FastAPI crée une seule instance au démarrage (lifespan) et la ferme à l'arrêt.
# ---------------------------------------------------------------------------
class DatabaseManager:
    """
    Gestionnaire de connexion MongoDB.
    Implémente le pattern Singleton pour éviter d'ouvrir plusieurs pools
    de connexions TCP durant le cycle de vie de l'application.
    """
    client: Optional[AsyncIOMotorClient] = None

    async def connect(self) -> None:
        """Ouvre la connexion au cluster MongoDB et vérifie la disponibilité."""
        logger.info(f"Connexion à MongoDB : {MONGODB_URL}")
        self.client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000,  # Timeout si MongoDB est inaccessible
            maxPoolSize=10,                  # Pool de connexions TCP
            minPoolSize=1,
        )
        # Vérification active : envoie une commande 'ping' au serveur
        await self.client.admin.command("ping")
        logger.info("✅ Connexion MongoDB établie avec succès.")

    async def disconnect(self) -> None:
        """Ferme proprement toutes les connexions du pool TCP."""
        if self.client:
            self.client.close()
            logger.info("🔌 Connexion MongoDB fermée.")

    def get_database(self):
        """
        Retourne l'objet base de données Motor.
        À utiliser dans les routes FastAPI via l'injection de dépendances.
        """
        if self.client is None:
            raise RuntimeError("La connexion MongoDB n'a pas été initialisée.")
        return self.client[MONGODB_DB_NAME]


# Instance globale — Importée dans main.py et les routers
db_manager = DatabaseManager()


# ---------------------------------------------------------------------------
# Dépendance FastAPI — Injection via Depends()
# Permet d'injecter la collection MongoDB directement dans une route.
#
# Exemple d'utilisation dans un router :
#   async def get_products(db = Depends(get_db)):
#       return await db["products"].find().to_list(100)
# ---------------------------------------------------------------------------
async def get_db():
    """Générateur de dépendance FastAPI pour accéder à la base de données."""
    return db_manager.get_database()

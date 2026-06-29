from fastapi import APIRouter, BackgroundTasks, Depends
import subprocess
import os
import logging
from database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/metrics", summary="Récupérer les métriques système globales", tags=["Admin"])
async def get_metrics(db = Depends(get_db)):
    total_events = await db["events"].estimated_document_count()
    total_products = await db["products"].estimated_document_count()
    
    return {
        "total_events": total_events,
        "total_products": total_products,
        "avg_latency_ms": 12.4  # Mock latency unless real tracing is added
    }

def run_pyspark_job():
    logger.info("Début du job PySpark en arrière-plan...")
    script_path = os.path.join(os.path.dirname(__file__), "..", "scripts", "run_pipeline.py")
    
    try:
        # Exécuter le script via subprocess pour l'isoler de la boucle async
        result = subprocess.run(
            ["python", script_path],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            logger.info(f"✅ Job PySpark terminé avec succès.\n{result.stdout}")
        else:
            logger.error(f"❌ Erreur lors du job PySpark.\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}")
    except Exception as e:
        logger.error(f"❌ Impossible de lancer le subprocess: {e}")

@router.post("/trigger-batch", summary="Lancer l'entraînement ALS en arrière-plan", tags=["Admin"])
async def trigger_batch(background_tasks: BackgroundTasks):
    """
    Déclenche le pipeline de Machine Learning (chargement MinIO, preprocessing, entraînement ALS).
    L'opération s'exécute en arrière-plan.
    """
    background_tasks.add_task(run_pyspark_job)
    return {
        "status": "accepted",
        "message": "Le pipeline PySpark a été lancé en arrière-plan. Vérifiez les logs Docker."
    }

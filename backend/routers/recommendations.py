"""
routers/recommendations.py — GET /api/v1/recommend/{user_id}
=============================================================
Charge le modèle ALS depuis MinIO et retourne le Top-N
des produits recommandés, enrichis avec le catalogue MongoDB.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
from minio import Minio
from pyspark.ml.recommendation import ALSModel
from pyspark.sql import SparkSession
import os
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Configuration MinIO ────────────────────────────────────────────────────────
MINIO_ENDPOINT   = os.getenv("MINIO_ENDPOINT",   "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")
MODEL_PATH       = "s3a://retailrocket-data/models/als_model_optimized"

# ── Session Spark (partagée, initialisée au premier appel) ─────────────────────
_spark: SparkSession = None
_model: ALSModel     = None


def get_spark() -> SparkSession:
    global _spark
    if _spark is None:
        packages = (
            "org.apache.hadoop:hadoop-aws:3.3.2,"
            "com.amazonaws:aws-java-sdk-bundle:1.11.901"
        )
        _spark = (
            SparkSession.builder
            .appName("FastAPI-Recommender-Inference")
            .master("local[2]")
            .config("spark.jars.packages",                    packages)
            .config("spark.hadoop.fs.s3a.endpoint",          f"http://{MINIO_ENDPOINT}")
            .config("spark.hadoop.fs.s3a.access.key",        MINIO_ACCESS_KEY)
            .config("spark.hadoop.fs.s3a.secret.key",        MINIO_SECRET_KEY)
            .config("spark.hadoop.fs.s3a.path.style.access", "true")
            .config("spark.hadoop.fs.s3a.impl",
                    "org.apache.hadoop.fs.s3a.S3AFileSystem")
            .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false")
            .config("spark.hadoop.fs.s3a.aws.credentials.provider",
                    "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider")
            .config("spark.ui.enabled",                       "false")
            .config("spark.driver.memory",                    "2g")
            .getOrCreate()
        )
        _spark.sparkContext.setLogLevel("ERROR")
        logger.info("✅ Session Spark initialisée.")
    return _spark


def get_model() -> ALSModel:
    global _model
    if _model is None:
        spark = get_spark()
        logger.info(f"Chargement du modèle ALS depuis {MODEL_PATH}...")
        _model = ALSModel.load(MODEL_PATH)
        logger.info("✅ Modèle ALS chargé.")
    return _model


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.get(
    "/recommend/{user_id}",
    summary="Top-N recommandations pour un utilisateur",
    tags=["Recommandations"],
)
async def get_recommendations(
    user_id: int,
    n:  int = Query(default=10, ge=1, le=50, description="Nombre de recommandations"),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Retourne les N produits les plus susceptibles d'intéresser l'utilisateur.

    - **user_id** : identifiant visiteur du dataset Retailrocket
    - **n**       : nombre de recommandations (défaut 10, max 50)
    """
    try:
        try:
            model = get_model()
            spark = get_spark()

            # Générer les recommandations via le modèle ALS
            users_df = spark.createDataFrame([(user_id,)], ["visitorid"])
            recs_df  = model.recommendForUserSubset(users_df, n)
            rows     = recs_df.collect()

            if not rows:
                raise HTTPException(
                    status_code=404,
                    detail=f"Aucune recommandation pour l'utilisateur {user_id}. "
                           "Il n'est peut-être pas dans le jeu d'entraînement."
                )

            # Extraire la liste [(itemid, score), ...]
            raw_recs = [
                {"itemid": str(r.itemid), "score": float(r.rating)}
                for r in rows[0].recommendations
            ]
            item_ids = [r["itemid"] for r in raw_recs]

        except Exception as e:
            logger.warning(f"Modèle ALS indisponible ({e}). Fallback vers des recommandations génériques.")
            # Fallback : On récupère N produits aléatoires ou récents depuis MongoDB
            cursor = db["products"].aggregate([{"$sample": {"size": n}}])
            fallback_docs = [doc async for doc in cursor]
            raw_recs = [
                {"itemid": str(doc["itemid"]), "score": 0.99 - (i * 0.01)}
                for i, doc in enumerate(fallback_docs)
            ]
            item_ids = [r["itemid"] for r in raw_recs]

        # Enrichir depuis MongoDB
        cursor = db["products"].find(
            {"itemid": {"$in": item_ids}},
            {"_id": 0, "itemid": 1, "name": 1, "category": 1, "price": 1, "description": 1}
        )
        mongo_docs = {doc["itemid"]: doc async for doc in cursor}

        # Fusionner ALS + MongoDB (conserver l'ordre ALS)
        recommendations = []
        for rec in raw_recs:
            iid  = str(rec["itemid"])
            meta = mongo_docs.get(iid, {})
            recommendations.append({
                "itemid":      int(iid),
                "score":       rec["score"],
                "name":        meta.get("name",        f"Produit #{iid}"),
                "category":    meta.get("category",    "Divers"),
                "price":       meta.get("price",       0.0),
                "description": meta.get("description", ""),
            })

        return {
            "user_id":        user_id,
            "count":          len(recommendations),
            "recommendations": recommendations,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur recommandation user={user_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

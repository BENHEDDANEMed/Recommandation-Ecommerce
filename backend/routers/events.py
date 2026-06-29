"""
routers/events.py — POST /api/v1/event
=======================================
Reçoit un événement utilisateur depuis le frontend React
et le publie dans le topic Kafka 'retailrocket-events'.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field
from typing import Literal
from aiokafka import AIOKafkaProducer, AIOKafkaConsumer
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
import json
import time
import os
import logging
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter()

# ── Configuration ──────────────────────────────────────────────────────────────
KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
KAFKA_TOPIC     = os.getenv("KAFKA_TOPIC", "retailrocket-events")

# ── Producer Kafka (singleton) ─────────────────────────────────────────────────
_producer: AIOKafkaProducer = None


async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            compression_type="gzip",
            request_timeout_ms=2000,
        )
        await _producer.start()
        logger.info(f"✅ Kafka Producer connecté → {KAFKA_BOOTSTRAP}")
    return _producer


async def stop_producer():
    global _producer
    if _producer:
        await _producer.stop()
        _producer = None
        logger.info("🔌 Kafka Producer arrêté.")


# ── Schémas Pydantic ───────────────────────────────────────────────────────────

class EventIn(BaseModel):
    visitorid: int  = Field(..., description="ID du visiteur", example=1150086)
    itemid:    int  = Field(..., description="ID du produit",  example=461686)
    event:     Literal["view", "addtocart", "transaction"] = Field(
        ..., description="Type d'événement"
    )
    is_simulated: bool = False

class EventOut(BaseModel):
    status:    str
    topic:     str
    event:     dict
    timestamp: int


# ── Endpoint ───────────────────────────────────────────────────────────────────

@router.post(
    "/event",
    response_model=EventOut,
    status_code=201,
    summary="Publier un événement utilisateur dans Kafka",
    tags=["Événements"],
)
async def publish_event(payload: EventIn, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Reçoit une action utilisateur (vue, ajout panier, achat) depuis le frontend
    et la publie dans le topic Kafka pour traitement par Spark Structured Streaming.
    """
    event_data = {
        "visitorid": payload.visitorid,
        "itemid":    payload.itemid,
        "event":     payload.event,
        "timestamp": int(time.time() * 1000),   # UNIX ms
        "is_simulated": payload.is_simulated,
    }

    # 1. Sauvegarde dans MongoDB si c'est un événement RÉEL (non simulé)
    if not payload.is_simulated:
        try:
            event_to_save = event_data.copy()
            # Supprimer le flag inutile pour la BD
            event_to_save.pop("is_simulated", None)
            await db["events"].insert_one(event_to_save)
            logger.info("💾 Événement réel sauvegardé dans MongoDB.")
        except Exception as e:
            logger.error(f"❌ Erreur lors de la sauvegarde dans MongoDB : {e}")

    # 2. Publier sur Kafka (pour le streaming temps réel)
    try:
        producer = await get_producer()
        # On force un timeout de 1 seconde max pour que l'interface ne gèle pas si Kafka rame
        await asyncio.wait_for(producer.send_and_wait(KAFKA_TOPIC, event_data), timeout=1.0)
        logger.info(f"📤 Événement publié: {event_data}")
    except Exception as e:
        logger.warning(f"Kafka indisponible, diffusion locale via WebSocket (Mode Démo): {e}")
        # Fallback in-memory: On pousse directement l'événement aux websockets connectés
        disconnected = []
        for ws in active_websockets:
            try:
                await ws.send_json(event_data)
            except Exception:
                disconnected.append(ws)
        for ws in disconnected:
            if ws in active_websockets:
                active_websockets.remove(ws)

    return EventOut(
        status="published",
        topic=KAFKA_TOPIC,
        event=event_data,
        timestamp=event_data["timestamp"],
    )


# ── WebSocket & Consumer Kafka ─────────────────────────────────────────────────

active_websockets: list[WebSocket] = []
consumer_task: asyncio.Task = None

@router.websocket("/ws/events")
async def websocket_events(websocket: WebSocket):
    """
    Endpoint WebSocket pour streamer les événements en temps réel vers le frontend.
    """
    await websocket.accept()
    active_websockets.append(websocket)
    logger.info("🟢 Nouvelle connexion WebSocket client.")
    try:
        while True:
            # Garder la connexion ouverte
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_websockets.remove(websocket)
        logger.info("🔴 Client WebSocket déconnecté.")

async def consume_events():
    """
    Tâche d'arrière-plan lisant les événements du topic Kafka et les poussant
    à tous les clients WebSockets actifs.
    """
    consumer = AIOKafkaConsumer(
        KAFKA_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id="fastapi-websocket-group",
        value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        auto_offset_reset="latest" # On ne veut que les événements *nouveaux*
    )
    
    # Attente pour s'assurer que Kafka est prêt (surtout via Docker)
    retries = 5
    for i in range(retries):
        try:
            await consumer.start()
            logger.info("✅ Kafka Consumer (WebSocket) connecté.")
            break
        except Exception as e:
            logger.warning(f"Consumer Kafka non prêt ({i+1}/{retries}). Nouvelle tentative... Erreur: {e}")
            await asyncio.sleep(5)
    else:
        logger.error("❌ Impossible de démarrer le Consumer Kafka.")
        return

    try:
        async for msg in consumer:
            event_data = msg.value
            # Diffuser à tous les websockets connectés
            disconnected = []
            for ws in active_websockets:
                try:
                    await ws.send_json(event_data)
                except Exception:
                    disconnected.append(ws)
            
            # Nettoyer les déconnectés
            for ws in disconnected:
                if ws in active_websockets:
                    active_websockets.remove(ws)
    except asyncio.CancelledError:
        logger.info("Arrêt du Consumer Kafka (Tâche annulée).")
    finally:
        await consumer.stop()

async def start_consumer():
    global consumer_task
    consumer_task = asyncio.create_task(consume_events())

async def stop_consumer():
    global consumer_task
    if consumer_task:
        consumer_task.cancel()

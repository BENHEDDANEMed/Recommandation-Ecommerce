"""
routers/products.py — CRUD Catalogue Produits MongoDB
======================================================
GET  /api/v1/products          — Liste paginée des produits
GET  /api/v1/products/{itemid} — Détail d'un produit
GET  /api/v1/products/search   — Recherche par nom/catégorie
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# ── Liste paginée ──────────────────────────────────────────────────────────────

@router.get(
    "/products",
    summary="Liste paginée des produits du catalogue",
    tags=["Produits"],
)
async def list_products(
    page:     int = Query(default=1,  ge=1,   description="Numéro de page"),
    per_page: int = Query(default=20, ge=1, le=100, description="Items par page"),
    category: str = Query(default=None, description="Filtrer par catégorie"),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retourne une liste paginée de produits, avec filtre optionnel par catégorie."""
    query  = {"category": category} if category else {}
    skip   = (page - 1) * per_page
    
    if query:
        total = await db["products"].count_documents(query)
    else:
        total = await db["products"].estimated_document_count()
        
    cursor = db["products"].find(query, {"_id": 0}).skip(skip).limit(per_page)
    items  = await cursor.to_list(length=per_page)

    return {
        "page":       page,
        "per_page":   per_page,
        "total":      total,
        "total_pages": (total + per_page - 1) // per_page,
        "items":      items,
    }


# ── Détail d'un produit ────────────────────────────────────────────────────────

@router.get(
    "/products/{itemid}",
    summary="Détail d'un produit par son ID",
    tags=["Produits"],
)
async def get_product(
    itemid: str,
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Retourne les métadonnées complètes d'un produit."""
    product = await db["products"].find_one({"itemid": str(itemid)}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail=f"Produit {itemid} introuvable.")
    return product


# ── Recherche ──────────────────────────────────────────────────────────────────

@router.get(
    "/products/search/query",
    summary="Recherche de produits par nom ou catégorie",
    tags=["Produits"],
)
async def search_products(
    q:        str = Query(..., min_length=2, description="Terme de recherche"),
    per_page: int = Query(default=10, ge=1, le=50),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """Recherche textuelle dans les noms et catégories de produits."""
    regex   = {"$regex": q, "$options": "i"}
    query   = {"$or": [{"name": regex}, {"category": regex}]}
    cursor  = db["products"].find(query, {"_id": 0}).limit(per_page)
    results = await cursor.to_list(length=per_page)
    return {"query": q, "count": len(results), "results": results}


# ── Catégories disponibles ─────────────────────────────────────────────────────

@router.get(
    "/products/meta/categories",
    summary="Liste des catégories disponibles",
    tags=["Produits"],
)
async def list_categories():
    """Retourne la liste des catégories distinctes pour les filtres du frontend."""
    # Hardcoded pour performance immédiate sans index
    categories = ['Appareil', 'Baskets', 'Casque', 'Clavier', 'Drone', 'Enceinte', 'Lunettes', 'Montre', 'Sac', 'Souris']
    return {"categories": sorted(categories), "count": len(categories)}

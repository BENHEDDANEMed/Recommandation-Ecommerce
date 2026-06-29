# =============================================================================
# models/product.py — Schémas Pydantic pour le catalogue produits (MongoDB)
# =============================================================================
# Ces modèles servent à :
#   1. Valider les données entrantes (POST/PUT)
#   2. Sérialiser les données sortantes (GET)
#   3. Documenter automatiquement l'API (Swagger UI)
# =============================================================================

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ProductBase(BaseModel):
    """Champs partagés entre la création et la lecture."""
    itemid: int = Field(..., description="Identifiant unique du produit (Retailrocket)")
    name: str = Field(..., min_length=1, max_length=200, description="Nom du produit")
    category: str = Field(..., description="Catégorie principale")
    price: float = Field(..., gt=0, description="Prix en EUR (doit être positif)")
    description: Optional[str] = Field(None, description="Description détaillée du produit")


class ProductCreate(ProductBase):
    """Schéma utilisé pour la création d'un produit (POST /products)."""
    pass


class ProductResponse(ProductBase):
    """Schéma utilisé pour la réponse (GET /products)."""
    id: Optional[str] = Field(None, alias="_id", description="ID MongoDB")
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True   # Permet d'utiliser '_id' ou 'id'

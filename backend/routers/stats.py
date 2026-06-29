from fastapi import APIRouter, Depends
from typing import List
from database import get_db

router = APIRouter()

@router.get("/top-users", summary="Top 5 acheteurs", tags=["Stats"])
async def get_top_users(db=Depends(get_db)):
    """
    Récupère la liste des visiteurs ayant effectué le plus de transactions.
    """
    pipeline = [
        {"$match": {"event": "transaction"}},
        {"$group": {"_id": "$visitorid", "transactions": {"$sum": 1}}},
        {"$sort": {"transactions": -1}},
        {"$limit": 50}
    ]
    count = await db["events"].count_documents({})
    print(f"DEBUG: doc count = {count}")
    cursor = db["events"].aggregate(pipeline)
    users = await cursor.to_list(length=100)
    return {"top_users": [{"visitorid": str(u["_id"]), "transactions": u["transactions"]} for u in users]}

@router.get("/abandoned-products", summary="Produits les plus vus sans achat", tags=["Stats"])
async def get_abandoned_products(db=Depends(get_db)):
    """
    Identifie les produits avec beaucoup de vues ou d'ajouts au panier, mais 0 transaction.
    """
    pipeline = [
        {"$group": {
            "_id": "$itemid",
            "views": {"$sum": {"$cond": [{"$in": ["$event", ["view", "addtocart"]]}, 1, 0]}},
            "transactions": {"$sum": {"$cond": [{"$eq": ["$event", "transaction"]}, 1, 0]}}
        }},
        {"$match": {"transactions": 0, "views": {"$gt": 0}}},
        {"$sort": {"views": -1}},
        {"$limit": 50}
    ]
    
    cursor = db["events"].aggregate(pipeline)
    abandoned = await cursor.to_list(length=100)
    
    # Récupérer les détails des produits
    item_ids = [str(item["_id"]) for item in abandoned]
    products_cursor = db["products"].find(
        {"itemid": {"$in": item_ids}},
        {"_id": 0, "itemid": 1, "name": 1, "category": 1}
    )
    products_info = {str(p["itemid"]): p for p in await products_cursor.to_list(length=100)}
    
    result = []
    for item in abandoned:
        iid = str(item["_id"])
        meta = products_info.get(iid, {})
        result.append({
            "itemid": iid,
            "views": item["views"],
            "name": meta.get("name", f"Produit #{iid}"),
            "category": meta.get("category", "Divers")
        })
        
    return {"abandoned_products": result}

@router.get("/transactions-30-days", summary="Historique des transactions sur 30 jours", tags=["Stats"])
async def get_transactions_history(db=Depends(get_db)):
    """
    Récupère le nombre de transactions par jour sur les 30 derniers jours d'activité.
    """
    pipeline = [
        {"$match": {"event": "transaction"}},
        {"$addFields": {
            "date": {
                "$dateToString": {
                    "format": "%Y-%m-%d",
                    "date": {"$toDate": "$timestamp"}
                }
            }
        }},
        {"$group": {
            "_id": "$date",
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id": 1}},
        {"$limit": 30}
    ]
    
    cursor = db["events"].aggregate(pipeline)
    days = await cursor.to_list(length=30)
    
    # Format the result nicely
    result = [{"date": d["_id"], "transactions": d["count"]} for d in days]
    
    return {"history": result}

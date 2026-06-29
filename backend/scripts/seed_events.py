import asyncio
import random
import time
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    print("Connexion à MongoDB...")
    client = AsyncIOMotorClient('mongodb://mongouser:mongopassword@mongodb:27017/recommender_db?authSource=admin')
    db = client['recommender_db']
    
    print("Récupération de 100 produits existants pour le seed...")
    products = await db['products'].find({}, {'itemid': 1}).limit(100).to_list(length=100)
    item_ids = [int(p['itemid']) for p in products]
    
    if not item_ids:
        print("Erreur: Aucun produit dans MongoDB. Exécutez d'abord seed_mongodb.py.")
        return

    # Produits abandonnés ciblés (beaucoup de vues/paniers, 0 achat)
    abandoned_items = item_ids[:30]
    # Autres produits pour les baleines et le bruit de fond
    whale_items = item_ids[30:]

    # Baleines ciblées
    whales = [888801, 888802, 888803, 888804, 888805]
    
    events = []
    
    print("Génération des événements pour les Abandons de Panier...")
    for item in abandoned_items:
        for _ in range(random.randint(200, 500)):
            events.append({
                "visitorid": random.randint(1000, 9000),
                "itemid": item,
                "event": random.choice(["view", "addtocart"]),
                "timestamp": int(time.time() * 1000)
            })

    print("Génération des événements pour les Top Acheteurs (Whales)...")
    for whale in whales:
        for _ in range(random.randint(50, 150)):
            events.append({
                "visitorid": whale,
                "itemid": random.choice(whale_items),
                "event": "transaction",
                "timestamp": int(time.time() * 1000)
            })

    print("Génération du bruit de fond (événements normaux)...")
    for _ in range(3000):
        # Exclure les abandoned_items des transactions
        rand_item = random.choice(item_ids)
        rand_event = random.choices(["view", "addtocart", "transaction"], weights=[0.8, 0.15, 0.05])[0]
        if rand_item in abandoned_items and rand_event == "transaction":
            rand_event = "view" # Convertir la transaction en vue pour garantir 0 achat
            
        events.append({
            "visitorid": random.randint(1000, 9000),
            "itemid": rand_item,
            "event": rand_event,
            "timestamp": int(time.time() * 1000)
        })

    random.shuffle(events)
    
    print(f"Insertion de {len(events)} événements dans MongoDB...")
    await db['events'].delete_many({}) # Nettoyage
    await db['events'].insert_many(events)
    print("✅ Seed d'événements terminé avec succès !")

if __name__ == '__main__':
    asyncio.run(run())

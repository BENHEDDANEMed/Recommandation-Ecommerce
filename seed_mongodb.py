"""
seed_mongodb.py — Migration SQLite → MongoDB (one-shot)
========================================================
Lit la table 'products' depuis products.db et l'insère
dans la collection 'products' de MongoDB par batches de 5000.

Usage :
    # MongoDB tourne localement (hors Docker) :
    python seed_mongodb.py

    # MongoDB dans Docker (port 27017 forwardé) :
    MONGODB_URL="mongodb://mongouser:mongopassword@localhost:27017/recommender_db?authSource=admin" python seed_mongodb.py
"""

import sqlite3
import os
import sys
import time
from pymongo import MongoClient, UpdateOne
from pymongo.errors import BulkWriteError

# ── Configuration ──────────────────────────────────────────────────────────────
SQLITE_PATH  = "products.db"
MONGODB_URL  = os.getenv(
    "MONGODB_URL",
    "mongodb://127.0.0.1:27017/recommender_db"
)
DB_NAME      = os.getenv("MONGODB_DB_NAME", "recommender_db")
COLLECTION   = "products"
BATCH_SIZE   = 5_000      # Nombre de documents insérés par appel bulk

# ── Connexion ──────────────────────────────────────────────────────────────────
print("=" * 60)
print("  Migration SQLite -> MongoDB")
print("=" * 60)
print(f"Source : {SQLITE_PATH}")
print(f"Cible  : {MONGODB_URL}")
print(f"DB     : {DB_NAME}.{COLLECTION}")
print()

# Vérification SQLite
if not os.path.exists(SQLITE_PATH):
    print(f"[ERREUR] Fichier introuvable : {SQLITE_PATH}")
    sys.exit(1)

# Connexion MongoDB
try:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)
    client.admin.command("ping")
    print("[OK] Connexion MongoDB établie.")
except Exception as e:
    print(f"[ERREUR] Impossible de se connecter à MongoDB : {e}")
    print("  -> Vérifiez que le conteneur MongoDB tourne : docker ps")
    sys.exit(1)

db         = client[DB_NAME]
collection = db[COLLECTION]

# ── Index pour les requêtes rapides ────────────────────────────────────────────
print("[...] Création des index MongoDB...")
collection.create_index("itemid",  unique=True)
collection.create_index("category")
collection.create_index("name")
print("[OK] Index créés.")

# ── Comptage SQLite ────────────────────────────────────────────────────────────
conn = sqlite3.connect(SQLITE_PATH)
conn.row_factory = sqlite3.Row
cur  = conn.cursor()

cur.execute("SELECT COUNT(*) FROM products")
total = cur.fetchone()[0]
print(f"[OK] {total:,} produits à migrer depuis SQLite.\n")

# ── Migration par batches ──────────────────────────────────────────────────────
cur.execute("SELECT itemid, name, category, price, description FROM products")

batch        = []
inserted     = 0
updated      = 0
errors       = 0
batch_num    = 0
start_time   = time.time()

def flush_batch(batch):
    """Envoie un batch de documents vers MongoDB via upsert."""
    global inserted, updated, errors
    operations = [
        UpdateOne(
            {"itemid": doc["itemid"]},   # Filtre : clé unique
            {"$set": doc},               # Mise à jour ou insertion
            upsert=True
        )
        for doc in batch
    ]
    try:
        result = collection.bulk_write(operations, ordered=False)
        inserted += result.upserted_count
        updated  += result.modified_count
    except BulkWriteError as bwe:
        errors += len(bwe.details.get("writeErrors", []))

for row in cur:
    doc = {
        "itemid":      str(row["itemid"]),
        "name":        row["name"]        or "Produit inconnu",
        "category":    row["category"]    or "Divers",
        "price":       float(row["price"]) if row["price"] else 0.0,
        "description": row["description"] or "",
    }
    batch.append(doc)

    if len(batch) >= BATCH_SIZE:
        batch_num += 1
        flush_batch(batch)
        done = (batch_num * BATCH_SIZE)
        pct  = min(done / total * 100, 100)
        elapsed = time.time() - start_time
        rate = done / elapsed if elapsed > 0 else 0
        print(f"  [{pct:5.1f}%] {done:>9,} / {total:,} docs  "
              f"| {rate:,.0f} docs/s  | +{inserted} ins, +{updated} upd", end="\r")
        batch = []

# Dernier batch (résidu)
if batch:
    flush_batch(batch)

conn.close()

# ── Résumé ─────────────────────────────────────────────────────────────────────
elapsed = time.time() - start_time
final_count = collection.count_documents({})

print("\n")
print("=" * 60)
print("  [OK] Migration terminée !")
print("=" * 60)
print(f"  Durée          : {elapsed:.1f}s")
print(f"  Insérés        : {inserted:,}")
print(f"  Mis à jour     : {updated:,}")
print(f"  Erreurs        : {errors}")
print(f"  Total MongoDB  : {final_count:,} documents")
print()

client.close()

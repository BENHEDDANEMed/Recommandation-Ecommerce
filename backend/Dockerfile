# =============================================================================
# Dockerfile — Backend FastAPI (multi-stage, optimisé pour la production)
# =============================================================================

# --- Étape 1 : Build (installation des dépendances) ---
FROM python:3.11-slim AS builder

WORKDIR /app

# Copier uniquement les requirements pour exploiter le cache Docker layer
COPY requirements.txt .

# Installation dans un virtualenv isolé pour l'étape finale
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# =============================================================================
# --- Étape 2 : Runtime (image finale allégée) ---
FROM python:3.11-slim AS runtime

# PySpark nécessite Java
RUN apt-get update && \
    apt-get install -y --no-install-recommends default-jre && \
    rm -rf /var/lib/apt/lists/*

# Copier uniquement le virtualenv construit précédemment (pas les outils de build)
COPY --from=builder /opt/venv /opt/venv

WORKDIR /app

# Copier le code source de l'application
COPY . .

# Ajouter le virtualenv au PATH
ENV PATH="/opt/venv/bin:$PATH"

# Variables d'environnement de runtime
ENV PYTHONDONTWRITEBYTECODE=1   \
    PYTHONUNBUFFERED=1          \
    ENVIRONMENT=production

# Expose le port de l'API
EXPOSE 8000

# Démarrage avec Uvicorn :
#   --host 0.0.0.0 : écoute sur toutes les interfaces du conteneur
#   --reload       : rechargement automatique (UNIQUEMENT en développement)
#   --workers 1    : 1 worker (augmenter en production avec Gunicorn)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

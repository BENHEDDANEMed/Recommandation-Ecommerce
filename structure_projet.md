# Structure du Projet de Recommandation E-commerce

Ce document présente l'architecture finale du projet de fin d'année (PFA), détaillant l'organisation des dossiers et l'utilité des fichiers principaux qui composent le pipeline Big Data, l'API et le Frontend.

```text
📁 PFA/
├── 📄 PFA_Lundi_recomendation.pdf   # Cahier des charges et spécifications du projet.
│
├── 📁 Rapports/                     # Historique de l'avancement du projet
│   ├── 📄 semaine-5.md              # Rapport : Modélisation & Évaluation
│   ├── 📄 semaine-6.md              # Rapport : Développement de l'API Flask
│   └── 📄 semaine-7.md              # Rapport : Visualisation et Dashboard React
│
├── ⚙️ Pipeline Big Data & Machine Learning (PySpark)
│   ├── 📄 ingest_data.py            # Collecte des données CSV et stockage brut dans MinIO (S3).
│   ├── 📄 preprocess.py             # Nettoyage distribué, transformation et pondération des interactions.
│   ├── 📄 train_als_model.py        # Entraînement initial du modèle de filtrage collaboratif (ALS) avec MLlib.
│   ├── 📄 optimize_als.py           # Optimisation des hyperparamètres du modèle ALS.
│   ├── 📄 evaluate_model.py         # Scripts d'évaluation des performances du modèle (RMSE, etc.).
│   └── 📄 get_top_users.py          # Utilitaire pour extraire les identifiants des utilisateurs les plus actifs (tests frontend).
│
├── 🐳 Conteneurisation & Déploiement (Docker)
│   ├── 📄 docker-compose.yml        # Orchestrateur liant MinIO, l'API et le Frontend (avec Live Reload).
│   ├── 📄 backend.Dockerfile        # Image Docker du backend (Python 3.10, Java OpenJDK, PySpark, Flask).
│   └── 📄 frontend.Dockerfile       # Image Docker du frontend (Node.js 22, React/Vite).
│
├── 🖥️ Backend API (Flask)
│   ├── 📄 api.py                    # Point d'entrée de l'API. Définit les routes HTTP (CORS activé) et expose les recommandations.
│   ├── 📄 requirements.txt          # Liste des dépendances (Flask, PySpark, Numpy, etc.) pour la construction de l'image Docker.
│   └── 📁 services/                 
│       ├── 📄 __init__.py           
│       └── 📄 spark_service.py      # Couche métier isolée : gère la session PySpark, la variable d'environnement MinIO, et charge le modèle ALS.
│
└── 🎨 Frontend Dashboard (React + Vite)
    └── 📁 frontend/                 # Dossier racine de l'application Web React
        ├── 📄 package.json          # Dépendances du projet frontend (Vite, React, lucide-react).
        └── 📁 src/
            ├── 📄 main.jsx          # Point d'entrée de l'application React.
            ├── 📄 App.jsx           # Composant principal : contient la barre de recherche, les appels AJAX vers l'API Flask, et l'affichage dynamique des recommandations.
            └── 📄 index.css         # Design system (Dark Mode, Glassmorphism, animations).
```

## Résumé de l'Architecture Technique

1. **Stockage** : MinIO agit comme un lac de données (Data Lake) pour stocker les interactions brutes et sauvegarder les modèles entraînés de PySpark (`s3a://retailrocket-data/...`).
2. **Traitement Distribué** : PySpark s'occupe de digérer les millions de lignes et d'entraîner le modèle de recommandation ALS (Alternating Least Squares).
3. **Moteur d'Inférence** : Flask sert d'intermédiaire léger. Il interroge la session locale PySpark pour récupérer le sous-ensemble de recommandations d'un utilisateur sans avoir à recharger les données lourdes.
4. **Interface Utilisateur** : React offre une visualisation instantanée et esthétique (Dashboard) sans rafraîchissement de la page en interrogeant Flask de manière asynchrone (Fetch API).
5. **Orchestration (Nouveau)** : L'ensemble de la stack technologique tourne désormais dans un réseau isolé grâce à **Docker Compose**, qui relie les ports et monte des volumes en direct (Live Reload) pour le développement.

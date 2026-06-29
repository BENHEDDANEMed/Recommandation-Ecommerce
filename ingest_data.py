import os
import kagglehub
from minio import Minio
from minio.error import S3Error

def main():
    print("1. Téléchargement du dataset depuis Kaggle...")
    # Télécharge le dataset
    dataset_path = kagglehub.dataset_download("retailrocket/ecommerce-dataset")
    print(f"Dataset prêt dans le dossier : {dataset_path}")

    # 2. Configuration MinIO
    # Assurez-vous que l'URL, l'access_key et la secret_key correspondent à votre configuration
    minio_client = Minio(
        "localhost:9000",
        access_key="minioadmin",  # Modifiez si vous avez défini d'autres accès
        secret_key="minioadmin",  # Modifiez si vous avez défini d'autres accès
        secure=False              # False car on est en local (HTTP)
    )

    bucket_name = "retailrocket-data"

    # Vérification du bucket
    if not minio_client.bucket_exists(bucket_name):
        print(f"Création du bucket '{bucket_name}'...")
        minio_client.make_bucket(bucket_name)
    else:
        print(f"Le bucket '{bucket_name}' existe déjà. Prêt pour l'upload.")

    print("\n3. Envoi des fichiers vers MinIO...")
    # Parcourt les fichiers téléchargés et les envoie sur MinIO
    for filename in os.listdir(dataset_path):
        if filename.endswith(".csv"):
            file_path = os.path.join(dataset_path, filename)
            print(f"  -> Upload en cours : {filename}")
            
            try:
                minio_client.fput_object(
                    bucket_name,
                    filename,
                    file_path
                )
                print(f"     [OK] {filename} uploade avec succes.")
            except S3Error as err:
                print(f"     [ERREUR] Erreur lors de l'upload de {filename} : {err}")

    print("\nOpération terminée ! Toutes les données sont dans MinIO.")

if __name__ == "__main__":
    main()

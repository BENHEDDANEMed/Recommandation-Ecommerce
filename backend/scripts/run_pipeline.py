import os
from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, sum as _sum
from pyspark.ml.recommendation import ALS

def get_spark():
    MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "minio:9000")
    MINIO_ACCESS_KEY = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    MINIO_SECRET_KEY = os.getenv("MINIO_SECRET_KEY", "minioadmin")

    packages = (
        "org.apache.hadoop:hadoop-aws:3.3.2,"
        "com.amazonaws:aws-java-sdk-bundle:1.11.901"
    )

    spark = SparkSession.builder \
        .appName("RetailRocket_Batch_Pipeline") \
        .master("local[*]") \
        .config("spark.jars.packages", packages) \
        .config("spark.hadoop.fs.s3a.endpoint", f"http://{MINIO_ENDPOINT}") \
        .config("spark.hadoop.fs.s3a.access.key", MINIO_ACCESS_KEY) \
        .config("spark.hadoop.fs.s3a.secret.key", MINIO_SECRET_KEY) \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem") \
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false") \
        .config("spark.hadoop.fs.s3a.aws.credentials.provider", "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider") \
        .getOrCreate()
    
    spark.sparkContext.setLogLevel("ERROR")
    return spark

def main():
    spark = get_spark()
    bucket_name = "retailrocket-data"
    
    print("🚀 Démarrage du pipeline de Machine Learning (ALS)...")

    # 1. Lecture des événements (si events.csv existe, sinon on utilise des données mockées)
    try:
        events_df = spark.read.csv(f"s3a://{bucket_name}/events.csv", header=True, inferSchema=True)
        print("✅ Données d'événements chargées depuis MinIO.")
    except Exception as e:
        print("⚠️ events.csv introuvable. Génération de données factices pour l'entraînement...")
        data = [
            (1150086, 461686, "transaction"),
            (1150086, 12345, "view"),
            (530559, 461686, "view"),
            (530559, 67890, "addtocart")
        ]
        events_df = spark.createDataFrame(data, ["visitorid", "itemid", "event"])

    # 2. Preprocessing
    events_scored_df = events_df.withColumn(
        "score",
        when(col("event") == "view", 1)
        .when(col("event") == "addtocart", 3)
        .when(col("event") == "transaction", 5)
        .otherwise(0)
    )

    user_item_matrix = events_scored_df.groupBy("visitorid", "itemid").agg(_sum("score").alias("final_score"))
    
    # 3. Entraînement ALS
    print("⏳ Entraînement du modèle ALS en cours...")
    als = ALS(rank=10, maxIter=5, regParam=0.01, 
              userCol="visitorid", itemCol="itemid", ratingCol="final_score",
              coldStartStrategy="drop", implicitPrefs=True)
    
    model = als.fit(user_item_matrix)
    print("✅ Modèle ALS entraîné avec succès.")

    # 4. Sauvegarde
    model_path = f"s3a://{bucket_name}/models/als_model_optimized"
    model.write().overwrite().save(model_path)
    print(f"✅ Modèle sauvegardé sous {model_path}.")
    
    spark.stop()

if __name__ == "__main__":
    main()

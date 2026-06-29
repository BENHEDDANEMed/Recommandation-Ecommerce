from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALS

def create_spark_session():
    print("Initialisation de PySpark pour l'entraînement ALS...")
    packages = (
        "org.apache.hadoop:hadoop-aws:3.3.2,"
        "com.amazonaws:aws-java-sdk-bundle:1.11.901"
    )

    spark = SparkSession.builder \
        .appName("RetailRocket_ALS_Train") \
        .master("local[*]") \
        .config("spark.driver.memory", "4g") \
        .config("spark.jars.packages", packages) \
        .config("spark.hadoop.fs.s3a.endpoint", "http://localhost:9000") \
        .config("spark.hadoop.fs.s3a.access.key", "minioadmin") \
        .config("spark.hadoop.fs.s3a.secret.key", "minioadmin") \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem") \
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false") \
        .config("spark.hadoop.fs.s3a.aws.credentials.provider",
                "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")
    return spark

def main():
    spark = create_spark_session()
    bucket_name = "retailrocket-data"

    print("\n1. Chargement de la matrice depuis MinIO...")
    data_path = f"s3a://{bucket_name}/processed/user_item_matrix.parquet"
    try:
        df = spark.read.parquet(data_path)
    except Exception as e:
        print(f"Erreur lors du chargement des données : {e}")
        spark.stop()
        return

    # L'algorithme ALS requiert des identifiants numériques entiers
    df = df.withColumn("visitorid", df["visitorid"].cast("integer")) \
           .withColumn("itemid", df["itemid"].cast("integer")) \
           .withColumn("final_score", df["final_score"].cast("float"))

    print("\n2. Division des données (80% entraînement, 20% test)...")
    train_data, test_data = df.randomSplit([0.8, 0.2], seed=42)

    print("\n3. Configuration et entraînement du modèle ALS...")
    # implicitPrefs=True est utilisé car nos scores proviennent d'actions (vues, achats) et non de notes directes
    als = ALS(rank=15, # Réduit pour éviter l'erreur de mémoire (Out Of Memory)
              maxIter=10, # Réduit pour accélérer l'entraînement
              regParam=0.01, 
              userCol="visitorid", 
              itemCol="itemid", 
              ratingCol="final_score",
              coldStartStrategy="drop",
              implicitPrefs=True)
              
    model = als.fit(train_data)
    print("Modèle entraîné avec succès.")

    print("\n4. Sauvegarde du modèle dans MinIO...")
    model_path = f"s3a://{bucket_name}/models/als_model_optimized"
    try:
        model.write().overwrite().save(model_path)
        print(f"Modèle sauvegardé sous : {model_path}")
    except Exception as e:
        print(f"Erreur lors de la sauvegarde du modèle : {e}")

    # Sauvegarde optionnelle des données de test pour l'évaluation (Semaine 4)
    test_path = f"s3a://{bucket_name}/processed/test_data.parquet"
    test_data.write.mode("overwrite").parquet(test_path)
    
    spark.stop()

if __name__ == "__main__":
    main()
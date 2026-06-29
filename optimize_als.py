from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALS
from pyspark.ml.evaluation import RegressionEvaluator

def create_spark_session():
    packages = (
        "org.apache.hadoop:hadoop-aws:3.3.2,"
        "com.amazonaws:aws-java-sdk-bundle:1.11.901"
    )
    spark = SparkSession.builder \
        .appName("RetailRocket_ALS_Best") \
        .master("local[2]") \
        .config("spark.driver.memory", "3g") \
        .config("spark.sql.shuffle.partitions", "4") \
        .config("spark.default.parallelism", "4") \
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

    print("\n1. Chargement des données (échantillon 20%)...")
    df = spark.read.parquet(f"s3a://{bucket_name}/processed/user_item_matrix.parquet")
    df = df.withColumn("visitorid", df["visitorid"].cast("integer")) \
           .withColumn("itemid", df["itemid"].cast("integer")) \
           .withColumn("final_score", df["final_score"].cast("float"))

    # Passage à 100% des données pour des performances optimales (assurez-vous d'avoir de l'espace disque)
    df_sample = df.sample(fraction=1.0, seed=42)
    train_data, test_data = df_sample.randomSplit([0.8, 0.2], seed=42)
    train_data.cache()
    test_data.cache()

    print("\n2. Entraînement avec les meilleurs hyperparamètres (rank=50, maxIter=20, regParam=0.01)...")
    als = ALS(
        rank=50,
        maxIter=20, # Augmentation du nombre d'itérations pour plus de précision
        regParam=0.01,
        userCol="visitorid",
        itemCol="itemid",
        ratingCol="final_score",
        coldStartStrategy="drop",
        implicitPrefs=True,
        numUserBlocks=2,
        numItemBlocks=2
    )
    model = als.fit(train_data)
    print("Modèle entraîné.")

    print("\n3. Évaluation RMSE...")
    evaluator = RegressionEvaluator(
        metricName="rmse",
        labelCol="final_score",
        predictionCol="prediction"
    )
    predictions = model.transform(test_data).dropna(subset=["prediction"])
    rmse = evaluator.evaluate(predictions)
    print(f"RMSE final : {rmse:.4f}")

    print("\n4. Sauvegarde du modèle optimisé...")
    model_path = f"s3a://{bucket_name}/models/als_model_optimized"
    model.write().overwrite().save(model_path)
    print(f"Modèle sauvegardé : {model_path}")

    train_data.unpersist()
    test_data.unpersist()
    spark.stop()


if __name__ == "__main__":
    main()
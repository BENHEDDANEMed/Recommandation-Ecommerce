from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALSModel
from pyspark.ml.evaluation import RegressionEvaluator
from pyspark.sql.functions import col, expr
from pyspark.sql import Window
import pyspark.sql.functions as F

def create_spark_session():
    print("Initialisation de PySpark pour l'évaluation...")
    packages = (
        "org.apache.hadoop:hadoop-aws:3.3.2,"
        "com.amazonaws:aws-java-sdk-bundle:1.11.901"
    )

    spark = SparkSession.builder \
        .appName("RetailRocket_Evaluate") \
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


def precision_at_k(model, test_data, k=10):
    """
    Precision@K : parmi les K items recommandés, combien sont pertinents ?
    Un item est "pertinent" s'il apparaît dans les données de test de l'utilisateur.
    """
    # Récupère les K meilleures recommandations pour chaque utilisateur du test
    users = test_data.select("visitorid").distinct()
    recs = model.recommendForUserSubset(users, k)

    # Aplatit les recommandations : une ligne par (user, item recommandé)
    recs_exploded = recs.select(
        col("visitorid"),
        F.explode(col("recommendations")).alias("rec")
    ).select(
        col("visitorid"),
        col("rec.itemid").alias("itemid")
    )

    # Items réels dans le test
    actual = test_data.select("visitorid", "itemid")

    # Intersection : items recommandés qui sont dans le test réel
    hits = recs_exploded.join(actual, on=["visitorid", "itemid"], how="inner")

    total_recs = recs_exploded.count()
    total_hits = hits.count()

    precision = total_hits / total_recs if total_recs > 0 else 0
    return precision


def main():
    spark = create_spark_session()
    bucket_name = "retailrocket-data"

    print("\n1. Chargement du modèle ALS depuis MinIO...")
    model_path = f"s3a://{bucket_name}/models/als_model_optimized"
    try:
        model = ALSModel.load(model_path)
        print("Modèle chargé avec succès.")
    except Exception as e:
        print(f"Erreur lors du chargement du modèle : {e}")
        spark.stop()
        return

    print("\n2. Chargement des données de test depuis MinIO...")
    test_path = f"s3a://{bucket_name}/processed/test_data.parquet"
    try:
        test_data = spark.read.parquet(test_path)
        print(f"Données de test chargées : {test_data.count()} lignes")
    except Exception as e:
        print(f"Erreur lors du chargement des données de test : {e}")
        spark.stop()
        return

    print("\n3. Calcul du RMSE...")
    predictions = model.transform(test_data)
    # Supprime les NaN générés par coldStartStrategy="drop"
    predictions = predictions.dropna(subset=["prediction"])

    evaluator = RegressionEvaluator(
        metricName="rmse",
        labelCol="final_score",
        predictionCol="prediction"
    )
    rmse = evaluator.evaluate(predictions)
    print(f"RMSE : {rmse:.4f}")

    print("\n4. Calcul du Precision@10...")
    precision = precision_at_k(model, test_data, k=10)
    print(f"Precision@10 : {precision:.4f} ({precision*100:.2f}%)")

    print("\n5. Exemple de recommandations pour 3 utilisateurs...")
    sample_users = test_data.select("visitorid").distinct().limit(3)
    recs = model.recommendForUserSubset(sample_users, 5)
    recs.show(truncate=False)

    print("\n--- Résumé de l'évaluation ---")
    print(f"  RMSE       : {rmse:.4f}")
    print(f"  Precision@10 : {precision*100:.2f}%")

    spark.stop()


if __name__ == "__main__":
    main()
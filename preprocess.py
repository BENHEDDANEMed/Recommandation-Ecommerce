from pyspark.sql import SparkSession
from pyspark.sql.functions import col, when, sum as _sum

def create_spark_session():
    print("Initialisation de PySpark avec le support S3/MinIO...")
    packages = (
        "org.apache.hadoop:hadoop-aws:3.3.2,"
        "com.amazonaws:aws-java-sdk-bundle:1.11.901"
    )

    spark = SparkSession.builder \
        .appName("RetailRocket_Preprocess") \
        .master("local[*]") \
        .config("spark.jars.packages", packages) \
        .config("spark.hadoop.fs.s3a.endpoint", "http://localhost:9000") \
        .config("spark.hadoop.fs.s3a.access.key", "minioadmin") \
        .config("spark.hadoop.fs.s3a.secret.key", "minioadmin") \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem") \
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false") \
        .config("spark.hadoop.fs.s3a.aws.credentials.provider",
                "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider") \
        .config("spark.hadoop.fs.s3a.connection.establish.timeout", "5000") \
        .config("spark.hadoop.fs.s3a.connection.timeout", "5000") \
        .config("spark.hadoop.fs.s3a.socket.timeout", "5000") \
        .config("spark.hadoop.fs.s3a.attempts.maximum", "1") \
        .getOrCreate()

    spark.sparkContext.setLogLevel("WARN")
    return spark


def main():
    spark = create_spark_session()
    bucket_name = "retailrocket-data"

    print("\n1. Lecture des données brutes depuis MinIO...")
    try:
        events_df = spark.read.csv(
            f"s3a://{bucket_name}/events.csv",
            header=True,
            inferSchema=True
        )
        print("Aperçu de la table events :")
        events_df.show(5)
    except Exception as e:
        print(f"Erreur de lecture depuis MinIO : {e}")
        spark.stop()
        return

    print("\n2. Nettoyage et Feature Engineering...")
    events_clean_df = events_df.dropna(subset=["visitorid", "itemid", "event"])

    events_scored_df = events_clean_df.withColumn(
        "score",
        when(col("event") == "view", 1)
        .when(col("event") == "addtocart", 3)
        .when(col("event") == "transaction", 5)
        .otherwise(0)
    )

    print("Données après attribution des scores :")
    events_scored_df.select("timestamp", "visitorid", "event", "itemid", "score").show(5)

    print("\n3. Création de la matrice Utilisateur x Produit...")
    user_item_matrix = events_scored_df.groupBy("visitorid", "itemid") \
                                       .agg(_sum("score").alias("final_score"))

    print("Aperçu de la matrice finale :")
    user_item_matrix.show(5)

    print("\n4. Sauvegarde sur MinIO...")
    output_path = f"s3a://{bucket_name}/processed/user_item_matrix.parquet"
    try:
        user_item_matrix.write.mode("overwrite").parquet(output_path)
        print(f"Matrice sauvegardée : {output_path}")
    except Exception as e:
        print(f"Erreur lors de la sauvegarde : {e}")

    spark.stop()


if __name__ == "__main__":
    main()
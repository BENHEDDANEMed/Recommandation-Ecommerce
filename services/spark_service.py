from pyspark.sql import SparkSession
from pyspark.ml.recommendation import ALSModel
import os

spark = None
model = None

def init_spark():
    global spark, model
    packages = (
        "org.apache.hadoop:hadoop-aws:3.3.2,"
        "com.amazonaws:aws-java-sdk-bundle:1.11.901"
    )
    spark = SparkSession.builder \
        .appName("RetailRocket_API") \
        .master("local[2]") \
        .config("spark.driver.memory", "3g") \
        .config("spark.jars.packages", packages) \
        .config("spark.hadoop.fs.s3a.endpoint", os.getenv("MINIO_ENDPOINT", "http://localhost:9000")) \
        .config("spark.hadoop.fs.s3a.access.key", "minioadmin") \
        .config("spark.hadoop.fs.s3a.secret.key", "minioadmin") \
        .config("spark.hadoop.fs.s3a.path.style.access", "true") \
        .config("spark.hadoop.fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem") \
        .config("spark.hadoop.fs.s3a.connection.ssl.enabled", "false") \
        .config("spark.hadoop.fs.s3a.aws.credentials.provider",
                "org.apache.hadoop.fs.s3a.SimpleAWSCredentialsProvider") \
        .getOrCreate()
    spark.sparkContext.setLogLevel("WARN")
    print("Chargement du modèle ALS...")
    model = ALSModel.load("s3a://retailrocket-data/models/als_model_optimized")
    print("Modèle chargé.")

from pyspark.sql.functions import explode, col

def get_recommendations(user_id):
    user_df = spark.sql(f"SELECT CAST({user_id} AS INT) AS visitorid")
    recs = model.recommendForUserSubset(user_df, 10)
    
    if recs.isEmpty():
        return []
        
    # Exploder le tableau de recommandations et extraire les champs
    recs_exploded = recs.select(explode("recommendations").alias("rec"))
    recs_final = recs_exploded.select(
        col("rec.itemid").alias("itemid"),
        col("rec.rating").alias("score")
    )
    
    # Convertir en Pandas DataFrame (évite le problème de sérialisation des objets Row)
    pdf = recs_final.toPandas()
    
    # Convertir en liste de dictionnaires Python purs
    result = []
    for _, row in pdf.iterrows():
        result.append({
            "itemid": int(row["itemid"]),
            "score": round(float(row["score"]), 4)
        })
        
    return result

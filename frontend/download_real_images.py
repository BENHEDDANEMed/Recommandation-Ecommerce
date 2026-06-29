import os
import requests
import time

CATEGORIES = {
    'Appareil': 'appliance,product',
    'Baskets': 'sneakers,shoes,product',
    'Casque': 'headphones,product',
    'Clavier': 'keyboard,product',
    'Drone': 'drone,product',
    'Enceinte': 'speaker,audio,product',
    'Lunettes': 'glasses,product',
    'Montre': 'watch,product',
    'Sac': 'bag,handbag,product',
    'Souris': 'computermouse,product'
}

OUTPUT_DIR = "public/products"

def download_images():
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)

    # First, clean existing images to avoid clutter
    print("Nettoyage de l'existant...")
    for file in os.listdir(OUTPUT_DIR):
        if file.endswith('.png') or file.endswith('.jpg'):
            try:
                os.remove(os.path.join(OUTPUT_DIR, file))
            except Exception as e:
                pass

    print("Téléchargement des nouvelles images (8 par catégorie)...")
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }

    for cat_name, keywords in CATEGORIES.items():
        prefix = cat_name.lower()
        print(f"--- Catégorie: {cat_name} ---")
        for i in range(8): # 8 variations
            filename = f"{prefix}_{i}.jpg"
            filepath = os.path.join(OUTPUT_DIR, filename)
            
            # Using lock to ensure consistent results per index
            url = f"https://loremflickr.com/500/500/{keywords}?lock={i + 100}"
            
            success = False
            for attempt in range(3):
                try:
                    response = requests.get(url, headers=headers, timeout=10)
                    if response.status_code == 200:
                        with open(filepath, 'wb') as f:
                            f.write(response.content)
                        print(f"OK: {filename} telecharge.")
                        success = True
                        break
                except Exception as e:
                    print(f"Erreur pour {filename}: {e}")
                time.sleep(1)
            
            if not success:
                print(f"ECHEC: echec de telechargement pour {filename}")
            
            time.sleep(0.5) # avoid overwhelming the API

if __name__ == "__main__":
    download_images()
    print("Terminé !")

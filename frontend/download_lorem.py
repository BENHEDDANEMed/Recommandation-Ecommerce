import os
import urllib.request

target_dir = os.path.join("public", "products")
os.makedirs(target_dir, exist_ok=True)

downloads = [
    ("baskets_2.png", "sneakers", 1),
    ("casque_0.png", "headphones", 1),
    ("casque_1.png", "headphones", 2),
    ("casque_2.png", "headphones", 3),
    ("clavier_0.png", "keyboard", 1),
    ("clavier_1.png", "keyboard", 2),
    ("clavier_2.png", "keyboard", 3),
    ("drone_0.png", "drone", 1),
    ("drone_1.png", "drone", 2),
    ("drone_2.png", "drone", 3),
    ("enceinte_0.png", "speaker", 1),
    ("enceinte_1.png", "speaker", 2),
    ("enceinte_2.png", "speaker", 3),
    ("lunettes_0.png", "sunglasses", 1),
    ("lunettes_1.png", "sunglasses", 2),
    ("lunettes_2.png", "sunglasses", 3),
    ("montre_0.png", "smartwatch", 1),
    ("montre_1.png", "smartwatch", 2),
    ("montre_2.png", "smartwatch", 3),
    ("sac_0.png", "backpack", 1),
    ("sac_1.png", "backpack", 2),
    ("sac_2.png", "backpack", 3),
    ("souris_0.png", "computer,mouse", 1),
    ("souris_1.png", "computer,mouse", 2),
    ("souris_2.png", "computer,mouse", 3),
]

for filename, keyword, lock in downloads:
    url = f"https://loremflickr.com/400/400/{keyword}?lock={lock}"
    path = os.path.join(target_dir, filename)
    print(f"Downloading {filename} from {url}...")
    try:
        urllib.request.urlretrieve(url, path)
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

print("Done downloading fallback images.")

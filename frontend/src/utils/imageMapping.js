export const categoryImages = {
  "appareil": [
    "appareil0.png",
    "appareil1.jpg",
    "appareil2.jpg",
    "appareil3.jpg",
    "appareil4.jpg",
    "appareil5.png",
    "appareil6.jpg",
    "appareil7.png"
  ],
  "baskets": [
    "baskets0.jpg",
    "baskets1.jpg",
    "baskets2.png",
    "baskets3.png",
    "baskets4.jpg",
    "baskets5.avif",
    "baskets6.png",
    "baskets7.jpg"
  ],
  "casque": [
    "casque0.jpg",
    "casque1.png",
    "casque2.png",
    "casque3.png",
    "casque4.png",
    "casque5.png",
    "casque6.png",
    "casque7.jpg"
  ],
  "clavier": [
    "clavier1.png",
    "clavier2.png",
    "clavier3.jpg",
    "clavier4.png",
    "clavier5.png",
    "clavier6.png",
    "clavier7.jpg",
    "clavvier0.jpg"
  ],
  "drone": [
    "drone0.png",
    "drone1.png",
    "drone2.png",
    "drone3.png",
    "drone4.png",
    "drone6.png"
  ],
  "enceinte": [
    "enceinte0.png",
    "enceinte1.png",
    "enceinte2.jpg",
    "enceinte3.jpg",
    "enceinte4.jpg",
    "enceinte5.jpg",
    "enceinte6.png",
    "enceinte7.jpg"
  ],
  "lunettes": [
    "lunettes0.jpg",
    "lunettes1.png",
    "lunettes2.jpg",
    "lunettes3.jpg",
    "lunettes4.avif",
    "lunettes5.png",
    "lunettes6.png",
    "lunettes7.png"
  ],
  "montre": [
    "montre0.jpg",
    "montre1.png",
    "montre2.png",
    "montre3.jpg",
    "montre4.jpg",
    "montre5.png",
    "montre7.jpg"
  ],
  "sac": [
    "sac0.png",
    "sac1.png",
    "sac2.png",
    "sac3.png",
    "sac4.jpg",
    "sac5.jpg",
    "sac6.jpg"
  ],
  "souris": [
    "souris0.png",
    "souris1.png",
    "souris2.png",
    "souris3.png",
    "souris4.png",
    "souris5.png",
    "souris6.png",
    "souris7.png"
  ]
};

export function getProductImage(category, itemid) {
  const cat = category ? category.toLowerCase().split(' ')[0] : 'default';
  const images = categoryImages[cat] || categoryImages['appareil']; // fallback to appareil
  if (!images || images.length === 0) return '/tsawa/fallback.jpg';
  const index = Number(itemid || 0) % images.length;
  return `/tsawa/${images[index]}`;
}

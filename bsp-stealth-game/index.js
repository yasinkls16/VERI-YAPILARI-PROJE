const aStar = require('./src/AStar');

// 5x5 Test Haritası
// 0: Geçilebilir Yol, 1: Duvar (Engel)
const grid = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0]
];

/* Görselleştirilmiş Hali (S: Başlangıç, H: Hedef, #: Duvar, . : Yol)
  [S] [.] [.] [.] [.]
  [.] [#] [#] [#] [.]
  [.] [.] [.] [#] [.]
  [.] [#] [.] [.] [.]
  [.] [.] [.] [#] [H]
*/

// Başlangıç ve Hedef Koordinatları [satır, sütun]
const startCoords = [0, 0];
const targetCoords = [4, 4];

console.log("=========================================");
console.log("A* PATHFINDING ALGORİTMASI TESTİ");
console.log("=========================================\n");

console.log(`Harita Boyutu: ${grid.length}x${grid[0].length}`);
console.log(`Başlangıç Noktası: [${startCoords}]`);
console.log(`Hedef Nokta: [${targetCoords}]\n`);

console.log("Yol hesaplanıyor...\n");

// Algoritmayı çalıştır
const path = aStar(grid, startCoords, targetCoords);

if (path.length > 0) {
    console.log("✅ HEDEFE GİDEN YOL BULUNDU!\n");
    console.log(`Toplam Adım Sayısı: ${path.length - 1}\n`);
    
    // Yolu okunaklı bir formatta terminale yazdır
    const pathString = path.map(p => `[${p[0]},${p[1]}]`).join(" -> ");
    console.log("İzlenen Rota:");
    console.log(pathString);
} else {
    console.log("❌ HEDEFE ULAŞAN BİR YOL BULUNAMADI!");
    console.log("Hedefin etrafı duvarlarla kapalı olabilir.");
}
console.log("\n=========================================");
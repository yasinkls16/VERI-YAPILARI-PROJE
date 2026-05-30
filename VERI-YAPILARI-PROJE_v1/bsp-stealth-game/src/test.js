// test.js

console.log("Ana İş Parçacığı: Başlatılıyor...");

// 1. Web Worker'ı (Çırağı) Başlat
// Dosya yolunun doğruluğundan emin ol (örn: 'src/astarWorker.js')
const aiWorker = new Worker('astarWorker.js');

// Worker hatalarını izlemek için güvenlik ağı
aiWorker.onerror = function(error) {
    console.error("🚨 Worker Hatası: ", error.message, " Satır:", error.lineno);
};

// 2. Örnek Harita Verisi (Grid)
const grid = [
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0]
];

// 3. OPTİMİZASYON: Yürünebilir Hücreleri (0) Ön Belleğe Al
// Bu liste, do-while döngüsü kullanmadan saniyeler içinde güvenli rastgele hedef seçmemizi sağlar.
const walkableCells = [];
for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[0].length; y++) {
        if (grid[x][y] === 0) {
            walkableCells.push([x, y]);
        }
    }
}
console.log(`Ana İş Parçacığı: ${walkableCells.length} adet yürünebilir hücre kaydedildi.`);

// 4. Worker'dan Gelen Mesajları Dinle
aiWorker.onmessage = function(event) {
    const { enemyId, path } = event.data;
    
    if (path && path.length > 0) {
        console.log(`✅ [Düşman ${enemyId}] Rota Bulundu! Adım Sayısı: ${path.length - 1}`);
        console.log("İzlenecek Yol:", path.map(p => `[${p[0]},${p[1]}]`).join(" -> "));
    } else {
        console.log(`❌ [Düşman ${enemyId}] Hedefe ulaşılamadı veya yol yok.`);
    }
};

// 5. İLETİŞİM PROTOKOLÜ (Mesajlaşma)

// A. Graf Kurulumu (init): Haritayı sadece BİR KEZ gönderiyoruz.
// Worker bu mesajı alınca hafızasında Graph yapısını kuracak.
aiWorker.postMessage({
    type: 'init',
    data: { grid: grid }
});

// B. Rota İsteği (path): İhtiyaç duyuldukça sadece koordinatları gönderiyoruz.
function requestPath(id, start, target) {
    aiWorker.postMessage({
        type: 'path',
        data: {
            id: id,
            startCoords: start,
            targetCoords: target
        }
    });
}

// TEST: Düşman 1 için [0,0]'dan [4,4]'e rota iste
console.log("Ana İş Parçacığı: Rota isteği gönderiliyor...");
requestPath(1, [0, 0], [4, 4]);

// TEST: Rastgele bir hedef seçip oraya rota iste (Dizi üzerinden güvenli seçim)
const randomIndex = Math.floor(Math.random() * walkableCells.length);
const randomTarget = walkableCells[randomIndex];
console.log(`Ana İş Parçacığı: Rastgele hedef seçildi: [${randomTarget}]`);
requestPath(2, [0, 0], randomTarget);
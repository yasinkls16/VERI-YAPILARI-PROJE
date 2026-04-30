// Duvarları (Çizgi Segmentlerini) temsil eden sınıf
class Wall {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }
}

// BSP Ağacı Düğümü (Node) Sınıfı
class BSPNode {
    constructor(walls) {
        this.partitionLine = null; // Uzayı bölen referans çizgi (düzlem)
        this.front = null;         // Çizginin ön tarafında kalanlar (sol çocuk)
        this.back = null;          // Çizginin arka tarafında kalanlar (sağ çocuk)
        this.walls = [];           // Bu düğüme düşen / bölen çizgiyle doğrudaş olan duvarlar

        this.buildTree(walls);
    }

    // Ağacı bölerek inşa eden ana fonksiyon (Rekürsif)
    buildTree(walls) {
        // Durdurma Koşulu 1: Eğer duvar yoksa çık.
        if (!walls || walls.length === 0) return;

        // Durdurma Koşulu 2 (ISSUE #2 ÇÖZÜMÜ):
        // Eğer geriye kalan tüm duvarlar paralelse/doğrudaşsa sonsuz döngüyü engelle.
        if (this.areAllWallsCollinear(walls)) {
            this.walls = walls;
            return;
        }

        // Bir bölme çizgisi seç (Şimdilik ilk duvarı seçiyoruz)
        this.partitionLine = walls[0];
        this.walls.push(this.partitionLine);

        const frontWalls = [];
        const backWalls = [];

        // Diğer duvarları bu çizgiye göre "Ön" veya "Arka" olarak ayır
        // (İlerleyen fazlarda Raycasting matematik formülleri buraya eklenecek)
        for (let i = 1; i < walls.length; i++) {
            // Şimdilik örnek bir dağıtım yapıyoruz
            if (Math.random() > 0.5) {
                frontWalls.push(walls[i]);
            } else {
                backWalls.push(walls[i]);
            }
        }

        // Alt ağaçları oluştur
        if (frontWalls.length > 0) {
            this.front = new BSPNode(frontWalls);
        }
        if (backWalls.length > 0) {
            this.back = new BSPNode(backWalls);
        }
    }

    // Sonsuz döngü kontrolü için yardımcı fonksiyon
    areAllWallsCollinear(walls) {
        if (walls.length <= 1) return true;
        // İleride matematiksel paralellik hesabı eklenecek
        return false; 
    }

    // YENİ EKLENEN KISIM: Diğer modüllerin (Raycasting ve Çarpışma) çağıracağı ana sorgu fonksiyonu
    getRelevantWalls(targetX, targetY) {
        let localWalls = [];
        
        // 1. Kendi düğümümdeki duvarları ekle
        localWalls.push(...this.walls);

        // 2. Hedefin koordinatlarına göre ağaçta gezin (Şimdilik tüm ağacı geziyoruz)
        if (this.front) {
            localWalls.push(...this.front.getRelevantWalls(targetX, targetY));
        }
        if (this.back) {
            localWalls.push(...this.back.getRelevantWalls(targetX, targetY));
        }

        return localWalls;
    }

    // YENİ EKLENEN KISIM: Matematiksel bölme işlemi için yardımcı fonksiyon (Faz 2)
    getWallSide(partitionLine, checkWall) {
        // İleride burada Vektörel Çarpım (Cross Product) formülleri kullanılacak.
        return "UNKNOWN"; 
    }
} // <-- BSPNode Sınıfının Kapanışı

// Test için ana çalışma bloğu
console.log("BSP Ağacı başlatılıyor...");
const ornekDuvarlar = [
    new Wall(0, 0, 10, 0),
    new Wall(0, 0, 0, 10),
    new Wall(10, 0, 10, 10)
];
const rootNode = new BSPNode(ornekDuvarlar);
console.log("BSP Ağacı başarıyla oluşturuldu. İletişim fonksiyonları eklendi.");
// BspTree.js - Final Versiyon
class Wall {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1; this.y1 = y1;
        this.x2 = x2; this.y2 = y2;
    }
}

class BSPNode {
    constructor(walls) {
        this.partitionLine = null;
        this.front = null;
        this.back = null;
        this.walls = []; // Bu düzlemdeki (kolineer) duvarlar

        this.buildTree(walls);
    }

    buildTree(walls) {
        if (!walls || walls.length === 0) return;

        // Her zaman dizideki ilk duvarı referans düzlemi (partition line) olarak alıyoruz
        this.partitionLine = walls[0];
        this.walls.push(this.partitionLine);

        let frontWalls = [];
        let backWalls = [];

        // Diğer tüm duvarları bu referans çizgisine göre test et
        for (let i = 1; i < walls.length; i++) {
            let wall = walls[i];
            let side = this.classifyWall(this.partitionLine, wall);

            if (side === "FRONT") {
                frontWalls.push(wall);
            } else if (side === "BACK") {
                backWalls.push(wall);
            } else if (side === "COLLINEAR") {
                this.walls.push(wall);
            } else if (side === "SPANNING") {
                // EĞER DUVAR DÜZLEMİ KESİYORSA: Kesişim noktasını bul ve duvarı ikiye böl!
                let intersection = this.getIntersection(this.partitionLine, wall);
                if (intersection) {
                    let part1 = new Wall(wall.x1, wall.y1, intersection.x, intersection.y);
                    let part2 = new Wall(intersection.x, intersection.y, wall.x2, wall.y2);
                    
                    // Parçaların merkez noktalarını test ederek hangi tarafa düştüklerini bul
                    let midX1 = part1.x1 + (part1.x2 - part1.x1) / 2;
                    let midY1 = part1.y1 + (part1.y2 - part1.y1) / 2;
                    
                    if (this.classifyPoint(this.partitionLine, midX1, midY1) === "FRONT") {
                        frontWalls.push(part1);
                        backWalls.push(part2);
                    } else {
                        backWalls.push(part1);
                        frontWalls.push(part2);
                    }
                }
            }
        }

        // Alt ağaçları rekürsif olarak inşa et
        if (frontWalls.length > 0) this.front = new BSPNode(frontWalls);
        if (backWalls.length > 0) this.back = new BSPNode(backWalls);
    }

    // Matematiksel Konum Bulma: Vektörel Çarpım (Cross Product)
    classifyPoint(line, x, y) {
        let dx = line.x2 - line.x1;
        let dy = line.y2 - line.y1;
        let cp = (dx * (y - line.y1)) - (dy * (x - line.x1));
        
        if (cp > 0.001) return "FRONT";
        if (cp < -0.001) return "BACK";
        return "COLLINEAR";
    }

    // Bir duvarın tamamının hangi tarafta kaldığını belirler
    classifyWall(line, wall) {
        let side1 = this.classifyPoint(line, wall.x1, wall.y1);
        let side2 = this.classifyPoint(line, wall.x2, wall.y2);

        if (side1 === "COLLINEAR" && side2 === "COLLINEAR") return "COLLINEAR";
        if (side1 === "FRONT" && side2 === "FRONT") return "FRONT";
        if (side1 === "BACK" && side2 === "BACK") return "BACK";
        
        if ((side1 === "FRONT" || side2 === "FRONT") && (side1 === "BACK" || side2 === "BACK")) {
            return "SPANNING"; // Duvar referans çizgisini kesiyor
        }
        
        if (side1 === "FRONT" || side2 === "FRONT") return "FRONT";
        return "BACK";
    }

    // İki çizgi segmentinin kesişim noktasını hesaplar
    getIntersection(line1, line2) {
        let x1 = line1.x1, y1 = line1.y1, x2 = line1.x2, y2 = line1.y2;
        let x3 = line2.x1, y3 = line2.y1, x4 = line2.x2, y4 = line2.y2;

        let den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den === 0) return null; // Doğrular paralel

        let t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        return {
            x: x1 + t * (x2 - x1),
            y: y1 + t * (y2 - y1)
        };
    }

    // === DİĞER MODÜLLER (RAYCASTING & A*) İÇİN ANA SORGULAMA FONKSİYONU ===
    getRelevantWalls(targetX, targetY) {
        let localWalls = [];
        let side = this.classifyPoint(this.partitionLine, targetX, targetY);

        // OPTİMİZASYON: Hedef hangi taraftaysa ÖNCE o tarafın alt ağacını ara
        if (side === "FRONT" || side === "COLLINEAR") {
            if (this.front) localWalls.push(...this.front.getRelevantWalls(targetX, targetY));
            localWalls.push(...this.walls);
            if (this.back) localWalls.push(...this.back.getRelevantWalls(targetX, targetY));
        } else {
            if (this.back) localWalls.push(...this.back.getRelevantWalls(targetX, targetY));
            localWalls.push(...this.walls);
            if (this.front) localWalls.push(...this.front.getRelevantWalls(targetX, targetY));
        }

        return localWalls;
    }
}

// Proje İsteri B.3 - İsimlendirme Şartı
function getDeveloperInfo() {
    return "suha_tufekci"; 
}

// Modülü dışa aktar (Diğer ekip arkadaşların kullanabilsin diye)
module.exports = { Wall, BSPNode, getDeveloperInfo };
// Modülü dışa aktar (Diğer ekip arkadaşların kullanabilsin diye)
module.exports = { Wall, BSPNode };

// --- KÜÇÜK BİR ÇALIŞTIRMA TESTİ ---
console.log("BSP Ağacı Final Versiyonu Başlatılıyor...");
const testWalls = [
    new Wall(0, 0, 10, 0),
    new Wall(5, -5, 5, 5), // Bu duvar ilk duvarı kesecek (SPANNING) ve ikiye bölünecek
    new Wall(0, 5, 10, 5)
];
const rootNode = new BSPNode(testWalls);
console.log("Ağaç başarıyla inşa edildi! Kesişen duvarlar bölündü.");
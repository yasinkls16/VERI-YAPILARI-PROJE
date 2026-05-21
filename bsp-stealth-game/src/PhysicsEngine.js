const CELL_SIZE = 32; 

// Projenin fiziksel nesne (Oyuncu ve Düşmanlar) temel veri sınıfı
class PhysicalEntity {
    constructor(startX, startY) {
        this.x = startX;
        this.y = startY;
        this.vx = 0; 
        this.vy = 0; 
        this.ax = 0; 
        this.ay = 0; 
        this.friction = 0.82; 
        this.maxSpeed = 4;    

        // 20x20 AABB Çarpışma Kutusu Boyutları
        this.width = 20;  
        this.height = 20; 
    }
}

// Ana fizik ve çarpışma algoritması classı
class PhysicsEngine {
    constructor() {
        // Klavye tuş takibi için dinamik girdi nesnesi
        this.keys = {
            ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false,
            w: false, s: false, a: false, d: false
        };

        this.initInputListeners();
    }

    // Tarayıcı klavye girdilerini sisteme bağlayan katman
    initInputListeners() {
        if (typeof window !== 'undefined') {
            window.addEventListener("keydown", (e) => {
                if (e.key in this.keys) this.keys[e.key] = true;
            });

            window.addEventListener("keyup", (e) => {
                if (e.key in this.keys) this.keys[e.key] = false;
            });
        }
    }

    // Piksel koordinatını Grid hücelerine (Matrise) çevirir
    pixelToGrid(pixelX, pixelY) {
        return {
            x: Math.floor(pixelX / CELL_SIZE),
            y: Math.floor(pixelY / CELL_SIZE)
        };
    }

    // Grid hücre koordinatını piksellere çevirir
    gridToPixel(gridX, gridY) {
        return {
            x: (gridX * CELL_SIZE) + (CELL_SIZE / 2),
            y: (gridY * CELL_SIZE) + (CELL_SIZE / 2)
        };
    }

    // Klavye yön tuşlarına göre karaktere fiziksel ivme kazandırır
    applyKeyboardInput(character) {
        const moveForce = 0.6; 

        if (this.keys.ArrowUp || this.keys.w) character.ay = -moveForce;
        if (this.keys.ArrowDown || this.keys.s) character.ay = moveForce;
        if (this.keys.ArrowLeft || this.keys.a) character.ax = -moveForce;
        if (this.keys.ArrowRight || this.keys.d) character.ax = moveForce;
    }

    // Karakteri hareket ettirir ve Süha'nın BSP ağacını sorgular
    // bspRootNode: Süha'nın BspTree.js'deki ana ağaç kök nesnesidir.
    updatePlayerPhysics(character, deltaTime, bspRootNode) {
        // Klavyeden gelen kuvvetleri oku ve uygula
        this.applyKeyboardInput(character);

        // ivmeyi hıza dönüştür ve sürtünme payını düş
        character.vx += character.ax * deltaTime;
        character.vy += character.ay * deltaTime;
        character.vx *= character.friction;
        character.vy *= character.friction;

        // Karakterin maksimum hız limitini aşmasını engelle
        const currentSpeed = Math.sqrt(character.vx * character.vx + character.vy * character.vy);
        if (currentSpeed > character.maxSpeed) {
            character.vx = (character.vx / currentSpeed) * character.maxSpeed;
            character.vy = (character.vy / currentSpeed) * character.maxSpeed;
        }

        // Karakterin bir sonraki karede varmak istediği "Aday" koordinatları bul
        let nextX = character.x + character.vx * deltaTime;
        let nextY = character.y + character.vy * deltaTime;

        // Süha'nın yazdığı getRelevantWalls() fonksiyonu çağrılır
        // Bu sayede tüm harita taranmaz, sadece karakterin bulunduğu bölgedeki duvarlar çekilir.
        let surroundingWalls = [];
        if (bspRootNode && typeof bspRootNode.getRelevantWalls === 'function') {
            surroundingWalls = bspRootNode.getRelevantWalls(nextX, nextY); // O(log n) Uzamsal Arama
        }

        // AABB Çarpışma Testi 
        let hasCollision = this.checkCollisionWithWalls(nextX, nextY, surroundingWalls);

        if (!hasCollision) {
            // Engel yoksa hareketi onayla
            character.x = nextX;
            character.y = nextY;
        } else {
            // Duvara çaprıtysa hızı sıfırla (Duvarın içinden geçmeyi engeller)
            character.vx = 0;
            character.vy = 0;
        }

        // Kuvvetler uygulandığı için ivmeleri sıfırla
        character.ax = 0;
        character.ay = 0;
    }

    // AABB Çarpışma Kutusu (Genişlik/Yükseklik) ile Çizgi Duvarlar Arasındaki Kesişim Matematiği
    checkCollisionWithWalls(nextX, nextY, walls = []) {
        // Karakterin merkezinden dışarı doğru 20x20'lik görünmez kutu sınırları hesaplanır
        const charLeft   = nextX - 10; // (width / 2)
        const charRight  = nextX + 10; // (width / 2)
        const charTop    = nextY - 10; // (height / 2)
        const charBottom = nextY + 10; // (height / 2)

        for (let i = 0; i < walls.length; i++) {
            const wall = walls[i];

            // Durum A: Duvar dikey bir çizgi segmenti ise
            if (wall.x1 === wall.x2) {
                const inYRange = charBottom >= Math.min(wall.y1, wall.y2) && charTop <= Math.max(wall.y1, wall.y2);
                if (inYRange && charLeft <= wall.x1 && charRight >= wall.x1) {
                    return true; // Çarpışma var!
                }
            }
            // Durum B: Duvar yatay bir çizgi segmenti ise
            else if (wall.y1 === wall.y2) {
                const inXRange = charRight >= Math.min(wall.x1, wall.x2) && charLeft <= Math.max(wall.x1, wall.x2);
                if (inXRange && charTop <= wall.y1 && charBottom >= wall.y1) {
                    return true; // Çarpışma var!
                }
            }
        }
        return false; // Çarpışma yok, geçiş serbest
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhysicsEngine, PhysicalEntity };
}
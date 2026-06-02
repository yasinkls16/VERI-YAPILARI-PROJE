const CELL_SIZE = 32; 

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

    // Piksel koordinatını Grid hücrelerine (Matrise) çevirir
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

    applyKeyboardInput(character) {
        const moveForce = 0.6; 
        let moveX = 0;
        let moveY = 0;

        // Girdi yönlerini topla
        if (this.keys.ArrowUp || this.keys.w) moveY -= 1;
        if (this.keys.ArrowDown || this.keys.s) moveY += 1;
        if (this.keys.ArrowLeft || this.keys.a) moveX -= 1;
        if (this.keys.ArrowRight || this.keys.d) moveX += 1;

        // Çapraz hareket kontrolü ve normalizasyon
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }

        // Kuvveti karakter ivmesine aktar
        character.ax = moveX * moveForce;
        character.ay = moveY * moveForce;
    }

    // Karakter fiziğini ve konumunu günceller.
    updatePlayerPhysics(character, deltaTime, bspRootNode) {
        // Klavyeden gelen kuvvetleri oku ve uygula
        this.applyKeyboardInput(character);

        // İvmeyi hıza dönüştür
        character.vx += character.ax * deltaTime;
        character.vy += character.ay * deltaTime;
        
        // Oyunun farklı FPS değerlerinde (30 FPS / 60 FPS / 144 FPS) aynı hızda yavaşlaması sağlandı.
        character.vx *= Math.pow(character.friction, deltaTime);
        character.vy *= Math.pow(character.friction, deltaTime);

        // Karakterin maksimum hız limitini aşmasını engelle
        const currentSpeed = Math.sqrt(character.vx * character.vx + character.vy * character.vy);
        if (currentSpeed > character.maxSpeed) {
            character.vx = (character.vx / currentSpeed) * character.maxSpeed;
            character.vy = (character.vy / currentSpeed) * character.maxSpeed;
        }

        // Karakterin bir sonraki karede varmak istediği "Aday" koordinatları bul
        let nextX = character.x + character.vx * deltaTime;
        let nextY = character.y + character.vy * deltaTime;

        // Uzamsal arama ile sadece karakterin etrafındaki duvarları çek
        let surroundingWalls = [];
        if (bspRootNode && typeof bspRootNode.getRelevantWalls === 'function') {
            surroundingWalls = bspRootNode.getRelevantWalls(nextX, nextY); 
        }

        // AABB Çarpışma Testi
        let hasCollision = this.checkCollisionWithWalls(nextX, nextY, surroundingWalls);

        if (!hasCollision) {
            // Engel yoksa hareketi onayla
            character.x = nextX;
            character.y = nextY;
        } else {
            character.vx = 0;
            character.vy = 0;
        }

        // Kuvvetler uygulandığı için ivmeleri sıfırla
        character.ax = 0;
        character.ay = 0;
    }

    // AABB Çarpışma Kutusu ile Çizgi Duvarlar Arasındaki Kesişim Matematiği
    checkCollisionWithWalls(nextX, nextY, walls = []) {
        // Karakterin merkezinden dışarı doğru kutu sınırları hesaplanır (width:20, height:20)
        const charLeft   = nextX - 10; 
        const charRight  = nextX + 10; 
        const charTop    = nextY - 10; 
        const charBottom = nextY + 10; 

        for (let i = 0; i < walls.length; i++) {
            const wall = walls[i];

            // Durum A: Duvar dikey bir çizgi segmenti ise
            if (wall.x1 === wall.x2) {
                const inYRange = charBottom >= Math.min(wall.y1, wall.y2) && charTop <= Math.max(wall.y1, wall.y2);
                if (inYRange && charLeft <= wall.x1 && charRight >= wall.x1) {
                    return true; // Çarpışma var
                }
            }
            // Durum B: Duvar yatay bir çizgi segmenti ise
            else if (wall.y1 === wall.y2) {
                const inXRange = charRight >= Math.min(wall.x1, wall.x2) && charLeft <= Math.max(wall.x1, wall.x2);
                if (inXRange && charTop <= wall.y1 && charBottom >= wall.y1) {
                    return true; // Çarpışma var
                }
            }
        }
        return false; // Çarpışma yok
    }
}

// Node.js ve tarayıcı ortamları için dışa aktarım uyumluluğu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PhysicsEngine, PhysicalEntity };
}
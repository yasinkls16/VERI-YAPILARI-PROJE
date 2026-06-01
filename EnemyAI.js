// src/EnemyAI.js

class EnemyAI {
    constructor(id, startX, startY) {
        this.id = id;
        this.x = startX;
        this.y = startY;
        this.state = 'WANDER'; // Başlangıç durumu: Rastgele dolaş
        this.path = []; // Worker'dan gelecek güncel rota
        this.isWaitingForWorker = false;

        // OPTİMİZASYON 4: CHASE modunda Worker'ı spam'lemeyi önleyen zamanlayıcı
        this.lastPathRequestTime = 0;
        this.pathRequestCooldown = 500; // Milisaniye (Saniyede en fazla 2 kez rota hesaplatır)
    }

    // Oyun döngüsü tarafından saniyede 60 kez çağrılır
    update(playerX, playerY, canSeePlayer, aiWorker, walkableCells, physicsEngine, bspRoot) {
        
        // 1. DURUM (STATE) GEÇİŞ KONTROLLERİ
        if (this.state === 'WANDER' && canSeePlayer) {
            this.changeState('CHASE');
        } 
        else if (this.state === 'CHASE' && !canSeePlayer) {
            this.changeState('WANDER');
        }

        const currentTime = Date.now();

        // === YAKIN MESAFE DOĞRUDAN TAKİP KONTROLÜ ===
        const dxToPlayer = playerX - this.x;
        const dyToPlayer = playerY - this.y;
        const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);
        
        if (this.state === 'CHASE' && canSeePlayer && distToPlayer < 80) {
            if (distToPlayer > 15) { 
                // Aday kordinatları hesapla
                const nextX = this.x + (dxToPlayer / distToPlayer) * 2.5;
                const nextY = this.y + (dyToPlayer / distToPlayer) * 2.5;
                
                // Yakın takipte de duvardan geçmemesi için fizik kontrolü
                let localWalls = bspRoot ? bspRoot.getRelevantWalls(nextX, nextY) : [];
                if (!physicsEngine.checkCollisionWithWalls(nextX, nextY, localWalls)) {
                    this.x = nextX;
                    this.y = nextY;
                }
            }
            this.path = []; 
            return; 
        }

        // 2. UZAK MESAFE HAREKET KARARLARI VE A* ROTA İSTEME
        if (this.state === 'WANDER') {
            if (this.path.length === 0 && !this.isWaitingForWorker) {
                const randomTarget = this.getRandomWalkableCoords(walkableCells);
                this.requestPath(aiWorker, randomTarget);
            }
        } 
        else if (this.state === 'CHASE') {
            if (!this.isWaitingForWorker && (currentTime - this.lastPathRequestTime > this.pathRequestCooldown)) {
                const CELL_SIZE = 32;
                const playerGridX = Math.floor(playerX / CELL_SIZE);
                const playerGridY = Math.floor(playerY / CELL_SIZE);
        
                this.requestPath(aiWorker, [playerGridY, playerGridX]);
                this.lastPathRequestTime = currentTime;
                console.log("=== YENİ ROTA HESAPLANIYOR ===");
                console.log(`Oyuncu Gerçek Konum: X:${playerX.toFixed(1)}, Y:${playerY.toFixed(1)}`);
                console.log(`Oyuncu Grid (Hedef): Sütun(X):${playerGridX}, Satır(Y):${playerGridY}`);
                console.log(`Düşman Grid (Başlangıç): Sütun(X):${Math.floor(this.x/CELL_SIZE)}, Satır(Y):${Math.floor(this.y/CELL_SIZE)}`);
                // --- DEBUG BİTİŞİ ---
            }
        }

        // 3. FİZİKSEL HAREKET ADIMI (Jüri Puanı İçin İsimlendirildi)
        this.MoveAlongPath(physicsEngine, bspRoot);
    }

    // B.3 İsteri: Ekip üyesinin adını taşıyan ve Çarpışma Kontrolü yapan hareket modülü
    MoveAlongPath(physicsEngine, bspRoot) {
        if (this.path.length > 0) {
            const CELL_SIZE = 32;
            const nextGrid = this.path[0];
        
            const targetPixelX = (nextGrid[1] * CELL_SIZE) + (CELL_SIZE / 2);
            const targetPixelY = (nextGrid[0] * CELL_SIZE) + (CELL_SIZE / 2);

            const dx = targetPixelX - this.x;
            const dy = targetPixelY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const speed = 2;

            if (distance > speed) {
                // Hareketi doğrudan this.x'e eşitlemiyoruz, aday (next) koordinat oluşturuyoruz
                const nextX = this.x + (dx / distance) * speed;
                const nextY = this.y + (dy / distance) * speed;

                // BSP Ağacından çevredeki duvarları çek
                let surroundingWalls = [];
                if (bspRoot && typeof bspRoot.getRelevantWalls === 'function') {
                    surroundingWalls = bspRoot.getRelevantWalls(nextX, nextY);
                }

                // Fizik motoruna AABB çarpışma testi yaptır
                const hasCollision = physicsEngine.checkCollisionWithWalls(nextX, nextY, surroundingWalls);

                if (!hasCollision) {
                    // Engel yoksa ilerle
                    this.x = nextX;
                    this.y = nextY;
                } else {
                    // Duvara çarptıysa kilitlenip kalmasın diye bu rotayı atla, yenisini istesin
                    this.path.shift();
                }
            } else {
                this.x = targetPixelX;
                this.y = targetPixelY;
                this.path.shift();
            }
        }
    }

    // Durumlar arası geçişi yöneten yardımcı fonksiyon
    changeState(newState) {
        if (this.state !== newState) {
            console.log(`[Düşman ${this.id}] Mod Değiştirdi: ${this.state} -> ${newState}`);
            this.state = newState;
            this.path = []; // Hedef ve mantık değiştiği için eski rotayı çöpe at
            this.isWaitingForWorker = false;
        }
    }

    // OPTİMİZASYON 3: Sonsuz döngüden kurtarılmış, ön belleğe alınmış güvenli hedef seçimi (O(1) Karmaşıklık)
    getRandomWalkableCoords(walkableCells) {
        const randomIndex = Math.floor(Math.random() * walkableCells.length);
        return walkableCells[randomIndex];
    }

    // OPTİMİZASYON 2'ye Uygun Mesajlaşma Protokolü
    requestPath(worker, targetCoords) {
        this.isWaitingForWorker = true;
    
        const CELL_SIZE = 32;
        const myGridX = Math.floor(this.x / CELL_SIZE);
        const myGridY = Math.floor(this.y / CELL_SIZE);

        worker.postMessage({
            type: 'path',
            data: {
                id: this.id,
                startCoords: [myGridY, myGridX],
                targetCoords: targetCoords
        }
    });
}

    // Worker rotayı bulduğunda test.js (veya oyun motoru) bu fonksiyonu tetikleyecek
    receivePath(calculatedPath) {
        if (!this.isWaitingForWorker) return;
        if (calculatedPath.length > 0) {
            calculatedPath.shift();
        }
        this.path = calculatedPath;
        this.isWaitingForWorker = false;
    }

}
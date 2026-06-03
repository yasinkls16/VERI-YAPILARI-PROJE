// src/EnemyAI.js

class EnemyAI {
    yasinconstructor(id, startX, startY) {
        this.id = id;
        this.x = startX;
        this.y = startY;
        this.state = 'WANDER'; 
        this.path = []; 
        this.isWaitingForWorker = false;
        this.lastPathRequestTime = 0;
    }

    yasinupdate(playerX, playerY, canSeePlayer, walkableCells, physicsEngine, bspRoot) {
        
        // 1. DURUM GEÇİŞLERİ (Rotayı çöpe atmayı bıraktık)
        if (this.state === 'WANDER' && canSeePlayer) {
            this.yasinchangeState('CHASE');
        } 
        else if (this.state === 'CHASE' && !canSeePlayer) {
            this.yasinchangeState('WANDER');
        }

        // === YAKIN MESAFE DOĞRUDAN TAKİP (Buraya da Wall Sliding eklendi) ===
        const dxToPlayer = playerX - this.x;
        const dyToPlayer = playerY - this.y;
        const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);
        
        if (this.state === 'CHASE' && canSeePlayer && distToPlayer < 80) {
            if (distToPlayer > 15) { 
                const nextX = this.x + (dxToPlayer / distToPlayer) * 6.5;
                const nextY = this.y + (dyToPlayer / distToPlayer) * 6.5;
                
                let localWalls = bspRoot ? bspRoot.getRelevantWalls(nextX, nextY) : [];
                
                if (!physicsEngine.checkCollisionWithWalls(nextX, nextY, localWalls)) {
                    this.x = nextX;
                    this.y = nextY;
                } else {
                    // Yakın takipte duvara çarparsa kilitlenmesin, sürtünerek kaysın
                    const canMoveX = !physicsEngine.checkCollisionWithWalls(nextX, this.y, localWalls);
                    const canMoveY = !physicsEngine.checkCollisionWithWalls(this.x, nextY, localWalls);
                    if (canMoveX) this.x = nextX;
                    else if (canMoveY) this.y = nextY;
                }
            }
            return; 
        }

        // 2. UZAK MESAFE ROTA İSTEME
        if (this.state === 'WANDER') {
            if (this.path.length === 0 && !this.isWaitingForWorker) {
                const randomTarget = this.yasingetRandomWalkableCoords(walkableCells);
                this.yasinrequestPath(randomTarget);
            }
        } 
        else if (this.state === 'CHASE') {
            const currentTime = Date.now();
            if (!this.isWaitingForWorker && (currentTime - this.lastPathRequestTime > 500)) {
                const CELL_SIZE = 32;
                const playerGridX = Math.floor(playerX / CELL_SIZE);
                const playerGridY = Math.floor(playerY / CELL_SIZE);
        
                this.yasinrequestPath([playerGridY, playerGridX]);
            }
        }

        // 3. FİZİKSEL HAREKET
        this.yasinMoveAlongPath(physicsEngine, bspRoot);
    }

    yasinMoveAlongPath(physicsEngine, bspRoot) {
        if (this.path.length > 0) {
            const CELL_SIZE = 32;
            const nextGrid = this.path[0];
        
            const targetPixelX = (nextGrid[1] * CELL_SIZE) + (CELL_SIZE / 2);
            const targetPixelY = (nextGrid[0] * CELL_SIZE) + (CELL_SIZE / 2);

            const dx = targetPixelX - this.x;
            const dy = targetPixelY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const speed = 7.5;
            const WAYPOINT_TOLERANCE = 12; // GÜNCELLEME: Hücrenin merkezine 12 piksel yaklaştığında hedefe varmış say!

            if (distance > WAYPOINT_TOLERANCE) {
                const nextX = this.x + (dx / distance) * speed;
                const nextY = this.y + (dy / distance) * speed;

                let surroundingWalls = [];
                if (bspRoot && typeof bspRoot.getRelevantWalls === 'function') {
                    surroundingWalls = bspRoot.getRelevantWalls(nextX, nextY);
                }

                const hasCollision = physicsEngine.checkCollisionWithWalls(nextX, nextY, surroundingWalls);

                if (!hasCollision) {
                    this.x = nextX;
                    this.y = nextY;
                } else {
                    const canMoveX = !physicsEngine.checkCollisionWithWalls(nextX, this.y, surroundingWalls);
                    const canMoveY = !physicsEngine.checkCollisionWithWalls(this.x, nextY, surroundingWalls);
                    
                    if (canMoveX) {
                        this.x = nextX;
                    } else if (canMoveY) {
                        this.y = nextY;
                    } else {
                        // Eğer iki yöne de gidemiyorsa tam köşeye sıkışmıştır, bu hedefi iptal et diğerine geç
                        this.path.shift();
                    }
                }
            } else {
                // Merkez noktasına yeterince yaklaştıysa sıradaki koordinata geç
                this.path.shift();
            }
        }
    }

    yasinchangeState(newState) {
        if (this.state !== newState) {
            console.log(`[Düşman ${this.id}] Mod Değiştirdi: ${this.state} -> ${newState}`);
            this.state = newState;
            // GÜNCELLEME: Mod değiştiğinde "this.path = []" yapıp rotayı silmesini engelledik ki titremesin.
        }
    }

    yasingetRandomWalkableCoords(walkableCells) {
        const randomIndex = Math.floor(Math.random() * walkableCells.length);
        return walkableCells[randomIndex];
    }

    yasinrequestPath(targetCoords) {
        const currentTime = Date.now();
        if (currentTime - this.lastPathRequestTime < 500) return;
        
        this.lastPathRequestTime = currentTime;
        this.isWaitingForWorker = true;
    
        const CELL_SIZE = 32;
        const myGridX = Math.floor(this.x / CELL_SIZE);
        const myGridY = Math.floor(this.y / CELL_SIZE);

        const apiBase = (window.location.port === "8000" || window.location.port === "" || window.location.port === "80") 
            ? "" 
            : "http://localhost:8000";

        fetch(`${apiBase}/calculate-path`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                id: this.id,
                startCoords: [myGridY, myGridX],
                targetCoords: targetCoords,
                grid: gameGrid 
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data && data.path) {
                console.log(`[Düşman ${this.id}] Python Rota Haritası:`, data.path);
                this.yasinreceivePath(data.path);
            } else {
                this.isWaitingForWorker = false;
            }
        })
        .catch(error => {
            console.error("AI Servisi ile iletişim kurulamadı:", error);
            this.isWaitingForWorker = false;
        });
    }

    yasinreceivePath(calculatedPath) {
        if (!this.isWaitingForWorker) return;
        if (calculatedPath.length > 0) {
            calculatedPath.shift();
        }
        this.path = calculatedPath;
        this.isWaitingForWorker = false;
    }
}
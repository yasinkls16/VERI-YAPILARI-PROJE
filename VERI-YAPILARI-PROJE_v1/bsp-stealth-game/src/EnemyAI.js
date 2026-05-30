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

    // Oyun döngüsü (requestAnimationFrame) tarafından saniyede 60 kez çağrılacak
    update(playerX, playerY, canSeePlayer, aiWorker, walkableCells) {
        
        // 1. DURUM (STATE) GEÇİŞ KONTROLLERİ
        if (this.state === 'WANDER' && canSeePlayer) {
            this.changeState('CHASE');
        } 
        else if (this.state === 'CHASE' && !canSeePlayer) {
            this.changeState('WANDER');
        }

        const currentTime = Date.now();

        // 2. HAREKET KARARLARI VE ROTA İSTEME
        if (this.state === 'WANDER') {
            // Elinde rota yoksa ve Worker'dan da cevap beklemiyorsa, kendine yeni bir hedef bul
            if (this.path.length === 0 && !this.isWaitingForWorker) {
                const randomTarget = this.getRandomWalkableCoords(walkableCells);
                this.requestPath(aiWorker, randomTarget);
            }
        } 
        else if (this.state === 'CHASE') {
            if (!this.isWaitingForWorker && (currentTime - this.lastPathRequestTime > this.pathRequestCooldown)) {
                // Pikselleri A* için Grid hücelerine çeviriyoruz
                const CELL_SIZE = 32;
                const playerGridX = Math.floor(playerX / CELL_SIZE);
                const playerGridY = Math.floor(playerY / CELL_SIZE);
        
                this.requestPath(aiWorker, [playerGridX, playerGridY]);
                this.lastPathRequestTime = currentTime;
    }
}

        // 3. FİZİKSEL HAREKET ADIMI
        this.moveAlongPath();
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
                startCoords: [myGridX, myGridY],
                targetCoords: targetCoords
        }
    });
}

    // Worker rotayı bulduğunda test.js (veya oyun motoru) bu fonksiyonu tetikleyecek
    receivePath(calculatedPath) {
        this.path = calculatedPath;
        this.isWaitingForWorker = false;
    }

    // 4. Kişinin kullanacağı rotada ilerleme mantığı
    moveAlongPath() {
        if (this.path.length > 0) {
            const CELL_SIZE = 32;
            const nextGrid = this.path[0];
        
            // Gitmek istediğimiz grid hücesinin merkez piksel koordinatları
            const targetPixelX = (nextGrid[0] * CELL_SIZE) + (CELL_SIZE / 2);
            const targetPixelY = (nextGrid[1] * CELL_SIZE) + (CELL_SIZE / 2);

            // Hedef piksele olan mesafe hesaplaması
            const dx = targetPixelX - this.x;
            const dy = targetPixelY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            const speed = 2; // Düşmanın kare başına ilerleme hızı (piksel)

            if (distance > speed) {
                // Henüz hücre merkezine varmadık, o yöne doğru ilerle
                this.x += (dx / distance) * speed;
                this.y += (dy / distance) * speed;
            } else {
                // Hücre merkezine ulaştık, konumu tam eşitle ve listeden bu adımı temizle
                this.x = targetPixelX;
                this.y = targetPixelY;
                this.path.shift();
        }
    }
}
}
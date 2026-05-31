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
    update(playerX, playerY, canSeePlayer, aiWorker, walkableCells) {
        
        // 1. DURUM (STATE) GEÇİŞ KONTROLLERİ
        if (this.state === 'WANDER' && canSeePlayer) {
            this.changeState('CHASE');
        } 
        else if (this.state === 'CHASE' && !canSeePlayer) {
            this.changeState('WANDER');
        }

        const currentTime = Date.now();

        // === YENİ EKLENEN KISIM: YAKIN MESAFE DOĞRUDAN TAKİP (AVLANMA) ===
        const dxToPlayer = playerX - this.x;
        const dyToPlayer = playerY - this.y;
        const distToPlayer = Math.sqrt(dxToPlayer * dxToPlayer + dyToPlayer * dyToPlayer);
        
        if (this.state === 'CHASE' && canSeePlayer && distToPlayer < 80) {
            // Eğer oyuncuya çok yakınsak, A* ızgaralarını unut, doğrudan hedefe koş!
            if (distToPlayer > 15) { // İçinden geçmemesi için 15 piksel mesafe bırakır
                this.x += (dxToPlayer / distToPlayer) * 2.5; // Biraz daha hızlı atılır
                this.y += (dyToPlayer / distToPlayer) * 2.5;
            }
            this.path = []; // Arkada kalan eski A* rotasını temizle
            return; // Fonksiyonu burada bitir, aşağıdaki matris hareketine girme
        }
        // =================================================================

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
        
                // Grid [Y, X] olarak gönderilir
                this.requestPath(aiWorker, [playerGridY, playerGridX]);
                this.lastPathRequestTime = currentTime;
            }
        }

        // 3. FİZİKSEL HAREKET ADIMI (A* ROTASINDA)
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
                startCoords: [myGridY, myGridX],
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
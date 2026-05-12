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
            // Takipteyse oyuncunun GÜNCEL konumuna rota iste, 
            // AMA Worker'ı boğmamak için Cooldown (bekleme) süresinin dolduğundan emin ol!
            if (!this.isWaitingForWorker && (currentTime - this.lastPathRequestTime > this.pathRequestCooldown)) {
                this.requestPath(aiWorker, [playerX, playerY]);
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
        
        // Artık haritayı (grid) göndermiyoruz, çünkü Worker oyun başında haritayı ezberledi
        worker.postMessage({
            type: 'path',
            data: {
                id: this.id,
                startCoords: [Math.floor(this.x), Math.floor(this.y)],
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
            // Rotadaki ilk adımı al
            const nextStep = this.path[0];
            
            // Not: Gerçek canvas oyununda burası x ve y'yi yavaşça artırma/azaltma (interpolation) 
            // işlemi olacaktır. Şimdilik mantığı kurmak için doğrudan o kareye atıyoruz.
            this.x = nextStep[0];
            this.y = nextStep[1];

            // O adıma vardığımız için rotadan o adımı sil
            this.path.shift();
        }
    }
}
const canvas = document.getElementById("gameCanvas") || { width: 512, height: 512 };
const ctx = canvas.getContext ? canvas.getContext("2d") : null;

const physicsEngine = new PhysicsEngine();
const player = new Player(64, 64); // Başlangıç pikselsel koordinatları

let bspRootNode = window.bspRoot || null; 

let lastTime = 0;

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
        requestAnimationFrame(gameLoop);
        return;
    }

    let elapsed = timestamp - lastTime;

    if (elapsed > 100) {
        lastTime = timestamp;
        requestAnimationFrame(gameLoop);
        return;
    }

    let deltaTime = elapsed / 16.66; 
    lastTime = timestamp;

    // Klavyeyi okuyan, hız ve sürtünme uygulayan tek merkez
    physicsEngine.updatePlayerPhysics(player, deltaTime, bspRootNode);
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. Haritayı ve Duvarları Çiz (Görsel entegrasyon)
        if (window.drawMap) {
            window.drawMap(ctx);
        }

        // 2. Oyuncuyu Ekrana Çiz (Sadece saf çizim yetkisi)
        player.draw(ctx);
    }

    // Döngünün devam etmesini sağla
    requestAnimationFrame(gameLoop);
}

// Oyun döngüsünü ilk kez ateşle
if (typeof window !== 'undefined') {
    window.addEventListener("load", () => {
        requestAnimationFrame(gameLoop);
    });
}

// Node.js test ortamları için dışa aktarım
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { gameLoop, player, physicsEngine };
}
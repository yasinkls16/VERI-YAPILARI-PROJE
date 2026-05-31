// game.js - Final Entegrasyon Dosyası

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ==========================================
// 1. GRID HARİTASI VE DUVAR SEGMENTLERİ TANIMI
// ==========================================
// CELL_SIZE = 32 piksel. 25 kolon, 19 satır harita.
// 0: Yürünebilir Alan, 1: Duvar (A* için)
const gameGrid = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,0,0,0,0,0,1,0,0,0,1,1,1,1,1,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,1,1,1,1,1,0,0,0,0,0,1,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,1],
    [1,1,1,1,1,1,0,0,0,0,1,1,1,1,1,1,1,1,0,0,1,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,1,1,1,1,1,1,0,0,1,1,1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1,0,1],
    [1,0,1,1,1,1,1,1,0,0,0,1,0,0,1,0,0,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,1,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// O(1) rastgele hedef seçimi için yürünebilir boş hücrelerin listesini çıkarıyoruz
const walkableCells = [];
for (let r = 0; r < gameGrid.length; r++) {
    for (let c = 0; c < gameGrid[0].length; c++) {
        if (gameGrid[r][c] === 0) {
            walkableCells.push([r, c]); // [satır, sütun] -> [GridY, GridX]
        }
    }
}

// Süha'nın BSP Ağacı için çizgi tabanlı dikey ve yatay duvar nesnelerini matristen üretiyoruz
const mapWalls = [];
for (let r = 0; r < gameGrid.length; r++) {
    for (let c = 0; c < gameGrid[0].length; c++) {
        if (gameGrid[r][c] === 1) {
            let x = c * CELL_SIZE;
            let y = r * CELL_SIZE;
            // Üst kenar duvarı
            if (r === 0 || gameGrid[r-1][c] === 0) mapWalls.push(new Wall(x, y, x + CELL_SIZE, y));
            // Sol kenar duvarı
            if (c === 0 || gameGrid[r][c-1] === 0) mapWalls.push(new Wall(x, y, x, y + CELL_SIZE));
            // Sağ kenar duvarı
            if (c === gameGrid[0].length-1 || gameGrid[r][c+1] === 0) mapWalls.push(new Wall(x + CELL_SIZE, y, x + CELL_SIZE, y + CELL_SIZE));
            // Alt kenar duvarı
            if (r === gameGrid.length-1 || gameGrid[r+1][c] === 0) mapWalls.push(new Wall(x, y + CELL_SIZE, x + CELL_SIZE, y + CELL_SIZE));
        }
    }
}

// ==========================================
// 2. MOTORLARIN VE NESNELERİN BAŞLATILMASI
// ==========================================
const bspRoot = new BSPNode(mapWalls);
const visionSystem = new VisionSystem(bspRoot);
const physicsEngine = new PhysicsEngine();

// Fizik motoruna uyumlu karakter nesnesi (PhysicalEntity)
const pEntity = new PhysicalEntity(45, 45); 
const enemy = new EnemyAI(1, 400, 300);

// OYUN DURUMU VE UI KONTROLLERİ
let gameState = "START"; // "START", "PLAYING", "GAMEOVER", "WIN"

const uiMenu = document.getElementById("uiMenu");
const menuTitle = document.getElementById("menuTitle");
const actionBtn = document.getElementById("actionBtn");

// Yeşil Zafer Alanı (Sağ alt köşeye yakın bir nokta: Satır 17, Sütun 23)
const winZone = {
    x: 23 * CELL_SIZE, 
    y: 17 * CELL_SIZE, 
    width: CELL_SIZE,
    height: CELL_SIZE
};

// Butona tıklandığında oyunu başlat veya sıfırla
actionBtn.addEventListener("click", () => {
    resetGame();
    gameState = "PLAYING";
    uiMenu.style.display = "none"; // Menüyü gizle
});

// Oyunu başlangıç ayarlarına döndüren fonksiyon
function resetGame() {
    // Oyuncuyu başlangıç pozisyonuna al
    pEntity.x = 45;
    pEntity.y = 45;
    pEntity.vx = 0;
    pEntity.vy = 0;
    
    // Düşmanı başlangıç pozisyonuna al ve rotasını sıfırla
    enemy.x = 400;
    enemy.y = 300;
    enemy.state = 'WANDER';
    enemy.path = [];
}

// Menüyü tekrar ekranda gösteren yardımcı fonksiyon
function showMenu(title, buttonText, titleColor) {
    uiMenu.style.display = "flex";
    menuTitle.innerText = title;
    menuTitle.style.color = titleColor;
    actionBtn.innerText = buttonText;
}

// ==========================================
// 3. ASENKRON WEB WORKER İLETİŞİM AYARI (B.1 İsteri)
// ==========================================
const aiWorker = new Worker('astarWorker.js');

// Worker'ı matris haritamızla besleyip ilk kurulumunu yapıyoruz
aiWorker.postMessage({
    type: 'init',
    data: { grid: gameGrid }
});

// Worker arka planda rotayı bulduğunda tetiklenecek dinleyici
aiWorker.onmessage = function(event) {
    const { enemyId, path } = event.data;
    if (enemyId === enemy.id) {
        // Rota koordinatlarını A*'ın [satır, sütun] formatından düşmanın [GridX, GridY] formatına çeviriyoruz
        const correctedPath = path.map(node => [node[1], node[0]]);
        enemy.receivePath(correctedPath);
    }
};

// Düşmanın oyuncuyu görüp görmediğini bulma fonksiyonu (Line of Sight)
function checkLineOfSight(enemyX, enemyY, playerX, playerY) {
    const dx = playerX - enemyX;
    const dy = playerY - enemyY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.sqrt(dx*dx + dy*dy);

    if (distance > 300) return false;

    const ray = { x: enemyX, y: enemyY, angle: angle };
    const relevantWalls = bspRoot.getRelevantWalls(enemyX, enemyY);
    
    for (let wall of relevantWalls) {
        const intersect = visionSystem.getIntersection(ray, wall);
        if (intersect) {
            const intersectDist = intersect.dist * 1000; 
            
            // DÜZELTME: -5 piksellik hata payı eklendi. Duvar gerçekten önündeyse görüşü keser.
            if (intersectDist < distance - 5) {
                return false; 
            }
        }
    }
    return true; 
}

// ==========================================
// 4. ANA OYUN DÖNGÜSÜ (GAME LOOP)
// ==========================================
let lastTime = performance.now();

function gameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 16.66;
    if (deltaTime > 2) deltaTime = 2; 
    lastTime = timestamp;

    // A - EKRANI TEMİZLE
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // B - GÜNCELLEMELER (Sadece oyun aktifse çalışır)
    if (gameState === "PLAYING") {
        physicsEngine.updatePlayerPhysics(pEntity, deltaTime, bspRoot);
        const canSee = checkLineOfSight(enemy.x, enemy.y, pEntity.x, pEntity.y);
        enemy.update(pEntity.x, pEntity.y, canSee, aiWorker, walkableCells);

        // KAYBETME KONTROLÜ (Düşman ile Oyuncu Çarpışması)
        // Oyuncu kutusu ile düşman dairesi arası mesafe kontrolü
        const dist = Math.hypot(pEntity.x - enemy.x, pEntity.y - enemy.y);
        if (dist < 20) { // Yaklaşık olarak karakterlerin yarıçap toplamı
            gameState = "GAMEOVER";
            showMenu("YAKALANDIN!", "Yeniden Dene", "#e74c3c");
        }

        // KAZANMA KONTROLÜ (Yeşil Bölgeye Ulaşma)
        if (pEntity.x > winZone.x && pEntity.x < winZone.x + winZone.width &&
            pEntity.y > winZone.y && pEntity.y < winZone.y + winZone.height) {
            gameState = "WIN";
            showMenu("KAZANDIN!", "Tekrar Oyna", "#2ecc71");
        }
    }

    // C - GÖRSELLEŞTİRME (RENDER)
    // 1. Duvarları Çiz
    ctx.fillStyle = "#34495e";
    for (let r = 0; r < gameGrid.length; r++) {
        for (let c = 0; c < gameGrid[0].length; c++) {
            if (gameGrid[r][c] === 1) {
                ctx.fillRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }

    // YENİ: Yeşil Zafer Alanını Çiz
    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(winZone.x, winZone.y, winZone.width, winZone.height);

    // 2. Düşmanın Görüş Alanı Poligonunu Çiz
    const fovPoints = visionSystem.calculateFOV(enemy.x, enemy.y);
    ctx.save(); 
    const VISION_RADIUS = 250; 
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, VISION_RADIUS, 0, Math.PI * 2);
    ctx.clip(); 
    visionSystem.draw(ctx, enemy.x, enemy.y, fovPoints);
    ctx.restore(); 

    // 3. Düşmanı Çiz
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = enemy.state === 'CHASE' ? "#e74c3c" : "#e67e22"; 
    ctx.fill();
    ctx.closePath();

    // 4. Oyuncuyu Çiz 
    ctx.fillStyle = "#3498db";
    ctx.fillRect(pEntity.x - pEntity.width/2, pEntity.y - pEntity.height/2, pEntity.width, pEntity.height);

    requestAnimationFrame(gameLoop);
}

// Sistemi Ateşle
requestAnimationFrame(gameLoop);
console.log("Tüm modüller entegre edildi. Proje başarıyla çalışıyor!");
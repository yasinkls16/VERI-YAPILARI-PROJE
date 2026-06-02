const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


// 1. DİNAMİK DEĞİŞKENLER VE MOTORLAR
let gameGrid = [];
let walkableCells = [];
let mapWalls = [];
let bspRoot = null;
let visionSystem = null;
let winZone = {};

const physicsEngine = new PhysicsEngine();
const pEntity = new PhysicalEntity(45, 45); 
const enemy = new EnemyAI(1, 400, 300);

let gameState = "START";

let score = 0; // Puanı tutacağımız değişken

const uiMenu = document.getElementById("uiMenu");
const menuTitle = document.getElementById("menuTitle");
const actionBtn = document.getElementById("actionBtn");

// 2. WEB WORKER KURULUMU
const aiWorker = new Worker('astarWorker.js');

aiWorker.onmessage = function(event) {
    const { enemyId, path } = event.data;
    if (enemyId === enemy.id) {
        // Rota koordinatlarını düşmanın formatına çevirir
        const correctedPath = path.map(node => [node[1], node[0]]);
        enemy.receivePath(correctedPath);
    }
};

// 3. ARAYÜZ VE OYUN KONTROL FONKSİYONLARI
actionBtn.addEventListener("click", () => {
    resetGame();
    gameState = "PLAYING";
    uiMenu.style.display = "none";
});

function resetGame() {
    loadNewLevel(); // Her başlangıçta veya ölümde yeni harita yükler

    pEntity.x = 48;
    pEntity.y = 48;
    pEntity.vx = 0;
    pEntity.vy = 0;
    
    enemy.x = 400;
    enemy.y = 300;
    enemy.state = 'WANDER';
    enemy.path = [];
}

function showMenu(title, buttonText, titleColor) {
    uiMenu.style.display = "flex";
    menuTitle.innerText = title;
    menuTitle.style.color = titleColor;
    actionBtn.innerText = buttonText;
}

// 4. RASTGELE HARİTA ÜRETİM ALGORİTMASI
// 4. RASTGELE HARİTA ÜRETİM VE KONTROL ALGORİTMASI (FLOOD-FILL)
function generateRandomGrid() {
    const rows = 19;
    const cols = 25;
    let newGrid;
    let isValidMap = false;

    // Geçerli (kapalı odası olmayan) bir harita bulana kadar döngüyü çalıştır
    while (!isValidMap) {
        newGrid = [];
        let totalZeros = 0;

        // A. Haritayı Rastgele Üret
        for (let r = 0; r < rows; r++) {
            let row = [];
            for (let c = 0; c < cols; c++) {
                if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
                    row.push(1); // Sınırlar duvar
                } else {
                    let isWall = Math.random() < 0.22 ? 1 : 0; // %22 duvar ihtimali
                    row.push(isWall);
                }
            }
            newGrid.push(row);
        }

        // Karakterlerin doğma noktalarını temizle
        newGrid[1][1] = 0; 
        newGrid[9][12] = 0; 

        // B. Haritadaki Toplam Boş Alan (0) Sayısını Bul
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if (newGrid[r][c] === 0) totalZeros++;
            }
        }

        // C. FLOOD-FILL (Taşma) Algoritması ile Ulaşılabilir Alanları Say
        let visited = new Set();
        let queue = [[1, 1]]; // Oyuncunun başlangıç noktasından suyu salıyoruz
        visited.add(`1,1`);
        let reachedZeros = 0;

        while (queue.length > 0) {
            let [r, c] = queue.shift();
            reachedZeros++;

            // Sadece Yatay ve Dikey yönlere bak (çapraz geçiş yok)
            let dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (let d of dirs) {
                let nr = r + d[0];
                let nc = c + d[1];

                // Eğer komşu hücre harita içindeyse ve boşluksa (0)
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newGrid[nr][nc] === 0) {
                    let key = `${nr},${nc}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        queue.push([nr, nc]);
                    }
                }
            }
        }

        // D. Kontrol: Su tüm boşluklara ulaştı mı?
        if (reachedZeros === totalZeros) {
            isValidMap = true; // Harita onaylandı, döngüden çık!
        }
    }

    return newGrid;
}

function loadNewLevel() {
    gameGrid = generateRandomGrid();
    walkableCells = [];
    mapWalls = [];

    for (let r = 0; r < gameGrid.length; r++) {
        for (let c = 0; c < gameGrid[0].length; c++) {
            if (gameGrid[r][c] === 0) {
                walkableCells.push([r, c]);
            } else if (gameGrid[r][c] === 1) {
                let x = c * CELL_SIZE;
                let y = r * CELL_SIZE;
                if (r === 0 || gameGrid[r-1][c] === 0) mapWalls.push(new Wall(x, y, x + CELL_SIZE, y));
                if (c === 0 || gameGrid[r][c-1] === 0) mapWalls.push(new Wall(x, y, x, y + CELL_SIZE));
                if (c === gameGrid[0].length-1 || gameGrid[r][c+1] === 0) mapWalls.push(new Wall(x + CELL_SIZE, y, x + CELL_SIZE, y + CELL_SIZE));
                if (r === gameGrid.length-1 || gameGrid[r+1][c] === 0) mapWalls.push(new Wall(x, y + CELL_SIZE, x + CELL_SIZE, y + CELL_SIZE));
            }
        }
    }

    // Rastgele yürünebilir boş bir hücre seçip yeşil bölgeyi oraya koyar
    const randomCell = walkableCells[Math.floor(Math.random() * walkableCells.length)];
    winZone = {
        x: randomCell[1] * CELL_SIZE,
        y: randomCell[0] * CELL_SIZE,
        width: CELL_SIZE,
        height: CELL_SIZE
    };

    bspRoot = new BSPNode(mapWalls);
    visionSystem = new VisionSystem(bspRoot);

    // İşçiyi (A* Worker) yeni haritayla besler
    aiWorker.postMessage({
        type: 'update',
        data: { grid: gameGrid }
    });
}

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
        // KAYBETME KONTROLÜ (Düşman ile Oyuncu Çarpışması)
        const dist = Math.hypot(pEntity.x - enemy.x, pEntity.y - enemy.y);
        if (dist < 20) { 
            score = Math.max(0, score - 100); // YENİ: Puanı 100 azalt ama 0'ın altına düşmesine izin verme
            gameState = "GAMEOVER";
            showMenu("YAKALANDIN!", "Yeniden Dene", "#e74c3c");
        }

        // KAZANMA KONTROLÜ (Yeşil Bölgeye Ulaşma)
        if (pEntity.x > winZone.x && pEntity.x < winZone.x + winZone.width &&
            pEntity.y > winZone.y && pEntity.y < winZone.y + winZone.height) {
            score += 100; // YENİ: Hedefe ulaştığında 100 puan ekle
            gameState = "WIN";
            showMenu("KAZANDIN!", "Sıradaki Harita", "#2ecc71");
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

    // 5. Puanı Sol Üst Köşeye Yazdır
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("PUAN: " + score, 20, 35); // x:20, y:35 koordinatlarına metni çizer

    requestAnimationFrame(gameLoop);
}

// Sistemi Ateşle
resetGame();

requestAnimationFrame(gameLoop);
console.log("Tüm modüller entegre edildi. Proje başarıyla çalışıyor!");
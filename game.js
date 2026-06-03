// game.js - Final Entegrasyon Dosyası

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ==========================================
// 1. DİNAMİK DEĞİŞKENLER VE MOTORLAR
// ==========================================
let gameGrid = [];
let walkableCells = [];
let mapWalls = [];
let bspRoot = null;
let visionSystem = null;

const physicsEngine = new PhysicsEngine();
const pEntity = new PhysicalEntity(45, 45); 
const enemy = new EnemyAI(1, 400, 300); // SADECE TEK DÜŞMAN

let gameState = "START"; 
let score = 0; 

const uiMenu = document.getElementById("uiMenu");
const menuTitle = document.getElementById("menuTitle");
const actionBtn = document.getElementById("actionBtn");

// Yeşil Zafer Alanı
const winZone = {
    x: 23 * 32, 
    y: 17 * 32, 
    width: 32,
    height: 32
};

// ==========================================
// 2. PROSEDÜREL HARİTA ÜRETİMİ (DFS ALGORİTMASI)
// ==========================================
function yigitgenerateRandomGrid(rows, cols) {
    let grid = Array(rows).fill().map(() => Array(cols).fill(1));
    
    function yigitcarve(r, c) {
        grid[r][c] = 0; 
        const dirs = [[-2, 0], [2, 0], [0, -2], [0, 2]].sort(() => Math.random() - 0.5);
        for (let [dr, dc] of dirs) {
            let nr = r + dr, nc = c + dc;
            if (nr > 0 && nr < rows - 1 && nc > 0 && nc < cols - 1 && grid[nr][nc] === 1) {
                grid[r + dr / 2][c + dc / 2] = 0; 
                yigitcarve(nr, nc); 
            }
        }
    }
    
    yigitcarve(1, 1);
    
    for (let i = 0; i < 20; i++) {
        let r = Math.floor(Math.random() * (rows - 2)) + 1;
        let c = Math.floor(Math.random() * (cols - 2)) + 1;
        grid[r][c] = 0;
    }

    grid[1][1] = 0; grid[1][2] = 0; grid[2][1] = 0;
    grid[17][23] = 0; grid[17][22] = 0; grid[16][23] = 0;
    
    return grid;
}

// ==========================================
// 3. SEVİYE YÜKLEME VE AĞAÇ İNŞASI
// ==========================================
function yigitinitLevel() {
    gameGrid = yigitgenerateRandomGrid(19, 25);
    walkableCells = [];
    mapWalls = [];

    for (let r = 0; r < gameGrid.length; r++) {
        for (let c = 0; c < gameGrid[0].length; c++) {
            if (gameGrid[r][c] === 0) walkableCells.push([r, c]); 
        }
    }

    for (let r = 0; r < gameGrid.length; r++) {
        for (let c = 0; c < gameGrid[0].length; c++) {
            if (gameGrid[r][c] === 1) {
                let x = c * 32;
                let y = r * 32;
                if (r === 0 || gameGrid[r-1][c] === 0) mapWalls.push(new Wall(x, y, x + 32, y));
                if (c === 0 || gameGrid[r][c-1] === 0) mapWalls.push(new Wall(x, y, x, y + 32));
                if (c === gameGrid[0].length-1 || gameGrid[r][c+1] === 0) mapWalls.push(new Wall(x + 32, y, x + 32, y + 32));
                if (r === gameGrid.length-1 || gameGrid[r+1][c] === 0) mapWalls.push(new Wall(x, y + 32, x + 32, y + 32));
            }
        }
    }

    bspRoot = new BSPNode(mapWalls);
    visionSystem = new VisionSystem(bspRoot);
}

// ==========================================
// 4. ARAYÜZ VE OYUN KONTROL FONKSİYONLARI
// ==========================================
actionBtn.addEventListener("click", () => {
    yigitresetGame();
    gameState = "PLAYING";
    uiMenu.style.display = "none"; 
});

function yigitresetGame() {
    yigitinitLevel(); 

    pEntity.x = 45;
    pEntity.y = 45;
    pEntity.vx = 0;
    pEntity.vy = 0;
    
    let randomEnemyCell = walkableCells[Math.floor(Math.random() * (walkableCells.length / 2)) + Math.floor(walkableCells.length / 2)]; 
    enemy.x = (randomEnemyCell[1] * 32) + 16;
    enemy.y = (randomEnemyCell[0] * 32) + 16;
    enemy.state = 'WANDER';
    enemy.path = [];
}

function yigitshowMenu(title, buttonText, titleColor) {
    uiMenu.style.display = "flex";
    menuTitle.innerText = title;
    menuTitle.style.color = titleColor;
    actionBtn.innerText = buttonText;
}

function yigitcheckLineOfSight(enemyX, enemyY, playerX, playerY) {
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
            if (intersectDist < distance - 5) return false; 
        }
    }
    return true; 
}

// ==========================================
// 5. ANA OYUN DÖNGÜSÜ (GAME LOOP)
// ==========================================
let lastTime = performance.now();
let currentFps = 0;
let frameCount = 0;
let lastFpsTime = performance.now();

function yigitgameLoop(timestamp) {
    let deltaTime = (timestamp - lastTime) / 16.66;
    if (deltaTime > 2) deltaTime = 2; 
    lastTime = timestamp;

    frameCount++;
    if (timestamp - lastFpsTime >= 1000) { 
        currentFps = frameCount; 
        frameCount = 0;          
        lastFpsTime = timestamp; 
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === "PLAYING") {
        physicsEngine.updatePlayerPhysics(pEntity, deltaTime, bspRoot);
        const canSee = yigitcheckLineOfSight(enemy.x, enemy.y, pEntity.x, pEntity.y);
        enemy.update(pEntity.x, pEntity.y, canSee, walkableCells, physicsEngine, bspRoot);

        const dist = Math.hypot(pEntity.x - enemy.x, pEntity.y - enemy.y);
        if (dist < 20) { 
            score = Math.max(0, score - 100);
            gameState = "GAMEOVER";
            yigitshowMenu("YAKALANDIN!", "Yeniden Dene", "#e74c3c");
        }

        if (pEntity.x > winZone.x && pEntity.x < winZone.x + winZone.width &&
            pEntity.y > winZone.y && pEntity.y < winZone.y + winZone.height) {
            score = score + 100;
            gameState = "WIN";
            yigitshowMenu("KAZANDIN!", "Sıradaki Bölüm", "#2ecc71");
        }
    }

    ctx.fillStyle = "#34495e";
    for (let r = 0; r < gameGrid.length; r++) {
        for (let c = 0; c < gameGrid[0].length; c++) {
            if (gameGrid[r][c] === 1) {
                ctx.fillRect(c * 32, r * 32, 32, 32);
            }
        }
    }

    ctx.fillStyle = "#2ecc71";
    ctx.fillRect(winZone.x, winZone.y, winZone.width, winZone.height);

    if (visionSystem) {
        const fovPoints = visionSystem.calculateFOV(enemy.x, enemy.y);
        ctx.save(); 
        const VISION_RADIUS = 250; 
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, VISION_RADIUS, 0, Math.PI * 2);
        ctx.clip(); 
        visionSystem.draw(ctx, enemy.x, enemy.y, fovPoints);
        ctx.restore(); 
    }

    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = enemy.state === 'CHASE' ? "#e74c3c" : "#e67e22"; 
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "#3498db";
    ctx.fillRect(pEntity.x - pEntity.width/2, pEntity.y - pEntity.height/2, pEntity.width, pEntity.height);
    
    ctx.fillStyle = "white";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "left";
    ctx.fillText("PUAN: " + score, 20, 35);

    if (currentFps >= 50) {
        ctx.fillStyle = "#2ecc71"; 
    } else if (currentFps >= 30) {
        ctx.fillStyle = "#f1c40f"; 
    } else {
        ctx.fillStyle = "#e74c3c"; 
    }
    ctx.textAlign = "right";
    ctx.fillText("FPS: " + currentFps, canvas.width - 20, 35);

    requestAnimationFrame(yigitgameLoop);
}

requestAnimationFrame(yigitgameLoop);
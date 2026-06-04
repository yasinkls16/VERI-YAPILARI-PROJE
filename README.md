# 2D BSP Stealth Game — Teknik Dokümantasyon

-----

## Geliştirici Ekibi
| Rol | İsim |
| :--- | :--- |
| **Takım Lideri & Yapay Zeka Mimarı** — Navigasyon Algoritması (Graf, Min-Heap, A*), Düşman Yapay Zekası, Mikroservis Mimarisi Kurulumu, Kod Entegrasyonu ve Hata Ayıklama (Debugging) | Yasin Can Keleş |
| **Yönetmen & Sistem Mimarı** — Level Design, Otomatik Harita Oluşturma, Game Loop Mimarisi, Arayüz (UI) Mimarisi, Puan Sistemi, Sentetik Veri, Kod Entegrasyonu ve Hata Ayıklama (Debugging) | Yiğit Toklu |
| **Uzamsal Mimar** — BSP Ağacı ve Temel Geometri | Süha Tüfekçi |
| **Optik Mühendisi** — Raycasting ve Görüş Alanı (LoS), Readme dosyası oluşturma. | Şevval Küçükyılmaz |
| **Oyun Motoru ve Fizik** — HTML5 Canvas ve Çarpışma | Ayşegül Karataş |

-----
**oynanış videosu gösterimi**
https://drive.google.com/file/d/18_l5oEgmHgxke-A2KQIdvDcuMLvRWqE3/view?usp=sharing 

## İçindekiler

1. [Proje Genel Bakış](#1-proje-genel-bakış)
1. [Mimari ve Modül Yapısı](#2-mimari-ve-modül-yapısı)
1. [UML Sınıf Diyagramları](#3-uml-sınıf-diyagramları)
1. [UML Sıralama Diyagramları](#4-uml-sıralama-diyagramları)
1. [UML Durum Diyagramı — EnemyAI](#5-uml-durum-diyagramı--enemyai)
1. [Veri Yapıları ve Algoritmalar](#6-veri-yapıları-ve-algoritmalar)
1. [Big O Karmaşıklık Analizi](#7-big-o-karmaşıklık-analizi)
1. [Sistem Akış Diyagramı](#8-sistem-akış-diyagramı)
1. [Optimizasyonlar ve Tasarım Kararları](#9-optimizasyonlar-ve-tasarım-kararları)
1. [Modül Sorumlulukları Özeti](#10-modül-sorumlulukları-özeti)

-----

## 1. Proje Genel Bakış

Bu proje, klasik DOOM-dönem mimarisinden ilham alan, 2D tarayıcı tabanlı bir gizlilik (stealth) oyunudur. Temel teknik hedefler:

- **BSP Ağacı** ile uzamsal bölümleme ve O(log n) duvar sorgulaması
- **A* Algoritması** ile Python FastAPI servisi üzerinden asenkron yol bulma
- **AABB Çarpışma Algılama** ile fizik motoru entegrasyonu
- **Raycasting tabanlı Görüş Alanı (FOV)** hesaplama
- **Durum Makinesi (State Machine)** tabanlı düşman yapay zekası
- **Prosedürel harita üretimi** DFS (Depth-First Search) algoritması ile

-----

## 2. Mimari ve Modül Yapısı

```
┌─────────────────────────────────────────────────────────────────────┐
│                          index.html                                 │
│                     (Giriş Noktası / UI Katmanı)                    │
└──────────┬──────────────────────────────────────────────────────────┘
           │  script yükleme sırası
     ┌─────▼──────────────────────────────────────────────┐
     │                   BspTree.js                        │
     │         Wall, BSPNode, getDeveloperInfo             │
     └────────────────────┬───────────────────────────────┘
                          │ getRelevantWalls()
     ┌────────────────────▼──────┐   ┌───────────────────┐
     │       PhysicsEngine.js    │   │     vision.js      │
     │  PhysicalEntity           │   │   VisionSystem     │
     │  PhysicsEngine            │   │   (Raycasting FOV) │
     └────────────┬──────────────┘   └───────────────────┘
                  │ updatePlayerPhysics()
     ┌────────────▼──────────────┐
     │         player.js         │
     │   Player                  │
     └────────────┬──────────────┘
                  │
     ┌────────────▼──────────────┐        ┌──────────────────────┐
     │          game.js          │◄───────►│    EnemyAI.js        │
     │     Ana Oyun Döngüsü      │         │  EnemyAI (State      │
     │     requestAnimationFrame  │         │  Machine + HTTP req.) │
     └───────────────────────────┘         └──────────┬───────────┘
                                                       │ fetch() POST
                                           ┌───────────▼───────────┐
                                           │      main.py           │
                                           │  FastAPI A* Servisi    │
                                           │  /calculate-path       │
                                           └───────────────────────┘
```

-----

## 3. UML Sınıf Diyagramları

### 3.1 JavaScript Sınıfları — BspTree.js

```
┌──────────────────────────────────────┐
│               Wall                   │
├──────────────────────────────────────┤
│ + x1: number                         │
│ + y1: number                         │
│ + x2: number                         │
│ + y2: number                         │
├──────────────────────────────────────┤
│ + constructor(x1, y1, x2, y2)        │
└──────────────────────────────────────┘
                  △
                  │ kullanır (duvar nesnesi)
                  │
┌──────────────────────────────────────────────────────┐
│                     BSPNode                           │
├──────────────────────────────────────────────────────┤
│ + partitionLine: Wall | null                          │
│ + front: BSPNode | null                               │
│ + back: BSPNode | null                                │
│ + walls: Wall[]   ← kolineer duvarlar                 │
├──────────────────────────────────────────────────────┤
│ + constructor(walls: Wall[])                          │
│ + buildTree(walls: Wall[]): void                      │
│ + classifyPoint(line: Wall,                           │
│     x: number, y: number): string                     │
│   → "FRONT" | "BACK" | "COLLINEAR"                   │
│ + classifyWall(line: Wall,                            │
│     wall: Wall): string                               │
│   → "FRONT" | "BACK" | "COLLINEAR" | "SPANNING"      │
│ + getIntersection(line1: Wall,                        │
│     line2: Wall): {x, y} | null                       │
│ + getRelevantWalls(                                   │
│     targetX: number,                                  │
│     targetY: number): Wall[]                          │
└──────────────────────────────────────────────────────┘
   BSPNode.front ──────► BSPNode  (özyinelemeli)
   BSPNode.back  ──────► BSPNode  (özyinelemeli)

── Modül dışa aktarım ──────────────────────────────────
  getDeveloperInfo(): string  → "suha_tufekci"
  module.exports = { Wall, BSPNode }
```

### 3.2 JavaScript Sınıfları — PhysicsEngine.js

```
┌──────────────────────────────────────┐
│           PhysicalEntity             │
├──────────────────────────────────────┤
│ + x: number                          │
│ + y: number                          │
│ + vx: number = 0  (x hızı)           │
│ + vy: number = 0  (y hızı)           │
│ + ax: number = 0  (x ivmesi)         │
│ + ay: number = 0  (y ivmesi)         │
│ + friction: number = 0.82            │
│ + maxSpeed: number = 6               │
│ + width: number = 20                 │
│ + height: number = 20                │
├──────────────────────────────────────┤
│ + constructor(startX, startY)        │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│           PhysicsEngine              │
├──────────────────────────────────────┤
│ + keys: {                            │
│     ArrowUp: boolean,                │
│     ArrowDown: boolean,              │
│     ArrowLeft: boolean,              │
│     ArrowRight: boolean,             │
│     w: boolean, s: boolean,          │
│     a: boolean, d: boolean           │
│   }                                  │
├──────────────────────────────────────┤
│ + constructor()                      │
│ + initInputListeners(): void         │
│   (window keydown / keyup dinler)    │
│ + pixelToGrid(pixelX, pixelY)        │
│   : {x: number, y: number}           │
│ + gridToPixel(gridX, gridY)          │
│   : {x: number, y: number}           │
│ + applyKeyboardInput(                │
│     character: PhysicalEntity): void │
│ + updatePlayerPhysics(               │
│     character: PhysicalEntity,       │
│     deltaTime: number,               │
│     bspRootNode: BSPNode): void      │
│   → ivme, hız, BSP sorgusu,          │
│     AABB çarpışma, wall sliding       │
│ + checkCollisionWithWalls(           │
│     nextX: number,                   │
│     nextY: number,                   │
│     walls: Wall[]): boolean          │
│   → dikey/yatay duvar AABB testi     │
└──────────────────────────────────────┘

── Modül dışa aktarım ──────────────────────────────────
  module.exports = { PhysicsEngine, PhysicalEntity }
```

### 3.3 JavaScript Sınıfı — player.js

```
┌──────────────────────────────────────┐
│               Player                 │
├──────────────────────────────────────┤
│ + x: number                          │
│ + y: number                          │
│ + speed: number = 5                  │
│ + radius: number = 15                │
│ + keys: {}  (tuş durumları)          │
├──────────────────────────────────────┤
│ + constructor(x: number, y: number)  │
│   (keydown / keyup event dinler)     │
│ + update(): void                     │
│   → WASD / Ok tuşu hareketi          │
│   → ekran sınırı kontrolü (800×600)  │
│ + draw(ctx: CanvasContext): void     │
│   → mavi daire (#3498db, r=15)       │
└──────────────────────────────────────┘

NOT: player.js bağımsız bir sınıftır.
PhysicsEngine.js'deki PhysicalEntity ile
kalıtım ilişkisi YOKTUR. game.js içinde
pEntity = new PhysicalEntity(45, 45)
olarak ayrıca örneklenir.
```

### 3.4 JavaScript Sınıfı — EnemyAI.js

```
┌──────────────────────────────────────────────────────┐
│                    EnemyAI                            │
├──────────────────────────────────────────────────────┤
│ + id: number                                          │
│ + x: number                                           │
│ + y: number                                           │
│ + state: "WANDER" | "CHASE"                           │
│ + path: [row, col][]                                  │
│ + isWaitingForWorker: boolean = false                 │
│ + lastPathRequestTime: number = 0                     │
├──────────────────────────────────────────────────────┤
│ + yasinconstructor(                                   │
│     id, startX, startY)                               │
│                                                       │
│ + yasinupdate(                                        │
│     playerX: number,                                  │
│     playerY: number,                                  │
│     canSeePlayer: boolean,                            │
│     walkableCells: [row,col][],                       │
│     physicsEngine: PhysicsEngine,                     │
│     bspRoot: BSPNode): void                           │
│   → durum geçişi, yakın takip (dist<80),              │
│     rota isteme, fiziksel hareket                     │
│                                                       │
│ + yasinMoveAlongPath(                                 │
│     physicsEngine: PhysicsEngine,                     │
│     bspRoot: BSPNode): void                           │
│   → hız=7.5, tolerans=12px, wall sliding              │
│                                                       │
│ + yasinchangeState(newState: string): void            │
│   → state değiştir + console.log                      │
│                                                       │
│ + yasingetRandomWalkableCoords(                       │
│     walkableCells: [row,col][]): [row, col]           │
│                                                       │
│ + yasinrequestPath(                                   │
│     targetCoords: [row, col]): void                   │
│   → 500ms cooldown, fetch POST /calculate-path        │
│                                                       │
│ + yasinreceivePath(                                   │
│     calculatedPath: [row,col][]): void                │
│   → path[0] (mevcut hücre) atılır, path güncellenir  │
└──────────────────────────────────────────────────────┘
```

### 3.5 JavaScript Sınıfı — vision.js

```
┌──────────────────────────────────────────────────────┐
│                  VisionSystem                         │
├──────────────────────────────────────────────────────┤
│ + bspTree: BSPNode                                    │
├──────────────────────────────────────────────────────┤
│ + constructor(bspTree: BSPNode)                       │
│                                                       │
│ + getIntersection(                                    │
│     ray: {x, y, angle},                               │
│     wall: Wall)                                       │
│   : {x, y, dist, angle} | null                        │
│   → parametrik kesişim hesabı                         │
│                                                       │
│ + calculateFOV(                                       │
│     enemyX: number,                                   │
│     enemyY: number): point[]                          │
│   → BSP'den duvar al, her köşeye                      │
│     3 ışın (angle-ε, angle, angle+ε),                 │
│     açıya göre sırala                                 │
│                                                       │
│ + draw(                                               │
│     ctx: CanvasContext,                               │
│     enemyX: number,                                   │
│     enemyY: number,                                   │
│     polygonPoints: point[]): void                     │
│   → sarı transparan FOV üçgenleri çiz                │
└──────────────────────────────────────────────────────┘
```

### 3.6 Python Sınıfları — main.py (FastAPI)

```
── main.py (Python FastAPI — localhost:8000) ───────────────────────

┌──────────────────────────────────────────┐
│         PathRequest  (Pydantic Model)    │
├──────────────────────────────────────────┤
│ + id: int                                │
│ + startCoords: list[int]  [row, col]     │
│ + targetCoords: list[int] [row, col]     │
│ + grid: list[list[int]]                  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│      FastAPI Uygulama Fonksiyonları      │
├──────────────────────────────────────────┤
│ + yasinheuristic(                        │
│     node: tuple,                         │
│     target: tuple): float                │
│   → Chebyshev Distance                   │
│   → (dx+dy) + (√2-2) × min(dx,dy)       │
│                                          │
│ + yasinget_neighbors(                    │
│     x: int, y: int,                      │
│     grid: list[list[int]])               │
│   : list[tuple(nx, ny, cost)]            │
│   → 8 yön, sınır + duvar kontrolü,       │
│     corner-cutting engeli,               │
│     çapraz: √2, düz: 1.0                 │
│                                          │
│ @app.post("/calculate-path")             │
│ + yasincalculate_path(                   │
│     req: PathRequest)                    │
│   : {"id": int, "path": list[list[int]]} │
│   → heapq MinHeap A*, came_from takibi,  │
│     yol bulunamazsa path=[]              │
└──────────────────────────────────────────┘

── CORS Ayarları ───────────────────────────────────────
  allow_origins=["*"]   (tarayıcıdan erişim için)
  allow_methods=["*"]
  allow_headers=["*"]
```

### 3.7 game.js — Global Değişkenler ve Fonksiyonlar

```
── game.js (Ana Koordinatör) ───────────────────────────

Global Değişkenler:
  gameGrid: number[][]          ← DFS harita matrisi
  walkableCells: [row,col][]    ← yürünebilir hücreler
  mapWalls: Wall[]              ← tüm kenar duvarları
  bspRoot: BSPNode | null       ← BSP kök düğümü
  visionSystem: VisionSystem    ← FOV sistemi
  physicsEngine: PhysicsEngine  ← fizik motoru
  pEntity: PhysicalEntity       ← oyuncu fizik nesnesi
  enemy: EnemyAI                ← tek düşman (id=1)
  gameState: "START"|"PLAYING"|"GAMEOVER"|"WIN"
  score: number
  winZone: {x, y, width, height} ← (23×32, 17×32)

Fonksiyonlar:
  + yigitgenerateRandomGrid(rows, cols): number[][]
    → DFS maze carving, 20 ekstra açık hücre
  + yigitinitLevel(): void
    → grid üret, duvarları çıkar, BSP inşa et
  + yigitresetGame(): void
    → seviyeyi sıfırla, oyuncuyu (45,45)'e koy
  + yigitshowMenu(title, btn, color): void
  + yigitcheckLineOfSight(ex,ey,px,py): boolean
    → BSP + VisionSystem ile LoS testi, mesafe≤300
  + yigitgameLoop(timestamp): void
    → deltaTime, fizik, enemy, çarpışma,
      kazanma/kaybetme, canvas çizimi, FPS sayacı
```

-----

## 4. UML Sıralama Diyagramları

### 4.1 Oyun Döngüsü — Tek Frame Akışı

```
Tarayıcı       game.js      PhysicsEngine    BSPNode       Canvas
   │              │                │              │             │
   │─requestAnim──►│                │              │             │
   │  Frame()      │                │              │             │
   │              │                │              │             │
   │              │─updatePlayer───►│              │             │
   │              │  Physics(       │              │             │
   │              │  pEntity,       │              │             │
   │              │  deltaTime,     │              │             │
   │              │  bspRoot)       │              │             │
   │              │                │              │             │
   │              │                │─applyKey────►│             │
   │              │                │  boardInput() │             │
   │              │                │              │             │
   │              │                │─getRelevant──►│             │
   │              │                │  Walls(nextX, │             │
   │              │                │  nextY)       │             │
   │              │                │◄─Wall[]───────│             │
   │              │                │              │             │
   │              │                │─checkCollision►│             │
   │              │                │  WithWalls()  │             │
   │              │                │◄─boolean──────│             │
   │              │                │              │             │
   │              │                │ [wall sliding │             │
   │              │                │  veya hareket]│             │
   │              │◄───────────────│              │             │
   │              │                │              │             │
   │              │─yigitcheck─────────────────────────────────►│
   │              │  LineOfSight() │              │             │
   │              │◄─boolean───────────────────────────────────│
   │              │                │              │             │
   │              │─enemy.yasin───►│              │             │
   │              │  update()      │              │             │
   │              │◄───────────────│              │             │
   │              │                │              │             │
   │              │─drawMap()──────────────────────────────────►│
   │              │─enemy draw─────────────────────────────────►│
   │              │─pEntity draw───────────────────────────────►│
   │              │─FPS / skor─────────────────────────────────►│
   │              │                │              │             │
   │◄─────────────│                │              │             │
   │ requestAnim  │                │              │             │
   │ Frame()      │                │              │             │
```

### 4.2 EnemyAI — A* Yol Bulma HTTP Akışı

```
game.js       EnemyAI        main.py (FastAPI)
   │              │                  │
   │─yasinupdate─►│                  │
   │  (playerX,Y, │                  │
   │   canSee,    │                  │
   │   cells,     │                  │
   │   physics,   │                  │
   │   bspRoot)   │                  │
   │              │                  │
   │              │ [canSeePlayer    │
   │              │  && dist >= 80]  │
   │              │─yasinchangeState─►
   │              │  ("CHASE")       │
   │              │                  │
   │              │ [cooldown OK &&  │
   │              │  !isWaiting]     │
   │              │─yasinrequestPath─►
   │              │  (playerGridCoords)
   │              │                  │
   │              │─fetch POST───────►│
   │              │  /calculate-path  │
   │              │  {id, start,      │
   │              │   target, grid}   │
   │              │                  │
   │              │ isWaiting=true   │
   │              │                  │
   │              │                  │ yasincalculate_path()
   │              │                  │ heapq A* çalışır
   │              │                  │
   │              │◄─JSON response───│
   │              │  {id, path:[]}   │
   │              │                  │
   │              │─yasinreceivePath─►
   │              │  path[0].shift() │
   │              │  isWaiting=false │
   │              │                  │
   │              │─yasinMoveAlong───►
   │              │  Path(physics,   │
   │              │  bspRoot)        │
   │◄─────────────│                  │
```

### 4.3 EnemyAI — Yakın Mesafe Doğrudan Takip (dist < 80)

```
game.js       EnemyAI        PhysicsEngine    BSPNode
   │              │                │              │
   │─yasinupdate─►│                │              │
   │              │                │              │
   │              │ [state=CHASE   │              │
   │              │  canSee=true   │              │
   │              │  dist < 80]    │              │
   │              │                │              │
   │              │ normalize vektör hesabı        │
   │              │ nextX, nextY (speed=6.5)       │
   │              │                │              │
   │              │─getRelevant────────────────────►│
   │              │  Walls(nextX,Y)│              │
   │              │◄─Wall[]─────────────────────────│
   │              │                │              │
   │              │─checkCollision─►│              │
   │              │  WithWalls()   │              │
   │              │◄─boolean───────│              │
   │              │                │              │
   │              │ [false] → x=nextX, y=nextY    │
   │              │ [true]  → wall sliding testi  │
   │              │   canMoveX? → x=nextX         │
   │              │   canMoveY? → y=nextY         │
   │◄─────────────│                │              │
```

### 4.4 VisionSystem — FOV Hesaplama

```
game.js       EnemyAI       VisionSystem        BSPNode
   │              │                │                │
   │─(her frame)──►│                │                │
   │              │                │                │
   │              │─calculateFOV───►│                │
   │              │  (enemyX,       │                │
   │              │   enemyY)       │                │
   │              │                │─getRelevant────►│
   │              │                │  Walls(ex, ey)  │
   │              │                │◄─Wall[]─────────│
   │              │                │                │
   │              │                │ [her duvar için]│
   │              │                │ 3 köşe açısı    │
   │              │                │ (a-ε, a, a+ε)   │
   │              │                │─getIntersection─►
   │              │                │  (ray, wall)    │
   │              │                │                │
   │              │                │ sort by angle   │
   │              │◄─point[]───────│                │
   │              │                │                │
   │              │─draw(ctx,      │                │
   │              │  ex, ey,       │                │
   │              │  points)       │                │
   │◄─────────────│                │                │
```

### 4.5 Harita Üretimi ve Seviye Başlatma

```
Kullanıcı     game.js          yigitinitLevel()     BSPNode
   │              │                    │                │
   │─BAŞLAT btn───►│                    │                │
   │              │─yigitresetGame()───►│                │
   │              │                    │                │
   │              │                    │─yigitgenerate──►
   │              │                    │  RandomGrid()  │
   │              │                    │  DFS Maze Carve│
   │              │                    │  19×25 grid    │
   │              │                    │                │
   │              │                    │ walkableCells[] toplama
   │              │                    │                │
   │              │                    │ gameGrid üzerinden
   │              │                    │ duvar kenarı tespiti
   │              │                    │ mapWalls[] doldurma
   │              │                    │                │
   │              │                    │─new BSPNode────►│
   │              │                    │  (mapWalls)    │
   │              │                    │                │─buildTree()
   │              │                    │◄───────────────│
   │              │                    │  bspRoot hazır │
   │              │                    │                │
   │              │                    │─new VisionSystem(bspRoot)
   │              │◄───────────────────│                │
   │              │  gameState="PLAYING"│               │
   │◄─────────────│                    │                │
   │   oyun döngüsü başlar             │                │
```

-----

## 5. UML Durum Diyagramı — EnemyAI

```
                         [Oyun Başlangıcı]
                                │
                                ▼
                    ┌───────────────────────┐
               ┌───►│        WANDER          │
               │    │  Rastgele hedef seç    │
               │    │  yasingetRandom        │
               │    │  WalkableCoords()      │
               │    │  yasinrequestPath()    │
               │    │  yasinMoveAlongPath()  │
               │    └───────────┬───────────┘
               │                │
               │        canSeePlayer == true
               │                │
               │                ▼
               │    ┌───────────────────────┐
               │    │         CHASE          │◄─────────────┐
               │    │  Her 500ms'de bir      │              │
               │    │  yasinrequestPath()    │              │
               │    │  (player konumuna)     │              │
               │    │  yasinMoveAlongPath()  │              │
               │    └───────────┬───────────┘              │
               │                │                          │
    !canSeePlayer        dist < 80 &&                dist >= 80
               │          canSeePlayer                      │
               │                │                          │
               │                ▼                          │
               │    ┌───────────────────────┐              │
               │    │    DOĞRUDAN TAKİP     ├──────────────┘
               │    │   (CHASE içi dal)     │
               │    │  A* bypass edilir     │
               │    │  normalize vektör     │
               │    │  speed = 6.5          │
               │    │  dist > 15 → hareket  │
               │    │  wall sliding aktif   │
               │    └───────────────────────┘
               │
               └──── (WANDER'a dön)

Durum Geçiş Tablosu:
┌───────────────┬──────────────────────────────┬────────────────┐
│ Mevcut Durum  │ Koşul                         │ Sonraki Durum  │
├───────────────┼──────────────────────────────┼────────────────┤
│ WANDER        │ canSeePlayer == true          │ CHASE          │
│ CHASE         │ !canSeePlayer                 │ WANDER         │
│ CHASE         │ canSeePlayer && dist < 80     │ DIRECT (dal)   │
│ DIRECT (dal)  │ dist >= 80 veya !canSeePlayer │ CHASE          │
└───────────────┴──────────────────────────────┴────────────────┘

Durum Geçişinde Ne Olur:
  • yasinchangeState() çağrılır
  • console.log ile "[Düşman X] Mod Değiştirdi: A -> B" yazdırılır
  • path[] kasıtlı SİLİNMEZ → eski rota korunur, titreme önlenir
  • isWaitingForWorker sıfırlanmaz → devam eden HTTP isteği beklenir

Path Yönetimi:
  WANDER → path bitti + !isWaiting → yeni rastgele rota iste
  CHASE  → her 500ms → oyuncunun grid konumuna rota iste
  DIRECT → path tamamen bypass; A* isteği gönderilmez
```

-----

## 6. Veri Yapıları ve Algoritmalar

### 6.1 BSP Ağacı (Binary Space Partitioning)

BSP ağacı, uzaydaki çizgi segmentlerini (duvarları) ikili ağaç yapısına bölerek uzamsal sorguları hızlandırır.

```
Örnek İnşa Adımı:
Giriş Duvarları: [W0, W1, W2]

BSPNode(root)
├── partitionLine = W0
├── walls = [W0]
├── front: BSPNode
│   └── walls = [W1_parça_ön]
└── back: BSPNode
    └── walls = [W1_parça_arka, W2]

SPANNING duvar tespiti → getIntersection() → 2 parçaya bölme
Parça yerleşimi → classifyPoint(midpoint) ile belirlenir
```

**Sınıflandırma Mantığı (Cross Product):**

```
cross = dx*(y - line.y1) - dy*(x - line.x1)

cross > 0.001  → FRONT
cross < -0.001 → BACK
otherwise      → COLLINEAR
```

### 6.2 A* Pathfinding (Python FastAPI — main.py)

```
f(n) = g(n) + h(n)

g(n) = başlangıçtan n'e gerçek maliyet
       düz hareket:   1.0
       çapraz hareket: √2 ≈ 1.414

h(n) = Chebyshev Distance (8-yönlü hareket için optimal)
       h = (dx + dy) + (√2 - 2) × min(dx, dy)

Python heapq MinHeap: O(log n) push/pop ile f değerine göre sıralı kuyruk
HTTP POST /calculate-path → JSON yanıt { id, path }
```

### 6.3 AABB Çarpışma Algılama

```
Karakter kutusu:
  charLeft   = x - 10
  charRight  = x + 10
  charTop    = y - 10
  charBottom = y + 10

Dikey duvar (x1 == x2) kontrolü:
  inYRange = charBottom >= min(y1,y2) && charTop <= max(y1,y2)
  çarpışma = inYRange && charLeft <= wall.x && charRight >= wall.x

Yatay duvar (y1 == y2) kontrolü:
  inXRange = charRight >= min(x1,x2) && charLeft <= max(x1,x2)
  çarpışma = inXRange && charTop <= wall.y && charBottom >= wall.y
```

### 6.4 Wall Sliding (Duvar Kaydırma)

Hem `PhysicsEngine` hem de `EnemyAI` duvara çarpıldığında tam durma yerine eksene göre kaydırma uygular:

```
çarpışma varsa:
  canMoveX = checkCollision(nextX, this.y, walls)
  canMoveY = checkCollision(this.x, nextY, walls)
  if (canMoveX) → sadece X ekseninde hareket et
  else if (canMoveY) → sadece Y ekseninde hareket et
  else → path.shift() (tam köşe sıkışması — waypoint atla)
```

### 6.5 Prosedürel Harita Üretimi (DFS Maze Carving)

```
yigitgenerateRandomGrid(rows=19, cols=25):
  1. Tüm grid'i 1 (duvar) ile doldur
  2. yigitcarve(1,1) ile DFS başlat:
     - Mevcut hücreyi 0 (yürünebilir) yap
     - 4 yönü karıştır (rastgele)
     - 2 adım ötedeki komşu hâlâ 1 ise:
       aradaki hücreyi de aç → rekürsif devam
  3. 20 adet rastgele hücreyi ekstra aç (açıklık artırma)
  4. Başlangıç (1,1) ve bitiş (17,23) bölgelerini garantile
```

-----

## 7. Big O Karmaşıklık Analizi

### 7.1 BSPNode — Ağaç İnşası

|İşlem                  |Ortalama    |En Kötü|Açıklama                                                   |
|-----------------------|------------|-------|-----------------------------------------------------------|
|`buildTree(n duvar)`   |O(n log n)  |O(n²)  |Her seviyede n test; dengeli ağaçta log n seviye           |
|`classifyPoint()`      |O(1)        |O(1)   |Sabit matematiksel işlem                                   |
|`classifyWall()`       |O(1)        |O(1)   |2 × classifyPoint                                          |
|`getIntersection()`    |O(1)        |O(1)   |Parametrik doğru kesişimi                                  |
|`getRelevantWalls(x,y)`|**O(log n)**|O(n)   |Dengeli BSP’de logaritmik; tek taraf önceden ziyaret edilir|


> **Kritik Optimizasyon:** `getRelevantWalls()` fonksiyonu, oyuncunun bulunduğu tarafı önce arar. Bu sayede PhysicsEngine ve VisionSystem, tüm haritayı taramak yerine yalnızca yakın çevredeki duvarları alır.

### 7.2 A* Pathfinding (main.py — Python FastAPI)

|İşlem                         |Karmaşıklık   |Açıklama                                    |
|------------------------------|--------------|--------------------------------------------|
|`yasinget_neighbors()`        |O(8) = O(1)   |8 yön için sabit kontrol sayısı             |
|`heapq.heappush()`            |O(log V)      |Python MinHeap push                         |
|`heapq.heappop()`             |O(log V)      |Python MinHeap pop                          |
|`yasincalculate_path()` toplam|**O(E log V)**|Her kenar için heap işlemi; E ≈ 8V (8-yönlü)|
|Yol geri izleme               |O(P)          |P = yol uzunluğu (came_from takibi)         |

**HTTP Servis Avantajı:** A* hesaplaması ana thread’i bloklamaz; `fetch()` asenkron çağrıdır. `isWaitingForWorker` bayrağı ile yanıt gelene kadar yeni istek gönderilmez.

### 7.3 EnemyAI

|İşlem                           |Karmaşıklık  |Açıklama                                                      |
|--------------------------------|-------------|--------------------------------------------------------------|
|`yasinupdate()`                 |O(1) amortize|Durum geçişi + path isteği (500ms cooldown ile sınırlı)       |
|`yasingetRandomWalkableCoords()`|**O(1)**     |Ön belleğe alınmış `walkableCells[]` dizisinden rastgele index|
|`yasinMoveAlongPath()`          |O(1)         |path[0] hedefine doğru hareket; hedefe ulaşınca shift()       |
|`yasinchangeState()`            |O(1)         |Durum değişkeni atama + log çıktısı                           |
|Yakın mesafe takip (dist < 80)  |O(log n)     |BSP sorgusu + normalize vektör hareketi + wall sliding        |


> **OPTİMİZASYON:** `yasingetRandomWalkableCoords()`, önceden hesaplanmış `walkableCells` dizisini kullanır. Sonsuz döngü riski taşıyan yöntemlerin yerini O(1) tek indexleme alır.

### 7.4 VisionSystem (Raycasting FOV)

|İşlem                     |Karmaşıklık        |Açıklama                       |
|--------------------------|-------------------|-------------------------------|
|`getRelevantWalls()`      |O(log n)           |BSP’den duvar alma             |
|Her duvar köşesi için ışın|O(W)               |W = çevredeki duvar sayısı     |
|Her ışın × her duvar testi|O(W²)              |getIntersection() iç döngüsü   |
|`calculateFOV()` toplam   |**O(W² + W log W)**|W² test + W log W sıralama     |
|`sort by angle`           |O(W log W)         |JavaScript Array.sort (TimSort)|


> **Not:** BSP entegrasyonu W’yi tam duvar sayısı n’den çok daha küçük tutar. W ≈ O(√n) olduğunda FOV ≈ O(n + √n · log√n) etkin karmaşıklığa sahiptir.

### 7.5 PhysicsEngine — Çarpışma Kontrolü

|İşlem                             |Karmaşıklık |Açıklama                      |
|----------------------------------|------------|------------------------------|
|`updatePlayerPhysics()`           |O(log n + W)|BSP sorgusu + çarpışma testi  |
|`checkCollisionWithWalls(W duvar)`|**O(W)**    |Tüm yakın duvarlar test edilir|
|AABB tek duvar testi              |O(1)        |Sabit sayıda karşılaştırma    |


> Toplam fizik güncelleme karmaşıklığı: **O(log n)** (BSP sorgusu baskın)

### 7.6 Genel Karmaşıklık Özeti (Frame başına)

```
┌─────────────────────────────────────────────────┐
│         TEK FRAME TOPLAM KOMPLEKSİTESİ          │
├────────────────────────┬────────────────────────┤
│ Bileşen                │ Karmaşıklık             │
├────────────────────────┼────────────────────────┤
│ Fizik + Çarpışma       │ O(log n)                │
│ FOV Hesaplama          │ O(W²) ≈ O(log²n)        │
│ Enemy Hareketi         │ O(1) per enemy          │
│ Çizim (drawMap)        │ O(n)  [tüm hücreler]    │
├────────────────────────┼────────────────────────┤
│ TOPLAM                 │ O(n) [çizim dominant]   │
└────────────────────────┴────────────────────────┘

n = toplam duvar/hücre sayısı
W = BSP'den dönen yerel duvar sayısı (W << n)

A* (HTTP fetch, asenkron — frame'e dahil değil):
  O(E log V) = O(8V log V) ≈ O(V log V)
  V = yürünebilir hücre sayısı
  500ms cooldown ile istekler sınırlandırılır
```

-----

## 8. Sistem Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│                    OYUN BAŞLANGICI                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  DFS ile Harita Üret    │
              │  yigitgenerateRandom    │
              │  Grid(19, 25)           │
              │  O(rows × cols)         │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  BSP Ağacı İnşa Et      │
              │  BSPNode(mapWalls)      │
              │  O(n log n)             │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │   ANA OYUN DÖNGÜSÜ      │◄─────────────┐
              │  requestAnimationFrame  │              │
              └────────────┬────────────┘              │
                           │                          │
          ┌────────────────┼────────────────────┐     │
          │                │                    │     │
┌─────────▼──────┐ ┌───────▼───────┐ ┌──────────▼──┐ │
│  Fizik Güncelle│ │ Enemy Update  │ │  Canvas Çiz  │ │
│  BSP Sorgula   │ │ Durum Makine  │ │  drawMap()   │ │
│  AABB Çarpışma │ │ + Wall Slide  │ │  enemy.draw  │ │
│  O(log n)      │ │ O(1)/enemy    │ │  O(n)        │ │
└────────────────┘ └───────┬───────┘ └─────────────┘ │
                           │                          │
              ┌────────────▼────────────┐             │
              │  A* Gerekiyor mu?        │             │
              │  (CHASE && cooldown OK) │             │
              └─────┬─────────────┬─────┘             │
                    │YES           │NO                 │
         ┌──────────▼──┐          │                   │
         │ fetch POST  │          │                   │
         │ /calculate- │          │                   │
         │ path        │          │                   │
         │ A*: O(ElogV)│          │                   │
         │ (async HTTP)│          │                   │
         └─────────────┘          └───────────────────┘
```

-----

## 9. Optimizasyonlar ve Tasarım Kararları

### 9.1 BSP ile Uzamsal Bölümleme

**Problem:** Tüm duvarlarla çarpışma testi → O(n) her frame  
**Çözüm:** BSP ağacı ile O(log n) uzamsal sorgulama

```javascript
// Yavaş: Tüm duvarları tara
walls.forEach(w => checkCollision(player, w)); // O(n)

// Hızlı: BSP ile sadece yakın duvarları al
let nearby = bspRoot.getRelevantWalls(player.x, player.y); // O(log n)
nearby.forEach(w => checkCollision(player, w)); // O(W), W << n
```

### 9.2 HTTP Fetch ile Asenkron A* (Python FastAPI)

**Problem:** A* hesaplaması ana thread’i dondurur → frame drop  
**Çözüm:** `main.py` FastAPI servisi ayrı bir süreçte çalışır; `fetch()` asenkron HTTP çağrısı ile tetiklenir

```
Ana Thread:  [Fizik][FOV][Çizim]──────[Fizik][FOV][Çizim]
                                           ↑ 60 FPS korunur
Python:             [POST isteği─────────────►][JSON yanıt geri]
```

```javascript
// EnemyAI.js — yasinrequestPath()
fetch("http://localhost:8000/calculate-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, startCoords, targetCoords, grid })
})
.then(res => res.json())
.then(data => this.yasinreceivePath(data.path));
```

### 9.3 EnemyAI Optimizasyonları

|#|Optimizasyon                  |Yöntem                           |Kazanım                         |
|-|------------------------------|---------------------------------|--------------------------------|
|1|Rastgele hedef seçimi         |Ön hesaplanmış `walkableCells[]` |O(∞)→O(1)                       |
|2|HTTP spam önleme              |500ms cooldown timer             |Gereksiz A* istekleri engellenir|
|3|Yakın mesafe bypass           |dist<80 → doğrudan hareket       |A* maliyeti sıfır               |
|4|Durum geçişinde titreme önleme|`path=[]` YAPILMAZ (kasıtlı)     |Rota korunur, titreme azalır    |
|5|Köşe sıkışma çözümü           |path.shift() ile waypoint atlatma|Düşman takılı kalmaz            |
|6|Waypoint toleransı            |12 piksel yakınlık eşiği         |Hassas merkez arama iptal       |

### 9.4 Corner-Cutting Engeli (A* Graf — Python)

Çapraz harekette köşe sızmasını önleyen ek kontrol:

```python
# main.py — yasinget_neighbors()
if abs(d[0]) == 1 and abs(d[1]) == 1:
    if grid[x][ny] == 1 or grid[nx][y] == 1:
        continue  # Köşeden sızma engeli
```

### 9.5 Wall Sliding (Duvar Kaydırma)

Hem oyuncu hem düşman duvara çarptığında kilitlenmez, eksen bazlı hareket sürdürür:

```javascript
// PhysicsEngine.js & EnemyAI.js
const canMoveX = !checkCollisionWithWalls(nextX, this.y, walls);
const canMoveY = !checkCollisionWithWalls(this.x, nextY, walls);
if (canMoveX) this.x = nextX;
else if (canMoveY) this.y = nextY;
```

### 9.6 Prosedürel Harita ve Skor Sistemi

Her oyun oturumunda `yigitgenerateRandomGrid()` ile farklı bir labirent oluşturulur. Skor sistemi:

- Düşman yakalanması: **-100 puan**
- Zafer alanına ulaşma: **+100 puan**

-----

## 10. Modül Sorumlulukları Özeti

|Dosya             |Birincil Sorumluluk                      |Bağımlılıklar         |
|------------------|-----------------------------------------|----------------------|
|`BspTree.js`      |Uzamsal bölümleme, duvar sorgulaması     |—                     |
|`PhysicsEngine.js`|Hareket fiziği, AABB çarpışma, wall slide|BspTree               |
|`player.js`       |Oyuncu varlığı, tuş takibi ve çizimi     |—                     |
|`EnemyAI.js`      |Düşman durumu, HTTP A* isteği, hareket   |main.py, PhysicsEngine|
|`main.py`         |FastAPI A* servisi, MinHeap pathfinding  |—                     |
|`vision.js`       |Raycasting FOV hesaplama ve çizimi       |BspTree               |
|`game.js`         |Ana döngü, harita üretimi, koordinatör   |Hepsi                 |
|`index.html`      |Giriş noktası, canvas, UI menüsü         |game.js               |

-----
## 11. Uygulama Kurulum Rehberi ve Çalışma Gösterimi
### 11.1 Sistemin Docker Konteyner Ortamında Koşturulması
Geliştirilen mikroservis mimarisinin ve ilgili bağımlılık paketlerinin izole bir ekosistemde, platform bağımsız çalışabilmesi amacıyla Docker entegrasyonu gerçekleştirilmiştir. Çalıştırma sürecini başlatmak için aşağıdaki adımların sırasıyla uygulanması gerekmektedir:

1. **Kaynak Kodların Yerel Ortama Aktarılması:** Projenin ve Docker konfigürasyon dosyalarının en güncel sürümünün yerel dizine konumlandırıldığından (ilgili Git branch'inin kontrol edildiğinden) emin olunmalıdır.
2. **Docker Servis Kontrolü:** Sistemde **Docker Desktop** servisinin aktif ve çalışır durumda (Engine Running) olduğu doğrulanmalıdır.
3. **Uçbirim Erişimi:** Proje kök dizini (root directory) üzerinde bir uçbirim (Terminal / Komut İstemi) oturumu açılmalıdır.
4. **Konteynerlerin İnşa Edilmesi ve Başlatılması:** İlgili servis imajlarının sıfırdan inşa edilmesi (build) ve konteynerlerin ayağa kaldırılması için aşağıdaki komut yürütülmelidir:
   ```bash
   docker-compose up --build
5. **Yerel Sunucu Erişimi:** Konteynerizasyon süreci başarıyla tamamlandıktan sonra, uygulamaya yerel sunucu üzerinden erişim sağlamak için tarayıcı adres çubuğuna http://localhost:80 protokolü girilmelidir.



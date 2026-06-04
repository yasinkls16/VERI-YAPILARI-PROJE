# 2D BSP Stealth Game — Teknik Dokümantasyon

----

## Geliştirici Ekibi
| Rol | İsim |
| :--- | :--- |
| **Takım Lideri & Yapay Zeka Mimarı** — Navigasyon Algoritması (Graf, Min-Heap, A*), Düşman Yapay Zekası, Mikroservis Mimarisi Kurulumu, Kod Entegrasyonu ve Hata Ayıklama (Debugging) | Yasin Can Keleş |
| **Yönetmen & Sistem Mimarı** — Level Design, Otomatik Harita Oluşturma, Game Loop Mimarisi, Arayüz (UI) Mimarisi, Puan Sistemi, Sentetik Veri, Kod Entegrasyonu ve Hata Ayıklama (Debugging) | Yiğit Toklu |
| **Uzamsal Mimar** — BSP Ağacı ve Temel Geometri | Süha Tüfekçi |
| **Optik Mühendisi** — Raycasting ve Görüş Alanı (LoS), Readme dosyası oluşturma. | Şevval Küçükyılmaz |
| **Oyun Motoru ve Fizik** — HTML5 Canvas ve Çarpışma | Ayşegül Karataş |

-----

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
1. [Uygulama Kurulum Rehberi ve Çalışma Gösterimi](#11-uygulama-kurulum-rehberi-ve-çalışma-gösterimi)

-----

## 1. Proje Genel Bakış

Bu proje, klasik DOOM-dönem mimarisinden ilham alan, 2D tarayıcı tabanlı bir gizlilik (stealth) oyunudur. Temel teknik hedefler:

- **BSP Ağacı** ile uzamsal bölümleme ve O(log n) duvar sorgulaması
- **A* Algoritması** ile Web Worker üzerinde asenkron yol bulma
- **AABB Çarpışma Algılama** ile fizik motoru entegrasyonu
- **Raycasting tabanlı Görüş Alanı (FOV)** hesaplama
- **Durum Makinesi (State Machine)** tabanlı düşman yapay zekası

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
     │   Player extends          │
     │   PhysicalEntity          │
     └────────────┬──────────────┘
                  │
     ┌────────────▼──────────────┐        ┌──────────────────────┐
     │          game.js          │◄───────►│    EnemyAI.js        │
     │     Ana Oyun Döngüsü      │         │  EnemyAI (State      │
     │     requestAnimationFrame  │         │  Machine + A* req.)  │
     └───────────────────────────┘         └──────────┬───────────┘
                                                       │ postMessage()
                                           ┌───────────▼───────────┐
                                           │    astarWorker.js      │
                                           │  MinHeap, Graph, Node  │
                                           │  A* Pathfinding        │
                                           └───────────────────────┘
```

-----

## 3. UML Sınıf Diyagramları

### 3.1 Tam Sınıf Hiyerarşisi

```
┌──────────────────────────────────────┐
│           PhysicalEntity             │
├──────────────────────────────────────┤
│ + x: number                          │
│ + y: number                          │
│ + vx: number                         │
│ + vy: number                         │
│ + ax: number                         │
│ + ay: number                         │
│ + friction: number = 0.82            │
│ + maxSpeed: number = 6               │
│ + width: number = 20                 │
│ + height: number = 20                │
├──────────────────────────────────────┤
│ + constructor(startX, startY)        │
└──────────────┬───────────────────────┘
               │ extends (kalıtım)
               ▼
┌──────────────────────────────────────┐
│               Player                 │
├──────────────────────────────────────┤
│  (inherited fields from              │
│   PhysicalEntity)                    │
├──────────────────────────────────────┤
│ + constructor(startX, startY)        │
│ + draw(ctx: CanvasContext): void     │
└──────────────────────────────────────┘


┌──────────────────────────────────────┐
│           PhysicsEngine              │
├──────────────────────────────────────┤
│ + keys: { ArrowUp, ArrowDown,        │
│           ArrowLeft, ArrowRight,     │
│           w, s, a, d }: boolean      │
├──────────────────────────────────────┤
│ + constructor()                      │
│ + initInputListeners(): void         │
│ + pixelToGrid(px, py): {x,y}        │
│ + gridToPixel(gx, gy): {x,y}        │
│ + applyKeyboardInput(char): void     │
│ + updatePlayerPhysics(char,          │
│     deltaTime, bspRootNode): void    │
│ + checkCollisionWithWalls(           │
│     nextX, nextY, walls[]): boolean  │
└──────────────────────────────────────┘


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

┌──────────────────────────────────────────────────────┐
│                     BSPNode                           │
├──────────────────────────────────────────────────────┤
│ + partitionLine: Wall | null                          │
│ + front: BSPNode | null                              │
│ + back: BSPNode | null                               │
│ + walls: Wall[]                                       │
├──────────────────────────────────────────────────────┤
│ + constructor(walls: Wall[])                          │
│ + buildTree(walls: Wall[]): void                      │
│ + classifyPoint(line, x, y): string                   │
│   → "FRONT" | "BACK" | "COLLINEAR"                   │
│ + classifyWall(line, wall): string                    │
│   → "FRONT" | "BACK" | "COLLINEAR" | "SPANNING"      │
│ + getIntersection(line1, line2): {x,y} | null        │
│ + getRelevantWalls(targetX, targetY): Wall[]          │
└──────────────────────────────────────────────────────┘
         BSPNode "front / back" ──────► BSPNode (özyinelemeli)


┌──────────────────────────────────────────────────────┐
│                    EnemyAI                            │
├──────────────────────────────────────────────────────┤
│ + id: string                                          │
│ + x: number                                           │
│ + y: number                                           │
│ + state: "WANDER" | "CHASE"                          │
│ + path: [number, number][]                            │
│ + isWaitingForWorker: boolean                         │
│ + lastPathRequestTime: number                         │
│ + pathRequestCooldown: number = 500                   │
├──────────────────────────────────────────────────────┤
│ + constructor(id, startX, startY)                     │
│ + update(playerX, playerY, canSeePlayer,              │
│           aiWorker, walkableCells): void              │
│ + changeState(newState): void                         │
│ + getRandomWalkableCoords(cells): [row,col]           │
│ + requestPath(worker, targetCoords): void             │
│ + receivePath(calculatedPath): void                   │
│ + moveAlongPath(): void                               │
└──────────────────────────────────────────────────────┘


┌──────────────────────────────────────┐
│           VisionSystem               │
├──────────────────────────────────────┤
│ + bspTree: BSPNode                   │
├──────────────────────────────────────┤
│ + constructor(bspTree)               │
│ + getIntersection(ray, wall)         │
│   : {x,y,dist,angle} | null         │
│ + calculateFOV(enemyX, enemyY)       │
│   : point[]                          │
│ + draw(ctx, enemyX, enemyY,          │
│         polygonPoints): void         │
└──────────────────────────────────────┘


── astarWorker.js (Web Worker — ayrı thread) ──────────────────────

┌──────────────────────────────────────┐
│              MinHeap                 │
├──────────────────────────────────────┤
│ + heap: Node[]                       │
├──────────────────────────────────────┤
│ + push(node): void                   │
│ + pop(): Node | null                 │
│ + bubbleUp(): void                   │
│ + bubbleDown(): void                 │
│ + size(): number                     │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│               Node                   │
├──────────────────────────────────────┤
│ + x: number                          │
│ + y: number                          │
│ + g: number  (gerçek maliyet)        │
│ + h: number  (tahmin maliyet)        │
│ + f: number  (g + h)                 │
│ + parent: Node | null                │
├──────────────────────────────────────┤
│ + constructor(x, y)                  │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│               Graph                  │
├──────────────────────────────────────┤
│ + nodes: Map<string, Neighbor[]>     │
├──────────────────────────────────────┤
│ + constructor(grid)                  │
│ + buildGraph(grid): void             │
│ + getNeighbors(x, y): Neighbor[]     │
└──────────────────────────────────────┘
```

-----

## 4. UML Sıralama Diyagramları

### 4.1 Oyun Döngüsü — Tek Frame Akışı

```
Tarayıcı          game.js          PhysicsEngine       BSPNode          Canvas
   │                 │                   │                  │               │
   │─requestAnimFrame►│                   │                  │               │
   │                 │                   │                  │               │
   │                 │──updatePlayer─────►│                  │               │
   │                 │    Physics()       │                  │               │
   │                 │                   │──applyKeyboard──►│               │
   │                 │                   │    Input()        │               │
   │                 │                   │                  │               │
   │                 │                   │──getRelevant─────►│               │
   │                 │                   │   Walls(nextX,Y)  │               │
   │                 │                   │◄─walls[]──────────│               │
   │                 │                   │                  │               │
   │                 │                   │──checkCollision──►│               │
   │                 │                   │   WithWalls()     │               │
   │                 │                   │◄─ true/false ─────│               │
   │                 │                   │                  │               │
   │                 │◄──────────────────│                  │               │
   │                 │                   │                  │               │
   │                 │──drawMap()────────────────────────────────────────►  │
   │                 │──player.draw()────────────────────────────────────►  │
   │                 │                   │                  │               │
   │◄────────────────│                   │                  │               │
   │  requestAnim    │                   │                  │               │
   │  Frame()        │                   │                  │               │
```

### 4.2 EnemyAI — A* Yol Bulma Asenkron Akışı

```
game.js         EnemyAI          astarWorker.js        EnemyAI
   │               │                    │                 │
   │──update()────►│                    │                 │
   │               │                    │                 │
   │               │ canSeePlayer=true  │                 │
   │               │──changeState──────►│                 │
   │               │  ("CHASE")         │                 │
   │               │                    │                 │
   │               │──requestPath()     │                 │
   │               │──postMessage({─────►                 │
   │               │   type:'path',     │                 │
   │               │   startCoords,     │                 │
   │               │   targetCoords     │                 │
   │               │  })                │                 │
   │               │                    │                 │
   │               │   isWaiting=true   │                 │
   │               │                    │                 │
   │               │                    │──aStar()──────► │
   │               │                    │  [hesaplama]    │
   │               │                    │                 │
   │               │                    │◄─path[]─────────│
   │               │◄──postMessage({────│                 │
   │               │   enemyId, path    │                 │
   │               │  })                │                 │
   │               │                    │                 │
   │               │──receivePath()     │                 │
   │               │   isWaiting=false  │                 │
   │               │   this.path=path   │                 │
   │               │                    │                 │
   │               │──moveAlongPath()   │                 │
   │◄──────────────│                    │                 │
```

### 4.3 VisionSystem — FOV Hesaplama

```
game.js          EnemyAI         VisionSystem          BSPNode
   │               │                  │                    │
   │──(her frame)──►│                  │                    │
   │               │──calculateFOV────►│                    │
   │               │  (enemyX,enemyY)  │                    │
   │               │                  │──getRelevant───────►│
   │               │                  │   Walls(ex, ey)     │
   │               │                  │◄──walls[]───────────│
   │               │                  │                    │
   │               │                  │ [her duvar köşesi   │
   │               │                  │  için 3 ışın gönder]│
   │               │                  │──getIntersection()  │
   │               │                  │  (ray, wall)        │
   │               │                  │──sort by angle      │
   │               │◄─polygonPoints[]─│                    │
   │               │                  │                    │
   │               │──draw(ctx,       │                    │
   │               │   polygon)       │                    │
   │◄──────────────│                  │                    │
```

-----

## 5. UML Durum Diyagramı — EnemyAI

```
                    ┌─────────────┐
               ───► │   WANDER    │
               │    └──────┬──────┘
               │           │
               │    canSeePlayer == true
               │           │
               │           ▼
               │    ┌─────────────┐
               └────│    CHASE    │
          !canSeePlayer    │
                    └──────┬──────┘
                           │
                   dist < 80 && canSeePlayer
                           │
                           ▼
                  ┌─────────────────────┐
                  │  DOĞRUDAN TAKİP     │
                  │  (A* bypass edilir) │
                  │  dist > 15 → hareket│
                  └─────────────────────┘

Durum Geçiş Tablosu:
┌──────────┬─────────────────────────┬──────────┐
│ Mevcut   │ Koşul                   │ Sonraki  │
├──────────┼─────────────────────────┼──────────┤
│ WANDER   │ canSeePlayer == true    │ CHASE    │
│ CHASE    │ !canSeePlayer           │ WANDER   │
│ CHASE    │ dist < 80 && görüyor    │ DIRECT   │
│ DIRECT   │ dist >= 80              │ CHASE    │
└──────────┴─────────────────────────┴──────────┘

Her durum geçişinde:
  • path = []          (eski rota sıfırlanır)
  • isWaitingForWorker = false
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
```

**Sınıflandırma Mantığı (Cross Product):**

```
cross = dx*(y - line.y1) - dy*(x - line.x1)

cross > 0.001  → FRONT
cross < -0.001 → BACK
otherwise      → COLLINEAR
```

### 6.2 A* Pathfinding (MinHeap ile)

```
f(n) = g(n) + h(n)

g(n) = başlangıçtan n'e gerçek maliyet
       düz hareket: 1.0
       çapraz hareket: √2 ≈ 1.414

h(n) = Chebyshev Distance (8-yönlü hareket için optimal)
       h = (dx + dy) + (√2 - 2) × min(dx, dy)

MinHeap yapısı: O(log n) push/pop ile f değerine göre sıralı kuyruk
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

### 6.4 MinHeap İç Yapısı

```
Dizi temsili (örnek):
Index:  0    1    2    3    4
f:     [1.2, 2.4, 1.8, 3.1, 2.9]

Ebeveyn-çocuk ilişkisi:
  parent(i)      = floor((i-1) / 2)
  leftChild(i)   = 2*i + 1
  rightChild(i)  = 2*i + 2

push → sona ekle → bubbleUp    → O(log n)
pop  → kökü al  → bubbleDown   → O(log n)
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

### 7.2 A* Pathfinding (astarWorker.js)

|İşlem                   |Karmaşıklık   |Açıklama                                               |
|------------------------|--------------|-------------------------------------------------------|
|`Graph.buildGraph(grid)`|O(V + E)      |V = yürünebilir hücre sayısı, E = komşuluk bağlantıları|
|`MinHeap.push()`        |O(log V)      |bubbleUp ile heap özelliği korunur                     |
|`MinHeap.pop()`         |O(log V)      |bubbleDown ile heap özelliği korunur                   |
|`aStar()` toplam        |**O(E log V)**|Her kenar için heap işlemi; E ≈ 8V (8-yönlü)           |
|Yol geri izleme         |O(P)          |P = yol uzunluğu                                       |

**Web Worker Avantajı:** A* hesaplaması ana thread’i bloklamaz. UI 60 FPS’de çalışmaya devam eder.

### 7.3 EnemyAI

|İşlem                      |Karmaşıklık  |Açıklama                                                      |
|---------------------------|-------------|--------------------------------------------------------------|
|`update()`                 |O(1) amortize|Durum geçişi + path isteği (cooldown ile sınırlı)             |
|`getRandomWalkableCoords()`|**O(1)**     |Ön belleğe alınmış `walkableCells[]` dizisinden rastgele index|
|`moveAlongPath()`          |O(1)         |path[0] hedefine doğru hareket; hedefe ulaşınca shift()       |
|`changeState()`            |O(1)         |Durum değişkeni atama + path temizleme                        |
|Yakın mesafe takip         |O(1)         |Öklid mesafesi + normalize vektör hareketi                    |


> **OPTİMİZASYON:** `getRandomWalkableCoords()`, önceden hesaplanmış `walkableCells` dizisini kullanır. Orijinal O(∞) potansiyelli sonsuz döngü yönteminin yerini O(1) tek indexleme alır.

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
│ Çizim (drawMap)        │ O(n)  [tüm duvarlar]    │
├────────────────────────┼────────────────────────┤
│ TOPLAM                 │ O(n) [çizim dominant]   │
└────────────────────────┴────────────────────────┘

n = toplam duvar sayısı
W = BSP'den dönen yerel duvar sayısı (W << n)

A* (Web Worker, asenkron — frame'e dahil değil):
  O(E log V) = O(8V log V) ≈ O(V log V)
  V = yürünebilir hücre sayısı
```

-----

## 8. Sistem Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────┐
│                    OYUN BAŞLANGICI                           │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────▼────────────┐
              │  BSP Ağacı İnşa Et      │
              │  BSPNode(walls)         │
              │  O(n log n)             │
              └────────────┬────────────┘
                           │
              ┌────────────▼────────────┐
              │  Worker'a grid gönder   │
              │  type: 'init'           │
              │  Graph.buildGraph()     │
              │  O(V + E)               │
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
│  AABB Çarpışma │ │ + Hareket     │ │  player.draw │ │
│  O(log n)      │ │ O(1)/enemy    │ │  O(n)        │ │
└────────────────┘ └───────┬───────┘ └─────────────┘ │
                           │                          │
              ┌────────────▼────────────┐             │
              │  A* Gerekiyor mu?        │             │
              │  (CHASE && cooldown OK) │             │
              └─────┬─────────────┬─────┘             │
                    │YES           │NO                 │
         ┌──────────▼──┐          │                   │
         │ Worker'a    │          │                   │
         │ postMessage │          │                   │
         │ A*: O(ElogV)│          │                   │
         │ (async)     │          │                   │
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

### 9.2 Web Worker ile Asenkron A*

**Problem:** A* hesaplaması ana thread’i dondurur → frame drop  
**Çözüm:** `astarWorker.js` ayrı bir thread’de çalışır

```
Ana Thread:  [Fizik][FOV][Çizim]──────[Fizik][FOV][Çizim]
                                           ↑ 60 FPS korunur
Worker:                 [A* hesaplama───────►][sonuç geri]
```

### 9.3 EnemyAI Optimizasyonları

|#|Optimizasyon                  |Yöntem                          |Kazanım                      |
|-|------------------------------|--------------------------------|-----------------------------|
|1|Rastgele hedef seçimi         |Ön hesaplanmış `walkableCells[]`|O(∞)→O(1)                    |
|2|Worker spam önleme            |500ms cooldown timer            |%50 worker yükü azalır       |
|3|Yakın mesafe bypass           |dist<80 → doğrudan hareket      |A* maliyeti sıfır            |
|4|Durum geçişinde rota temizleme|`path=[]`, `isWaiting=false`    |Eskimiş rota problemi çözülür|

### 9.4 Corner-Cutting Engeli (A* Graf)

Çapraz harekette köşe sızmasını önleyen ek kontrol:

```javascript
// Çapraz hareket ise
if (Math.abs(dir[0]) === 1 && Math.abs(dir[1]) === 1) {
    if (grid[x][newY] === 1 || grid[newX][y] === 1) continue; // Köşeden sızma engeli
}
```

-----

## 10. Modül Sorumlulukları Özeti

|Dosya             |Birincil Sorumluluk                 |Bağımlılıklar|
|------------------|------------------------------------|-------------|
|`BspTree.js`      |Uzamsal bölümleme, duvar sorgulaması|—            |
|`PhysicsEngine.js`|Hareket fiziği, AABB çarpışma       |BspTree      |
|`player.js`       |Oyuncu varlığı ve çizimi            |PhysicsEngine|
|`EnemyAI.js`      |Düşman durumu, A* isteği, hareket   |astarWorker  |
|`astarWorker.js`  |MinHeap A* pathfinding (async)      |—            |
|`vision.js`       |Raycasting FOV hesaplama ve çizimi  |BspTree      |
|`game.js`         |Ana döngü, koordinatör              |Hepsi        |
|`index.html`      |Giriş noktası, canvas, UI           |game.js      |


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

### 11.2 Oyun Mekanikleri ve Oynanış Gösterimi
Geliştirilen uygulamanın temel oynanış dinamiklerini, kullanıcı arayüzü etkileşimlerini ve düşman karakterlerin oyuncuyu tespit edip yakalama senaryolarını içeren uygulama gösterim videosu aşağıda yer almaktadır:







































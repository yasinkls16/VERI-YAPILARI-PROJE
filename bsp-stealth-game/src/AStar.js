const MinHeap = require('./MinHeap');

// Haritadaki her bir hücreyi (koordinatı) temsil edecek sınıf
class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.g = 0; // Başlangıçtan bu noktaya gelene kadar harcanan maliyet
        this.h = 0; // Bu noktadan hedefe olan kuş uçuşu tahmini maliyet (Heuristic)
        this.f = 0; // Toplam maliyet (g + h)
        this.parent = null; // Yolu geriye doğru çizebilmek için geldiği düğüm
    }
}

// Öklid (Euclidean) mesafesi: İki nokta arasındaki kuş uçuşu uzaklık formülü
function heuristic(node, targetNode) {
    return Math.sqrt(Math.pow(node.x - targetNode.x, 2) + Math.pow(node.y - targetNode.y, 2));
}

// Ana A* Algoritması
// grid: 2 boyutlu dizi (0: yol, 1: duvar)
// startCoords: [x, y], targetCoords: [x, y]
function aStar(grid, startCoords, targetCoords) {
    const rows = grid.length;
    const cols = grid[0].length;
    
    let startNode = new Node(startCoords[0], startCoords[1]);
    let targetNode = new Node(targetCoords[0], targetCoords[1]);

    let openSet = new MinHeap(); // İncelenecek düğümler (F değeri en düşük olan en üstte)
    let closedSet = new Set();   // İncelenmiş ve kapatılmış düğümlerin koordinatları

    openSet.push(startNode);

    // 8 Yönlü hareket (Sağ, Sol, Aşağı, Yukarı ve Çaprazlar)
    const directions = [
        [0, 1], [1, 0], [0, -1], [-1, 0],  // Düz yönler
        [-1, -1], [-1, 1], [1, -1], [1, 1] // Çapraz yönler
    ];

    while (openSet.size() > 0) {
        let current = openSet.pop(); // F maliyeti en düşük olanı al
        
        // Hedefe ulaştık mı?
        if (current.x === targetNode.x && current.y === targetNode.y) {
            let path = [];
            let temp = current;
            while (temp !== null) {
                path.push([temp.x, temp.y]);
                temp = temp.parent;
            }
            return path.reverse(); // Yolu baştan sona doğru çevirip döndür
        }

        // Bulunduğumuz düğümü 'incelendi' olarak işaretle
        closedSet.add(`${current.x},${current.y}`);

        // Komşuları (etrafındaki 8 kareyi) kontrol et
        for (let dir of directions) {
            let newX = current.x + dir[0];
            let newY = current.y + dir[1];

            // 1. Sınır Kontrolü: Haritanın dışına çıkıyor mu?
            if (newX < 0 || newY < 0 || newX >= rows || newY >= cols) continue;
            
            // 2. Engel Kontrolü: Burası duvar mı? (grid'de 1 ise duvardır)
            if (grid[newX][newY] === 1) continue;
            
            // 3. Ziyaret Kontrolü: Daha önce buraya baktık mı?
            if (closedSet.has(`${newX},${newY}`)) continue;

            // Çapraz hareketlerin maliyeti kök 2 (yaklaşık 1.414), düz hareketlerin maliyeti 1
            let moveCost = (Math.abs(dir[0]) === 1 && Math.abs(dir[1]) === 1) ? Math.SQRT2 : 1;
            let tentativeG = current.g + moveCost;

            let neighbor = new Node(newX, newY);
            neighbor.g = tentativeG;
            neighbor.h = heuristic(neighbor, targetNode);
            neighbor.f = neighbor.g + neighbor.h;
            neighbor.parent = current;

            // Düğümü incelenecekler listesine ekle
            openSet.push(neighbor);
        }
    }
    
    // Açık liste bitti ve hedefe ulaşılamadıysa yol yok demektir
    return []; 
}

module.exports = aStar;
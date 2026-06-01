// astarWorker.js

// ==========================================
// 1. MIN-HEAP (ÖNCELİKLİ KUYRUK) VERİ YAPISI
// ==========================================

let globalGraph = null; // Global bir grafik örneği, her rota isteğinde yeniden oluşturulacak

class MinHeap {
    constructor() {
        this.heap = [];
    }

    push(node) {
        this.heap.push(node);
        this.bubbleUp();
    }

    bubbleUp() {
        let index = this.heap.length - 1;
        while (index > 0) {
            let parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[index].f < this.heap[parentIndex].f) {
                [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
                index = parentIndex;
            } else break;
        }
    }

    pop() {
        if (this.heap.length === 0) return null;
        if (this.heap.length === 1) return this.heap.pop();
        
        const top = this.heap[0];
        this.heap[0] = this.heap.pop();
        this.bubbleDown();
        return top;
    }

    bubbleDown() {
        let index = 0;
        while (true) {
            let left = 2 * index + 1;
            let right = 2 * index + 2;
            let smallest = index;

            if (left < this.heap.length && this.heap[left].f < this.heap[smallest].f) {
                smallest = left;
            }
            if (right < this.heap.length && this.heap[right].f < this.heap[smallest].f) {
                smallest = right;
            }
            
            if (smallest !== index) {
                [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
                index = smallest;
            } else break;
        }
    }

    size() { return this.heap.length; }
}

// ==========================================
// 2. GRAF (GRAPH) VE DÜĞÜM (NODE) YAPILARI
// ==========================================
class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.g = 0;
        this.h = 0;
        this.f = 0;
        this.parent = null;
    }
}

class Graph {
    constructor(grid) {
        this.nodes = new Map(); // Komşuluk Listesi (Adjacency List)
        this.buildGraph(grid);
    }

    buildGraph(grid) {
        const rows = grid.length;
        const cols = grid[0].length;
        const directions = [
            [0, 1], [1, 0], [0, -1], [-1, 0],  // Düz yönler
            [-1, -1], [-1, 1], [1, -1], [1, 1] // Çapraz yönler
        ];

        for (let x = 0; x < rows; x++) {
            for (let y = 0; y < cols; y++) {
                if (grid[x][y] === 1) continue; // Duvarları graf'a ekleme

                let nodeId = `${x},${y}`;
                this.nodes.set(nodeId, []);

                for (let dir of directions) {
                    let newX = x + dir[0];
                    let newY = y + dir[1];

                    // Harita sınırları içi kontrolü ve duvar kontrolü
                    if (newX >= 0 && newY >= 0 && newX < rows && newY < cols && grid[newX][newY] === 0) {
                        
                        // CORNER-CUTTING (Köşeden Sızma) ENGELİ
                        if (Math.abs(dir[0]) === 1 && Math.abs(dir[1]) === 1) {
                            if (grid[x][newY] === 1 || grid[newX][y] === 1) continue; 
                        }

                        let moveCost = (Math.abs(dir[0]) === 1 && Math.abs(dir[1]) === 1) ? Math.SQRT2 : 1;
                        
                        this.nodes.get(nodeId).push({ x: newX, y: newY, cost: moveCost });
                    }
                }
            }
        }
    }

    getNeighbors(x, y) {
        return this.nodes.get(`${x},${y}`) || [];
    }
}

// ==========================================
// 3. A* PATHFINDING ALGORİTMASI
// ==========================================
function heuristic(node, targetNode) {
    // Chebyshev (Diagonal) Distance Optimizasyonu
    let dx = Math.abs(node.x - targetNode.x);
    let dy = Math.abs(node.y - targetNode.y);
    return (dx + dy) + (Math.SQRT2 - 2) * Math.min(dx, dy);
}

function aStar(startCoords, targetCoords) {
    if (!globalGraph) return [];

    let startNode = new Node(startCoords[0], startCoords[1]);
    let targetNode = new Node(targetCoords[0], targetCoords[1]);

    let openSet = new MinHeap();
    let closedSet = new Set();
    openSet.push(startNode);

    while (openSet.size() > 0) {
        let current = openSet.pop();
        if (closedSet.has(`${current.x},${current.y}`)) continue;

        if (current.x === targetNode.x && current.y === targetNode.y) {
            let path = [];
            let temp = current;
            while (temp !== null) {
                path.push([temp.x, temp.y]);
                temp = temp.parent;
            }
            return path.reverse();
        }

        closedSet.add(`${current.x},${current.y}`);
        let neighbors = globalGraph.getNeighbors(current.x, current.y);

        for (let neighborInfo of neighbors) {
            if (closedSet.has(`${neighborInfo.x},${neighborInfo.y}`)) continue;

            let neighborNode = new Node(neighborInfo.x, neighborInfo.y);
            neighborNode.g = current.g + neighborInfo.cost;
            neighborNode.h = heuristic(neighborNode, targetNode);
            neighborNode.f = neighborNode.g + neighborNode.h;
            neighborNode.parent = current;
            openSet.push(neighborNode);
        }
    }
    return [];
}

// ==========================================
// 4. WEB WORKER İLETİŞİM KATI (ASENKRON YAPI)
// ==========================================
self.onmessage = function(event) {
    const { type, data } = event.data;

    // 'update' tipini ekleyerek grafın baştan oluşturulmasına izin veriyoruz
    if (type === 'init' || type === 'update') {
        globalGraph = new Graph(data.grid);
        console.log("Worker: Yeni harita grafı hafızaya alındı.");
    } 
    else if (type === 'path') {
        const path = aStar(data.startCoords, data.targetCoords);
        self.postMessage({ enemyId: data.id, path: path });
    }
};
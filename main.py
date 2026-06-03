# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math
import heapq

app = FastAPI()

# Oyun tarayıcıda farklı bir portta çalışacağı için CORS izni veriyoruz
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Oyundan gelecek verinin iskeleti
class PathRequest(BaseModel):
    id: int
    startCoords: list[int]
    targetCoords: list[int]
    grid: list[list[int]]

# Chebyshev (Diagonal) Distance Optimizasyonu
def yasinheuristic(node, target):
    dx = abs(node[0] - target[0])
    dy = abs(node[1] - target[1])
    return (dx + dy) + (math.sqrt(2) - 2) * min(dx, dy)

# Komşu düğümleri (Grid hücrelerini) ve hareket maliyetlerini bulan fonksiyon
def yasinget_neighbors(x, y, grid):
    rows = len(grid)
    cols = len(grid[0])
    directions = [
        (0, 1), (1, 0), (0, -1), (-1, 0),
        (-1, -1), (-1, 1), (1, -1), (1, 1)
    ]
    neighbors = []
    
    for d in directions:
        nx, ny = x + d[0], y + d[1]
        
        # Harita sınırları içi ve duvar (1) kontrolü
        if 0 <= nx < rows and 0 <= ny < cols and grid[nx][ny] == 0:
            
            # Corner-cutting (Köşeden Sızma) Engeli
            if abs(d[0]) == 1 and abs(d[1]) == 1:
                if grid[x][ny] == 1 or grid[nx][y] == 1:
                    continue
            
            move_cost = math.sqrt(2) if (abs(d[0]) == 1 and abs(d[1]) == 1) else 1
            neighbors.append((nx, ny, move_cost))
            
    return neighbors

# Rota hesaplama uç noktası (Endpoint)
@app.post("/calculate-path")
def yasincalculate_path(req: PathRequest):
    start = tuple(req.startCoords)
    target = tuple(req.targetCoords)
    grid = req.grid

    # Min-Heap kullanarak A-Yıldız algoritması
    open_set = []
    heapq.heappush(open_set, (0, start))
    
    came_from = {}
    g_score = {start: 0}

    while open_set:
        current = heapq.heappop(open_set)[1]

        # Hedefe ulaşıldıysa rotayı geriye doğru oluştur
        if current == target:
            path = []
            while current in came_from:
                path.append(list(current))
                current = came_from[current]
            path.reverse()
            return {"id": req.id, "path": path}

        for nx, ny, cost in yasinget_neighbors(current[0], current[1], grid):
            neighbor = (nx, ny)
            tentative_g = g_score[current] + cost
            
            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score = tentative_g + yasinheuristic(neighbor, target)
                heapq.heappush(open_set, (f_score, neighbor))

    # Yol bulunamazsa boş liste dön
    return {"id": req.id, "path": []}
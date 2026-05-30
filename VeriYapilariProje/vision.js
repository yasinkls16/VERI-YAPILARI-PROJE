class VisionSystem {
    constructor(bspTree) {
        this.bspTree = bspTree; // 1. kişinin hazırladığı ağaç
    }

    // İki doğrunun kesişim noktasını bulur
    getIntersection(ray, segment) {
        // ray: {x, y, angle}, segment: {p1: {x, y}, p2: {x, y}}
        // Standart line-line intersection matematiği burada uygulanır
        // ...
    }

    // Düşman için görüş poligonunu hesaplar
    calculateFOV(enemyX, enemyY, wallSegments) {
        let points = [];
        
        // 1. BSP üzerinden sadece ilgili duvarları filtrele (Optimizasyon)
        const relevantWalls = this.bspTree.getNearbyWalls(enemyX, enemyY);

        // 2. Her duvarın uç noktasına ışın gönder
        relevantWalls.forEach(wall => {
            const angles = [
                Math.atan2(wall.p1.y - enemyY, wall.p1.x - enemyX),
                Math.atan2(wall.p2.y - enemyY, wall.p2.x - enemyX)
            ];

            angles.forEach(angle => {
                // Her uç noktanın hafif sağına ve soluna da ışın atılır (boşluk kalmaması için)
                [angle - 0.0001, angle, angle + 0.0001].forEach(a => {
                    const ray = { x: enemyX, y: enemyY, angle: a };
                    let closestIntersect = null;

                    relevantWalls.forEach(s => {
                        const intersect = this.getIntersection(ray, s);
                        if (!intersect) return;
                        if (!closestIntersect || intersect.dist < closestIntersect.dist) {
                            closestIntersect = intersect;
                        }
                    });

                    if (closestIntersect) points.push(closestIntersect);
                });
            });
        });

        // 3. Noktaları açıya göre sırala (Düzgün bir poligon çizimi için)
        points.sort((a, b) => a.angle - b.angle);
        return points;
    }

    draw(ctx, enemyX, enemyY, polygonPoints) {
        ctx.fillStyle = "rgba(255, 255, 0, 0.3)"; // Yarı saydam sarı görüş alanı
        ctx.beginPath();
        ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
        for (let i = 1; i < polygonPoints.length; i++) {
            ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
    }
}
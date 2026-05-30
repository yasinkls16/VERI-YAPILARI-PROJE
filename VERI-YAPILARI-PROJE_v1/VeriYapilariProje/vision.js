class VisionSystem {
    constructor(bspTree) {
        this.bspTree = bspTree; 
    }

    
    getIntersection(ray, wall) {

        const x1 = ray.x;
        const y1 = ray.y;
        const x2 = ray.x + Math.cos(ray.angle) * 1000; 
        const y2 = ray.y + Math.sin(ray.angle) * 1000;

        const x3 = wall.x1;
        const y3 = wall.y1;
        const x4 = wall.x2;
        const y4 = wall.y2;

        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den === 0) return null; 

        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {
                x: x1 + t * (x2 - x1),
                y: y1 + t * (y2 - y1),
                dist: t,       
                angle: ray.angle 
            };
        }

        return null;
    }

    
    calculateFOV(enemyX, enemyY) {
        let points = [];
        
        const relevantWalls = this.bspTree.getRelevantWalls(enemyX, enemyY);

       
        relevantWalls.forEach(wall => {
            const angles = [
                Math.atan2(wall.y1 - enemyY, wall.x1 - enemyX),
                Math.atan2(wall.y2 - enemyY, wall.x2 - enemyX)
            ];

            angles.forEach(angle => {
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

        points.sort((a, b) => a.angle - b.angle);
        return points;
    }

    draw(ctx, enemyX, enemyY, polygonPoints) {
        if (!polygonPoints || polygonPoints.length === 0) return;

        ctx.fillStyle = "rgba(255, 255, 0, 0.25)"; 
        ctx.beginPath();
        
        ctx.moveTo(enemyX, enemyY); 

        for (let i = 0; i < polygonPoints.length; i++) {
            ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
        }
        
        ctx.closePath();
        ctx.fill();
    }
}
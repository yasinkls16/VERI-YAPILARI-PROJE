const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const player = new Player(50, 50);

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Ekranı temizle
    
    player.update(); // Fizik hesaplamaları
    player.draw(ctx); // Görselleştirme
    
    requestAnimationFrame(gameLoop); // Sürekli döngü
}

gameLoop();
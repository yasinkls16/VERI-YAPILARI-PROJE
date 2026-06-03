class Player extends PhysicalEntity {
    constructor(startX, startY) {
       super(startX, startY); 
    }

    draw(ctx) {
        ctx.fillStyle = "#2ecc71"; // Oyuncu yeşil renkli bir kutu olarak çizilir
        
        // Merkez koordinatından (this.x, this.y) genişlik ve yüksekliğe göre kutuyu çizer
        ctx.fillRect(
            this.x - (this.width / 2), 
            this.y - (this.height / 2), 
            this.width, 
            this.height
        );
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
} else {
    window.Player = Player;
}
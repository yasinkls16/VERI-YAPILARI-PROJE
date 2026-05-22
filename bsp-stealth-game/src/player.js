class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = 5;
        this.radius = 15;
        
        // Tuş durumlarını tutan bir obje
        this.keys = {};
        window.addEventListener("keydown", (e) => this.keys[e.key] = true);
        window.addEventListener("keyup", (e) => this.keys[e.key] = false);
    }

    update() {
        // Klavye girdilerine göre hareket (Fizik Motoru)
        if (this.keys["ArrowUp"] || this.keys["w"]) this.y -= this.speed;
        if (this.keys["ArrowDown"] || this.keys["s"]) this.y += this.speed;
        if (this.keys["ArrowLeft"] || this.keys["a"]) this.x -= this.speed;
        if (this.keys["ArrowRight"] || this.keys["d"]) this.x += this.speed;

        // Ekran dışına çıkmayı engelleme (Sınır Kontrolü)
        if (this.x < this.radius) this.x = this.radius;
        if (this.y < this.radius) this.y = this.radius;
        if (this.x > 800 - this.radius) this.x = 800 - this.radius;
        if (this.y > 600 - this.radius) this.y = 600 - this.radius;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "#3498db"; // Daha güzel bir mavi
        ctx.fill();
        ctx.closePath();
    }
}
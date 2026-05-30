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
            // f değeri en küçük olanı yukarı taşıyoruz
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

    size() { 
        return this.heap.length; 
    }
}

// Diğer dosyalardan (AStar.js) erişebilmek için dışa aktarıyoruz
module.exports = MinHeap;
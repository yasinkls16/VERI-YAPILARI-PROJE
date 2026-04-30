# 🧠 Navigasyon ve Yapay Zeka (Faz 1)

Bu branch, 2 boyutlu gizlilik oyununun otonom düşman hareketlerini yöneten yapay zeka ve navigasyon altyapısının çekirdek algoritmalarını içermektedir. Veri Yapıları projesi isterleri doğrultusunda, düşmanların harita üzerindeki engelleri (duvarları) aşarak hedefe en kısa yoldan ulaşmasını sağlayan yapılar bu modülde geliştirilmiştir.

## 🚀 Geliştirilen Özellikler ve Veri Yapıları

* **Min-Heap (Öncelikli Kuyruk):** A* algoritmasının "açık listesini" (open set) optimize etmek ve en düşük maliyetli düğümü hızlıca bulmak için sıfırdan implemente edilmiştir.
* **A* (A-Star) Pathfinding Algoritması:** Düşmanların devriye ve takip durumları için rota hesaplar. 8 yönlü hareket yeteneğine sahiptir ve engellerden kaçınır.
* **Heuristic (Sezgisel) Fonksiyon:** Düğümler arası uzaklık tahmini için Öklid (Euclidean) mesafesi kullanılmıştır.

## ⏱️ Zaman Karmaşıklığı (Big-O) Analizi

Kullanılan veri yapılarının teorik performans analizi şu şekildedir:
* **Min-Heap Ekleme (Push):** $O(\log n)$
* **Min-Heap Çıkarma (Pop):** $O(\log n)$
* **A* Algoritması Ortalama Çalışma Süresi:** $O(E \log V)$ (E: Haritadaki geçerli kenar sayısı, V: Haritadaki düğüm sayısı)

## 🚧 Sonraki Aşama (Faz 2: Mikroservis Entegrasyonu)

Şu anki yapı, algoritmaların doğruluğunu test etmek amacıyla standart bir çalışma ortamında kurgulanmıştır. İlerleyen fazlarda proje isterlerinde (B.1) belirtildiği üzere bu yapı; arayüzden gelen JSON isteklerini dinleyen, rotayı hesaplayıp geri döndüren bağımsız bir API (Mikroservis) haline getirilecek ve Dockerize edilecektir.

## 🛠️ Nasıl Çalıştırılır?

Algoritmaların 5x5 boyutunda örnek bir matris üzerinde (engellerin etrafından dolanarak) nasıl çalıştığını test etmek için terminalde şu komutu çalıştırın:

\`\`\`bash
node index.js
\`\`\`

---
**Sorumlu Geliştirici:** Yasin Can Keleş

# Faz 1: Fizik Motoru, Girdi Katmanı ve Çarpışma Mekanizmaları

**Ayşegül Karataş - 032490082 **

Bu branch, Veri Yapıları projesi isterlerinde belirtilen "Zorunlu Fonksiyonlar ve Entegrasyon (Faz 1)" aşaması kapsamında, 2 boyutlu gizlilik oyununun dünya kurallarını, gerçek zamanlı klavye girdi yönetimini ve nesnelerin uzamsal engelleri delip geçmesini önleyen fizik çekirdeğini içermektedir.

Geliştirilen bu modül; donanım düzeyindeki klavye kesmelerini anlamlı oyun hareketlerine dönüştürmek, hareketleri doğrusal fizikle yumuşatmak ve  kurulan BSP Ağacı ile entegre çalışarak çarpışma tespiti (Collision Detection) süreçlerini optimize etmek amacıyla JavaScript (Node.js) ortamında tasarlanmıştır.

---

## Geliştirilen Modüller ve Sınıf Mimarisi

* **`PhysicalEntity` (Fiziksel Varlık Sınıfı):** Oyun dünyasında hareket eden dinamik ögelerin (Oyuncu ve düşmanlar) kinetik verilerini tutan temel yapıdır. Konum ($x, y$), hız ($vx, vy$), ivme ($ax, ay$), maksimum sürat sınırı (`maxSpeed`) ve sürtünme katsayısı (`friction`) gibi nitelikleri tek bir çatı altında yönetir. Çarpışma testlerinde temel alınacak eksenlere paralel bounding box (AABB) boyutlarını tanımlar.
* **`initInputListeners` & `applyKeyboardInput` (Girdi Katmanı):** Tarayıcı düzeyindeki asenkron `keydown` ve `keyup` olaylarını dinleyerek donanımsal girdi haritasını (`this.keys`) günceller. Alınan girdileri doğrusal bir kuvvete dönüştürerek karaktere yönsel ivme kazandırır.
* **Uzamsal Koordinat Köprüsü (`pixelToGrid` & `gridToPixel`):** Grafik ekranın kullandığı sürekli piksel uzayı ile navigasyon/harita algoritmalarının (Yasin) kullandığı ayrık $32 \times 32$ piksellik hücre (matris) dünyası arasındaki çift yönlü veri dönüşümünü sağlayan **zorunlu proje isterleridir.**
* **Modüler Entegrasyon Döngüsü (`updatePlayerPhysics`):** Her karede (frame) çağrılan ana fizik fonksiyonudur. Karakterin bir sonraki karede varmak istediği "aday koordinatları" hesaplar, Süha'nın `BspTree.js` modülünden gelen `getRelevantWalls()` fonksiyonunu tetikler ve dönen yakın duvar listesini filtre olarak kullanır.
* **AABB Çarpışma Algoritması (`checkCollisionWithWalls`):** Karakterin anlık bounding box sınır hatları ile kendisine parametre olarak iletilen dikey/yatay duvar çizgi segmentleri arasında Eksenlere Paralel Kesişim Testi (**AABB vs Line Segment Collision**) uygulayarak nesnelerin duvarların içinden geçmesini kesin olarak engeller.

---

##  Performans ve Karmaşıklık (Big-O) Analizi

Projenin temel amacı olan "uzamsal optimizasyon" kapsamında, geliştirilen fizik modülünün teorik analizi şu şekildedir:
* **Eksene Paralel Kesişim Testi (AABB):** İki nesne arasındaki çarpışma denetimi $O(1)$ sabit zaman karmaşıklığı ile hesaplanır.
* **Doğrusal Tarama Problemi:** Haritada toplam $n$ adet duvar olsaydı ve fizik motoru her karede tüm duvarları tarasaydı, işlem yükü her döngüde $O(n)$ olacaktı ve harita büyüdükçe oyun kilitlenecekti.
* **BSP Entegrasyon Başarısı (Oyun Döngüsü İçinde):** Geliştirilen fizik motoru, Süha'nın BSP ağacının kök düğümünü (`bspRootNode`) girdi olarak kabul eder. Karakter hareket ederken sadece karakterin bulunduğu alt uzaya (odaya) ait ilgili duvarları sorgular. Böylece tüm haritayı taramak yerine sadece ilgili bölgedeki duvarlar test edilir ve arama karmaşıklığı ortalama durumda **$O(\log n)$** seviyesine indirilerek tam bir optimizasyon sağlanır.

---

## Sonraki Aşama (Faz 2: Entegrasyon ve API Dönüşümü)

Şu anki yapı, fizik ve girdi algoritmalarının doğruluğunu test etmek amacıyla tarayıcı ve Node.js ortamlarıyla çift yönlü uyumlu standart bir modül olarak kurgulanmıştır. İlerleyen fazlarda proje isterleri doğrultusunda bu yapı; oyun motorunun ana döngüsü (Game Loop) ile tamamen senkronize çalışacak, harita tasarımcısından gelecek JSON tabanlı gerçek harita verilerini dinamik olarak yorumlayacak ve tüm modüllerin birleştiği ana mimariye entegre edilecektir.

---

## 🛠️ Kurulum ve Test

Modülün bağımsız olarak çalışabilirliğini, girdi haritalama yeteneğini ve koordinat dönüşüm fonksiyonlarını test etmek için terminal üzerinden aşağıdaki komut kullanılabilir:
```bash
node src/PhysicsEngine.js
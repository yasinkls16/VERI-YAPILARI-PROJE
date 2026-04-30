# 🗺️ Prosedürel Harita Üretimi (Level Generation) Modülü

Bu branch, **Veri Yapıları ile BSP Ağacı Tabanlı Görüş Alanı ve Çarpışma Tespiti** projesi için dinamik ve rastgele oyun haritaları üretmekle sorumludur.

**Sorumlu:** Yiğit Toklu - 032490080

## 📌 Modülün Amacı
Oyunun tekrar oynanabilirliğini artırmak ve takım arkadaşlarımın yazdığı uzamsal algoritmaları (BSP Ağacı, Raycasting, A* Pathfinding) farklı ve öngörülemeyen senaryolarda test edebilmek için prosedürel bir harita üretim motoru geliştirilmiştir. 

Bu modül sadece görsel bir harita oluşturmakla kalmaz; aynı zamanda uzamsal algoritmaların ihtiyaç duyduğu karmaşık matematiksel veri setlerini otomatik olarak hazırlar.

## ⚙️ Teknik Detaylar ve Algoritmalar

### 1. Rastgele Labirent Üretimi (Recursive Backtracking)
Harita üretimi için **Derinlik Öncelikli Arama (DFS)** tabanlı *Recursive Backtracking* algoritması kullanılmıştır.
* Algoritma, belirlenen boyutlardaki bir matrisi (grid) duvarlarla (1) doldurur.
* Rastgele yönler seçerek yürünebilir yollar kazar.
* Çıkmaz sokaklara geldiğinde geri dönerek (backtrack) tüm haritayı tek parça, oynanabilir bir alana çevirir.

### 2. Geometrik Veri Dönüştürücü (Data Parser)
Optik Mühendisi (Raycasting) ve Uzamsal Mimar'ın (BSP Ağacı) ihtiyaç duyduğu "Duvar Çizgileri" formatını sağlamak için özel bir dönüştürücü (parser) yazılmıştır.
* Sistem 0 ve 1'lerden oluşan grid matrisini tarar.
* Hücrelerin sadece yürünebilir alana (0) bakan yüzeylerini tespit eder.
* Bu yüzeyleri `[{x1, y1, x2, y2}, ...]` formatında çizgi segmentlerine (line segments) dönüştürür.
* **Optimizasyon:** İçi dolu duvar bloklarının iç yüzeylerini veri setinden elediği için, BSP ağacına ve ışın izleme (raycasting) algoritmalarına giden işlem yükünü (node sayısını) ciddi oranda azaltır.

## 🚀 Çalıştırma ve Test Ortamı (HTML5 Canvas)
Üretilen algoritmaların test edilmesi için `harita-olusturucu.html` dosyası oluşturulmuştur.
* Dosya herhangi bir tarayıcıda açıldığında sistem otomatik olarak yeni bir harita üretir.
* Canvas üzerindeki **mavi çizgiler**, Data Parser'ın ürettiği ve diğer modüllere JSON objesi olarak aktarılacak olan asıl duvar (çarpışma/görüş engeli) koordinatlarını temsil etmektedir.

## 📝 Gelecek Planları (To-Do)
* [ ] A* algoritmasının devriye (patrol) durumlarında sıkışmaması için üretilen haritadaki bazı çıkmaz sokakların sonradan kırılarak dairesel yollar (loops) oluşturulması.
* [ ] Oyuncu (Player) ve Düşman (Enemy) için güvenli başlangıç koordinatlarının (Spawn Points) tespit edilmesi.
* [ ] Ekip ile mutabık kalınarak "Hücre Boyutu" (Cell Size) sabitlerinin ayarlanması.

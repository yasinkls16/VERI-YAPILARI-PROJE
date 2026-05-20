# VERI-YAPILARI-PROJE
VERİ YAPILARI PROJE GRUBU 
# 🏗️ Faz 1: BSP Ağacı ve Uzamsal Bölme Altyapısı


**Süha Tüfekçi - 032490079**

Bu branch, Veri Yapıları projesi isterlerinde belirtilen "Zorunlu Veri Yapıları (Faz 1)" aşamasının çekirdeğini oluşturan **Binary Space Partitioning (BSP) Ağacı** implementasyonunu içermektedir. 

Geliştirilen bu modül; 2 boyutlu gizlilik oyununda haritayı doğrularla alt bölgelere ayırarak oyun motorunun görüş alanı (Line of Sight) ve çarpışma tespiti (Collision Detection) gibi uzamsal sorgularını optimize etmek amacıyla **JavaScript (Node.js)** ortamında tasarlanmıştır.

## 🚀 Geliştirilen Modüller ve Sınıf Mimarisi

* **`Wall` (Geometri Sınıfı):** Haritadaki engelleri 2 boyutlu uzayda $(x_1, y_1)$ ve $(x_2, y_2)$ koordinat düzlemi üzerinde temsil eden temel yapı.
* **`BSPNode` (Ağaç Sınıfı):** Her düğümde bir bölme düzlemini (partition line) ve bu düzlemin ayırdığı alt uzayları (`front` ve `back` işaretçileri) barındıran veri yapısı.
* **Uzamsal İnşa (`buildTree`):** Haritadaki tüm duvar segmentlerini rekürsif olarak tarayarak ağaç yapısını dinamik olarak oluşturan çekirdek algoritma.
* **Modüler İletişim Arayüzü (`getRelevantWalls`):** Raycasting ve Navigasyon modüllerinin, tüm haritayı taramak yerine sadece belirtilen koordinat çevresindeki duvarları çekebilmesi için tasarlanmış arama (traversal) fonksiyonu.

## ⏱️ Performans ve Karmaşıklık (Big-O) Analizi

Projenin temel amacı olan "performans iyileştirmesi" kapsamında uygulanan veri yapısının teorik analizi:

* **Ağaç İnşası (Pre-computation):** Ortalama durumda $O(n \log n)$ karmaşıklığı ile oyun başlamadan önce harita belleğe yüklenir.
* **Uzamsal Sorgu (Oyun Döngüsü İçinde):** Doğrusal tarama yapılsaydı her karede $O(n)$ olacak olan çarpışma ve görüş testleri, BSP yapısı sayesinde hedeflenen lokasyonlar için $O(\log n)$ seviyesine indirilmiştir.

## 🐛 Git Akışı (Git Flow) ve Bulgular

Geliştirme süreci boyunca ekip içi iletişime ve endüstri standartlarında versiyon kontrol sistemine (Git) sadık kalınmıştır:

1. **Dil Değişikliği ve Entegrasyon:** Başlangıçta C dili ile kurgulanan iskelet, ekibin geri kalan modülleriyle (Özellikle A* ve Arayüz) sorunsuz çalışabilmesi için ortak bir karar alınarak JavaScript'e taşınmıştır.
2. **Hata Tespiti (Issue #2):** Paralel duvarların ağaç inşası sırasında `buildTree` fonksiyonunu sonsuz döngüye sokma (Stack Overflow) riski tespit edilmiştir. Bu durum GitHub Issues üzerinde tartışılarak, `areAllWallsCollinear` kontrol mekanizması ile çözülmüş ve kod ana branch'e (Pull Request ile) birleştirilmeye hazır hale getirilmiştir.

## 🛠️ Kurulum ve Test

Modülün bağımsız olarak çalışabilirliğini ve düğüm hiyerarşisini test etmek için terminal üzerinden aşağıdaki komut kullanılabilir:
```bash
node src/BspTree.js

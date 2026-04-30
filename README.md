# Veri Yapıları Projesi

Bu proje, 2 boyutlu gizlilik oyununun otonom düşman hareketlerini yöneten yapay zeka ve navigasyon altyapısının çekirdek algoritmalarını içermektedir. Proje; yapay zeka navigasyonu, ışın izleme (raycasting), fizik motoru, uzamsal ağaçlandırma (BSP) ve prosedürel harita üretimi olmak üzere beş temel modülden oluşmaktadır.

---

## Proje Ekibi

| İsim | Öğrenci Numarası | Sorumluluk / Modül |
| :--- | :--- | :--- |
| **Yasin Can Keleş** | 032490078 | Navigasyon ve Yapay Zeka |
| **Şevval Küçükyılmaz** | 032490084 | Optik Mühendisi (Raycasting & LoS Uzmanı) |
| **Ayşegül Karataş** | 032490082 | Oyun Motoru ve Fizik Çekirdeği |
| **Süha Tüfekçi** | 032490079 | BSP Ağacı ve Uzamsal Bölme Altyapısı |
| **Yiğit Toklu** | 032490080 | Prosedürel Harita Üretimi (Level Generation) |

---

## Modüller ve Özellikler

### Navigasyon ve Yapay Zeka (Faz 1)
* Düşmanların harita üzerindeki engelleri aşarak hedefe en kısa yoldan ulaşmasını sağlayan yapılar geliştirilmiştir.
* $A^{*}$ algoritmasının açık listesini optimize etmek ve en düşük maliyetli düğümü hızlıca bulmak için Min-Heap (Öncelikli Kuyruk) sıfırdan implemente edilmiştir.
* Geliştirilen $A^{*}$ (A-Star) Pathfinding Algoritması, engellerden kaçınarak 8 yönlü hareket yeteneğiyle devriye ve takip rotaları hesaplar.
* Düğümler arası mesafe hesaplamasında Heuristic (sezgisel) fonksiyon olarak Öklid (Euclidean) mesafesi kullanılmıştır.

### Optik ve Görüş Hattı (Raycasting)
* Düşman birimlerin görüş alanları (Line of Sight - LoS) matematiksel modellerle hesaplanmıştır.
* Işın İzleme (Raycasting) algoritması sayesinde, karakter merkezinden yayılan ışınların duvar segmentleri ile kesişimi hesaplanarak engellerin arkası görünmez kılınmıştır.
* Performansı artırmak amacıyla ışınların tüm harita yerine sadece ilgili bölgedeki engellerle test edilmesi için BSP ağacı ile filtreleme planlanmıştır.
* Dinamik görüş poligonu, HTML5 Canvas API'sindeki fill() ve stroke() metotları kullanılarak gerçek zamanlı oluşturulmuştur.

### Oyun Motoru ve Fizik Çekirdeği
* Oyunun ana döngüsünü (Game Loop) barındıran bu modül; koordinat sistemini, hareket kabiliyetlerini ve fiziksel kuralları yönetir.
* Kullanıcının W-A-S-D veya Ok tuşları ile karakteri eşzamanlı olarak kontrol edebilmesi sağlanmıştır.
* Karakterin Canvas sınırları dışına çıkmasını engelleyen temel fiziksel bariyerler eklenmiştir.

### BSP Ağacı ve Uzamsal Bölme
* Görüş alanı ve çarpışma tespiti gibi uzamsal sorguları optimize etmek için haritayı alt bölgelere ayıran Binary Space Partitioning (BSP) Ağacı tasarlanmıştır.
* Geometri sınıfı olan Wall engelleri temsil ederken, BSPNode sınıfı bölme düzlemini ve ayrılan alt uzayları barındırır.
* Çekirdek algoritma olan buildTree, tüm duvar segmentlerini rekürsif tarayarak ağaç yapısını dinamik olarak oluşturur.
* getRelevantWalls arayüzü sayesinde haritanın tamamı yerine sadece belirli bir koordinat çevresindeki duvarlar çekilebilmektedir.

### Prosedürel Harita Üretimi
* Oyunun tekrar oynanabilirliğini artırmak için Derinlik Öncelikli Arama (DFS) tabanlı Recursive Backtracking algoritması ile rastgele labirentler üretilir.
* Geometrik Veri Dönüştürücü (Data Parser), 0 ve 1'lerden oluşan grid matrisini tarayarak sadece yürünebilir alana bakan yüzeyleri çizgi segmentlerine dönüştürür.
* İçi dolu duvar bloklarının iç yüzeyleri veri setinden elenerek işlem yükü (node sayısı) ciddi oranda azaltılmıştır.

---

## Performans ve Zaman Karmaşıklığı Analizi

| Algoritma / Veri Yapısı | Zaman Karmaşıklığı (Big-O) | Açıklama |
| :--- | :--- | :--- |
| Min-Heap Push / Pop | $O(\log n)$ | Öncelikli kuyruk ekleme ve çıkarma işlemleri. |
| $A^{*}$ Algoritması | $O(E \log V)$ | Ortalama çalışma süresi (E: Kenar sayısı, V: Düğüm sayısı). |
| BSP Ağaç İnşası | $O(n \log n)$ | Oyun başlamadan önceki hazırlık (pre-computation) evresi. |
| BSP Uzamsal Sorgu | $O(\log n)$ | Oyun döngüsü içerisindeki çarpışma ve görüş testleri süresi. |

---

## Teknik Altyapı ve Bağımlılıklar

* **Programlama Dili:** JavaScript (ECMAScript 6+).
* **Grafik / Çizim Motoru:** HTML5 Canvas API.
* **Bağımlılıklar:** Proje, Chrome, Edge veya Firefox gibi modern bir web tarayıcısı haricinde derleyici kurulumuna veya dış bağımlılığa ihtiyaç duymaz.
* **Dosya Yapısı:**
  * index.html: Projenin ana iskeleti ve görselleştirme alanı.
  * src/player.js: Karakter fiziksel tanımı ve kullanıcı girdisi (input).
  * src/game.js: Fiziksel güncellemelerin yapıldığı ana döngü.

---

## Kurulum ve Çalıştırma Yönergeleri

**1. Arayüz ve Oyun Motorunu Başlatmak İçin:**
* Proje klasörünü indirin veya git clone ile çekin.
* VS Code kullanıyorsanız, "Live Server" eklentisiyle projeyi http://127.0.0.1:5500 adresinde başlatabilirsiniz.
* Alternatif olarak, herhangi bir editör kullanmadan doğrudan index.html dosyasına çift tıklayarak tarayıcıda açabilirsiniz.
* Mavi renkli oyuncuyu W-A-S-D veya yön tuşlarıyla hareket ettirebilirsiniz.

**2. Algoritma Testleri İçin (Terminal/Node.js):**
* **Navigasyon Testi:** $A^{*}$ ve engellerden kaçınma algoritmasını 5x5 matris üzerinde test etmek için terminalde node index.js komutunu çalıştırın.
* **BSP Ağacı Testi:** Düğüm hiyerarşisini test etmek için node src/BspTree.js komutunu kullanın.
* **Harita Üretimi Testi:** harita-olusturucu.html dosyasını tarayıcıda açarak otomatik üretilen rastgele haritayı (mavi çizgi koordinatları ile) görebilirsiniz.

---

## Gelecek Aşamalar (Faz 2 ve Entegrasyon)

* İlerleyen fazlarda $A^{*}$ yapısı, arayüzden JSON isteklerini dinleyen ve rotayı geri döndüren bağımsız bir API (Mikroservis) haline getirilip Dockerize edilecektir.
* Ekip üyelerinin geliştirdiği BSP ağacı ve zeki navigasyon verileri, oyunun fizik motoruna aktarılacak ve duvarlar arası çarpışma testleri aktif edilecektir.
* Şu an geliştirme dallarında (feature branches) olan çalışmalar test edildikten sonra Pull Request ile ana projeye (master branch) eklenecektir.

---

## Mevcut Durum
Şu an itibariyle projenin GitHub reposu kurulmuş, ekip üyeleri branch'lerini oluşturmuş ve veri yapılarının (Node ve Struct'lar) temel iskeletleri kodlanmaya başlanmıştır.

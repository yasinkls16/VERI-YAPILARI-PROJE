# VERI-YAPILARI-PROJE
VERİ YAPILARI PROJE GRUBU 

# Veri Yapıları Projesi - Ara Rapor 

---

### Ayşegül Karataş 032490082

## Teknik Altyapı ve Versiyonlama
- **Programlama Dili:** JavaScript (ECMAScript 6+)
- **Grafik Motoru:** HTML5 Canvas API
- **Çalıştırma Gereksinimi:** Modern bir web tarayıcısı (Chrome, Edge veya Firefox). Herhangi bir derleyici kurulumuna gerek duymaz.


## Oyun Motoru ve Fizik Çekirdeği
Oyunun kalbi olan "Game Loop" yapısı kurulmuştur. Bu modül; karakterlerin koordinat sistemini, hareket kabiliyetlerini ve ekran sınırları içindeki fiziksel kurallarını yönetmektedir.

- **Klavye Giriş Yönetimi:** Kullanıcının WASD veya Ok tuşları ile karakteri eşzamanlı olarak kontrol edebilmesi sağlanmıştır.
- **Sınır Kontrolü:** Karakterin oyun alanı (Canvas) dışına çıkmasını engelleyen temel fiziksel bariyerler eklenmiştir.

### Ekip Entegrasyon Hedefleri (Gelecek Aşamalar)
- **Uzamsal Mimari:** Ekip arkadaşlarımızın üzerinde çalıştığı **BSP Ağacı** yapısı sisteme dahil edildiğinde, duvarlar ve odalar arası çarpışma testleri bu fizik motoruna entegre edilecektir.
- **Zeki Navigasyon:** Diğer ekip üyeleri tarafından hazırlanan **A* Algoritması** verileri, mevcut hareket motoru üzerinden düşman karakterlere aktarılacaktır.

## 4. Dosya Yapısı ve İşlevleri
- `index.html`: Projenin ana iskeleti ve görselleştirme alanı.
- `src/player.js`: Karakterin fiziksel tanımı ve kullanıcı girdi (input) mekanizması.
- `src/game.js`: Fiziksel güncellemelerin ve çizimlerin yapıldığı ana döngü.

## 5. Kurulum ve Projeyi Ayağa Kaldırma

Proje, herhangi bir dış bağımlılık veya karmaşık derleme süreci gerektirmez. Aşağıdaki iki yöntemden birini kullanarak saniyeler içinde çalıştırılabilir:

### Yöntem A: VS Code "Live Server" ile Çalıştırma

1. **Dosyaları İndirin:** Proje klasörünü bilgisayarınıza indirin veya `git clone` ile çekin.
2. **VS Code ile Açın:** Klasörü Visual Studio Code üzerinden açın.
3. **Live Server'ı Başlatın:** - Eğer yüklü değilse, VS Code uzantılar kısmından **"Live Server"** eklentisini kurun.
   - Editörün sağ alt köşesinde bulunan **"Go Live"** butonuna tıklayın.
4. **Tarayıcıyı Kontrol Edin:** Proje otomatik olarak `http://127.0.0.1:5500` adresinde açılacaktır.

### Yöntem B: Doğrudan Tarayıcı Üzerinden Çalıştırma
Herhangi bir editör kullanmadan hızlıca önizleme yapmak için:
1. Proje klasörü içindeki `index.html` dosyasına sağ tıklayın.
2. **"Birlikte Aç"** (Open With) diyerek listenizdeki modern bir tarayıcıyı (Chrome, Edge veya Firefox) seçin.

### Kullanım ve Kontroller
- **Karakter Hareketi:** Mavi renkli oyuncuyu **W-A-S-D** veya **Yön Tuşlarını** kullanarak ekran içinde serbestçe hareket ettirebilirsiniz.

---

# Veri Yapıları Projesi - Ara Rapor

##  Kişisel Bilgiler
* **Adı Soyadı:** Şevval Küçükyılmaz
* **Öğrenci Numarası:** 032490084
* **Rol:** Optik Mühendisi (Raycasting & LoS)

---

##  Teknik Görev Tanımı
Bu modülde, oyunun "Görüş Hattı" (Line of Sight) mekanizması üzerinde çalışıyorum. Temel amacım, düşmanların görüş alanını matematiksel olarak hesaplamak ve bunu performanslı bir şekilde ekrana yansıtmaktır.

### Yapılan İşlemler:
1. **Raycasting Algoritması:** Karakterden çıkan ışınların duvarlarla kesişimini hesaplayan matematiksel model kuruldu.
2. **BSP Entegrasyonu:** Gereksiz hesaplamaları önlemek için harita verisi BSP ağacı üzerinden filtrelenmektedir.
3. **Görselleştirme:** HTML5 Canvas üzerinde `fill()` ve `stroke()` metotları ile görüş poligonu oluşturuldu.

##  GitHub İlerleme Durumu
- [x] Branch oluşturuldu (`feature/raycasting-logic`)
- [x] Kesişim matematiği tamamlandı
- [ ] BSP ağacı ile tam entegrasyon (Beklemede)
- [ ] Pull Request aşaması

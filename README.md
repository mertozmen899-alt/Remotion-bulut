# Remotion Bulut

Videolar GitHub'ın bulut bilgisayarında hazırlanır. Bilgisayar gerekmez, telefondan kullanılır.

## Nasıl çalışır?

1. Fotoğrafları `public/fotolar` klasörüne koy (isim sırasıyla dizilir: 1.jpg, 2.jpg …)
2. İstersen müziği `public/muzik` klasörüne, logoyu `public/logo.png` olarak koy
3. Yazıları `video.json` dosyasında değiştir
4. 2–4 dakika bekle. Video **Releases → Son video** sayfasına `video.mp4` olarak gelir

En kolayı: fotoğrafları ve yazıları Claude'a gönder, o yükler.

## video.json ayarları

| Ayar | Ne işe yarar | Seçenekler |
|---|---|---|
| `format` | Videonun şekli | `dikey` (Reels/Shorts), `yatay` (YouTube), `kare` |
| `sahneSuresi` | Her fotoğraf kaç saniye görünsün | ör. `3` |
| `gecisSuresi` | Geçiş efekti kaç saniye | ör. `0.5` |
| `gecisTipi` | Geçiş efekti | `karisik`, `solma`, `kayma`, `silme` |
| `fotoYerlesim` | Fotoğraf ekrana nasıl otursun | `sigdir` (tamamı görünür, arkası bulanık), `doldur` (ekranı kaplar, kenarlar kırpılır) |
| `renk` | Vurgu rengi | ör. `#FFC400` |
| `muzikSesi` | Müzik sesi | `0` ile `1` arası |
| `giris` | Açılış yazısı | `baslik`, `altBaslik` |
| `yazilar` | Fotoğrafların üstündeki yazılar (sırayla) | Fotoğraf yoksa yazı kartı olarak görünür |
| `kapanis` | Kapanış yazısı | `baslik`, `altBaslik` |

Bir bölümü kaldırmak için başlığını boş bırak: `"baslik": ""`

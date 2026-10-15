import ham from "../video.json";
import bulunan from "./generated/medya.json";

type Metin = { baslik?: string; altBaslik?: string; sure?: number };

type Ayar = {
  format?: "dikey" | "yatay" | "kare";
  fps?: number;
  sahneSuresi?: number;
  gecisSuresi?: number;
  gecisTipi?: "karisik" | "solma" | "kayma" | "silme";
  fotoYerlesim?: "doldur" | "sigdir";
  renk?: string;
  muzikSesi?: number;
  giris?: Metin;
  yazilar?: string[];
  kapanis?: Metin;
};

type Medya = {
  dosyalar: { tur: "foto" | "video"; dosya: string }[];
  muzik: string | null;
  logo: string | null;
};

export type Bolum =
  | { tur: "giris" | "kapanis"; baslik: string; altBaslik?: string; sure: number }
  | { tur: "foto" | "video"; dosya: string; yazi?: string; sure: number; sira: number }
  | { tur: "yazi"; yazi: string; sure: number; sira: number };

const BOYUTLAR = {
  dikey: { width: 1080, height: 1920 },
  yatay: { width: 1920, height: 1080 },
  kare: { width: 1080, height: 1080 },
};

export const hesapla = () => {
  const ayar = ham as Ayar;
  const medya = bulunan as Medya;

  const fps = ayar.fps ?? 30;
  const { width, height } = BOYUTLAR[ayar.format ?? "dikey"] ?? BOYUTLAR.dikey;
  const kare = (saniye: number) => Math.max(1, Math.round(saniye * fps));
  const sahne = kare(ayar.sahneSuresi ?? 3);
  const yazilar = ayar.yazilar ?? [];

  const bolumler: Bolum[] = [];

  if (ayar.giris?.baslik) {
    bolumler.push({
      tur: "giris",
      baslik: ayar.giris.baslik,
      altBaslik: ayar.giris.altBaslik,
      sure: kare(ayar.giris.sure ?? 2.5),
    });
  }

  if (medya.dosyalar.length > 0) {
    // Fotoğraflar varsa: her fotoğrafa sırayla bir yazı eşlenir
    medya.dosyalar.forEach((d, i) => {
      bolumler.push({
        tur: d.tur,
        dosya: d.dosya,
        yazi: yazilar[i] || undefined,
        sure: sahne,
        sira: i,
      });
    });
  } else {
    // Fotoğraf yoksa: yazılar renkli kartlar olarak gösterilir
    yazilar
      .filter((y) => y && y.trim())
      .forEach((y, i) => bolumler.push({ tur: "yazi", yazi: y, sure: sahne, sira: i }));
  }

  if (ayar.kapanis?.baslik) {
    bolumler.push({
      tur: "kapanis",
      baslik: ayar.kapanis.baslik,
      altBaslik: ayar.kapanis.altBaslik,
      sure: kare(ayar.kapanis.sure ?? 3),
    });
  }

  if (bolumler.length === 0) {
    bolumler.push({ tur: "giris", baslik: "Remotion Bulut", sure: kare(3) });
  }

  // Geçiş, en kısa bölümün yarısından uzun olamaz
  const enKisa = Math.min(...bolumler.map((b) => b.sure));
  const gecis =
    bolumler.length > 1
      ? Math.min(Math.round((ayar.gecisSuresi ?? 0.5) * fps), Math.floor(enKisa / 2))
      : 0;

  const toplam =
    bolumler.reduce((t, b) => t + b.sure, 0) - gecis * Math.max(0, bolumler.length - 1);

  return {
    fps,
    width,
    height,
    bolumler,
    gecis,
    toplam: Math.max(1, toplam),
    gecisTipi: ayar.gecisTipi ?? "karisik",
    yerlesim: ayar.fotoYerlesim ?? "sigdir",
    renk: ayar.renk ?? "#FFC400",
    muzikSesi: ayar.muzikSesi ?? 0.8,
    muzik: medya.muzik,
    logo: medya.logo,
    dikey: height > width,
  };
};

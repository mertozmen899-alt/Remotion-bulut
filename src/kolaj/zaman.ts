import ham from "../../video.json";
import bulunan from "../generated/medya.json";

export type KSahneAyar = {
  tip: "bolme" | "detay" | "isik" | "kapanis";
  foto?: string;
  urun?: string;
  yanFotolar?: string[];
  odak?: [number, number];
  yakinlik?: number;
  kucuk?: string;
  buyuk?: string;
  baslik?: string;
  altBaslik?: string;
  slogan?: string;
  satirlar?: string[];
  sure?: number;
};

type KAyar = {
  format?: "dikey" | "yatay" | "kare";
  fps?: number;
  renk?: string;
  muzikSesi?: number;
  efektSesi?: boolean;
  sahneler?: KSahneAyar[];
};

type SahneDosya = { foto: string | null; urun: string | null; yanFotolar: (string | null)[] };

export type KSahne = KSahneAyar & {
  bas: number;
  kare: number;
  sira: number;
  dosya: SahneDosya;
};

const BOYUTLAR = {
  dikey: { width: 1080, height: 1920 },
  yatay: { width: 1920, height: 1080 },
  kare: { width: 1080, height: 1080 },
};

export const kolajHesapla = () => {
  const ayar = ham as KAyar;
  const medya = bulunan as unknown as { sahneDosyalari?: SahneDosya[]; muzik: string | null };
  const fps = ayar.fps ?? 30;
  const { width, height } = BOYUTLAR[ayar.format ?? "dikey"] ?? BOYUTLAR.dikey;

  let bas = 0;
  const sahneler: KSahne[] = (ayar.sahneler ?? []).map((s, i) => {
    const kare = Math.max(30, Math.round((s.sure ?? 3) * fps));
    const sahne: KSahne = {
      ...s,
      bas,
      kare,
      sira: i,
      dosya: medya.sahneDosyalari?.[i] ?? { foto: null, urun: null, yanFotolar: [] },
    };
    bas += kare;
    return sahne;
  });

  return {
    fps,
    width,
    height,
    sahneler,
    toplam: Math.max(30, bas),
    renk: ayar.renk ?? "#E3262F",
    muzik: medya.muzik ?? "sfx/ambiyans.wav",
    muzikSesi: ayar.muzikSesi ?? 0.7,
    efektSesi: ayar.efektSesi ?? true,
  };
};

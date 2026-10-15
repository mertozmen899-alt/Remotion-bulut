import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  OffthreadVideo,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import type { TransitionPresentation } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { hesapla, Bolum } from "./ayarlar";
import { fontFamily } from "./yazi";

const SINIR = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Ekran boyutundan bağımsız ölçü birimi (1080 px'e göre)
const useBirim = () => {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
};

// ───────── Hareketli arka plan ─────────
const ArkaPlan: React.FC<{ renk: string }> = ({ renk }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const r = Math.max(width, height) * 0.55;
  const x1 = width * 0.25 + Math.sin(frame / 45) * width * 0.12;
  const y1 = height * 0.3 + Math.cos(frame / 60) * height * 0.08;
  const x2 = width * 0.8 + Math.cos(frame / 50) * width * 0.1;
  const y2 = height * 0.75 + Math.sin(frame / 40) * height * 0.06;
  const daire = (x: number, y: number, renkDegeri: string, opaklik: number) => (
    <div
      style={{
        position: "absolute",
        width: r,
        height: r,
        left: x - r / 2,
        top: y - r / 2,
        borderRadius: "50%",
        background: renkDegeri,
        opacity: opaklik,
        filter: `blur(${r * 0.25}px)`,
      }}
    />
  );
  return (
    <AbsoluteFill style={{ backgroundColor: "#0d0d12", overflow: "hidden" }}>
      {daire(x1, y1, renk, 0.45)}
      {daire(x2, y2, "#5b5bd6", 0.35)}
    </AbsoluteFill>
  );
};

// ───────── Kelime kelime gelen yazı ─────────
const Kelimeler: React.FC<{
  metin: string;
  boyut: number;
  gecikme?: number;
  agirlik?: number;
}> = ({ metin, boyut, gecikme = 0, agirlik = 800 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        fontFamily,
        fontWeight: agirlik,
        fontSize: boyut,
        lineHeight: 1.15,
        color: "white",
        textAlign: "center",
      }}
    >
      {metin.split(" ").map((k, i) => {
        const s = spring({
          frame: frame - gecikme - i * 4,
          fps,
          config: { damping: 14, mass: 0.6 },
        });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              marginRight: boyut * 0.25,
              opacity: Math.min(1, s),
              transform: `translateY(${(1 - s) * boyut * 0.6}px)`,
            }}
          >
            {k}
          </span>
        );
      })}
    </div>
  );
};

// ───────── Giriş ve kapanış ekranı ─────────
const BaslikEkrani: React.FC<{
  baslik: string;
  altBaslik?: string;
  renk: string;
  logo: string | null;
}> = ({ baslik, altBaslik, renk, logo }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useBirim();
  const cizgi = spring({ frame: frame - 10, fps, config: { damping: 200 } });
  const logoS = spring({ frame, fps, config: { damping: 12 } });
  const alt = interpolate(frame, [16, 30], [0, 1], SINIR);
  return (
    <AbsoluteFill>
      <ArkaPlan renk={renk} />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          padding: 90 * u,
        }}
      >
        {logo ? (
          <Img
            src={staticFile(logo)}
            style={{
              height: 200 * u,
              maxWidth: "70%",
              objectFit: "contain",
              marginBottom: 60 * u,
              transform: `scale(${logoS})`,
            }}
          />
        ) : null}
        <Kelimeler metin={baslik} boyut={112 * u} />
        <div
          style={{
            height: 12 * u,
            width: 240 * u * cizgi,
            background: renk,
            borderRadius: 6 * u,
            margin: `${40 * u}px 0`,
          }}
        />
        {altBaslik ? (
          <div
            style={{
              fontFamily,
              fontWeight: 500,
              fontSize: 50 * u,
              color: "rgba(255,255,255,0.9)",
              textAlign: "center",
              opacity: alt,
              transform: `translateY(${(1 - alt) * 30 * u}px)`,
            }}
          >
            {altBaslik}
          </div>
        ) : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ───────── Fotoğrafın üstündeki alt yazı ─────────
const AltYazi: React.FC<{ metin: string; renk: string; dikey: boolean }> = ({
  metin,
  renk,
  dikey,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const u = useBirim();
  const s = spring({ frame: frame - 8, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end" }}>
      <div
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0) 100%)",
          // Dikey videoda alt kısım Reels/Shorts düğmelerine denk gelmesin
          padding: `${220 * u}px ${70 * u}px ${(dikey ? 340 : 100) * u}px`,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 28 * u,
            opacity: s,
            transform: `translateY(${(1 - s) * 60 * u}px)`,
          }}
        >
          <div
            style={{
              width: 12 * u,
              flexShrink: 0,
              background: renk,
              borderRadius: 6 * u,
              transform: `scaleY(${s})`,
            }}
          />
          <div
            style={{
              fontFamily,
              fontWeight: 700,
              fontSize: 66 * u,
              lineHeight: 1.2,
              color: "white",
              textShadow: "0 4px 24px rgba(0,0,0,0.5)",
            }}
          >
            {metin}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ───────── Fotoğraf / klip sahnesi (yavaş yakınlaşma) ─────────
const MedyaSahne: React.FC<{
  bolum: Extract<Bolum, { tur: "foto" | "video" }>;
  renk: string;
  yerlesim: "doldur" | "sigdir";
  dikey: boolean;
}> = ({ bolum, renk, yerlesim, dikey }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, bolum.sure], [0, 1], SINIR);
  const iceri = bolum.sira % 2 === 0;
  const olcek = iceri ? 1 + 0.12 * p : 1.12 - 0.12 * p;
  const kay = ((bolum.sira % 3) - 1) * 2 * p; // yüzde
  const src = staticFile(bolum.dosya);
  const tam: React.CSSProperties = {
    position: "absolute",
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };
  const hareket: React.CSSProperties = {
    transform: `scale(${olcek}) translateX(${kay}%)`,
  };

  let icerik: React.ReactNode;
  if (bolum.tur === "video") {
    icerik = (
      <OffthreadVideo
        src={src}
        muted
        style={{ ...tam, objectFit: yerlesim === "sigdir" ? "contain" : "cover" }}
      />
    );
  } else if (yerlesim === "sigdir") {
    icerik = (
      <>
        <Img
          src={src}
          style={{ ...tam, filter: "blur(40px) brightness(0.55)", transform: "scale(1.25)" }}
        />
        <Img src={src} style={{ ...tam, objectFit: "contain", ...hareket }} />
      </>
    );
  } else {
    icerik = <Img src={src} style={{ ...tam, ...hareket }} />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black", overflow: "hidden" }}>
      {icerik}
      {bolum.yazi ? <AltYazi metin={bolum.yazi} renk={renk} dikey={dikey} /> : null}
    </AbsoluteFill>
  );
};

// ───────── Sadece yazı olan kart ─────────
const YaziKarti: React.FC<{ yazi: string; renk: string }> = ({ yazi, renk }) => {
  const u = useBirim();
  return (
    <AbsoluteFill>
      <ArkaPlan renk={renk} />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", padding: 100 * u }}
      >
        <Kelimeler metin={yazi} boyut={92 * u} gecikme={4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ───────── Geçiş efektleri ─────────
const gecisSec = (tip: string, i: number): TransitionPresentation<any> => {
  if (tip === "solma") return fade();
  if (tip === "kayma") return slide({ direction: "from-right" });
  if (tip === "silme") return wipe({ direction: "from-left" });
  const liste: TransitionPresentation<any>[] = [
    fade(),
    slide({ direction: "from-right" }),
    wipe({ direction: "from-top-left" }),
    slide({ direction: "from-bottom" }),
  ];
  return liste[i % liste.length];
};

// ───────── Ana video ─────────
export const Video: React.FC = () => {
  const h = hesapla();
  const { fps } = useVideoConfig();

  const ciz = (b: Bolum) => {
    if (b.tur === "giris" || b.tur === "kapanis") {
      return (
        <BaslikEkrani baslik={b.baslik} altBaslik={b.altBaslik} renk={h.renk} logo={h.logo} />
      );
    }
    if (b.tur === "yazi") return <YaziKarti yazi={b.yazi} renk={h.renk} />;
    return <MedyaSahne bolum={b} renk={h.renk} yerlesim={h.yerlesim} dikey={h.dikey} />;
  };

  const sesSeviyesi = (f: number) => {
    const giris = Math.min(fps * 0.6, h.toplam / 3);
    const cikis = Math.max(giris + 1, h.toplam - fps * 1.5);
    return interpolate(
      f,
      [0, giris, cikis, Math.max(cikis + 1, h.toplam)],
      [0, h.muzikSesi, h.muzikSesi, 0],
      SINIR,
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <TransitionSeries>
        {h.bolumler.map((b, i) => (
          <React.Fragment key={i}>
            {i > 0 && h.gecis > 0 ? (
              <TransitionSeries.Transition
                presentation={gecisSec(h.gecisTipi, i)}
                timing={linearTiming({ durationInFrames: h.gecis })}
              />
            ) : null}
            <TransitionSeries.Sequence durationInFrames={b.sure}>{ciz(b)}</TransitionSeries.Sequence>
          </React.Fragment>
        ))}
      </TransitionSeries>
      {h.muzik ? <Audio src={staticFile(h.muzik)} loop volume={sesSeviyesi} /> : null}
    </AbsoluteFill>
  );
};

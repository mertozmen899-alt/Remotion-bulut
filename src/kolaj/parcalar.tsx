import React, { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { inter } from "../yazi";

export const SINIR = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const YUMUSAK = Easing.bezier(0.22, 1, 0.36, 1);
export const ICDIS = Easing.bezier(0.65, 0, 0.35, 1);

export const useOlcu = () => {
  const { width, height } = useVideoConfig();
  return { W: width, H: height, u: Math.min(width, height) / 1080 };
};

// ───────── Siyah dokulu zemin ─────────
export const Zemin: React.FC = () => {
  const { W, H } = useOlcu();
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 85% 60% at 50% 42%, #121212 0%, #070707 55%, #000000 100%)",
      }}
    >
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, opacity: 0.4, mixBlendMode: "screen" }}
      >
        <filter id="zemin-leke">
          <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves={4} seed={11} />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope="0.13" />
            <feFuncG type="linear" slope="0.13" />
            <feFuncB type="linear" slope="0.13" />
            <feFuncA type="linear" slope="0" intercept="1" />
          </feComponentTransfer>
        </filter>
        <rect width={W} height={H} filter="url(#zemin-leke)" />
      </svg>
    </AbsoluteFill>
  );
};

// ───────── Film kumlanması + kenar kararması (en üst katman) ─────────
export const Doku: React.FC = () => {
  const frame = useCurrentFrame();
  const { W, H } = useOlcu();
  const tohum = Math.floor(frame / 2) % 24;
  return (
    <>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 78% 62% at 50% 48%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.72) 100%)",
        }}
      />
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, opacity: 0.1, mixBlendMode: "screen" }}
      >
        <filter id="doku-kum">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.85"
            numOctaves={1}
            seed={tohum}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#doku-kum)" />
      </svg>
    </>
  );
};

// ───────── Köşeleri kesik (sekizgen) siyah-beyaz fotoğraf çerçevesi ─────────
const sekizgen = (k: number, oran: number) => {
  const d = k * oran; // dikeyde aynı piksel boyunda kesim
  return `polygon(${k}% 0, ${100 - k}% 0, 100% ${d}%, 100% ${100 - d}%, ${100 - k}% 100%, ${k}% 100%, 0 ${100 - d}%, 0 ${d}%)`;
};

export const Cerceve: React.FC<{
  src: string | null;
  w: number;
  h: number;
  odak?: [number, number];
  style?: React.CSSProperties;
}> = ({ src, w, h, odak, style }) => {
  const { u } = useOlcu();
  const sekil = sekizgen(10, w / h);
  return (
    <div style={{ position: "absolute", width: w, height: h, ...style }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: sekil,
          background: "linear-gradient(160deg, #d8d8d5 0%, #7d7d7a 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 7 * u,
            clipPath: sekil,
            background: "#1a1a1a",
            overflow: "hidden",
          }}
        >
          {src ? (
            <Img
              src={staticFile(src)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: odak ? `${odak[0] * 100}% ${odak[1] * 100}%` : "50% 50%",
                filter: "grayscale(1) contrast(1.2) brightness(0.9)",
              }}
            />
          ) : null}
          {/* Raster (halftone) dokusu */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(0,0,0,0.45) 1.1px, rgba(0,0,0,0) 1.7px)",
              backgroundSize: `${6 * u}px ${6 * u}px`,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              boxShadow: `inset 0 0 ${70 * u}px rgba(0,0,0,0.6)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ───────── Ürün fotoğrafı: şeffafsa serbest, değilse yuvarlak etiket ─────────
const useSeffaf = (src: string | null) => {
  const [sonuc, setSonuc] = useState<boolean | null>(null);
  const [tutamak] = useState(() => (src ? delayRender(`Şeffaflık: ${src}`) : null));
  useEffect(() => {
    if (!src || tutamak === null) return;
    const img = new Image();
    const bitir = (deger: boolean) => {
      setSonuc(deger);
      continueRender(tutamak);
    };
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = 40;
        c.height = 40;
        const ctx = c.getContext("2d");
        if (!ctx) return bitir(false);
        ctx.drawImage(img, 0, 0, 40, 40);
        const veri = ctx.getImageData(0, 0, 40, 40).data;
        let bos = 0;
        for (let i = 3; i < veri.length; i += 4) if (veri[i] < 240) bos++;
        bitir(bos > 40 * 40 * 0.08);
      } catch {
        bitir(false);
      }
    };
    img.onerror = () => bitir(false);
    img.src = src;
  }, [src, tutamak]);
  return sonuc;
};

export const Urun: React.FC<{
  src: string | null;
  boyut: number;
  x: number;
  y: number;
  donus?: number;
  olcek?: number;
  opaklik?: number;
  bulaniklik?: number;
}> = ({ src, boyut, x, y, donus = 0, olcek = 1, opaklik = 1, bulaniklik = 0 }) => {
  const { u } = useOlcu();
  const tam = src ? staticFile(src) : null;
  const seffaf = useSeffaf(tam);
  if (!tam) return null;
  const konum: React.CSSProperties = {
    position: "absolute",
    left: x - boyut / 2,
    top: y - boyut / 2,
    width: boyut,
    height: boyut,
    opacity: opaklik,
    transform: `scale(${olcek}) rotate(${donus}deg)`,
  };
  if (seffaf) {
    return (
      <Img
        src={tam}
        style={{
          ...konum,
          objectFit: "contain",
          filter: `drop-shadow(0 ${26 * u}px ${34 * u}px rgba(0,0,0,0.85)) blur(${bulaniklik}px)`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        ...konum,
        borderRadius: "50%",
        padding: 9 * u,
        background: "linear-gradient(160deg, #f0f0ed 0%, #8f8f8c 100%)",
        boxShadow: `0 ${26 * u}px ${60 * u}px rgba(0,0,0,0.85)`,
        filter: bulaniklik > 0.1 ? `blur(${bulaniklik}px)` : undefined,
      }}
    >
      <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}>
        <Img src={tam} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
    </div>
  );
};

// ───────── Yuvarlak kırpılmış fotoğraf (disk) ─────────
export const Disk: React.FC<{
  src: string | null;
  r: number;
  x: number;
  y: number;
  odak?: [number, number];
  yakinlik?: number;
  style?: React.CSSProperties;
}> = ({ src, r, x, y, odak = [0.5, 0.5], yakinlik = 1, style }) => {
  const { u } = useOlcu();
  const halka = Math.max(4, r * 0.045);
  return (
    <div
      style={{
        position: "absolute",
        left: x - r,
        top: y - r,
        width: 2 * r,
        height: 2 * r,
        borderRadius: "50%",
        padding: halka,
        background: "radial-gradient(circle at 40% 30%, #f4f4f1 0%, #b9b9b6 70%, #8a8a87 100%)",
        boxShadow: `0 0 ${90 * u}px rgba(255,255,255,0.12), 0 ${30 * u}px ${70 * u}px rgba(0,0,0,0.9)`,
        ...style,
      }}
    >
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "50%",
          overflow: "hidden",
          background: "#181818",
        }}
      >
        {src ? (
          <Img
            src={staticFile(src)}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${yakinlik * 100}%`,
              height: "auto",
              transform: `translate(-${odak[0] * 100}%, -${odak[1] * 100}%)`,
              filter: "grayscale(1) contrast(1.2) brightness(0.95)",
            }}
          />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            boxShadow: `inset 0 0 ${50 * u}px rgba(0,0,0,0.65)`,
          }}
        />
      </div>
    </div>
  );
};

// ───────── İnce çizgiler (çizilerek gelir) ─────────
export type Cizgi = { x1: number; y1: number; x2: number; y2: number };

export const Cizgiler: React.FC<{
  cizgiler: Cizgi[];
  ilerleme: number;
  renk?: string;
  kalinlik?: number;
}> = ({ cizgiler, ilerleme, renk = "rgba(255,255,255,0.32)", kalinlik = 2 }) => {
  const { W, H, u } = useOlcu();
  if (ilerleme <= 0) return null;
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {cizgiler.map((c, i) => (
        <line
          key={i}
          x1={c.x1}
          y1={c.y1}
          x2={c.x1 + (c.x2 - c.x1) * ilerleme}
          y2={c.y1 + (c.y2 - c.y1) * ilerleme}
          stroke={renk}
          strokeWidth={kalinlik * u}
        />
      ))}
    </svg>
  );
};

// ───────── Küçük ince yazı + büyük kalın kelime ─────────
export const yaziZamanlari = (kucuk: string | undefined, bas: number) => {
  const kelime = (kucuk ?? "").split(/\s+/).filter(Boolean).length;
  return { buyukBas: bas + kelime * 5 + 8 };
};

export const YaziBlok: React.FC<{
  kucuk?: string;
  buyuk?: string;
  bas: number;
  ust: number;
  kucukRenk?: string;
  buyukRenk?: string;
}> = ({ kucuk, buyuk, bas, ust, kucukRenk = "#8e8e8e", buyukRenk = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const { W, u } = useOlcu();
  const kelimeler = (kucuk ?? "").split(/\s+/).filter(Boolean);
  const { buyukBas } = yaziZamanlari(kucuk, bas);
  const b = interpolate(frame, [buyukBas, buyukBas + 12], [0, 1], { ...SINIR, easing: YUMUSAK });
  const harf = Math.max(1, (buyuk ?? "").length);
  const buyukBoyut = Math.min(200 * u, (W - 260 * u) / (harf * 0.6));
  return (
    <div
      style={{
        position: "absolute",
        top: ust,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
        <div
          style={{
            fontFamily: inter,
            fontWeight: 300,
            fontSize: 48 * u,
            color: kucukRenk,
            letterSpacing: "-0.01em",
            height: 60 * u,
          }}
        >
          {kelimeler.map((k, i) => {
            const o = interpolate(frame, [bas + i * 5, bas + i * 5 + 9], [0, 1], SINIR);
            return (
              <span
                key={i}
                style={{
                  display: "inline-block",
                  marginRight: 14 * u,
                  opacity: o,
                  transform: `translateY(${(1 - o) * 12 * u}px)`,
                  filter: o < 1 ? `blur(${(1 - o) * 6}px)` : undefined,
                }}
              >
                {k}
              </span>
            );
          })}
        </div>
        {buyuk ? (
          <div
            style={{
              fontFamily: inter,
              fontWeight: 800,
              fontSize: buyukBoyut,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              color: buyukRenk,
              marginLeft: 90 * u,
              opacity: b,
              transform: `scale(${1.12 - 0.12 * b})`,
              transformOrigin: "left center",
              filter: b < 1 ? `blur(${(1 - b) * 14}px)` : undefined,
            }}
          >
            {buyuk}
          </div>
        ) : null}
      </div>
    </div>
  );
};

// ───────── Kalp ikonu ─────────
export const Kalp: React.FC<{ boyut: number; renk: string; olcek?: number }> = ({
  boyut,
  renk,
  olcek = 1,
}) => (
  <svg
    width={boyut}
    height={boyut}
    viewBox="0 0 24 24"
    style={{ display: "inline-block", verticalAlign: "-0.08em", transform: `scale(${olcek})` }}
  >
    <path
      fill={renk}
      d="M12 21s-7.5-4.6-10-9.3C.4 8.4 2 4.5 5.6 4.1 8 3.8 9.6 5.2 12 7.6c2.4-2.4 4-3.8 6.4-3.5C22 4.5 23.6 8.4 22 11.7 19.5 16.4 12 21 12 21z"
    />
  </svg>
);

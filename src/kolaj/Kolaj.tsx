import React from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { inter } from "../yazi";
import { KSahne, kolajHesapla } from "./zaman";
import {
  Cerceve,
  Cizgi,
  Cizgiler,
  Disk,
  Doku,
  ICDIS,
  Kalp,
  SINIR,
  Urun,
  YUMUSAK,
  YaziBlok,
  Zemin,
  useOlcu,
  yaziZamanlari,
} from "./parcalar";

// ───────── Sahne giriş/çıkış: bulanık yakınlaşmalı kesme ─────────
const SahneKabi: React.FC<{
  kare: number;
  giris: boolean;
  cikis: boolean;
  children: React.ReactNode;
}> = ({ kare, giris, cikis, children }) => {
  const f = useCurrentFrame();
  const gi = giris
    ? interpolate(f, [0, 12], [1, 0], { ...SINIR, easing: Easing.out(Easing.cubic) })
    : 0;
  const ci = cikis
    ? interpolate(f, [kare - 9, kare], [0, 1], { ...SINIR, easing: Easing.in(Easing.cubic) })
    : 0;
  const bulanik = gi * 16 + ci * 18;
  return (
    <AbsoluteFill
      style={{
        transform: `scale(${1 + gi * 0.08 + ci * 0.12})`,
        filter: bulanik > 0.2 ? `blur(${bulanik}px)` : undefined,
        opacity: 1 - gi * 0.5 - ci * 0.4,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ───────── 1) Fotoğraf ikiye ayrılır, arasından ürün çıkar ─────────
const BolmeSahne: React.FC<{ s: KSahne }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { W, H, u } = useOlcu();
  const fw = 580 * u;
  const fh = (fw * 4) / 3;
  const cx = W / 2;
  const cy = H * 0.57;
  const gor = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 22 });
  const kamera = interpolate(frame, [0, s.kare], [1, 1.07]);
  const bol = 22;
  const ayr = interpolate(frame, [bol, bol + 28], [0, 1], { ...SINIR, easing: ICDIS });
  const d = ayr * 330 * u;
  const urunS = interpolate(frame, [bol + 6, bol + 32], [0, 1], { ...SINIR, easing: YUMUSAK });
  const cizgi = interpolate(frame, [bol + 14, bol + 36], [0, 1], SINIR);
  const cizgiler: Cizgi[] = [-1, 1].flatMap((t) => [
    { x1: cx + t * d, y1: cy - fh / 2 + 4 * u, x2: cx, y2: cy },
    { x1: cx + t * d, y1: cy + fh / 2 - 4 * u, x2: cx, y2: cy },
  ]);

  const yarim = (taraf: -1 | 1) => (
    <div
      style={{
        position: "absolute",
        left: cx - fw / 2 + taraf * d,
        top: cy - fh / 2,
        width: fw,
        height: fh,
        filter: `drop-shadow(0 ${22 * u}px ${40 * u}px rgba(0,0,0,0.9))`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: taraf < 0 ? "inset(0 50% 0 0)" : "inset(0 0 0 50%)",
        }}
      >
        <Cerceve src={s.dosya.foto} w={fw} h={fh} odak={s.odak} />
      </div>
    </div>
  );

  return (
    <AbsoluteFill style={{ transform: `scale(${kamera})` }}>
      <AbsoluteFill
        style={{
          opacity: gor,
          transform: `translateY(${(1 - gor) * 50 * u}px) scale(${0.93 + 0.07 * gor})`,
        }}
      >
        {yarim(-1)}
        {yarim(1)}
      </AbsoluteFill>
      <Cizgiler cizgiler={cizgiler} ilerleme={cizgi} />
      <Urun
        src={s.dosya.urun}
        boyut={480 * u}
        x={cx}
        y={cy}
        olcek={0.12 + 0.88 * urunS}
        donus={(1 - urunS) * -14 + Math.sin(frame / 28) * 2}
        opaklik={Math.min(1, urunS * 2.5)}
        bulaniklik={(1 - urunS) * 8}
      />
      <YaziBlok kucuk={s.kucuk} buyuk={s.buyuk} bas={bol + 22} ust={H * 0.12} />
    </AbsoluteFill>
  );
};

// ───────── 2) Ortada ürün, yanlardan kolaj fotoğrafları ─────────
const DetaySahne: React.FC<{ s: KSahne }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { W, H, u } = useOlcu();
  const cx = W / 2;
  const cy = H * 0.58;
  const boyut = 520 * u;
  const p = spring({ frame: frame - 2, fps, config: { damping: 200 }, durationInFrames: 24 });
  const kamera = interpolate(frame, [0, s.kare], [1, 1.06]);
  const donus = interpolate(frame, [0, s.kare], [0, -1.2]);
  const arti = interpolate(frame, [0, 22], [0, 1], { ...SINIR, easing: ICDIS });

  const tw = 330 * u;
  const th = 440 * u;
  const yanlar = [
    { x: W * 0.17, y: H * 0.45, r: -7, gelis: -W * 0.45, bas: 6 },
    { x: W * 0.83, y: H * 0.8, r: 6, gelis: W * 0.45, bas: 12 },
  ];
  const konumlar = yanlar.map((y) => {
    const g = interpolate(frame, [y.bas, y.bas + 24], [0, 1], { ...SINIR, easing: YUMUSAK });
    return { ...y, gx: y.x + (1 - g) * y.gelis, g };
  });
  const bag = interpolate(frame, [26, 46], [0, 1], SINIR);
  const baglar: Cizgi[] = konumlar.map((k, i) => ({
    x1: k.gx + (i === 0 ? tw / 2 : -tw / 2) * 0.9,
    y1: k.y + (i === 0 ? th / 2 : -th / 2) * 0.9,
    x2: cx,
    y2: cy,
  }));

  return (
    <AbsoluteFill style={{ transform: `scale(${kamera}) rotate(${donus}deg)` }}>
      <Cizgiler
        cizgiler={[
          { x1: 0, y1: cy, x2: W, y2: cy },
          { x1: cx, y1: H * 0.3, x2: cx, y2: H },
        ]}
        ilerleme={arti}
        renk="rgba(255,255,255,0.14)"
      />
      {konumlar.map((k, i) =>
        s.dosya.yanFotolar[i] ? (
          <div
            key={i}
            style={{
              position: "absolute",
              left: k.gx - tw / 2,
              top: k.y - th / 2,
              width: tw,
              height: th,
              transform: `rotate(${k.r + (1 - k.g) * 10}deg)`,
              filter: `drop-shadow(0 ${18 * u}px ${30 * u}px rgba(0,0,0,0.9))`,
            }}
          >
            <Cerceve src={s.dosya.yanFotolar[i]} w={tw} h={th} />
          </div>
        ) : null,
      )}
      <Cizgiler cizgiler={baglar} ilerleme={bag} />
      <Urun
        src={s.dosya.urun}
        boyut={boyut}
        x={cx}
        y={cy}
        olcek={0.6 + 0.4 * p}
        donus={(1 - p) * 10 + Math.sin(frame / 25) * 1.5}
        opaklik={p}
        bulaniklik={(1 - p) * 14}
      />
      <YaziBlok kucuk={s.kucuk} buyuk={s.buyuk} bas={24} ust={H * 0.12} />
    </AbsoluteFill>
  );
};

// ───────── 3) Karanlıkta disk + dönen ışık huzmesi ─────────
const ISIK_ACI = [-12, -90, -90, -222];
const isikZaman = (kare: number) => [16, 52, Math.round(kare * 0.62), kare - 12];

const IsikSahne: React.FC<{ s: KSahne }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { W, H, u } = useOlcu();
  const cx = W / 2;
  const cy = H * 0.56;
  const R = 285 * u;
  const g = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 26 });
  const cizgi = interpolate(frame, [0, 30], [0, 1], { ...SINIR, easing: ICDIS });

  const zaman = isikZaman(s.kare);
  const aci = interpolate(frame, zaman, ISIK_ACI, { ...SINIR, easing: ICDIS });
  const isik = interpolate(frame, [zaman[0] - 4, zaman[0] + 10, s.kare - 26, s.kare - 10], [0, 1, 1, 0], SINIR);
  const L = H * 1.6;
  const yay = 13;
  const rad = (a: number) => (a * Math.PI) / 180;
  const dik = rad(aci + 90);
  const taban = R * 0.38;
  const noktalar = [
    [cx + Math.cos(dik) * taban, cy + Math.sin(dik) * taban],
    [cx + Math.cos(rad(aci + yay)) * L, cy + Math.sin(rad(aci + yay)) * L],
    [cx + Math.cos(rad(aci - yay)) * L, cy + Math.sin(rad(aci - yay)) * L],
    [cx - Math.cos(dik) * taban, cy - Math.sin(dik) * taban],
  ];
  const poligon = noktalar.map((n) => n.join(",")).join(" ");
  const klip = `polygon(${noktalar.map((n) => `${n[0]}px ${n[1]}px`).join(", ")})`;
  // Yazı, ışık yukarı baktığında görünür
  const yaziGorunur = interpolate(Math.abs(aci + 90), [0, 40], [1, 0], SINIR) * isik;

  const yazi = (renkler: { k: string; b: string }) => (
    <YaziBlok
      kucuk={s.kucuk}
      buyuk={s.buyuk}
      bas={zaman[1] - 26}
      ust={H * 0.16}
      kucukRenk={renkler.k}
      buyukRenk={renkler.b}
    />
  );

  return (
    <AbsoluteFill style={{ transform: `scale(${interpolate(frame, [0, s.kare], [1, 1.05])})` }}>
      <Cizgiler
        cizgiler={[
          { x1: 0, y1: cy, x2: W, y2: cy },
          { x1: cx - H * 0.35, y1: cy - H * 0.6, x2: cx + H * 0.35, y2: cy + H * 0.6 },
          { x1: cx + H * 0.5, y1: cy - H * 0.45, x2: cx - H * 0.5, y2: cy + H * 0.45 },
        ]}
        ilerleme={cizgi}
        renk="rgba(255,255,255,0.13)"
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: isik }}>
        <defs>
          <linearGradient
            id="huzme"
            gradientUnits="userSpaceOnUse"
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(rad(aci)) * L}
            y2={cy + Math.sin(rad(aci)) * L}
          >
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="0.35" stopColor="#ffffff" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="huzme-yumusat">
            <feGaussianBlur stdDeviation={5 * u} />
          </filter>
        </defs>
        <polygon points={poligon} fill="url(#huzme)" filter="url(#huzme-yumusat)" />
      </svg>
      <div style={{ opacity: yaziGorunur }}>{yazi({ k: "#9a9a9a", b: "#ffffff" })}</div>
      <AbsoluteFill style={{ clipPath: klip, opacity: yaziGorunur }}>
        {yazi({ k: "#3a3a3a", b: "#0d0d0d" })}
      </AbsoluteFill>
      <Disk
        src={s.dosya.foto}
        r={R}
        x={cx}
        y={cy}
        odak={s.odak}
        yakinlik={s.yakinlik}
        style={{
          opacity: g,
          transform: `scale(${0.7 + 0.3 * g})`,
          filter: g < 1 ? `blur(${(1 - g) * 18}px)` : undefined,
        }}
      />
    </AbsoluteFill>
  );
};

// ───────── 4) Kapanış: disk küçülür, marka belirir ─────────
const KapanisSahne: React.FC<{ s: KSahne; renk: string; ustuste: boolean }> = ({
  s,
  renk,
  ustuste,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { W, H, u } = useOlcu();
  const cx = W / 2;
  const kucul = interpolate(frame, [4, 40], [0, 1], { ...SINIR, easing: ICDIS });
  const R = interpolate(kucul, [0, 1], [285 * u * 1.05, 130 * u]);
  const cy = interpolate(kucul, [0, 1], [H * 0.56, H * 0.465]);
  const giris = ustuste ? 1 : spring({ frame, fps, config: { damping: 200 }, durationInFrames: 20 });

  const halkalar = [0, 1, 2].map((i) => {
    const f = frame - 14 - i * 7;
    const p = interpolate(f, [0, 50], [0, 1], { ...SINIR, easing: Easing.out(Easing.quad) });
    return { r: R + p * (170 + i * 130) * u, o: f < 0 ? 0 : (1 - p) * 0.35 + 0.08 };
  });

  const baslik = s.baslik ?? "";
  const harfler = Array.from(baslik);
  const baslikBoyut = Math.min(170 * u, (W - 200 * u) / (harfler.length * 0.82));
  const t = 30;
  const goster = (bas: number) => interpolate(frame, [bas, bas + 14], [0, 1], { ...SINIR, easing: YUMUSAK });
  const kalpFaz = (((frame - 56) % 20) + 20) % 20;
  const vurus = frame < 56 ? 0 : Math.exp(-kalpFaz / 4);
  const altY = cy + R + 80 * u;

  const satir = (bas: number, y: number, icerik: React.ReactNode, stil: React.CSSProperties) => {
    const o = goster(bas);
    return (
      <div
        style={{
          position: "absolute",
          top: y,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: o,
          transform: `translateY(${(1 - o) * 16 * u}px)`,
          filter: o < 1 ? `blur(${(1 - o) * 8}px)` : undefined,
          ...stil,
        }}
      >
        {icerik}
      </div>
    );
  };

  const slogan = (s.slogan ?? "").split("♥");

  return (
    <AbsoluteFill style={{ opacity: giris }}>
      <Cizgiler
        cizgiler={[{ x1: 0, y1: cy, x2: W, y2: cy }]}
        ilerleme={1}
        renk="rgba(255,255,255,0.12)"
      />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {halkalar.map((h, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={h.r}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={h.o}
            strokeWidth={2 * u}
          />
        ))}
      </svg>
      <Disk src={s.dosya.foto} r={R} x={cx} y={cy} odak={s.odak} yakinlik={s.yakinlik} />

      <div
        style={{
          position: "absolute",
          top: H * 0.25,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: inter,
          fontWeight: 800,
          fontSize: baslikBoyut,
          letterSpacing: "0.1em",
          color: "#ffffff",
          paddingLeft: "0.1em",
        }}
      >
        {harfler.map((h, i) => {
          const o = goster(t + i * 3);
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                opacity: o,
                transform: `translateY(${(1 - o) * 40 * u}px)`,
                filter: o < 1 ? `blur(${(1 - o) * 12}px)` : undefined,
              }}
            >
              {h}
            </span>
          );
        })}
      </div>

      {s.altBaslik
        ? satir(t + 18, altY, s.altBaslik, {
            fontFamily: inter,
            fontWeight: 300,
            fontSize: 40 * u,
            letterSpacing: "0.3em",
            color: "#9c9c9c",
          })
        : null}
      {s.slogan
        ? satir(
            t + 26,
            altY + 82 * u,
            slogan.map((parca, i) => (
              <React.Fragment key={i}>
                {i > 0 ? (
                  <span style={{ display: "inline-block", margin: "0 0.04em" }}>
                    <Kalp boyut={50 * u} renk={renk} olcek={1 + 0.18 * vurus} />
                  </span>
                ) : null}
                {parca}
              </React.Fragment>
            )),
            {
              fontFamily: inter,
              fontWeight: 800,
              fontSize: 54 * u,
              letterSpacing: "0.14em",
              color: "#ffffff",
            },
          )
        : null}
      {(s.satirlar ?? []).map((yazi, i) =>
        satir(t + 36 + i * 6, altY + (190 + i * 62) * u, yazi, {
          fontFamily: inter,
          fontWeight: 400,
          fontSize: 40 * u,
          letterSpacing: "0.02em",
          color: "#bdbdbd",
        }),
      )}
    </AbsoluteFill>
  );
};

// ───────── Ses efekti yardımcıları ─────────
const Efekt: React.FC<{ dosya: string; bas: number; ses: number }> = ({ dosya, bas, ses }) =>
  bas >= 0 ? (
    <Sequence from={bas} layout="none" name={`ses: ${dosya}`}>
      <Audio src={staticFile(`sfx/${dosya}.wav`)} volume={ses} />
    </Sequence>
  ) : null;

const sahneSesleri = (s: KSahne): { dosya: string; bas: number; ses: number }[] => {
  const b = s.bas;
  if (s.tip === "bolme") {
    const { buyukBas } = yaziZamanlari(s.kucuk, 44);
    return [
      { dosya: "kagit", bas: b, ses: 0.45 },
      { dosya: "whoosh", bas: b + 22 - 6, ses: 0.4 },
      { dosya: "boom", bas: b + 26, ses: 0.25 },
      { dosya: "pop", bas: b + buyukBas, ses: 0.18 },
    ];
  }
  if (s.tip === "detay") {
    const { buyukBas } = yaziZamanlari(s.kucuk, 24);
    return [
      { dosya: "whoosh", bas: b - 8, ses: 0.35 },
      { dosya: "kagit", bas: b + 6, ses: 0.35 },
      { dosya: "kagit", bas: b + 12, ses: 0.3 },
      { dosya: "pop", bas: b + buyukBas, ses: 0.18 },
    ];
  }
  if (s.tip === "isik") {
    const z = isikZaman(s.kare);
    return [
      { dosya: "whoosh", bas: b - 8, ses: 0.3 },
      { dosya: "boom", bas: b, ses: 0.5 },
      { dosya: "yukselis", bas: b + z[1] - 48, ses: 0.4 },
      { dosya: "whoosh", bas: b + z[2] + 6, ses: 0.28 },
    ];
  }
  return [
    { dosya: "whoosh", bas: b, ses: 0.25 },
    { dosya: "boom", bas: b + 30, ses: 0.35 },
    { dosya: "isilti", bas: b + 30, ses: 0.4 },
  ];
};

// ───────── Ana video ─────────
export const Kolaj: React.FC = () => {
  const h = kolajHesapla();
  const sesSeviyesi = (f: number) =>
    interpolate(f, [0, 20, Math.max(21, h.toplam - 45), Math.max(22, h.toplam)], [0, h.muzikSesi, h.muzikSesi, 0], SINIR);

  return (
    <AbsoluteFill style={{ backgroundColor: "#060606" }}>
      <Zemin />
      {h.sahneler.map((s, i) => {
        const onceki = h.sahneler[i - 1];
        const sonraki = h.sahneler[i + 1];
        const baglantili = (a?: KSahne, b?: KSahne) => a?.tip === "isik" && b?.tip === "kapanis";
        const icerik =
          s.tip === "bolme" ? (
            <BolmeSahne s={s} />
          ) : s.tip === "detay" ? (
            <DetaySahne s={s} />
          ) : s.tip === "isik" ? (
            <IsikSahne s={s} />
          ) : (
            <KapanisSahne s={s} renk={h.renk} ustuste={baglantili(onceki, s)} />
          );
        return (
          <Sequence key={i} from={s.bas} durationInFrames={s.kare} name={`${i + 1}. ${s.tip}`}>
            <SahneKabi
              kare={s.kare}
              giris={!baglantili(onceki, s)}
              cikis={!!sonraki && !baglantili(s, sonraki)}
            >
              {icerik}
            </SahneKabi>
          </Sequence>
        );
      })}
      <Doku />
      <Audio src={staticFile(h.muzik)} volume={sesSeviyesi} />
      {h.efektSesi
        ? h.sahneler.flatMap((s) =>
            sahneSesleri(s).map((e, j) => <Efekt key={`${s.sira}-${j}`} {...e} />),
          )
        : null}
    </AbsoluteFill>
  );
};

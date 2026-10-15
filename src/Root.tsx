import React from "react";
import { Composition } from "remotion";
import ayar from "../video.json";
import { Video } from "./Video";
import { hesapla } from "./ayarlar";
import { Kolaj } from "./kolaj/Kolaj";
import { kolajHesapla } from "./kolaj/zaman";

// video.json içindeki "stil" hangi şablonun kullanılacağını seçer:
//   "kolaj" → siyah zeminli sinematik kolaj (bölünen fotoğraf, ışık huzmesi)
//   yoksa   → sade slayt (fotoğraf + alt yazı)
export const RemotionRoot: React.FC = () => {
  const stil = (ayar as { stil?: string }).stil;
  if (stil === "kolaj") {
    const k = kolajHesapla();
    return (
      <Composition
        id="Video"
        component={Kolaj}
        durationInFrames={k.toplam}
        fps={k.fps}
        width={k.width}
        height={k.height}
      />
    );
  }
  const h = hesapla();
  return (
    <Composition
      id="Video"
      component={Video}
      durationInFrames={h.toplam}
      fps={h.fps}
      width={h.width}
      height={h.height}
    />
  );
};

import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { hesapla } from "./ayarlar";

export const RemotionRoot: React.FC = () => {
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

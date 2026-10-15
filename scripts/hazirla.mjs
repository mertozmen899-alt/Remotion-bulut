// Video üretiminden önce çalışır:
// public/fotolar, public/muzik ve public/logo.* dosyalarını bulur,
// güvenli isimlerle public/_hazir klasörüne kopyalar ve listesini
// src/generated/medya.json dosyasına yazar.
import fs from "node:fs";
import path from "node:path";

const kok = process.cwd();
const pub = path.join(kok, "public");
const fotoKlasoru = path.join(pub, "fotolar");
const muzikKlasoru = path.join(pub, "muzik");
const hazir = path.join(pub, "_hazir");
const cikti = path.join(kok, "src", "generated", "medya.json");

const RESIM = /\.(jpe?g|png|webp|gif|avif)$/i;
const VIDEO = /\.(mp4|mov|webm|m4v)$/i;
const SES = /\.(mp3|m4a|aac|wav|ogg)$/i;
const LOGO = /^logo\.(png|jpe?g|webp|svg)$/i;

const sirala = (a, b) =>
  a.localeCompare(b, "tr", { numeric: true, sensitivity: "base" });

const oku = (klasor) =>
  fs.existsSync(klasor)
    ? fs
        .readdirSync(klasor)
        .filter((f) => !f.startsWith("."))
        .filter((f) => fs.statSync(path.join(klasor, f)).isFile())
        .sort(sirala)
    : [];

fs.rmSync(hazir, { recursive: true, force: true });
fs.mkdirSync(hazir, { recursive: true });
fs.mkdirSync(path.dirname(cikti), { recursive: true });

const kopyala = (kaynak, yeniAd) => {
  fs.copyFileSync(kaynak, path.join(hazir, yeniAd));
  return `_hazir/${yeniAd}`;
};

// Fotoğraf ve video klipler
const fotoDosyalari = oku(fotoKlasoru);
const dosyalar = [];
const atlanan = [];
for (const f of fotoDosyalari) {
  const uzanti = path.extname(f).toLowerCase();
  const tur = RESIM.test(f) ? "foto" : VIDEO.test(f) ? "video" : null;
  if (!tur) {
    if (!/\.(txt|md)$/i.test(f)) atlanan.push(f);
    continue;
  }
  const sira = String(dosyalar.length + 1).padStart(3, "0");
  dosyalar.push({
    tur,
    dosya: kopyala(path.join(fotoKlasoru, f), `medya-${sira}${uzanti}`),
    asil: f,
  });
}

// Müzik (klasördeki ilk ses dosyası)
const muzikDosyasi = oku(muzikKlasoru).find((f) => SES.test(f));
const muzik = muzikDosyasi
  ? kopyala(
      path.join(muzikKlasoru, muzikDosyasi),
      `muzik${path.extname(muzikDosyasi).toLowerCase()}`,
    )
  : null;

// Logo (public/logo.png gibi)
const logoDosyasi = oku(pub).find((f) => LOGO.test(f));
const logo = logoDosyasi
  ? kopyala(
      path.join(pub, logoDosyasi),
      `logo${path.extname(logoDosyasi).toLowerCase()}`,
    )
  : null;

fs.writeFileSync(cikti, JSON.stringify({ dosyalar, muzik, logo }, null, 2));

console.log("── Hazırlık özeti ──");
console.log(`Fotoğraf/klip: ${dosyalar.length}`);
dosyalar.forEach((d, i) => console.log(`  ${i + 1}. ${d.asil} (${d.tur})`));
console.log(`Müzik: ${muzikDosyasi ?? "yok"}`);
console.log(`Logo: ${logoDosyasi ?? "yok"}`);
if (atlanan.length) {
  console.log(
    `UYARI: Şu dosyalar kullanılamadı (desteklenmeyen biçim, ör. HEIC): ${atlanan.join(", ")}`,
  );
}

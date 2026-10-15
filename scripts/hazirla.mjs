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

// video.json'da "sahneler" listesi varsa: sahnelerdeki fotoğrafları
// (foto, urun, yanFotolar) public/fotolar'dan kopyala; "http" ile
// başlıyorsa internetten indir. Sonuç: sahneDosyalari[i].foto vb.
const ayar = JSON.parse(fs.readFileSync(path.join(kok, "video.json"), "utf8"));
const sahneDosyalari = [];
const indirmeHatalari = [];

const cozumle = async (deger, ad) => {
  if (!deger) return null;
  if (/^https?:\/\//i.test(deger)) {
    const yanit = await fetch(deger, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!yanit.ok) throw new Error(`indirilemedi (${yanit.status}): ${deger}`);
    const tip = yanit.headers.get("content-type") ?? "";
    const uzanti =
      path.extname(new URL(deger).pathname).toLowerCase() ||
      (tip.includes("png") ? ".png" : tip.includes("webp") ? ".webp" : ".jpg");
    fs.writeFileSync(path.join(hazir, `${ad}${uzanti}`), Buffer.from(await yanit.arrayBuffer()));
    return `_hazir/${ad}${uzanti}`;
  }
  const kaynak = path.join(fotoKlasoru, deger);
  if (!fs.existsSync(kaynak)) throw new Error(`bulunamadı: fotolar/${deger}`);
  return kopyala(kaynak, `${ad}${path.extname(deger).toLowerCase()}`);
};

const guvenli = async (deger, ad, etiket) => {
  try {
    return await cozumle(deger, ad);
  } catch (hata) {
    indirmeHatalari.push(`${etiket}: ${hata.message}`);
    return null;
  }
};

for (const [i, s] of (ayar.sahneler ?? []).entries()) {
  const ad = `sahne-${String(i + 1).padStart(2, "0")}`;
  const etiket = `${i + 1}. sahne`;
  const yanlar = [];
  for (const [j, y] of (s.yanFotolar ?? []).entries()) {
    yanlar.push(await guvenli(y, `${ad}-yan${j + 1}`, etiket));
  }
  sahneDosyalari.push({
    foto: await guvenli(s.foto ?? s.url, `${ad}-foto`, etiket),
    urun: await guvenli(s.urun, `${ad}-urun`, etiket),
    yanFotolar: yanlar,
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

fs.writeFileSync(
  cikti,
  JSON.stringify({ dosyalar, muzik, logo, sahneDosyalari }, null, 2),
);

console.log("── Hazırlık özeti ──");
console.log(`Fotoğraf/klip: ${dosyalar.length}`);
dosyalar.forEach((d, i) => console.log(`  ${i + 1}. ${d.asil} (${d.tur})`));
console.log(`Müzik: ${muzikDosyasi ?? "yok"}`);
console.log(`Logo: ${logoDosyasi ?? "yok"}`);
sahneDosyalari.forEach((s, i) => {
  const hepsi = [s.foto, s.urun, ...s.yanFotolar].filter(Boolean);
  console.log(`Sahne ${i + 1}: ${hepsi.length ? hepsi.join(", ") : "(fotoğrafsız)"}`);
});
if (indirmeHatalari.length) {
  console.log(`UYARI: Bazı sahneler fotoğrafsız kaldı:\n  ${indirmeHatalari.join("\n  ")}`);
}
if (atlanan.length) {
  console.log(
    `UYARI: Şu dosyalar kullanılamadı (desteklenmeyen biçim, ör. HEIC): ${atlanan.join(", ")}`,
  );
}

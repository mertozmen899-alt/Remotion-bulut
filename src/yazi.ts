import { loadFont } from "@remotion/google-fonts/Montserrat";
import { loadFont as interYukle } from "@remotion/google-fonts/Inter";

// Türkçe harfler (ç, ğ, ı, İ, ö, ş, ü) için latin-ext dahil
export const { fontFamily } = loadFont("normal", {
  weights: ["500", "600", "700", "800", "900"],
  subsets: ["latin", "latin-ext"],
});

export const inter = interYukle("normal", {
  weights: ["300", "400", "600", "800"],
  subsets: ["latin", "latin-ext"],
}).fontFamily;

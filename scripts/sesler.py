"""Viral stil için telifsiz ritim ve efekt seslerini üretir.

Çalıştırma: python3 scripts/sesler.py
Çıktı: public/sfx/ritim.wav, whoosh.wav, boom.wav, pop.wav
"""
import os
import wave

import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM
rng = np.random.default_rng(7)
CIKTI = os.path.join(os.path.dirname(__file__), "..", "public", "sfx")


def kaydet(ad, x):
    x = np.tanh(x * 1.1)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    os.makedirs(CIKTI, exist_ok=True)
    with wave.open(os.path.join(CIKTI, ad), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def zaman(sure):
    return np.arange(int(sure * SR)) / SR


def alcak(x, kesim):
    """Tek kutuplu alçak geçiren filtre (kesim sabit ya da dizi)."""
    kesim = np.broadcast_to(np.asarray(kesim, dtype=float), x.shape)
    a = np.exp(-2 * np.pi * kesim / SR)
    y = np.zeros_like(x)
    onceki = 0.0
    for i in range(len(x)):
        onceki = (1 - a[i]) * x[i] + a[i] * onceki
        y[i] = onceki
    return y


def yuksek(x, kesim):
    return x - alcak(x, kesim)


def nota(n):  # MIDI -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


# ───────── Parçalar ─────────
def kick():
    t = zaman(0.42)
    f = 46 + 120 * np.exp(-t * 28)
    faz = 2 * np.pi * np.cumsum(f) / SR
    govde = np.sin(faz) * np.exp(-t * 8.5)
    klik = rng.standard_normal(len(t)) * np.exp(-t * 900) * 0.4
    return govde + klik


def clap():
    t = zaman(0.25)
    gurultu = rng.standard_normal(len(t))
    bant = yuksek(alcak(gurultu, 3200), 900)
    zarf = np.exp(-t * 22)
    for gecikme in (0.0, 0.011, 0.022):
        zarf += (t >= gecikme) * np.exp(-np.clip(t - gecikme, 0, None) * 180) * 0.8
    return bant * zarf * 1.6


def hat(guc=1.0):
    t = zaman(0.06)
    return yuksek(rng.standard_normal(len(t)), 7000) * np.exp(-t * 75) * guc


def bas(frekans, sure):
    t = zaman(sure)
    x = np.sin(2 * np.pi * frekans * t) + 0.3 * np.sin(4 * np.pi * frekans * t)
    zarf = np.minimum(1, t / 0.008) * np.exp(-t * 4)
    return np.tanh(x * 1.6) * zarf


def ped(notalar, sure):
    t = zaman(sure)
    x = np.zeros_like(t)
    for n in notalar:
        f = nota(n)
        for kayma in (-0.12, 0.12):
            faz = 2 * np.pi * f * (1 + kayma / 100) * t
            # yumuşak testere dalgası (ilk 6 harmonik)
            x += sum(np.sin(k * faz) / k for k in range(1, 7)) * 0.2
    zarf = np.minimum(1, t / 0.25) * np.minimum(1, (sure - t) / 0.2)
    return alcak(x, 1400) * zarf


def ekle(hedef, parca, saniye, guc=1.0):
    bas_i = int(saniye * SR)
    son = min(len(hedef), bas_i + len(parca))
    hedef[bas_i:son] += parca[: son - bas_i] * guc


def ritim():
    vurus = 8  # 2 ölçü = 4 sn
    toplam = np.zeros(int(vurus * BEAT * SR))
    davul = np.zeros_like(toplam)
    melodi = np.zeros_like(toplam)
    k, c = kick(), clap()
    for i in range(vurus):
        s = i * BEAT
        ekle(davul, k, s, 1.0)
        if i % 2 == 1:
            ekle(davul, c, s, 0.42)
        ekle(davul, hat(), s + BEAT / 2, 0.32)
        ekle(davul, hat(0.5), s + BEAT * 0.25, 0.14)
        ekle(davul, hat(0.5), s + BEAT * 0.75, 0.14)
    # Bas: ara vuruşlarda (house tarzı), La minör
    bas_notalari = [33, 33, 33, 36, 29, 29, 31, 31]  # A1 A1 A1 C2 F1 F1 G1 G1
    for i, n in enumerate(bas_notalari):
        ekle(melodi, bas(nota(n), BEAT * 0.45), i * BEAT + BEAT / 2, 0.55)
    # Akorlar: Am - Am - F - G (her biri 2 vuruş)
    akorlar = [[57, 60, 64], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
    for i, a in enumerate(akorlar):
        ekle(melodi, ped(a, BEAT * 2), i * BEAT * 2, 0.16)
    # Kick vurunca melodiyi kıs (pompalama hissi)
    t = np.arange(len(toplam)) / SR
    faz = (t % BEAT) / BEAT
    pompa = 0.35 + 0.65 * np.minimum(1, faz / 0.45)
    return davul + melodi * pompa


def whoosh():
    t = zaman(0.5)
    tepe = 0.32
    zarf = np.where(t < tepe, (t / tepe) ** 2.2, np.exp(-(t - tepe) * 14))
    kesim = 300 + 5200 * np.where(t < tepe, t / tepe, np.exp(-(t - tepe) * 9))
    return alcak(rng.standard_normal(len(t)), kesim) * zarf * 3


def boom():
    t = zaman(1.3)
    f = 32 + 70 * np.exp(-t * 9)
    alt = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    vurus = alcak(rng.standard_normal(len(t)), 1800) * np.exp(-t * 18) * 1.4
    kuyruk = alcak(rng.standard_normal(len(t)), 900) * np.exp(-t * 4) * 0.25
    return alt + vurus + kuyruk


def pop():
    t = zaman(0.09)
    f = 1100 * np.exp(-t * 30) + 260
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45) * np.minimum(1, t / 0.002)


def yanki(x, sure=2.2, karisim=0.35):
    """Basit oda yankısı: azalan gürültüyle FFT evrişimi."""
    t = zaman(sure)
    ir = rng.standard_normal(len(t)) * np.exp(-t * (6.9 / sure))
    ir = alcak(ir, 5000)
    ir /= np.sqrt(np.sum(ir**2))
    n = len(x) + len(ir)
    islak = np.fft.irfft(np.fft.rfft(x, n) * np.fft.rfft(ir, n), n)[: len(x)]
    return x * (1 - karisim) + islak * karisim * 2.5


def piyano(frekans, sure=3.0):
    t = zaman(sure)
    x = np.zeros_like(t)
    for k, g in ((1, 1.0), (2, 0.42), (3, 0.18), (4, 0.08)):
        x += g * np.sin(2 * np.pi * frekans * k * t * (1 + 0.0008 * k)) * np.exp(-t * (1.1 + k * 0.7))
    return x * np.minimum(1, t / 0.004)


def ambiyans(sure=20.0):
    """Sakin, sinematik zemin müziği (La minör)."""
    t = zaman(sure)
    x = np.zeros_like(t)
    # Derin drone
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * t / 7.0)
    for f, g in ((55.0, 0.22), (82.41, 0.12), (110.0, 0.08)):
        x += g * np.sin(2 * np.pi * f * t) * lfo
    # Akor pedleri (4 sn'de bir): Am9 - Fmaj7 - Am9 - Em7 - Am9
    akorlar = [[57, 60, 64, 71], [53, 57, 60, 64], [57, 60, 64, 71], [52, 55, 59, 62], [57, 60, 64, 71]]
    for i, a in enumerate(akorlar):
        ekle(x, ped(a, 5.0), i * 4.0 - 0.5 if i else 0.0, 0.22)
    # Hava (yumuşak gürültü)
    x += alcak(rng.standard_normal(len(t)), 1800) * 0.01 * (0.6 + 0.4 * np.sin(2 * np.pi * t / 5.3))
    # Seyrek piyano notaları (pentatonik)
    notalar = [(0.8, 81), (2.6, 76), (3.6, 72), (6.0, 79), (7.4, 76), (9.6, 84), (11.2, 81), (13.0, 76), (14.4, 69)]
    for s, n in notalar:
        ekle(x, piyano(nota(n)), s, 0.55)
    x = yanki(x, 2.8, 0.4)
    zarf = np.minimum(1, t / 1.2) * np.minimum(1, (sure - t) / 2.0)
    return x * zarf


def isilti():
    t = zaman(2.5)
    x = np.zeros_like(t)
    for n in (93, 100, 98, 105):
        x += np.sin(2 * np.pi * nota(n) * t) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * t))
    x *= np.exp(-t * 2.2) * np.minimum(1, t / 0.03)
    return yanki(x, 2.0, 0.5)


def yukselis():
    t = zaman(1.6)
    kesim = 200 + 6000 * (t / t[-1]) ** 2
    x = alcak(rng.standard_normal(len(t)), kesim) * (t / t[-1]) ** 2.5
    return yanki(x, 1.2, 0.3)


def kagit():
    t = zaman(0.35)
    gurultu = yuksek(alcak(rng.standard_normal(len(t)), 4500), 600)
    zarf = np.sin(np.pi * t / t[-1]) ** 1.5 * (0.8 + 0.2 * np.sin(2 * np.pi * 38 * t))
    return gurultu * zarf


if __name__ == "__main__":
    kaydet("ritim.wav", ritim())
    kaydet("whoosh.wav", whoosh())
    kaydet("boom.wav", boom())
    kaydet("pop.wav", pop())
    kaydet("ambiyans.wav", ambiyans())
    kaydet("isilti.wav", isilti())
    kaydet("yukselis.wav", yukselis())
    kaydet("kagit.wav", kagit())
    print("Sesler hazır:", os.path.abspath(CIKTI))

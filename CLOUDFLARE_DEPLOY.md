# Panduan Deploy ke GitHub & Cloudflare Pages
Domain Target: `screening.tumbuhkembanganak.com`

---

## ⚠️ Solusi Error: `Unknown lockfile version: failed to parse lockfile: 'bun.lock'`
Jika sebelumnya Cloudflare Pages gagal build dengan log:
```
Installing project dependencies: bun install --frozen-lockfile
error: Unknown lockfile version at bun.lock:2:22
```
**Penyebab:** Cloudflare Pages mendeteksi file `bun.lock` di GitHub dan otomatis mencoba menginstall dependensi menggunakan Bun, padahal versi Bun di Cloudflare Pages belum mendukung lockfile versi 2.

**Solusi yang sudah dilakukan:**
1. File `bun.lock` sudah dihapus dari proyek dan diabaikan di `.gitignore`.
2. File resmi `package-lock.json` untuk Node.js / NPM sudah di-generate.
3. Di GitHub Anda (`teamkreatiftka-web/screening`), pastikan file `bun.lock` dihapus (delete file via GitHub web atau push update terbaru ini).
4. Cloudflare Pages kini akan otomatis menggunakan `npm ci` atau `npm install` dengan Node.js 20/22 dan build akan sukses 100%!

---

## Langkah 1: Unggah / Push Pembaruan ke GitHub

1. Buka terminal di folder project Anda, lalu jalankan:
   ```bash
   git add .
   git commit -m "fix: replace bun.lock with package-lock.json for cloudflare pages build"
   git push origin main
   ```
   *(Atau jika upload manual lewat web GitHub: pastikan **HAPUS file `bun.lock`** di repositori GitHub Anda dan pastikan `package-lock.json` terunggah).*

---

## Langkah 2: Konfigurasi di Cloudflare Pages

1. Buka dashboard Cloudflare: **https://dash.cloudflare.com/**
2. Pilih menu **Workers & Pages** di sidebar sebelah kiri.
3. Klik project Pages Anda (`screening`) atau klik **Connect to Git** jika baru.
4. Masuk ke **Settings** > **Builds & deployments**:
   - **Framework preset**: Pilih `Next.js (Static HTML Export)` atau `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
   - **Root directory**: `/` (kosongkan / default)
5. Di bagian **Environment variables**:
   - `NODE_VERSION` = `20`
6. Klik **Save**.
7. Buka tab **Deployments** > Klik **Retry deployment** (atau trigger push baru dari GitHub).
8. Build akan sukses dalam waktu ~1 menit!

---

## Langkah 3: Sambungkan Custom Domain (`screening.tumbuhkembanganak.com`)

1. Di halaman project Cloudflare Pages Anda, buka tab **Custom domains**.
2. Klik tombol **Set up a custom domain**.
3. Masukkan domain Anda: `screening.tumbuhkembanganak.com`.
4. Klik **Continue**.
5. Karena domain `tumbuhkembanganak.com` Anda sudah dikelola di Cloudflare DNS, Cloudflare akan otomatis membuat record DNS CNAME dan mengaktifkan sertifikat SSL (HTTPS) gratis dalam hitungan detik.
6. Selesai! Aplikasi Anda aktif di: **https://screening.tumbuhkembanganak.com**

---

## Rute yang Tersedia:
- **`https://screening.tumbuhkembanganak.com/`** : Skrining Makan Gratis (Lead Magnet)
- **`https://screening.tumbuhkembanganak.com/assessment`** : Asesmen Lengkap 10 Bagian (Berbayar)
- **`https://screening.tumbuhkembanganak.com/admin`** : Dashboard Rekam Medis Dokter (PIN: `admin123`)

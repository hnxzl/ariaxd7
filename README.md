# Aria XD7 Web Config

Software konfigurasi **Fantech Aria XD7** berbasis web. Jalan langsung di browser lewat **WebHID**, tanpa install apa-apa, dan bisa dipakai di **Windows, macOS, maupun Linux**.

Software resmi Fantech cuma ada untuk Windows. Project ini mengatur semua setting mouse langsung dari browser, termasuk remap tombol.

![Aria XD7](button.png)

---

## Fitur

| Kategori | Yang bisa diatur |
|---|---|
| **Performa** | Polling rate (125 / 250 / 500 / 1000 Hz), Lift-off distance (1 / 2 mm), Debounce time (0–30 ms) |
| **Fitur lanjutan** | Motion Sync, Angle Snapping, Ripple Control, Sleep timer (10 detik – 10 menit) |
| **DPI** | 1–7 stage, 50–26000 DPI (kelipatan 50), warna LED per stage |
| **Lampu** | Off / Steady (brightness 1–10) / Breathing (speed 1–5) |
| **Remap tombol** | 6 tombol (kiri, kanan, tengah, back, forward, tombol DPI), lihat daftar fungsi di bawah |
| **Battery** | Persentase battery tampil di ring kanan atas |
| **Profil** | Export / import JSON, apply ke mouse, restore default. Setting terakhir otomatis tersimpan di browser |

### Fungsi yang bisa dipasang ke tombol

- **Mouse:** klik kiri, kanan, tengah, back, forward, double click, triple click
- **DPI:** DPI Loop, DPI +, DPI −, DPI Lock (DPI tetap selama tombol ditahan)
- **Keyboard:** tombol apa saja + Ctrl / Shift / Alt / Win (misal `Ctrl + C`)
- **Media:** play/pause, next, previous, volume, mute, kalkulator, browser, dll. (18 fungsi)
- **Fire key:** klik otomatis berulang
- **Lainnya:** LED on/off, ganti mode LED, disable tombol

Klik label tombol di gambar mouse, lalu pilih fungsinya. Perubahan langsung tersimpan di mouse, jadi tetap berlaku walau web ditutup atau mouse dipindah ke komputer lain.

> Minimal satu tombol harus tetap **Klik Kiri**, sama seperti aturan di software resmi.

---

## Cara pakai

### 1. Pakai browser yang mendukung WebHID

| Browser | Status |
|---|---|
| Chrome, Edge, Brave, Opera (desktop) | ✅ Bisa |
| Firefox, Safari | ❌ Tidak mendukung WebHID |
| Browser HP (Android / iOS) | ❌ Tidak bisa |

### 2. Buka halamannya

WebHID butuh *secure context*, jadi buka lewat `https://` atau `http://localhost`. Cara paling gampang:

```bash
python3 -m http.server 8000
```

Lalu buka <http://localhost:8000> di Chrome.

### 3. Connect

Colok mouse (kabel atau dongle 2.4G), klik **Connect Device**, pilih **Compx Fantech Aria XD7**, lalu klik **Connect**. Setting yang ada di mouse akan terbaca otomatis.

Kalau pakai mode wireless dan mouse sedang tidur, gerakkan mouse dulu supaya bangun.

---

## Setup khusus Linux (sekali saja)

Di Linux, device HID (`/dev/hidraw*`) defaultnya cuma bisa dibuka root, jadi browser ditolak waktu connect. Windows dan macOS nggak punya batasan ini.

Kalau web mendeteksi Linux dan connect gagal, akan muncul popup berisi perintah yang tinggal di-copy. Bisa juga langsung jalankan script ini:

```bash
./linux/install-udev.sh
```

Setelah itu **cabut-colok mouse/dongle**, lalu reload halaman. Langkah ini cuma perlu sekali per komputer.

Catatan:
- Kalau Chromium kamu versi **Snap/Flatpak** dan tetap gagal, pakai versi native karena sandbox-nya bisa memblokir akses HID.
- Detail lengkap ada di [`linux/README.md`](linux/README.md).

---

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Tombol Connect nggak memunculkan apa-apa | Pastikan pakai Chrome/Edge/Brave dan dibuka lewat `localhost` / `https`, bukan `file://` |
| Device muncul tapi gagal connect (Linux) | Jalankan setup udev di atas, lalu cabut-colok mouse |
| "Mouse not responding — move it to wake it up" | Mouse wireless sedang sleep. Gerakkan mouse, setting akan terbaca otomatis |
| Battery `--` | Battery dibaca saat connect dan tiap 60 detik. Tunggu sebentar atau reconnect |
| Perubahan nggak masuk | Lihat Console (F12). Setiap perubahan dikonfirmasi oleh mouse, dan kalau gagal akan muncul pesan error |

---

## Struktur file

```
index.html          Halaman utama
app.js              Protokol HID + logika UI
style.css           Tampilan
button.png          Gambar mouse untuk peta tombol
linux/              udev rule + installer untuk Linux
battery-probe.html  Tool debug battery
testv2.html         Halaman uji coba lama
```

---

## Catatan teknis (untuk developer)

Protokolnya didapat dari sniffing USB dan analisis software resmi (`Aria_KV__XD7_Software_V1.2`), lalu dicocokkan dengan isi memori mouse asli.

### Transport

- VID `0x25A7`, PID `0xFA7B` / `0xFA7C`
- **OUT:** feature report `0x08`, 16 byte
- **IN:** input report `0x09`, 16 byte

```
[0] cmd   [1] 0   [2..3] address (big-endian)   [4] len   [5..14] data   [15] checksum
checksum OUT = 0x4D - sum(byte 0..14)
checksum IN  = 0x4C - sum(byte 0..14)
```

| cmd | Fungsi |
|---|---|
| `0x03` | Wakeup |
| `0x04` | Minta battery → dibalas `04 00 00 00 02 <persen>` |
| `0x07` | Tulis memori → mouse mengirim echo `07 …` sebagai konfirmasi |
| `0x08` | Baca memori → dibalas `08 00 addr len data…` (maksimal 10 byte per frame) |

### Peta memori

Setiap field disimpan sebagai `nilai…, checksum`, dengan `checksum = 0x55 - sum(nilai)`.

| Alamat | Isi |
|---|---|
| `0x00` | Polling rate (1 = 1000 Hz, 2 = 500, 4 = 250, 8 = 125) |
| `0x02` | Jumlah DPI stage (1–7) |
| `0x0A` | Lift-off distance (1 / 2 mm) |
| `0x0C + i*4` | DPI stage *i*: `lo lo hi chk`. raw = `lo \| (hi>>2 & 3) << 8`, DPI = (raw+1) × 50. Contoh: 26000 = `07 07 88` |
| `0x2C + i*4` | Warna LED stage *i*: `R G B chk` |
| `0x4C` | Efek LED: `mode, ~, brightness, ~, speed, ~` |
| `0x60 + i*4` | Fungsi tombol *i* (lihat di bawah) |
| `0xA9` | Debounce (ms) |
| `0xAB` | Motion Sync |
| `0xAF` | Angle Snapping |
| `0xB1` | Ripple Control |
| `0xB5` | Sleep (1 = 10 detik … 60 = 10 menit) |
| `0x100 + i*0x20` | Data keyboard/media untuk tombol *i* |

### Encoding tombol

Urutan tombol *i*: 0 kiri, 1 kanan, 2 tengah, 3 back, 4 forward, 5 DPI.

| Byte | Fungsi |
|---|---|
| `00 00 00` | Disable |
| `01 mask 00` | Tombol mouse (mask: 01 kiri, 02 kanan, 04 tengah, 08 back, 10 forward) |
| `02 01/02/03 00` | DPI Loop / DPI + / DPI − |
| `04 32 02` / `04 32 03` | Double / triple click |
| `04 speed times` | Fire key |
| `05 00 00` | Keyboard/media, data event-nya ada di `0x100 + i*0x20` |
| `06 …` | Macro (belum didukung di web, tapi dipertahankan kalau sudah diset dari software resmi) |
| `07 00 00` / `08 00 00` | Ganti mode LED / LED on-off |
| `0A raw 00` | DPI Lock |

Format blok data keyboard/media: `jumlah_event, (op, lo, hi)…, checksum`

| op | Arti |
|---|---|
| `80` / `40` | Tekan / lepas modifier (1 Ctrl, 2 Shift, 4 Alt, 8 Win) |
| `81` / `41` | Tekan / lepas tombol keyboard (kode HID usage) |
| `82` / `42` | Tekan / lepas tombol media (HID consumer usage) |

---

## Disclaimer

Project ini **tidak berafiliasi** dengan Fantech. Semua setting ditulis ke memori mouse, jadi gunakan dengan risiko sendiri. Kalau ada yang aneh, pakai **Restore Defaults** dari menu ☰.

Made by **Eben**, created with love ♥ · [tako.id/hnxzl](https://tako.id/hnxzl)

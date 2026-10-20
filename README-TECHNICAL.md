# Aria XD7 — Referensi Teknis

**Deteksi · Bluetooth · Macro onboard**

Dokumen ini menjelaskan dua hal yang paling sering dibutuhkan kalau proyek ini
dilanjutkan orang lain: bagaimana mouse **dideteksi** (termasuk lewat Bluetooth)
dan bagaimana **macro dibaca** dari memori onboard. Isinya sengaja teknis —
format frame, alamat memori, checksum, algoritma — dan setiap klaim diberi tanda
apakah sudah terbukti di hardware atau masih dugaan.

Panduan pemakai ada di [README.md](README.md). Kalau ada perbedaan antara
keduanya, **dokumen ini yang berlaku** — README hanya versi ringkasnya.

Tanda status yang dipakai:

| Tanda | Arti |
| --- | --- |
| ✅ | Terbukti — dump/uji nyata di hardware atau disassembly driver resmi |
| ◐ | Diturunkan dari disassembly driver atau perilaku protokol, belum diuji langsung |
| ○ | Dugaan, perlu konfirmasi hardware |

---

## Isi

1. [Ringkas](#1-ringkas)
2. [Di mana kodenya](#2-di-mana-kodenya)
3. [Deteksi device](#3-deteksi-device)
4. [Format data di kabel](#4-format-data-di-kabel)
5. [Membaca macro](#5-membaca-macro)
6. [Menulis macro (pasangannya)](#6-menulis-macro-pasangannya)
7. [Referensi konstanta](#7-referensi-konstanta)
8. [Resep debug](#8-resep-debug)
9. [Test harness](#9-test-harness)
10. [Pertanyaan terbuka](#10-pertanyaan-terbuka)
11. [Glosarium](#11-glosarium)

---

## 1. Ringkas

Alur lengkap dari klik sampai macro terbaca:

```text
navigator.hid.requestDevice({ filters })      ← user memilih collection
        │
        ▼
AriaHID.pickInterface(candidates)             ← peringkat berdasarkan usage page vendor
        │
        ▼
device.open() + discoverReports()             ← report id apa saja yang ada
        │
        ▼
_guessTransport(device)                       ← usb | bluetooth (heuristik)
        │
        ▼
sendRaw16(buildWakeupPacket())                ← cmd 0x03, tidak perlu jawaban
        │
        ▼
_readBytes(0x0300 + slot*0x180, 0x20)         ← header slot 32 byte
        │
        ▼
decodeMacroSlot() sampai checksum cocok       ← berhenti di 0x55 - sum
        │
        ▼
{ slot, name, steps }                         ← model editor
```

Tiga hal yang perlu diingat sebelum menyentuh apa pun:

- **Semua transport bicara protokol yang sama.** Kabel, dongle 2.4G, dan Bluetooth
  memakai frame 16 byte yang sama; yang berbeda cuma pipa yang mengantarkannya.
- **Setiap permintaan baca maksimal 10 byte.** Tidak ada operasi "baca 384 byte";
  yang ada 39 kali baca 10 byte. Ini yang menentukan semua perhitungan waktu.
- **Browser tidak pernah menjalankan macro.** Yang menyimpan dan memainkan macro
  adalah mouse. Halaman ini cuma menyunting isi memori mouse.

---

## 2. Di mana kodenya

| File | Isi |
| --- | --- |
| `app.js` | Konstanta protokol, `AriaHID` (transport, baca/tulis memori, `readMacros`, `writeMacro`), `app` (UI, deteksi, diagnostik) |
| `macro.js` | `AriaMacros` — library, recorder, editor event, model macro di browser |
| `i18n.js` | Terjemahan EN/ID; teks Inggris jadi key |
| `index.html` | Markup: tiga window (kiri Macro Manager, tengah remap tombol, kanan performa/lampu/DPI) + dialog Diagnostics |
| `style.css` | Seluruh tampilan; canvas desain tetap 1560×940 lalu di-scale (lihat §2.1) |
| `tools/check-i18n.js` | Cek kelengkapan terjemahan (tanpa dependency) |
| `linux/install-udev.sh` | Pasang rule udev supaya Chromium boleh buka `/dev/hidraw*` |

Titik masuk yang paling sering dipakai saat maintenance:

| Simbol | Fungsi |
| --- | --- |
| `AriaHID.open(device)` | Deteksi transport, pasang listener, baca konfigurasi awal |
| `AriaHID._frame(cmd, addr, len, data)` | Satu-satunya pembuat frame OUT |
| `AriaHID._readBytes(addr, len)` | Baca toleran (chunk gagal jadi `0xFF`) — untuk dump |
| `AriaHID._readExact(addr, len)` | Baca ketat, melempar kalau ada chunk pendek — untuk verifikasi tulis |
| `AriaHID.writeMemory(addr, bytes)` | Tulis 10 byte per blok + baca balik + 3 percobaan |
| `AriaHID.readMacros()` | Pindai 16 slot, kembalikan yang terisi |
| `AriaHID.writeMacro(macro, all)` | Rakit citra slot, pilih slot bebas, tulis bagian terpakai saja |
| `AriaHID.decodeMacroSlot(bytes, available)` | Citra slot → `{ name, steps, used, complete }` |
| `app._renderDiagnostics()` | Isi dialog Diagnostics (transport, kandidat, dump) |
| `AriaMacros.compiled(macro)` | Event yang benar-benar ditulis ke slot (mode delay + repeat sudah diterapkan) |

### 2.1 Canvas tetap & zoom

Seluruh UI ada di `.stage` berukuran 1560×940 px yang di-scale dari titik
tengahnya: `scale = min(innerWidth / 1560, innerHeight / 940)`
(`app._bindStageScale`). Zoom browser hanya mengubah ukuran viewport CSS,
jadi faktor scale ikut berubah dan tampilan tidak bergeser sedikit pun.
Kolom kiri dan kanan sama lebar (`1fr 484px 1fr`), jadi gambar mouse selalu
tepat di garis tengah jendela. Sudah diuji: posisi dan ukuran gambar relatif
terhadap jendela identik di zoom 50 %, 100 %, dan 150 %.

---

## 3. Deteksi device

### 3.1 Identitas

```js
const VENDOR_ID = 0x25a7;
const PID_BLUETOOTH = 0xfa6c;
const PRODUCT_IDS = [0xfa7b, 0xfa7c, PID_BLUETOOTH]; // kabel/dongle, kabel/dongle, Bluetooth
```

`0xFA6C` adalah PID mode Bluetooth ✅ — diambil dari modalias BlueZ unit
asli (`usb:v25A7pFA6Cd0300`). Catatan lama yang menyebut `0xFA7C` sebagai PID
Bluetooth itu keliru. Karena PID ini pasti, ia dipakai sebagai sinyal pertama
penentu transport (lihat 3.4).

Identitas Bluetooth unit yang sudah diperiksa ✅: nama `Aria XD7`,
alamat random, appearance `0x03C2` (mouse), layanan GATT Generic Access,
Generic Attribute, Device Information (`0x180A`), Battery (`0x180F`), dan
HID (`0x1812`).

### 3.2 Filter WebHID

Masalahnya: satu mouse muncul sebagai **beberapa baris** di pemilih Chromium,
karena Chrome mendaftarkan satu baris per *top-level collection* (mouse, keyboard,
consumer, vendor). Filter yang dipakai adalah **usage page vendor**, bukan PID:

```js
static CONFIG_USAGE_PAGES = [
  0xff00, 0xff01, 0xff02, 0xff03, 0xff04, 0xff05, 0xff06, 0xff07,
];
static configPageFilters() {
  return AriaHID.CONFIG_USAGE_PAGES.map((usagePage) => ({ vendorId: VENDOR_ID, usagePage }));
}
```

Firmware Aria memakai **0xFF00** ✅; halaman lain diterima karena sebagian build
menaikkan nomor halaman alih-alih usage (○ — belum pernah terlihat di unit ini).

Efek sampingnya: pemilih device hanya menampilkan satu baris. Itu yang membuat
keluhan "ada dua pilihan padahal cuma satu mouse" hilang.

### 3.3 Memilih koleksi yang benar

Chromium bisa memberi `collections` lebih dari satu. Urutan pemilihan:

1. Koleksi dengan `usagePage === 0xFF00` ✅
2. Koleksi mana pun dengan `usagePage & 0xFFFF >= 0xFF00` ◐
3. Koleksi yang punya `featureReports` atau `outputReports` id `0x08` ✅
4. Kalau tidak ada satu pun: lempar error berisi daftar usage page yang terdeteksi —
   inilah pesan yang muncul di UI dan di dialog Diagnostics.

Daftar kandidat asli tetap disimpan supaya dialog Diagnostics bisa menampilkan
"setiap kandidat browser, paling cocok di atas". Kalau deteksi gagal, **itu**
tempat pertama yang harus dibaca.

### 3.4 Menebak transport

Chrome tidak memberi tahu bus yang dipakai, jadi ditebak:

```js
_guessTransport(dev) {
  if (dev.productId === PID_BLUETOOTH) return "bluetooth";
  const name = (dev?.productName || "").toLowerCase();
  if (/bluetooth|\bbt\b|\bble\b/.test(name)) return "bluetooth";
  if (this._hasReport(dev, "featureReports", REPORT_OUT)) return "usb";
  if (this._hasReport(dev, "outputReports", REPORT_OUT)) return "bluetooth";
  return "usb";
}
```

| Kondisi | Hasil | Alasan |
| --- | --- | --- |
| PID `0xFA6C` | `bluetooth` | Terbukti dari modalias, dicek pertama ✅ |
| Nama device menyebut Bluetooth/BT/BLE | `bluetooth` | ◐ |
| Ada feature report 0x08 | `usb` | USB/2.4G selalu mendeklarasikannya ✅ |
| Hanya output report 0x08 | `bluetooth` | HID over GATT tidak selalu punya feature report ◐ |
| Tidak ada keduanya | `usb` | Default aman |

Transport hanya dipakai untuk dua hal: label di UI dan **skala timeout**. Kalau
tebakannya salah, gejalanya "terasa lambat" atau timeout — bukan data yang salah.
Dialog Diagnostics menampilkan nilai ini apa adanya, supaya tebakan yang meleset
kelihatan.

### 3.5 Negosiasi jalur tulis

Lewat BLE, `sendFeatureReport` bisa **berhasil di level OS tapi tidak pernah
sampai ke firmware** — dulu aplikasi lalu terkunci di jalur feature dan semua
baca timeout. Sekarang jalur hanya dianggap benar setelah ada **jawaban**:

1. Urutan coba (`_channelOrder`): Bluetooth → output report dulu; USB →
   feature report dulu; report yang memang dideklarasikan collection
   didahulukan.
2. `_probeDirectRead` mengirim wakeup + baca 1 byte di tiap jalur (2× per
   jalur). Jalur pertama yang menjawab dipakai.
3. Hasilnya tampil di Diagnostics (*Write channel*, *Channel probe*), dan
   **Copy report** menyertakan report yang dideklarasikan tiap collection +
   60 frame TX/RX terakhir.

### 3.6 Bluetooth: dari pairing sampai frame pertama

WebHID **tidak mem-pair** apa pun.

**Kenapa bukan Web Bluetooth?** Layanan HID (`0x1812`) masuk *GATT blocklist*
Chrome, jadi `navigator.bluetooth` tidak boleh membaca atau menulis
karakteristik HID mouse ini. Jalur yang tersisa — dan yang dipakai — adalah
OS mem-pair mouse sebagai HID-over-GATT, lalu Chrome mengeksposnya lewat
**WebHID** seperti device kabel. Frame 16 byte yang sama berjalan di atasnya.

Urutannya:

1. **Pairing di OS dulu.** Windows: Settings → Bluetooth. Linux: `bluetoothctl`.
   Selama belum ter-pair di OS, mouse tidak akan muncul di pemilih Chromium.
2. **Browser harus Chromium.** Chrome/Edge/Opera/Brave ≥ 89. Firefox dan Safari
   tidak punya WebHID — di sana `navigator.hid` undefined dan halaman
   menampilkan "WebHID not supported on this browser".
3. **Linux: izin akses hidraw.** Chromium membuka `/dev/hidraw*`, jadi butuh rule udev:
   ```bash
   ./linux/install-udev.sh     # sekali saja, lalu cabut-pasang mouse / dongle
   ```
   Tanpa ini gejalanya *device terdeteksi tapi gagal dibuka*. Rule kedua
   (`KERNELS=="*:25A7:*"`) yang menangkap node BLE `0005:25A7:FA6C.xxxx`.
   Tandai juga mouse sebagai *trusted* sekali (`bluetoothctl trust <MAC>`);
   tanpa itu BlueZ tidak menyambung ulang sendiri setelah mouse tidur.
4. **Koleksi vendor harus ada di mode Bluetooth.** Ini batasan firmware ○. Kalau
   BLE tidak mengekspos halaman vendor, deteksi akan gagal walaupun mouse sudah
   ter-pair. Cara memastikannya: buka **Diagnostics** saat tersambung lewat
   Bluetooth dan lihat daftar *usage pages* di baris kandidat. Kalau hanya ada
   `0x01`/`0x0c` (mouse/keyboard generik) tanpa `0xff00`, frame
   konfigurasi memang tidak tersedia lewat jalur itu — itu batasan hardware,
   bukan bug aplikasi.
5. **Timeout naik otomatis.** `_timeoutScale = 2.5` untuk Bluetooth ◐: baca
   default 900 ms jadi 2250 ms, jeda tulis 12 ms jadi 30 ms. Tanpa ini, membaca
   ratusan byte per slot akan gagal terus di BLE.
6. **Sambung ulang otomatis.** Mouse BLE memutus link saat tidur. Event
   `navigator.hid` `connect` langsung memicu `autoConnect()`; sebagai cadangan
   `scheduleReconnect()` mencoba 6× dengan jeda 3 detik. Listener
   `inputreport` dipasang sekali per objek device, karena Chrome memberi objek
   yang sama lagi saat tersambung ulang.

### 3.7 Kalau deteksi gagal — pohon keputusan

```text
Tidak muncul di pemilih?
├─ Mouse ter-pair di OS?                    → pair dulu, WebHID tidak mem-pair
├─ Browser Chromium/WebHID?                 → cek navigator.hid
├─ Device muncul tapi open() gagal?
│   └─ Linux: rule udev belum dipasang     → ./linux/install-udev.sh
└─ Muncul, tapi "No usable Aria XD7 interface"
    ├─ lihat daftar usagePages di pesan / Diagnostics
    ├─ ada 0xFF00 → tekan Re-scan (izin dari navigator.hid sudah tersimpan)
    └─ tidak ada 0xFF00 → transport itu tidak membawa koleksi vendor

Tersambung tapi baca selalu timeout?
├─ _outMode salah?                          → lihat Write channel di Diagnostics
├─ Bluetooth & lambat?                      → timeout sudah 2.5x; cek sinyal/baterai
└─ Mouse tidur?                             → kirim wakeup (cmd 0x03) sebelum baca
```

Frame wakeup (`0x03`) dikirim di awal `readMacros()` dan `dumpMemory()`;
kegagalannya diabaikan karena fungsinya cuma membangunkan mouse yang tidur.

---

## 4. Format data di kabel

### 4.1 Report

| Arah | Report ID | Panjang | Isi |
| --- | --- | --- | --- |
| Host → mouse | `0x08` | 16 byte | perintah, alamat, panjang, data, checksum |
| Mouse → host | `0x09` | 16 byte | header jawaban + data + checksum |

Report ID dikirim sebagai argumen WebHID (`sendFeatureReport(0x08, payload)`),
**bukan** di dalam payload. Payload selalu 16 byte, walaupun data yang dibawa
cuma 10.

### 4.2 Frame OUT

```text
[0]      cmd        0x08 baca, 0x07 tulis, 0x03 bangunkan
[1]      0x00       (padding)
[2]      addrHi
[3]      addrLo
[4]      len        jumlah byte data (maks 10)
[5..14]  data       maks 10 byte, sisanya 0
[15]     checksum   (0x4D - sum(byte 0..14)) & 0xFF
```

### 4.3 Frame IN

```text
[0]      cmd        echo perintah / 0x08 untuk data
[1]      status     0x00 atau 0x08, keduanya diterima
[2]      addrHi
[3]      addrLo
[4]      len
[5..14]  data
[15]     checksum   (0x4C - sum(byte 0..14)) & 0xFF
```

Catatan untuk maintenance: jalur `inputreport` membaca alamat sebagai
big-endian (`bytes[2] << 8 | bytes[3]`) ✅, sedangkan jalur cadangan
`GET_FEATURE` menerima **dua** urutan byte (`08 08 lo hi` dan `08 00 hi lo`) ◐
karena ada firmware yang membalik urutannya. Kalau menambah jalur baca baru,
salin kelonggaran ini.

### 4.4 Checksum

Tiga rumus berbeda, jangan tertukar:

| Cakupan | Rumus | Dipakai di |
| --- | --- | --- |
| Frame OUT | `(0x4D - Σ byte[0..14]) & 0xFF` | `_frame()` |
| Frame IN | `(0x4C - Σ byte[0..14]) & 0xFF` | validasi opsional (`debug`) |
| Field konfigurasi | `(0x55 - Σ nilai) & 0xFF` | setiap field di memori konfig |
| Area event macro | `(0x55 - Σ byte event) & 0xFF` | slot macro |

Field konfigurasi dengan checksum yang tidak cocok **ditolak** (dianggap belum
terbaca), bukan diperbaiki. Dengan begitu memori setengah jadi tidak pernah
diterjemahkan jadi nilai yang kelihatan masuk akal.

### 4.5 Perintah dan anggaran waktu

| Perintah | Hex | Jawaban |
| --- | --- | --- |
| Baca | `0x08` | frame IN `0x08` berisi data |
| Tulis | `0x07` | gema `0x07` (alamat harus sama) |
| Bangunkan | `0x03` | tidak perlu jawaban |
| Baterai | `0x04` | dikirim mouse sendiri: `04 00 00 00 02 <pct>`, 0x64 = 100% |

Yang diabaikan: `0x1C` (ACK). Byte ke-1 bernilai `0x01` punya arti khusus:
firmware itu tidak mengirim data lewat `inputreport`, jadi aplikasi memicu
jalur cadangan `GET_FEATURE` alih-alih menyerah.

Anggaran waktu yang berlaku sekarang:

| Parameter | Default | Bluetooth |
| --- | --- | --- |
| Timeout baca (chunk) | 900 ms | 2250 ms |
| Timeout baca ketat | 1200 ms | 3000 ms |
| Timeout dump (chunk) | 1500 ms | 3750 ms |
| Jeda antar blok tulis | 12 ms | 30 ms |
| Percobaan tulis per blok | 3 (dengan baca balik) | 3 |

Baca diserialkan lewat satu antrean, satu chunk per giliran, supaya tulisan user
bisa menyelip di antara chunk dan tidak menunggu satu siklus baca penuh.

---

## 5. Macro onboard

> **Macro Manager sudah dihapus dari aplikasi.** Di unit asli, penulisan ulang
> slot yang sudah terisi tidak diterima (echo OK, isi tetap lama saat dibaca
> balik) dan byte mode tidak dijalankan seperti di firmware CompX lain. Bagian
> ini tinggal sebagai referensi format yang sudah terverifikasi.

> **Koreksi penting (versi ini).** Catatan lama di dokumen ini (header tanpa
> jumlah event, jenis `0x04` = modifier, slot bebas, loop tidak ada di
> firmware) **salah**. Yang di bawah ini diverifikasi dari dump memori unit
> asli (`aria-xd7-memory.bin`) dan cocok byte-per-byte dengan Lamzu Atlantis,
> firmware CompX yang alamat konfigurasinya identik (0x0A LOD, 0x60 tombol,
> 0xA9 debounce, 0x100 combo, 0x300 macro, stride 384, 70 event) —
> [LeadSun/lamzu-cfg](https://github.com/LeadSun/lamzu-cfg) `src/atlantis.rs`.

### 5.1 Peta alamat

```text
0x0000  konfigurasi
0x0060  entri tombol, 4 byte: kelas, v1, v2, checksum
0x0100  blok combo keyboard/media per tombol (0x20 byte)
0x0300  slot macro 0 … stride 0x180, slot i milik tombol i
```

### 5.2 Isi satu slot ✅

```text
+0x00   panjang nama dalam byte (UTF-16LE di Aria, maks. 30)
+0x01   nama
+0x1F   jumlah event n (1..70)
+0x20   n × [op, lo, hi, delayHi, delayLo]
+0x20+5n checksum = (0x55 - (n + Σ byte event)) & 0xFF
```

Checksum **mencakup byte jumlah** dan tidak mencakup nama. Contoh dari dump
(slot 3, nama "firte"): `… 02 | 84 01 00 00 00 | 44 01 00 00 00 | 89`:
`0x02 + 0x84 + 0x01 + 0x44 + 0x01 = 0xCC`, `0x55 - 0xCC = 0x89` ✅.

### 5.3 Event ✅

`op = (0x80 tekan | 0x40 lepas) | jenis`; nilai 16 bit little-endian di `lo hi`.

| Jenis | Nilai |
| --- | --- |
| `0x00` | Modifier mask (1 LCtrl, 2 LShift, 4 LAlt, 8 LWin, 0x10/0x20/0x40/0x80 kanan) |
| `0x01` | Keyboard (HID usage) |
| `0x02` | Consumer / media (HID consumer usage) |
| `0x04` | Tombol mouse (1 kiri, 2 kanan, 4 tengah, 8 back, 16 forward) |

Sama dengan encoding blok combo di 0x100 (80/40, 81/41, 82/42). Delay = jeda
setelah event, ms, big-endian. Editor menampilkan delay sebagai baris
tersendiri dan melipatnya ke event sebelumnya saat menulis
(`AriaMacros.compiled`).

### 5.4 Mode eksekusi

Disimpan di entri tombol, bukan di slot: `06 <slot> <mode>`.

| `mode` | Aria XD7 | Lamzu (CompX lebih baru) |
| --- | --- | --- |
| `1..252` | Putar N kali ✅ | sama |
| `253` | **Putar 253 kali** ✅ (uji unit asli: macro jalan terus) | Toggle |
| `254` | Ulang sampai ada tombol lain ditekan ◐ | Ulang selama ditahan |
| `255` | Ulang selama tombol ditahan ◐ | Ulang sampai tombol lain |

Firmware Aria tidak punya toggle (driver resmi Aria hanya menawarkan jumlah,
"sampai tombol dilepas", dan "sampai tombol lain ditekan"). 254 terbukti
**tidak** berperilaku "selama ditahan" di Aria, jadi pasangan 254/255 dibalik
dari Lamzu; ◐ sampai mode *While Pressed* (255) terbukti di hardware.

### 5.5 Baca & tulis

- **Tulis** (`writeMacroForButton(idx, …)`): citra slot ditulis ke slot `idx`
  (sampai checksum + 3 nol, ekor slot tidak disentuh), setiap blok 10 byte
  dibaca balik dan diulang sampai 3×, lalu entri tombol `idx` ditulis
  `06 idx mode`. Slot = indeks tombol, seperti driver resmi (dump menunjukkan
  macro yang sama di slot 3 dan 4 untuk Back dan Forward).
- **Baca** (`readMacroSlot`): header 32 byte → `n` → `5n + 1` byte → cek
  checksum. Saat connect, slot yang ditunjuk entri tombol `06` otomatis dibaca
  ke Macro List.

## 7. Referensi konstanta

### 7.1 Memori konfigurasi

Setiap field diikuti satu byte checksum `(0x55 - Σ nilai)` ✅.

| Field | Alamat | Nilai |
| --- | --- | --- |
| Polling rate | `0x00` | 1 = 1000 Hz, 2 = 500, 4 = 250, 8 = 125 |
| Jumlah stage DPI | `0x02` | 1..7 |
| Lift-off distance | `0x0A` | 1 = 1 mm, 2 = 2 mm |
| DPI per stage | `0x0C + i*4` | raw, raw, 0x00, checksum |
| Warna LED per stage | `0x2C + i*4` | R, G, B, checksum |
| Efek LED | `0x4C` | mode, ~mode, brightness, ~brightness, speed, ~speed |
| Debounce | `0xA9` | milidetik |
| Motion sync | `0xAB` | 0 / 1 |
| Angle snapping | `0xAF` | 0 / 1 |
| Ripple control | `0xB1` | 0 / 1 |
| Sleep timer | `0xB5` | 1 = 10 s, 2 = 20 s, 3 = 30 s, 6 = 1 m, 12 = 2 m, 30 = 5 m, 60 = 10 m |

### 7.2 Macro

| Konstanta | Nilai | Arti |
| --- | --- | --- |
| `MACRO_BASE` | `0x0300` | alamat slot 0 |
| `MACRO_STRIDE` | `0x0180` | 384 byte per slot |
| `MACRO_SLOTS` | 16 | jumlah slot onboard |
| `MACRO_MAX_EVENTS` | 70 | event per macro |
| `MACRO_COUNT_OFF` | `0x1F` | jumlah event |
| `MACRO_EVENT_OFF` | `0x20` | awal area event |
| `MACRO_OP_PRESS` / `RELEASE` | `0x80` / `0x40` | tekan / lepas ✅ |
| `MACRO_KIND` | mod 0, key 1, media 2, mouse 4 | ✅ |
| `MACRO_MODE` | toggle 253, hold 254, any 255 | byte ke-3 entri tombol |

### 7.3 Batas yang terlihat di UI

| Batas | Nilai | Konsekuensi |
| --- | --- | --- |
| Nama macro | 15 karakter, BMP saja | nama lebih panjang dipotong; emoji di luar BMP memotong nama di situ |
| Event per macro | 70 | lebih dari itu ditolak sebelum menulis |
| Slot onboard | 16 | "All 16 onboard macro slots are taken" |
| Byte per transfer | 10 | semua baca/tulis dipecah jadi blok |

---

## 8. Resep debug

**Log mentah di console.** `AriaHID.debug = true` (default di kode) mencetak setiap
frame: `[ARIA] connected`, TX/RX per report, frame IN dengan checksum salah,
dan kegagalan `receiveFeatureReport`. Ini alat pertama sebelum menyentuh apa pun.

**Dialog Diagnostics** (tombol di kanan atas) menampilkan: status, transport,
interface yang dipakai, write channel, hasil baca balik terakhir, baterai
terakhir, daftar kandidat lengkap dengan usage page-nya, dan tombol **Dump
memory** yang membaca 8 KB lalu mengunduh `aria-xd7-memory.bin`.

**Membaca dump.** Slot macro ada di `0x300 + i * 0x180`; cari slot yang byte
0-nya bukan `0xFF`. Struktur per slot ada di [5.2](#52-isi-satu-slot).
`hitung.js` di repo berisi potongan perhitungan checksum yang dipakai saat
membongkar format ini — bukan aplikasi, tapi berguna sebagai referensi cepat.

**Membandingkan dengan driver.** Dump dari aplikasi ini dan dari driver resmi
untuk konfigurasi yang sama harus identik. Kalau berbeda, bedanya menunjukkan
field mana yang belum dipetakan.

**Log sniffer.** `aria-xd7-sniffer-*.log` berisi tangkapan lalu lintas asli
(baris `[IN 0x09]` 16 byte) — referensi yang paling dipercaya kalau ada
keraguan soal susunan frame.

---

## 9. Test harness

Repo ini sengaja tanpa dependency runtime. Test yang dipakai saat pengembangan
berjalan di Node + jsdom, dengan `hid` palsu yang meniru memori mouse:

```js
// Inti mock: cukup tiru empat metode WebHID yang dipakai app.js
const fakeDevice = {
  opened: true, vendorId: 0x25a7, productId: 0xfa7b,
  collections: [{ usagePage: 0xff00 }],
  featureReports: [{ reportId: 0x08 }],
  outputReports: [{ reportId: 0x09 }],
  addEventListener() {},
  async sendFeatureReport(id, payload) { /* terapkan ke memori palsu, balas lewat inputreport */ },
  async receiveFeatureReport(id) { /* kembalikan 16 byte dari memori palsu */ },
};
globalThis.navigator.hid = { getDevices: async () => [fakeDevice], addEventListener() {} };
```

Yang layak diuji ulang tiap kali protokol disentuh:

1. Tulis macro → baca balik → nama dan langkah harus sama persis.
2. Checksum slot dihitung ulang dari event yang ditulis.
3. Ekor slot yang tidak ditulis tetap utuh.
4. Tulis gagal (blok hilang) harus melempar, bukan diam.
5. Baca pendek (chunk kurang) harus melempar di jalur ketat.
6. Slot kosong `0xFF` dilewati, bukan jadi macro berisi sampah.

---

## 10. Pertanyaan terbuka

Hal-hal yang **belum** terbukti dan sebaiknya diuji lebih dulu oleh siapa pun
yang melanjutkan:

0. **Koleksi vendor lewat Bluetooth — TERJAWAB ✅: tidak ada.** Unit asli
   (PID `0xFA6C`) hanya mengekspos usage page `0x1` dan `0xc`. Konfigurasi
   lewat Bluetooth tidak mungkin; `pair()` menampilkan `showBluetoothLimit()`.
1. **Polaritas tekan/lepas** ✅ — dump asli berisi `84 … / 44 …` yang ditulis driver resmi untuk klik kiri: `0x80` tekan, `0x40` lepas.
2. **Arti delay** (◐). Jeda "setelah event" versus "sebelum event". Bandingkan
   dengan rekaman yang dibuat memakai driver resmi.
3. **Koleksi vendor di mode Bluetooth** (○). Apakah firmware BLE mengekspos
   `usagePage 0xFF00` dan feature report `0x08`? Kalau tidak, baca/tulis
   macro lewat Bluetooth memang tidak mungkin — dan itu batasan hardware, bukan
   bug. Bukti cepat: daftar kandidat di Diagnostics saat tersambung lewat BT.
4. **Jalur `GET_FEATURE`** (◐). Firmware mana yang benar-benar menjawab
   `receiveFeatureReport` alih-alih mendorong `inputreport`. Aplikasi mencoba
   keduanya, jadi kalau ada yang aneh, log `[ARIA] receiveFeatureReport failed`
   adalah petunjuknya.
5. **Mode eksekusi di Aria** (◐) — encoding `06 slot mode` (253/254/255) terbukti di firmware CompX Lamzu; uji di Aria dengan memasang macro *While Pressed* lalu menahan tombolnya.
6. **Batas event di firmware.** Konstanta driver `0x46` = 70, sama dengan
   `MACRO_MAX_EVENTS`. Yang belum diketahui: apakah firmware memakai batas yang
   sama. Kalau ternyata lebih kecil, macro panjang terpotong tanpa pesan. Uji:
   tulis macro 70 event, baca kembali, bandingkan jumlah event-nya.
7. **Jeda event terakhir hilang saat round-trip.** Ini bukan dugaan, tapi
   perilaku `decodeMacroSlot()`: ia berhenti saat checksum cocok **sebelum**
   menempelkan jeda ke langkah terakhir, jadi jeda di belakang event terakhir
   kembali sebagai 0. Aman untuk playback (jeda sesudah event terakhir tidak
   pernah terpakai), tapi bisa mengagetkan kalau membandingkan byte slot sebelum
   dan sesudah simpan.

---

## 11. Glosarium

| Istilah | Arti di dokumen ini |
| --- | --- |
| **Slot** | Satu tempat macro di memori onboard mouse (16 total) |
| **Stride** | Jarak antar slot, 0x180 byte |
| **Report** | Paket HID; di sini selalu 16 byte, id 0x08 (keluar) / 0x09 (masuk) |
| **Feature report** | Jalur HID dua arah yang bisa dibaca ulang (GET_FEATURE / SET_FEATURE) |
| **Output report** | Jalur HID satu arah dari host ke device |
| **Collection** | Satu antarmuka logis dalam device; Chrome menampilkan satu baris per collection |
| **Usage page** | Pengelompokan usage HID; 0xFF00 = vendor |
| **Transport** | Pipa fisik: kabel USB, dongle 2.4G, atau Bluetooth |
| **Citra slot** | Buffer 384 byte hasil rakitan yang siap ditulis ke memori |

---

Dokumen ini hidup. Kalau ada klaim di sini yang terbukti salah di hardware,
perbaiki dokumennya bersamaan dengan kodenya — tanda ✅ ◐ ○ ada supaya perbedaan
antara "sudah diuji" dan "masih dugaan" tidak hilang.

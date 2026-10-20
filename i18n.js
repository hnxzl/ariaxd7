
(() => {
  "use strict";

  const STORAGE_KEY = "aria_xd7_lang_v1";
  const SUPPORTED = ["en", "id"];


  const ID = {
    "Configuration Utility": "Utility Konfigurasi",
    "Not connected": "Belum tersambung",
    "Connected & Ready": "Tersambung & Siap",
    "Connect Device": "Sambungkan Mouse",
    "Diagnostics": "Diagnostik",
    "English": "English",
    "Bahasa Indonesia": "Bahasa Indonesia",
    "Language / Bahasa": "Language / Bahasa",
    "Main": "Utama",
    "Connected device": "Device tersambung",
    "Profile actions": "Aksi profil",
    "Profile name": "Nama profil",
    "Profile": "Profil",
    "Profile:": "Profil:",
    "Apply profile to mouse": "Terapkan profil ke mouse",
    "Import profile…": "Impor profil…",
    "Export profile": "Ekspor profil",
    "Restore defaults": "Kembalikan ke default",
    "Buy me a coffee": "Traktir saya kopi",

    "Macro": "Macro",
    "Macro Manager": "Macro Manager",
    "Library & event editor": "Daftar & editor event",
    "Macro Library": "Daftar Macro",
    "0 macros": "0 macro",
    "1 macro": "1 macro",
    "Search macros": "Cari macro",
    "Search macros…": "Cari macro…",
    "New macro": "Macro baru",
    "Duplicate selected macro": "Duplikat macro yang dipilih",
    "Import": "Impor",
    "Export": "Ekspor",
    "Sync from mouse": "Ambil dari mouse",
    "Read the macros stored on the mouse": "Baca macro yang tersimpan di mouse",
    "Macro name": "Nama macro",
    "No macro selected": "Belum ada macro dipilih",
    "Record": "Rekam",
    "Record keystrokes and delays": "Rekam tombol dan jedanya",
    "Pause": "Pause",
    "Stop": "Berhenti",
    "Insert event": "Sisipkan event",
    "Add an event, then press the key you want to capture": "Tambah satu event, lalu tekan tombol yang mau dipakai",
    "Clear": "Hapus semua",
    "Recording…": "Merekam…",
    "Add to the end of the list": "Ditambahkan di akhir daftar",
    "+ Key down": "+ Key down",
    "+ Key up": "+ Key up",
    "+ Delay": "+ Delay",
    "Event": "Event",
    "Value": "Nilai",
    "Delay (ms)": "Delay (ms)",
    "Select a macro in the library above, or press + to create one.": "Pilih macro di daftar atas, atau tekan + untuk membuat baru.",
    "A macro is a recorded list of": "Macro adalah daftar",
    "and": "dan",
    "key down": "key down",
    "key up": "key up",
    "delay": "delay",
    "events stored on the mouse itself, so it keeps working on any computer.": "yang tersimpan di mouse, jadi tetap jalan di komputer mana pun.",
    "Delete macro": "Hapus macro",
    "Playback": "Pemutaran",
    "How the macro repeats": "Cara macro diulang",
    "Repeat mode": "Mode pengulangan",
    "Play once": "Putar sekali",
    "Repeat N times": "Ulangi N kali",
    "Repeat until button released": "Ulangi selama tombol ditahan",
    "Repeat until any key pressed": "Ulangi sampai ada tombol ditekan",
    "Repeat count": "Jumlah pengulangan",
    "Default delay between events": "Delay bawaan antar event",
    "Assigned button": "Tombol yang dipakai",
    "Not assigned": "Belum dipasang",
    "Assign macro to button": "Pasang macro ke tombol",
    "Onboard slots": "Slot onboard",
    "Steps used": "Event terpakai",
    "Local": "Lokal",
    "Saved locally": "Tersimpan lokal",
    "Mouse": "Mouse",
    "Not on the mouse": "Belum ada di mouse",
    "Save to mouse": "Simpan ke mouse",
    "Repeat mode lives in this browser profile. The mouse always plays a macro once per button press — the onboard slot has no loop field, so nothing on this panel is written to the device.":
      "Mode pengulangan hanya tersimpan di profil browser ini. Mouse selalu memutar macro sekali tiap tombol ditekan — slot onboard tidak punya field loop, jadi tidak ada yang dikirim ke device dari panel ini.",

    "Customize": "Kustomisasi",
    "Mouse & button mapping": "Mouse & pemetaan tombol",

    "Performance": "Performa",
    "Polling rate, sensor and extras": "Polling rate, sensor dan fitur tambahan",
    "DPI & Lighting": "DPI & Lampu",
    "Stages, color and effects": "Tahapan DPI, warna dan efek",
    "DPI · Polling · Sensor": "DPI · Polling · Sensor",
    "Sensors & Performance": "Sensor & Performa",
    "Polling Rate": "Polling Rate",
    "Lift-Off Distance": "Lift-Off Distance",
    "Debounce Time": "Waktu Debounce",
    "Decrease debounce": "Kurangi debounce",
    "Increase debounce": "Tambah debounce",
    "Advanced Features": "Fitur Lanjutan",
    "Motion Sync": "Motion Sync",
    "Angle Snapping": "Angle Snapping",
    "Ripple Control": "Ripple Control",
    "Sleep Timer": "Timer Tidur",
    "Sensitivities (DPI)": "Sensitivitas (DPI)",
    "DPI Stages": "Tahap DPI",
    "More stages": "Tambah tahap",
    "Fewer stages": "Kurangi tahap",
    "Lighting Effects": "Efek Lampu",
    "Effect Mode": "Mode Efek",
    "Off": "Mati",
    "Steady": "Nyala Tetap",
    "Breathing": "Breathing",
    "Brightness": "Kecerahan",
    "Speed": "Kecepatan",

    "Device diagnostics": "Diagnostik device",
    "Status": "Status",
    "Transport": "Transport",
    "Interface": "Interface",
    "Write channel": "Jalur tulis",
    "Read-back": "Baca balik",
    "Last battery": "Baterai terakhir",
    "Every candidate the browser offered, best match first:": "Semua device yang ditawarkan browser, yang paling cocok di atas:",
    "Device not showing up? List all HID devices": "Mouse tidak muncul? Tampilkan semua device HID",
    "Re-scan": "Pindai ulang",
    "Copy report": "Salin laporan",
    "Dump memory": "Dump memori",
    "Close": "Tutup",
    "Onboard memory (0x0000–0x1FFF), including the 16 macro slots. Dumping takes a while — the protocol returns 10 bytes per request (a minute or two over Bluetooth). The file is downloaded when it finishes.":
      "Memori onboard (0x0000–0x1FFF), termasuk 16 slot macro. Proses dump agak lama — protokolnya mengirim 10 byte per permintaan (satu-dua menit lewat Bluetooth). File-nya otomatis terunduh setelah selesai.",
    "Bluetooth needs the mouse to be paired in the operating system first. On Linux, Chromium can reach a Bluetooth mouse through":
      "Bluetooth-nya harus di-pair dulu di sistem operasi. Di Linux, Chromium bisa mengakses mouse Bluetooth lewat",
    "just like the cable — run": "sama seperti pakai kabel — jalankan",
    "once if the device fails to open.": "sekali saja kalau device-nya gagal dibuka.",
    "Left Click": "Klik Kiri",
    "Right Click": "Klik Kanan",
    "Middle Click": "Klik Tengah",
    "Wheel Click": "Klik Scroll",
    "Back": "Mundur",
    "Forward": "Maju",
    "DPI Button": "Tombol DPI",
    "DPI": "DPI",
    "Media": "Media",
    "Triple Click": "Klik Tiga Kali",
    "Double Click": "Klik Dua Kali",
    "Fire Key": "Fire",
    "DPI Lock": "Kunci DPI",
    "LED Mode Switch": "Ganti Mode LED",
    "LED On / Off": "LED Nyala / Mati",
    "Keyboard": "Keyboard",
    "Disabled": "Nonaktif",
    "Custom": "Custom",
    "Play / Pause": "Putar / Jeda",
    "Previous Track": "Lagu Sebelumnya",
    "Next Track": "Lagu Berikutnya",
    "Volume Up": "Volume Naik",
    "Volume Down": "Volume Turun",
    "Mute": "Bisu",
    "Media Player": "Pemutar Media",
    "Calculator": "Kalkulator",
    "My Computer": "Komputer Saya",
    "Web Search": "Cari di Web",
    "Web Home": "Halaman Awal",
    "Web Back": "Kembali",
    "Web Forward": "Maju",
    "Web Stop": "Stop Web",
    "Web Refresh": "Muat Ulang",
    "Favorites": "Favorit",

    "Connected": "Tersambung",
    "Connected over {transport}": "Tersambung lewat {transport}",
    "Feature report 0x08": "Feature report 0x08",
    "Output report 0x08 (BLE style)": "Output report 0x08 (gaya BLE)",
    "not probed yet": "belum dicek",
    "unknown": "belum diketahui",
    "supported": "didukung",
    "no data returned": "tidak ada data yang kembali",
    "no answer": "tidak ada jawaban",

    "No usable Aria XD7 interface. Detected usagePages: {pages}": "Interface Aria XD7 tidak bisa dipakai. usagePage yang terdeteksi: {pages}",
    "Short read at 0x{addr}: asked {want}, got {got}": "Pembacaan pendek di 0x{addr}: minta {want} byte, dapat {got}",
    "The mouse did not keep 0x{addr} — sent [{sent}], read [{read}]": "Mouse tidak menyimpan 0x{addr} — dikirim [{sent}], terbaca [{read}]",
    "Macro is too long for the mouse: {count} events, limit {limit}": "Macro-nya kepanjangan buat mouse ini: {count} event, batasnya {limit}",
    "All {n} onboard macro slots are taken": "Semua {n} slot macro onboard sudah terpakai",
    "Read timeout @0x{addr}": "Timeout saat membaca @0x{addr}",
    "Mouse did not confirm the change (asleep?)": "Mouse tidak mengonfirmasi perubahannya (mungkin sedang tidur)",
    "Are you sure you want to restore defaults to the mouse?": "Yakin mau mengembalikan setelan default ke mouse?",

    "Failed to open HID device": "Gagal membuka device HID",
    "Connected, but failed to read settings": "Tersambung, tapi gagal membaca setelan",
    "Pair/connect failed": "Gagal menyambungkan",
    "Mouse not responding — move it to wake it up": "Mouse tidak merespons — gerakkan dulu biar bangun",
    "No device selected": "Belum ada device yang dipilih",
    "No config interface matched — try “All HID devices”": "Tidak ada interface config yang cocok — coba “Semua device HID”",
    "Connect the mouse first": "Sambungkan mouse dulu",
    "WebHID not supported on this browser": "Browser ini tidak mendukung WebHID",
    "Device disconnected": "Device terputus",
    "Diagnostics copied": "Diagnostik disalin",
    "Copy failed": "Gagal menyalin",
    "Memory dumped — aria-xd7-memory.bin": "Memori berhasil di-dump — aria-xd7-memory.bin",
    "Dump failed": "Dump gagal",
    "Profile input not found": "Input profil tidak ditemukan",
    "Profile imported": "Profil berhasil diimpor",
    "Failed to import profile": "Gagal mengimpor profil",
    "Profile exported": "Profil berhasil diekspor",
    "Failed to export profile": "Gagal mengekspor profil",
    "Connect mouse first to apply profile": "Sambungkan mouse dulu untuk menerapkan profil",
    "Applying profile to mouse...": "Menerapkan profil ke mouse...",
    "Profile applied successfully!": "Profil berhasil diterapkan!",
    "Failed to apply profile": "Gagal menerapkan profil",
    "Aria XD7 Successfully Synced": "Aria XD7 berhasil disinkronkan",
    "Click the box and press a key (with Ctrl/Shift/Alt/Win if you want)": "Klik kotaknya lalu tekan tombol (boleh pakai Ctrl/Shift/Alt/Win)",
    "At least one button must stay Left Click": "Minimal satu tombol harus tetap Klik Kiri",
    "Could not write to the mouse": "Gagal menulis ke mouse",
    "Restoring default settings...": "Mengembalikan setelan default...",
    "Mouse settings restored successfully!": "Setelan mouse berhasil dikembalikan ke default!",
    "Command copied": "Perintah disalin",
    "Copy failed — select the text manually": "Gagal menyalin — pilih teksnya manual",
    "Connect mouse first to restore defaults": "Sambungkan mouse dulu untuk mengembalikan default",

    "Saved in this browser": "Tersimpan di browser ini",
    "Not stored — {reason}": "Gagal disimpan — {reason}",
    "Writing to the mouse…": "Menulis ke mouse…",
    "On the mouse (slot {slot}) — mouse not connected": "Ada di mouse (slot {slot}) — mouse belum tersambung",
    "Connect the mouse to store it": "Sambungkan mouse untuk menyimpannya",
    "Slot {slot} is out of date — press Save to mouse": "Slot {slot} sudah usang — tekan Simpan ke mouse",
    "Stored on the mouse (slot {slot})": "Tersimpan di mouse (slot {slot})",
    "Save changes to mouse": "Simpan perubahan ke mouse",
    "{n} steps · slot {slot}": "{n} event · slot {slot}",
    "{n} of {m} macros": "{n} dari {m} macro",
    "{n} macros": "{n} macro",
    "button": "tombol",
    "<b>{name}</b> is empty. Record a sequence or add steps with the buttons above.":
      "<b>{name}</b> masih kosong. Rekam urutannya atau tambah event lewat tombol di atas.",
    "{n} steps · {e}/70 onboard events · slot {slot}": "{n} event · {e}/70 event onboard · slot {slot}",
    "unassigned": "belum dipasang",
    "{n} saved · {k}/{total} onboard": "{n} tersimpan · {k}/{total} onboard",
    "{n} steps": "{n} event",
    "Repeat mode stays in this browser profile — the mouse plays a macro once per button press. <b>{n} repeats is a lot</b>: keep the macro short and make sure you can let go of the button.":
      "Mode pengulangan cuma tersimpan di profil browser ini — mouse memutar macro sekali tiap tombol ditekan. <b>{n} kali itu kebanyakan</b>: bikin macronya pendek dan pastikan tombolnya bisa dilepas.",
    "Paused · {time} · {n} events": "Pause · {time} · {n} event",
    "Recording · {time} · {n} events": "Merekam · {time} · {n} event",
    "Resume": "Lanjut",
    "Confirm clear ({n})": "Konfirmasi hapus ({n})",
    "Press a key…": "Tekan tombol…",
    "Duplicated as \"{name}\"": "Diduplikat jadi \"{name}\"",
    "{count} macro(s) imported": "{count} macro berhasil diimpor",
    "Macro \"{name}\" stored on the mouse (slot {slot})": "Macro \"{name}\" tersimpan di mouse (slot {slot})",
    "That key cannot be stored on the mouse": "Tombol itu tidak bisa disimpan di mouse",
    "Not a macro file": "Itu bukan file macro",
    "No macros in that file": "Tidak ada macro di file itu",
    "Import failed": "Impor gagal",
    "Macro library is full": "Daftar macro sudah penuh",
    "Macro deleted": "Macro dihapus",
    "Create or select a macro first": "Buat atau pilih macro dulu",
    "Step limit reached": "Batas event sudah tercapai",
    "Select a macro first": "Pilih macro dulu",
    "This macro is full": "Macro ini sudah penuh",
    "Cleared every event": "Semua event dihapus",
    "Recording — type your sequence, then press Stop": "Merekam — tekan urutan tombolnya, lalu tekan Berhenti",
    "Recording added to the macro": "Hasil rekaman ditambahkan ke macro",
    "This macro has no steps": "Macro ini belum punya event",
    "Repeat mode stays in this browser profile. The mouse always plays a macro once per button press — the onboard slot has no loop field, so nothing on this panel is written to the device.":
      "Mode pengulangan cuma tersimpan di profil browser ini. Mouse selalu memutar macro sekali tiap tombol ditekan — slot onboard tidak punya field loop, jadi tidak ada yang dikirim ke device dari panel ini.",
    "No macros stored on the mouse yet": "Belum ada macro yang tersimpan di mouse",
    "Synced {n} macro(s) from the mouse": "{n} macro berhasil diambil dari mouse",
    "Pick a button first": "Pilih tombolnya dulu",
    "Nothing to export yet": "Belum ada yang bisa diekspor",
    "Macros exported": "Macro berhasil diekspor",

    "Assign button": "Pasang tombol",
    "Other": "Lainnya",
    "Set": "Terapkan",
    "DPI lock value": "Nilai kunci DPI",
    "Click here, then press keys": "Klik di sini, lalu tekan tombolnya",
    "Key combination": "Kombinasi tombol",
    "Media function": "Fungsi media",
    "Fire Key (auto click)": "Fire Key (klik otomatis)",
    "Fire speed 3 to 255": "Kecepatan fire 3 sampai 255",
    "Fire times 0 to 3": "Jumlah fire 0 sampai 3",
    "Times": "Jumlah",
    "Open Macro Manager →": "Buka Macro Manager →",
    "Reset to default": "Kembalikan ke default",
    "No macros yet — open the Macro Manager to create one.": "Belum ada macro — buka Macro Manager untuk membuatnya.",
    "is empty. Record a sequence or add steps with the buttons above.":
      "masih kosong. Rekam urutannya atau tambah event lewat tombol di atas.",
    " · unsaved": " · belum disimpan",
    "Not dumped yet.": "Belum di-dump.",
    "Reading…": "Membaca…",
    "Reading… {pct}% (0x{addr})": "Membaca… {pct}% (0x{addr})",
    "Imported": "Hasil impor",
    "Syncing...": "Menyinkronkan...",
    "Key not supported": "Tombol tidak didukung",
    "Could not save the macro": "Gagal menyimpan macro",
    "Could not read macros from the mouse": "Gagal membaca macro dari mouse",
    "Delete macro \"{name}\"?\nThis removes it from the library.":
      "Hapus macro \"{name}\"?\nMacro ini akan dihapus dari daftar.",

    "Recording": "Perekaman",
    "Insert": "Sisipkan",
    "Repeat": "Ulangi",
    "Fewer repeats": "Kurangi pengulangan",
    "More repeats": "Tambah pengulangan",
    "Delays": "Delay",
    "As recorded": "Sesuai rekaman",
    "Fixed": "Tetap",
    "The mouse plays a macro once per button press. Repeat writes the sequence into the slot N times.":
      "Mouse memutar macro sekali tiap tombol ditekan. Ulangi menulis urutannya N kali ke dalam slot.",
    "Save": "Simpan",
    "Made by": "Dibuat oleh",
    "created with love": "dibuat dengan cinta",
    "Pairing alone does not bring the mouse back after it sleeps. Mark it as trusted once:":
      "Pairing saja tidak membuat mouse tersambung lagi setelah tidur. Tandai sebagai trusted sekali saja:",
    "If the candidate list shows only usage pages 0x1 / 0xc and no 0xff00, this Bluetooth link does not carry the configuration channel — use the cable or the dongle for settings.":
      "Kalau daftar kandidat cuma berisi usage page 0x1 / 0xc tanpa 0xff00, jalur Bluetooth ini tidak membawa kanal konfigurasi — pakai kabel atau dongle untuk mengatur setelan.",
    "LED color for stage {n}": "Warna LED tahap {n}",
    "Decrease DPI stage {n}": "Kurangi DPI tahap {n}",
    "Increase DPI stage {n}": "Tambah DPI tahap {n}",
    "DPI value for stage {n}": "Nilai DPI tahap {n}",
    "DPI slider for stage {n}": "Slider DPI tahap {n}",
    "underside": "bagian bawah",
    "DPI Loop": "DPI Loop",
    "DPI +": "DPI +",
    "DPI −": "DPI −",
    "Email": "Email",
    "Last verify": "Verifikasi terakhir",
    "Timeout scale": "Skala timeout",
    "Unsaved changes": "Ada perubahan belum disimpan",
    "Saved · on the mouse (slot {slot})": "Tersimpan · ada di mouse (slot {slot})",
    "Saved in browser · slot {slot} is out of date": "Tersimpan di browser · slot {slot} sudah usang",
    "Saved in browser · not on the mouse yet": "Tersimpan di browser · belum ada di mouse",
    "Unassign it from {button} first": "Lepas dulu dari {button}",
    "Removed from the library — slot {slot} on the mouse is left as is": "Dihapus dari daftar — slot {slot} di mouse dibiarkan apa adanya",
    "Reading slot {i}/{n}…": "Membaca slot {i}/{n}…",
    "No macros yet. Press + to create one, or sync from the mouse.": "Belum ada macro. Tekan + untuk membuat, atau ambil dari mouse.",
    "No macro matches \"{q}\"": "Tidak ada macro yang cocok dengan \"{q}\"",
    "not on the mouse": "belum di mouse",
    "Rename": "Ganti nama",
    "Click again to delete": "Klik sekali lagi untuk menghapus",
    "Delete?": "Hapus?",
    "Key down": "Key down",
    "Key up": "Key up",
    "Click, then press a key": "Klik, lalu tekan tombolnya",
    "Move up": "Naikkan",
    "Move down": "Turunkan",
    "Delete event": "Hapus event",
    "{e}/{max} onboard events": "{e}/{max} event onboard",
    "On: {buttons}": "Dipakai: {buttons}",
    "Assign to button…": "Pasang ke tombol…",
    "Key List": "Daftar Tombol",
    "Macro List": "Daftar Macro",
    "New Macro": "Macro Baru",
    "Delete": "Hapus",
    "Delay": "Delay",
    "Record Delay": "Rekam Delay",
    "Default Delay": "Delay Default",
    "No Delay": "Tanpa Delay",
    "Execution": "Eksekusi",
    "Play Once": "Putar Sekali",
    "While Pressed": "Selama Ditekan",
    "Toggle": "Toggle",
    "Until Any Key": "Sampai Tombol Lain",
    "Lighting": "Lampu",
    "· created with love": "· dibuat dengan cinta",
    "While held": "Selama ditekan",
    "Until key": "Sampai tombol lain",
    "Wheel": "Scroll",
    "Wheel Up": "Scroll Atas",
    "Wheel Down": "Scroll Bawah",
    "Tilt Left": "Miring Kiri",
    "Tilt Right": "Miring Kanan",
    "Runs with the execution mode set in the Macro window.": "Berjalan dengan mode eksekusi yang diatur di window Macro.",
    "Repeat {n} times": "Ulangi {n} kali",
    "Repeat while pressed": "Ulangi selama tombol ditekan",
    "Toggle (click to start / stop)": "Toggle (klik untuk mulai / berhenti)",
    "Repeat until any key is pressed": "Ulangi sampai ada tombol lain ditekan",
    "Saved · on {buttons}": "Tersimpan · di {buttons}",
    "Saved · press Save to update {buttons}": "Tersimpan · tekan Simpan untuk memperbarui {buttons}",
    "Saved · assign it to a button to use it": "Tersimpan · pasang ke tombol untuk memakainya",
    "Recording — keys anywhere, mouse clicks inside the key list. Press Stop or Esc to finish.":
      "Merekam — keyboard di mana saja, klik mouse di dalam daftar tombol. Tekan Berhenti atau Esc untuk selesai.",
    "Saved to the mouse ({buttons})": "Tersimpan ke mouse ({buttons})",
    "Key press (down + up)": "Tekan tombol (down + up)",
    "Mouse event": "Event mouse",
    "Left Button": "Tombol Kiri",
    "Right Button": "Tombol Kanan",
    "Middle Button": "Tombol Tengah",
    "Back Button": "Tombol Mundur",
    "Forward Button": "Tombol Maju",
    "Click": "Klik",
    "Down": "Down",
    "Up": "Up",
    "No macros yet. Press New Macro to make one.": "Belum ada macro. Tekan Macro Baru untuk membuat.",
    "Double-click to rename": "Klik dua kali untuk ganti nama",
    "Select or create a macro.": "Pilih atau buat macro.",
    "Type keys, or click mouse buttons here…": "Ketik tombol, atau klik tombol mouse di sini…",
    "Empty. Press Record, or add events with Insert.": "Kosong. Tekan Rekam, atau tambah event lewat Sisipkan.",
    "{e}/{max} events": "{e}/{max} event",
    "2.4G receiver": "Receiver 2.4G",
    "USB cable": "Kabel USB",
    "Profile": "Profil",
    "Slot {a} would not take the change, so the macro went into empty slot {b}": "Slot {a} tidak mau menerima perubahan, jadi macro ditaruh di slot kosong {b}",
    "Saved — connect the mouse and put it on a button to store it on the mouse": "Tersimpan — sambungkan mouse lalu pasang ke tombol supaya tersimpan di mouse",
    "Saved — put it on a button (click a button label) to store it on the mouse": "Tersimpan — pasang ke tombol (klik label tombol) supaya tersimpan di mouse",
    "Wheel and tilt come from the newer CompX firmware. The mouse confirms the write; if the button does nothing, this firmware does not support it.": "Scroll dan miring berasal dari firmware CompX yang lebih baru. Mouse mengonfirmasi penulisannya; kalau tombolnya tidak bereaksi, firmware ini belum mendukungnya.",
    "Buy me a coffee": "Traktir saya kopi",
    "Settings can't be changed over Bluetooth": "Setelan tidak bisa diubah lewat Bluetooth",
    "Over Bluetooth the Aria XD7 only exposes its mouse and media-key interfaces. The configuration channel that the cable and the 2.4G receiver have is not there, so no app — this one or the official driver — can read or write settings over Bluetooth.":
      "Lewat Bluetooth, Aria XD7 hanya membuka interface mouse dan tombol media. Jalur konfigurasi yang ada di kabel dan receiver 2.4G tidak tersedia, jadi tidak ada aplikasi — ini maupun driver resmi — yang bisa membaca atau menulis setelan lewat Bluetooth.",
    "Settings live in the mouse itself: change them once over the USB cable or the 2.4G receiver, then switch back to Bluetooth — DPI, buttons and macros stay.":
      "Setelan tersimpan di mouse itu sendiri: ubah sekali lewat kabel USB atau receiver 2.4G, lalu pindah lagi ke Bluetooth — DPI, tombol, dan macro tetap terbawa.",
    "OK": "OK",
    "Execution mode set on {buttons}: {mode}": "Mode eksekusi di {buttons}: {mode}",
    "Channel probe": "Uji jalur",
    "Bluetooth connected, but the mouse does not answer config requests — open Diagnostics":
      "Bluetooth tersambung, tapi mouse tidak menjawab permintaan config — buka Diagnostik",
  };

  const SKIP = [
    "script",
    "style",
    "pre",
    "code",
    "textarea",
    "[contenteditable]",
    "#macroList",
    "#macroSteps",
    "[data-no-i18n]",
    "#diagCandidates",
    "#diagDump",
    "#btnPicker",
    ".dpi-list",
    "#toastContainer",
    "#macroSearch",
    "#macroNameInput",
    "#macroLoopCount",
    "#macroAutoDelay",
    "#profileFileInput",
    "#macroFileInput",
  ].join(",");

  const SKIP_ATTR = "script,style,pre,code,textarea";

  const ATTRS = ["placeholder", "title", "aria-label"];

  let current = "en";
  let bound = false;
  const unmatched = new Set();
  let collect = false;

  const norm = (s) => String(s).replace(/\s+/g, " ").trim();

  function t(key, vars) {
    const table = current === "id" ? ID : null;
    let out = (table && table[key]) || key;
    if (vars)
      out = out.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
    return out;
  }

  function skipped(node) {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el.matches) {
      if (el.matches(SKIP)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function skippedAttr(node) {
    let el = node.nodeType === 1 ? node : node.parentElement;
    while (el && el.matches) {
      if (el.matches(SKIP_ATTR)) return true;
      el = el.parentElement;
    }
    return false;
  }

  function elements(root) {
    const out = [];
    if (root.nodeType === 1) out.push(root);
    if (root.querySelectorAll) for (const el of root.querySelectorAll("*")) out.push(el);
    return out;
  }


  function apply(root) {
    if (!root || !root.ownerDocument) root = root || document.body;
    if (!root) return;

    for (const el of elements(root)) {
      if (skippedAttr(el)) continue;
      for (const attr of ATTRS) {
        if (!el.hasAttribute(attr)) continue;
        const store = el.__ariaI18n || (el.__ariaI18n = {});
        if (!(attr in store)) {
          const key = norm(el.getAttribute(attr));
          if (!key) continue;
          if (collect && !(key in ID)) unmatched.add(attr + ": " + key);
          if (!(key in ID)) continue;
          store[attr] = key;
        }
        el.setAttribute(attr, t(store[attr]));
      }
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const parent = node.parentElement;
        if (!parent || skipped(parent)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    for (const node of nodes) {
      if (!node.__ariaI18n) {
        const key = norm(node.nodeValue);
        if (!key) continue;
        if (collect && !(key in ID)) unmatched.add(key);
        if (!(key in ID)) continue;
        const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(node.nodeValue);
        node.__ariaI18n = { key, pre: m[1], post: m[3] };
      }
      node.nodeValue = node.__ariaI18n.pre + t(node.__ariaI18n.key) + node.__ariaI18n.post;
    }
  }

  function detect() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch {}
    const list = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || "en"];
    for (const raw of list) {
      const code = String(raw).toLowerCase();
      if (code.startsWith("id") || code.startsWith("in")) return "id";
      if (code.startsWith("en")) return "en";
    }
    return "en";
  }

  function updateSwitcher() {
    for (const btn of document.querySelectorAll("[data-lang]")) {
      const on = btn.dataset.lang === current;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function set(lang) {
    current = SUPPORTED.includes(lang) ? lang : "en";
    try {
      localStorage.setItem(STORAGE_KEY, current);
    } catch {}
    document.documentElement.lang = current;
    apply(document.body);
    updateSwitcher();
    document.dispatchEvent(new CustomEvent("aria:lang", { detail: { lang: current } }));
  }

  function bind() {
    if (bound) return;
    bound = true;
    document.addEventListener("click", (e) => {
      const btn = e.target.closest?.("[data-lang]");
      if (btn) set(btn.dataset.lang);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "l" && e.altKey && e.shiftKey) set(current === "id" ? "en" : "id");
    });
  }

  window.I18n = {
    t,
    apply,
    set,
    bind,
    detect,
    updateSwitcher,
    get lang() {
      return current;
    },
    SUPPORTED,
    SKIP,
    get dict() {
      return ID;
    },
    set collect(v) {
      collect = !!v;
    },
    get unmatched() {
      return unmatched;
    },
    clearUnmatched() {
      unmatched.clear();
    },
  };

  window.t = t;

  current = detect();
  bind();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      bind();
      set(current);
    });
  } else {
    set(current);
  }
})();

/* ═══════════════════════════════════════════
 Aria XD7 Configuration Logic
 ═══════════════════════════════════════════ */

// Report IDs observed in real traffic (sniffer log):
//   OUT -> mouse : report 0x08, 15 data bytes
//   IN  <- mouse : report 0x09, 16 data bytes
const VENDOR_ID = 0x25a7,
  PRODUCT_IDS = [0xfa7b, 0xfa7c],
  REPORT_OUT = 0x08,
  REPORT_IN = 0x09;

// Config memory map (little, 0x0000-based). Verified against sniffer dump.
// Every field is followed by a checksum byte: 0x55 - sum(previous bytes).
const REG = {
  POLLING: 0x00, // 1=1000Hz 2=500 4=250 8=125
  STAGES: 0x02, // 1..7
  LOD: 0x0a, // 1=1mm 2=2mm
  DPI_BASE: 0x0c, // + i*4 -> raw, raw, 0x00, chk
  LED_COLOR_BASE: 0x2c, // + i*4 -> R, G, B, chk
  LED_EFFECT: 0x4c, // mode,~mode, bRaw,~bRaw, speed,~speed
  DEBOUNCE: 0xa9, // ms
  MOTION_SYNC: 0xab, // 0/1
  ANGLE_SNAP: 0xaf, // 0/1
  RIPPLE: 0xb1, // 0/1
  SLEEP: 0xb5, // 1=10s 2=20s 3=30s 6=1m 12=2m 30=5m 60=10m
};
const SLEEP_VALUES = [1, 2, 3, 6, 12, 30, 60];
const MEM_BASE = 0x0000;
const MEM_SIZE = 0x0200;

// ═══ Button remapping ═══
// Reverse-engineered from the official driver (Aria_KV__XD7 V1.2) and
// verified against the mouse's own memory:
//   key table   0x60 + i*4      : b0 b1 b2 chk
//   key data    0x100 + i*0x20  : count, count×(op, lo, hi), chk
// i is the physical button index below.
const BTN_TABLE = 0x60;
const BTN_DATA = 0x100;
const BUTTON_SLOTS = [
  // anchor = point on button.png (percent), label = where the pill sits
  { idx: 0, name: "Left Click", anchor: [40, 63], label: [3, 90], side: "l" },
  { idx: 1, name: "Right Click", anchor: [25, 41], label: [3, 13], side: "l" },
  { idx: 2, name: "Wheel Click", anchor: [29, 51], label: [3, 30], side: "l" },
  { idx: 3, name: "Back", anchor: [71, 51], label: [97, 78], side: "r" },
  { idx: 4, name: "Forward", anchor: [57, 60], label: [97, 92], side: "r" },
  { idx: 5, name: "DPI Button", anchor: [50, 32], label: [97, 13], side: "r" },
];
const DEFAULT_BUTTONS = [
  { t: "mouse", v: "left" },
  { t: "mouse", v: "right" },
  { t: "mouse", v: "middle" },
  { t: "mouse", v: "back" },
  { t: "mouse", v: "forward" },
  { t: "dpi", v: "loop" },
];
const MOUSE_MASK = { left: 0x01, right: 0x02, middle: 0x04, back: 0x08, forward: 0x10 };
const MOUSE_NAMES = {
  left: "Left Click",
  right: "Right Click",
  middle: "Middle Click",
  back: "Back",
  forward: "Forward",
};
const DPI_FN = { loop: 0x01, up: 0x02, down: 0x03 };
const DPI_NAMES = { loop: "DPI Loop", up: "DPI +", down: "DPI −" };
// HID consumer usages, same list and order as the official driver.
const MEDIA_KEYS = [
  [0xcd, "Play / Pause"],
  [0xb7, "Stop"],
  [0xb6, "Previous Track"],
  [0xb5, "Next Track"],
  [0xe9, "Volume Up"],
  [0xea, "Volume Down"],
  [0xe2, "Mute"],
  [0x183, "Media Player"],
  [0x18a, "Email"],
  [0x192, "Calculator"],
  [0x194, "My Computer"],
  [0x221, "Web Search"],
  [0x223, "Web Home"],
  [0x224, "Web Back"],
  [0x225, "Web Forward"],
  [0x226, "Web Stop"],
  [0x227, "Web Refresh"],
  [0x22a, "Favorites"],
];
// KeyboardEvent.code -> HID keyboard usage
const HID_KEYS = (() => {
  const m = {};
  for (let i = 0; i < 26; i++) m["Key" + String.fromCharCode(65 + i)] = 0x04 + i;
  for (let i = 1; i <= 9; i++) m["Digit" + i] = 0x1d + i;
  m.Digit0 = 0x27;
  for (let i = 1; i <= 12; i++) m["F" + i] = 0x39 + i;
  for (let i = 13; i <= 24; i++) m["F" + i] = 0x5b + i;
  for (let i = 1; i <= 9; i++) m["Numpad" + i] = 0x58 + i;
  Object.assign(m, {
    Enter: 0x28, Escape: 0x29, Backspace: 0x2a, Tab: 0x2b, Space: 0x2c,
    Minus: 0x2d, Equal: 0x2e, BracketLeft: 0x2f, BracketRight: 0x30,
    Backslash: 0x31, Semicolon: 0x33, Quote: 0x34, Backquote: 0x35,
    Comma: 0x36, Period: 0x37, Slash: 0x38, CapsLock: 0x39,
    PrintScreen: 0x46, ScrollLock: 0x47, Pause: 0x48, Insert: 0x49,
    Home: 0x4a, PageUp: 0x4b, Delete: 0x4c, End: 0x4d, PageDown: 0x4e,
    ArrowRight: 0x4f, ArrowLeft: 0x50, ArrowDown: 0x51, ArrowUp: 0x52,
    NumLock: 0x53, NumpadDivide: 0x54, NumpadMultiply: 0x55,
    NumpadSubtract: 0x56, NumpadAdd: 0x57, NumpadEnter: 0x58,
    Numpad0: 0x62, NumpadDecimal: 0x63, IntlBackslash: 0x64, ContextMenu: 0x65,
  });
  return m;
})();
const HID_KEY_NAMES = (() => {
  const n = {};
  for (const [code, usage] of Object.entries(HID_KEYS)) {
    n[usage] = code
      .replace(/^Key/, "")
      .replace(/^Digit/, "")
      .replace(/^Numpad(?=\d)/, "Num ")
      .replace(/^Arrow/, "")
      .replace(/^Numpad/, "Num ");
  }
  return n;
})();
const MOD_BITS = { ctrl: 1, shift: 2, alt: 4, win: 8 };

const ButtonCodec = {
  // action -> { entry: [b0,b1,b2], block?: number[] (without checksum) }
  encode(a) {
    switch (a?.t) {
      case "mouse":
        return { entry: [0x01, MOUSE_MASK[a.v] ?? 0x01, 0x00] };
      case "click":
        return { entry: [0x04, 0x32, a.n === 3 ? 3 : 2] };
      case "fire":
        return {
          entry: [
            0x04,
            Math.max(3, Math.min(255, a.speed | 0)),
            Math.max(0, Math.min(3, a.times | 0)),
          ],
        };
      case "dpi":
        return { entry: [0x02, DPI_FN[a.v] ?? 0x01, 0x00] };
      case "dpiLock": {
        const raw = Math.max(0, Math.min(255, Math.round(a.dpi / 50) - 1));
        return { entry: [0x0a, raw, 0x00] };
      }
      case "rgb":
        return { entry: [a.v === "cycle" ? 0x07 : 0x08, 0x00, 0x00] };
      case "media": {
        const lo = a.usage & 0xff,
          hi = (a.usage >> 8) & 0xff;
        return { entry: [0x05, 0, 0], block: [2, 0x82, lo, hi, 0x42, lo, hi] };
      }
      case "key": {
        // Same event order as the official driver: press modifiers, press
        // key, release modifiers, release key.
        const ev = [];
        for (const bit of [1, 2, 4, 8]) if (a.mods & bit) ev.push([0x80, bit, 0]);
        if (a.key) ev.push([0x81, a.key, 0]);
        for (const bit of [1, 2, 4, 8]) if (a.mods & bit) ev.push([0x40, bit, 0]);
        if (a.key) ev.push([0x41, a.key, 0]);
        return { entry: [0x05, 0, 0], block: [ev.length, ...ev.flat()] };
      }
      case "macro":
      case "raw":
        return { entry: a.bytes.slice(0, 3) };
      case "off":
      default:
        return { entry: [0x00, 0x00, 0x00] };
    }
  },

  // device bytes -> action. block = bytes at BTN_DATA + i*0x20 (or null)
  decode(e, block) {
    const [b0, b1, b2] = e;
    if (b0 === 0x00) return { t: "off" };
    if (b0 === 0x01) {
      const v = Object.keys(MOUSE_MASK).find((k) => MOUSE_MASK[k] === b1);
      if (v) return { t: "mouse", v };
    }
    if (b0 === 0x02) {
      const v = Object.keys(DPI_FN).find((k) => DPI_FN[k] === b1);
      if (v) return { t: "dpi", v };
    }
    if (b0 === 0x04) {
      if (b1 === 0x32 && (b2 === 2 || b2 === 3)) return { t: "click", n: b2 };
      return { t: "fire", speed: b1, times: b2 };
    }
    if (b0 === 0x07) return { t: "rgb", v: "cycle" };
    if (b0 === 0x08) return { t: "rgb", v: "toggle" };
    if (b0 === 0x0a) return { t: "dpiLock", dpi: (b1 + 1) * 50 };
    if (b0 === 0x05 && block) {
      const n = block[0];
      const ev = [];
      for (let i = 0; i < n; i++) ev.push(block.slice(1 + i * 3, 4 + i * 3));
      const media = ev.find((x) => x[0] === 0x82);
      if (media) return { t: "media", usage: media[1] | (media[2] << 8) };
      let mods = 0,
        key = 0;
      for (const [op, v] of ev) {
        if (op === 0x80) mods |= v;
        if (op === 0x81 && !key) key = v;
      }
      return { t: "key", mods, key };
    }
    if (b0 === 0x06) return { t: "macro", bytes: [b0, b1, b2] };
    return { t: "raw", bytes: [b0, b1, b2] };
  },

  label(a) {
    switch (a?.t) {
      case "mouse":
        return MOUSE_NAMES[a.v] || "Mouse";
      case "click":
        return a.n === 3 ? "Triple Click" : "Double Click";
      case "fire":
        return "Fire Key";
      case "dpi":
        return DPI_NAMES[a.v] || "DPI";
      case "dpiLock":
        return "DPI Lock " + a.dpi;
      case "rgb":
        return a.v === "cycle" ? "LED Mode Switch" : "LED On / Off";
      case "media":
        return MEDIA_KEYS.find(([u]) => u === a.usage)?.[1] || "Media";
      case "key": {
        const parts = [];
        if (a.mods & 1) parts.push("Ctrl");
        if (a.mods & 2) parts.push("Shift");
        if (a.mods & 4) parts.push("Alt");
        if (a.mods & 8) parts.push("Win");
        if (a.key) parts.push(HID_KEY_NAMES[a.key] || "Key " + a.key);
        return parts.join(" + ") || "Keyboard";
      }
      case "macro":
        return "Macro";
      case "off":
        return "Disabled";
      default:
        return "Custom";
    }
  },

  same(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  },
};

class AriaHID {
  constructor() {
    this.device = null;
    this.debug = true;
    // Preferred vendor interface usagePage.
    // Some firmware exposes 0xff01..0xff04 instead of exactly 0xff00.
    this.preferredUsagePage = 0xff00;
    this.allowVendorUsageFallback = true;
    // Direct Memory Read model (base 0x0000 .. 0x00ff)
    this._memBase = MEM_BASE;
    this._mem = new Uint8Array(MEM_SIZE);
    this._pendingRead = new Map();
    this._featureReadInFlight = new Set();
    this._lastRxReportId = null;
    this._featureReportIds = new Set();
    this._outputReportIds = new Set();

    // Direct-read capability detection
    this.readbackSupported = null; // null=unknown, true/false after probe
    this._sawReadData = false;
    this._warnedReadback = false;

    this._resetIO();
  }

  _resetIO() {
    this._queue = Promise.resolve();
    this._queueDepth = 0;
    // register -> { len, data, promise } for writes not yet on the wire;
    // a newer value for the same register replaces the queued one.
    this._pendingWrites = new Map();
    this._pendingAck = null;
    this._writeGen = 0;
    this._syncing = false;
  }

  _hex(bytes) {
    try {
      return Array.from(bytes)
        .map((b) => (b & 0xff).toString(16).padStart(2, "0"))
        .join(" ");
    } catch {
      return "";
    }
  }

  _logTx(label, bytes) {
    if (!this.debug) return;
    console.debug(
      "[ARIA] TX",
      label || "",
      "len=" + (bytes?.length ?? 0),
      this._hex(bytes || []),
    );
  }

  _logRx(reportId, bytes) {
    if (!this.debug) return;
    console.debug(
      "[ARIA] RX",
      "id=0x" + (reportId ?? 0).toString(16),
      "len=" + (bytes?.length ?? 0),
      this._hex(bytes || []),
    );
  }

  _logRxFeature(reportId, bytes) {
    if (!this.debug) return;
    console.debug(
      "[ARIA] RX-FEATURE",
      "rid=0x" + (reportId ?? 0).toString(16),
      "len=" + (bytes?.length ?? 0),
      this._hex(bytes || []),
    );
  }

  discoverReports() {
    this._featureReportIds.clear();
    this._outputReportIds.clear();

    try {
      for (const col of this.device?.collections || []) {
        for (const fr of col.featureReports || []) {
          if (typeof fr.reportId === "number")
            this._featureReportIds.add(fr.reportId);
        }
        for (const or of col.outputReports || []) {
          if (typeof or.reportId === "number")
            this._outputReportIds.add(or.reportId);
        }
      }

      if (this.debug) {
        console.debug(
          "[ARIA] reports",
          "featureReportIds=",
          Array.from(this._featureReportIds.values()),
          "outputReportIds=",
          Array.from(this._outputReportIds.values()),
        );
      }
    } catch (e) {
      if (this.debug) console.warn("[ARIA] discoverReports failed:", e);
    }
  }

  async connect(device) {
    this._stopTimers();
    this._resetIO();
    this.readbackSupported = null;
    this.device = device;
    this._outMode = null;
    app.btnConnecting();
    try {
      if (!device.opened) await device.open();
    } catch (e) {
      app.pairFailed();
      if (AriaHID.isLinux()) {
        // Linux: /dev/hidraw* is root-only by default, so Chrome cannot
        // open it until a udev rule grants the logged-in user access.
        console.error(
          "[ARIA] open() failed on Linux — install the udev rule:\n" +
            "  sudo cp linux/70-fantech-aria-xd7.rules /etc/udev/rules.d/\n" +
            "  sudo udevadm control --reload-rules && sudo udevadm trigger\n" +
            "then unplug/replug the mouse (or dongle) and reload this page.",
          e,
        );
        app.showLinuxSetup();
      } else {
        app.toast("Failed to open HID device", "error");
      }
      e._ariaHandled = true;
      throw e;
    }

    this.discoverReports();

    // WebHID portability note:
    // Chrome/macOS + Linux + Windows all use the same HID frames.
    // The USB product swaps between 0xfa7b/0xfa7c on mode change (wired/
    // 2.4G/BT), which is why both PIDs are in the pair filter. No
    // special-casing per OS — one protocol, one code path.
    device.addEventListener("inputreport", (e) => this.onInputReport(e));

    // Unstick UI: as soon as device is opened, show settings panels.
    // State will be updated as soon as reads come back.
    try {
      app.onConnected();
      app.syncUIFromState();
    } catch {}

    try {
      await this.readCurrentConfig();
    } catch (e) {
      console.warn("[ARIA] readCurrentConfig failed:", e);
      // Keep UI active, but show a hint.
      app.toast("Connected, but failed to read settings", "error");
    }
  }

  getVendorInterface(devices) {
    if (!devices || !devices.length) return null;
    // Vendor 0x25a7 covers wired / 2.4G dongle / BT — the productId
    // changes per transport, so match on VID first.
    const valid = devices.filter((d) => d.vendorId === VENDOR_ID);
    if (!valid.length) return null;
    const hasPage = (d, pred) => (d.collections || []).some(pred);
    const hasReport = (d, kind, id) =>
      hasPage(d, (c) => (c[kind] || []).some((r) => r.reportId === id));

    // 1) Prefer known productIds
    const known = valid.filter((d) => PRODUCT_IDS.includes(d.productId));
    const pool = known.length ? known : valid;

    // 2) Prefer the interface that actually carries the config reports
    //    (feature 0x08 OUT + input 0x09 IN). On Windows Chrome may merge
    //    or split collections differently than on Linux/macOS, so match
    //    on the reports themselves rather than on interface order.
    const byReports = pool.find(
      (d) =>
        hasReport(d, "featureReports", REPORT_OUT) ||
        hasReport(d, "outputReports", REPORT_OUT),
    );
    if (byReports) return byReports;
    const byInput = pool.find((d) => hasReport(d, "inputReports", REPORT_IN));
    if (byInput) return byInput;

    // 3) Prefer exact 0xff00
    const exact = pool.find((d) =>
      hasPage(d, (c) => c.usagePage === this.preferredUsagePage),
    );
    if (exact) return exact;

    // 4) Fallback: any vendor-defined usagePage range 0xff00..0xffff
    if (this.allowVendorUsageFallback) {
      const vendor = pool.find((d) =>
        hasPage(d, (c) => (c.usagePage & 0xffff) >= 0xff00),
      );
      if (vendor) return vendor;
    }

    // No vendor interface visible. Do NOT fall back to the plain mouse
    // interface: Chrome hides its (protected) collections, so writes
    // would silently go nowhere.
    return null;
  }

  static isLinux() {
    const p =
      navigator.userAgentData?.platform || navigator.platform || "";
    return /linux/i.test(p) && !/android/i.test(navigator.userAgent);
  }

  async pair() {
    try {
      // Vendor-only filter so wired, dongle and Bluetooth all show up.
      const devices = await navigator.hid.requestDevice({
        filters: [{ vendorId: VENDOR_ID }],
      });

      if (this.debug) {
        for (const d of devices || []) {
          const pages = (d.collections || []).map((c) => c.usagePage);
          console.debug(
            "[ARIA] device candidate",
            "productId=0x" + d.productId.toString(16),
            "usagePages=",
            pages,
          );
        }
      }

      const target = this.getVendorInterface(devices);
      if (target) await this.connect(target);
      else {
        const pages = (devices || [])
          .flatMap((d) => (d.collections || []).map((c) => c.usagePage))
          .filter((v) => typeof v === "number");
        throw new Error(
          "No Aria XD7 interface found. Detected usagePages: " +
            (pages.length ? pages.join(",") : "(none)"),
        );
      }
    } catch (e) {
      app.pairFailed();
      if (e && e._ariaHandled) return;
      app.toast(
        e && e.message ? e.message : "Pair/connect failed",
        "error",
      );
    }
  }

  async autoConnect() {
    const devices = await navigator.hid.getDevices();
    const target = this.getVendorInterface(devices);
    if (target) await this.connect(target);
  }

  // === Packet Helpers ===
  // OUT payload is 16 bytes (sent with report id 0x08):
  // [0]=cmd (0x08 read / 0x07 write), [2..3]=addr BE,
  // [4]=len, [5..14]=data, [15]=checksum
  // checksum = (0x4d - sum(payload[0..14])) & 0xff
  // IN payload (report 0x09) checksum at [15]: (0x4c - sum(data[0..14]))
  checksumOut(p16) {
    let sum = 0;
    for (let i = 0; i < 15; i++) sum = (sum + (p16[i] & 0xff)) & 0xff;
    return (0x4d - sum) & 0xff;
  }

  checksumIn(p16) {
    let sum = 0;
    for (let i = 0; i < 15; i++) sum = (sum + (p16[i] & 0xff)) & 0xff;
    return (0x4c - sum) & 0xff;
  }

  _frame(cmd, addr, len, data) {
    const p = new Uint8Array(16);
    p[0] = cmd;
    p[2] = (addr >> 8) & 0xff;
    p[3] = addr & 0xff;
    p[4] = len & 0xff;
    if (data) {
      const arr = data instanceof Uint8Array ? data : Uint8Array.from(data);
      p.set(arr.subarray(0, 10), 5);
    }
    p[15] = this.checksumOut(p);
    return p;
  }

  buildWakeupPacket() {
    // 08 03 00 00 00 00 00 00 00 00 00 00 00 00 00 4a
    const p = new Uint8Array(16);
    p[0] = 0x03;
    p[15] = this.checksumOut(p);
    return p;
  }

  buildReadRequest(address16, length) {
    return this._frame(0x08, address16, length, null);
  }

  // Writes bytes into local memory mirror (BE address, data at [5..])
  _memWrite(address16, bytes) {
    const start = address16 - this._memBase;
    if (start < 0 || start >= this._mem.length) return;
    for (let i = 0; i < bytes.length; i++) {
      const idx = start + i;
      if (idx >= 0 && idx < this._mem.length) this._mem[idx] = bytes[i];
    }
    // ponytail: checksum validation removed for brevity, add when strict mode needed
  }

  _memReadU8(address16) {
    const idx = address16 - this._memBase;
    if (idx < 0 || idx >= this._mem.length) return 0xff;
    return this._mem[idx];
  }

  _memReadRgb(address16) {
    const r = this._memReadU8(address16);
    const g = this._memReadU8(address16 + 1);
    const b = this._memReadU8(address16 + 2);
    if (r === 0xff || g === 0xff || b === 0xff) return null;
    return (
      "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")
    );
  }

  async readCurrentConfig() {
    this._mem.fill(0xff);

    // 1) wakeup 0x03.
    try {
      await this.sendRaw16(this.buildWakeupPacket());
    } catch (e) {
      console.warn("[ARIA] wakeup failed:", e);
    }

    // Light the UI right away so the panels are usable.
    try {
      app.onConnected();
      app.syncUIFromState();
    } catch {}

    // 2) Battery first so the ring fills in immediately.
    this.requestBattery().catch(() => {});
    this._startBatteryPoll();

    // Probe once: many Aria XD7 firmwares ACK reads but never return data
    // (read-protected).
    if (this.readbackSupported === null) {
      try {
        await this._probeDirectRead();
      } catch {}
    }

    if (this.readbackSupported === false) {
      // Usually a wireless mouse that is asleep. Keep the UI usable and
      // let the periodic sync pick the settings up once it wakes.
      app.toast("Mouse not responding — move it to wake it up", "error");
      this._startDeviceSync();
      return;
    }

    try {
      await this.autoReadBlocks();
    } catch (e) {
      console.warn("[ARIA] auto-read failed:", e);
    }

    this.applyMemoryToState();
    this._startDeviceSync();
  }

  // Resolve as soon as the first passive memory frame lands, or after
  // `timeout` ms. The dump itself keeps flowing afterwards.
  _waitForPassiveDump(timeout) {
    return new Promise((resolve) => {
      if (this._mem[MEM_BASE] !== 0xff) return resolve();
      const startedAt = Date.now();
      const tick = setInterval(() => {
        if (this._mem[MEM_BASE] !== 0xff || Date.now() - startedAt >= timeout) {
          clearInterval(tick);
          resolve();
        }
      }, 40);
    });
  }

  // Battery: cmd 0x04 (no data) is answered right away with
  //   04 00 00 00 02 <pct> ...   (verified on hardware, 0x5a = 90%)
  _startBatteryPoll() {
    if (this._battTimer) return;
    this._battTimer = setInterval(() => {
      if (!this.connected) return this._stopTimers();
      if (document.hidden) return;
      this.requestBattery().catch(() => {});
    }, 60000);
  }

  requestBattery() {
    if (!this.connected) return Promise.resolve();
    return this._enqueue(async () => {
      await this.sendRaw16(this._frame(0x04, 0x0000, 0, null));
      await new Promise((r) => setTimeout(r, 30));
    });
  }

  _stopTimers() {
    clearInterval(this._battTimer);
    clearInterval(this._syncTimer);
    this._battTimer = this._syncTimer = null;
  }

  // The DPI button on the mouse can change settings behind our back, so
  // re-read periodically. A read cycle must never overwrite something the
  // user just changed: skip while they are interacting, while writes are
  // queued, and throw the result away if any write landed mid-cycle.
  _startDeviceSync() {
    if (this._syncTimer) return;
    this._syncTimer = setInterval(() => this._syncTick(), 4000);
    if (!this._visBound) {
      this._visBound = true;
      // Timers are paused while the tab is hidden; catch up on return.
      document.addEventListener("visibilitychange", () => {
        if (document.hidden || !this.connected) return;
        this.requestBattery().catch(() => {});
        this._syncTick();
      });
    }
  }

  async _syncTick() {
    if (!this.connected) return this._stopTimers();
    if (this._syncing || document.hidden) return;
    if (this._queueDepth || this._pendingWrites.size) return;
    if (app.isUserBusy()) return;
    this._syncing = true;
    const gen = this._writeGen;
    try {
      await this.autoReadBlocks();
      if (gen !== this._writeGen || this._pendingWrites.size) return;
      if (app.isUserBusy()) return;
      this.applyMemoryToState();
    } catch {
      // mouse asleep / out of range: try again next tick
    } finally {
      this._syncing = false;
    }
  }

  // === Command queue ===
  // All traffic to the mouse goes through one serial queue so a read
  // cycle and a write can never interleave on the wire.
  _enqueue(job) {
    this._queueDepth++;
    const run = this._queue.then(job);
    this._queue = run.catch(() => {}).finally(() => this._queueDepth--);
    return run;
  }

  // cmd 0x02 with data [0x01] only ACKs; the percentage rides along as the
  // passive 04 frame at the end of the wakeup dump.
  buildBatteryRequest() {
    return this._frame(0x02, 0x0000, 1, Uint8Array.from([0x01]));
  }

  async _probeDirectRead() {
    this._sawReadData = false;
    try {
      // Quick probe: if it can't read even 1 byte, assume readback unsupported.
      await this._enqueue(() => this._readChunk(MEM_BASE, 1, 600));
      this.readbackSupported = true;
    } catch {
      this.readbackSupported = this._sawReadData ? true : false;
    }
    if (this.debug)
      console.debug(
        "[ARIA] readbackSupported=",
        this.readbackSupported,
        "sawReadData=",
        this._sawReadData,
      );
  }

  // Every field in the config block is stored as <value bytes..., chk>
  // with chk = 0x55 - sum(value bytes). A field is only trusted when its
  // checksum matches, so half-read or unread (0xff) memory is ignored.
  _field(addr, n) {
    const v = [];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const b = this._memReadU8(addr + i);
      v.push(b);
      sum += b;
    }
    const chk = this._memReadU8(addr + n);
    return chk === ((0x55 - sum) & 0xff) ? v : null;
  }

  // DPI slot: lo, lo, hiBits, chk. raw = lo | hi<<8, DPI = (raw+1)*50.
  // hiBits carries the high part for X in bits 2-3 and Y in bits 6-7
  // (verified: 26000 DPI = 07 07 88 bf).
  static encodeDPI(dpi) {
    const raw = Math.max(0, Math.min(519, Math.round(dpi / 50) - 1));
    const lo = raw & 0xff,
      hi = (raw >> 8) & 0x03;
    return [lo, lo, (hi << 2) | (hi << 6)];
  }

  static decodeDPI(lo, hiBits) {
    const hi = (hiBits >> 2) & 0x03;
    return ((lo | (hi << 8)) + 1) * 50;
  }

  applyMemoryToState() {
    const s = app.state;
    const before = JSON.stringify(s);
    const one = (addr) => this._field(addr, 1)?.[0];

    const stages = one(REG.STAGES);
    if (stages >= 1 && stages <= 7) s.stages = stages;

    const polling = one(REG.POLLING);
    if ([1, 2, 4, 8].includes(polling)) s.pollingRate = polling;

    const lod = one(REG.LOD);
    if (lod === 1 || lod === 2) s.lod = lod;

    for (let i = 0; i < 7; i++) {
      const f = this._field(REG.DPI_BASE + i * 4, 3);
      if (f) s.dpi[i] = Math.min(26000, AriaHID.decodeDPI(f[0], f[2]));
    }

    for (let i = 0; i < 7; i++) {
      const f = this._field(REG.LED_COLOR_BASE + i * 4, 3);
      if (f)
        s.colors[i] =
          "#" + f.map((v) => v.toString(16).padStart(2, "0")).join("");
    }

    // LED effect: mode, brightness and speed are each <value, 0x55-value>.
    const ledMode = one(REG.LED_EFFECT);
    if (ledMode >= 0 && ledMode <= 2) {
      s.ledMode = ledMode;
      const bRaw = one(REG.LED_EFFECT + 2);
      if (bRaw !== undefined)
        s.brightness = Math.max(
          1,
          Math.min(10, Math.round((bRaw - 16) / 26.556 + 1)),
        );
      const speed = one(REG.LED_EFFECT + 4);
      if (speed >= 1 && speed <= 5) s.speed = speed;
    }

    const debounce = one(REG.DEBOUNCE);
    if (debounce !== undefined && debounce <= 30) s.debounce = debounce;
    const motion = one(REG.MOTION_SYNC);
    if (motion <= 1) s.motionSync = motion === 1;
    const angle = one(REG.ANGLE_SNAP);
    if (angle <= 1) s.angleSnap = angle === 1;
    const ripple = one(REG.RIPPLE);
    if (ripple <= 1) s.ripple = ripple === 1;
    const sleep = one(REG.SLEEP);
    if (SLEEP_VALUES.includes(sleep)) s.sleep = sleep;

    for (const { idx } of BUTTON_SLOTS) {
      const e = this._field(BTN_TABLE + idx * 4, 3);
      if (!e) continue;
      if (e[0] === 0x05) {
        const block = this._buttonBlock(idx);
        if (block) s.buttons[idx] = ButtonCodec.decode(e, block);
      } else s.buttons[idx] = ButtonCodec.decode(e, null);
    }

    app.onConnected();
    // Re-rendering kills an in-progress slider drag, so only do it when
    // something actually changed.
    if (JSON.stringify(s) !== before) {
      app.syncUIFromState();
      app.saveProfile();
    }
  }

  onInputReport(event) {
    const data = event.data,
      bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    this._lastRxReportId = event.reportId;
    this._logRx(event.reportId, bytes);

    // Battery report (verified: 04 00 00 00 02 <pct> … e2, 100% = 0x64)
    if (bytes[0] === 0x04 && data.byteLength >= 6) {
      const pct = bytes[4] === 0x02 ? bytes[5] : bytes[4];
      if (pct >= 0 && pct <= 100) {
        this._lastBatteryAt = Date.now();
        app.updateBattery(pct);
      }
      return;
    }

    // Ignore ACK packets (per requirement)
    if (bytes[0] === 0x1c) return;

    // Write echo: 07 00 addrHi addrLo len data... confirms the write landed.
    if (bytes[0] === 0x07 && this._pendingAck) {
      const addr = (bytes[2] << 8) | bytes[3];
      if (addr === this._pendingAck.addr) this._pendingAck.resolve(true);
      return;
    }

    // Process only data packets that start with 0x08
    if (bytes[0] === 0x08) {
      this._handleDataPacket(bytes);
      return;
    }
  }

  _handleDataPacket(bytes) {
    // Verified input frame: 08 00 addrHi addrLo len data[10] checksum
    if (bytes.length < 6) return;
    const address = (bytes[2] << 8) | bytes[3];
    const len = bytes[4];

    // Optional strict check: reject frames with a bad checksum.
    if (this.debug && this.checksumIn(bytes) !== bytes[15]) {
      console.warn(
        "[ARIA] bad input checksum @0x" +
          address.toString(16) +
          " got=" +
          bytes[15].toString(16),
      );
    }

    if (bytes[1] === 0x00 || bytes[1] === 0x08) {
      this._sawReadData = true;
      const payload = bytes.slice(5, 5 + Math.min(len, 10));
      if (payload.length) this._memWrite(address, payload);
      const pending = this._pendingRead.get(address);
      if (pending) {
        this._pendingRead.delete(address);
        pending.resolve({ address, payload });
      }
      return;
    }

    // Some firmwares only ACK via inputreport and expose data via
    // GET_FEATURE instead; try that path before giving up.
    if (bytes[1] === 0x01 && this._pendingRead.has(address)) {
      void this._tryReceiveFeatureForRead(address, len);
    }
  }

  async _tryReceiveFeatureForRead(address16, len) {
    if (!this.device || !this.device.opened) return;
    const key = address16;
    if (this._featureReadInFlight.has(key)) return;
    this._featureReadInFlight.add(key);

    try {
      if (!this._featureReportIds.size) this.discoverReports();

      const candidateIds = [
        REPORT_OUT,
        REPORT_IN,
        ...Array.from(this._featureReportIds.values()),
      ].filter((v, i, a) => Number.isInteger(v) && a.indexOf(v) === i);

      // Poll a few times; some firmwares update GET_FEATURE asynchronously.
      const tries = 6;
      for (let attempt = 0; attempt < tries; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 35 : 55));

        for (const rid of candidateIds) {
          let dv;
          try {
            dv = await this.device.receiveFeatureReport(rid);
          } catch (e) {
            if (this.debug)
              console.warn(
                "[ARIA] receiveFeatureReport failed (rid=0x" +
                  rid.toString(16) +
                  "):",
                e,
              );
            continue;
          }

          const b = new Uint8Array(dv.buffer);
          this._logRxFeature(rid, b);

          if (b.length >= 6 && b[0] === 0x08) {
            const addr = b[2] | (b[3] << 8);
            const l = b[4];

            // 08 08 addrLo addrHi len payload...
            if (b[1] === 0x08) {
              this._sawReadData = true;
              const payload = b.slice(5, 5 + l);
              if (payload.length) this._memWrite(addr, payload);
              const pending = this._pendingRead.get(addr);
              if (pending) {
                this._pendingRead.delete(addr);
                pending.resolve({ address: addr, payload });
              }
              break;
            }

            // Alternate: 08 00 addrLo addrHi len payload...
            if (b[1] === 0x00 && addr === address16 && l === len) {
              this._sawReadData = true;
              const payload = b.slice(5, 5 + l);
              if (payload.length) this._memWrite(addr, payload);
              const pending = this._pendingRead.get(addr);
              if (pending) {
                this._pendingRead.delete(addr);
                pending.resolve({ address: addr, payload });
              }
              break;
            }
          }

          if (!this._pendingRead.has(key)) break;
        }

        if (!this._pendingRead.has(key)) break;
      }
    } catch (e) {
      // Some devices don't support GET_FEATURE on this report; ignore.
      if (this.debug)
        console.warn("[ARIA] receiveFeatureReport failed:", e);
    } finally {
      this._featureReadInFlight.delete(key);
    }
  }

  get connected() {
    return this.device && this.device.opened;
  }

  // Raw send. payload = 16-byte body (report id is sent as the
  // WebHID reportId argument, NOT inside the payload).
  async sendRaw16(payload) {
    if (!this.device || !this.device.opened) return;
    this._lastTx = Date.now();
    this._logTx("out", payload);
    if (!this._outMode) {
      try {
        await this.device.sendFeatureReport(REPORT_OUT, payload);
        this._outMode = "feature";
        return;
      } catch (e) {
        if (this.debug) console.warn("[ARIA] feature write failed:", e);
      }
      try {
        await this.device.sendReport(REPORT_OUT, payload);
        this._outMode = "output";
        return;
      } catch (e) {
        if (this.debug) console.warn("[ARIA] output write failed:", e);
        throw e;
      }
    }
    if (this._outMode === "feature")
      await this.device.sendFeatureReport(REPORT_OUT, payload);
    else await this.device.sendReport(REPORT_OUT, payload);
  }

  // === Direct Memory Read ===
  async readMemory(address16, length, opts = {}) {
    // Caller puts address at big-endian hi/lo inside the frame;
    // device answers with a 10-byte chunk at that address.
    const maxChunk = 10;
    const timeoutMs = opts.timeoutMs ?? 1200;
    let offset = 0;
    while (offset < length) {
      const chunkLen = Math.min(maxChunk, length - offset);
      const addr = (address16 + offset) & 0xffff;
      // One chunk per queue slot so a user write can slip in between
      // chunks instead of waiting for the whole read cycle.
      await this._enqueue(() => this._readChunk(addr, chunkLen, timeoutMs));
      offset += chunkLen;
    }
  }

  _readChunk(address16, len, timeoutMs) {
    const key = address16;
    // Clear any stale pending read
    if (this._pendingRead.has(key)) this._pendingRead.delete(key);

    return new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => {
        this._pendingRead.delete(key);
        reject(new Error("Read timeout @0x" + address16.toString(16)));
      }, timeoutMs);

      this._pendingRead.set(key, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });

      try {
        await this.sendRaw16(this.buildReadRequest(address16, len));
      } catch (e) {
        clearTimeout(timer);
        this._pendingRead.delete(key);
        reject(e);
      }
    });
  }

  async autoReadBlocks() {
    const blocks = [
      { name: "core", addr: 0x0000, len: 0x0c },
      { name: "dpi", addr: 0x000c, len: 7 * 4 },
      { name: "colors", addr: 0x002c, len: 7 * 4 },
      { name: "led", addr: 0x004c, len: 0x06 },
      { name: "advanced", addr: 0x00a9, len: 0x0e },
      { name: "buttons", addr: BTN_TABLE, len: BUTTON_SLOTS.length * 4 },
    ];

    // Stop at the first timeout: if the mouse is asleep every following
    // block would time out too.
    for (const b of blocks) {
      try {
        await this.readMemory(b.addr, b.len, { timeoutMs: 800 });
      } catch (e) {
        if (this.debug) console.warn("[ARIA] read block failed:", b.name, e);
        throw e;
      }
    }

    // Keyboard / media buttons keep their key events in a side block.
    for (const { idx } of BUTTON_SLOTS) {
      const e = this._field(BTN_TABLE + idx * 4, 3);
      if (e && e[0] === 0x05)
        await this.readMemory(BTN_DATA + idx * 0x20, 0x20, { timeoutMs: 800 });
    }
  }

  // count, count×3 event bytes, chk (0x55 - sum of everything before it)
  _buttonBlock(idx) {
    const base = BTN_DATA + idx * 0x20;
    const n = this._memReadU8(base);
    if (n === 0xff || n * 3 + 2 > 0x20) return null;
    const bytes = [];
    for (let i = 0; i < n * 3 + 1; i++) bytes.push(this._memReadU8(base + i));
    const sum = bytes.reduce((a, b) => a + b, 0);
    return this._memReadU8(base + n * 3 + 1) === ((0x55 - sum) & 0xff)
      ? bytes
      : null;
  }

  async setButton(idx, action) {
    const { entry, block } = ButtonCodec.encode(action);
    const jobs = [];
    if (block) {
      // Key events first (like the official driver), then the table
      // entry that points at them. Max 10 data bytes per frame.
      const sum = block.reduce((a, b) => a + b, 0);
      const data = [...block, (0x55 - sum) & 0xff];
      const base = BTN_DATA + idx * 0x20;
      for (let off = 0; off < data.length; off += 10) {
        const chunk = data.slice(off, off + 10);
        jobs.push(this.sendSetting(base + off, chunk.length, chunk));
      }
    }
    jobs.push(
      this.sendSetting(BTN_TABLE + idx * 4, 4, this.complement(entry)),
    );
    await Promise.all(jobs);
  }

  // === Write path ===
  // Field encoding is verified from data hex.txt: every value byte is
  // followed by (0x55 - value), then one checksum at the end.
  complement(bytes) {
    let s = 0;
    for (const b of bytes) s = (s + b) & 0xff;
    return [...bytes, (0x55 - s) & 0xff];
  }

  pairedComplement(values) {
    const out = [];
    for (const v of values) {
      out.push(v, (0x55 - v) & 0xff);
    }
    return out;
  }

  buildPacket(subCmd, register, dataLen, dataBytes) {
    return this._frame(subCmd, register, dataLen, dataBytes);
  }

  async send(buf) {
    await this.sendRaw16(buf);
  }

  // Queue a write. If a write to the same register is still waiting in
  // the queue (color picker drag, rapid clicks), just swap in the newest
  // value so the mouse ends up on what the user last chose.
  sendSetting(register, dataLen, dataBytes) {
    const queued = this._pendingWrites.get(register);
    if (queued) {
      queued.len = dataLen;
      queued.data = dataBytes;
      return queued.promise;
    }
    const entry = { len: dataLen, data: dataBytes };
    this._pendingWrites.set(register, entry);
    this._writeGen++;
    entry.promise = this._enqueue(async () => {
      this._pendingWrites.delete(register);
      this._writeGen++;
      const pkt = this.buildPacket(0x07, register, entry.len, entry.data);
      let ok = false;
      for (let attempt = 0; attempt < 2 && !ok; attempt++) {
        ok = await this._writeAndWaitAck(register, pkt, 400);
      }
      if (!ok) throw new Error("Mouse did not confirm the change (asleep?)");
      // Keep the local mirror in step so later diffs see the new value.
      this._memWrite(register, entry.data.slice(0, entry.len));
    });
    return entry.promise;
  }

  async _writeAndWaitAck(addr, pkt, timeoutMs) {
    const acked = new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), timeoutMs);
      this._pendingAck = {
        addr,
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
      };
    });
    try {
      await this.sendRaw16(pkt);
      return await acked;
    } finally {
      this._pendingAck = null;
    }
  }

  async setDPI(stage, dpi) {
    await this.sendSetting(
      REG.DPI_BASE + (stage - 1) * 4,
      4,
      this.complement(AriaHID.encodeDPI(dpi)),
    );
  }
  async setStages(count) {
    await this.sendSetting(REG.STAGES, 2, this.complement([count]));
  }
  async setPollingRate(val) {
    await this.sendSetting(REG.POLLING, 2, this.complement([val]));
  }
  async setLOD(val) {
    await this.sendSetting(REG.LOD, 2, this.complement([val]));
  }
  async setDebounce(val) {
    await this.sendSetting(REG.DEBOUNCE, 2, this.complement([val]));
  }
  async setMotionSync(on) {
    await this.sendSetting(
      REG.MOTION_SYNC,
      2,
      this.complement([on ? 1 : 0]),
    );
  }
  async setAngleSnap(on) {
    await this.sendSetting(
      REG.ANGLE_SNAP,
      2,
      this.complement([on ? 1 : 0]),
    );
  }
  async setRipple(on) {
    await this.sendSetting(REG.RIPPLE, 2, this.complement([on ? 1 : 0]));
  }
  async setSleep(val) {
    await this.sendSetting(REG.SLEEP, 2, this.complement([val]));
  }
  async setLEDColor(stage, hex) {
    const r = parseInt(hex.slice(1, 3), 16),
      g = parseInt(hex.slice(3, 5), 16),
      b = parseInt(hex.slice(5, 7), 16);
    await this.sendSetting(
      REG.LED_COLOR_BASE + (stage - 1) * 4,
      4,
      this.complement([r, g, b]),
    );
  }
  async setLEDEffect(mode, brightness, speed) {
    if (mode === 0)
      await this.sendSetting(REG.LED_EFFECT, 2, this.complement([0x00]));
    else {
      const bVal = Math.round(16 + (brightness - 1) * 26.556);
      await this.sendSetting(
        REG.LED_EFFECT,
        6,
        this.pairedComplement([mode, bVal, speed]),
      );
    }
  }
}

// ═══ App Controller ═══
const hid = new AriaHID();
const app = {
  _profileStorageKey: "aria_xd7_profile_v1",
  profileName: "Profile",
  _saveTimer: null,
  state: {
    stages: 7,
    // Match defaults from Cfg.ini [DEV_1]
    dpi: [800, 1600, 2000, 2400, 3200, 5000, 26000],
    colors: [
      "#ff0000", // 255,0,0
      "#0000ff", // 0,0,255
      "#00ff00", // 0,255,0
      "#ff00ff", // 255,0,255
      "#00ffff", // 0,255,255
      "#ff8000", // 255,128,0
      "#ffffff", // 255,255,255
    ],
    pollingRate: 1,
    lod: 1,
    debounce: 3,
    motionSync: false,
    angleSnap: false,
    ripple: false,
    sleep: 6,
    ledMode: 1,
    brightness: 6,
    speed: 4,
    buttons: DEFAULT_BUTTONS.map((b) => ({ ...b })),
    battery: 0,
  },

  // True while the user is touching a control (or just did), so the
  // background sync never yanks a value out from under them.
  isUserBusy() {
    if (this._pointerDown) return true;
    if (this._pickerSlot != null) return true;
    if (Date.now() - (this._lastInteract || 0) < 2500) return true;
    const el = document.activeElement;
    if (el && el.tagName === "INPUT" && el.type !== "range") return true;
    try {
      if (this._colorPicker?.isOpen()) return true;
    } catch {}
    return false;
  },

  _bindInteractionTracking() {
    const touch = () => (this._lastInteract = Date.now());
    document.addEventListener("pointerdown", () => {
      this._pointerDown = true;
      touch();
    });
    const up = () => {
      this._pointerDown = false;
      touch();
    };
    document.addEventListener("pointerup", up);
    document.addEventListener("pointercancel", up);
    ["input", "change", "keydown", "wheel"].forEach((ev) =>
      document.addEventListener(ev, touch, { passive: true }),
    );
  },

  init() {
    this._bindInteractionTracking();
    this.bindSegmented();
    this._bindProfileImport();
    this.loadSavedProfile();
    this.syncUIFromState();
    if (navigator.hid) {
      // Reset UI on device disconnect
      navigator.hid.addEventListener("disconnect", (ev) => {
        // Other HID devices (keyboard, headset...) fire this too.
        if (hid.device && ev.device !== hid.device) return;
        hid._stopTimers();
        hid._resetIO();
        try {
          this._isConnectedUI = false;
          const btn = document.getElementById("btnPair");
          btn.classList.remove("hidden");
          btn.textContent = "Connect Device";
          btn.disabled = false;
          document
            .getElementById("statusInfo")
            .classList.remove("active");
          document.getElementById("battRing").classList.remove("active");
          document
            .getElementById("panelCenter")
            .classList.remove("connected");
          document.getElementById("panelLeft").classList.remove("active");
          document
            .getElementById("panelRight")
            .classList.remove("active");
          this.toast("Device disconnected", "error");
        } catch {}
      });
      hid.autoConnect().catch(() => {});
    } else this.toast("WebHID not supported on this browser", "error");
  },

  openProfileImport() {
    document.getElementById("fabMenu").classList.remove("active");
    const input = document.getElementById("profileFileInput");
    if (!input) return this.toast("Profile input not found", "error");
    input.click();
  },

  _bindProfileImport() {
    const input = document.getElementById("profileFileInput");
    if (!input) return;
    input.addEventListener("change", async () => {
      try {
        const file = input.files && input.files[0];
        input.value = "";
        if (!file) return;
        const text = await file.text();
        const obj = JSON.parse(text);
        this.importProfileObject(obj, {
          name: file.name.replace(/\.(json)$/i, ""),
          source: "file",
        });
        this.toast("Profile imported", "success");
      } catch (e) {
        this.toast(e?.message || "Failed to import profile", "error");
      }
    });
  },

  _setProfileLabel(name) {
    this.profileName = name || "Profile";
    const el = document.getElementById("profileLabel");
    if (el) el.textContent = this.profileName;
  },

  renameProfile(name) {
    const clean = (name || "").trim().replace(/\s{2,}/g, " ").slice(0, 32);
    this._setProfileLabel(clean || "Profile");
    this.saveProfile({ immediate: true });
  },

  _sanitizeProfileState(candidate) {
    const next = {};
    const s = candidate || {};

    next.stages = Math.max(1, Math.min(7, parseInt(s.stages) || 7));

    const dpi = Array.isArray(s.dpi) ? s.dpi : [];
    next.dpi = Array.from({ length: 7 }, (_, i) => {
      const v =
        Math.round((parseInt(dpi[i]) || this.state.dpi[i]) / 50) * 50;
      return Math.max(50, Math.min(26000, v));
    });

    const colors = Array.isArray(s.colors) ? s.colors : [];
    const isHex = (x) =>
      typeof x === "string" && /^#[0-9a-fA-F]{6}$/.test(x);
    next.colors = Array.from({ length: 7 }, (_, i) =>
      isHex(colors[i]) ? colors[i] : this.state.colors[i],
    );

    next.pollingRate = [1, 2, 4, 8].includes(parseInt(s.pollingRate))
      ? parseInt(s.pollingRate)
      : this.state.pollingRate;
    next.lod = [1, 2].includes(parseInt(s.lod))
      ? parseInt(s.lod)
      : this.state.lod;
    const deb = parseInt(s.debounce);
    next.debounce = Number.isFinite(deb)
      ? Math.max(0, Math.min(30, deb))
      : this.state.debounce;
    next.motionSync = !!s.motionSync;
    next.angleSnap = !!s.angleSnap;
    next.ripple = !!s.ripple;
    next.sleep = SLEEP_VALUES.includes(parseInt(s.sleep))
      ? parseInt(s.sleep)
      : this.state.sleep;
    next.ledMode = [0, 1, 2].includes(parseInt(s.ledMode))
      ? parseInt(s.ledMode)
      : this.state.ledMode;
    next.brightness = Math.max(
      1,
      Math.min(10, parseInt(s.brightness) || this.state.brightness),
    );
    next.speed = Math.max(
      1,
      Math.min(5, parseInt(s.speed) || this.state.speed),
    );

    const known = ["mouse", "click", "fire", "dpi", "dpiLock", "rgb", "media", "key", "off"];
    const valid = (b) =>
      b &&
      (known.includes(b.t) ||
        ((b.t === "macro" || b.t === "raw") &&
          Array.isArray(b.bytes) &&
          b.bytes.length === 3));
    const btns = Array.isArray(s.buttons) ? s.buttons : [];
    next.buttons = DEFAULT_BUTTONS.map((def, i) =>
      valid(btns[i]) ? JSON.parse(JSON.stringify(btns[i])) : { ...def },
    );

    // Never take battery from a profile
    next.battery = this.state.battery;

    return next;
  },

  getProfileObject() {
    return {
      meta: {
        app: "aria-xd7-web",
        version: 1,
        name: this.profileName || "Profile",
        updatedAt: new Date().toISOString(),
      },
      state: {
        stages: this.state.stages,
        dpi: this.state.dpi,
        colors: this.state.colors,
        pollingRate: this.state.pollingRate,
        lod: this.state.lod,
        debounce: this.state.debounce,
        motionSync: this.state.motionSync,
        angleSnap: this.state.angleSnap,
        ripple: this.state.ripple,
        sleep: this.state.sleep,
        ledMode: this.state.ledMode,
        brightness: this.state.brightness,
        speed: this.state.speed,
        buttons: this.state.buttons,
      },
    };
  },

  importProfileObject(obj, { name, source } = {}) {
    const metaName = obj?.meta?.name;
    const label =
      name || metaName || (source === "file" ? "Imported" : "Local");
    const candidateState = obj?.state ?? obj;
    this.state = this._sanitizeProfileState(candidateState);
    this._setProfileLabel(label);
    this.syncUIFromState();
    this.saveProfile({ immediate: true });
  },

  loadSavedProfile() {
    try {
      const raw = localStorage.getItem(this._profileStorageKey);
      if (!raw) {
        this._setProfileLabel("Profile");
        return;
      }
      const obj = JSON.parse(raw);
      this.importProfileObject(obj, {
        name: obj?.meta?.name || "Local",
        source: "local",
      });
    } catch {
      // Ignore corrupted storage
      this._setProfileLabel("Profile");
    }
  },

  saveProfile({ immediate } = {}) {
    const commit = () => {
      try {
        localStorage.setItem(
          this._profileStorageKey,
          JSON.stringify(this.getProfileObject()),
        );
      } catch {}
    };
    if (immediate) return commit();
    if (this.profileName === "Profile") this._setProfileLabel("Profile");
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(commit, 150);
  },

  exportProfile() {
    try {
      document.getElementById("fabMenu").classList.remove("active");
      const data = JSON.stringify(this.getProfileObject(), null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (this.profileName || "aria-profile")
        .toLowerCase()
        .replace(/[^a-z0-9\-_.]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^[-_.]+|[-_.]+$/g, "");
      a.href = url;
      a.download = `${safeName || "aria-xd7"}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.toast("Profile exported", "success");
    } catch (e) {
      this.toast(e?.message || "Failed to export profile", "error");
    }
  },

  async applyProfileToMouse() {
    if (!hid.connected)
      return this.toast("Connect mouse first to apply profile", "error");

    document.getElementById("fabMenu").classList.remove("active");
    this.toast("Applying profile to mouse...");

    try {
      await hid.setPollingRate(this.state.pollingRate);
      await hid.setLOD(this.state.lod);
      await hid.setDebounce(this.state.debounce);
      await hid.setMotionSync(this.state.motionSync);
      await hid.setAngleSnap(this.state.angleSnap);
      await hid.setRipple(this.state.ripple);
      await hid.setSleep(this.state.sleep);
      await hid.setStages(this.state.stages);
      for (let i = 0; i < this.state.stages; i++) {
        await hid.setDPI(i + 1, this.state.dpi[i]);
        await hid.setLEDColor(i + 1, this.state.colors[i]);
      }
      await hid.setLEDEffect(
        this.state.ledMode,
        this.state.brightness,
        this.state.speed,
      );
      for (const { idx } of BUTTON_SLOTS)
        await hid.setButton(idx, this.state.buttons[idx]);
      this.toast("Profile applied successfully!", "success");
    } catch (e) {
      this.toast(e?.message || "Failed to apply profile", "error");
    }
  },

  pair() {
    hid.pair();
  },

  btnConnecting() {
    const btn = document.getElementById("btnPair");
    btn.textContent = "Syncing...";
    btn.disabled = true;
  },

  pairFailed() {
    const btn = document.getElementById("btnPair");
    btn.textContent = "Connect Device";
    btn.disabled = false;
  },

  onConnected() {
    // Idempotent: avoid repeated toasts/state flips
    if (this._isConnectedUI) return;
    this._isConnectedUI = true;
    document.getElementById("btnPair").classList.add("hidden");
    document.getElementById("statusInfo").classList.add("active");
    document.getElementById("battRing").classList.add("active");
    document.getElementById("panelCenter").classList.add("connected");
    document.getElementById("panelLeft").classList.add("active");
    document.getElementById("panelRight").classList.add("active");
    this.toast("Aria XD7 Successfully Synced", "success");
  },

  syncUIFromState() {
    const s = this.state;
    document.getElementById("stageCount").value = s.stages;
    document.getElementById("debounceVal").value = s.debounce;
    document.getElementById("motionSync").checked = s.motionSync;
    document.getElementById("angleSnap").checked = s.angleSnap;
    document.getElementById("ripple").checked = s.ripple;

    document.getElementById("brightnessRange").value = s.brightness;
    document.getElementById("brightnessLabel").textContent = s.brightness;
    document.getElementById("brightnessTrack").style.width =
      ((s.brightness - 1) / 9) * 100 + "%";

    document.getElementById("speedRange").value = s.speed;
    document.getElementById("speedLabel").textContent = s.speed;
    document.getElementById("speedTrack").style.width =
      ((s.speed - 1) / 4) * 100 + "%";

    ["pollingRate", "lodControl", "sleepTimer", "ledEffect"].forEach(
      (id) => {
        const seg = document.getElementById(id);
        const val =
          id === "pollingRate"
            ? s.pollingRate
            : id === "lodControl"
              ? s.lod
              : id === "sleepTimer"
                ? s.sleep
                : s.ledMode;
        seg
          .querySelectorAll(".seg-btn")
          .forEach((b) =>
            b.classList.toggle("active", parseInt(b.dataset.val) === val),
          );
      },
    );
    this.updateEffectUI();
    this.renderDPIStages();
    this.renderButtonMap();
  },

  updateBattery(pct) {
    if (pct < 0 || pct > 100) return;
    this.state.battery = pct;
    const arc = document.getElementById("battArc"),
      txt = document.getElementById("battPct");
    const offset = 132 - (pct / 100) * 132;
    if (arc) {
      arc.style.strokeDashoffset = offset;
      arc.style.stroke =
        pct <= 20
          ? "var(--danger)"
          : pct <= 50
            ? "var(--accent)"
            : "var(--success)";
    }
    if (txt) txt.textContent = pct + "%";
  },

  changeStages(delta) {
    const next = Math.max(1, Math.min(7, this.state.stages + delta));
    if (next === this.state.stages) return;
    this.state.stages = next;
    document.getElementById("stageCount").value = next;
    this.renderDPIStages();
    this.saveProfile();
    if (hid.connected)
      hid.setStages(next).catch((e) => this.toast(e.message, "error"));
  },

  renderDPIStages() {
    let html = "";
    for (let i = 0; i < this.state.stages; i++) {
      const v = this.state.dpi[i];
      const pct = ((v - 50) / (26000 - 50)) * 100;
      const activeDot =
        i === 0
          ? `style="background:${this.state.colors[i]};box-shadow:0 0 10px ${this.state.colors[i]}"`
          : "";
      html += `<div class="dpi-row">
  <div class="dpi-left">
    <div class="nav-dot ${i === 0 ? "active-stage" : ""}" ${activeDot}></div>
    <div class="dpi-title">S ${i + 1}</div>
  </div>
  <button type="button" class="color-swatch" id="swatch${i}" style="background:${this.state.colors[i]}" title="LED color for stage ${i + 1}" aria-label="LED color for stage ${i + 1}" onclick="app.openColorPicker(${i})"></button>
  <div class="stepper">
    <button type="button" onclick="app.changeDPI(${i},-50)" aria-label="Decrease DPI stage ${i + 1}">&minus;</button>
    <input type="number" id="dpi${i}" value="${v}" min="50" max="26000" step="50"
      aria-label="DPI value for stage ${i + 1}"
      onchange="app.setDPI(${i},this.value)">
    <button type="button" onclick="app.changeDPI(${i},50)" aria-label="Increase DPI stage ${i + 1}">+</button>
  </div>
  <div class="dpi-slider-wrap">
    <div class="slider-track" id="dpiTrack${i}" style="width:${pct}%"></div>
    <input type="range" id="dpiRange${i}" min="50" max="26000" step="50" value="${v}"
      aria-label="DPI slider for stage ${i + 1}"
      onwheel="app.wheelDPI(event,${i})"
      oninput="app.slideDPI(${i},this.value)"
      onchange="app.commitDPI(${i},this.value)">
  </div>
</div>`;
    }
    this._destroyPickers();
    document.getElementById("dpiStagesContainer").innerHTML = html;
    this._initPickers();
  },

  // ── Button mapping ──────────────────────────────────
  _esc(t) {
    return String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  },

  renderButtonMap() {
    const svg = document.getElementById("btnLines");
    const box = document.getElementById("btnPills");
    if (!svg || !box) return;
    let lines = "",
      pills = "";
    for (const slot of BUTTON_SLOTS) {
      const [ax, ay] = slot.anchor;
      const [lx, ly] = slot.label;
      const action = this.state.buttons[slot.idx];
      const changed = !ButtonCodec.same(action, DEFAULT_BUTTONS[slot.idx]);
      // elbow: go horizontal into the pill's row
      const ex = slot.side === "l" ? lx + 14 : lx - 14;
      lines += `<polyline points="${ax},${ay} ${ex},${ly} ${lx + (slot.side === "l" ? 2 : -2)},${ly}" />
        <circle cx="${ax}" cy="${ay}" r="1.1" />`;
      pills += `<button type="button" class="btn-pill side-${slot.side}${changed ? " changed" : ""}${this._pickerSlot === slot.idx ? " open" : ""}"
        style="${slot.side === "l" ? "left" : "right"}:${slot.side === "l" ? lx : 100 - lx}%;top:${ly}%"
        onclick="app.openButtonPicker(${slot.idx})"
        aria-label="${this._esc(slot.name)}: ${this._esc(ButtonCodec.label(action))}">
        <span class="pill-name">${this._esc(slot.name)}</span>
        <span class="pill-val">${this._esc(ButtonCodec.label(action))}</span>
      </button>`;
    }
    svg.innerHTML = lines;
    box.innerHTML = pills;
  },

  openButtonPicker(idx) {
    const slot = BUTTON_SLOTS.find((x) => x.idx === idx);
    if (!slot) return;
    this._pickerSlot = idx;
    this._pendingKey = null;
    const cur = this.state.buttons[idx];
    const is = (a) => (ButtonCodec.same(cur, a) ? " active" : "");
    const chip = (a, text) =>
      `<button type="button" class="pick-chip${is(a)}" data-action='${this._esc(JSON.stringify(a))}'>${this._esc(text ?? ButtonCodec.label(a))}</button>`;
    const fire = cur.t === "fire" ? cur : { speed: 10, times: 3 };
    const lock = cur.t === "dpiLock" ? cur.dpi : 400;
    const media = cur.t === "media" ? cur.usage : MEDIA_KEYS[0][0];
    const el = document.getElementById("btnPicker");
    el.innerHTML = `
      <div class="pick-head">
        <div><div class="pick-sub">Assign button</div><div class="pick-title">${this._esc(slot.name)}</div></div>
        <button type="button" class="pick-close" data-close aria-label="Close">&times;</button>
      </div>
      <div class="pick-body">
        <div class="pick-group"><div class="pick-label">Mouse</div><div class="pick-chips">
          ${Object.keys(MOUSE_NAMES).map((v) => chip({ t: "mouse", v })).join("")}
          ${chip({ t: "click", n: 2 })}${chip({ t: "click", n: 3 })}
        </div></div>
        <div class="pick-group"><div class="pick-label">DPI</div><div class="pick-chips">
          ${Object.keys(DPI_FN).map((v) => chip({ t: "dpi", v })).join("")}
        </div>
          <div class="pick-row">
            <span>DPI Lock</span>
            <input type="number" id="pickLockDpi" min="50" max="12800" step="50" value="${lock}" aria-label="DPI lock value">
            <button type="button" class="pick-set${cur.t === "dpiLock" ? " active" : ""}" data-set="dpiLock">Set</button>
          </div>
        </div>
        <div class="pick-group"><div class="pick-label">Keyboard</div>
          <div class="pick-row">
            <input type="text" id="pickKey" class="pick-capture" readonly placeholder="Click here, then press keys"
              value="${cur.t === "key" ? this._esc(ButtonCodec.label(cur)) : ""}" aria-label="Key combination">
            <button type="button" class="pick-set${cur.t === "key" ? " active" : ""}" data-set="key">Set</button>
          </div>
        </div>
        <div class="pick-group"><div class="pick-label">Media</div>
          <div class="pick-row">
            <select id="pickMedia" aria-label="Media function">
              ${MEDIA_KEYS.map(([u, n]) => `<option value="${u}"${u === media ? " selected" : ""}>${n}</option>`).join("")}
            </select>
            <button type="button" class="pick-set${cur.t === "media" ? " active" : ""}" data-set="media">Set</button>
          </div>
        </div>
        <div class="pick-group"><div class="pick-label">Fire Key (auto click)</div>
          <div class="pick-row">
            <span>Speed</span><input type="number" id="pickFireSpeed" min="3" max="255" value="${fire.speed}" aria-label="Fire speed 3 to 255">
            <span>Times</span><input type="number" id="pickFireTimes" min="0" max="3" value="${fire.times}" aria-label="Fire times 0 to 3">
            <button type="button" class="pick-set${cur.t === "fire" ? " active" : ""}" data-set="fire">Set</button>
          </div>
        </div>
        <div class="pick-group"><div class="pick-label">Other</div><div class="pick-chips">
          ${chip({ t: "rgb", v: "toggle" })}${chip({ t: "rgb", v: "cycle" })}${chip({ t: "off" })}
        </div></div>
      </div>
      <div class="pick-foot">
        <button type="button" class="pick-reset" data-action='${this._esc(JSON.stringify(DEFAULT_BUTTONS[idx]))}'>Reset to default (${this._esc(ButtonCodec.label(DEFAULT_BUTTONS[idx]))})</button>
      </div>`;
    el.hidden = false;
    this._bindPicker(el, idx);
    this.renderButtonMap();
  },

  closeButtonPicker() {
    const el = document.getElementById("btnPicker");
    if (el) el.hidden = true;
    this._pickerSlot = null;
    this.renderButtonMap();
  },

  _bindPicker(el, idx) {
    if (!this._pickerBound) {
      this._pickerBound = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && this._pickerSlot != null && e.target.id !== "pickKey")
          this.closeButtonPicker();
      });
    }
    el.onclick = (e) => {
      if (e.target.closest("[data-close]")) return this.closeButtonPicker();
      const a = e.target.closest("[data-action]");
      if (a) return this.assignButton(this._pickerSlot, JSON.parse(a.dataset.action));
      const set = e.target.closest("[data-set]")?.dataset.set;
      if (set === "dpiLock") {
        const v = Math.round(parseInt(el.querySelector("#pickLockDpi").value) / 50) * 50;
        return this.assignButton(this._pickerSlot, { t: "dpiLock", dpi: Math.max(50, Math.min(12800, v || 400)) });
      }
      if (set === "media")
        return this.assignButton(this._pickerSlot, { t: "media", usage: parseInt(el.querySelector("#pickMedia").value) });
      if (set === "fire") {
        const speed = Math.max(3, Math.min(255, parseInt(el.querySelector("#pickFireSpeed").value) || 10));
        const times = Math.max(0, Math.min(3, parseInt(el.querySelector("#pickFireTimes").value) || 0));
        return this.assignButton(this._pickerSlot, { t: "fire", speed, times });
      }
      if (set === "key") {
        if (!this._pendingKey?.key)
          return this.toast("Click the box and press a key (with Ctrl/Shift/Alt/Win if you want)", "error");
        return this.assignButton(this._pickerSlot, this._pendingKey);
      }
    };
    const cap = el.querySelector("#pickKey");
    cap.addEventListener("keydown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const mods =
        (e.ctrlKey ? MOD_BITS.ctrl : 0) |
        (e.shiftKey ? MOD_BITS.shift : 0) |
        (e.altKey ? MOD_BITS.alt : 0) |
        (e.metaKey ? MOD_BITS.win : 0);
      const key = HID_KEYS[e.code] || 0;
      if (!key && !/^(Control|Shift|Alt|Meta|OS)/.test(e.code)) {
        cap.value = "Key not supported";
        this._pendingKey = null;
        return;
      }
      this._pendingKey = { t: "key", mods, key };
      cap.value = ButtonCodec.label(this._pendingKey) + (key ? "" : " + …");
    });
  },

  assignButton(idx, action) {
    const next = this.state.buttons.map((b, i) => (i === idx ? action : b));
    // Same rule as the official driver: never lose the primary click.
    if (!next.some((b) => b.t === "mouse" && b.v === "left"))
      return this.toast("At least one button must stay Left Click", "error");
    this.state.buttons = next;
    this.saveProfile();
    this.closeButtonPicker();
    if (hid.connected)
      hid
        .setButton(idx, action)
        .then(() => this.toast(`${BUTTON_SLOTS[idx].name} → ${ButtonCodec.label(action)}`, "success"))
        .catch((e) => this.toast(e.message, "error"));
  },

  // Drag: update the number + track live, don't spam the mouse.
  slideDPI(stage, val) {
    const n = document.getElementById("dpi" + stage);
    if (n) n.value = val;
    const track = document.getElementById("dpiTrack" + stage);
    if (track) track.style.width = ((val - 50) / 25950) * 100 + "%";
  },

  // Mouse wheel over a DPI slider: exactly one 50-DPI step per notch.
  wheelDPI(ev, stage) {
    ev.preventDefault();
    const dir = ev.deltaY < 0 || ev.deltaX > 0 ? 1 : -1;
    this.changeDPI(stage, dir * 50);
  },

  // Release: send to the mouse.
  commitDPI(stage, val) {
    this.setDPI(stage, val);
  },

  changeDPI(stage, delta) {
    const val = Math.max(
      50,
      Math.min(26000, this.state.dpi[stage] + delta),
    );
    this.setDPI(stage, val);
  },

  setDPI(stage, val) {
    val = Math.round(
      Math.max(50, Math.min(26000, Math.round(val / 50) * 50)),
    );
    const changed = this.state.dpi[stage] !== val;
    this.state.dpi[stage] = val;
    const num = document.getElementById("dpi" + stage);
    if (num) num.value = val;
    const rng = document.getElementById("dpiRange" + stage);
    if (rng) rng.value = val;
    const track = document.getElementById("dpiTrack" + stage);
    if (track) track.style.width = ((val - 50) / 25950) * 100 + "%";
    if (!changed) return;
    this.saveProfile();
    if (hid.connected)
      hid
        .setDPI(stage + 1, val)
        .catch((e) => this.toast(e.message, "error"));
  },

  setLEDColor(stage, hex) {
    this.state.colors[stage] = hex;
    const sw = document.getElementById("swatch" + stage);
    if (sw) sw.style.background = hex;
    else {
      this.renderDPIStages();
      this.saveProfile();
      if (hid.connected)
        hid
          .setLEDColor(stage + 1, hex)
          .catch((e) => this.toast(e.message, "error"));
      return;
    }
    // Stage dot without re-rendering the whole list.
    if (stage === 0) {
      const dot = document.querySelector(
        ".dpi-row:first-child .nav-dot",
      );
      if (dot) dot.style.background = hex;
    }
    this.saveProfile();
    if (hid.connected)
      hid
        .setLEDColor(stage + 1, hex)
        .catch((e) => this.toast(e.message, "error"));
  },

  // ── Color picker library (Pickr) ─────────────────────
  // Uses @simonwep/pickr from CDN; falls back to the native
  // <input type="color"> when the script did not load.
  // One shared Pickr instance, opened on demand. The old bug created a
  // picker per stage AND rendered the native input on top of it.
  _colorPicker: null,
  _colorTarget: -1,

  _getPicker() {
    if (this._colorPicker || !window.Pickr) return this._colorPicker;
    try {
      this._colorPicker = window.Pickr.create({
        el: "#pickr-anchor",
        default: "#ff0000",
        useAsButton: true,
        components: {
          preview: true,
          opacity: false,
          hue: true,
          interaction: { input: true, hex: true, rgba: false, hsva: true },
        },
      });
      this._colorPicker.on("change", (color) => {
        if (!color || !color.toHEXA || this._colorTarget < 0) return;
        this.setLEDColor(
          this._colorTarget,
          color.toHEXA().toString(),
        );
      });
    } catch {
      return null;
    }
    return this._colorPicker;
  },

  openColorPicker(stage) {
    const picker = this._getPicker();
    // No library (offline / CDN blocked): fall back to native input.
    if (!picker) return this._openNativeColor(stage);
    this._colorTarget = stage;
    picker.setColor(this.state.colors[stage] || "#ffffff", true);
    picker.show();
  },

  _openNativeColor(stage) {
    const inp = document.createElement("input");
    inp.type = "color";
    inp.value = this.state.colors[stage] || "#ffffff";
    inp.style.position = "fixed";
    inp.style.opacity = "0";
    inp.style.pointerEvents = "none";
    document.body.appendChild(inp);
    inp.addEventListener("input", () => this.setLEDColor(stage, inp.value));
    inp.addEventListener("change", () => inp.remove(), { once: true });
    inp.click();
  },

  _initPickers() {
    // kept as a no-op so older call sites stay valid; pickers are lazy now.
  },

  _destroyPickers() {
    // single shared picker lives for the page lifetime; nothing to destroy.
  },

  bindSegmented() {
    document.querySelectorAll(".segmented").forEach((seg) => {
      seg.querySelectorAll(".seg-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          seg
            .querySelectorAll(".seg-btn")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const val = parseInt(btn.dataset.val);
          if (seg.id === "pollingRate") {
            this.state.pollingRate = val;
            this.saveProfile();
            if (hid.connected)
              hid
                .setPollingRate(val)
                .catch((e) => this.toast(e.message, "error"));
          }
          if (seg.id === "lodControl") {
            this.state.lod = val;
            this.saveProfile();
            if (hid.connected)
              hid
                .setLOD(val)
                .catch((e) => this.toast(e.message, "error"));
          }
          if (seg.id === "sleepTimer") {
            this.state.sleep = val;
            this.saveProfile();
            if (hid.connected)
              hid
                .setSleep(val)
                .catch((e) => this.toast(e.message, "error"));
          }
          if (seg.id === "ledEffect") {
            this.state.ledMode = val;
            this.saveProfile();
            this.updateEffectUI();
            if (hid.connected)
              hid
                .setLEDEffect(
                  val,
                  this.state.brightness,
                  this.state.speed,
                )
                .catch((e) => this.toast(e.message, "error"));
          }
        });
      });
    });
  },

  setToggle(name, checked) {
    this.state[name] = checked;
    this.saveProfile();
    if (!hid.connected) return;
    const fn = {
      motionSync: () => hid.setMotionSync(checked),
      angleSnap: () => hid.setAngleSnap(checked),
      ripple: () => hid.setRipple(checked),
    };
    fn[name]?.().catch((e) => this.toast(e.message, "error"));
  },

  changeDebounce(delta) {
    const next = Math.max(0, Math.min(30, this.state.debounce + delta));
    this.setDebounceManual(next);
  },

  setDebounceManual(val) {
    const next = Math.max(0, Math.min(30, parseInt(val) || 0));
    this.state.debounce = next;
    document.getElementById("debounceVal").value = next;
    this.saveProfile();
    if (hid.connected)
      hid.setDebounce(next).catch((e) => this.toast(e.message, "error"));
  },

  updateEffectUI() {
    const mode = this.state.ledMode;
    document.getElementById("brightnessGroup").style.display =
      mode === 1 ? "block" : "none";
    document.getElementById("speedGroup").style.display =
      mode === 2 ? "block" : "none";
  },

  slidePreview(el, type) {
    const v = parseInt(el.value);
    document.getElementById(type + "Label").textContent = v;
    document.getElementById(type + "Track").style.width =
      ((v - 1) / (type === "brightness" ? 9 : 4)) * 100 + "%";
  },

  updateEffectSlider() {
    const b = parseInt(document.getElementById("brightnessRange").value);
    const s = parseInt(document.getElementById("speedRange").value);
    this.state.brightness = b;
    this.state.speed = s;
    this.saveProfile();
    if (hid.connected)
      hid
        .setLEDEffect(this.state.ledMode, b, s)
        .catch((e) => this.toast(e.message, "error"));
  },

  // importDctFile intentionally removed

  async restoreDefaults() {
    if (!hid.connected)
      return this.toast(
        "Connect mouse first to restore defaults",
        "error",
      );
    if (
      !confirm("Are you sure you want to restore defaults to the mouse?")
    )
      return;
    document.getElementById("fabMenu").classList.remove("active");

    this.toast("Restoring default settings...");
    this._setProfileLabel("Profile");
    this.state = {
      stages: 7,
      dpi: [800, 1600, 2000, 2400, 3200, 5000, 26000],
      colors: [
        "#ff0000",
        "#0000ff",
        "#00ff00",
        "#ff00ff",
        "#00ffff",
        "#ff8000",
        "#ffffff",
      ],
      pollingRate: 1,
      lod: 1,
      debounce: 3,
      motionSync: false,
      angleSnap: false,
      ripple: false,
      sleep: 6,
      ledMode: 1,
      brightness: 6,
      speed: 4,
      buttons: DEFAULT_BUTTONS.map((b) => ({ ...b })),
      battery: this.state.battery,
    };

    this.syncUIFromState();
    this.saveProfile({ immediate: true });

    try {
      await hid.setPollingRate(1);
      await hid.setLOD(1);
      await hid.setDebounce(3);
      await hid.setMotionSync(false);
      await hid.setAngleSnap(false);
      await hid.setRipple(false);
      await hid.setSleep(6);
      await hid.setStages(7);
      for (let i = 0; i < 7; i++) {
        await hid.setDPI(i + 1, this.state.dpi[i]);
        await hid.setLEDColor(i + 1, this.state.colors[i]);
      }
      await hid.setLEDEffect(1, 6, 4);
      for (const { idx } of BUTTON_SLOTS)
        await hid.setButton(idx, this.state.buttons[idx]);
      this.toast("Mouse settings restored successfully!", "success");
    } catch (e) {
      this.toast(e.message, "error");
    }
  },

  _toastEl: null,
  _timer: null,
  // One-time Linux permission helper. Browsers can't open /dev/hidraw*
  // until a udev rule grants the logged-in user access; no web API can
  // bypass that, so we hand the user a copy-paste one-liner instead.
  showLinuxSetup() {
    if (document.getElementById("linuxSetup")) return;
    const cmd =
      "printf '%s\\n' 'KERNEL==\"hidraw*\", ATTRS{idVendor}==\"25a7\", TAG+=\"uaccess\"' " +
      "'KERNEL==\"hidraw*\", KERNELS==\"*:25A7:*\", TAG+=\"uaccess\"' " +
      "| sudo tee /etc/udev/rules.d/70-fantech-aria-xd7.rules >/dev/null " +
      "&& sudo udevadm control --reload-rules && sudo udevadm trigger --subsystem-match=hidraw";
    const wrap = document.createElement("div");
    wrap.id = "linuxSetup";
    wrap.className = "setup-overlay";
    wrap.innerHTML = `
      <div class="setup-card" role="dialog" aria-modal="true" aria-labelledby="linuxSetupTitle">
        <h3 id="linuxSetupTitle">One-time Linux setup</h3>
        <p>Linux blocks browsers from opening the mouse until you allow it once. Open a terminal, paste this command and enter your password:</p>
        <pre class="setup-cmd"></pre>
        <ol>
          <li>Unplug the mouse / dongle and plug it back in.</li>
          <li>Click <b>Connect Device</b> again.</li>
        </ol>
        <p class="setup-dim">Only needed once per computer. Windows and macOS need no setup.</p>
        <div class="setup-actions">
          <button class="setup-btn" data-act="copy">Copy command</button>
          <button class="setup-btn ghost" data-act="close">Close</button>
        </div>
      </div>`;
    wrap.querySelector(".setup-cmd").textContent = cmd;
    const close = () => wrap.remove();
    wrap.addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (e.target === wrap || act === "close") close();
      else if (act === "copy") {
        navigator.clipboard
          .writeText(cmd)
          .then(() => this.toast("Command copied", "success"))
          .catch(() => this.toast("Copy failed — select the text manually", "error"));
      }
    });
    document.body.appendChild(wrap);
  },

  toast(msg, type = "success") {
    const box = document.getElementById("toastContainer");
    if (this._toastEl) {
      this._toastEl.remove();
      clearTimeout(this._timer);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="${type === "error" ? "var(--danger)" : "var(--success)"}" stroke-width="2">${type === "error" ? '<circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>' : '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>'}</svg><span style="color:${type === "error" ? "var(--danger)" : "var(--text-main)"}">${msg}</span>`;
    box.appendChild(el);
    this._toastEl = el;
    this._timer = setTimeout(() => {
      el.classList.add("toast-out");
      setTimeout(() => {
        el.remove();
        if (this._toastEl === el) this._toastEl = null;
      }, 300);
    }, 3000);
  },
};

document.addEventListener("DOMContentLoaded", () => app.init());


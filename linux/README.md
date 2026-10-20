# Linux setup (WebHID)

On Linux, `/dev/hidraw*` is owned by root (`crw-------`) by default, so the
browser can list the Aria XD7 but `device.open()` fails. Windows and macOS
don't have this restriction, which is why the app works there out of the box.

One-time fix:

```bash
./linux/install-udev.sh
```

Then unplug/replug the mouse (or 2.4G dongle) and reload the page.

Notes:
- Use a Chromium browser (Chrome, Edge, Brave, Opera). Firefox and Safari
  do not support WebHID.
- Serve the page over `https://` or `http://localhost` (WebHID needs a
  secure context), e.g. `python3 -m http.server 8000` → http://localhost:8000
- Snap/Flatpak Chromium may be sandboxed away from `/dev/hidraw*`; use the
  native package if connecting still fails.

## Bluetooth

The same rule covers Bluetooth (the `KERNELS=="*:25A7:*"` line matches the
BLE node `0005:25A7:FA6C.xxxx`). Pair and trust the mouse once with BlueZ,
otherwise it pairs fine but does not reconnect by itself after sleeping:

```bash
bluetoothctl
  scan on            # wait for "Aria XD7"
  pair  <MAC>
  trust <MAC>
  connect <MAC>
```

Chrome then lists it as **Aria XD7** (PID `0xFA6C`) in the Connect dialog.

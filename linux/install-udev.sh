#!/usr/bin/env bash
# Installs the udev rule so Chrome (WebHID) can talk to the Aria XD7 on Linux.
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
sudo install -m 0644 "$DIR/70-fantech-aria-xd7.rules" /etc/udev/rules.d/70-fantech-aria-xd7.rules
sudo udevadm control --reload-rules
sudo udevadm trigger --subsystem-match=hidraw
echo "Done. Unplug/replug the mouse or dongle, then reload the web page."
ls -l /dev/hidraw* 2>/dev/null || true

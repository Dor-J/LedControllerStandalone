# BLE LED Strip Controller

A single-file, browser-based Bluetooth LED strip controller built for static hosting on GitHub Pages.

The app lives in `src/index.html` and uses the browser-native Web Bluetooth API to pair with compatible generic BLE LED strips. There is no backend, npm install, build step, framework compilation, or native Bluetooth dependency.

## Features

- Pair with likely BLE LED strip devices from a Chromium-based browser.
- Discover common writable LED strip BLE service and characteristic combinations.
- Toggle strip power on and off.
- Pick colors with an iro.js circular color wheel.
- Adjust brightness from 1% to 100%.
- Send throttled RGB updates for smoother color changes.
- Disconnect and reconnect to a previously selected device during the same browser session.
- Restore browser-granted devices with `navigator.bluetooth.getDevices()` when the browser supports it.
- Use filtered discovery or wide scan for devices with unexpected names.
- Try multiple protocol profiles, RGB channel orders, and BLE write modes from the UI.
- Inspect and edit `localStorage` or `sessionStorage` values from the debug UI.
- View connection state, active BLE target, last command bytes, and detailed status logs.
- Copy or clear debug logs from the Advanced / Debug card while testing connection drops.

## Browser Requirements

Web Bluetooth requires:

- HTTPS, except when served from `localhost` or `127.0.0.1`.
- A supported Chromium-based browser such as Chrome or Edge.
- A user gesture before opening the Bluetooth pairing prompt.
- A powered-on BLE LED strip close enough to the computer or phone.

Firefox and Safari do not currently provide general Web Bluetooth support for this use case.

## Run Locally

From the repository root:

```bash
cd src
python -m http.server 8000
```

Open:

```text
http://127.0.0.1:8000/index.html
```

`localhost` and `127.0.0.1` are allowed Web Bluetooth development origins.

Do not open `src/index.html` directly with a `file://` URL. Browsers treat local files as isolated origins, which breaks Web Bluetooth and can also interfere with CDN-loaded browser libraries.

## Test

The project includes no-build static tests for the HTML page. They use only Node built-in modules, so there is no `npm install` step.

```bash
node tests/static-page.test.mjs
```

The same test runs in GitHub Actions through `.github/workflows/test.yml`.

## Deploy To GitHub Pages

This repository is prepared for GitHub Pages with a workflow at `.github/workflows/pages.yml`. The workflow publishes the `src` folder directly, so the deployed site root is `src/index.html`.

To enable it:

1. Push the repository to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings > Pages**.
4. Under **Build and deployment**, set **Source** to **GitHub Actions**.
5. Push to `main` or `master`, or run **Deploy GitHub Pages** manually from the **Actions** tab.

Once deployed, open the HTTPS Pages URL in Chrome or Edge and click **Connect LED Strip**.

## Protocol Notes

The default generic command packets are defined near the top of the JavaScript in `src/index.html`:

```js
powerOn:  [0x56, 0x00, 0x00, 0x00, 0xaa, 0xf0, 0xaa]
powerOff: [0x56, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xaa]
color:    [0x56, r, g, b, 0x00, 0xf0, 0xaa]
```

Some generic LED strips use different BLE services, characteristics, or packet formats. If pairing works but commands do not affect the strip, update those constants and the writable target list in `src/index.html`.

The **Advanced / Debug** card also exposes runtime protocol options:

- **Discovery**: filtered LED-like names or wide scan.
- **Protocol profile**: common 0x56 and 0x7e packet families plus experimental variants.
- **Channel order**: RGB, RBG, GRB, GBR, BRG, or BGR for strips with swapped color channels.
- **Write mode**: automatic, with response, or without response.

These settings are stored in `localStorage`, along with the last color and brightness. Browser Bluetooth permissions are controlled by the browser; if `navigator.bluetooth.getDevices()` is available, the app will offer reconnect to previously granted devices after reload.

## Storage Debugging

The **Storage CRUD** panel in **Advanced / Debug** can create, read, update, and delete keys in either `localStorage` or `sessionStorage`. It is useful for checking persisted protocol settings without opening DevTools.

The app's main settings key is:

```text
ble-led-controller-settings-v2
```

If you edit that key manually in the UI, reload the page to apply the raw storage value.

## Debugging Connection Drops

Open the **Advanced / Debug** card before connecting. The status log records pairing, GATT connection, every known service/characteristic attempt, write method selection, write failures, and disconnect events.

If the strip disconnects, click the copy button in the log area and inspect the last few entries first. The most useful lines are usually the final `BLE write failed`, `Target failed`, or `GATT disconnect event fired` messages.

## Tailwind CDN Note

This project intentionally uses Tailwind Play CDN to keep the app as a single static HTML file with no build step. The browser console will show Tailwind's production warning for `cdn.tailwindcss.com`.

Adding PostCSS from a CDN does not fix that warning. The published PostCSS package is a Node/CommonJS package and expects `require`, so it is not a drop-in browser replacement for Tailwind's production build pipeline.

## Licence

MIT. See `LICENCE`.

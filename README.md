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
- View connection state, active BLE target, last command bytes, and status logs.

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

## Deploy To GitHub Pages

Configure GitHub Pages to serve from the `src` folder, or copy `src/index.html` to the publishing root if your Pages setup serves from the repository root.

Once deployed, open the HTTPS Pages URL in Chrome or Edge and click **Connect LED Strip**.

## Protocol Notes

The default generic command packets are defined near the top of the JavaScript in `src/index.html`:

```js
powerOn:  [0x56, 0x00, 0x00, 0x00, 0xaa, 0xf0, 0xaa]
powerOff: [0x56, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xaa]
color:    [0x56, r, g, b, 0x00, 0xf0, 0xaa]
```

Some generic LED strips use different BLE services, characteristics, or packet formats. If pairing works but commands do not affect the strip, update those constants and the writable target list in `src/index.html`.

## Licence

MIT. See `LICENCE`.

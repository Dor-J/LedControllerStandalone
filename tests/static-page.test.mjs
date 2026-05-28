import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const htmlPath = join(root, 'src', 'index.html');
const html = readFileSync(htmlPath, 'utf8');

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function includesAll(source, values) {
  for (const value of values) {
    assert.ok(source.includes(value), `Missing expected text: ${value}`);
  }
}

test('publishes a single static app file from src', () => {
  assert.ok(existsSync(htmlPath), 'src/index.html must exist');
  assert.ok(!existsSync(join(root, 'src', 'favicon.svg')), 'favicon should be inline, not a separate file');
  assert.ok(html.startsWith('<!doctype html>'), 'index.html should be a complete HTML document');
  assert.ok(html.includes('</html>'), 'index.html should close the HTML document');
  assert.ok(html.includes('rel="icon" type="image/svg+xml" href="data:image/svg+xml,'), 'index.html should include an inline SVG favicon data URL');
});

test('keeps no-build browser CDN dependencies', () => {
  includesAll(html, [
    'https://cdn.tailwindcss.com',
    'cdnjs.cloudflare.com/ajax/libs/font-awesome',
    'https://cdn.jsdelivr.net/npm/@jaames/iro@5',
    'https://unpkg.com/petite-vue'
  ]);

  assert.ok(!html.includes('postcss'), 'PostCSS CDN should not be loaded in the browser');
  assert.ok(!html.includes('type="module"'), 'petite-vue should use the browser build, not a module import');
  assert.ok(!html.includes('require('), 'No CommonJS/browser-incompatible require() calls');
});

test('checks Web Bluetooth support and secure origin behavior', () => {
  includesAll(html, [
    "'bluetooth' in navigator",
    'navigator.bluetooth.requestDevice',
    'window.isSecureContext',
    'isFileUrl()',
    'file:// URL',
    'HTTPS',
    'localhost'
  ]);
});

test('uses expected BLE discovery filters and optional services', () => {
  includesAll(html, [
    "{ namePrefix: 'ELK' }",
    "{ namePrefix: 'LED' }",
    "{ namePrefix: 'BLE' }",
    "{ namePrefix: 'Magic' }",
    "{ namePrefix: 'Triones' }",
    "{ namePrefix: 'Happy' }",
    "{ namePrefix: 'ELK-BLEDOM' }",
    'acceptAllDevices: true',
    '0xffe5',
    '0xffe0',
    '0xfff0',
    '0000ffe5-0000-1000-8000-00805f9b34fb',
    '0000ffe0-0000-1000-8000-00805f9b34fb',
    '0000fff0-0000-1000-8000-00805f9b34fb'
  ]);
});

test('contains default LED command packets', () => {
  includesAll(html, [
    "id: 'triones-56'",
    "id: 'ledenet-7e'",
    'powerOn: () => [0x56, 0x00, 0x00, 0x00, 0xaa, 0xf0, 0xaa]',
    'powerOff: () => [0x56, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xaa]',
    'color: (r, g, b) => [0x56, r, g, b, 0x00, 0xf0, 0xaa]',
    'color: (r, g, b) => [0x7e, 0x00, 0x05, 0x03, r, g, b, 0x00, 0xef]',
    'new Uint8Array(packet)'
  ]);
});

test('prefers writeValueWithoutResponse for streaming writes', () => {
  includesAll(html, [
    'writeValueWithoutResponse',
    'writeValue(data)',
    'preferWithoutResponse'
  ]);
});

test('keeps color, brightness, power, and debug controls wired', () => {
  includesAll(html, [
    'new iro.ColorPicker',
    'COLOR_WRITE_THROTTLE_MS',
    'scaleColor(color, brightness)',
    'localStorage.setItem(SETTINGS_KEY',
    'sessionStorage',
    'Storage CRUD',
    '@click="createStorageItem"',
    '@click="readStorageItem"',
    '@click="updateStorageItem"',
    '@click="deleteStorageItem"',
    '@click="clearStorageArea"',
    'navigator.bluetooth.getDevices',
    'CHANNEL_ORDERS',
    'Protocol options',
    '@click="sendTestSequence"',
    '@click="togglePower"',
    '@input="handleBrightnessInput"',
    '@click="copyLogs"',
    '@click="clearLogs"',
    'GATT disconnect event fired',
    'BLE write failed'
  ]);
});

let passed = 0;

for (const { name, fn } of tests) {
  try {
    fn();
    passed += 1;
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error.message);
    process.exitCode = 1;
  }
}

console.log(`${passed}/${tests.length} tests passed`);

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const htmlPath = join(root, 'src', 'index.html');
const pagesWorkflowPath = join(root, '.github', 'workflows', 'pages.yml');
const testWorkflowPath = join(root, '.github', 'workflows', 'test.yml');
const readmePath = join(root, 'README.md');

const html = readFileSync(htmlPath, 'utf8');
const pagesWorkflow = readFileSync(pagesWorkflowPath, 'utf8');
const testWorkflow = readFileSync(testWorkflowPath, 'utf8');
const readme = readFileSync(readmePath, 'utf8');

const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function includesAll(source, values) {
  for (const value of values) {
    assert.ok(source.includes(value), `Missing expected text: ${value}`);
  }
}

function excludesAll(source, values) {
  for (const value of values) {
    assert.ok(!source.includes(value), `Unexpected text found: ${value}`);
  }
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

function listFiles(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      entries.push(...listFiles(path));
    } else {
      entries.push(path);
    }
  }
  return entries;
}

function relativeUnix(path) {
  return relative(root, path).split(sep).join('/');
}

test('ships only the expected static payload from src', () => {
  assert.ok(existsSync(htmlPath), 'src/index.html must exist');
  assert.ok(existsSync(join(root, 'src', '.nojekyll')), 'src/.nojekyll must exist for Pages');

  const srcFiles = listFiles(join(root, 'src')).map(relativeUnix).sort();
  assert.deepEqual(srcFiles, ['src/.nojekyll', 'src/index.html'], 'src should stay a single HTML app plus .nojekyll');

  assert.ok(!existsSync(join(root, 'src', 'favicon.svg')), 'favicon should be inline, not a separate file');
});

test('has a complete static HTML shell', () => {
  assert.match(html, /^<!doctype html>/i, 'doctype should be first');
  includesAll(html, [
    '<html lang="en">',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<title>BLE LED Strip Controller</title>',
    '<body class="text-slate-100 antialiased">',
    '</body>',
    '</html>'
  ]);

  assert.equal(countMatches(html, /<main\b/g), 1, 'should have exactly one main region');
  assert.equal(countMatches(html, /<script\b/g), 5, 'expected four CDN scripts plus one inline app script');
  assert.ok(html.includes('rel="icon" type="image/svg+xml" href="data:image/svg+xml,'), 'favicon should be an inline SVG data URL');
});

test('keeps the app no-build and browser-only', () => {
  includesAll(html, [
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome',
    'https://cdn.jsdelivr.net/npm/@jaames/iro@5',
    'https://unpkg.com/petite-vue',
    'window.PetiteVue.createApp({ LedApp: window.LedApp }).mount();'
  ]);

  excludesAll(html, [
    'postcss',
    'type="module"',
    'require(',
    'import {',
    'noble',
    'backend',
    'localhost:'
  ]);
});

test('GitHub Actions test and Pages workflows are wired for no-build deploys', () => {
  includesAll(testWorkflow, [
    'name: Test Static Page',
    'pull_request:',
    'actions/setup-node@v4',
    'node-version: 22',
    'run: node tests/static-page.test.mjs'
  ]);

  includesAll(pagesWorkflow, [
    'name: Deploy GitHub Pages',
    'uses: actions/configure-pages@v5',
    'uses: actions/upload-pages-artifact@v3',
    'path: src',
    'uses: actions/deploy-pages@v4'
  ]);
});

test('checks Web Bluetooth support and secure-origin limitations', () => {
  includesAll(html, [
    "'bluetooth' in navigator",
    'navigator.bluetooth.requestDevice',
    'navigator.bluetooth.getDevices',
    'navigator.bluetooth.addEventListener',
    'window.isSecureContext',
    'isFileUrl()',
    'file:// URL',
    'HTTPS',
    'localhost',
    'availabilitychanged'
  ]);
});

test('covers filtered and wide BLE discovery options', () => {
  includesAll(html, [
    "{ namePrefix: 'ELK' }",
    "{ namePrefix: 'LED' }",
    "{ namePrefix: 'BLE' }",
    "{ namePrefix: 'Magic' }",
    "{ namePrefix: 'Triones' }",
    "{ namePrefix: 'Happy' }",
    "{ namePrefix: 'BLEDOM' }",
    "{ namePrefix: 'ELK-BLEDOM' }",
    "{ namePrefix: 'Lotus' }",
    'acceptAllDevices: true',
    'discoveryMode',
    'filtered',
    'wide'
  ]);
});

test('covers common LED services and writable characteristics', () => {
  includesAll(html, [
    '0xffe5',
    '0xffe9',
    '0xffe0',
    '0xffe1',
    '0xfff0',
    '0xfff3',
    '0xffb0',
    '0xffb1',
    '0xffd5',
    '0xffd9',
    '0xae00',
    '0xae01',
    '0000ffe5-0000-1000-8000-00805f9b34fb',
    '0000ffe9-0000-1000-8000-00805f9b34fb',
    '0000ffe0-0000-1000-8000-00805f9b34fb',
    '0000ffe1-0000-1000-8000-00805f9b34fb',
    '0000fff0-0000-1000-8000-00805f9b34fb',
    '0000fff3-0000-1000-8000-00805f9b34fb'
  ]);
});

test('includes protocol profiles and ELK-BLEDOM packets', () => {
  includesAll(html, [
    'const PROTOCOL_PROFILES = [',
    "id: 'triones-56'",
    "id: 'triones-56-white'",
    "id: 'ledenet-7e'",
    "id: 'three-byte-cc'",
    'powerOn: () => [0x56, 0x00, 0x00, 0x00, 0xaa, 0xf0, 0xaa]',
    'powerOff: () => [0x56, 0x00, 0x00, 0x00, 0x00, 0xf0, 0xaa]',
    'color: (r, g, b) => [0x56, r, g, b, 0x00, 0xf0, 0xaa]',
    'powerOn: () => [0x7e, 0x00, 0x04, 0x04, 0x01, 0xff, 0x00, 0xef]',
    'powerOff: () => [0x7e, 0x00, 0x04, 0x04, 0x00, 0xff, 0x00, 0xef]',
    'color: (r, g, b) => [0x7e, 0x00, 0x05, 0x03, r, g, b, 0x00, 0xef]',
    'brightness: (level) => [0x7e, 0x00, 0x01',
    'speed: (speed) => [0x7e, 0x00, 0x02',
    'effect: (effectCode) => [0x7e, 0x00, 0x03',
    'dynamic: (dynamicCode) => [0x7e, 0x00, 0x03',
    'sensitivity: (level) => [0x7e, 0x00, 0x07'
  ]);

  assert.ok(countMatches(html, /id: '[^']+',\s*label:/g) >= 8, 'expected protocol and effect ids to be explicit');
});

test('keeps color scaling, channel order, and brightness behavior wired', () => {
  includesAll(html, [
    'new iro.ColorPicker',
    'COLOR_WRITE_THROTTLE_MS',
    "const CHANNEL_ORDERS = ['RGB', 'RBG', 'GRB', 'GBR', 'BRG', 'BGR'];",
    'scaleColor(color, brightness)',
    'Math.round(color.r * level / 100)',
    'applyChannelOrder(color)',
    'buildColorPacket(color)',
    'sendNativeBrightness',
    'queueNativeBrightnessWrite',
    '@input="handleBrightnessInput"'
  ]);
});

test('serializes BLE writes and supports write-mode selection', () => {
  includesAll(html, [
    'writeValueWithoutResponse',
    'writeValue(data)',
    'preferWithoutResponse',
    "writeMode === 'without-response'",
    "writeMode === 'with-response'",
    'this.writeChain = this.writeChain.then',
    'performWritePacket(packet, options)',
    'new Uint8Array(packet)',
    'BLE write failed',
    'Device reports GATT disconnected after write failure'
  ]);
});

test('has persistence and storage CRUD diagnostics', () => {
  includesAll(html, [
    'const SETTINGS_KEY',
    'localStorage.getItem(SETTINGS_KEY)',
    'localStorage.setItem(SETTINGS_KEY',
    'sessionStorage',
    'Storage CRUD',
    'createStorageItem',
    'readStorageItem',
    'updateStorageItem',
    'deleteStorageItem',
    'clearStorageArea',
    'refreshStorageKeys',
    'ble-led-controller-settings-v2'
  ]);
});

test('keeps connection, disconnect, reconnect, and debug logging wired', () => {
  includesAll(html, [
    '@click="connect"',
    '@click="disconnect"',
    '@click="togglePower"',
    '@click="sendTestSequence"',
    '@click="copyLogs"',
    '@click="clearLogs"',
    'attachDisconnectHandler',
    'gattserverdisconnected',
    'GATT disconnect event fired',
    'Starting writable characteristic search',
    'Target failed',
    'Copied logs to clipboard'
  ]);
});

test('keeps basic accessibility hooks on interactive controls', () => {
  assert.ok(countMatches(html, /aria-label=/g) >= 20, 'expected aria-labels on icon/debug controls');
  includesAll(html, [
    'role="status"',
    'aria-live="polite"',
    'role="alert"',
    'aria-pressed',
    'label for="brightness"',
    'sr-only'
  ]);
});

test('README documents local run, Pages deployment, protocol, storage, and tests', () => {
  includesAll(readme, [
    'python -m http.server 8000',
    'Do not open `src/index.html` directly with a `file://` URL',
    'node tests/static-page.test.mjs',
    'Settings > Pages',
    'GitHub Actions',
    'FreekBes/bledom_controller',
    'Storage CRUD',
    'ble-led-controller-settings-v2'
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

import { readFileSync } from 'node:fs';

const stylesheet = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const values = Object.fromEntries(
  [...stylesheet.matchAll(/(--lb-[a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map((match) => [match[1], match[2]]),
);

function luminance(hex) {
  const channels = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
  const linear = channels.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrastRatio(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const checks = [
  ...['canvas', 'surface', 'material', 'worksheet', 'exercise', 'game'].map((color) => ['ink', color, 4.5]),
  ['muted', 'canvas', 4.5],
  ['muted', 'surface', 4.5],
  ['success-text', 'success-bg', 4.5],
  ['error-text', 'error-bg', 4.5],
  ['focus', 'canvas', 3],
  ['focus', 'surface', 3],
];

let failed = false;
for (const [foreground, background, minimum] of checks) {
  const fg = values['--lb-' + foreground];
  const bg = values['--lb-' + background];
  if (!fg || !bg) {
    console.error('Missing token:', foreground, background);
    failed = true;
    continue;
  }
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= minimum;
  console.log((pass ? 'PASS' : 'FAIL') + ' ' + foreground + '/' + background + ': ' + ratio.toFixed(2) + ':1');
  if (!pass) failed = true;
}

if (failed) process.exitCode = 1;

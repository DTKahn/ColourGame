import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hexToRgb, rgbToHex, hsvToRgb, rgbToHsv, rgbToHsl, rgbToLab, deltaE2000, colorDistance,
} from '../js/color.js';
import { pointsFor, ratingFor, MAX_POINTS } from '../js/scoring.js';
import { Game } from '../js/game.js';

const near = (a, b, eps = 1e-4) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test('hex round-trips', () => {
  assert.deepEqual(hexToRgb('#3A7BD5'), { r: 58, g: 123, b: 213 });
  assert.deepEqual(hexToRgb('fff'), { r: 255, g: 255, b: 255 });
  assert.equal(rgbToHex({ r: 58, g: 123, b: 213 }), '#3A7BD5');
  assert.throws(() => hexToRgb('#12345G'));
});

test('hsv round-trips across the cube', () => {
  for (let i = 0; i < 2000; i++) {
    const rgb = { r: (i * 37) % 256, g: (i * 91) % 256, b: (i * 13) % 256 };
    assert.deepEqual(hsvToRgb(rgbToHsv(rgb)), rgb);
  }
});

test('hsl of known colours', () => {
  const { h, s, l } = rgbToHsl({ r: 255, g: 0, b: 0 });
  assert.deepEqual([h, s, l], [0, 100, 50]);
});

test('lab of white and black', () => {
  const white = rgbToLab({ r: 255, g: 255, b: 255 });
  near(white.L, 100, 1e-3);
  near(white.a, 0, 1e-2);
  near(white.b, 0, 1e-2);
  near(rgbToLab({ r: 0, g: 0, b: 0 }).L, 0);
});

// Reference pairs from Sharma, Wu & Dalal (2005), "The CIEDE2000 Color-Difference Formula".
test('CIEDE2000 matches published test data', () => {
  const pairs = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, -1.3802, -84.2814], [50, 0, -82.7485], 1.0],
    [[50, 2.5, 0], [50, 0, -2.5], 4.3065],
    [[50, 2.5, 0], [73, 25, -18], 27.1492],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
    [[22.7233, 20.0904, -46.694], [23.0331, 14.973, -42.5619], 2.0373],
    [[2.0776, 0.0795, -1.135], [0.9033, -0.0636, -0.5514], 0.9082],
  ];
  for (const [[L1, a1, b1], [L2, a2, b2], expected] of pairs) {
    near(deltaE2000({ L: L1, a: a1, b: b1 }, { L: L2, a: a2, b: b2 }), expected);
  }
});

test('black vs white is ~100', () => {
  near(colorDistance({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }), 100, 1e-2);
});

test('scoring curve', () => {
  assert.equal(pointsFor(0), MAX_POINTS);
  assert.equal(pointsFor(0.3), MAX_POINTS);
  assert.ok(pointsFor(5) > pointsFor(10));
  assert.ok(pointsFor(10) > 550 && pointsFor(10) < 650);
  assert.ok(pointsFor(100) < 5);
  assert.equal(ratingFor(0.5), 'Perfect');
  assert.equal(ratingFor(50), 'Way off');
});

test('game flow', () => {
  const game = new Game({ rounds: 2 });
  const first = game.submit(game.current.target);
  assert.equal(first.points, MAX_POINTS);
  assert.equal(game.next(), true);
  game.submit({ r: 0, g: 0, b: 0 });
  assert.equal(game.next(), false);
  assert.ok(game.score >= MAX_POINTS);
  assert.equal(game.maxScore, 2 * MAX_POINTS);
});

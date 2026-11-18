// A touch-friendly HSV colour picker: saturation/brightness pad + hue slider.
// Deliberately never displays the picked colour's code — that's the game.
import { clamp, hsvToRgb } from './color.js';

export class ColorPicker {
  constructor(root, { onChange } = {}) {
    this.root = root;
    this.onChange = onChange;
    this.hsv = { h: 210, s: 0.5, v: 0.5 };
    this.disabled = false;

    root.classList.add('picker');
    root.innerHTML = `
      <div class="picker-pad" role="slider" tabindex="0"
           aria-label="Saturation and brightness"
           aria-valuemin="0" aria-valuemax="100">
        <div class="picker-pad-thumb"></div>
      </div>
      <div class="picker-hue" role="slider" tabindex="0"
           aria-label="Hue" aria-valuemin="0" aria-valuemax="360">
        <div class="picker-hue-thumb"></div>
      </div>`;
    this.pad = root.querySelector('.picker-pad');
    this.hue = root.querySelector('.picker-hue');

    this.#bindDrag(this.pad, (x, y) => {
      this.hsv.s = x;
      this.hsv.v = 1 - y;
    });
    this.#bindDrag(this.hue, (x) => {
      this.hsv.h = x * 359.99;
    });

    this.pad.addEventListener('keydown', (e) => this.#onKey(e, 'pad'));
    this.hue.addEventListener('keydown', (e) => this.#onKey(e, 'hue'));

    this.#render();
  }

  get rgb() {
    return hsvToRgb(this.hsv);
  }

  setHsv(hsv) {
    this.hsv = { ...hsv };
    this.#render();
  }

  setDisabled(disabled) {
    this.disabled = disabled;
    this.root.classList.toggle('is-disabled', disabled);
    for (const el of [this.pad, this.hue]) {
      el.tabIndex = disabled ? -1 : 0;
      el.setAttribute('aria-disabled', String(disabled));
    }
  }

  #bindDrag(el, update) {
    const move = (e) => {
      const rect = el.getBoundingClientRect();
      const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
      update(x, y);
      this.#changed();
    };
    el.addEventListener('pointerdown', (e) => {
      if (this.disabled || e.button > 0) return;
      e.preventDefault();
      el.focus({ preventScroll: true });
      el.setPointerCapture(e.pointerId);
      el.classList.add('is-dragging');
      move(e);
    });
    el.addEventListener('pointermove', (e) => {
      if (el.hasPointerCapture(e.pointerId)) move(e);
    });
    const end = (e) => {
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.classList.remove('is-dragging');
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
  }

  #onKey(e, target) {
    if (this.disabled) return;
    const step = e.shiftKey ? 0.1 : 0.01;
    const keys = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    const dir = keys[e.key];
    if (!dir) return;
    e.preventDefault();
    if (target === 'pad') {
      this.hsv.s = clamp(this.hsv.s + dir[0] * step, 0, 1);
      this.hsv.v = clamp(this.hsv.v + dir[1] * step, 0, 1);
    } else {
      const delta = (dir[0] || dir[1]) * (e.shiftKey ? 10 : 1);
      this.hsv.h = clamp(this.hsv.h + delta, 0, 359.99);
    }
    this.#changed();
  }

  #changed() {
    this.#render();
    this.onChange?.(this.rgb);
  }

  #render() {
    const { h, s, v } = this.hsv;
    const { r, g, b } = this.rgb;
    const style = this.root.style;
    style.setProperty('--picker-hue', `hsl(${h} 100% 50%)`);
    style.setProperty('--picker-color', `rgb(${r} ${g} ${b})`);
    style.setProperty('--pad-x', `${s * 100}%`);
    style.setProperty('--pad-y', `${(1 - v) * 100}%`);
    style.setProperty('--hue-x', `${(h / 359.99) * 100}%`);
    this.pad.setAttribute('aria-valuenow', String(Math.round(s * 100)));
    this.pad.setAttribute(
      'aria-valuetext',
      `Saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`
    );
    this.hue.setAttribute('aria-valuenow', String(Math.round(h)));
  }
}

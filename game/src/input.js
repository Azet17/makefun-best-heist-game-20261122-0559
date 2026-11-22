// input.js — keyboard and mouse.
// WASD / arrows move, E grabs the loot, 1/2/3 pick a tool, Space (or a
// mouse click) uses the selected tool, M mutes, R retries after being caught,
// Enter starts, Esc pauses. Mouse position is canvas pixels; a click while
// the noise-maker is selected throws it at that spot.

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };
    this._pressed = new Set(); // keys pressed since last consume
    this._onKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) this._pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
    };
    this._onKeyUp = (e) => this.keys.delete(e.key.toLowerCase());
    this._onMouseMove = (e) => {
      const r = this.canvas.getBoundingClientRect();
      this.mouse.x = ((e.clientX - r.left) / r.width) * this.canvas.width;
      this.mouse.y = ((e.clientY - r.top) / r.height) * this.canvas.height;
    };
    this._onMouseDown = (e) => {
      this._onMouseMove(e);
      this.mouse.clicked = true;
      this.mouse.clickX = this.mouse.x;
      this.mouse.clickY = this.mouse.y;
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('mousemove', this._onMouseMove);
    canvas.addEventListener('mousedown', this._onMouseDown);
  }

  /** True while the key is held. */
  held(...keys) {
    return keys.some((k) => this.keys.has(k));
  }

  /** True once for a key pressed since the last frame (then consumed). */
  pressed(key) {
    return this._pressed.has(key);
  }

  /** Movement vector from WASD / arrows, normalised. */
  moveVector() {
    let x = 0;
    let y = 0;
    if (this.held('a', 'arrowleft')) x -= 1;
    if (this.held('d', 'arrowright')) x += 1;
    if (this.held('w', 'arrowup')) y -= 1;
    if (this.held('s', 'arrowdown')) y += 1;
    if (x === 0 && y === 0) return { x: 0, y: 0 };
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }

  get grab() {
    return this.held('e');
  }

  /** A mouse click this frame (consumed by the caller). */
  takeClick() {
    if (!this.mouse.clicked) return null;
    this.mouse.clicked = false;
    return { x: this.mouse.clickX, y: this.mouse.clickY };
  }

  /** Clear per-frame presses at the end of the frame. */
  endFrame() {
    this._pressed.clear();
  }

  detach() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
  }
}

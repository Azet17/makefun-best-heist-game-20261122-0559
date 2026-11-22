// state.js — the thief and the room's shared state.
// The thief is a circle that slides along walls: move on X, resolve, then
// move on Y, resolve. Walls and pillars are solid; the loot pedestal and the
// exit door are not (you walk up to the pedestal, you walk through the door).

import { FLOOR } from './levels.js';

export const THIEF_RADIUS = 13;
export const THIEF_SPEED = 185;

export class Thief {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.smokeTimer = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.facing = -Math.PI / 2;
    this.moving = false;
    this.smokeTimer = 0;
  }

  /** Move by (vx, vy) for dt seconds, sliding along anything solid. */
  move(vx, vy, dt, solids) {
    const stepX = vx * THIEF_SPEED * dt;
    const stepY = vy * THIEF_SPEED * dt;
    this.moving = stepX !== 0 || stepY !== 0;
    if (this.moving) this.facing = Math.atan2(vy, vx);
    this.x += stepX;
    this.resolve(solids, true);
    this.y += stepY;
    this.resolve(solids, false);
    if (this.smokeTimer > 0) this.smokeTimer -= dt;
  }

  /** Push the thief out of any solid it overlaps, on one axis at a time. */
  resolve(solids, xAxis) {
    const r = THIEF_RADIUS;
    for (const s of solids.rects) {
      if (
        this.x + r > s.x && this.x - r < s.x + s.w &&
        this.y + r > s.y && this.y - r < s.y + s.h
      ) {
        if (xAxis) {
          this.x = this.x < s.x + s.w / 2 ? s.x - r : s.x + s.w + r;
        } else {
          this.y = this.y < s.y + s.h / 2 ? s.y - r : s.y + s.h + r;
        }
      }
    }
    for (const p of solids.circles) {
      const dx = this.x - p.x;
      const dy = this.y - p.y;
      const d = Math.hypot(dx, dy);
      const min = r + p.r;
      if (d < min && d > 0.001) {
        this.x = p.x + (dx / d) * min;
        this.y = p.y + (dy / d) * min;
      }
    }
    // Keep the thief inside the room.
    const t = FLOOR.wall;
    this.x = Math.max(t + r, Math.min(FLOOR.w - t - r, this.x));
    this.y = Math.max(t + r, Math.min(FLOOR.h - t - r, this.y));
  }
}

/** Everything one frame of the game needs, in one object. */
export function createGameState(levelDef) {
  return {
    level: levelDef,
    thief: null,
    guards: [],
    cameras: [],
    loot: null,
    exit: null,
    alarm: null,
    tools: null,
    input: null,
    audio: null,
    elapsed: 0,
    time: 0,
    score: 0,
    totalTime: 0,
    bestRoom: '—',
    lastClearBonus: 0,
    toast: null,
    solids: { rects: [], circles: [] },
  };
}

/** Show a one-line message above the room for a few seconds. */
export function setToast(state, text, seconds = 3) {
  state.toast = { text, ttl: seconds };
}

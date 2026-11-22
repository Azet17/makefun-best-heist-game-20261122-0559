// cameras.js — the wall cameras.
// A camera sits on a wall and sweeps its cone back and forth. It never moves,
// so the player can learn its rhythm and slip through the gap. A camera that
// sees the thief feeds the alarm directly. An EMP takes a camera offline for
// a while; while offline it shows a dead lens and no cone.

import { canSee } from './vision.js';

/** Alarm gained per second while a camera holds the thief in its cone. */
const CAMERA_ALARM_RATE = 16;

export class Camera {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.base = def.base; // resting heading (radians)
    this.sweep = def.sweep; // half of the sweep arc (radians)
    this.speed = def.speed; // sweep speed
    this.range = def.range;
    this.halfAngle = def.halfAngle;
    this.phase = Math.random() * Math.PI * 2;
    this.facing = def.base;
    this.offlineTimer = 0; // > 0 while EMP'd
    this.seesThief = false;
    this.blink = 0; // red recording light
  }

  get offline() {
    return this.offlineTimer > 0;
  }

  /** Take this camera offline for `seconds` (an EMP burst). */
  disable(seconds) {
    this.offlineTimer = Math.max(this.offlineTimer, seconds);
  }

  update(dt, ctx) {
    this.blink += dt;
    if (this.offlineTimer > 0) {
      this.offlineTimer -= dt;
      this.seesThief = false;
      return;
    }
    this.phase += dt * this.speed;
    this.facing = this.base + Math.sin(this.phase) * this.sweep;
    const { thief, walls, pillars } = ctx;
    const hidden = thief.smokeTimer > 0;
    this.seesThief =
      !hidden && canSee(this, this.facing, this.range, this.halfAngle, thief.x, thief.y, walls, pillars);
    if (this.seesThief) {
      ctx.alarm.add(CAMERA_ALARM_RATE * dt, 'camera');
    }
  }
}

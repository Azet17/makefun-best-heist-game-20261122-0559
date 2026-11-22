// loot.js — the loot pedestal and the getaway door.
// The job has two beats: lift the piece off its pedestal (hold E beside it),
// then reach the getaway door, which only opens once the piece is in hand.
// Grabbing the piece is loud: it costs heat and the nearest guard comes to
// look. That is the getaway paying off the planning — or punishing the rush.

import { hasLineOfSight } from './vision.js';

export const GRAB_TIME = 0.7; // seconds of holding E beside the pedestal
export const GRAB_RADIUS = 78; // how close the thief must stand to grab

export class Loot {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.name = def.name;
    this.value = def.value;
    this.taken = false;
    this.grabProgress = 0; // 0..1 while the thief holds E in range
    this.sparkle = 0;
  }

  reset() {
    this.taken = false;
    this.grabProgress = 0;
  }

  /** Step the grab channel. Returns 'taken' the frame the piece comes off. */
  update(dt, ctx) {
    this.sparkle += dt;
    if (this.taken) return null;
    const { thief, input } = ctx;
    const dist = Math.hypot(thief.x - this.x, thief.y - this.y);
    if (dist <= GRAB_RADIUS && input.grab) {
      this.grabProgress += dt / GRAB_TIME;
      if (this.grabProgress >= 1) {
        this.taken = true;
        this.grabProgress = 0;
        return 'taken';
      }
    } else {
      this.grabProgress = Math.max(0, this.grabProgress - dt * 2);
    }
    return null;
  }
}

export class ExitDoor {
  constructor(def) {
    this.x = def.x;
    this.y = def.y;
    this.w = def.w;
    this.h = def.h;
    this.label = def.label;
    this.open = false;
  }

  reset() {
    this.open = false;
  }

  /** The thief escapes when the door is open and they step into it. */
  thiefInside(thief) {
    return (
      thief.x > this.x - 6 &&
      thief.x < this.x + this.w + 6 &&
      thief.y > this.y - 6 &&
      thief.y < this.y + this.h + 6
    );
  }
}

/** The nearest guard to a point, for the "someone heard the grab" beat. */
export function nearestGuard(guards, x, y) {
  let best = null;
  let bestDist = Infinity;
  for (const g of guards) {
    const d = Math.hypot(g.x - x, g.y - y);
    if (d < bestDist) {
      bestDist = d;
      best = g;
    }
  }
  return best;
}

export { hasLineOfSight };

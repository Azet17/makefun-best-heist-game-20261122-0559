// guards.js — the patrol guards.
// A guard walks its waypoints, sweeping its cone along its heading. When it
// catches sight of the thief its suspicion climbs; half-suspicious it walks
// to the last place it saw you, fully suspicious it chases and drives the
// alarm up. A noise-maker ping pulls it off patrol to investigate the sound.

import { canSee, angleDiff } from './vision.js';

/** How fast suspicion fills at point-blank range (per second). */
const SPOT_RATE = 2.2;
/** Suspicion above this makes a guard walk to the last seen spot. */
const SUSPICIOUS_AT = 0.45;
/** Suspicion at 1.0 means the guard is certain and chasing. */
const CERTAIN_AT = 1.0;
/** How fast suspicion fades while the thief is unseen (per second). */
const CALM_RATE = 0.5;

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.waypoints = def.waypoints;
    this.speed = def.speed;
    this.range = def.range;
    this.halfAngle = def.halfAngle;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.wp = 1 % def.waypoints.length;
    this.facing = 0;
    this.suspicion = 0;
    this.mode = 'patrol'; // patrol | investigate | chase
    this.target = null; // {x, y} the guard is walking toward
    this.lastSeen = null; // last known thief position
    this.pause = 0; // seconds to stand at a waypoint and look around
    this.lookTimer = 0;
    this.seesThief = false;
  }

  /** Current cone colour: amber on patrol, red when alerted. */
  coneColor() {
    if (this.mode === 'chase') return 'rgba(255,64,64,';
    if (this.mode === 'investigate') return 'rgba(255,176,64,';
    return 'rgba(255,214,90,';
  }

  /** Send this guard to investigate a point (a noise-maker ping, a grab). */
  investigate(x, y) {
    if (this.mode === 'chase') return;
    this.mode = 'investigate';
    this.target = { x, y };
    this.suspicion = Math.max(this.suspicion, SUSPICIOUS_AT);
  }

  /** Step the guard one frame. Returns nothing; reads thief + alarm state. */
  update(dt, ctx) {
    const { thief, walls, pillars, alarm } = ctx;
    const hidden = thief.smokeTimer > 0;
    this.seesThief = !hidden && canSee(this, this.facing, this.range, this.halfAngle, thief.x, thief.y, walls, pillars);

    if (this.seesThief) {
      this.lastSeen = { x: thief.x, y: thief.y };
      const dist = Math.hypot(thief.x - this.x, thief.y - this.y);
      const closeness = 1 - dist / (this.range * 1.15);
      this.suspicion = Math.min(CERTAIN_AT, this.suspicion + SPOT_RATE * (0.5 + closeness) * dt);
    } else {
      this.suspicion = Math.max(0, this.suspicion - CALM_RATE * dt);
    }

    // Mode follows suspicion and the alarm's hunt stage.
    if (this.suspicion >= CERTAIN_AT || (alarm.stage === 'hunt' && this.lastSeen)) {
      this.mode = 'chase';
    } else if (this.suspicion >= SUSPICIOUS_AT && this.lastSeen) {
      if (this.mode !== 'chase') this.mode = 'investigate';
    } else if (this.mode === 'investigate' && this.target && this.arrived(this.target)) {
      this.mode = 'patrol';
      this.target = null;
      this.pause = 1.2; // look around before resuming the beat
    } else if (this.mode === 'chase' && this.suspicion <= 0.05 && alarm.stage !== 'hunt') {
      this.mode = 'patrol';
      this.lastSeen = null;
    }

    // Pick a destination and walk toward it.
    let dest = null;
    let speed = this.speed;
    if (this.mode === 'chase' && this.lastSeen) {
      dest = this.lastSeen;
      speed = this.speed * 1.75;
    } else if (this.mode === 'investigate' && this.target) {
      dest = this.target;
      speed = this.speed * 1.3;
    } else if (this.mode === 'patrol') {
      if (this.pause > 0) {
        this.pause -= dt;
        this.lookTimer += dt;
        // Scan the room while standing: slow sweep of the cone.
        this.facing += Math.sin(this.lookTimer * 1.4) * dt * 0.9;
      } else {
        dest = this.waypoints[this.wp];
        if (this.arrived(dest, 8)) {
          this.wp = (this.wp + 1) % this.waypoints.length;
          this.pause = 0.9;
        }
      }
    }

    if (dest) {
      const dx = dest.x - this.x;
      const dy = dest.y - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.5) {
        const step = Math.min(d, speed * dt);
        this.x += (dx / d) * step;
        this.y += (dy / d) * step;
        // Face where you walk; ease the turn so the cone sweeps, not snaps.
        const want = Math.atan2(dy, dx);
        const diff = angleDiff(want, this.facing) * Math.sign(((want - this.facing + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        this.facing += Math.max(-3.2 * dt, Math.min(3.2 * dt, diff));
      }
    }
  }

  arrived(p, slack = 10) {
    return Math.hypot(p.x - this.x, p.y - this.y) <= slack;
  }
}

// tools.js — the thief's kit. Every tool costs heat and has limited uses,
// so each one is a decision, not a button to mash.
//   1 Noise-maker — click a spot: every guard near the ping walks over to look.
//   2 EMP        — kills every camera for 10 seconds.
//   3 Smoke      — 4 seconds invisible to cones and cameras.

export const EMP_SECONDS = 10;
export const SMOKE_SECONDS = 4;
export const NOISE_RADIUS = 200; // guards inside this of the ping investigate
export const NOISE_THROW_RANGE = 300; // how far the thief can throw it

/** Heat (alarm) each tool costs the moment it is used. */
export const TOOL_HEAT = { noise: 4, emp: 6, smoke: 6 };

export class Tools {
  constructor(counts) {
    this.counts = { noise: counts.noise, emp: counts.emp, smoke: counts.smoke };
    this.selected = 'noise';
    this.pings = []; // active noise-maker pings: {x, y, ttl}
  }

  reset(counts) {
    this.counts = { noise: counts.noise, emp: counts.emp, smoke: counts.smoke };
    this.selected = 'noise';
    this.pings = [];
  }

  /** Throw a noise-maker at (x,y). Returns a message or null when it fails. */
  throwNoise(x, y, ctx) {
    if (this.counts.noise <= 0) return 'No noise-makers left.';
    const { thief } = ctx;
    if (Math.hypot(x - thief.x, y - thief.y) > NOISE_THROW_RANGE) {
      return 'Too far to throw.';
    }
    this.counts.noise--;
    this.pings.push({ x, y, ttl: 1.6 });
    ctx.alarm.add(TOOL_HEAT.noise, 'tool');
    let lured = 0;
    for (const g of ctx.guards) {
      if (Math.hypot(g.x - x, g.y - y) <= NOISE_RADIUS) {
        g.investigate(x, y);
        lured++;
      }
    }
    ctx.audio?.blip(880, 0.08);
    return lured > 0 ? `Ping! ${lured} guard${lured > 1 ? 's' : ''} heard it.` : 'Ping… nobody close enough to hear.';
  }

  /** Fire the EMP: every camera goes dark for EMP_SECONDS. */
  fireEmp(ctx) {
    if (this.counts.emp <= 0) return 'No EMP charges left.';
    this.counts.emp--;
    ctx.alarm.add(TOOL_HEAT.emp, 'tool');
    for (const c of ctx.cameras) c.disable(EMP_SECONDS);
    ctx.audio?.zap();
    return `EMP burst — cameras dark for ${EMP_SECONDS}s.`;
  }

  /** Light the smoke: the thief cannot be seen for SMOKE_SECONDS. */
  lightSmoke(ctx) {
    if (this.counts.smoke <= 0) return 'No smoke left.';
    if (ctx.thief.smokeTimer > 0) return 'Already in smoke.';
    this.counts.smoke--;
    ctx.alarm.add(TOOL_HEAT.smoke, 'tool');
    ctx.thief.smokeTimer = SMOKE_SECONDS;
    ctx.audio?.hiss();
    return `Smoke out — unseen for ${SMOKE_SECONDS}s.`;
  }

  update(dt) {
    for (const p of this.pings) p.ttl -= dt;
    this.pings = this.pings.filter((p) => p.ttl > 0);
  }
}

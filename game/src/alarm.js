// alarm.js — the alarm meter.
// One number, 0 to 100, drives the whole room's tension. Guards and cameras
// push it up while they see the thief; it drains slowly while nobody does.
// Every tool costs a little heat, so a tool is never free. At 100 the job is
// blown and the thief is caught.

export const ALARM_MAX = 100;

/** Stage thresholds: calm, wary, hunt, caught. */
export function stageOf(value) {
  if (value >= ALARM_MAX) return 'caught';
  if (value >= 65) return 'hunt';
  if (value >= 30) return 'wary';
  return 'calm';
}

export class Alarm {
  constructor() {
    this.value = 0;
    this.peak = 0;
    this.stage = 'calm';
    this.tripped = false; // latched the moment the meter hits 100: no decay escapes a blown job
    this.lastSource = null; // what pushed it up most recently, for the HUD
  }

  /** Add heat. `source` is a short label: 'guard', 'camera', 'tool', 'grab'. */
  add(amount, source) {
    if (amount <= 0) return;
    this.value = Math.min(ALARM_MAX, this.value + amount);
    if (this.value >= ALARM_MAX) this.tripped = true;
    this.lastSource = source;
    this.refresh();
  }

  /** Slow drain while the thief is unseen; called every frame. */
  decay(dt, anyoneSees) {
    if (anyoneSees) return;
    this.value = Math.max(0, this.value - 3.2 * dt);
    this.refresh();
  }

  refresh() {
    this.peak = Math.max(this.peak, this.value);
    this.stage = this.tripped ? 'caught' : stageOf(this.value);
  }

  reset() {
    this.value = 0;
    this.peak = 0;
    this.stage = 'calm';
    this.tripped = false;
    this.lastSource = null;
  }

  /** Meter colour for the HUD: green, amber, red. */
  color() {
    if (this.stage === 'hunt' || this.stage === 'caught') return '#ff4d4d';
    if (this.stage === 'wary') return '#ffb340';
    return '#3ddc84';
  }

  /** One-line stage label for the HUD. */
  label() {
    if (this.stage === 'caught') return 'BLOWN';
    if (this.stage === 'hunt') return 'HUNTED';
    if (this.stage === 'wary') return 'SUSPICIOUS';
    return 'QUIET';
  }
}

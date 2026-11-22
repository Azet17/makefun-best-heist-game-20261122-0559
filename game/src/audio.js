// audio.js — tiny synthesized sounds, no audio files.
// Everything is a WebAudio oscillator or filtered noise burst, built on the
// fly. Audio starts on the first user gesture; M toggles mute. Nothing here
// loads over the network.

export class AudioFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  /** Create the context on a user gesture (browsers block it before then). */
  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, dur, type = 'sine', vol = 0.08, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, vol = 0.06, filterFreq = 1200) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    src.start(t0);
  }

  /** Short UI blip (tool select, noise ping). */
  blip(freq = 660, dur = 0.06) {
    this._tone(freq, dur, 'square', 0.05);
  }

  /** EMP burst: a falling zap. */
  zap() {
    this._tone(1400, 0.28, 'sawtooth', 0.07, 120);
    this._noise(0.2, 0.05, 2600);
  }

  /** Smoke puff. */
  hiss() {
    this._noise(0.5, 0.07, 900);
  }

  /** The loot coming off its pedestal: a little chime. */
  chime() {
    this._tone(523, 0.14, 'sine', 0.09);
    setTimeout(() => this._tone(784, 0.2, 'sine', 0.09), 90);
    setTimeout(() => this._tone(1046, 0.3, 'sine', 0.08), 180);
  }

  /** Being spotted: a rising two-note sting. */
  spotted() {
    this._tone(220, 0.16, 'sawtooth', 0.08, 440);
    setTimeout(() => this._tone(440, 0.22, 'sawtooth', 0.08, 660), 120);
  }

  /** Caught: a low thud and a falling tone. */
  caught() {
    this._tone(160, 0.5, 'sawtooth', 0.1, 60);
    this._noise(0.3, 0.08, 300);
  }

  /** Level cleared: a rising arpeggio. */
  win() {
    [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this._tone(f, 0.22, 'sine', 0.09), i * 110));
  }
}

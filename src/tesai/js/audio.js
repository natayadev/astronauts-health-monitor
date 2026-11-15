/**
 * audio.js · Built-in audio (tones + voice).
 * Same idea as the Higía simulation: the system talks to the crew.
 *  - tone():  short Web Audio patterns per alert level (no files needed)
 *  - speak(): browser speech synthesis in the active language (ES / EN)
 * Browsers only allow sound after a user gesture, so unlock() is called from
 * the first click / key press and from the "Turn on audio" button.
 * The on/off switch is State.sound (also in Advanced → "Sound on critical alerts").
 */
import { State } from './state.js';

const PATTERNS = {
  // [frequency Hz, duration s, gap s]
  attention: [[660, .12, .08], [660, .12, 0]],
  surgeon:   [[880, .14, .06], [660, .14, .06], [880, .14, .06], [660, .14, 0]],
  ok:        [[523, .09, .04], [784, .14, 0]]
};

export const Sound = {
  ctx: null, unlocked: false, voices: [], current: null,

  get voiceSupported() { return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; },
  get enabled() { return !!State.sound; },

  /** Call from a user gesture. Safe to call many times. */
  unlock() {
    try {
      this.ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { /* no Web Audio */ }
    if (this.voiceSupported) {
      this.loadVoices();
      window.speechSynthesis.onvoiceschanged = () => this.loadVoices();
    }
    this.unlocked = true;
  },

  loadVoices() { try { this.voices = window.speechSynthesis.getVoices() || []; } catch (e) { this.voices = []; } },

  pickVoice(lang) {
    const want = lang === 'es' ? 'es' : 'en';
    const list = this.voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(want));
    const pref = lang === 'es' ? ['es-ar', 'es-419', 'es-mx', 'es-es'] : ['en-us', 'en-gb'];
    for (const p of pref) { const v = list.find(x => x.lang.toLowerCase().replace('_', '-') === p); if (v) return v; }
    return list[0] || null;
  },

  /** Short alert tone. level: 'attention' | 'surgeon' | 'ok' */
  tone(level = 'attention') {
    if (!this.enabled || !this.ctx) return;
    const pat = PATTERNS[level] || PATTERNS.attention;
    let t = this.ctx.currentTime + .02;
    for (const [f, d, gap] of pat) {
      try {
        const o = this.ctx.createOscillator(), g = this.ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .015); g.gain.linearRampToValueAtTime(0, t + d);
        o.connect(g); g.connect(this.ctx.destination); o.start(t); o.stop(t + d + .02);
      } catch (e) { /* ignore */ }
      t += d + gap;
    }
  },

  /** Speak a text in the active language. Returns a promise that resolves when finished (or immediately if muted). */
  speak(text, { interrupt = true, rate = 1 } = {}) {
    return new Promise(resolve => {
      if (!this.enabled || !this.unlocked || !this.voiceSupported || !text) return resolve(false);
      try {
        const synth = window.speechSynthesis;
        if (interrupt) synth.cancel();
        const u = new SpeechSynthesisUtterance(text);
        const lang = State.lang === 'es' ? 'es' : 'en';
        u.lang = lang === 'es' ? 'es-AR' : 'en-US'; u.rate = rate; u.pitch = 1;
        const v = this.pickVoice(lang); if (v) { u.voice = v; u.lang = v.lang; }
        u.onend = () => resolve(true); u.onerror = () => resolve(false);
        this.current = u; synth.speak(u);
      } catch (e) { resolve(false); }
    });
  },

  stop() { try { window.speechSynthesis?.cancel(); } catch (e) { /* ignore */ } },

  /** Tone first, then the voice. */
  announce(level, text) {
    this.tone(level);
    if (!text) return Promise.resolve(false);
    return new Promise(r => setTimeout(() => this.speak(text).then(r), level === 'surgeon' ? 750 : 450));
  },

  setEnabled(on) {
    State.sound = !!on; State.save();
    if (!on) this.stop();
  }
};

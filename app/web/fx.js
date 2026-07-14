// Utilidades de experiencia — sin dependencias, sin assets
const FX = {
  reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,

  countUp(el, from, to, ms = 640) {
    if (!el) return;
    if (FX.reducedMotion || ms <= 0) { el.textContent = to.toLocaleString("es"); return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(from + (to - from) * eased).toLocaleString("es");
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },

  burst(x, y, count = 14) {
    if (FX.reducedMotion) return;
    const colors = ["#5E97E6", "#52C9B8", "#9289E3", "#E6AF6B"];
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "fx-spark";
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const dist = 40 + Math.random() * 50;
      s.style.left = x + "px";
      s.style.top = y + "px";
      s.style.background = colors[i % colors.length];
      s.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      s.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      document.body.appendChild(s);
      s.addEventListener("animationend", () => s.remove());
      setTimeout(() => s.remove(), 1200);
    }
  },

  bloom(x, y) {
    if (FX.reducedMotion) return;
    const s = document.createElement("span");
    s.className = "fx-bloom";
    const d = Math.round(Math.min(window.innerWidth, window.innerHeight) * 0.6);
    s.style.width = d + "px";
    s.style.height = d + "px";
    s.style.left = (x - d / 2) + "px";
    s.style.top = (y - d / 2) + "px";
    document.body.appendChild(s);
    s.addEventListener("animationend", () => s.remove());
    setTimeout(() => s.remove(), 1200);
  },

  sound: {
    ctx: null,
    get enabled() { return localStorage.getItem("coding-sound") !== "off"; },
    set enabled(v) { localStorage.setItem("coding-sound", v ? "on" : "off"); },
    _ensure() {
      if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this.ctx.state === "suspended") this.ctx.resume();
      return this.ctx;
    },
    _note(freq, at, dur = 0.14, type = "sine", vol = 0.16) {
      const ctx = this._ensure();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(vol, ctx.currentTime + at + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + at + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + dur + 0.05);
    },
    play(name) {
      if (!this.enabled) return;
      try {
        if (name === "correct") { this._note(523.25, 0, 0.12); this._note(659.25, 0.07, 0.16); }
        else if (name === "wrong") { this._note(196, 0, 0.18, "triangle", 0.12); }
        else if (name === "complete") { this._note(523.25, 0, 0.12); this._note(659.25, 0.09, 0.12); this._note(783.99, 0.18, 0.2); }
        else if (name === "perfect") { this._note(659.25, 0, 0.1); this._note(783.99, 0.08, 0.1); this._note(1046.5, 0.16, 0.24); }
        else if (name === "streak") { this._note(880, 0, 0.1, "sine", 0.12); this._note(1046.5, 0.09, 0.18, "sine", 0.12); }
      } catch (e) { /* audio no disponible: silencio */ }
    },
  },
};
window.FX = FX;

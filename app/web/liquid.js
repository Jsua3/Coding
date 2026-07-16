// Liquid Glass — el vidrio como material que responde. Sin dependencias, sin assets.
const Liquid = {
  // Onda que nace en el punto exacto del tap y crece hasta cubrir el elemento entero.
  // Contrato del host: position: relative + overflow: hidden.
  ripple(el) {
    if (!el) return () => {};
    const onDown = (e) => {
      if (window.FX && FX.reducedMotion) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Radio = distancia a la esquina MÁS LEJANA (Pitágoras): un diámetro fijo dejaría esquinas secas.
      const dx = Math.max(x, rect.width - x);
      const dy = Math.max(y, rect.height - y);
      const d = Math.ceil(Math.sqrt(dx * dx + dy * dy) * 2);
      const wave = document.createElement("span");
      wave.className = "lg-ripple";
      wave.style.width = d + "px";
      wave.style.height = d + "px";
      wave.style.left = (x - d / 2) + "px";
      wave.style.top = (y - d / 2) + "px";
      el.appendChild(wave);
      wave.addEventListener("animationend", () => wave.remove());
      setTimeout(() => wave.remove(), 1200);
    };
    el.addEventListener("pointerdown", onDown);
    return () => el.removeEventListener("pointerdown", onDown);
  },
  // Los elementos .lg-reveal no "aparecen": se condensan (de vapor a sólido) al entrar en pantalla.
  // Ceremonia de primera vez: una vez revelado, se deja de observar.
  reveal(container) {
    if (!container) return () => {};
    const els = Array.from(container.querySelectorAll(".lg-reveal:not(.is-visible)"));
    if (!els.length) return () => {};
    if ((window.FX && FX.reducedMotion) || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return () => {};
    }
    // Stagger con techo: los primeros ~6 entran en cascada; el resto, juntos.
    // Sin el techo, una grilla de 20 tarjetas tarda más de un segundo y la página se percibe lenta.
    els.forEach((el, i) => el.style.setProperty("--reveal-delay", Math.min(i * 55, 330) + "ms"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  },
  // El cursor como fuente de luz: publica 5 variables CSS (--mx/--my/--rx/--ry/--glow)
  // que el CSS (.lg-tilt) convierte en tilt 3D + brillo especular. No anima nada por JS.
  // Doble puerta: reduced motion (fuente única del proyecto) + puntero fino (en táctil no hay
  // cursor que seguir). Coalescencia: máximo una escritura de estilos por frame.
  pointer(el, opts = {}) {
    if (!el) return () => {};
    const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
    const strength = Math.min(Math.abs(opts.tilt ?? 4), 6); // tope duro: 6°
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const enabled = !(window.FX && FX.reducedMotion) && finePointer;
    if (!enabled) return () => {};

    let last = null, rafId = 0, glowTimer = 0;

    const write = () => {
      rafId = 0;
      if (!last) return;
      const rect = el.getBoundingClientRect();
      const x = clamp((last.clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((last.clientY - rect.top) / rect.height, 0, 1);
      el.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      el.style.setProperty("--rx", ((y - 0.5) * -strength).toFixed(2) + "deg"); // mira al cursor
      el.style.setProperty("--ry", ((x - 0.5) * strength).toFixed(2) + "deg");
    };
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(write); };
    const recenter = () => {
      el.style.setProperty("--mx", "74%");
      el.style.setProperty("--my", "18%");
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };

    const onMove = (e) => { last = e; schedule(); };
    const onEnter = () => {
      clearTimeout(glowTimer);
      glowTimer = setTimeout(() => el.style.setProperty("--glow", "1"), 90); // retardo de intención
    };
    const onLeave = () => {
      clearTimeout(glowTimer);
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      last = null;
      recenter();
      el.style.setProperty("--glow", "0");
    };
    const onFocusIn = () => el.style.setProperty("--glow", "0.7"); // teclado: luz sin cursor
    const onFocusOut = onLeave;

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);

    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      clearTimeout(glowTimer);
      if (rafId) cancelAnimationFrame(rafId);
    };
  },
};
window.Liquid = Liquid;

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
      // Si el teclado sigue dentro, la luz de foco se conserva; si no, se apaga.
      el.style.setProperty("--glow", el.matches(":focus-within") ? "0.7" : "0");
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
  // El fondo vivo: papel de cuaderno que se curva bajo el cursor como bajo una gota-lente.
  // Canvas 2D inmediato: la cuadrícula son polilíneas cuyos puntos se desplazan hacia el
  // centro de la lente con caída smoothstep. La lente PERSIGUE al cursor con amortiguación
  // (gota pesada, no imán) y el rAF solo corre mientras hay algo que animar: en reposo, cero CPU.
  // Bajo reduced motion o puntero no-fino la cuadrícula se dibuja UNA vez, estática.
  grid(canvas) {
    if (!canvas) return () => {};
    const ctx = canvas.getContext("2d");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const animated = !(window.FX && FX.reducedMotion) && finePointer;

    const STEP = 48;      // paso de la cuadrícula (px)
    const RADIUS = 180;   // radio de la lente (px)
    const PULL = 10;      // desplazamiento máximo hacia el centro (px)
    const FOLLOW = 0.12;  // persecución amortiguada por frame
    const FADE = 0.08;    // crecimiento/decaimiento de la fuerza por frame
    const SEG = 24;       // longitud de segmento de las polilíneas (px)

    let w = 0, h = 0;
    const lens = { x: -9999, y: -9999, power: 0 }; // la gota: posición + fuerza 0..1
    const target = { x: -9999, y: -9999, inside: false };
    let rafId = 0;

    // smoothstep: 1 en el centro, 0 en el borde, sin costuras.
    const falloff = (d) => {
      const t = 1 - d / RADIUS;
      return t * t * (3 - 2 * t);
    };

    // Refracción de gota: el punto se desplaza HACIA el centro de la lente.
    const warp = (x, y) => {
      if (lens.power <= 0) return { x, y };
      const dx = lens.x - x, dy = lens.y - y;
      const d = Math.hypot(dx, dy);
      if (d === 0 || d >= RADIUS) return { x, y };
      const k = (falloff(d) * PULL * lens.power) / d;
      return { x: x + dx * k, y: y + dy * k };
    };

    const drawLine = (x0, y0, x1, y1) => {
      ctx.beginPath();
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / SEG);
      for (let i = 0; i <= steps; i++) {
        const p = warp(x0 + ((x1 - x0) * i) / steps, y0 + ((y1 - y0) * i) / steps);
        if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(226, 236, 255, 0.045)";
      ctx.lineWidth = 1;
      for (let x = STEP; x < w; x += STEP) drawLine(x, 0, x, h);
      for (let y = STEP; y < h; y += STEP) drawLine(0, y, w, y);
    };

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const tick = () => {
      rafId = 0;
      lens.x += (target.x - lens.x) * FOLLOW;
      lens.y += (target.y - lens.y) * FOLLOW;
      const goal = target.inside ? 1 : 0;
      lens.power += (goal - lens.power) * FADE;
      // ¿Ya no hay nada que animar? Estado final exacto, un último dibujo, y a dormir.
      const settled =
        Math.abs(target.x - lens.x) < 0.2 &&
        Math.abs(target.y - lens.y) < 0.2 &&
        Math.abs(goal - lens.power) < 0.01;
      if (settled) {
        lens.power = goal;
        lens.x = target.x;
        lens.y = target.y;
        draw();
        return;
      }
      draw();
      schedule();
    };
    const schedule = () => { if (!rafId) rafId = requestAnimationFrame(tick); };

    const onMove = (e) => {
      target.x = e.clientX;
      target.y = e.clientY;
      target.inside = true;
      // Si la gota está dormida (fuerza 0), se CONDENSA donde está el cursor — sin esto,
      // perseguiría desde su última posición (o desde fuera de pantalla en el primer movimiento)
      // y se vería un barrido extraño cruzando el fondo.
      if (lens.power === 0) { lens.x = target.x; lens.y = target.y; }
      schedule();
    };
    const onLeave = () => { target.inside = false; schedule(); }; // la lente se desvanece y las líneas vuelven

    window.addEventListener("resize", resize);
    resize(); // el primer dibujo: la cuadrícula estática (también en reduced motion / táctil)
    if (animated) {
      window.addEventListener("pointermove", onMove);
      document.documentElement.addEventListener("mouseleave", onLeave);
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (animated) {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("mouseleave", onLeave);
      }
      if (rafId) cancelAnimationFrame(rafId);
    };
  },
};
window.Liquid = Liquid;

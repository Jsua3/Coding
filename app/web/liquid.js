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
};
window.Liquid = Liquid;

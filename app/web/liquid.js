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
};
window.Liquid = Liquid;

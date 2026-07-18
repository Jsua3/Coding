// La puerta comparte fondo: un video montado UNA vez en App (fuera del div keyado), que el
// landing disuelve al scrollear y el login usa a plena presencia. Si el archivo no existe,
// el autoplay se bloquea o hay reduced motion, la puerta queda sobre la aurora de siempre:
// el diseño no depende del video para funcionar.
function GateBackdrop({ mode }) {
  const [failed, setFailed] = React.useState(false);
  const frameRef = React.useRef(null);  // la lámina póster+video (NO el video: la disolución
  const videoRef = React.useRef(null);  // debe funcionar también en modo sin video)
  const noVideo = failed || (window.FX && FX.reducedMotion);

  // La disolución del hero: en landing, la opacidad cae de 1 a 0 durante los primeros ~90vh
  // de scroll, y el video SE PAUSA al llegar a 0 (cero decodificación mientras no se ve).
  // El cálculo va directo en el evento (pasivo, sin rAF): es una resta y un clamp — y así
  // queda verificable en el panel del tooling, donde rAF jamás procesa.
  React.useEffect(() => {
    const apply = () => {
      const op = mode === "login" ? 1 : Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.9));
      if (frameRef.current) frameRef.current.style.opacity = String(op);
      const el = videoRef.current;
      if (el) {
        if (op === 0 && !el.paused) el.pause();
        else if (op > 0 && el.paused) {
          const p = el.play();
          if (p && p.catch) p.catch(() => {}); // autoplay bloqueado: queda el póster, sin ruido
        }
      }
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    return () => window.removeEventListener("scroll", apply);
  }, [mode, noVideo]);

  return (
    <div aria-hidden="true" className="lg-gate">
      <div ref={frameRef} className="lg-gate__frame">
        <div className="lg-gate__poster"></div>
        {!noVideo ? (
          <video
            ref={videoRef}
            className="lg-gate__video"
            autoPlay
            muted
            loop
            playsInline
            src="assets/gate.mp4"
            poster="assets/gate-poster.jpg"
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
      <div className="lg-gate__scrim"></div>
    </div>
  );
}

Object.assign(window, { GateBackdrop });

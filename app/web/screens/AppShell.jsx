// Barra de navegacion flotante + iconos compartidos del kit
const KIT = window.CodingDesignSystem_2ecb3a;

function KIcon({ d, size = 15 }) {
  return <svg width={size} height={size} viewBox="0 0 16 16" fill="none"><path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
const ICONS = {
  search: "M11.5 11.5L14 14M12 7A5 5 0 112 7a5 5 0 0110 0z",
  flame: "M8 1.5c1 2.5 4 3.5 4 7a4 4 0 01-8 0c0-1.5.6-2.6 1.4-3.6C6 6.2 7.5 4.5 8 1.5z",
  back: "M10 3L5 8l5 5",
  play: "M5 3.5v9l7.5-4.5L5 3.5z",
  check: "M3 8.5L6.5 12L13 4.5",
  lock: "M4.5 7V5a3.5 3.5 0 017 0v2M3.5 7h9v6.5h-9V7z",
  book: "M2.5 3.5h4.2c.7 0 1.3.6 1.3 1.3V13c0-.7-.6-1.3-1.3-1.3H2.5V3.5zM13.5 3.5H9.3c-.7 0-1.3.6-1.3 1.3V13c0-.7.6-1.3 1.3-1.3h4.2V3.5z",
  sound: "M2.5 6v4h2.5L8.5 13V3L5 6H2.5zM10.5 5.5a3.5 3.5 0 010 5M12 3.5a6 6 0 010 9",
  soundOff: "M2.5 6v4h2.5L8.5 13V3L5 6H2.5zM10.5 6.5l3 3M13.5 6.5l-3 3",
  logout: "M6.5 3.5H3.5v9h3M10 5.5L12.5 8 10 10.5M12.5 8H6.5",
};

function SoundToggle() {
  const { IconButton } = KIT;
  const [on, setOn] = React.useState(window.FX ? FX.sound.enabled : true);
  const toggle = () => { FX.sound.enabled = !on; setOn(!on); if (!on) FX.sound.play("correct"); };
  return (
    <IconButton label={on ? "Silenciar" : "Activar sonido"} size="sm" variant="ghost" onClick={toggle}>
      <KIcon d={on ? ICONS.sound : ICONS.soundOff} />
    </IconButton>
  );
}

// El blur del vidrio: SIEMPRE en una capa aria-hidden aparte, jamás sobre un elemento con texto.
function NavGlass() {
  return <span aria-hidden className="lg-nav__glass"></span>;
}

// El avatar abre el menú de perfil: cae como una gota y se evapora al cerrarse (usePhase retiene
// el contenido durante los 160ms de salida). Se cierra al tocar fuera o con Escape.
function AvatarMenu({ user, onLogout, onProgress, onProfile }) {
  const [open, setOpen] = React.useState(false);
  const { shown, phase } = usePhase(open ? true : null, 160);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const outside = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const escape = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative", display: "flex" }}>
      <button aria-haspopup="menu" aria-expanded={open} aria-label="Tu perfil" onClick={() => setOpen(!open)}
        style={{ width: 36, height: 36, padding: 0, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #6FA0E0, #4E86D6)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 14px rgba(94,151,230,0.35)", fontFamily: "inherit", fontSize: 13, fontWeight: 700, color: "var(--text-on-accent)", cursor: "pointer" }}>
        {user.initials}
      </button>
      {shown ? (
        <div role="menu" className={"lg-menu " + (phase === "out" ? "anim-evaporate" : "lg-menu--in")}
          style={{ pointerEvents: phase === "out" ? "none" : "auto" }}>
          <span aria-hidden className="lg-menu__glass"></span>
          <div style={{ padding: "8px 12px 10px" }}>
            <div style={{ fontSize: "var(--text-base)", fontWeight: 700, color: "var(--text-primary)" }}>{user.name}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 2, wordBreak: "break-all" }}>{user.email}</div>
          </div>
          <div className="lg-menu__sep"></div>
          <button role="menuitem" className="lg-menu__item" onClick={() => { setOpen(false); onProfile(); }}>
            <KIcon d={ICONS.book} size={14} />
            Tu perfil
          </button>
          <button role="menuitem" className="lg-menu__item" onClick={() => { setOpen(false); onProgress(); }}>
            <KIcon d={ICONS.book} size={14} />
            Tu progreso
          </button>
          <div className="lg-menu__sep"></div>
          <button role="menuitem" className="lg-menu__item lg-menu__item--danger" onClick={() => { setOpen(false); onLogout(); }}>
            <KIcon d={ICONS.logout} size={14} />
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}

// Las pestañas de la navbar. Reemplaza al Tabs del DS SOLO aquí: aquel mide tercios del
// contenedor y esta píldora mide el TEXTO real. El viaje es FLIP: geometría de reposo directa
// (left/width sin transición, jamás animados) y el vuelo solo con transform (translateX+scaleX),
// que entre anchos distintos estira la píldora como una gota y la deja nítida al llegar.
function NavTabs({ items, value, onChange }) {
  const listRef = React.useRef(null);
  const btnRefs = React.useRef({});
  const pillRef = React.useRef(null);
  const prevRect = React.useRef(null);
  const [tick, setTick] = React.useState(0); // re-medición por resize/fuentes

  React.useLayoutEffect(() => {
    const list = listRef.current, btn = btnRefs.current[value], pill = pillRef.current;
    if (!list || !btn || !pill) return;
    const lr = list.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    const rect = { left: br.left - lr.left, width: br.width };

    pill.style.transition = "none";
    pill.style.left = rect.left + "px";
    pill.style.width = rect.width + "px";

    const prev = prevRect.current;
    prevRect.current = rect;
    const reduced = window.FX && FX.reducedMotion;
    if (!prev || reduced || (prev.left === rect.left && prev.width === rect.width)) return;

    // FLIP: arranca visualmente desde la geometría vieja y viaja a la nueva SOLO con transform.
    const dx = prev.left - rect.left;
    const sx = prev.width / rect.width;
    pill.style.transform = "translateX(" + dx + "px) scaleX(" + sx + ")";
    void pill.offsetWidth; // reflow: fija el punto de partida antes de encender la transición
    pill.style.transition = "transform 420ms var(--ease-glass)";
    pill.style.transform = "translateX(0) scaleX(1)";
  }, [value, tick]);

  // Las fuentes web y el resize cambian el ancho del texto: re-medir sin animar.
  React.useEffect(() => {
    const remeasure = () => { prevRect.current = null; setTick((t) => t + 1); };
    window.addEventListener("resize", remeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
    return () => window.removeEventListener("resize", remeasure);
  }, []);

  return (
    <div ref={listRef} role="tablist" className="lg-navtabs">
      <span ref={pillRef} aria-hidden className="lg-navtabs__pill"></span>
      {items.map((it) => (
        <button
          key={it.id}
          ref={(el) => { btnRefs.current[it.id] = el; }}
          role="tab"
          aria-selected={it.id === value}
          className={"lg-navtabs__tab" + (it.id === value ? " is-active" : "")}
          onClick={() => onChange && onChange(it.id)}
        >{it.label}</button>
      ))}
    </div>
  );
}

function NavBar({ onHome, tab, setTab, user }) {
  const { IconButton, Badge } = KIT;
  const split = useScrolled(32);
  // Solo animamos tras un cambio real de estado: si la página monta ya scrolleada, la navbar
  // aparece partida pero sin reproducir la partición (nada se anima en el montaje).
  const [animate, setAnimate] = React.useState(false);
  const first = React.useRef(true);
  React.useEffect(() => {
    if (first.current) { first.current = false; return; }
    setAnimate(true);
  }, [split]);
  const cls = "lg-nav"
    + (split ? " lg-nav--split" : (animate ? " lg-nav--merged" : ""))
    + (animate ? " lg-nav--anim" : "");

  return (
    <div className={cls}>
      <div className="lg-nav__pill lg-nav__pill--logo" onClick={onHome}>
        <NavGlass />
        <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Coding</span>
        <span style={{ width: 4, height: 18, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 10px var(--accent-cyan)" }}></span>
      </div>
      <span aria-hidden className="lg-nav__bridge"><NavGlass /></span>
      <div className="lg-nav__pill lg-nav__pill--tabs">
        <NavGlass />
        {/* Sin vidrio propio: las pestañas son texto sobre la superficie de la navbar. El
            indicador es NavTabs: píldora medida al texto que viaja con FLIP. */}
        <NavTabs value={tab} onChange={setTab} items={[
          { id: "inicio", label: "Inicio" },
          { id: "materias", label: "Materias" },
          { id: "progreso", label: "Progreso" },
        ]} />
      </div>
      <span aria-hidden className="lg-nav__bridge"><NavGlass /></span>
      <div className="lg-nav__pill lg-nav__pill--actions">
        <NavGlass />
        <SoundToggle />
        <IconButton label="Buscar" size="sm" variant="ghost"><KIcon d={ICONS.search} /></IconButton>
        <Badge tone="amber" dot>{user.streak} {user.streak === 1 ? "día" : "días"}</Badge>
        <AvatarMenu user={user} onLogout={() => API.logout()} onProgress={() => setTab("progreso")} onProfile={() => setTab("perfil")} />
      </div>
    </div>
  );
}

function PageFrame({ children }) {
  return <div style={{ maxWidth: 1160, margin: "0 auto", padding: "20px 32px 64px" }}>{children}</div>;
}

function LoadingPanel() {
  return (
    <div style={{ padding: 48, textAlign: "center", color: "var(--text-tertiary)", fontSize: "var(--text-md)" }}>
      Cargando…
    </div>
  );
}

function ErrorPanel({ message, onRetry }) {
  const { GlassPanel, Button } = KIT;
  return (
    <GlassPanel padding="var(--space-6)" style={{ textAlign: "center" }}>
      <p style={{ margin: "0 0 14px", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>{message}</p>
      <Button variant="secondary" onClick={onRetry}>Reintentar</Button>
    </GlassPanel>
  );
}

// Retiene el valor anterior durante la fase de salida para poder animar desmontajes.
// Contrato completo en docs/superpowers/specs/2026-07-13-coreografia-de-gota-design.md §4.
function usePhase(value, outMs) {
  const [shown, setShown] = React.useState(value);
  const [phase, setPhase] = React.useState("in");
  const timer = React.useRef(null);
  const shownRef = React.useRef(value);
  shownRef.current = shown;

  React.useEffect(() => () => clearTimeout(timer.current), []);

  React.useEffect(() => {
    if (value === shownRef.current) {
      clearTimeout(timer.current);
      setPhase("in");
      return;
    }
    if (shownRef.current == null || (window.FX && FX.reducedMotion)) {
      clearTimeout(timer.current);
      setShown(value);
      setPhase("in");
      return;
    }
    setPhase("out");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setShown(value); setPhase("in"); }, outMs);
  }, [value]);

  return { shown, phase };
}

// true cuando la página bajó más de `px`. Sin listener de scroll: un centinela invisible al tope
// + IntersectionObserver = cero trabajo por frame.
// Debe llamarse UNA sola vez: cada llamada inyecta su propio centinela en el DOM.
function useScrolled(px) {
  // Estado inicial sembrado con scrollY: si la página monta ya desplazada (restauración de scroll
  // del navegador al recargar), evita pintar fusionada un frame y reproducir la partición entera.
  const [scrolled, setScrolled] = React.useState(() => window.scrollY > px);
  React.useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:" + px + "px;pointer-events:none;";
    document.body.appendChild(sentinel);
    const io = new IntersectionObserver(([entry]) => setScrolled(!entry.isIntersecting), { threshold: 0 });
    io.observe(sentinel);
    return () => { io.disconnect(); sentinel.remove(); };
  }, [px]);
  return scrolled;
}

// El logro cae como una gota desde arriba y se evapora al irse. usePhase retiene el contenido
// durante los 160ms de salida, igual que la banda de feedback.
function AchievementToast({ achievement, onDone }) {
  const { shown, phase } = usePhase(achievement, 160);
  const timer = React.useRef(null);

  React.useEffect(() => {
    if (!achievement) return;
    if (window.FX) FX.sound.play("achievement");
    clearTimeout(timer.current);
    timer.current = setTimeout(onDone, 2600);
    return () => clearTimeout(timer.current);
  }, [achievement]);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  if (!shown) return null;
  return (
    <div role="status" className={"lg-ach " + (phase === "out" ? "anim-evaporate" : "anim-drop-in")}
      style={{ pointerEvents: "none" }}>
      <span aria-hidden className="lg-ach__glass"></span>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Orb size={40} mood="celebrate" />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--accent-violet)" }}>Logro desbloqueado</div>
          <div style={{ margin: "3px 0 2px", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>{shown.name}</div>
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{shown.description}</div>
        </div>
      </div>
    </div>
  );
}

// Envuelve una tarjeta para que sienta el cursor (brillo + tilt). La clase .lg-tilt va en
// ESTE div propio porque los componentes del DS no reenvian className. Liquid.pointer se
// auto-gatea (reduced motion / tactil): en esos casos el div queda inerte, sin coste.
function TiltCard({ accent, tilt, children }) {
  const ref = React.useRef(null);
  React.useEffect(() => Liquid.pointer(ref.current, { tilt: tilt == null ? 5 : tilt }), []);
  return React.createElement(
    "div",
    { ref: ref, className: "lg-tilt", "data-accent": accent || null },
    children
  );
}

Object.assign(window, { KIcon, ICONS, NavBar, NavTabs, PageFrame, LoadingPanel, ErrorPanel, SoundToggle, usePhase, useScrolled, AchievementToast, TiltCard });

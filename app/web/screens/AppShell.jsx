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
  return <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))" }}></span>;
}

function NavBar({ onHome, tab, setTab, user }) {
  const { Tabs, IconButton, Badge } = KIT;
  const split = useScrolled(32);
  const [hasSplit, setHasSplit] = React.useState(false);
  React.useEffect(() => { if (split) setHasSplit(true); }, [split]);
  const cls = "lg-nav" + (split ? " lg-nav--split" : hasSplit ? " lg-nav--merged" : "");
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
        <Tabs size="sm" value={tab} onChange={setTab} style={{ width: 380 }} items={[
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
        <div style={{ width: 36, height: 36, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #6FA0E0, #4E86D6)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 14px rgba(94,151,230,0.35)", fontSize: 13, fontWeight: 700, color: "var(--text-on-accent)" }}>{user.initials}</div>
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
function useScrolled(px) {
  const [scrolled, setScrolled] = React.useState(false);
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

Object.assign(window, { KIcon, ICONS, NavBar, PageFrame, LoadingPanel, ErrorPanel, SoundToggle, usePhase, useScrolled });

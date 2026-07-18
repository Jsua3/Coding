const KITLD = window.CodingDesignSystem_2ecb3a;

// Colores de materia: la paleta compartida del proyecto (la misma de FX.burst).
const LANDING_TONES = { blue: "#5E97E6", cyan: "#52C9B8", violet: "#9289E3", amber: "#E6AF6B" };

// Catálogo estático: espejo del seed (esto es marketing, no datos vivos — GET /courses exige
// token). Se actualiza a mano en cada iteración de contenido, como los logros de catálogo.
const LANDING_COURSES = [
  { id: "bd1", subject: "Bases de datos I", title: "Modelo relacional", tone: "cyan",
    description: "Domina tablas, claves, consultas SQL y normalización — la base de todo sistema de información." },
  { id: "bd2", subject: "Bases de datos II", title: "Transacciones y triggers", tone: "cyan",
    description: "Transacciones seguras, triggers, procedimientos y rendimiento — bases de datos en producción.",
    lock: "Se abre al terminar Bases de datos I" },
  { id: "prog1", subject: "Programación I", title: "Fundamentos y control de flujo", tone: "blue",
    description: "Tus primeros programas en Java: variables, condicionales, bucles y funciones." },
  { id: "prog2", subject: "Programación II", title: "Herencia y polimorfismo", tone: "blue",
    description: "Programación orientada a objetos en Java: clases, herencia, polimorfismo y colecciones." },
  { id: "algo", subject: "Algoritmos", title: "Recursión y complejidad", tone: "violet",
    description: "Piensa como computador: análisis de complejidad, recursión y los algoritmos clásicos." },
  { id: "web", subject: "Desarrollo web", title: "HTML, CSS y JavaScript", tone: "amber",
    description: "Construye para el navegador: estructura con HTML, estilo con CSS y comportamiento con JavaScript." },
  { id: "reqsw", subject: "Ingeniería de software", title: "Ingeniería de requisitos", tone: "violet",
    description: "Aprende a descubrir, escribir y cuidar lo que el software debe hacer — antes de escribir una línea de código." },
  { id: "uml", subject: "Ingeniería de software", title: "Modelado con UML", tone: "violet",
    description: "Dibuja lo que el software es y lo que hace: los nueve diagramas que convierten requisitos en diseño.",
    lock: "Se abre al terminar Ingeniería de requisitos" },
];

const SCROLLY_STEPS = [
  { k: "Teoría", copy: "La teoría, en bloques cortos y con el código delante." },
  { k: "Ejercicio", copy: "Cada lección se practica al momento, sin salir de ella." },
  { k: "Feedback", copy: "Sabes al instante si acertaste — y por qué." },
  { k: "Celebración", copy: "Cada lección suma XP. Cada día seguido, racha." },
];

// Progreso de scroll dentro del track → etapa discreta 0..count-1. Listener directo (sin
// rAF, a propósito: la cuenta es una resta y un clamp por evento, y así queda verificable
// en el panel del tooling, donde rAF jamás procesa). Reversible: la etapa es función del
// scroll, no una animación de una vía.
function useScrollStage(trackRef, count) {
  const [stage, setStage] = React.useState(0);
  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    let top = 0, span = 1;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      top = rect.top + window.scrollY; // rect.top es relativo al viewport
      span = Math.max(1, el.offsetHeight - window.innerHeight);
    };
    const onScroll = () => {
      const p = Math.min(1, Math.max(0, (window.scrollY - top) / span));
      setStage(Math.min(count - 1, Math.floor(p * count)));
    };
    const onResize = () => { measure(); onScroll(); };
    measure();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [count]);
  return stage;
}

// La maqueta: una lección de mentira que imita el lenguaje real (melt entre etapas, banda
// que cae, celebración) con piezas propias — NO reutiliza LessonScreen. usePhase da el melt:
// la etapa vieja se funde (anim-melt-out, 160ms) y la nueva emerge (anim-melt-in).
function LessonMock({ stage }) {
  const { GlassPanel } = KITLD;
  const { shown, phase } = usePhase(stage, 160);
  const opciones = [
    "Que la tabla tenga índices",
    "Que cada fila sea única e identificable",
    "Que las consultas corran más rápido",
    "Que no haga falta normalizar",
  ];

  let cuerpo;
  if (shown === 0) {
    cuerpo = (
      <React.Fragment>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: LANDING_TONES.cyan }}>Bases de datos I · Lección 2</div>
        <div style={{ margin: "8px 0 10px", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>La clave primaria</div>
        <p style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
          Toda tabla necesita una columna que identifique cada fila sin ambigüedad. En la biblioteca, el ISBN identifica cada libro.
        </p>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--accent-cyan)", background: "rgba(3,6,16,0.45)", border: "1px solid var(--glass-stroke)", borderRadius: "var(--radius-sm)", padding: "10px 12px", whiteSpace: "pre", overflowX: "auto" }}>
          {"SELECT titulo FROM libros\nWHERE isbn = '978-84-376-0494-7';"}
        </div>
      </React.Fragment>
    );
  } else if (shown === 3) {
    cuerpo = (
      <div style={{ textAlign: "center", padding: "18px 0 8px" }}>
        <div style={{ display: "flex", justifyContent: "center" }}><Orb size={54} mood="celebrate" /></div>
        <div className="anim-pop" style={{ margin: "14px 0 4px", fontSize: 34, fontWeight: "var(--weight-heavy)", fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>+50 XP</div>
        <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>Lección completada — tu racha sigue viva</div>
      </div>
    );
  } else {
    cuerpo = (
      <React.Fragment>
        <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: LANDING_TONES.cyan }}>Ejercicio 1 de 2</div>
        <div style={{ margin: "8px 0 12px", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>¿Qué garantiza una clave primaria?</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {opciones.map((o, i) => {
            const marcada = i === 1;
            return (
              <div key={i} style={{ padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid " + (marcada ? "rgba(82,201,184,0.55)" : "var(--glass-stroke)"), background: marcada ? "rgba(82,201,184,0.10)" : "var(--glass-bg-subtle)", fontSize: "var(--text-sm)", color: marcada ? "var(--text-primary)" : "var(--text-secondary)" }}>
                {o}
              </div>
            );
          })}
        </div>
        {shown === 2 ? (
          <div className="anim-drop-in" style={{ marginTop: 12, padding: "10px 12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(82,201,184,0.55)", background: "rgba(82,201,184,0.14)" }}>
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: LANDING_TONES.cyan }}>Correcto</div>
            <div style={{ marginTop: 2, fontSize: "var(--text-xs)", color: "var(--text-secondary)" }}>Cada fila queda identificada de forma única — nadie puede duplicar un ISBN.</div>
          </div>
        ) : null}
      </React.Fragment>
    );
  }

  return (
    <div className={phase === "out" ? "anim-melt-out" : "anim-melt-in"} style={{ width: 400 }}>
      <GlassPanel strength="strong" padding="var(--space-6)" radius="var(--radius-lg)">
        {cuerpo}
      </GlassPanel>
    </div>
  );
}

// Acto 2 — el scrollytelling: la escena queda fijada mientras el copy y la maqueta avanzan
// con tu scroll por las 4 etapas del loop de aprender.
function ScrollyAct() {
  const trackRef = React.useRef(null);
  const stage = useScrollStage(trackRef, 4);
  return (
    <section ref={trackRef} className="lg-scrolly">
      <div className="lg-scrolly__stage">
        <div style={{ display: "flex", alignItems: "center", gap: 56, maxWidth: 1000, padding: "0 32px" }}>
          <div style={{ flex: "0 0 320px", textAlign: "left" }}>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Cómo funciona</div>
            <h2 style={{ margin: "10px 0 22px", fontSize: 30, lineHeight: 1.2, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Una lección se siente así</h2>
            {SCROLLY_STEPS.map((s, i) => (
              <div key={s.k} style={{ marginBottom: 14, opacity: i === stage ? 1 : 0.38, transform: i === stage ? "none" : "translateY(2px)", transition: "opacity 320ms var(--ease-glass), transform 320ms var(--ease-glass)" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: i === stage ? LANDING_TONES.cyan : "var(--text-secondary)" }}>{i + 1} · {s.k}</div>
                <div style={{ marginTop: 2, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{s.copy}</div>
              </div>
            ))}
          </div>
          <LessonMock stage={stage} />
        </div>
      </div>
    </section>
  );
}

// Reduced motion: sin pinned — las cuatro etapas apiladas como tarjetas estáticas, todo
// visible, cero animación (gate JS; el cinturón CSS ya cubre las clases de coreografía).
function ScrollyStatic() {
  const { GlassPanel } = KITLD;
  return (
    <section style={{ maxWidth: 760, margin: "0 auto", padding: "96px 32px 0" }}>
      <h2 style={{ margin: "0 0 22px", fontSize: 30, textAlign: "center", fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Una lección se siente así</h2>
      {SCROLLY_STEPS.map((s, i) => (
        <div key={s.k} style={{ marginBottom: 14 }}>
          <GlassPanel padding="var(--space-5)">
            <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: LANDING_TONES.cyan }}>{i + 1} · {s.k}</div>
            <div style={{ marginTop: 4, fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{s.copy}</div>
          </GlassPanel>
        </div>
      ))}
    </section>
  );
}

// Acto 1 — el hero sobre el video: logo, titular y los dos CTAs de la puerta.
function HeroAct({ onStart, onLogin }) {
  const { Button } = KITLD;
  return (
    <section className="lg-hero">
      <div className="anim-condense">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
          Coding<span className="lg-caret" style={{ display: "inline-block", width: 7, height: 48, marginLeft: 12, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 18px var(--accent-cyan)" }}></span>
        </div>
      </div>
      <div className="anim-condense anim-condense--delayed" style={{ maxWidth: 640 }}>
        <h1 style={{ margin: "26px 0 0", fontSize: 40, lineHeight: 1.15, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
          Aprende Ingeniería de Software como si fuera un juego
        </h1>
        <p style={{ margin: "16px 0 0", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>
          Lecciones cortas, ejercicios interactivos y una racha que no vas a querer romper.
        </p>
      </div>
      <div className="anim-condense anim-condense--delayed" style={{ display: "flex", gap: 14, marginTop: 34 }}>
        <Button size="lg" onClick={onStart}>Empieza a programar</Button>
        <Button size="lg" variant="secondary" onClick={onLogin}>Ya tengo cuenta</Button>
      </div>
      <div aria-hidden className="lg-hero__hint">
        <span>Desliza para ver más</span>
        <KIcon d="M4 6l4 4 4-4" size={22} />
      </div>
    </section>
  );
}

// Acto 3 — el catálogo: 8 tarjetas con su tono real, condensación en cascada y cursor-luz.
function CatalogAct() {
  const { GlassPanel } = KITLD;
  return (
    <section style={{ maxWidth: 1160, margin: "0 auto", padding: "96px 32px 40px" }}>
      <div className="lg-reveal" style={{ textAlign: "center", marginBottom: 40 }}>
        <h2 style={{ margin: 0, fontSize: 30, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
          Todo el plan, una lección a la vez
        </h2>
        <p style={{ margin: "10px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
          Ocho cursos que se desbloquean a tu ritmo.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {LANDING_COURSES.map((c) => (
          <div key={c.id} className="lg-reveal">
            <TiltCard accent={c.tone}>
              {/* content-box del DS: height 100% + padding necesita border-box por style. */}
              <GlassPanel padding="var(--space-5)" style={{ height: "100%", boxSizing: "border-box" }}>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: LANDING_TONES[c.tone] }}>{c.subject}</div>
                <div style={{ margin: "6px 0 4px", fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>{c.title}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{c.description}</div>
                {c.lock ? (
                  <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
                    <KIcon d={ICONS.lock} size={12} />
                    {c.lock}
                  </div>
                ) : null}
              </GlassPanel>
            </TiltCard>
          </div>
        ))}
      </div>
    </section>
  );
}

// Acto 4 — el cierre: remate corto con el mismo CTA del hero. Pie mínimo, sin enlaces falsos.
function CierreAct({ onStart }) {
  const { Button } = KITLD;
  return (
    <section style={{ maxWidth: 1160, margin: "0 auto", padding: "56px 32px 96px", textAlign: "center" }}>
      <div className="lg-reveal">
        <h2 style={{ margin: 0, fontSize: 30, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
          Tu primera lección te espera
        </h2>
        <div style={{ marginTop: 24 }}>
          <Button size="lg" onClick={onStart}>Empieza a programar</Button>
        </div>
        <p style={{ margin: "48px 0 0", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
          Coding — un proyecto de aprendizaje personal
        </p>
      </div>
    </section>
  );
}

function LandingScreen({ onStart, onLogin }) {
  const rootRef = React.useRef(null);
  React.useEffect(() => Liquid.reveal(rootRef.current), []);
  return (
    <div ref={rootRef}>
      <HeroAct onStart={onStart} onLogin={onLogin} />
      {window.FX && FX.reducedMotion ? <ScrollyStatic /> : <ScrollyAct />}
      <CatalogAct />
      <CierreAct onStart={onStart} />
    </div>
  );
}

Object.assign(window, { LandingScreen });

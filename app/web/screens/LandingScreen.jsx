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

// Acto 1 — el hero sobre el video: logo, titular y los dos CTAs de la puerta.
function HeroAct({ onStart, onLogin }) {
  const { Button } = KITLD;
  return (
    <section className="lg-hero">
      <div className="anim-condense">
        <div style={{ fontFamily: "var(--font-display)", fontSize: 64, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
          Coding<span style={{ display: "inline-block", width: 7, height: 48, marginLeft: 12, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 18px var(--accent-cyan)" }}></span>
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
      <span aria-hidden className="lg-hero__hint"><KIcon d="M4 6l4 4 4-4" size={22} /></span>
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
      {/* Acto 2 (cómo funciona, scrollytelling) llega en la siguiente tarea. */}
      <CatalogAct />
      <CierreAct onStart={onStart} />
    </div>
  );
}

Object.assign(window, { LandingScreen });

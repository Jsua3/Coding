const KITP = window.CodingDesignSystem_2ecb3a;

function Heatmap({ cells }) {
  // 0 lecciones -> apagado; 1, 2, 3+ -> tres intensidades de cian.
  const nivel = (n) => (n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3);
  return (
    <div className="lg-heat">
      {cells.map((c) => (
        <span key={c.day} className={"lg-heat__cell lg-heat__cell--" + nivel(c.lessons)}
          title={c.lessons + (c.lessons === 1 ? " lección" : " lecciones") + " · " + c.xp + " XP · " + c.day}></span>
      ))}
    </div>
  );
}

function SemanaXp({ dias }) {
  const max = Math.max(1, ...dias.map((d) => d.xp)); // nunca dividimos por cero
  const nombre = (day) => {
    const [y, m, d] = day.split("-").map(Number);
    return ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][new Date(y, m - 1, d).getDay()];
  };
  return (
    <div>
      <div className="lg-bars">
        {dias.map((d) => (
          <div key={d.day} className="lg-bars__col">
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{d.xp || ""}</span>
            <div className="lg-bars__bar" style={{ height: Math.round((d.xp / max) * 100) + "%" }}></div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        {dias.map((d) => (
          <div key={d.day} style={{ flex: 1, textAlign: "center", fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{nombre(d.day)}</div>
        ))}
      </div>
    </div>
  );
}

function LogroCard({ a }) {
  const { GlassPanel, Progress, Badge } = KITP;
  // boxSizing: el GlassPanel es content-box, y height:100% + padding desbordaría la celda de la grilla 42px (la fila de abajo lo pisaba).
  return (
    <GlassPanel padding="var(--space-5)" strength={a.unlocked ? "strong" : "subtle"} style={{ opacity: a.unlocked ? 1 : 0.62, height: "100%", boxSizing: "border-box" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <div style={{ flex: 1, fontSize: "var(--text-md)", fontWeight: 700, color: a.unlocked ? "var(--text-primary)" : "var(--text-secondary)" }}>{a.name}</div>
        {a.unlocked ? <Badge tone="success">Conseguido</Badge> : a.secret ? <Badge tone="neutral">Secreto</Badge> : null}
      </div>
      <p style={{ margin: "0 0 12px", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{a.description}</p>
      {!a.unlocked && !a.secret ? (
        <React.Fragment>
          <Progress value={Math.round((a.current / a.target) * 100)} tone="cyan" />
          <div style={{ marginTop: 5, fontSize: "var(--text-xs)", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{a.current} de {a.target}</div>
        </React.Fragment>
      ) : null}
    </GlassPanel>
  );
}

function ProgressScreen({ me, tab, setTab }) {
  const { GlassPanel, Progress } = KITP;
  const [data, setData] = React.useState(null);
  const [error, setError] = React.useState(null);
  const rootRef = React.useRef(null);

  const load = () => {
    setError(null);
    API.get("/progress").then(setData).catch((e) => setError(e.message));
  };
  React.useEffect(load, []);
  React.useEffect(() => Liquid.reveal(rootRef.current), [data]);

  const wrap = (children) => children; // App pone el marco (PageFrame + NavBar)

  if (error) return wrap(<div style={{ marginTop: 36 }}><ErrorPanel message={error} onRetry={load} /></div>);
  if (!data) return wrap(<LoadingPanel />);

  const lvl = data.level;

  return wrap(
    <div ref={rootRef}>
      <h1 style={{ margin: "44px 4px 24px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Tu progreso</h1>

      <div className="lg-reveal">
        <GlassPanel tint="violet" padding="var(--space-7)" radius="var(--radius-xl)" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Nivel {lvl.n}</div>
              <div style={{ margin: "6px 0 8px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--text-primary)" }}>{lvl.name}</div>
              <p style={{ margin: 0, fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>
                {lvl.next
                  ? <React.Fragment>Te faltan <strong style={{ color: "var(--text-primary)" }}>{lvl.xpToNext} XP</strong> para {lvl.next.name}</React.Fragment>
                  : "Has llegado al último nivel. Nada mal."}
              </p>
              <div style={{ marginTop: 14, maxWidth: 420 }}><Progress value={lvl.progress} tone="violet" showLabel /></div>
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 800, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums" }}>
              {lvl.xp.toLocaleString("es")} <span style={{ fontSize: "var(--text-md)", color: "var(--text-tertiary)" }}>XP</span>
            </div>
          </div>
        </GlassPanel>
      </div>

      <div className="lg-reveal">
        <GlassPanel padding="var(--space-6)" style={{ marginBottom: 20 }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Tu último año</div>
          <Heatmap cells={data.heatmap} />
        </GlassPanel>
      </div>

      <div className="lg-reveal">
        <GlassPanel padding="var(--space-6)" style={{ marginBottom: 28 }}>
          <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 18 }}>Esta semana</div>
          <SemanaXp dias={data.weekXp} />
        </GlassPanel>
      </div>

      <h2 style={{ margin: "0 4px 16px", fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>
        Logros · {data.achievements.filter((a) => a.unlocked).length} de {data.achievements.length}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {data.achievements.map((a) => (
          <div key={a.id} className="lg-reveal"><LogroCard a={a} /></div>
        ))}
      </div>
    </div>
  );
}
Object.assign(window, { ProgressScreen });

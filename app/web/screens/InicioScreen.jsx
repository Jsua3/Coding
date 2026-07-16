const KITI = window.CodingDesignSystem_2ecb3a;

function MetaDiaria({ xpToday, dailyGoal }) {
  const { GlassPanel, Progress } = KITI;
  const pct = dailyGoal > 0 ? Math.min(100, Math.round((xpToday / dailyGoal) * 100)) : 0;
  const cumplida = xpToday >= dailyGoal;
  const ref = React.useRef(null);
  React.useEffect(() => { FX.countUp(ref.current, 0, xpToday, 640); }, [xpToday]);
  return (
    <GlassPanel tint="cyan" padding="var(--space-5)" style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <Progress value={pct} shape="ring" tone="cyan" size="lg" showLabel />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>Meta diaria</div>
          <div style={{ margin: "4px 0 2px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
            <span ref={ref}>0</span> / {dailyGoal} XP
          </div>
          <div style={{ fontSize: "var(--text-sm)", color: cumplida ? "var(--accent-cyan)" : "var(--text-secondary)" }}>
            {cumplida ? "¡Meta cumplida! Sigue así." : "XP ganado hoy. Ajústala en tu perfil."}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}

function StatPanel({ label, value, sub, tone }) {
  const { GlassPanel } = KITI;
  return (
    <GlassPanel tint={tone} padding="var(--space-5)">
      <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>
    </GlassPanel>
  );
}

// Los 3 logros bloqueados más cerca de caer. El enfoque derivado no guarda fechas de desbloqueo,
// así que "tus últimos logros" no existe — y esto motiva más: lo que te hace volver mañana es lo
// que casi tienes, no lo que ya ganaste.
function CercaDeCaer({ achievements }) {
  const { GlassPanel, Progress } = KITI;
  if (!achievements) return null;
  const cerca = achievements
    .filter((a) => !a.unlocked && !a.secret && a.target > 0)
    .sort((x, y) => y.current / y.target - x.current / x.target)
    .slice(0, 3);
  const ganados = achievements.filter((a) => a.unlocked).length;
  if (!cerca.length) return null;
  return (
    <div className="lg-reveal">
      <TiltCard>
        <GlassPanel padding="var(--space-5)" style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Estás cerca de…</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{ganados} de {achievements.length} logros</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cerca.map((a) => (
              <div key={a.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: 5 }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{a.name}</span>
                  <span style={{ color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{a.current} de {a.target}</span>
                </div>
                <Progress value={Math.round((a.current / a.target) * 100)} tone="cyan" />
              </div>
            ))}
          </div>
        </GlassPanel>
      </TiltCard>
    </div>
  );
}

function InicioScreen({ me, onOpenLesson, onOpenReview, tab, setTab }) {
  const { Button } = KITI;
  const [progress, setProgress] = React.useState(null);
  const rootRef = React.useRef(null);

  React.useEffect(() => {
    API.get("/progress").then(setProgress).catch(() => setProgress(null)); // si falla, Inicio sigue usable
  }, []);
  React.useEffect(() => Liquid.reveal(rootRef.current), [progress, me.stats.reviewCount]);

  const stats = me.stats;
  const cont = me.continue;
  const lvl = stats.level;

  return (
    <PageFrame>
      <NavBar onHome={() => setTab("inicio")} tab={tab} setTab={setTab} user={{ ...me.user, streak: stats.streak }} />
      <div ref={rootRef}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, margin: "44px 4px 24px" }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
              Hola, {me.user.name.split(" ")[0]}
            </h1>
            <p style={{ margin: "6px 0 0", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>
              {cont
                ? <React.Fragment>Continúa donde quedaste: <strong style={{ color: "var(--text-primary)" }}>{cont.lessonTitle}</strong></React.Fragment>
                : "¡Completaste todas tus materias!"}
            </p>
          </div>
          {cont ? (
            <Button size="lg" iconLeft={<KIcon d={ICONS.play} />} onClick={() => onOpenLesson(cont.courseId, cont.lessonId)}>
              Continuar lección
            </Button>
          ) : null}
        </div>

        <div className="lg-reveal">
          <TiltCard accent="cyan">
            <MetaDiaria xpToday={stats.xpToday} dailyGoal={stats.dailyGoal} />
          </TiltCard>
        </div>

        {progress && progress.streak && progress.streak.repairable ? (
          <div className="lg-reveal">
            <KITI.GlassPanel padding="var(--space-5)" style={{ marginBottom: 28, border: "1px solid rgba(230,175,107,0.45)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <span aria-hidden style={{ fontSize: 28 }}><KIcon d={ICONS.flame} size={26} /></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Tu racha se rompió</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                    Recupérala por {progress.streak.repairable.totalCost} XP antes de que sea tarde.
                  </div>
                </div>
                <Button variant="secondary" onClick={() => setTab("perfil")}>Ir a proteger</Button>
              </div>
            </KITI.GlassPanel>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
          <div className="lg-reveal">
            <TiltCard accent="violet">
              <StatPanel label="Nivel" value={lvl ? lvl.n + " · " + lvl.name : "—"} sub={lvl ? lvl.progress + "% hacia el siguiente" : ""} tone="violet" />
            </TiltCard>
          </div>
          <div className="lg-reveal">
            <TiltCard>
              <StatPanel label="Racha" value={stats.streak + (stats.streak === 1 ? " día" : " días")} sub={"Tu mejor racha: " + stats.bestStreak + (stats.bestStreak === 1 ? " día" : " días")} tone="none" />
            </TiltCard>
          </div>
          <div className="lg-reveal">
            <TiltCard accent="blue">
              <StatPanel label="XP total" value={stats.xp.toLocaleString("es")} sub={"+" + stats.xpWeek + " esta semana"} tone="blue" />
            </TiltCard>
          </div>
        </div>

        {me.stats.reviewCount > 0 ? (
          <div className="lg-reveal">
            <KITI.GlassPanel tint="none" padding="var(--space-5)" style={{ marginBottom: 28, border: "1px solid rgba(230,175,107,0.35)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                <Orb size={44} mood="idle" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Repaso pendiente</div>
                  <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{me.stats.reviewCount} {me.stats.reviewCount === 1 ? "ejercicio" : "ejercicios"} por repasar · +5 XP cada uno</div>
                </div>
                <KITI.Button variant="secondary" onClick={onOpenReview}>Repasar ahora</KITI.Button>
              </div>
            </KITI.GlassPanel>
          </div>
        ) : null}

        <CercaDeCaer achievements={progress ? progress.achievements : null} />
      </div>
    </PageFrame>
  );
}
Object.assign(window, { InicioScreen });

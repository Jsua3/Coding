const KITR = window.CodingDesignSystem_2ecb3a;

function ReviewScreen({ me, tab, setTab, onBack, refreshMe }) {
  const { GlassPanel, Badge, Button } = KITR;
  const [queue, setQueue] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [i, setI] = React.useState(0);
  const [value, setValue] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [earned, setEarned] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [orbMood, setOrbMood] = React.useState("idle");
  const orbTimer = React.useRef(null);
  const xpRef = React.useRef(null);
  const { shown: shownI, phase: iPhase } = usePhase(i, 160);

  React.useEffect(() => () => clearTimeout(orbTimer.current), []);

  const orbReact = (mood, ms) => {
    setOrbMood(mood);
    clearTimeout(orbTimer.current);
    orbTimer.current = setTimeout(() => setOrbMood("idle"), ms);
  };

  const load = () => {
    setQueue(null); setError(null); setI(0); setValue(null); setResult(null); setEarned(0); setDone(false); setOrbMood("idle");
    API.get("/review").then((r) => setQueue(r.exercises)).catch((e) => setError(e.message));
  };
  React.useEffect(load, []);
  React.useEffect(() => { setValue(null); setResult(null); }, [shownI]);

  React.useEffect(() => {
    if (done) {
      FX.sound.play("complete");
      FX.countUp(xpRef.current, 0, earned, 800);
      refreshMe();
    }
  }, [done]);

  const wrap = (children) => (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      {children}
    </PageFrame>
  );

  if (error) return wrap(<div style={{ marginTop: 36 }}><ErrorPanel message={error} onRetry={load} /></div>);
  if (!queue) return wrap(<LoadingPanel />);
  if (queue.length === 0 && !done) return wrap(
    <GlassPanel padding="var(--space-7)" style={{ maxWidth: 520, margin: "48px auto", textAlign: "center" }}>
      <p style={{ margin: "0 0 16px", color: "var(--text-secondary)" }}>No tienes ejercicios por repasar. ¡Sigue así!</p>
      <Button onClick={onBack}>Volver al inicio</Button>
    </GlassPanel>
  );

  if (done) {
    return wrap(
      <div style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="anim-condense anim-condense--delayed">
          <GlassPanel strength="strong" padding="var(--space-8)" radius="var(--radius-xl)" style={{ width: 420, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Orb size={96} mood="celebrate" /></div>
            <h1 style={{ margin: "0 0 8px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)" }}>Repaso terminado</h1>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 36, fontWeight: 800, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums", marginBottom: 20 }}>
              +<span ref={xpRef}>0</span> XP de repaso
            </div>
            <Button onClick={onBack}>Volver al inicio</Button>
          </GlassPanel>
        </div>
      </div>
    );
  }

  const ex = queue[shownI];
  const meltClass = iPhase === "out" ? "anim-melt-out" : "anim-melt-in";

  const check = async () => {
    setSending(true);
    try {
      const r = await API.post("/exercises/" + ex.id + "/answer", { response: value, context: "review" });
      setResult(r);
      if (r.correct) { orbReact("happy", 700); FX.sound.play("correct"); } else { orbReact("sad", 900); FX.sound.play("wrong"); }
      if (r.reviewCleared) setEarned((e) => e + r.xpAwarded);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const continueNext = (e) => {
    if (iPhase === "out") return;
    if (i + 1 < queue.length) {
      setI(i + 1);
      return;
    }
    let x = e ? e.clientX : 0;
    let y = e ? e.clientY : 0;
    if (!x && !y && e && e.currentTarget && e.currentTarget.getBoundingClientRect) {
      const r = e.currentTarget.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    if (x || y) FX.bloom(x, y);
    setDone(true);
  };

  return wrap(
    <React.Fragment>
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>Repaso · {shownI + 1} de {queue.length}</span>
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "flex-start", maxWidth: 820, margin: "0 auto" }}>
        <Orb size={56} mood={orbMood} style={{ marginTop: 8 }} />
        <GlassPanel tint="none" padding="var(--space-6)" radius="var(--radius-xl)" style={{ flex: 1 }}>
          <div className={meltClass}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Badge tone="amber" dot>REPASO</Badge>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>{ex.courseSubject} · {ex.lessonTitle}</span>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{ex.prompt}</p>
            <ExerciseBody key={ex.id} exercise={ex} value={value} onChange={setValue} locked={Boolean(result) || sending} />
            <div style={{ marginTop: 20 }}>
              <Button fullWidth disabled={!responseComplete(ex, value) || sending || Boolean(result && result.correct)} onClick={check}>
                {sending ? "Comprobando…" : "Comprobar"}
              </Button>
            </div>
          </div>
        </GlassPanel>
      </div>
      <FeedbackBand result={result} onContinue={continueNext} onRetry={() => setResult(null)} />
    </React.Fragment>
  );
}
Object.assign(window, { ReviewScreen });

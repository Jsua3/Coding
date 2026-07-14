const KITX = window.CodingDesignSystem_2ecb3a;

function CodeBlock({ lines }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, lineHeight: 1.7, background: "rgba(3,6,16,0.55)", border: "1px solid var(--glass-stroke)", borderRadius: "var(--radius-sm)", padding: "14px 18px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      {lines.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l }}></div>)}
    </div>
  );
}

function ContentBlocks({ content }) {
  return (
    <div className="lesson-content">
      {content.map((b, i) => {
        if (b.type === "code") return <div key={i} style={{ margin: "14px 0" }}><CodeBlock lines={b.lines} /></div>;
        if (b.type === "note") return <p key={i} style={{ margin: "14px 0 0", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{b.text}</p>;
        return <p key={i} style={{ margin: "0 0 14px", fontSize: "var(--text-base)", color: "var(--text-secondary)" }} dangerouslySetInnerHTML={{ __html: b.html }} />;
      })}
    </div>
  );
}

function StepBar({ total, current }) {
  return (
    <div style={{ display: "flex", gap: 6, flex: 1, maxWidth: 260 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{ flex: 1, height: 6, borderRadius: 99, background: i < current ? "linear-gradient(90deg, #6FA0E0, #52C9B8)" : "var(--glass-bg-strong)", boxShadow: i < current ? "0 0 8px rgba(82,201,184,0.45)" : "none", transition: "all var(--duration-base) var(--ease-glass)" }}></span>
      ))}
    </div>
  );
}

function FeedbackBand({ result, onContinue, onRetry }) {
  const { Button } = KITX;
  const { shown, phase } = usePhase(result, 160);
  if (!shown) return null;
  const ok = shown.correct;
  return (
    <div className={phase === "out" ? "anim-evaporate" : "anim-drop-in"} style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, pointerEvents: phase === "out" ? "none" : "auto" }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px 24px" }}>
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, background: ok ? "rgba(76,199,147,0.14)" : "rgba(230,121,132,0.13)", border: "1px solid " + (ok ? "rgba(76,199,147,0.45)" : "rgba(230,121,132,0.45)"), boxShadow: "var(--shadow-float)" }}>
          <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(28px) saturate(135%)", backdropFilter: "blur(28px) saturate(135%)" }}></span>
          {phase === "in" ? <span aria-hidden className="fx-bead" style={{ top: -4, left: 26 }}></span> : null}
          <strong style={{ color: ok ? "#4CC793" : "#E67984", fontSize: "var(--text-md)", flexShrink: 0 }}>{ok ? "¡Correcto!" : "No exactamente"}</strong>
          <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>{shown.explanation}</span>
          {ok
            ? <Button onClick={onContinue}>Continuar</Button>
            : <Button variant="secondary" onClick={onRetry}>Intentar de nuevo</Button>}
        </div>
      </div>
    </div>
  );
}

function LessonScreen({ me, courseId, lessonId, onBack, onOpenLesson, tab, setTab, showToast, refreshMe }) {
  const { GlassPanel, Badge, Button, IconButton } = KITX;
  const [lesson, setLesson] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [step, setStep] = React.useState(0); // 0 = teoría; 1..N = ejercicios
  const [value, setValue] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [celebration, setCelebration] = React.useState(null);
  const [orbMood, setOrbMood] = React.useState("idle");
  const [panelAnim, setPanelAnim] = React.useState("");
  const { shown: shownStep, phase: stepPhase } = usePhase(step, 160);
  const orbTimer = React.useRef(null);
  const panelTimer = React.useRef(null);

  React.useEffect(() => () => { clearTimeout(orbTimer.current); clearTimeout(panelTimer.current); }, []);

  const orbReact = (mood, ms) => {
    setOrbMood(mood);
    clearTimeout(orbTimer.current);
    orbTimer.current = setTimeout(() => setOrbMood("idle"), ms);
  };

  const load = () => {
    setLesson(null); setError(null); setStep(0); setValue(null); setResult(null); setCelebration(null); setOrbMood("idle");
    API.get("/lessons/" + lessonId).then(setLesson).catch((e) => setError(e.message));
  };
  React.useEffect(load, [lessonId]);
  // también corre en el montaje: no-op (ambos ya son null)
  React.useEffect(() => { setValue(null); setResult(null); }, [shownStep]);

  if (error) {
    return (
      <PageFrame>
        <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
        <div style={{ marginTop: 36 }}><ErrorPanel message={error} onRetry={load} /></div>
      </PageFrame>
    );
  }
  if (!lesson) {
    return (
      <PageFrame>
        <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
        <LoadingPanel />
      </PageFrame>
    );
  }

  const exercises = lesson.exercises || [];
  const totalSteps = exercises.length + 1;
  const ex = shownStep > 0 ? exercises[shownStep - 1] : null;
  const meltClass = stepPhase === "out" ? "anim-melt-out" : "anim-melt-in";

  const check = async () => {
    setSending(true);
    try {
      const r = await API.post("/exercises/" + ex.id + "/answer", { response: value });
      setResult(r);
      if (r.correct) {
        orbReact("happy", 700);
        FX.sound.play("correct");
        setPanelAnim("anim-pop");
      } else {
        orbReact("sad", 900);
        FX.sound.play("wrong");
        setPanelAnim("anim-shake");
      }
      clearTimeout(panelTimer.current);
      panelTimer.current = setTimeout(() => setPanelAnim(""), 400);
      if (r.xpAwarded > 0) refreshMe();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const continueNext = (e) => {
    if (stepPhase === "out") return;
    if (result.lessonCompleted) {
      let x = e ? e.clientX : 0;
      let y = e ? e.clientY : 0;
      if (!x && !y && e && e.currentTarget && e.currentTarget.getBoundingClientRect) {
        const r = e.currentTarget.getBoundingClientRect();
        x = r.left + r.width / 2;
        y = r.top + r.height / 2;
      }
      if (x || y) FX.bloom(x, y);
      setCelebration({ ...result, lessonTitle: lesson.title, courseSubject: lesson.courseSubject, prevProgress: lesson.courseProgress });
      setResult(null);
      return;
    }
    if (step >= exercises.length) {
      onBack();
      return;
    }
    setStep(step + 1);
  };

  if (celebration) {
    return <CelebrationScreen data={celebration} onNext={celebration.nextLessonId ? () => onOpenLesson(celebration.nextLessonId) : null} onBack={onBack} me={me} tab={tab} setTab={setTab} />;
  }

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
        <IconButton label="Volver" onClick={onBack}><KIcon d={ICONS.back} /></IconButton>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{lesson.courseSubject} / {lesson.unitName.split(" · ")[0]}</span>
        <div style={{ flex: 1 }}></div>
        <StepBar total={totalSteps} current={shownStep + (result && result.correct ? 1 : 0)} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>Lección {lesson.position.index} de {lesson.position.total}</span>
      </div>

      {shownStep === 0 ? (
        <GlassPanel padding="var(--space-7)" radius="var(--radius-xl)" style={{ maxWidth: 760, margin: "0 auto" }}>
          <div className={meltClass}>
            <Badge tone="cyan">LECCIÓN {lesson.position.index}</Badge>
            <h1 style={{ margin: "12px 0 10px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>{lesson.title}</h1>
            <ContentBlocks content={lesson.content} />
            <div style={{ marginTop: 20, textAlign: "right" }}>
              <Button size="lg" onClick={() => setStep(1)} iconLeft={<KIcon d={ICONS.play} />}>Continuar</Button>
            </div>
          </div>
        </GlassPanel>
      ) : (
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start", maxWidth: 820, margin: "0 auto" }}>
          <Orb size={56} mood={orbMood} style={{ marginTop: 8 }} />
          <GlassPanel tint="blue" padding="var(--space-6)" radius="var(--radius-xl)" style={{ flex: 1 }}>
            <div className={meltClass}>
              <div className={panelAnim}>
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>
                  Ejercicio {shownStep} de {exercises.length}
                </div>
                <p style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{ex.prompt}</p>
                <ExerciseBody key={ex.id} exercise={ex} value={value} onChange={setValue} locked={Boolean(result) || sending} />
                <div style={{ marginTop: 20 }}>
                  <Button fullWidth disabled={!responseComplete(ex, value) || sending || Boolean(result && result.correct)} onClick={check}>
                    {sending ? "Comprobando…" : "Comprobar"}
                  </Button>
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      <FeedbackBand result={result} onContinue={continueNext} onRetry={() => { setResult(null); }} />
    </PageFrame>
  );
}
function CelebrationScreen({ data, onNext, onBack, me, tab, setTab }) {
  const { GlassPanel, Button, Progress } = KITX;
  const xpRef = React.useRef(null);
  const [ring, setRing] = React.useState(data.prevProgress);
  const [showPerfect, setShowPerfect] = React.useState(false);
  const [showStreak, setShowStreak] = React.useState(false);

  React.useEffect(() => {
    FX.sound.play("complete");
    FX.countUp(xpRef.current, 0, data.xpAwarded, 900);
    const timers = [];
    if (data.perfectBonus > 0) {
      timers.push(setTimeout(() => { setShowPerfect(true); FX.sound.play("perfect"); }, 1000));
    }
    if (data.streak && data.streak.extended) {
      timers.push(setTimeout(() => { setShowStreak(true); FX.sound.play("streak"); }, 1400));
    }
    let rafId = null;
    timers.push(setTimeout(() => {
      const start = performance.now();
      const dur = 900;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        setRing(Math.round(data.prevProgress + (data.courseProgress - data.prevProgress) * (1 - Math.pow(1 - t, 3))));
        if (t < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, 500));
    return () => { timers.forEach(clearTimeout); if (rafId !== null) cancelAnimationFrame(rafId); };
  }, []);

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      <div style={{ minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="anim-condense anim-condense--delayed">
          <GlassPanel strength="strong" padding="var(--space-8)" radius="var(--radius-xl)" style={{ width: 460, textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}>
              <Orb size={120} mood="celebrate" />
            </div>
            <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>¡Lección completada!</h1>
            <p style={{ margin: "0 0 22px", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>{data.lessonTitle}</p>

            <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 800, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums" }}>
              +<span ref={xpRef}>0</span> XP
            </div>
            {showPerfect ? (
              <div className="anim-pop" style={{ marginTop: 6, fontSize: "var(--text-md)", fontWeight: 700, color: "var(--accent-amber)" }}>Perfecto +{data.perfectBonus}</div>
            ) : null}
            {showStreak ? (
              <div className="anim-pop" style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, color: "var(--accent-amber)", fontSize: "var(--text-md)", fontWeight: 600 }}>
                <span className="anim-pulse-glow" style={{ display: "inline-flex" }}><KIcon d={ICONS.flame} size={18} /></span>
                Racha: {data.streak.value} {data.streak.value === 1 ? "día" : "días"}
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "center", margin: "24px 0 26px" }}>
              <Progress value={ring} shape="ring" tone="cyan" size="lg" showLabel />
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <Button variant="secondary" onClick={onBack}>Volver al temario</Button>
              {onNext ? <Button size="lg" iconLeft={<KIcon d={ICONS.play} />} onClick={onNext}>Siguiente lección</Button> : null}
            </div>
          </GlassPanel>
        </div>
      </div>
    </PageFrame>
  );
}
Object.assign(window, { LessonScreen, CelebrationScreen, FeedbackBand });

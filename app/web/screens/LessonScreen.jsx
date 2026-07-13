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
  if (!result) return null;
  const ok = result.correct;
  return (
    <div className="anim-rise" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60 }}>
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 32px 24px" }}>
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", padding: "16px 22px", display: "flex", alignItems: "center", gap: 16, background: ok ? "rgba(76,199,147,0.14)" : "rgba(230,121,132,0.13)", border: "1px solid " + (ok ? "rgba(76,199,147,0.45)" : "rgba(230,121,132,0.45)"), boxShadow: "var(--shadow-float)" }}>
          <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(28px) saturate(135%)", backdropFilter: "blur(28px) saturate(135%)" }}></span>
          <strong style={{ color: ok ? "#4CC793" : "#E67984", fontSize: "var(--text-md)", flexShrink: 0 }}>{ok ? "¡Correcto!" : "No exactamente"}</strong>
          <span style={{ flex: 1, color: "var(--text-secondary)", fontSize: "var(--text-base)" }}>{result.explanation}</span>
          {ok
            ? <Button onClick={onContinue}>Continuar</Button>
            : <Button variant="secondary" onClick={onRetry}>Intentar de nuevo</Button>}
        </div>
      </div>
    </div>
  );
}

function LessonScreen({ me, courseId, lessonId, onBack, onOpenLesson, tab, setTab, showToast, refreshMe }) {
  const { GlassPanel, Badge, Button, IconButton, Progress } = KITX;
  const [lesson, setLesson] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [step, setStep] = React.useState(0); // 0 = teoría; 1..N = ejercicios
  const [value, setValue] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [sending, setSending] = React.useState(false);
  const [celebration, setCelebration] = React.useState(null);
  const [orbMood, setOrbMood] = React.useState("idle");
  const [panelAnim, setPanelAnim] = React.useState("");
  const orbTimer = React.useRef(null);

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
  const ex = step > 0 ? exercises[step - 1] : null;

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
      setTimeout(() => setPanelAnim(""), 400);
      if (r.xpAwarded > 0) refreshMe();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const continueNext = () => {
    if (result.lessonCompleted) {
      setCelebration({ ...result, lessonTitle: lesson.title, courseSubject: lesson.courseSubject, prevProgress: lesson.courseProgress });
      setResult(null);
      // Task 13 renderiza la celebración; puente provisional:
      if (!window.CelebrationScreen) {
        showToast({ tone: "success", title: "Lección completada", description: "+" + (result.xpAwarded + result.perfectBonus) + " XP en " + lesson.courseSubject });
        onBack();
      }
      return;
    }
    setStep(step + 1);
    setValue(null);
    setResult(null);
  };

  if (celebration && window.CelebrationScreen) {
    return <CelebrationScreen data={celebration} onNext={celebration.nextLessonId ? () => onOpenLesson(celebration.nextLessonId) : null} onBack={onBack} me={me} tab={tab} setTab={setTab} />;
  }

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
        <IconButton label="Volver" onClick={onBack}><KIcon d={ICONS.back} /></IconButton>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>{lesson.courseSubject} / {lesson.unitName.split(" · ")[0]}</span>
        <div style={{ flex: 1 }}></div>
        <StepBar total={totalSteps} current={step + (result && result.correct ? 1 : 0)} />
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", whiteSpace: "nowrap" }}>Lección {lesson.position.index} de {lesson.position.total}</span>
      </div>

      {step === 0 ? (
        <GlassPanel padding="var(--space-7)" radius="var(--radius-xl)" style={{ maxWidth: 760, margin: "0 auto" }}>
          <Badge tone="cyan">LECCIÓN {lesson.position.index}</Badge>
          <h1 style={{ margin: "12px 0 10px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>{lesson.title}</h1>
          <ContentBlocks content={lesson.content} />
          <div style={{ marginTop: 20, textAlign: "right" }}>
            <Button size="lg" onClick={() => setStep(1)} iconLeft={<KIcon d={ICONS.play} />}>Continuar</Button>
          </div>
        </GlassPanel>
      ) : (
        <div style={{ display: "flex", gap: 18, alignItems: "flex-start", maxWidth: 820, margin: "0 auto" }}>
          <Orb size={56} mood={orbMood} style={{ marginTop: 8 }} />
          <GlassPanel tint="blue" padding="var(--space-6)" radius="var(--radius-xl)" style={{ flex: 1 }} className={panelAnim}>
            <div className={panelAnim}>
              <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>
                Ejercicio {step} de {exercises.length}
              </div>
              <p style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{ex.prompt}</p>
              <ExerciseBody exercise={ex} value={value} onChange={setValue} locked={Boolean(result) || sending} />
              <div style={{ marginTop: 20 }}>
                <Button fullWidth disabled={!responseComplete(ex, value) || sending || Boolean(result && result.correct)} onClick={check}>
                  {sending ? "Comprobando…" : "Comprobar"}
                </Button>
              </div>
            </div>
          </GlassPanel>
        </div>
      )}

      <FeedbackBand result={result} onContinue={continueNext} onRetry={() => { setResult(null); }} />
    </PageFrame>
  );
}
Object.assign(window, { LessonScreen });

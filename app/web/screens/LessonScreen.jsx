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

function LessonScreen({ me, courseId, lessonId, onBack, onOpenLesson, tab, setTab, showToast, refreshMe }) {
  const { GlassPanel, Badge, Button, Radio, Dialog, IconButton, Progress } = KITX;
  const [lesson, setLesson] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [answer, setAnswer] = React.useState(-1);
  const [result, setResult] = React.useState(null);
  const [sending, setSending] = React.useState(false);

  const load = () => {
    setLesson(null);
    setError(null);
    setAnswer(-1);
    setResult(null);
    API.get("/lessons/" + lessonId).then(setLesson).catch((e) => setError(e.message));
  };
  React.useEffect(load, [lessonId]);

  const send = async () => {
    setSending(true);
    try {
      const r = await API.post("/lessons/" + lessonId + "/answer", { answerIndex: answer });
      setResult(r);
      if (r.xpAwarded > 0) refreshMe();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const continueNext = () => {
    if (result.xpAwarded > 0) {
      showToast({ tone: "success", title: "Lección completada", description: "+" + result.xpAwarded + " XP en " + lesson.courseSubject });
    }
    if (result.nextLessonId) onOpenLesson(result.nextLessonId);
    else onBack();
  };

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      {error ? (
        <div style={{ marginTop: 36 }}><ErrorPanel message={error} onRetry={load} /></div>
      ) : !lesson ? (
        <LoadingPanel />
      ) : (
        <React.Fragment>
          <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
            <IconButton label="Volver" onClick={onBack}><KIcon d={ICONS.back} /></IconButton>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {lesson.courseSubject} / {lesson.unitName.split(" · ")[0]}
            </span>
            <div style={{ flex: 1 }}></div>
            <div style={{ width: 220 }}><Progress value={lesson.courseProgress} tone="cyan" size="sm" /></div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>
              Lección {lesson.position.index} de {lesson.position.total}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "start" }}>
            <GlassPanel padding="var(--space-7)" radius="var(--radius-xl)">
              <Badge tone="cyan">LECCIÓN {lesson.position.index}</Badge>
              <h1 style={{ margin: "12px 0 10px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>{lesson.title}</h1>
              <ContentBlocks content={lesson.content} />
            </GlassPanel>
            {lesson.quiz ? (
              <GlassPanel tint="blue" padding="var(--space-6)" radius="var(--radius-xl)">
                <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Comprueba lo aprendido</div>
                <p style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{lesson.quiz.question}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {lesson.quiz.options.map((o, i) => (
                    <div key={i} onClick={() => setAnswer(i)} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: answer === i ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (answer === i ? "var(--focus-ring)" : "var(--glass-stroke)"), cursor: "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
                      <Radio name="quiz" checked={answer === i} onChange={() => setAnswer(i)} label={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{o}</span>} />
                    </div>
                  ))}
                </div>
                <Button fullWidth disabled={answer < 0 || sending} onClick={send}>
                  {sending ? "Enviando…" : "Enviar respuesta"}
                </Button>
              </GlassPanel>
            ) : null}
          </div>
          <Dialog
            open={result !== null}
            onClose={() => setResult(null)}
            title={result && result.correct ? "¡Correcto!" : "No exactamente"}
            footer={result && result.correct
              ? <Button onClick={continueNext}>{result.nextLessonId ? "Continuar" : "Volver al temario"}</Button>
              : <React.Fragment>
                  <Button variant="ghost" onClick={() => setResult(null)}>Revisar lección</Button>
                  <Button onClick={() => setResult(null)}>Intentar de nuevo</Button>
                </React.Fragment>}
          >
            {result ? (
              <span>
                {result.explanation}
                {result.correct && result.xpAwarded > 0 ? (
                  <React.Fragment> Ganaste <strong style={{ color: "var(--accent-cyan)" }}>+{result.xpAwarded} XP</strong>.</React.Fragment>
                ) : null}
                {result.correct && result.alreadyCompleted ? " Ya habías completado esta lección, así que no hay XP nuevo." : null}
              </span>
            ) : null}
          </Dialog>
        </React.Fragment>
      )}
    </PageFrame>
  );
}
Object.assign(window, { LessonScreen });

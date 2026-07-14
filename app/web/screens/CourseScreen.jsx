const KITC = window.CodingDesignSystem_2ecb3a;

function LessonRow({ lesson, onOpen }) {
  const { Badge } = KITC;
  const [hover, setHover] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => Liquid.ripple(ref.current), []);
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => onOpen(lesson.id)}
      style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: "var(--radius-md)", cursor: "pointer", background: hover ? "var(--glass-bg-strong)" : lesson.current ? "var(--glass-tint-cyan)" : "transparent", border: "1px solid " + (lesson.current ? "rgba(82,201,184,0.35)" : hover ? "var(--glass-stroke)" : "transparent"), transition: "all var(--duration-fast) var(--ease-glass)" }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 99, flexShrink: 0, background: lesson.done ? "linear-gradient(180deg, #58CFA0, #3DB27E)" : "var(--glass-bg)", border: "1px solid " + (lesson.done ? "rgba(255,255,255,0.35)" : "var(--glass-stroke-strong)"), boxShadow: lesson.done ? "0 0 12px rgba(76,199,147,0.35)" : "var(--refraction-edge)", color: lesson.done ? "#03160C" : "var(--text-tertiary)" }}>
        {lesson.done ? <KIcon d={ICONS.check} size={13} /> : <KIcon d={ICONS.play} size={12} />}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{lesson.title}</div>
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 1 }}>{lesson.mins} min</div>
      </div>
      {lesson.current ? <Badge tone="cyan" dot>SIGUIENTE</Badge> : null}
    </div>
  );
}

function CourseScreen({ me, courseId, onBack, onOpenLesson, tab, setTab }) {
  const { GlassPanel, Badge, Progress, Button, IconButton } = KITC;
  const [course, setCourse] = React.useState(null);
  const [error, setError] = React.useState(null);
  const load = () => {
    setCourse(null);
    setError(null);
    API.get("/courses/" + courseId).then(setCourse).catch((e) => setError(e.message));
  };
  React.useEffect(load, [courseId]);

  const rootRef = React.useRef(null);
  React.useEffect(() => Liquid.reveal(rootRef.current), [course]);

  const statusTone = { "EN CURSO": "cyan", "NUEVO": "blue", "COMPLETADO": "success" };
  const progressTone = course
    ? (course.status === "COMPLETADO" ? "success" : course.subjectTone === "amber" ? "blue" : course.subjectTone)
    : "cyan";
  const current = course ? course.units.flatMap((u) => u.lessons).find((l) => l.current) : null;

  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: me.stats.streak }} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
        <IconButton label="Volver" onClick={onBack}><KIcon d={ICONS.back} /></IconButton>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
          Materias{course ? " / " + course.subject : ""}
        </span>
      </div>
      {error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : !course ? (
        <LoadingPanel />
      ) : (
        <React.Fragment>
          <div ref={rootRef}>
            <div className="lg-reveal">
              <GlassPanel tint={course.subjectTone === "amber" ? "none" : course.subjectTone} padding="var(--space-7)" radius="var(--radius-xl)" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                  <div style={{ flex: 1 }}>
                    <Badge tone={statusTone[course.status] || "neutral"} dot={course.status === "EN CURSO"}>{course.status}</Badge>
                    <h1 style={{ margin: "12px 0 6px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>{course.title}</h1>
                    <p style={{ margin: 0, fontSize: "var(--text-md)", color: "var(--text-secondary)", maxWidth: 560 }}>{course.description}</p>
                    {current ? (
                      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        <Button iconLeft={<KIcon d={ICONS.play} />} onClick={() => onOpenLesson(current.id)}>
                          {course.progress > 0 ? "Continuar lección" : "Empezar"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                  <Progress value={course.progress} shape="ring" tone={progressTone} size="lg" showLabel />
                </div>
              </GlassPanel>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {course.units.map((u) => (
                <div key={u.id} className="lg-reveal">
                  <GlassPanel padding="var(--space-5)">
                    <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", margin: "0 4px 10px" }}>{u.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {u.lessons.map((l) => <LessonRow key={l.id} lesson={l} onOpen={onOpenLesson} />)}
                    </div>
                  </GlassPanel>
                </div>
              ))}
            </div>
          </div>
        </React.Fragment>
      )}
    </PageFrame>
  );
}
Object.assign(window, { CourseScreen });

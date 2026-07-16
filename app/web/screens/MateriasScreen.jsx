const KITM = window.CodingDesignSystem_2ecb3a;

function CourseCard({ course, onOpen }) {
  const { Card, Badge, Progress, Button } = KITM;
  const locked = course.status === "BLOQUEADO";
  const toneMap = { "EN CURSO": "cyan", "NUEVO": "blue", "COMPLETADO": "success", "BLOQUEADO": "neutral" };
  return (
    <Card
      eyebrow={course.subject}
      title={course.title}
      subtitle={course.lessons + " lecciones · " + course.hours + " h"}
      tint={locked ? "none" : course.subjectTone === "amber" ? "none" : course.subjectTone}
      hoverable={!locked}
      onClick={locked ? undefined : () => onOpen(course.id)}
      style={{ opacity: locked ? 0.55 : 1 }}
      footer={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Badge tone={toneMap[course.status]} dot={course.status === "EN CURSO"}>
            {locked ? <KIcon d={ICONS.lock} size={11} /> : null}
            {course.status}
          </Badge>
          {!locked && course.progress < 100 ? (
            <Button size="sm" variant={course.progress > 0 ? "primary" : "secondary"} onClick={() => onOpen(course.id)}>
              {course.progress > 0 ? "Continuar" : "Empezar"}
            </Button>
          ) : null}
        </div>
      }
    >
      <Progress value={course.progress} tone={course.status === "COMPLETADO" ? "success" : course.subjectTone === "amber" ? "blue" : course.subjectTone} showLabel />
    </Card>
  );
}

function MateriasScreen({ me, onOpenCourse, tab, setTab }) {
  const [courses, setCourses] = React.useState(null);
  const [error, setError] = React.useState(null);
  const rootRef = React.useRef(null);

  const load = () => {
    setError(null);
    API.get("/courses").then(setCourses).catch((e) => setError(e.message));
  };
  React.useEffect(load, []);
  React.useEffect(() => Liquid.reveal(rootRef.current), [courses]);

  return (
    <div ref={rootRef}>
        <div style={{ margin: "44px 4px 24px" }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Tus materias</h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>
            {me.stats.completedCourses} completadas · {me.stats.activeCourses} en curso · {me.stats.lockedCourses} bloqueadas
          </p>
        </div>
        {error ? (
          <ErrorPanel message={error} onRetry={load} />
        ) : !courses ? (
          <LoadingPanel />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
            {courses.map((c) => (
              <div key={c.id} className="lg-reveal">
                {c.status === "BLOQUEADO" ? (
                  <CourseCard course={c} onOpen={onOpenCourse} />
                ) : (
                  <TiltCard accent={c.subjectTone}>
                    <CourseCard course={c} onOpen={onOpenCourse} />
                  </TiltCard>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
Object.assign(window, { MateriasScreen, CourseCard });

const KITD = window.CodingDesignSystem_2ecb3a;

function StatPanel({ label, value, sub, tone }) {
  const { GlassPanel } = KITD;
  return (
    <GlassPanel tint={tone} padding="var(--space-5)">
      <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)" }}>{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2 }}>{sub}</div>
    </GlassPanel>
  );
}

function CourseCard({ course, onOpen }) {
  const { Card, Badge, Progress, Button } = KITD;
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

function DashboardScreen({ me, onOpenCourse, onOpenLesson, onOpenReview, tab, setTab }) {
  const { Button } = KITD;
  const [courses, setCourses] = React.useState(null);
  const [error, setError] = React.useState(null);
  const load = () => {
    setError(null);
    API.get("/courses").then(setCourses).catch((e) => setError(e.message));
  };
  React.useEffect(load, []);

  const stats = me.stats;
  const cont = me.continue;

  return (
    <PageFrame>
      <NavBar onHome={() => {}} tab={tab} setTab={setTab} user={{ initials: me.user.initials, streak: stats.streak }} />
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatPanel label="Racha" value={stats.streak + (stats.streak === 1 ? " día" : " días")} sub={"Tu mejor racha: " + stats.bestStreak + (stats.bestStreak === 1 ? " día" : " días")} tone="none" />
        <StatPanel label="XP total" value={stats.xp.toLocaleString("es")} sub={"+" + stats.xpWeek + " esta semana"} tone="blue" />
        <StatPanel label="Materias activas" value={String(stats.activeCourses)} sub={stats.completedCourses + " completadas · " + stats.lockedCourses + " bloqueadas"} tone="cyan" />
      </div>
      {me.stats.reviewCount > 0 ? (
        <KITD.GlassPanel tint="none" padding="var(--space-5)" style={{ marginBottom: 28, display: "flex", alignItems: "center", gap: 18, border: "1px solid rgba(230,175,107,0.35)" }}>
          <Orb size={44} mood="idle" />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)" }}>Repaso pendiente</div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>{me.stats.reviewCount} {me.stats.reviewCount === 1 ? "ejercicio" : "ejercicios"} por repasar · +5 XP cada uno</div>
          </div>
          <KITD.Button variant="secondary" onClick={onOpenReview}>Repasar ahora</KITD.Button>
        </KITD.GlassPanel>
      ) : null}
      <h2 style={{ margin: "0 4px 16px", fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Tus materias</h2>
      {error ? (
        <ErrorPanel message={error} onRetry={load} />
      ) : !courses ? (
        <LoadingPanel />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {courses.map((c) => <CourseCard key={c.id} course={c} onOpen={onOpenCourse} />)}
        </div>
      )}
    </PageFrame>
  );
}
Object.assign(window, { DashboardScreen });

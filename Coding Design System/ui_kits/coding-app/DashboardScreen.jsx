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
      onClick={locked ? undefined : () => onOpen(course)}
      style={{ opacity: locked ? 0.55 : 1 }}
      footer={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <Badge tone={toneMap[course.status]} dot={course.status === "EN CURSO"}>{locked ? <KIcon d={ICONS.lock} size={11} /> : null}{course.status}</Badge>
          {!locked && course.progress < 100 ? <Button size="sm" variant={course.progress > 0 ? "primary" : "secondary"} onClick={() => onOpen(course)}>{course.progress > 0 ? "Continuar" : "Empezar"}</Button> : null}
        </div>
      }
    >
      <Progress value={course.progress} tone={course.status === "COMPLETADO" ? "success" : course.subjectTone === "amber" ? "blue" : course.subjectTone} showLabel />
    </Card>
  );
}

function DashboardScreen({ data, onOpenCourse, tab, setTab }) {
  const { Button } = KITD;
  const current = data.courses[0];
  return (
    <PageFrame>
      <NavBar onHome={() => {}} tab={tab} setTab={setTab} user={data.user} />
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, margin: "44px 4px 24px" }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Hola, {data.user.name.split(" ")[0]}</h1>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-md)", color: "var(--text-secondary)" }}>Continua donde quedaste: <strong style={{ color: "var(--text-primary)" }}>{current.title}</strong></p>
        </div>
        <Button size="lg" iconLeft={<KIcon d={ICONS.play} />} onClick={() => onOpenCourse(current)}>Continuar leccion</Button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatPanel label="Racha" value={data.user.streak + " dias"} sub="Tu mejor racha: 12 dias" tone="none" />
        <StatPanel label="XP total" value={data.user.xp.toLocaleString("es")} sub="+150 esta semana" tone="blue" />
        <StatPanel label="Materias activas" value="4" sub="1 completada · 1 bloqueada" tone="cyan" />
      </div>
      <h2 style={{ margin: "0 4px 16px", fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Tus materias</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {data.courses.map((c) => <CourseCard key={c.id} course={c} onOpen={onOpenCourse} />)}
      </div>
    </PageFrame>
  );
}
Object.assign(window, { DashboardScreen });

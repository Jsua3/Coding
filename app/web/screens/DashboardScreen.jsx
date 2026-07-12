function DashboardScreen({ me }) {
  return (
    <PageFrame>
      <h1 style={{ color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>Hola, {me.user.name} — dashboard en la próxima tarea</h1>
    </PageFrame>
  );
}
Object.assign(window, { DashboardScreen });

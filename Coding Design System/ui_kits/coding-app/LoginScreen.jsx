const KITL = window.CodingDesignSystem_2ecb3a;

function LoginScreen({ onLogin }) {
  const { GlassPanel, Input, Button, Checkbox } = KITL;
  const [remember, setRemember] = React.useState(true);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
            Coding<span style={{ display: "inline-block", width: 5, height: 34, marginLeft: 8, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 14px var(--accent-cyan)" }}></span>
          </div>
          <div style={{ marginTop: 10, fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>Aprende Ingenieria de Software, una leccion a la vez</div>
        </div>
        <GlassPanel strength="strong" padding="var(--space-7)" radius="var(--radius-xl)">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            <Input label="Correo institucional" placeholder="tu@universidad.edu" iconLeft={<KIcon d="M2.5 4.5h11v7h-11v-7zM2.5 5l5.5 4 5.5-4" />} />
            <Input label="Contrasena" type="password" placeholder="••••••••" iconLeft={<KIcon d={ICONS.lock} />} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Checkbox checked={remember} onChange={setRemember} label="Recordarme" />
              <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: "var(--text-sm)" }}>¿Olvidaste tu contrasena?</a>
            </div>
            <Button fullWidth size="lg" onClick={onLogin}>Entrar</Button>
            <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>¿Primera vez? <a href="#" onClick={(e) => e.preventDefault()}>Crea tu cuenta</a></div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
Object.assign(window, { LoginScreen });

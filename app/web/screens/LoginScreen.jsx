const KITL = window.CodingDesignSystem_2ecb3a;

function LoginScreen({ onLoggedIn }) {
  const { GlassPanel, Input, Button, Checkbox } = KITL;
  const [mode, setMode] = React.useState("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const isLogin = mode === "login";

  const switchMode = (e, m) => { e.preventDefault(); setMode(m); setError(null); };

  const submit = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = isLogin
        ? await API.post("/auth/login", { email, password, remember })
        : await API.post("/auth/register", { name, email, password });
      API.setToken(data.token);
      onLoggedIn();
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
      <div style={{ width: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
            Coding<span style={{ display: "inline-block", width: 5, height: 34, marginLeft: 8, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 14px var(--accent-cyan)" }}></span>
          </div>
          <div style={{ marginTop: 10, fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>Aprende Ingeniería de Software, una lección a la vez</div>
        </div>
        <GlassPanel strength="strong" padding="var(--space-7)" radius="var(--radius-xl)">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {!isLogin ? (
              <Input label="Nombre completo" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
            ) : null}
            <Input label="Correo institucional" placeholder="tu@universidad.edu" value={email} onChange={(e) => setEmail(e.target.value)} iconLeft={<KIcon d="M2.5 4.5h11v7h-11v-7zM2.5 5l5.5 4 5.5-4" />} />
            <Input label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} iconLeft={<KIcon d={ICONS.lock} />} />
            {error ? <div style={{ fontSize: "var(--text-sm)", color: "#E67984" }}>{error}</div> : null}
            {isLogin ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Checkbox checked={remember} onChange={setRemember} label="Recordarme" />
                <a href="#" onClick={(e) => e.preventDefault()} style={{ fontSize: "var(--text-sm)" }}>¿Olvidaste tu contraseña?</a>
              </div>
            ) : null}
            <Button fullWidth size="lg" disabled={loading} onClick={submit}>
              {loading ? "Un momento…" : isLogin ? "Entrar" : "Crear cuenta"}
            </Button>
            <div style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
              {isLogin
                ? <React.Fragment>¿Primera vez? <a href="#" onClick={(e) => switchMode(e, "register")}>Crea tu cuenta</a></React.Fragment>
                : <React.Fragment>¿Ya tienes cuenta? <a href="#" onClick={(e) => switchMode(e, "login")}>Entrar</a></React.Fragment>}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
Object.assign(window, { LoginScreen });

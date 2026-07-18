const KITL = window.CodingDesignSystem_2ecb3a;

function LoginScreen({ onLoggedIn, initialMode, onBack }) {
  const { GlassPanel, Input, Button, Checkbox } = KITL;
  const [mode, setMode] = React.useState(initialMode === "register" ? "register" : "login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  // La coreografía del cambio de modo: TODO lo dependiente del modo se renderiza desde
  // shownMode (usePhase retiene el modo viejo 160ms mientras se funde con melt-out, y el
  // nuevo emerge con melt-in). Lo visible es lo que manda — también en submit. Correo y
  // contraseña NUNCA se remontan: conservan lo tecleado al alternar.
  const { shown: shownMode, phase } = usePhase(mode, 160);
  const isLogin = shownMode === "login";
  const modeCls = phase === "out" ? "anim-melt-out" : "anim-melt-in";

  // Con un submit en vuelo no se alterna: un fallo tardío pintaría el error de un modo
  // bajo la interfaz del otro.
  const switchMode = (e, m) => { e.preventDefault(); if (loading) return; setMode(m); setError(null); };

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", gap: 64, padding: 32 }}>
      {onBack ? (
        <button className="lg-back" onClick={onBack}>
          <KIcon d={ICONS.back} size={14} />
          Volver
        </button>
      ) : null}

      {/* Columna izquierda: la marca (con su caret) y el pitch que cambia de argumento
          según el modo. El logo no se anima al alternar; el pitch entero sí. */}
      <div className="anim-condense" style={{ width: 400, textAlign: "left" }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)", lineHeight: 1 }}>
          Coding<span className="lg-caret" style={{ display: "inline-block", width: 6, height: 42, marginLeft: 10, borderRadius: 3, background: "var(--accent-cyan)", boxShadow: "0 0 16px var(--accent-cyan)" }}></span>
        </div>
        <div className={modeCls} style={{ marginTop: 26 }}>
          {isLogin ? (
            <React.Fragment>
              <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.2, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
                Qué bueno verte de vuelta
              </h1>
              <p style={{ margin: "14px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                Continúa con tu progreso: tu racha, tu XP y tu cola de repaso te esperan donde los dejaste.
              </p>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.2, fontFamily: "var(--font-display)", fontWeight: "var(--weight-heavy)", letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>
                Todo un plan de Ingeniería de Software te espera
              </h1>
              <p style={{ margin: "14px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                Ocho cursos: bases de datos, programación, algoritmos, desarrollo web e ingeniería de software.
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                Lecciones cortas con ejercicios interactivos y feedback al instante.
              </p>
              <p style={{ margin: "10px 0 0", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}>
                XP, niveles, logros y una racha que hace que estudiar enganche.
              </p>
              <p style={{ margin: "18px 0 0", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
                Crear tu cuenta toma menos de un minuto.
              </p>
            </React.Fragment>
          )}
        </div>
      </div>

      {/* Columna derecha: el formulario. Lo exclusivo de cada modo (Nombre, Recordarme, la
          etiqueta del botón, el pie) se funde y emerge con modeCls, cada uno en su wrapper
          propio — el DS no reenvía className. */}
      <div className="anim-condense anim-condense--delayed" style={{ width: 420 }}>
        <GlassPanel strength="strong" padding="var(--space-7)" radius="var(--radius-xl)">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
            {!isLogin ? (
              <div className={modeCls}>
                <Input label="Nombre completo" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            ) : null}
            <Input label="Correo institucional" placeholder="tu@universidad.edu" value={email} onChange={(e) => setEmail(e.target.value)} iconLeft={<KIcon d="M2.5 4.5h11v7h-11v-7zM2.5 5l5.5 4 5.5-4" />} />
            <Input label="Contraseña" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} iconLeft={<KIcon d={ICONS.lock} />} />
            {error ? <div style={{ fontSize: "var(--text-sm)", color: "#E67984" }}>{error}</div> : null}
            {isLogin ? (
              <div className={modeCls}>
                <Checkbox checked={remember} onChange={setRemember} label="Recordarme" />
              </div>
            ) : null}
            <div className={modeCls}>
              <Button fullWidth size="lg" disabled={loading} onClick={submit}>
                {loading ? "Un momento…" : isLogin ? "Entrar" : "Crear cuenta"}
              </Button>
            </div>
            <div className={modeCls} style={{ textAlign: "center", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>
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

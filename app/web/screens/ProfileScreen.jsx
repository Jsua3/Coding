const KITF = window.CodingDesignSystem_2ecb3a;

const META_NIVELES = [
  { goal: 20, label: "Relajado" },
  { goal: 50, label: "Normal" },
  { goal: 100, label: "Serio" },
  { goal: 150, label: "Intenso" },
];

function ProfileScreen({ me, tab, setTab, refreshMe }) {
  const { GlassPanel, Button } = KITF;
  const [data, setData] = React.useState(null); // /progress: para el estado de racha
  const [goal, setGoal] = React.useState(me.stats.dailyGoal);
  const [saving, setSaving] = React.useState(false);
  const [protecting, setProtecting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const rootRef = React.useRef(null);
  const errorTimer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(errorTimer.current), []);
  const showError = (m) => { setError(m); clearTimeout(errorTimer.current); errorTimer.current = setTimeout(() => setError(null), 3200); };

  const load = () => { API.get("/progress").then(setData).catch(() => setData(null)); };
  React.useEffect(load, []);
  React.useEffect(() => Liquid.reveal(rootRef.current), [data]);

  const cambiarMeta = (g) => {
    if (g === goal || saving) return;
    setSaving(true);
    setGoal(g); // optimista
    API.put("/me/daily-goal", { goal: g })
      .then(() => refreshMe())
      .catch(() => setGoal(me.stats.dailyGoal))
      .finally(() => setSaving(false));
  };

  const proteger = (e) => {
    if (protecting) return;
    setProtecting(true);
    const b = e.currentTarget.getBoundingClientRect();
    API.post("/streak/protect")
      .then(() => {
        FX.burst(b.left + b.width / 2, b.top + b.height / 2);
        FX.sound.play("streak");
        load();
        refreshMe();
      })
      .catch((err) => showError(err.message))
      .finally(() => setProtecting(false));
  };

  const u = me.user;
  const desde = u.createdAt ? new Date(u.createdAt).toLocaleDateString("es", { year: "numeric", month: "long" }) : "";
  const streak = data && data.streak ? data.streak : null;

  return (
    <div ref={rootRef}>
        <h1 style={{ margin: "44px 4px 24px", fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, letterSpacing: "var(--tracking-display)", color: "var(--text-primary)" }}>Tu perfil</h1>

        {/* Identidad */}
        <div className="lg-reveal">
          <GlassPanel padding="var(--space-6)" style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #6FA0E0, #4E86D6)", border: "1px solid rgba(255,255,255,0.4)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 14px rgba(94,151,230,0.35)", fontSize: 22, fontWeight: 800, color: "var(--text-on-accent)" }}>{u.initials}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text-primary)" }}>{u.name}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)", marginTop: 2 }}>{u.email}</div>
                {desde ? <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: 4 }}>Miembro desde {desde}</div> : null}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Meta diaria */}
        <div className="lg-reveal">
          <GlassPanel padding="var(--space-6)" style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>Meta diaria de XP</div>
            <p style={{ margin: "0 0 16px", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>Cuánto XP quieres ganar cada día.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {META_NIVELES.map((m) => (
                <button key={m.goal} onClick={() => cambiarMeta(m.goal)} disabled={saving}
                  style={{ padding: "14px 10px", borderRadius: "var(--radius-md)", cursor: saving ? "default" : "pointer", textAlign: "center", background: goal === m.goal ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (goal === m.goal ? "var(--focus-ring)" : "var(--glass-stroke)"), color: "var(--text-primary)", transition: "all var(--duration-fast) var(--ease-glass)" }}>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 600 }}>{m.label}</div>
                  <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--accent-cyan)", fontVariantNumeric: "tabular-nums" }}>{m.goal}</div>
                </button>
              ))}
            </div>
          </GlassPanel>
        </div>

        {/* Racha */}
        <div className="lg-reveal">
          <GlassPanel padding="var(--space-6)" style={{ marginBottom: 18 }}>
            <div style={{ fontSize: "var(--text-md)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 14 }}>Tu racha</div>
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 800, color: "var(--accent-amber)", fontVariantNumeric: "tabular-nums" }}>
                  <KIcon d={ICONS.flame} size={24} />{streak ? streak.current : me.stats.streak}
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>días seguidos</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>{streak ? streak.best : me.stats.bestStreak}</div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>tu mejor racha</div>
              </div>
              <div style={{ flex: 1 }}></div>
              {streak && streak.repairable ? (
                <Button variant="secondary" disabled={protecting} onClick={proteger}>
                  {protecting ? "Protegiendo…" : "Proteger racha · " + streak.repairable.totalCost + " XP"}
                </Button>
              ) : null}
            </div>
            {streak && streak.repairable ? (
              <p style={{ margin: "12px 0 0", fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                Tienes {me.stats.balance} XP de saldo. Proteger cuesta {streak.repairable.totalCost} XP y no baja tu nivel.
              </p>
            ) : null}
            {error ? <p style={{ margin: "12px 0 0", fontSize: "var(--text-sm)", color: "var(--danger)" }}>{error}</p> : null}
          </GlassPanel>
        </div>

        {/* Cerrar sesión */}
        <div className="lg-reveal">
          <Button variant="ghost" iconLeft={<KIcon d={ICONS.logout} size={14} />} onClick={() => API.logout()}>Cerrar sesión</Button>
        </div>
      </div>
  );
}
Object.assign(window, { ProfileScreen });

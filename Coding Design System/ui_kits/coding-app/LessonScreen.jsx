const KITX = window.CodingDesignSystem_2ecb3a;

function CodeBlock({ lines }) {
  return (
    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, lineHeight: 1.7, background: "rgba(3,6,16,0.55)", border: "1px solid var(--glass-stroke)", borderRadius: "var(--radius-sm)", padding: "14px 18px", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}>
      {lines.map((l, i) => <div key={i} dangerouslySetInnerHTML={{ __html: l }}></div>)}
    </div>
  );
}

function LessonScreen({ data, onBack, tab, setTab }) {
  const { GlassPanel, Badge, Button, Radio, Dialog, Toast, IconButton, Progress } = KITX;
  const [answer, setAnswer] = React.useState(-1);
  const [result, setResult] = React.useState(null);
  const [toast, setToast] = React.useState(false);
  const quiz = data.quiz;
  const send = () => setResult(answer === quiz.correct ? "ok" : "bad");
  const finish = () => { setResult(null); setToast(true); setTimeout(() => setToast(false), 3200); };
  const K = "color: var(--accent-violet)", S = "color: var(--accent-cyan)", N = "color: var(--accent-amber)";
  return (
    <PageFrame>
      <NavBar onHome={onBack} tab={tab} setTab={setTab} user={data.user} />
      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "36px 0 20px" }}>
        <IconButton label="Volver" onClick={onBack}><KIcon d={ICONS.back} /></IconButton>
        <span style={{ fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>Bases de datos I / Unidad 2</span>
        <div style={{ flex: 1 }}></div>
        <div style={{ width: 220 }}><Progress value={45} tone="cyan" size="sm" /></div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)" }}>Leccion 5 de 12</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "start" }}>
        <GlassPanel padding="var(--space-7)" radius="var(--radius-xl)">
          <Badge tone="cyan">LECCION 5</Badge>
          <h1 style={{ margin: "12px 0 10px", fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 800, letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>Consultas SELECT y WHERE</h1>
          <p style={{ margin: "0 0 14px", fontSize: "var(--text-base)", color: "var(--text-secondary)" }}><code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent-cyan)" }}>SELECT</code> recupera columnas de una tabla; <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent-cyan)" }}>WHERE</code> filtra las filas que cumplen una condicion. Puedes ordenar el resultado con <code style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--accent-cyan)" }}>ORDER BY</code>.</p>
          <CodeBlock lines={[
            '<span style="color: var(--text-tertiary)">-- Estudiantes con promedio superior a 4.0</span>',
            '<span style="' + K + '">SELECT</span> nombre, promedio <span style="' + K + '">FROM</span> estudiantes',
            '<span style="' + K + '">WHERE</span> promedio &gt; <span style="' + N + '">4.0</span>',
            '<span style="' + K + '">ORDER BY</span> promedio <span style="' + K + '">DESC</span>;',
          ]} />
          <p style={{ margin: "14px 0 0", fontSize: "var(--text-sm)", color: "var(--text-tertiary)" }}>La condicion del WHERE se evalua fila por fila antes de proyectar las columnas del SELECT.</p>
        </GlassPanel>
        <GlassPanel tint="blue" padding="var(--space-6)" radius="var(--radius-xl)">
          <div style={{ fontSize: "var(--text-xs)", fontWeight: 600, letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: 10 }}>Comprueba lo aprendido</div>
          <p style={{ margin: "0 0 16px", fontSize: "var(--text-base)", fontWeight: 500, color: "var(--text-primary)" }}>{quiz.question}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {quiz.options.map((o, i) => (
              <div key={i} onClick={() => setAnswer(i)} style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: answer === i ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (answer === i ? "var(--focus-ring)" : "var(--glass-stroke)"), cursor: "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
                <Radio name="quiz" checked={answer === i} onChange={() => setAnswer(i)} label={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{o}</span>} />
              </div>
            ))}
          </div>
          <Button fullWidth disabled={answer < 0} onClick={send}>Enviar respuesta</Button>
        </GlassPanel>
      </div>
      <Dialog
        open={result !== null}
        onClose={() => setResult(null)}
        title={result === "ok" ? "¡Correcto!" : "No exactamente"}
        footer={result === "ok"
          ? <Button onClick={finish}>Continuar</Button>
          : <React.Fragment><Button variant="ghost" onClick={() => setResult(null)}>Revisar leccion</Button><Button onClick={() => setResult(null)}>Intentar de nuevo</Button></React.Fragment>}
      >
        {result === "ok"
          ? <span>WHERE filtra y ORDER BY ... DESC ordena de mayor a menor. Ganaste <strong style={{ color: "var(--accent-cyan)" }}>+50 XP</strong>.</span>
          : <span>Recuerda: la clausula <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>WHERE</code> va despues de <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>FROM</code> y necesitas <code style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>DESC</code> para ordenar de mayor a menor.</span>}
      </Dialog>
      {toast ? (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 90 }}>
          <Toast tone="success" title="Leccion completada" description="+50 XP en Bases de datos I" onClose={() => setToast(false)} />
        </div>
      ) : null}
    </PageFrame>
  );
}
Object.assign(window, { LessonScreen });

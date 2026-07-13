const KITE = window.CodingDesignSystem_2ecb3a;

function responseComplete(exercise, value) {
  if (!value) return false;
  const p = exercise.payload;
  if (exercise.type === "choice") return Number.isInteger(value.index);
  if (exercise.type === "blanks") return Array.isArray(value.blanks) && value.blanks.every((b) => typeof b === "string");
  if (exercise.type === "order") return Array.isArray(value.order) && value.order.length === p.lines.length;
  if (exercise.type === "match") return Array.isArray(value.pairs) && value.pairs.length === p.left.length;
  return false;
}

function blanksCount(payload) {
  return (payload.code.join("\n").match(/<b\d+>/g) || []).length;
}

function ChoiceExercise({ payload, value, onChange, locked }) {
  const { Radio } = KITE;
  const sel = value ? value.index : -1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {payload.options.map((o, i) => (
        <div key={i} onClick={() => !locked && onChange({ index: i })}
          style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: sel === i ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (sel === i ? "var(--focus-ring)" : "var(--glass-stroke)"), cursor: locked ? "default" : "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
          <Radio name="ex-choice" checked={sel === i} onChange={() => !locked && onChange({ index: i })}
            label={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>{o}</span>} />
        </div>
      ))}
    </div>
  );
}

function TokenChip({ text, ghost, onClick }) {
  return (
    <button onClick={onClick} disabled={ghost || !onClick}
      style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, padding: "7px 14px", borderRadius: "var(--radius-pill)", border: "1px solid var(--glass-stroke-strong)", background: ghost ? "transparent" : "var(--glass-bg-strong)", color: ghost ? "var(--text-tertiary)" : "var(--text-primary)", opacity: ghost ? 0.35 : 1, cursor: onClick && !ghost ? "pointer" : "default", boxShadow: ghost ? "none" : "var(--refraction-edge)", transition: "all var(--duration-fast) var(--ease-glass)" }}>
      {text}
    </button>
  );
}

function BlanksExercise({ payload, value, onChange, locked }) {
  const total = blanksCount(payload);
  const placed = value && value.blanks ? value.blanks : Array(total).fill(null);
  const usedTokens = new Set(placed.filter((t) => t !== null));

  const place = (token) => {
    if (locked || usedTokens.has(token)) return;
    const i = placed.indexOf(null);
    if (i === -1) return;
    const next = [...placed];
    next[i] = token;
    onChange({ blanks: next });
  };
  const remove = (slotIndex) => {
    if (locked || placed[slotIndex] === null) return;
    const next = [...placed];
    next[slotIndex] = null;
    onChange({ blanks: next });
  };

  let slotCursor = -1;
  return (
    <div>
      <div className="lesson-content" style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, lineHeight: 2.1, background: "rgba(3,6,16,0.55)", border: "1px solid var(--glass-stroke)", borderRadius: "var(--radius-sm)", padding: "14px 18px" }}>
        {payload.code.map((line, li) => (
          <div key={li}>
            {line.split(/(<b\d+>)/).map((part, pi) => {
              if (/^<b\d+>$/.test(part)) {
                slotCursor += 1;
                const idx = slotCursor;
                const token = placed[idx];
                return token !== null ? (
                  <span key={pi} onClick={() => remove(idx)} style={{ display: "inline-block", margin: "0 3px", cursor: locked ? "default" : "pointer" }}>
                    <TokenChip text={token} />
                  </span>
                ) : (
                  <span key={pi} style={{ display: "inline-block", minWidth: 72, margin: "0 3px", borderBottom: "2px dashed var(--glass-stroke-strong)", height: "1.2em", verticalAlign: "middle" }}></span>
                );
              }
              return <span key={pi} dangerouslySetInnerHTML={{ __html: part }} />;
            })}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {payload.bank.map((token) => (
          <TokenChip key={token} text={token} ghost={usedTokens.has(token)} onClick={() => place(token)} />
        ))}
      </div>
    </div>
  );
}

function OrderExercise({ payload, value, onChange, locked }) {
  const order = value && value.order ? value.order : [];
  const byId = Object.fromEntries(payload.lines.map((l) => [l.id, l]));
  const available = payload.lines.filter((l) => !order.includes(l.id));

  const lineStyle = { fontFamily: "var(--font-mono)", fontSize: 13, padding: "9px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-stroke)", background: "var(--glass-bg-subtle)", cursor: locked ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10, transition: "all var(--duration-fast) var(--ease-glass)" };

  return (
    <div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "var(--tracking-caps)", fontWeight: 600, marginBottom: 8 }}>Tu secuencia</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, minHeight: 44, marginBottom: 14, padding: 8, borderRadius: "var(--radius-md)", border: "1px dashed var(--glass-stroke-strong)" }}>
        {order.map((id, i) => (
          <div key={id} style={{ ...lineStyle, background: "var(--glass-bg-strong)" }} onClick={() => !locked && onChange({ order: order.filter((x) => x !== id) })}>
            <span style={{ color: "var(--accent-cyan)", fontWeight: 700, minWidth: 16 }}>{i + 1}</span>
            <span dangerouslySetInnerHTML={{ __html: byId[id].html }} />
          </div>
        ))}
        {order.length === 0 ? <div style={{ color: "var(--text-tertiary)", fontSize: "var(--text-sm)", padding: 6 }}>Toca las líneas de abajo en el orden correcto</div> : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {available.map((l) => (
          <div key={l.id} style={lineStyle} onClick={() => !locked && onChange({ order: [...order, l.id] })}>
            <span dangerouslySetInnerHTML={{ __html: l.html }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchExercise({ payload, value, onChange, locked }) {
  const pairs = value && value.pairs ? value.pairs : [];
  const [selLeft, setSelLeft] = React.useState(null);
  const pairedL = new Set(pairs.map((p) => p[0]));
  const pairedR = new Set(pairs.map((p) => p[1]));
  const colors = ["#5E97E6", "#52C9B8", "#9289E3", "#E6AF6B"];
  const pairColor = {};
  pairs.forEach((p, i) => { pairColor[p[0]] = colors[i % colors.length]; pairColor["r" + p[1]] = colors[i % colors.length]; });

  const clickLeft = (i) => {
    if (locked) return;
    if (pairedL.has(i)) { onChange({ pairs: pairs.filter((p) => p[0] !== i) }); setSelLeft(null); return; }
    setSelLeft(i === selLeft ? null : i);
  };
  const clickRight = (j) => {
    if (locked || selLeft === null) return;
    if (pairedR.has(j)) return;
    onChange({ pairs: [...pairs, [selLeft, j]] });
    setSelLeft(null);
  };

  const cell = (text, active, color, onClick) => (
    <div onClick={onClick} style={{ padding: "11px 14px", borderRadius: "var(--radius-md)", fontSize: "var(--text-sm)", color: "var(--text-primary)", background: active ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)", border: "1px solid " + (color || (active ? "var(--focus-ring)" : "var(--glass-stroke)")), borderLeft: color ? "3px solid " + color : undefined, cursor: locked ? "default" : "pointer", transition: "all var(--duration-fast) var(--ease-glass)" }}>
      {text}
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {payload.left.map((t, i) => cell(t, selLeft === i || pairedL.has(i), pairColor[i], () => clickLeft(i)))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {payload.right.map((t, j) => cell(t, pairedR.has(j), pairColor["r" + j], () => clickRight(j)))}
      </div>
    </div>
  );
}

function ExerciseBody({ exercise, value, onChange, locked }) {
  const p = { payload: exercise.payload, value, onChange, locked };
  if (exercise.type === "choice") return <ChoiceExercise {...p} />;
  if (exercise.type === "blanks") return <BlanksExercise {...p} />;
  if (exercise.type === "order") return <OrderExercise {...p} />;
  if (exercise.type === "match") return <MatchExercise {...p} />;
  return null;
}

Object.assign(window, { ExerciseBody, responseComplete });

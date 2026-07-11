import React from "react";

export function Tag({ tone = "neutral", onRemove, style, children }) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    neutral: { fg: "var(--text-primary)", stroke: "var(--glass-stroke-strong)" },
    blue: { fg: "#A3C0E8", stroke: "rgba(94,151,230,0.4)" },
    cyan: { fg: "#9CDCD2", stroke: "rgba(82,201,184,0.4)" },
    violet: { fg: "#C2BCE8", stroke: "rgba(146,137,227,0.4)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: onRemove ? "5px 6px 5px 12px" : "5px 12px",
        borderRadius: "var(--radius-pill)",
        background: "var(--glass-bg)",
        border: "1px solid " + t.stroke,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
        fontSize: "var(--text-sm)",
        fontWeight: "var(--weight-medium)",
        color: t.fg,
        ...style,
      }}
    >
      {children}
      {onRemove ? (
        <button
          onClick={onRemove}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          aria-label="Quitar"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 18,
            height: 18,
            borderRadius: 99,
            border: "none",
            background: hover ? "var(--glass-bg-pressed)" : "var(--glass-bg-strong)",
            color: "inherit",
            cursor: "pointer",
            padding: 0,
            transition: "background var(--duration-fast) var(--ease-glass)",
          }}
        >
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      ) : null}
    </span>
  );
}

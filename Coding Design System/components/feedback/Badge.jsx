import React from "react";

export function Badge({ tone = "neutral", dot = false, style, children }) {
  const tones = {
    neutral: { bg: "var(--glass-bg)", fg: "var(--text-secondary)", stroke: "var(--glass-stroke)" },
    blue: { bg: "rgba(94,151,230,0.16)", fg: "#A3C0E8", stroke: "rgba(94,151,230,0.35)" },
    cyan: { bg: "rgba(82,201,184,0.14)", fg: "#9CDCD2", stroke: "rgba(82,201,184,0.32)" },
    violet: { bg: "rgba(146,137,227,0.16)", fg: "#C2BCE8", stroke: "rgba(146,137,227,0.35)" },
    amber: { bg: "rgba(230,175,107,0.14)", fg: "#E8CDA3", stroke: "rgba(230,175,107,0.32)" },
    success: { bg: "rgba(76,199,147,0.14)", fg: "#9CDBBD", stroke: "rgba(76,199,147,0.32)" },
    warning: { bg: "rgba(230,181,107,0.14)", fg: "#E8CFA5", stroke: "rgba(230,181,107,0.32)" },
    danger: { bg: "rgba(230,121,132,0.14)", fg: "#E8A8B0", stroke: "rgba(230,121,132,0.32)" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "3px 10px",
        borderRadius: "var(--radius-pill)",
        background: t.bg,
        border: "1px solid " + t.stroke,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
        fontSize: "var(--text-xs)",
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "0.02em",
        color: t.fg,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {dot ? <span style={{ width: 6, height: 6, borderRadius: 99, background: "currentColor", boxShadow: "0 0 8px currentColor" }}></span> : null}
      {children}
    </span>
  );
}

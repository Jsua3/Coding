import React from "react";

export function Progress({ value = 0, tone = "blue", shape = "bar", size = "md", showLabel = false, style }) {
  const v = Math.max(0, Math.min(100, value));
  const tones = {
    blue: { grad: "linear-gradient(90deg, #5E97E6, #7FA9E6)", glow: "rgba(94,151,230,0.5)", solid: "#5E97E6" },
    cyan: { grad: "linear-gradient(90deg, #3FB5A3, #52C9B8)", glow: "rgba(82,201,184,0.5)", solid: "#52C9B8" },
    violet: { grad: "linear-gradient(90deg, #8378DB, #A29AE6)", glow: "rgba(146,137,227,0.5)", solid: "#9289E3" },
    success: { grad: "linear-gradient(90deg, #3DB27E, #4CC793)", glow: "rgba(76,199,147,0.5)", solid: "#4CC793" },
  };
  const t = tones[tone] || tones.blue;
  if (shape === "ring") {
    const dim = size === "sm" ? 44 : size === "lg" ? 88 : 64;
    const sw = size === "sm" ? 4 : 6;
    const r = (dim - sw) / 2;
    const circ = 2 * Math.PI * r;
    return (
      <div style={{ position: "relative", width: dim, height: dim, ...style }}>
        <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="var(--glass-bg-strong)" strokeWidth={sw} />
          <circle
            cx={dim / 2} cy={dim / 2} r={r} fill="none"
            stroke={t.solid} strokeWidth={sw} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - v / 100)}
            style={{ filter: "drop-shadow(0 0 6px " + t.glow + ")", transition: "stroke-dashoffset var(--duration-slow) var(--ease-glass)" }}
          />
        </svg>
        {showLabel ? (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size === "sm" ? 10 : "var(--text-sm)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>{Math.round(v)}%</div>
        ) : null}
      </div>
    );
  }
  const h = size === "sm" ? 6 : size === "lg" ? 14 : 10;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", ...style }}>
      <div style={{ flex: 1, height: h, borderRadius: 99, background: "var(--glass-bg)", border: "1px solid var(--glass-stroke)", boxShadow: "inset 0 1px 2px rgba(3,6,16,0.3)", overflow: "hidden" }}>
        <div
          style={{
            width: v + "%",
            height: "100%",
            borderRadius: 99,
            background: t.grad,
            boxShadow: "0 0 12px " + t.glow + ", inset 0 1px 0 rgba(255,255,255,0.45)",
            transition: "width var(--duration-slow) var(--ease-glass)",
          }}
        ></div>
      </div>
      {showLabel ? <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums", minWidth: 38, textAlign: "right" }}>{Math.round(v)}%</span> : null}
    </div>
  );
}

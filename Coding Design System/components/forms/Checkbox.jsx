import React from "react";

export function Checkbox({ checked = false, onChange, label, disabled = false, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <label
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, ...style }}
    >
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange && onChange(e.target.checked)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: 7,
          background: checked ? "linear-gradient(180deg, #6FA0E0, #4E86D6)" : hover ? "var(--glass-bg-strong)" : "var(--glass-bg)",
          border: "1px solid " + (checked ? "rgba(255,255,255,0.4)" : "var(--glass-stroke-strong)"),
          boxShadow: checked ? "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 14px rgba(94,151,230,0.35)" : "var(--refraction-edge)",
          transform: checked ? "scale(1)" : hover ? "scale(1.06)" : "scale(1)",
          transition: "all var(--duration-fast) var(--ease-spring)",
          flexShrink: 0,
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ opacity: checked ? 1 : 0, transform: checked ? "scale(1)" : "scale(0.5)", transition: "all var(--duration-fast) var(--ease-spring)" }}>
          <path d="M3 8.5L6.5 12L13 4.5" stroke="#051022" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {label ? <span style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{label}</span> : null}
    </label>
  );
}

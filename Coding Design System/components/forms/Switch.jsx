import React from "react";

export function Switch({ checked = false, onChange, label, disabled = false, style }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, ...style }}>
      <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange && onChange(e.target.checked)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span
        style={{
          position: "relative",
          width: 48,
          height: 28,
          borderRadius: "var(--radius-pill)",
          background: checked ? "linear-gradient(180deg, #6FA0E0, #4E86D6)" : "var(--glass-bg)",
          border: "1px solid " + (checked ? "rgba(255,255,255,0.4)" : "var(--glass-stroke-strong)"),
          boxShadow: checked ? "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 16px rgba(94,151,230,0.35)" : "var(--refraction-edge)",
          transition: "all var(--duration-base) var(--ease-glass)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: 2,
            width: 22,
            height: 22,
            borderRadius: "var(--radius-pill)",
            background: "linear-gradient(180deg, #FFFFFF, #E8EEF8)",
            boxShadow: "0 2px 6px rgba(3,6,16,0.4), inset 0 -1px 0 rgba(3,6,16,0.08)",
            transform: checked ? "translateX(20px)" : "translateX(0)",
            transition: "transform var(--duration-base) var(--ease-spring)",
          }}
        ></span>
      </span>
      {label ? <span style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{label}</span> : null}
    </label>
  );
}

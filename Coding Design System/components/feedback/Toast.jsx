import React from "react";

export function Toast({ tone = "info", title, description, onClose, style }) {
  const tones = {
    info: { color: "var(--accent-blue)", icon: "M8 7.5v4M8 5v.5" },
    success: { color: "var(--success)", icon: "M4.5 8.5L7 11l4.5-6" },
    warning: { color: "var(--warning)", icon: "M8 4.5v4.5M8 11.5v.5" },
    danger: { color: "var(--danger)", icon: "M5 5l6 6M11 5l-6 6" },
  };
  const t = tones[tone] || tones.info;
  return (
    <div
      role="status"
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: "var(--space-3)",
        width: 360,
        maxWidth: "100%",
        padding: "var(--space-4)",
        background: "rgba(20, 28, 50, 0.72)",
        border: "1px solid var(--glass-stroke-strong)",
        boxShadow: "var(--refraction-edge), var(--shadow-float)",
        borderRadius: "var(--radius-md)",
        ...style,
      }}
    >
      <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))" }}></span>
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 99, background: "color-mix(in srgb, " + t.color + " 18%, transparent)", border: "1px solid color-mix(in srgb, " + t.color + " 40%, transparent)", flexShrink: 0, boxShadow: "0 0 12px color-mix(in srgb, " + t.color + " 30%, transparent)" }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d={t.icon} stroke={t.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-bold)", color: "var(--text-primary)" }}>{title}</div>
        {description ? <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: 2 }}>{description}</div> : null}
      </div>
      {onClose ? (
        <button onClick={onClose} aria-label="Cerrar" style={{ display: "inline-flex", width: 22, height: 22, alignItems: "center", justifyContent: "center", border: "none", borderRadius: 99, background: "var(--glass-bg)", color: "var(--text-tertiary)", cursor: "pointer", padding: 0, flexShrink: 0 }}>
          <svg width="9" height="9" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        </button>
      ) : null}
    </div>
  );
}

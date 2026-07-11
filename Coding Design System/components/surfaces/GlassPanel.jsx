import React from "react";

export function GlassPanel({ tint = "none", strength = "default", specular = true, radius = "var(--radius-lg)", padding = "var(--space-6)", style, children, onClick }) {
  const fills = {
    subtle: "var(--glass-bg-subtle)",
    default: "var(--glass-bg)",
    strong: "var(--glass-bg-strong)",
  };
  const tints = {
    none: null,
    blue: "var(--glass-tint-blue)",
    cyan: "var(--glass-tint-cyan)",
    violet: "var(--glass-tint-violet)",
  };
  const bg = tints[tint] || fills[strength] || fills.default;
  const shadow = strength === "strong" ? "var(--shadow-float)" : strength === "subtle" ? "var(--shadow-rest)" : "var(--shadow-glass)";
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        background: bg,
        border: "1px solid var(--glass-stroke)",
        boxShadow: "var(--refraction-edge), " + shadow,
        borderRadius: radius,
        padding: padding,
        ...style,
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))" }}></div>
      {specular ? (
        <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "var(--specular)", pointerEvents: "none" }}></div>
      ) : null}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

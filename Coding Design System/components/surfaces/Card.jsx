import React from "react";
import { GlassPanel } from "./GlassPanel";

export function Card({ eyebrow, title, subtitle, tint = "none", footer, hoverable = true, onClick, style, children }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        transform: hover && hoverable ? "translateY(-4px) scale(1.01)" : "none",
        transition: "transform var(--duration-base) var(--ease-spring)",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <GlassPanel tint={tint} strength={hover && hoverable ? "strong" : "default"} onClick={onClick} style={style}>
        {eyebrow ? (
          <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", letterSpacing: "var(--tracking-caps)", textTransform: "uppercase", color: "var(--text-tertiary)", marginBottom: "var(--space-2)" }}>{eyebrow}</div>
        ) : null}
        {title ? (
          <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)", lineHeight: "var(--leading-snug)" }}>{title}</div>
        ) : null}
        {subtitle ? (
          <div style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)", marginTop: "var(--space-1)" }}>{subtitle}</div>
        ) : null}
        {children ? <div style={{ marginTop: title ? "var(--space-4)" : 0 }}>{children}</div> : null}
        {footer ? (
          <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--glass-stroke)", display: "flex", alignItems: "center", gap: "var(--space-3)" }}>{footer}</div>
        ) : null}
      </GlassPanel>
    </div>
  );
}

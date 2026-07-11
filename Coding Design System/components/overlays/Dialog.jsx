import React from "react";

export function Dialog({ open = false, onClose, title, footer, width = 460, style, children }) {
  const [visible, setVisible] = React.useState(open);
  React.useEffect(() => {
    if (open) {
      setVisible(false);
      const t = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(t);
    }
    setVisible(false);
  }, [open]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6)",
        background: "rgba(3, 6, 16, 0.5)",
        opacity: visible ? 1 : 0,
        transition: "opacity var(--duration-base) var(--ease-glass)",
      }}
    >
      <div aria-hidden style={{ position: "absolute", inset: 0, WebkitBackdropFilter: "blur(14px)", backdropFilter: "blur(14px)" }}></div>
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: width,
          maxWidth: "100%",
          maxHeight: "84vh",
          overflowY: "auto",
          padding: "var(--space-7)",
          background: "rgba(22, 30, 54, 0.78)",
          border: "1px solid var(--glass-stroke-strong)",
          boxShadow: "var(--refraction-edge), var(--shadow-float)",
          borderRadius: "var(--radius-xl)",
          transform: visible ? "scale(1) translateY(0)" : "scale(0.92) translateY(16px)",
          transition: "transform var(--duration-base) var(--ease-spring)",
          ...style,
        }}
      >
        <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))" }}></div>
        <div style={{ position: "absolute", inset: 0, borderRadius: "inherit", background: "var(--specular)", pointerEvents: "none" }}></div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: "var(--weight-bold)", letterSpacing: "var(--tracking-heading)", color: "var(--text-primary)" }}>{title}</h2>
            {onClose ? (
              <button onClick={onClose} aria-label="Cerrar" style={{ display: "inline-flex", width: 30, height: 30, alignItems: "center", justifyContent: "center", border: "1px solid var(--glass-stroke)", borderRadius: 99, background: "var(--glass-bg)", color: "var(--text-secondary)", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            ) : null}
          </div>
          <div style={{ color: "var(--text-secondary)", fontSize: "var(--text-base)", lineHeight: "var(--leading-normal)" }}>{children}</div>
          {footer ? (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-6)" }}>{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

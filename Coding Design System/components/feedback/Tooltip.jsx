import React from "react";

export function Tooltip({ content, side = "top", style, children }) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: { bottom: "calc(100% + 8px)", left: "50%", transform: show ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0.9) translateY(4px)" },
    bottom: { top: "calc(100% + 8px)", left: "50%", transform: show ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0.9) translateY(-4px)" },
    left: { right: "calc(100% + 8px)", top: "50%", transform: show ? "translateY(-50%) scale(1)" : "translateY(-50%) scale(0.9) translateX(4px)" },
    right: { left: "calc(100% + 8px)", top: "50%", transform: show ? "translateY(-50%) scale(1)" : "translateY(-50%) scale(0.9) translateX(-4px)" },
  };
  return (
    <span
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      style={{ position: "relative", display: "inline-flex", ...style }}
    >
      {children}
      <span
        role="tooltip"
        style={{
          position: "absolute",
          zIndex: 60,
          padding: "6px 12px",
          background: "rgba(24, 32, 56, 0.85)",
          border: "1px solid var(--glass-stroke-strong)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2), var(--shadow-glass)",
          borderRadius: "var(--radius-xs)",
          fontSize: "var(--text-xs)",
          fontWeight: "var(--weight-medium)",
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          opacity: show ? 1 : 0,
          transition: "all var(--duration-fast) var(--ease-spring)",
          ...pos[side],
        }}
      >
        <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))" }}></span>
        {content}
      </span>
    </span>
  );
}

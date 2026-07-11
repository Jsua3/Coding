import React from "react";

export function Tabs({ items = [], value, onChange, size = "md", style }) {
  const idx = Math.max(0, items.findIndex((it) => it.id === value));
  const h = size === "sm" ? 36 : 44;
  return (
    <div
      role="tablist"
      style={{
        position: "relative",
        display: "flex",
        height: h,
        padding: 4,
        background: "var(--glass-bg-subtle)",
        border: "1px solid var(--glass-stroke)",
        boxShadow: "var(--refraction-edge), var(--shadow-rest)",
        borderRadius: "var(--radius-pill)",
        ...style,
      }}
    >
      <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))" }}></span>
      <div
        style={{
          position: "absolute",
          top: 4,
          bottom: 4,
          left: 4,
          width: "calc((100% - 8px) / " + Math.max(1, items.length) + ")",
          borderRadius: "var(--radius-pill)",
          background: "var(--glass-bg-pressed)",
          border: "1px solid var(--glass-stroke-strong)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3), 0 4px 16px rgba(3,6,16,0.35)",
          transform: "translateX(" + idx * 100 + "%)",
          transition: "transform var(--duration-base) var(--ease-spring)",
          pointerEvents: "none",
        }}
      ></div>
      {items.map((it) => (
        <button
          key={it.id}
          role="tab"
          aria-selected={it.id === value}
          onClick={() => onChange && onChange(it.id)}
          style={{
            position: "relative",
            flex: 1,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            border: "none",
            background: "transparent",
            font: "inherit",
            fontSize: size === "sm" ? "var(--text-sm)" : "var(--text-base)",
            fontWeight: "var(--weight-semibold)",
            color: it.id === value ? "var(--text-primary)" : "var(--text-tertiary)",
            cursor: "pointer",
            borderRadius: "var(--radius-pill)",
            padding: "0 18px",
            whiteSpace: "nowrap",
            transition: "color var(--duration-fast) var(--ease-glass)",
            outline: "none",
          }}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}

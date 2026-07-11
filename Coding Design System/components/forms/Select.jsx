import React from "react";

export function Select({ label, options = [], value, onChange, placeholder = "Selecciona una opcion", disabled = false, style }) {
  const [open, setOpen] = React.useState(false);
  const [hoverIdx, setHoverIdx] = React.useState(-1);
  const selected = options.find((o) => o.value === value);
  return (
    <div style={{ position: "relative", ...style }}>
      {label ? (
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>{label}</div>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
          width: "100%",
          height: 44,
          padding: "0 var(--space-4)",
          background: open ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)",
          border: "1px solid " + (open ? "var(--focus-ring)" : "var(--glass-stroke)"),
          boxShadow: open ? "var(--refraction-edge), 0 0 0 4px rgba(94,151,230,0.18)" : "var(--refraction-edge)",
          borderRadius: "var(--radius-md)",
          font: "inherit",
          fontSize: "var(--text-base)",
          color: selected ? "var(--text-primary)" : "var(--text-tertiary)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.4 : 1,
          transition: "all var(--duration-fast) var(--ease-glass)",
          outline: "none",
          textAlign: "left",
        }}
      >
        <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))" }}></span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selected ? selected.label : placeholder}</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform var(--duration-fast) var(--ease-spring)" }}>
          <path d="M3.5 6l4.5 4.5L12.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open ? (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 50,
            padding: "var(--space-2)",
            background: "rgba(20, 28, 50, 0.75)",
            border: "1px solid var(--glass-stroke-strong)",
            boxShadow: "var(--refraction-edge), var(--shadow-float)",
            borderRadius: "var(--radius-md)",
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))" }}></div>
          {options.map((o, i) => (
            <div
              key={o.value}
              onMouseDown={() => { if (onChange) onChange(o.value); setOpen(false); }}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(-1)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px var(--space-3)",
                borderRadius: "var(--radius-xs)",
                fontSize: "var(--text-base)",
                color: o.value === value ? "var(--accent-cyan)" : "var(--text-primary)",
                background: hoverIdx === i ? "var(--glass-bg-strong)" : "transparent",
                cursor: "pointer",
                transition: "background var(--duration-fast) var(--ease-glass)",
              }}
            >
              <span>{o.label}</span>
              {o.value === value ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

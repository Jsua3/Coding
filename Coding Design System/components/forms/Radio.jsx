import React from "react";

export function Radio({ checked = false, onChange, label, name, disabled = false, style }) {
  const [hover, setHover] = React.useState(false);
  return (
    <label
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-3)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, ...style }}
    >
      <input type="radio" name={name} checked={checked} disabled={disabled} onChange={() => onChange && onChange(true)} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 22,
          height: 22,
          borderRadius: "var(--radius-pill)",
          background: hover && !checked ? "var(--glass-bg-strong)" : "var(--glass-bg)",
          border: "1px solid " + (checked ? "var(--accent-blue)" : "var(--glass-stroke-strong)"),
          boxShadow: checked ? "var(--refraction-edge), 0 0 0 4px rgba(94,151,230,0.16)" : "var(--refraction-edge)",
          transition: "all var(--duration-fast) var(--ease-spring)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "var(--radius-pill)",
            background: "linear-gradient(180deg, #7FA9E6, #4E86D6)",
            boxShadow: "0 2px 8px rgba(94,151,230,0.5)",
            transform: checked ? "scale(1)" : "scale(0)",
            transition: "transform var(--duration-fast) var(--ease-spring)",
          }}
        ></span>
      </span>
      {label ? <span style={{ fontSize: "var(--text-base)", color: "var(--text-primary)" }}>{label}</span> : null}
    </label>
  );
}

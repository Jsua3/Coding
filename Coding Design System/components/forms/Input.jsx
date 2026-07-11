import React from "react";

export function Input({ label, placeholder, value, onChange, type = "text", hint, error, iconLeft, disabled = false, style }) {
  const [focus, setFocus] = React.useState(false);
  const stroke = error ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--glass-stroke)";
  return (
    <label style={{ display: "block", ...style }}>
      {label ? (
        <div style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>{label}</div>
      ) : null}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "var(--space-2)",
          height: 44,
          padding: "0 var(--space-4)",
          background: focus ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)",
          border: "1px solid " + stroke,
          boxShadow: focus ? "var(--refraction-edge), 0 0 0 4px rgba(94,151,230,0.18)" : "var(--refraction-edge)",
          borderRadius: "var(--radius-md)",
          opacity: disabled ? 0.4 : 1,
          transition: "all var(--duration-fast) var(--ease-glass)",
        }}
      >
        <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))" }}></span>
        {iconLeft ? <span style={{ display: "inline-flex", color: "var(--text-tertiary)" }}>{iconLeft}</span> : null}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          style={{
            flex: 1,
            minWidth: 0,
            background: "transparent",
            border: "none",
            outline: "none",
            font: "inherit",
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
            caretColor: "var(--accent-blue)",
          }}
        />
      </div>
      {error ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginTop: "var(--space-2)" }}>{error}</div>
      ) : hint ? (
        <div style={{ fontSize: "var(--text-xs)", color: "var(--text-tertiary)", marginTop: "var(--space-2)" }}>{hint}</div>
      ) : null}
    </label>
  );
}

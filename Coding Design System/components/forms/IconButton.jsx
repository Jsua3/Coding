import React from "react";

export function IconButton({ label, variant = "glass", size = "md", disabled = false, active = false, onClick, style, children }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const dims = { sm: 36, md: 44, lg: 52 };
  const d = dims[size] || dims.md;
  const variants = {
    glass: {
      background: active ? "var(--glass-bg-pressed)" : hover ? "var(--glass-bg-strong)" : "var(--glass-bg)",
      border: "1px solid " + (hover || active ? "var(--glass-stroke-strong)" : "var(--glass-stroke)"),
      boxShadow: "var(--refraction-edge), var(--shadow-rest)",
      color: "var(--text-primary)",
    },
    ghost: {
      background: hover ? "var(--glass-bg-subtle)" : "transparent",
      border: "1px solid transparent",
      color: hover ? "var(--text-primary)" : "var(--text-secondary)",
    },
    accent: {
      background: "linear-gradient(180deg, #6FA0E0, #4E86D6)",
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 20px rgba(94,151,230,0.3)",
      color: "var(--text-on-accent)",
    },
  };
  const v = variants[variant] || variants.glass;
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => { setHover(false); setPress(false); }}
      onMouseDown={() => setPress(true)}
      onMouseUp={() => setPress(false)}
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: d,
        height: d,
        borderRadius: "var(--radius-pill)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transform: press && !disabled ? "scale(0.92)" : "none",
        transition: "all var(--duration-fast) var(--ease-spring)",
        outline: "none",
        ...v,
        ...style,
      }}
    >
      {variant === "glass" ? <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))" }}></span> : null}
      {children}
    </button>
  );
}

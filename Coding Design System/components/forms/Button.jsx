import React from "react";

export function Button({ variant = "primary", size = "md", disabled = false, fullWidth = false, iconLeft = null, iconRight = null, onClick, type = "button", style, children }) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const sizes = {
    sm: { height: 36, padding: "0 18px", fontSize: "var(--text-sm)", gap: 6 },
    md: { height: 44, padding: "0 24px", fontSize: "var(--text-base)", gap: 8 },
    lg: { height: 52, padding: "0 30px", fontSize: "var(--text-md)", gap: 10 },
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: "linear-gradient(180deg, " + (hover ? "#7FA9E6, #5E97E6" : "#6FA0E0, #4E86D6") + ")",
      color: "var(--text-on-accent)",
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), " + (hover ? "var(--shadow-glow-blue)" : "0 6px 24px rgba(94,151,230,0.28)"),
    },
    secondary: {
      background: hover ? "var(--glass-bg-strong)" : "var(--glass-bg)",
      color: "var(--text-primary)",
      border: "1px solid " + (hover ? "var(--glass-stroke-strong)" : "var(--glass-stroke)"),
      boxShadow: "var(--refraction-edge), var(--shadow-rest)",
    },
    ghost: {
      background: hover ? "var(--glass-bg-subtle)" : "transparent",
      color: hover ? "var(--text-primary)" : "var(--text-secondary)",
      border: "1px solid transparent",
    },
    danger: {
      background: "linear-gradient(180deg, " + (hover ? "#E893A0, #E66E7C" : "#E68492, #D95F6D") + ")",
      color: "#2A0509",
      border: "1px solid rgba(255,255,255,0.35)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 24px rgba(230,121,132,0.3)",
    },
  };
  const v = variants[variant] || variants.primary;
  return (
    <button
      type={type}
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
        gap: s.gap,
        whiteSpace: "nowrap",
        flexShrink: 0,
        height: s.height,
        padding: s.padding,
        width: fullWidth ? "100%" : "auto",
        fontFamily: "var(--font-body)",
        fontSize: s.fontSize,
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "var(--tracking-body)",
        borderRadius: "var(--radius-pill)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        transform: press && !disabled ? "scale(0.96)" : hover && !disabled ? "translateY(-1px)" : "none",
        transition: "all var(--duration-fast) var(--ease-spring)",
        outline: "none",
        ...v,
        ...style,
      }}
    >
      {variant === "secondary" ? <span aria-hidden style={{ position: "absolute", inset: 0, zIndex: -1, borderRadius: "inherit", WebkitBackdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))", backdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))" }}></span> : null}
      {iconLeft}
      <span>{children}</span>
      {iconRight}
    </button>
  );
}

/* @ds-bundle: {"format":4,"namespace":"CodingDesignSystem_2ecb3a","components":[{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Progress","sourcePath":"components/feedback/Progress.jsx"},{"name":"Tag","sourcePath":"components/feedback/Tag.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"},{"name":"Dialog","sourcePath":"components/overlays/Dialog.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"GlassPanel","sourcePath":"components/surfaces/GlassPanel.jsx"}],"sourceHashes":{"components/feedback/Badge.jsx":"e7bdcd0e71ff","components/feedback/Progress.jsx":"64fa81ca6bfe","components/feedback/Tag.jsx":"170aab212485","components/feedback/Toast.jsx":"385c202be7cf","components/feedback/Tooltip.jsx":"3fc06d6222fb","components/forms/Button.jsx":"5d1b6315d2ff","components/forms/Checkbox.jsx":"7231c355f9f0","components/forms/IconButton.jsx":"d242a4bf0067","components/forms/Input.jsx":"3fedb69fc12f","components/forms/Radio.jsx":"7a39df6f297a","components/forms/Select.jsx":"ea10d436eca3","components/forms/Switch.jsx":"447f701817f0","components/navigation/Tabs.jsx":"ff5c0a0d2b64","components/overlays/Dialog.jsx":"6e30b44865c2","components/surfaces/Card.jsx":"d95fdc1bb449","components/surfaces/GlassPanel.jsx":"1e3754d293d3","ui_kits/coding-app/AppShell.jsx":"e3f70c7335b1","ui_kits/coding-app/CourseScreen.jsx":"b6263ee15088","ui_kits/coding-app/DashboardScreen.jsx":"1ea8894ea65c","ui_kits/coding-app/LessonScreen.jsx":"bd95cff8bcce","ui_kits/coding-app/LoginScreen.jsx":"70c421963e76","ui_kits/coding-app/data.js":"70dd3a68f55e"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CodingDesignSystem_2ecb3a = window.CodingDesignSystem_2ecb3a || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/feedback/Badge.jsx
try { (() => {
function Badge({
  tone = "neutral",
  dot = false,
  style,
  children
}) {
  const tones = {
    neutral: {
      bg: "var(--glass-bg)",
      fg: "var(--text-secondary)",
      stroke: "var(--glass-stroke)"
    },
    blue: {
      bg: "rgba(94,151,230,0.16)",
      fg: "#A3C0E8",
      stroke: "rgba(94,151,230,0.35)"
    },
    cyan: {
      bg: "rgba(82,201,184,0.14)",
      fg: "#9CDCD2",
      stroke: "rgba(82,201,184,0.32)"
    },
    violet: {
      bg: "rgba(146,137,227,0.16)",
      fg: "#C2BCE8",
      stroke: "rgba(146,137,227,0.35)"
    },
    amber: {
      bg: "rgba(230,175,107,0.14)",
      fg: "#E8CDA3",
      stroke: "rgba(230,175,107,0.32)"
    },
    success: {
      bg: "rgba(76,199,147,0.14)",
      fg: "#9CDBBD",
      stroke: "rgba(76,199,147,0.32)"
    },
    warning: {
      bg: "rgba(230,181,107,0.14)",
      fg: "#E8CFA5",
      stroke: "rgba(230,181,107,0.32)"
    },
    danger: {
      bg: "rgba(230,121,132,0.14)",
      fg: "#E8A8B0",
      stroke: "rgba(230,121,132,0.32)"
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 10px",
      borderRadius: "var(--radius-pill)",
      background: t.bg,
      border: "1px solid " + t.stroke,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "0.02em",
      color: t.fg,
      whiteSpace: "nowrap",
      ...style
    }
  }, dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 99,
      background: "currentColor",
      boxShadow: "0 0 8px currentColor"
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Progress.jsx
try { (() => {
function Progress({
  value = 0,
  tone = "blue",
  shape = "bar",
  size = "md",
  showLabel = false,
  style
}) {
  const v = Math.max(0, Math.min(100, value));
  const tones = {
    blue: {
      grad: "linear-gradient(90deg, #5E97E6, #7FA9E6)",
      glow: "rgba(94,151,230,0.5)",
      solid: "#5E97E6"
    },
    cyan: {
      grad: "linear-gradient(90deg, #3FB5A3, #52C9B8)",
      glow: "rgba(82,201,184,0.5)",
      solid: "#52C9B8"
    },
    violet: {
      grad: "linear-gradient(90deg, #8378DB, #A29AE6)",
      glow: "rgba(146,137,227,0.5)",
      solid: "#9289E3"
    },
    success: {
      grad: "linear-gradient(90deg, #3DB27E, #4CC793)",
      glow: "rgba(76,199,147,0.5)",
      solid: "#4CC793"
    }
  };
  const t = tones[tone] || tones.blue;
  if (shape === "ring") {
    const dim = size === "sm" ? 44 : size === "lg" ? 88 : 64;
    const sw = size === "sm" ? 4 : 6;
    const r = (dim - sw) / 2;
    const circ = 2 * Math.PI * r;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative",
        width: dim,
        height: dim,
        ...style
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: dim,
      height: dim,
      style: {
        transform: "rotate(-90deg)"
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: dim / 2,
      cy: dim / 2,
      r: r,
      fill: "none",
      stroke: "var(--glass-bg-strong)",
      strokeWidth: sw
    }), /*#__PURE__*/React.createElement("circle", {
      cx: dim / 2,
      cy: dim / 2,
      r: r,
      fill: "none",
      stroke: t.solid,
      strokeWidth: sw,
      strokeLinecap: "round",
      strokeDasharray: circ,
      strokeDashoffset: circ * (1 - v / 100),
      style: {
        filter: "drop-shadow(0 0 6px " + t.glow + ")",
        transition: "stroke-dashoffset var(--duration-slow) var(--ease-glass)"
      }
    })), showLabel ? /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size === "sm" ? 10 : "var(--text-sm)",
        fontWeight: "var(--weight-bold)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-display)"
      }
    }, Math.round(v), "%") : null);
  }
  const h = size === "sm" ? 6 : size === "lg" ? 14 : 10;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      height: h,
      borderRadius: 99,
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-stroke)",
      boxShadow: "inset 0 1px 2px rgba(3,6,16,0.3)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: v + "%",
      height: "100%",
      borderRadius: 99,
      background: t.grad,
      boxShadow: "0 0 12px " + t.glow + ", inset 0 1px 0 rgba(255,255,255,0.45)",
      transition: "width var(--duration-slow) var(--ease-glass)"
    }
  })), showLabel ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--text-secondary)",
      fontVariantNumeric: "tabular-nums",
      minWidth: 38,
      textAlign: "right"
    }
  }, Math.round(v), "%") : null);
}
Object.assign(__ds_scope, { Progress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Progress.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tag.jsx
try { (() => {
function Tag({
  tone = "neutral",
  onRemove,
  style,
  children
}) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    neutral: {
      fg: "var(--text-primary)",
      stroke: "var(--glass-stroke-strong)"
    },
    blue: {
      fg: "#A3C0E8",
      stroke: "rgba(94,151,230,0.4)"
    },
    cyan: {
      fg: "#9CDCD2",
      stroke: "rgba(82,201,184,0.4)"
    },
    violet: {
      fg: "#C2BCE8",
      stroke: "rgba(146,137,227,0.4)"
    }
  };
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: onRemove ? "5px 6px 5px 12px" : "5px 12px",
      borderRadius: "var(--radius-pill)",
      background: "var(--glass-bg)",
      border: "1px solid " + t.stroke,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: t.fg,
      ...style
    }
  }, children, onRemove ? /*#__PURE__*/React.createElement("button", {
    onClick: onRemove,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    "aria-label": "Quitar",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 18,
      height: 18,
      borderRadius: 99,
      border: "none",
      background: hover ? "var(--glass-bg-pressed)" : "var(--glass-bg-strong)",
      color: "inherit",
      cursor: "pointer",
      padding: 0,
      transition: "background var(--duration-fast) var(--ease-glass)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "9",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 4l8 8M12 4l-8 8",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }))) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function Toast({
  tone = "info",
  title,
  description,
  onClose,
  style
}) {
  const tones = {
    info: {
      color: "var(--accent-blue)",
      icon: "M8 7.5v4M8 5v.5"
    },
    success: {
      color: "var(--success)",
      icon: "M4.5 8.5L7 11l4.5-6"
    },
    warning: {
      color: "var(--warning)",
      icon: "M8 4.5v4.5M8 11.5v.5"
    },
    danger: {
      color: "var(--danger)",
      icon: "M5 5l6 6M11 5l-6 6"
    }
  };
  const t = tones[tone] || tones.info;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    style: {
      position: "relative",
      display: "flex",
      alignItems: "flex-start",
      gap: "var(--space-3)",
      width: 360,
      maxWidth: "100%",
      padding: "var(--space-4)",
      background: "rgba(20, 28, 50, 0.72)",
      border: "1px solid var(--glass-stroke-strong)",
      boxShadow: "var(--refraction-edge), var(--shadow-float)",
      borderRadius: "var(--radius-md)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 26,
      height: 26,
      borderRadius: 99,
      background: "color-mix(in srgb, " + t.color + " 18%, transparent)",
      border: "1px solid color-mix(in srgb, " + t.color + " 40%, transparent)",
      flexShrink: 0,
      boxShadow: "0 0 12px color-mix(in srgb, " + t.color + " 30%, transparent)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "13",
    height: "13",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: t.icon,
    stroke: t.color,
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-bold)",
      color: "var(--text-primary)"
    }
  }, title), description ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)",
      marginTop: 2
    }
  }, description) : null), onClose ? /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Cerrar",
    style: {
      display: "inline-flex",
      width: 22,
      height: 22,
      alignItems: "center",
      justifyContent: "center",
      border: "none",
      borderRadius: 99,
      background: "var(--glass-bg)",
      color: "var(--text-tertiary)",
      cursor: "pointer",
      padding: 0,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "9",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 4l8 8M12 4l-8 8",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }))) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function Tooltip({
  content,
  side = "top",
  style,
  children
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: "calc(100% + 8px)",
      left: "50%",
      transform: show ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0.9) translateY(4px)"
    },
    bottom: {
      top: "calc(100% + 8px)",
      left: "50%",
      transform: show ? "translateX(-50%) scale(1)" : "translateX(-50%) scale(0.9) translateY(-4px)"
    },
    left: {
      right: "calc(100% + 8px)",
      top: "50%",
      transform: show ? "translateY(-50%) scale(1)" : "translateY(-50%) scale(0.9) translateX(4px)"
    },
    right: {
      left: "calc(100% + 8px)",
      top: "50%",
      transform: show ? "translateY(-50%) scale(1)" : "translateY(-50%) scale(0.9) translateX(-4px)"
    }
  };
  return /*#__PURE__*/React.createElement("span", {
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    }
  }, children, /*#__PURE__*/React.createElement("span", {
    role: "tooltip",
    style: {
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
      ...pos[side]
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))"
    }
  }), content));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  iconLeft = null,
  iconRight = null,
  onClick,
  type = "button",
  style,
  children
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const sizes = {
    sm: {
      height: 36,
      padding: "0 18px",
      fontSize: "var(--text-sm)",
      gap: 6
    },
    md: {
      height: 44,
      padding: "0 24px",
      fontSize: "var(--text-base)",
      gap: 8
    },
    lg: {
      height: 52,
      padding: "0 30px",
      fontSize: "var(--text-md)",
      gap: 10
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    primary: {
      background: "linear-gradient(180deg, " + (hover ? "#7FA9E6, #5E97E6" : "#6FA0E0, #4E86D6") + ")",
      color: "var(--text-on-accent)",
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), " + (hover ? "var(--shadow-glow-blue)" : "0 6px 24px rgba(94,151,230,0.28)")
    },
    secondary: {
      background: hover ? "var(--glass-bg-strong)" : "var(--glass-bg)",
      color: "var(--text-primary)",
      border: "1px solid " + (hover ? "var(--glass-stroke-strong)" : "var(--glass-stroke)"),
      boxShadow: "var(--refraction-edge), var(--shadow-rest)"
    },
    ghost: {
      background: hover ? "var(--glass-bg-subtle)" : "transparent",
      color: hover ? "var(--text-primary)" : "var(--text-secondary)",
      border: "1px solid transparent"
    },
    danger: {
      background: "linear-gradient(180deg, " + (hover ? "#E893A0, #E66E7C" : "#E68492, #D95F6D") + ")",
      color: "#2A0509",
      border: "1px solid rgba(255,255,255,0.35)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 6px 24px rgba(230,121,132,0.3)"
    }
  };
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
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
      ...style
    }
  }, variant === "secondary" ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))"
    }
  }) : null, iconLeft, /*#__PURE__*/React.createElement("span", null, children), iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-3)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 22,
      height: 22,
      borderRadius: 7,
      background: checked ? "linear-gradient(180deg, #6FA0E0, #4E86D6)" : hover ? "var(--glass-bg-strong)" : "var(--glass-bg)",
      border: "1px solid " + (checked ? "rgba(255,255,255,0.4)" : "var(--glass-stroke-strong)"),
      boxShadow: checked ? "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 14px rgba(94,151,230,0.35)" : "var(--refraction-edge)",
      transform: checked ? "scale(1)" : hover ? "scale(1.06)" : "scale(1)",
      transition: "all var(--duration-fast) var(--ease-spring)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 16 16",
    fill: "none",
    style: {
      opacity: checked ? 1 : 0,
      transform: checked ? "scale(1)" : "scale(0.5)",
      transition: "all var(--duration-fast) var(--ease-spring)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 8.5L6.5 12L13 4.5",
    stroke: "#051022",
    strokeWidth: "2.4",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-base)",
      color: "var(--text-primary)"
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function IconButton({
  label,
  variant = "glass",
  size = "md",
  disabled = false,
  active = false,
  onClick,
  style,
  children
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const dims = {
    sm: 36,
    md: 44,
    lg: 52
  };
  const d = dims[size] || dims.md;
  const variants = {
    glass: {
      background: active ? "var(--glass-bg-pressed)" : hover ? "var(--glass-bg-strong)" : "var(--glass-bg)",
      border: "1px solid " + (hover || active ? "var(--glass-stroke-strong)" : "var(--glass-stroke)"),
      boxShadow: "var(--refraction-edge), var(--shadow-rest)",
      color: "var(--text-primary)"
    },
    ghost: {
      background: hover ? "var(--glass-bg-subtle)" : "transparent",
      border: "1px solid transparent",
      color: hover ? "var(--text-primary)" : "var(--text-secondary)"
    },
    accent: {
      background: "linear-gradient(180deg, #6FA0E0, #4E86D6)",
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 6px 20px rgba(94,151,230,0.3)",
      color: "var(--text-on-accent)"
    }
  };
  const v = variants[variant] || variants.glass;
  return /*#__PURE__*/React.createElement("button", {
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
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
      ...style
    }
  }, variant === "glass" ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))"
    }
  }) : null, children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function Input({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  hint,
  error,
  iconLeft,
  disabled = false,
  style
}) {
  const [focus, setFocus] = React.useState(false);
  const stroke = error ? "var(--danger)" : focus ? "var(--focus-ring)" : "var(--glass-stroke)";
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-secondary)",
      marginBottom: "var(--space-2)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
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
      transition: "all var(--duration-fast) var(--ease-glass)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))"
    }
  }), iconLeft ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      color: "var(--text-tertiary)"
    }
  }, iconLeft) : null, /*#__PURE__*/React.createElement("input", {
    type: type,
    placeholder: placeholder,
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      background: "transparent",
      border: "none",
      outline: "none",
      font: "inherit",
      fontSize: "var(--text-base)",
      color: "var(--text-primary)",
      caretColor: "var(--accent-blue)"
    }
  })), error ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--danger)",
      marginTop: "var(--space-2)"
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-tertiary)",
      marginTop: "var(--space-2)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function Radio({
  checked = false,
  onChange,
  label,
  name,
  disabled = false,
  style
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-3)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: name,
    checked: checked,
    disabled: disabled,
    onChange: () => onChange && onChange(true),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
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
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: "var(--radius-pill)",
      background: "linear-gradient(180deg, #7FA9E6, #4E86D6)",
      boxShadow: "0 2px 8px rgba(94,151,230,0.5)",
      transform: checked ? "scale(1)" : "scale(0)",
      transition: "transform var(--duration-fast) var(--ease-spring)"
    }
  })), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-base)",
      color: "var(--text-primary)"
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Selecciona una opcion",
  disabled = false,
  style
}) {
  const [open, setOpen] = React.useState(false);
  const [hoverIdx, setHoverIdx] = React.useState(-1);
  const selected = options.find(o => o.value === value);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      ...style
    }
  }, label ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-secondary)",
      marginBottom: "var(--space-2)"
    }
  }, label) : null, /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: () => setOpen(!open),
    onBlur: () => setTimeout(() => setOpen(false), 120),
    style: {
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
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-sm)) saturate(var(--saturate-glass))"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, selected ? selected.label : placeholder), /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 16 16",
    fill: "none",
    style: {
      flexShrink: 0,
      transform: open ? "rotate(180deg)" : "none",
      transition: "transform var(--duration-fast) var(--ease-spring)"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3.5 6l4.5 4.5L12.5 6",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), open ? /*#__PURE__*/React.createElement("div", {
    style: {
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
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))"
    }
  }), options.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: o.value,
    onMouseDown: () => {
      if (onChange) onChange(o.value);
      setOpen(false);
    },
    onMouseEnter: () => setHoverIdx(i),
    onMouseLeave: () => setHoverIdx(-1),
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px var(--space-3)",
      borderRadius: "var(--radius-xs)",
      fontSize: "var(--text-base)",
      color: o.value === value ? "var(--accent-cyan)" : "var(--text-primary)",
      background: hoverIdx === i ? "var(--glass-bg-strong)" : "transparent",
      cursor: "pointer",
      transition: "background var(--duration-fast) var(--ease-glass)"
    }
  }, /*#__PURE__*/React.createElement("span", null, o.label), o.value === value ? /*#__PURE__*/React.createElement("svg", {
    width: "14",
    height: "14",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 8.5L6.5 12L13 4.5",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })) : null))) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  style
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--space-3)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.4 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    role: "switch",
    checked: checked,
    disabled: disabled,
    onChange: e => onChange && onChange(e.target.checked),
    style: {
      position: "absolute",
      opacity: 0,
      width: 0,
      height: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 48,
      height: 28,
      borderRadius: "var(--radius-pill)",
      background: checked ? "linear-gradient(180deg, #6FA0E0, #4E86D6)" : "var(--glass-bg)",
      border: "1px solid " + (checked ? "rgba(255,255,255,0.4)" : "var(--glass-stroke-strong)"),
      boxShadow: checked ? "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 16px rgba(94,151,230,0.35)" : "var(--refraction-edge)",
      transition: "all var(--duration-base) var(--ease-glass)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 2,
      left: 2,
      width: 22,
      height: 22,
      borderRadius: "var(--radius-pill)",
      background: "linear-gradient(180deg, #FFFFFF, #E8EEF8)",
      boxShadow: "0 2px 6px rgba(3,6,16,0.4), inset 0 -1px 0 rgba(3,6,16,0.08)",
      transform: checked ? "translateX(20px)" : "translateX(0)",
      transition: "transform var(--duration-base) var(--ease-spring)"
    }
  })), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-base)",
      color: "var(--text-primary)"
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function Tabs({
  items = [],
  value,
  onChange,
  size = "md",
  style
}) {
  const idx = Math.max(0, items.findIndex(it => it.id === value));
  const h = size === "sm" ? 36 : 44;
  return /*#__PURE__*/React.createElement("div", {
    role: "tablist",
    style: {
      position: "relative",
      display: "flex",
      height: h,
      padding: 4,
      background: "var(--glass-bg-subtle)",
      border: "1px solid var(--glass-stroke)",
      boxShadow: "var(--refraction-edge), var(--shadow-rest)",
      borderRadius: "var(--radius-pill)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
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
      pointerEvents: "none"
    }
  }), items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    role: "tab",
    "aria-selected": it.id === value,
    onClick: () => onChange && onChange(it.id),
    style: {
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
      outline: "none"
    }
  }, it.icon, it.label)));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// components/overlays/Dialog.jsx
try { (() => {
function Dialog({
  open = false,
  onClose,
  title,
  footer,
  width = 460,
  style,
  children
}) {
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
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-6)",
      background: "rgba(3, 6, 16, 0.5)",
      opacity: visible ? 1 : 0,
      transition: "opacity var(--duration-base) var(--ease-glass)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      WebkitBackdropFilter: "blur(14px)",
      backdropFilter: "blur(14px)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    onClick: e => e.stopPropagation(),
    style: {
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
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      background: "var(--specular)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: "var(--space-4)",
      marginBottom: "var(--space-4)"
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-xl)",
      fontWeight: "var(--weight-bold)",
      letterSpacing: "var(--tracking-heading)",
      color: "var(--text-primary)"
    }
  }, title), onClose ? /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    "aria-label": "Cerrar",
    style: {
      display: "inline-flex",
      width: 30,
      height: 30,
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--glass-stroke)",
      borderRadius: 99,
      background: "var(--glass-bg)",
      color: "var(--text-secondary)",
      cursor: "pointer",
      padding: 0,
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 4l8 8M12 4l-8 8",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }))) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      color: "var(--text-secondary)",
      fontSize: "var(--text-base)",
      lineHeight: "var(--leading-normal)"
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "var(--space-3)",
      marginTop: "var(--space-6)"
    }
  }, footer) : null)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/overlays/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/GlassPanel.jsx
try { (() => {
function GlassPanel({
  tint = "none",
  strength = "default",
  specular = true,
  radius = "var(--radius-lg)",
  padding = "var(--space-6)",
  style,
  children,
  onClick
}) {
  const fills = {
    subtle: "var(--glass-bg-subtle)",
    default: "var(--glass-bg)",
    strong: "var(--glass-bg-strong)"
  };
  const tints = {
    none: null,
    blue: "var(--glass-tint-blue)",
    cyan: "var(--glass-tint-cyan)",
    violet: "var(--glass-tint-violet)"
  };
  const bg = tints[tint] || fills[strength] || fills.default;
  const shadow = strength === "strong" ? "var(--shadow-float)" : strength === "subtle" ? "var(--shadow-rest)" : "var(--shadow-glass)";
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      position: "relative",
      background: bg,
      border: "1px solid var(--glass-stroke)",
      boxShadow: "var(--refraction-edge), " + shadow,
      borderRadius: radius,
      padding: padding,
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-md)) saturate(var(--saturate-glass))"
    }
  }), specular ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "inherit",
      background: "var(--specular)",
      pointerEvents: "none"
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, children));
}
Object.assign(__ds_scope, { GlassPanel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/GlassPanel.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function Card({
  eyebrow,
  title,
  subtitle,
  tint = "none",
  footer,
  hoverable = true,
  onClick,
  style,
  children
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      transform: hover && hoverable ? "translateY(-4px) scale(1.01)" : "none",
      transition: "transform var(--duration-base) var(--ease-spring)",
      cursor: onClick ? "pointer" : "default"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.GlassPanel, {
    tint: tint,
    strength: hover && hoverable ? "strong" : "default",
    onClick: onClick,
    style: style
  }, eyebrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      marginBottom: "var(--space-2)"
    }
  }, eyebrow) : null, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-lg)",
      fontWeight: "var(--weight-bold)",
      letterSpacing: "var(--tracking-heading)",
      color: "var(--text-primary)",
      lineHeight: "var(--leading-snug)"
    }
  }, title) : null, subtitle ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)",
      marginTop: "var(--space-1)"
    }
  }, subtitle) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: title ? "var(--space-4)" : 0
    }
  }, children) : null, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--space-4)",
      paddingTop: "var(--space-4)",
      borderTop: "1px solid var(--glass-stroke)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-3)"
    }
  }, footer) : null));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// ui_kits/coding-app/AppShell.jsx
try { (() => {
// Barra de navegacion flotante + iconos compartidos del kit
const KIT = window.CodingDesignSystem_2ecb3a;
function KIcon({
  d,
  size = 15
}) {
  return /*#__PURE__*/React.createElement("svg", {
    width: size,
    height: size,
    viewBox: "0 0 16 16",
    fill: "none"
  }, /*#__PURE__*/React.createElement("path", {
    d: d,
    stroke: "currentColor",
    strokeWidth: "1.7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }));
}
const ICONS = {
  search: "M11.5 11.5L14 14M12 7A5 5 0 112 7a5 5 0 0110 0z",
  flame: "M8 1.5c1 2.5 4 3.5 4 7a4 4 0 01-8 0c0-1.5.6-2.6 1.4-3.6C6 6.2 7.5 4.5 8 1.5z",
  back: "M10 3L5 8l5 5",
  play: "M5 3.5v9l7.5-4.5L5 3.5z",
  check: "M3 8.5L6.5 12L13 4.5",
  lock: "M4.5 7V5a3.5 3.5 0 017 0v2M3.5 7h9v6.5h-9V7z",
  book: "M2.5 3.5h4.2c.7 0 1.3.6 1.3 1.3V13c0-.7-.6-1.3-1.3-1.3H2.5V3.5zM13.5 3.5H9.3c-.7 0-1.3.6-1.3 1.3V13c0-.7.6-1.3 1.3-1.3h4.2V3.5z"
};
function NavBar({
  onHome,
  tab,
  setTab,
  user
}) {
  const {
    Tabs,
    IconButton,
    Badge
  } = KIT;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 20,
      zIndex: 40,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 20,
      padding: "10px 12px 10px 24px",
      borderRadius: "var(--radius-pill)",
      background: "rgba(16, 23, 44, 0.6)",
      border: "1px solid var(--glass-stroke)",
      boxShadow: "var(--refraction-edge), var(--shadow-glass)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": true,
    style: {
      position: "absolute",
      inset: 0,
      zIndex: -1,
      borderRadius: "inherit",
      WebkitBackdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))",
      backdropFilter: "blur(var(--blur-lg)) saturate(var(--saturate-glass))"
    }
  }), /*#__PURE__*/React.createElement("div", {
    onClick: onHome,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 22,
      fontWeight: "var(--weight-heavy)",
      letterSpacing: "var(--tracking-display)",
      color: "var(--text-primary)"
    }
  }, "Coding"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 4,
      height: 18,
      borderRadius: 3,
      background: "var(--accent-cyan)",
      boxShadow: "0 0 10px var(--accent-cyan)"
    }
  })), /*#__PURE__*/React.createElement(Tabs, {
    size: "sm",
    value: tab,
    onChange: setTab,
    style: {
      width: 380
    },
    items: [{
      id: "inicio",
      label: "Inicio"
    }, {
      id: "materias",
      label: "Materias"
    }, {
      id: "progreso",
      label: "Progreso"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Buscar",
    size: "sm",
    variant: "ghost"
  }, /*#__PURE__*/React.createElement(KIcon, {
    d: ICONS.search
  })), /*#__PURE__*/React.createElement(Badge, {
    tone: "amber",
    dot: true
  }, user.streak, " dias"), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 36,
      height: 36,
      borderRadius: 99,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(180deg, #6FA0E0, #4E86D6)",
      border: "1px solid rgba(255,255,255,0.4)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 14px rgba(94,151,230,0.35)",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--text-on-accent)"
    }
  }, user.initials)));
}
function PageFrame({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1160,
      margin: "0 auto",
      padding: "20px 32px 64px"
    }
  }, children);
}
Object.assign(window, {
  KIcon,
  ICONS,
  NavBar,
  PageFrame
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/coding-app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/coding-app/CourseScreen.jsx
try { (() => {
const KITC = window.CodingDesignSystem_2ecb3a;
function LessonRow({
  lesson,
  onOpen
}) {
  const {
    Badge
  } = KITC;
  const [hover, setHover] = React.useState(false);
  const clickable = !lesson.done || lesson.current;
  return /*#__PURE__*/React.createElement("div", {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick: () => onOpen(lesson),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "12px 16px",
      borderRadius: "var(--radius-md)",
      cursor: "pointer",
      background: hover ? "var(--glass-bg-strong)" : lesson.current ? "var(--glass-tint-cyan)" : "transparent",
      border: "1px solid " + (lesson.current ? "rgba(82,201,184,0.35)" : hover ? "var(--glass-stroke)" : "transparent"),
      transition: "all var(--duration-fast) var(--ease-glass)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      borderRadius: 99,
      flexShrink: 0,
      background: lesson.done ? "linear-gradient(180deg, #58CFA0, #3DB27E)" : "var(--glass-bg)",
      border: "1px solid " + (lesson.done ? "rgba(255,255,255,0.35)" : "var(--glass-stroke-strong)"),
      boxShadow: lesson.done ? "0 0 12px rgba(76,199,147,0.35)" : "var(--refraction-edge)",
      color: lesson.done ? "#03160C" : "var(--text-tertiary)"
    }
  }, lesson.done ? /*#__PURE__*/React.createElement(KIcon, {
    d: ICONS.check,
    size: 13
  }) : /*#__PURE__*/React.createElement(KIcon, {
    d: ICONS.play,
    size: 12
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-base)",
      fontWeight: 500,
      color: "var(--text-primary)"
    }
  }, lesson.title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-tertiary)",
      marginTop: 1
    }
  }, lesson.mins, " min")), lesson.current ? /*#__PURE__*/React.createElement(Badge, {
    tone: "cyan",
    dot: true
  }, "SIGUIENTE") : null);
}
function CourseScreen({
  data,
  onBack,
  onOpenLesson,
  tab,
  setTab
}) {
  const {
    GlassPanel,
    Badge,
    Progress,
    Button,
    IconButton
  } = KITC;
  const course = data.courses[0];
  return /*#__PURE__*/React.createElement(PageFrame, null, /*#__PURE__*/React.createElement(NavBar, {
    onHome: onBack,
    tab: tab,
    setTab: setTab,
    user: data.user
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      margin: "36px 0 20px"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Volver",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(KIcon, {
    d: ICONS.back
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-tertiary)"
    }
  }, "Materias / Bases de datos I")), /*#__PURE__*/React.createElement(GlassPanel, {
    tint: "cyan",
    padding: "var(--space-7)",
    radius: "var(--radius-xl)",
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "cyan",
    dot: true
  }, "EN CURSO"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "12px 0 6px",
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-3xl)",
      fontWeight: 800,
      letterSpacing: "var(--tracking-display)",
      color: "var(--text-primary)"
    }
  }, course.title), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--text-md)",
      color: "var(--text-secondary)",
      maxWidth: 560
    }
  }, "Domina tablas, claves, consultas SQL y normalizacion \u2014 la base de todo sistema de informacion."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Button, {
    iconLeft: /*#__PURE__*/React.createElement(KIcon, {
      d: ICONS.play
    }),
    onClick: () => onOpenLesson(data.units[1].lessons[1])
  }, "Continuar leccion"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconLeft: /*#__PURE__*/React.createElement(KIcon, {
      d: ICONS.book
    })
  }, "Ver temario completo"))), /*#__PURE__*/React.createElement(Progress, {
    value: course.progress,
    shape: "ring",
    tone: "cyan",
    size: "lg",
    showLabel: true
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 16
    }
  }, data.units.map(u => /*#__PURE__*/React.createElement(GlassPanel, {
    key: u.name,
    padding: "var(--space-5)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      margin: "0 4px 10px"
    }
  }, u.name), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 4
    }
  }, u.lessons.map(l => /*#__PURE__*/React.createElement(LessonRow, {
    key: l.id,
    lesson: l,
    onOpen: onOpenLesson
  })))))));
}
Object.assign(window, {
  CourseScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/coding-app/CourseScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/coding-app/DashboardScreen.jsx
try { (() => {
const KITD = window.CodingDesignSystem_2ecb3a;
function StatPanel({
  label,
  value,
  sub,
  tone
}) {
  const {
    GlassPanel
  } = KITD;
  return /*#__PURE__*/React.createElement(GlassPanel, {
    tint: tone,
    padding: "var(--space-5)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-2xl)",
      fontWeight: 800,
      color: "var(--text-primary)",
      marginTop: 4,
      fontVariantNumeric: "tabular-nums"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-secondary)",
      marginTop: 2
    }
  }, sub));
}
function CourseCard({
  course,
  onOpen
}) {
  const {
    Card,
    Badge,
    Progress,
    Button
  } = KITD;
  const locked = course.status === "BLOQUEADO";
  const toneMap = {
    "EN CURSO": "cyan",
    "NUEVO": "blue",
    "COMPLETADO": "success",
    "BLOQUEADO": "neutral"
  };
  return /*#__PURE__*/React.createElement(Card, {
    eyebrow: course.subject,
    title: course.title,
    subtitle: course.lessons + " lecciones · " + course.hours + " h",
    tint: locked ? "none" : course.subjectTone === "amber" ? "none" : course.subjectTone,
    hoverable: !locked,
    onClick: locked ? undefined : () => onOpen(course),
    style: {
      opacity: locked ? 0.55 : 1
    },
    footer: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%"
      }
    }, /*#__PURE__*/React.createElement(Badge, {
      tone: toneMap[course.status],
      dot: course.status === "EN CURSO"
    }, locked ? /*#__PURE__*/React.createElement(KIcon, {
      d: ICONS.lock,
      size: 11
    }) : null, course.status), !locked && course.progress < 100 ? /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      variant: course.progress > 0 ? "primary" : "secondary",
      onClick: () => onOpen(course)
    }, course.progress > 0 ? "Continuar" : "Empezar") : null)
  }, /*#__PURE__*/React.createElement(Progress, {
    value: course.progress,
    tone: course.status === "COMPLETADO" ? "success" : course.subjectTone === "amber" ? "blue" : course.subjectTone,
    showLabel: true
  }));
}
function DashboardScreen({
  data,
  onOpenCourse,
  tab,
  setTab
}) {
  const {
    Button
  } = KITD;
  const current = data.courses[0];
  return /*#__PURE__*/React.createElement(PageFrame, null, /*#__PURE__*/React.createElement(NavBar, {
    onHome: () => {},
    tab: tab,
    setTab: setTab,
    user: data.user
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 24,
      margin: "44px 4px 24px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-3xl)",
      fontWeight: 800,
      letterSpacing: "var(--tracking-display)",
      color: "var(--text-primary)"
    }
  }, "Hola, ", data.user.name.split(" ")[0]), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontSize: "var(--text-md)",
      color: "var(--text-secondary)"
    }
  }, "Continua donde quedaste: ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--text-primary)"
    }
  }, current.title))), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    iconLeft: /*#__PURE__*/React.createElement(KIcon, {
      d: ICONS.play
    }),
    onClick: () => onOpenCourse(current)
  }, "Continuar leccion")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 16,
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement(StatPanel, {
    label: "Racha",
    value: data.user.streak + " dias",
    sub: "Tu mejor racha: 12 dias",
    tone: "none"
  }), /*#__PURE__*/React.createElement(StatPanel, {
    label: "XP total",
    value: data.user.xp.toLocaleString("es"),
    sub: "+150 esta semana",
    tone: "blue"
  }), /*#__PURE__*/React.createElement(StatPanel, {
    label: "Materias activas",
    value: "4",
    sub: "1 completada \xB7 1 bloqueada",
    tone: "cyan"
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: "0 4px 16px",
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-xl)",
      fontWeight: 700,
      letterSpacing: "var(--tracking-heading)",
      color: "var(--text-primary)"
    }
  }, "Tus materias"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 16
    }
  }, data.courses.map(c => /*#__PURE__*/React.createElement(CourseCard, {
    key: c.id,
    course: c,
    onOpen: onOpenCourse
  }))));
}
Object.assign(window, {
  DashboardScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/coding-app/DashboardScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/coding-app/LessonScreen.jsx
try { (() => {
const KITX = window.CodingDesignSystem_2ecb3a;
function CodeBlock({
  lines
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13.5,
      lineHeight: 1.7,
      background: "rgba(3,6,16,0.55)",
      border: "1px solid var(--glass-stroke)",
      borderRadius: "var(--radius-sm)",
      padding: "14px 18px",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)"
    }
  }, lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    dangerouslySetInnerHTML: {
      __html: l
    }
  })));
}
function LessonScreen({
  data,
  onBack,
  tab,
  setTab
}) {
  const {
    GlassPanel,
    Badge,
    Button,
    Radio,
    Dialog,
    Toast,
    IconButton,
    Progress
  } = KITX;
  const [answer, setAnswer] = React.useState(-1);
  const [result, setResult] = React.useState(null);
  const [toast, setToast] = React.useState(false);
  const quiz = data.quiz;
  const send = () => setResult(answer === quiz.correct ? "ok" : "bad");
  const finish = () => {
    setResult(null);
    setToast(true);
    setTimeout(() => setToast(false), 3200);
  };
  const K = "color: var(--accent-violet)",
    S = "color: var(--accent-cyan)",
    N = "color: var(--accent-amber)";
  return /*#__PURE__*/React.createElement(PageFrame, null, /*#__PURE__*/React.createElement(NavBar, {
    onHome: onBack,
    tab: tab,
    setTab: setTab,
    user: data.user
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      margin: "36px 0 20px"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    label: "Volver",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(KIcon, {
    d: ICONS.back
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--text-tertiary)"
    }
  }, "Bases de datos I / Unidad 2"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 220
    }
  }, /*#__PURE__*/React.createElement(Progress, {
    value: 45,
    tone: "cyan",
    size: "sm"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--text-xs)",
      color: "var(--text-tertiary)"
    }
  }, "Leccion 5 de 12")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1.2fr 1fr",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(GlassPanel, {
    padding: "var(--space-7)",
    radius: "var(--radius-xl)"
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "cyan"
  }, "LECCION 5"), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "12px 0 10px",
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-2xl)",
      fontWeight: 800,
      letterSpacing: "var(--tracking-heading)",
      color: "var(--text-primary)"
    }
  }, "Consultas SELECT y WHERE"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 14px",
      fontSize: "var(--text-base)",
      color: "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("code", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--accent-cyan)"
    }
  }, "SELECT"), " recupera columnas de una tabla; ", /*#__PURE__*/React.createElement("code", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--accent-cyan)"
    }
  }, "WHERE"), " filtra las filas que cumplen una condicion. Puedes ordenar el resultado con ", /*#__PURE__*/React.createElement("code", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--accent-cyan)"
    }
  }, "ORDER BY"), "."), /*#__PURE__*/React.createElement(CodeBlock, {
    lines: ['<span style="color: var(--text-tertiary)">-- Estudiantes con promedio superior a 4.0</span>', '<span style="' + K + '">SELECT</span> nombre, promedio <span style="' + K + '">FROM</span> estudiantes', '<span style="' + K + '">WHERE</span> promedio &gt; <span style="' + N + '">4.0</span>', '<span style="' + K + '">ORDER BY</span> promedio <span style="' + K + '">DESC</span>;']
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "14px 0 0",
      fontSize: "var(--text-sm)",
      color: "var(--text-tertiary)"
    }
  }, "La condicion del WHERE se evalua fila por fila antes de proyectar las columnas del SELECT.")), /*#__PURE__*/React.createElement(GlassPanel, {
    tint: "blue",
    padding: "var(--space-6)",
    radius: "var(--radius-xl)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-xs)",
      fontWeight: 600,
      letterSpacing: "var(--tracking-caps)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)",
      marginBottom: 10
    }
  }, "Comprueba lo aprendido"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 16px",
      fontSize: "var(--text-base)",
      fontWeight: 500,
      color: "var(--text-primary)"
    }
  }, quiz.question), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginBottom: 20
    }
  }, quiz.options.map((o, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    onClick: () => setAnswer(i),
    style: {
      padding: "12px 14px",
      borderRadius: "var(--radius-md)",
      background: answer === i ? "var(--glass-bg-strong)" : "var(--glass-bg-subtle)",
      border: "1px solid " + (answer === i ? "var(--focus-ring)" : "var(--glass-stroke)"),
      cursor: "pointer",
      transition: "all var(--duration-fast) var(--ease-glass)"
    }
  }, /*#__PURE__*/React.createElement(Radio, {
    name: "quiz",
    checked: answer === i,
    onChange: () => setAnswer(i),
    label: /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 12.5
      }
    }, o)
  })))), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    disabled: answer < 0,
    onClick: send
  }, "Enviar respuesta"))), /*#__PURE__*/React.createElement(Dialog, {
    open: result !== null,
    onClose: () => setResult(null),
    title: result === "ok" ? "¡Correcto!" : "No exactamente",
    footer: result === "ok" ? /*#__PURE__*/React.createElement(Button, {
      onClick: finish
    }, "Continuar") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: () => setResult(null)
    }, "Revisar leccion"), /*#__PURE__*/React.createElement(Button, {
      onClick: () => setResult(null)
    }, "Intentar de nuevo"))
  }, result === "ok" ? /*#__PURE__*/React.createElement("span", null, "WHERE filtra y ORDER BY ... DESC ordena de mayor a menor. Ganaste ", /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--accent-cyan)"
    }
  }, "+50 XP"), ".") : /*#__PURE__*/React.createElement("span", null, "Recuerda: la clausula ", /*#__PURE__*/React.createElement("code", {
    style: {
      fontFamily: "var(--font-mono)",
      color: "var(--accent-cyan)"
    }
  }, "WHERE"), " va despues de ", /*#__PURE__*/React.createElement("code", {
    style: {
      fontFamily: "var(--font-mono)",
      color: "var(--accent-cyan)"
    }
  }, "FROM"), " y necesitas ", /*#__PURE__*/React.createElement("code", {
    style: {
      fontFamily: "var(--font-mono)",
      color: "var(--accent-cyan)"
    }
  }, "DESC"), " para ordenar de mayor a menor.")), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "fixed",
      bottom: 28,
      right: 28,
      zIndex: 90
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    title: "Leccion completada",
    description: "+50 XP en Bases de datos I",
    onClose: () => setToast(false)
  })) : null);
}
Object.assign(window, {
  LessonScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/coding-app/LessonScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/coding-app/LoginScreen.jsx
try { (() => {
const KITL = window.CodingDesignSystem_2ecb3a;
function LoginScreen({
  onLogin
}) {
  const {
    GlassPanel,
    Input,
    Button,
    Checkbox
  } = KITL;
  const [remember, setRemember] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 32
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 420
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginBottom: 28
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 44,
      fontWeight: "var(--weight-heavy)",
      letterSpacing: "var(--tracking-display)",
      color: "var(--text-primary)",
      lineHeight: 1
    }
  }, "Coding", /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-block",
      width: 5,
      height: 34,
      marginLeft: 8,
      borderRadius: 3,
      background: "var(--accent-cyan)",
      boxShadow: "0 0 14px var(--accent-cyan)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      fontSize: "var(--text-base)",
      color: "var(--text-secondary)"
    }
  }, "Aprende Ingenieria de Software, una leccion a la vez")), /*#__PURE__*/React.createElement(GlassPanel, {
    strength: "strong",
    padding: "var(--space-7)",
    radius: "var(--radius-xl)"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: "var(--space-5)"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    label: "Correo institucional",
    placeholder: "tu@universidad.edu",
    iconLeft: /*#__PURE__*/React.createElement(KIcon, {
      d: "M2.5 4.5h11v7h-11v-7zM2.5 5l5.5 4 5.5-4"
    })
  }), /*#__PURE__*/React.createElement(Input, {
    label: "Contrasena",
    type: "password",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
    iconLeft: /*#__PURE__*/React.createElement(KIcon, {
      d: ICONS.lock
    })
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    checked: remember,
    onChange: setRemember,
    label: "Recordarme"
  }), /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault(),
    style: {
      fontSize: "var(--text-sm)"
    }
  }, "\xBFOlvidaste tu contrasena?")), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    size: "lg",
    onClick: onLogin
  }, "Entrar"), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      fontSize: "var(--text-sm)",
      color: "var(--text-tertiary)"
    }
  }, "\xBFPrimera vez? ", /*#__PURE__*/React.createElement("a", {
    href: "#",
    onClick: e => e.preventDefault()
  }, "Crea tu cuenta"))))));
}
Object.assign(window, {
  LoginScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/coding-app/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/coding-app/data.js
try { (() => {
// Datos de ejemplo — Coding app
window.CODING_DATA = {
  user: {
    name: "Juan Jose",
    initials: "JS",
    xp: 2450,
    streak: 7
  },
  courses: [{
    id: "bd1",
    subject: "Bases de datos I",
    subjectTone: "cyan",
    title: "Modelo relacional",
    lessons: 12,
    hours: 4,
    progress: 68,
    status: "EN CURSO"
  }, {
    id: "prog2",
    subject: "Programacion II",
    subjectTone: "blue",
    title: "Herencia y polimorfismo",
    lessons: 9,
    hours: 3,
    progress: 12,
    status: "NUEVO"
  }, {
    id: "algo",
    subject: "Algoritmos",
    subjectTone: "violet",
    title: "Recursion y complejidad",
    lessons: 14,
    hours: 5,
    progress: 45,
    status: "EN CURSO"
  }, {
    id: "bd2",
    subject: "Bases de datos II",
    subjectTone: "cyan",
    title: "Transacciones y triggers",
    lessons: 10,
    hours: 4,
    progress: 0,
    status: "BLOQUEADO"
  }, {
    id: "prog1",
    subject: "Programacion I",
    subjectTone: "blue",
    title: "Fundamentos y control de flujo",
    lessons: 16,
    hours: 6,
    progress: 100,
    status: "COMPLETADO"
  }, {
    id: "web",
    subject: "Desarrollo web",
    subjectTone: "amber",
    title: "HTML, CSS y JavaScript",
    lessons: 18,
    hours: 7,
    progress: 30,
    status: "EN CURSO"
  }],
  units: [{
    name: "Unidad 1 · Introduccion a las bases de datos",
    lessons: [{
      id: "l1",
      title: "Que es un SGBD",
      mins: 12,
      done: true
    }, {
      id: "l2",
      title: "Tablas, filas y columnas",
      mins: 15,
      done: true
    }, {
      id: "l3",
      title: "Claves primarias y foraneas",
      mins: 18,
      done: true
    }]
  }, {
    name: "Unidad 2 · El modelo relacional",
    lessons: [{
      id: "l4",
      title: "Relaciones 1:1, 1:N y N:M",
      mins: 20,
      done: true
    }, {
      id: "l5",
      title: "Consultas SELECT y WHERE",
      mins: 22,
      done: false,
      current: true
    }, {
      id: "l6",
      title: "JOIN entre tablas",
      mins: 25,
      done: false
    }, {
      id: "l7",
      title: "Normalizacion: 1FN a 3FN",
      mins: 28,
      done: false
    }]
  }],
  quiz: {
    question: "Tienes la tabla estudiantes(nombre, promedio). ¿Que consulta devuelve los estudiantes con promedio mayor a 4.0, ordenados de mayor a menor?",
    options: ["SELECT nombre FROM estudiantes ORDER BY promedio;", "SELECT nombre, promedio FROM estudiantes WHERE promedio > 4.0 ORDER BY promedio DESC;", "SELECT * WHERE promedio > 4.0 FROM estudiantes;", "FILTER estudiantes BY promedio > 4.0;"],
    correct: 1
  }
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/coding-app/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Progress = __ds_scope.Progress;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Tabs = __ds_scope.Tabs;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.GlassPanel = __ds_scope.GlassPanel;

})();

function Orb({ size = 56, mood = "idle", style }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (mood === "celebrate" && ref.current && window.FX) {
      const r = ref.current.getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height / 2, 18);
    }
  }, [mood]);
  return (
    <div ref={ref} className={"orb" + (mood !== "idle" ? " orb--" + mood : "")} style={{ width: size, height: size, ...style }}>
      <span className="orb__layer orb__layer--blue"></span>
      <span className="orb__layer orb__layer--cyan"></span>
      <span className="orb__layer orb__layer--violet"></span>
      <span className="orb__core"></span>
    </div>
  );
}
Object.assign(window, { Orb });

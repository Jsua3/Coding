const KITA = window.CodingDesignSystem_2ecb3a;

function App() {
  const { Toast } = KITA;
  const [route, setRoute] = React.useState({ screen: API.token ? "loading" : "login" });
  const [me, setMe] = React.useState(null);
  const [tab, setTab] = React.useState("inicio");
  const [toast, setToast] = React.useState(null);
  const toastTimer = React.useRef(null);

  const showToast = (t) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  };

  const [achQueue, setAchQueue] = React.useState([]);
  const achTimer = React.useRef(null);
  // Dos requests concurrentes completando la misma lección pueden anunciar el mismo logro dos
  // veces (la que pierde la carrera ER_DUP_ENTRY lee un set "después" que ya lo contiene). El
  // servidor no puede saber qué ya anunció la otra request, así que deduplicamos aquí, donde vive
  // la ceremonia. Vive en App (no en una screen) porque debe sobrevivir a un remount de LessonScreen.
  const announcedAch = React.useRef(new Set());
  React.useEffect(() => () => clearTimeout(achTimer.current), []);

  // Si la respuesta completó la lección, la celebración se lleva la escena: el toast espera 900ms
  // para no pisar el bloom.
  const showAchievements = (lista, trasCelebracion) => {
    if (!lista || !lista.length) return;
    const nuevos = lista.filter((a) => !announcedAch.current.has(a.id));
    if (!nuevos.length) return;
    nuevos.forEach((a) => announcedAch.current.add(a.id));
    clearTimeout(achTimer.current);
    achTimer.current = setTimeout(() => setAchQueue((q) => [...q, ...nuevos]), trasCelebracion ? 900 : 0);
  };

  const loadMe = async () => {
    try {
      const data = await API.get("/me");
      setMe(data);
      setRoute((r) => (r.screen === "loading" ? { screen: "dashboard" } : r));
    } catch {
      API.setToken(null);
      setRoute({ screen: "login" });
    }
  };

  React.useEffect(() => {
    API.onUnauthorized = () => { setMe(null); setRoute({ screen: "login" }); };
    if (API.token) loadMe();
  }, []);

  const go = {
    dashboard: () => { setRoute({ screen: "dashboard" }); loadMe(); },
    course: (courseId) => setRoute({ screen: "course", courseId }),
    lesson: (courseId, lessonId) => setRoute({ screen: "lesson", courseId, lessonId }),
    review: () => setRoute({ screen: "review" }),
  };

  // Las pestañas SON navegación: cambiar de pestaña te devuelve al área principal desde donde estés.
  const goTab = (id) => { setTab(id); setRoute({ screen: "dashboard" }); };

  let screen;
  if (route.screen === "login") {
    screen = <LoginScreen onLoggedIn={() => { setRoute({ screen: "loading" }); loadMe(); }} />;
  } else if (route.screen === "loading" || !me) {
    screen = <LoadingPanel />;
  } else if (route.screen === "course") {
    screen = <CourseScreen me={me} courseId={route.courseId} tab={tab} setTab={goTab}
      onBack={go.dashboard} onOpenLesson={(lessonId) => go.lesson(route.courseId, lessonId)} />;
  } else if (route.screen === "lesson") {
    screen = <LessonScreen key={route.lessonId} me={me} courseId={route.courseId} lessonId={route.lessonId} tab={tab} setTab={goTab}
      onBack={() => go.course(route.courseId)} onOpenLesson={(lessonId) => go.lesson(route.courseId, lessonId)}
      showToast={showToast} showAchievements={showAchievements} refreshMe={loadMe} />;
  } else if (route.screen === "review") {
    screen = <ReviewScreen me={me} tab={tab} setTab={goTab} onBack={go.dashboard} showAchievements={showAchievements} refreshMe={loadMe} />;
  } else {
    const comun = { me, tab, setTab: goTab };
    screen = tab === "materias"
      ? <MateriasScreen {...comun} onOpenCourse={(id) => go.course(id)} />
      : tab === "progreso"
      ? <ProgressScreen {...comun} />
      : <InicioScreen {...comun}
          onOpenLesson={(courseId, lessonId) => go.lesson(courseId, lessonId)}
          onOpenReview={go.review} />;
  }

  return (
    <React.Fragment>
      <span aria-hidden className="lg-noise"></span>
      <div key={route.screen + ":" + tab + ":" + (route.lessonId || route.courseId || "")} className="anim-screen-in">
        {screen}
      </div>
      {toast ? (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 90 }}>
          <Toast tone={toast.tone} title={toast.title} description={toast.description} onClose={() => setToast(null)} />
        </div>
      ) : null}
      <AchievementToast achievement={achQueue[0] || null} onDone={() => setAchQueue((q) => q.slice(1))} />
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

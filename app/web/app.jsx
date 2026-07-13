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

  let screen;
  if (route.screen === "login") {
    screen = <LoginScreen onLoggedIn={() => { setRoute({ screen: "loading" }); loadMe(); }} />;
  } else if (route.screen === "loading" || !me) {
    screen = <LoadingPanel />;
  } else if (route.screen === "course") {
    screen = <CourseScreen me={me} courseId={route.courseId} tab={tab} setTab={setTab}
      onBack={go.dashboard} onOpenLesson={(lessonId) => go.lesson(route.courseId, lessonId)} />;
  } else if (route.screen === "lesson") {
    screen = <LessonScreen me={me} courseId={route.courseId} lessonId={route.lessonId} tab={tab} setTab={setTab}
      onBack={() => go.course(route.courseId)} onOpenLesson={(lessonId) => go.lesson(route.courseId, lessonId)}
      showToast={showToast} refreshMe={loadMe} />;
  } else if (route.screen === "review") {
    screen = <ReviewScreen me={me} tab={tab} setTab={setTab} onBack={go.dashboard} refreshMe={loadMe} />;
  } else {
    screen = <DashboardScreen me={me} tab={tab} setTab={setTab}
      onOpenCourse={(id) => go.course(id)} onOpenLesson={(courseId, lessonId) => go.lesson(courseId, lessonId)}
      onOpenReview={go.review} />;
  }

  return (
    <React.Fragment>
      <div key={route.screen + ":" + (route.lessonId || route.courseId || "")} className="anim-screen-in">
        {screen}
      </div>
      {toast ? (
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 90 }}>
          <Toast tone={toast.tone} title={toast.title} description={toast.description} onClose={() => setToast(null)} />
        </div>
      ) : null}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

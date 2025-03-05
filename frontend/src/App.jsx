import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { AuthContext } from "./components/Auth/AuthContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute.jsx";
import MapPage from "./pages/MapPage";
import StopTimeEditPage from "./pages/StopTimeEditPage";
import StopTimeAddPage from "./pages/StopTimeAddPage";
import TripAddPage from "./pages/TripAddPage";
import TripEditPage from "./pages/TripEditPage";
import RouteAddPage from "./pages/RouteAddPage";
import RouteEditPage from "./pages/RouteEditPage";
import ImportPage from "./pages/ImportPage"; // Yeni eklenen sayfa
import ProjectsPage from "./pages/ProjectsPage"; // Yeni eklenen sayfa
import AuthPage from "./pages/AuthPage";
import Header from "./components/Header";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/Layout.css";
import { useNavigate } from "react-router-dom";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

const AppContent = () => {
  const { isLoggedOut, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedOut && !isAuthenticated) {
      navigate("/auth", { state: { isLogout: true }, replace: true });
    }
  }, [isLoggedOut, isAuthenticated, navigate]);

  return (
    <div className="app-container">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/import"
            element={
              <ProtectedRoute>
                <ImportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <ProjectsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/map/:project_id"
            element={
              <ProtectedRoute>
                <MapPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-stop-time/:project_id/:trip_id/:stop_id"
            element={
              <ProtectedRoute>
                <StopTimeEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-stop-time/:project_id/:trip_id"
            element={
              <ProtectedRoute>
                <StopTimeAddPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-trip/:project_id"
            element={
              <ProtectedRoute>
                <TripAddPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-trip/:project_id/:trip_id"
            element={
              <ProtectedRoute>
                <TripEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-route/:project_id"
            element={
              <ProtectedRoute>
                <RouteAddPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-route/:project_id/:route_id"
            element={
              <ProtectedRoute>
                <RouteEditPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<div>404 - Sayfa Bulunamadı</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

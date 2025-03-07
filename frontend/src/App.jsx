import { useState } from "react";
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
import ImportPage from "./pages/ImportPage";
import ProjectsPage from "./pages/ProjectsPage";
import AuthPage from "./pages/AuthPage";
import Header from "./components/Header";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/Layout.css";
import { useNavigate } from "react-router-dom";
import AdminPage from "./pages/admin/Index";
import AdminUsersPage from "./pages/admin/Users";
import AdminProjectsPage from "./pages/admin/Projects";

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
  const [calendars, setCalendars] = useState([]);
  const [agencies, setAgencies] = useState([]);

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
                <MapPage
                  calendars={calendars}
                  setCalendars={setCalendars}
                  agencies={agencies}
                  setAgencies={setAgencies}
                />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>}>
            <Route index element={<Navigate replace to="users" />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="*" element={<div>404 - Sayfa Bulunamadı</div>} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

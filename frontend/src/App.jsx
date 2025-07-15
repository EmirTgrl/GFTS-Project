import { useState } from "react";
import "./i18n";
import "./styles/tailwind.css";
import "flag-icons/css/flag-icons.min.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useContext, useEffect } from "react";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { AuthContext } from "./components/Auth/AuthContext";
import {
  ProtectedRoute,
  AdminProtectedRoute,
} from "./components/Auth/ProtectedRoute";
import MapPage from "./pages/MapPage";
import ImportPage from "./pages/ImportPage";
import ProjectsPage from "./pages/ProjectsPage";
import AuthPage from "./pages/AuthPage";
import Header from "./components/Header";
import AdminPage from "./pages/admin/Index";
import AdminUsersPage from "./pages/admin/Users";
import AdminProjectsPage from "./pages/admin/Projects";
import AccountSettings from "./pages/AccountSettings";
import ForgotPassword from "./components/Auth/ForgotPassword";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/Layout.css";
import { useNavigate } from "react-router-dom";
import AdminRoles from "./pages/admin/Roles";
import AdminVersions from "./pages/admin/Versions";

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
          <Route path="/forgot-password" element={<ForgotPassword />} />{" "}
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
          <Route
            path="/account-settings"
            element={
              <ProtectedRoute>
                <AccountSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminPage />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate replace to="users" />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="projects" element={<AdminProjectsPage />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="versions" element={<AdminVersions />} />
          </Route>
          <Route path="*" element={<div>404 - Page Not Found</div>} />
          <Route path="/" element={<Navigate to="/auth" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

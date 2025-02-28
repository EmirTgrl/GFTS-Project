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
import HomePage from "./pages/HomePage";
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
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
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
          <Route path="/" element={<Navigate to="/auth" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;

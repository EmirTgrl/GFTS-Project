import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useContext } from "react";
import { AuthProvider } from "./components/Auth/AuthProvider";
import { AuthContext } from "./components/Auth/AuthContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute.jsx";
import MapPage from "./pages/MapPage";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import Header from "./components/Header";
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/Layout.css";

const RedirectHandler = () => {
  const { isAuthenticated } = useContext(AuthContext);
  return isAuthenticated ? (
    <Navigate to="/home" replace />
  ) : (
    <Navigate to="/auth" replace />
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Header />
          <main className="main-content">
            <Routes>
              <Route
                path="/auth"
                element={
                  <AuthContext.Consumer>
                    {({ isAuthenticated }) =>
                      isAuthenticated ? (
                        <Navigate to="/home" replace />
                      ) : (
                        <AuthPage />
                      )
                    }
                  </AuthContext.Consumer>
                }
              />
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
              <Route path="/" element={<RedirectHandler />} />
              <Route path="*" element={<RedirectHandler />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

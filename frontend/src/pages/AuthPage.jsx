import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext.js";
import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import "../styles/AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedOut } = useContext(AuthContext);

  useEffect(() => {
    if (location.state?.isLogin !== undefined) {
      setIsLogin(location.state.isLogin);
    }
    if (isLoggedOut) {
      setIsLogin(true); 
      navigate("/auth", { state: { isLogin: true, isLogout: true } });
    }
  }, [location.state, isLoggedOut, navigate]);

  const toggleForm = (formType) => {
    setIsLogin(formType);
    navigate("/auth", { state: { isLogin: formType } });
  };

  return (
    <div className="auth-page">
      {isLogin ? (
        <Login switchToRegister={() => toggleForm(false)} />
      ) : (
        <Register switchToLogin={() => toggleForm(true)} />
      )}
    </div>
  );
};

export default AuthPage;

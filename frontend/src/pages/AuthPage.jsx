import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import "../styles/AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const location = useLocation();

  useEffect(() => {
    if (location.state?.isLogin !== undefined) {
      setIsLogin(location.state.isLogin);
    }
  }, [location.state]);

  const toggleForm = (formType) => {
    setIsLogin(formType);
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

import { useState } from "react";
import Login from "../components/Auth/Login";
import Register from "../components/Auth/Register";
import "../styles/AuthPage.css";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-toggle">
        <button onClick={() => setIsLogin(true)}>Login</button>
        <button onClick={() => setIsLogin(false)}>Register</button>
      </div>
      {isLogin ? <Login /> : <Register />}
    </div>
  );
};

export default AuthPage;

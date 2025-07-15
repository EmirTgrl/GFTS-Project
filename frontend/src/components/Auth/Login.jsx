import { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.js";
import { Container, Form, Button, Alert } from "react-bootstrap";
import "../../styles/Login.css";
import { useTranslation } from "react-i18next";

const Login = ({ switchToRegister }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoggedOut } = useContext(AuthContext);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (isAuthenticated && !isLoggingIn) {
      navigate("/projects", { replace: true });
    }
  }, [isAuthenticated, isLoggingIn, navigate]);

  useEffect(() => {
    if (
      isLoggedOut &&
      !location.state?.isRegister &&
      !location.state?.message
    ) {
      setError(t("You have been logged out."));
    } else if (location.state?.isRegister) {
      setError(t("Registration successful! You can login."));
    } else if (location.state?.isLogout) {
      setError(t("You have been logged out."));
    } else if (location.state?.message) {
      setError(t(location.state.message)); // Şifre sıfırlama sonrası mesaj
    } else {
      setError("");
    }
  }, [isLoggedOut, location.state, t]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setError("");
    setIsLoggingIn(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        login(data.token);
      } else {
        setError(t("Invalid email or password!"));
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(t("An error occurred!"));
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  return (
    <Container className="auth-container">
      <div className="form-wrapper">
        <Form onSubmit={handleLogin}>
          <h2 className="title text-center">{t("Login")}</h2>
          {error && (
            <Alert
              variant={
                location.state?.isRegister || location.state?.message
                  ? "success"
                  : "danger"
              }
            >
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>{t("Email Address")}</Form.Label>
            <Form.Control
              className="input-field"
              type="email"
              placeholder={t("Enter your email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>{t("Password")}</Form.Label>
            <Form.Control
              className="input-field"
              type="password"
              placeholder={t("Enter your password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button
            className="styled-button"
            variant="primary"
            type="submit"
            disabled={isLoggingIn}
          >
            {t("Login")}
          </Button>

          <p className="switch-link text-center mt-3">
            {t("Forgot your password?")}{" "}
            <span className="link" onClick={handleForgotPassword}>
              {t("Reset Password")}
            </span>
          </p>

          <p className="switch-link text-center mt-3">
            {t("Don’t have an account?")}{" "}
            <span className="link" onClick={switchToRegister}>
              {t("Register here")}
            </span>
          </p>
        </Form>
      </div>
    </Container>
  );
};

Login.propTypes = {
  switchToRegister: PropTypes.func.isRequired,
};

export default Login;

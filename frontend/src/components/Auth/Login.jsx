import { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.js";
import { Container, Form, Button, Alert } from "react-bootstrap";
import "../../styles/Login.css";

const Login = ({ switchToRegister }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoggedOut } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated && !isLoggingIn) {
      navigate("/home", { replace: true });
    }
  }, [isAuthenticated, isLoggingIn, navigate]);
  useEffect(() => {
    if (isLoggedOut) {
      setError("You have been logged out.");
    } else if (location.state?.isRegister) {
      setError("Registration successful! You can login.");
    } else if (location.state?.isLogout) {
      setError("You have been logged out.");
    }
  }, [isLoggedOut, location.state]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isLoggingIn) return;

    setError("");
    setIsLoggingIn(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        const data = await response.json();
        login(data.token); // Token’ı AuthProvider’a gönder
        // Yönlendirme useEffect tarafından halledilecek
      } else {
        setError("Invalid email or password!");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("An error occurred!");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <Container className="auth-container">
      <div className="form-wrapper">
        <Form onSubmit={handleLogin}>
          <h2 className="title text-center">Login</h2>
          {error && (
            <Alert variant={location.state?.isRegister ? "success" : "danger"}>
              {error}
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              className="input-field"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control
              className="input-field"
              type="password"
              placeholder="Enter your password"
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
            Login
          </Button>

          <p className="switch-link text-center mt-3">
            Don’t have an account?{" "}
            <span className="link" onClick={switchToRegister}>
              Register here
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

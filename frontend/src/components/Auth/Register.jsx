import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert } from "react-bootstrap";
import "../../styles/Register.css";
import { useTranslation } from "react-i18next";

const Register = ({ switchToLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role_id: 1, version_id: 1 }),
      });
      if (response.ok) {
        navigate("/auth", { state: { isRegister: true, isLogin: true } });
      } else {
        const errorData = await response.json();
        setError(errorData.message || t("Registration failed!"));
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(t("An error occurred!"));
    }
  };

  return (
    <Container className="auth-container">
      <div className="form-wrapper">
        <Form onSubmit={handleRegister}>
          <h2 className="title text-center">{t("Register")}</h2>
          {error && <Alert variant="danger">{error}</Alert>}

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
              placeholder={t("Password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button className="styled-button" variant="primary" type="submit">
            {t("Register")}
          </Button>

          <p className="switch-link text-center mt-3">
            {t("Already have an account?")}{" "}
            <span className="link" onClick={switchToLogin}>
              {t("Login here")}
            </span>
          </p>
        </Form>
      </div>
    </Container>
  );
};

Register.propTypes = {
  switchToLogin: PropTypes.func.isRequired,
};

export default Register;

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert } from "react-bootstrap";
import "../../styles/Login.css";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("email"); // "email" veya "reset"
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setResetToken(data.resetToken);
        setMessage(data.message);
        setError("");
        setStep("reset");
      } else {
        setError(data.message || t("An error occurred!"));
        setMessage("");
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(t("An error occurred!"));
      setMessage("");
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setError("");
        setEmail("");
        setNewPassword("");
        setResetToken("");
        setTimeout(() => {
          navigate("/auth", {
            state: { message: t("Password reset successfully. Please login.") },
          });
        }, 2000);
      } else {
        setError(data.message || t("An error occurred!"));
        setMessage("");
      }
    } catch (err) {
      console.error("Reset password error:", err);
      setError(t("An error occurred!"));
      setMessage("");
    }
  };

  return (
    <Container className="auth-container">
      <div className="form-wrapper">
        {step === "email" ? (
          <Form onSubmit={handleEmailSubmit}>
            <h2 className="title text-center">{t("Forgot Password")}</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
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
            <Button className="styled-button" variant="primary" type="submit">
              {t("Continue")}
            </Button>
          </Form>
        ) : (
          <Form onSubmit={handlePasswordReset}>
            <h2 className="title text-center">{t("Reset Password")}</h2>
            {error && <Alert variant="danger">{error}</Alert>}
            {message && <Alert variant="success">{message}</Alert>}
            <Form.Group className="mb-3">
              <Form.Label>{t("New Password")}</Form.Label>
              <Form.Control
                className="input-field"
                type="password"
                placeholder={t("Enter new password")}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </Form.Group>
            <Button className="styled-button" variant="primary" type="submit">
              {t("Update Password")}
            </Button>
          </Form>
        )}
      </div>
    </Container>
  );
};

export default ForgotPassword;

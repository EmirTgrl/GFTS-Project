import { useContext, useState } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import { Container, Form, Button, Card, Alert } from "react-bootstrap";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { updateEmail, updatePassword } from "../api/accountApi.js";
import "bootstrap/dist/css/bootstrap.min.css";

const AccountSettings = () => {
  const { token, user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const result = await updateEmail(email, token);
      setSuccess(result.message);
      Swal.fire({
        icon: "success",
        title: t("Success"),
        text: result.message,
      });
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: err.message,
      });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const result = await updatePassword(currentPassword, newPassword, token);
      setSuccess(result.message);
      setCurrentPassword("");
      setNewPassword("");
      Swal.fire({
        icon: "success",
        title: t("Success"),
        text: result.message,
      });
    } catch (err) {
      setError(err.message);
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: err.message,
      });
    }
  };

  return (
    <Container className="py-5">
      <Card className="mx-auto shadow" style={{ maxWidth: "600px" }}>
        <Card.Header className="bg-primary text-white text-center">
          <h3>{t("Account Settings")}</h3>
        </Card.Header>
        <Card.Body className="p-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}

          {/* E-posta Güncelleme Formu */}
          <Form onSubmit={handleUpdateEmail} className="mb-4">
            <h5 className="mb-3">{t("Update Email")}</h5>
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>{t("New Email")}</Form.Label>
              <Form.Control
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("Enter new email")}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              {t("Update Email")}
            </Button>
          </Form>

          {/* Şifre Güncelleme Formu */}
          <Form onSubmit={handleUpdatePassword}>
            <h5 className="mb-3">{t("Update Password")}</h5>
            <Form.Group className="mb-3" controlId="currentPassword">
              <Form.Label>{t("Current Password")}</Form.Label>
              <Form.Control
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={t("Enter current password")}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="newPassword">
              <Form.Label>{t("New Password")}</Form.Label>
              <Form.Control
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t("Enter new password")}
                required
              />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100">
              {t("Update Password")}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AccountSettings;
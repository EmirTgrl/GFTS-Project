import { useContext, useState } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import { Form, Button, Card, Alert } from "react-bootstrap";
import Swal from "sweetalert2";
import { useTranslation } from "react-i18next";
import { updateEmail, updatePassword } from "../api/accountApi.js";
import "bootstrap/dist/css/bootstrap.min.css";
import "sweetalert2/dist/sweetalert2.min.css";

const AccountSettings = () => {
  const { token, user, setUser, login } = useContext(AuthContext);
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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError(t("Email is required"));
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Email is required"),
      });
      return;
    }
    if (!emailRegex.test(email)) {
      setError(t("Invalid email format"));
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Invalid email format"),
      });
      return;
    }

    const confirm = await Swal.fire({
      title: t("Are you sure?"),
      text: t("Do you want to update your email?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Yes"),
      cancelButtonText: t("No"),
    });

    if (!confirm.isConfirmed) {
      console.log("Email update cancelled");
      return;
    }

    try {
      const result = await updateEmail(email, token);
      setSuccess(result.message);
      Swal.fire({
        icon: "success",
        title: t("Success"),
        text: result.message,
      });
      if (result.token) {
        login(result.token);
      } else {
        setUser({ ...user, email });
        Swal.fire({
          icon: "warning",
          title: t("Warning"),
          text: t(
            "Email updated, but please log in again to refresh your session"
          ),
        });
      }
    } catch (err) {
      console.error("Email update error:", err.message);
      setError(t(err.message));
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(err.message),
      });
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword || !newPassword) {
      setError(t("Current and new passwords are required"));
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t("Current and new passwords are required"),
      });
      return;
    }

    const confirm = await Swal.fire({
      title: t("Are you sure?"),
      text: t("Do you want to update your password?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Yes"),
      cancelButtonText: t("No"),
    });

    if (!confirm.isConfirmed) {
      console.log("Password update cancelled");
      return;
    }

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
      console.error("Password update error:", err.message);
      setError(t(err.message));
      Swal.fire({
        icon: "error",
        title: t("Error"),
        text: t(err.message),
      });
    }
  };

  return (
    <Card className="border-0">
      <Card.Body className="p-4">
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

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
  );
};

export default AccountSettings;

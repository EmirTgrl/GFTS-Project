import { useEffect, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import { Card, Button, Alert } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "../styles/Payment.css";

const PaymentSuccess = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    // iyzico callback'inden gelen token'ı al
    const query = new URLSearchParams(location.search);
    const newToken = query.get("token");

    if (newToken) {
      console.log("New token received from callback:", newToken);
      login(newToken); // AuthContext'teki login fonksiyonu ile user'ı güncelle
    } else {
      console.warn("No token found in query params, redirecting to login");
      navigate("/auth/login");
    }
  }, [location, login, navigate]);

  return (
    <div className="main-content">
      <div className="container-fluid d-flex justify-content-center align-items-center">
        <Card className="payment-success-card shadow-lg">
          <Card.Body className="p-4 text-center">
            <Alert variant="success" className="payment-alert mb-4">
              <h2>{t("Payment Successful!")}</h2>
              <p>
                {t("Your Premium subscription has been activated. Thank you!")}
              </p>
            </Alert>
            <Button
              as={Link}
              to="/projects"
              variant="primary"
              className="payment-button w-100 rounded-pill"
            >
              {t("Return to Home")}
            </Button>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;

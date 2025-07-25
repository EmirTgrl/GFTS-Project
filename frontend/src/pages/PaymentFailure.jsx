import { Card, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../styles/Payment.css";

const PaymentFailure = () => {
  const { t } = useTranslation();

  return (
    <div className="main-content">
      <div className="container-fluid d-flex justify-content-center align-items-center">
        <Card className="payment-failure-card shadow-lg">
          <Card.Body className="p-4 text-center">
            <Alert variant="danger" className="payment-alert mb-4">
              <h2>{t("Payment Failed")}</h2>
              <p>
                {t("Your payment could not be completed. Please try again.")}
              </p>
            </Alert>
            <Button
              as={Link}
              to="/payment"
              variant="primary"
              className="payment-button w-100 rounded-pill"
            >
              {t("Try Again")}
            </Button>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PaymentFailure;

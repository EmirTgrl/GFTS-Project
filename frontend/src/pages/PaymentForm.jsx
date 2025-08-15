import { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import { fetchAllVersions } from "../api/versionApi";
import { initializePayment } from "../api/paymentApi";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "../styles/Payment.css";

const PaymentForm = () => {
  const { t } = useTranslation();
  const { user, token } = useContext(AuthContext);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadVersions = async () => {
      try {
        setLoading(true);
        setError("");
        if (!token) {
          throw new Error(t("Please log in to access payment options."));
        }
        const data = await fetchAllVersions(token);
        const filteredVersions = data.data.filter(
          (version) => version.name.toLowerCase() !== "basic"
        );
        setVersions(filteredVersions);
      } catch (err) {
        console.error("Error loading versions:", err);
        setError(t(`Plans failed to load: ${err.message}`));
      } finally {
        setLoading(false);
      }
    };
    loadVersions();
  }, [token, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVersion) {
      setError(t("Please select a plan."));
      return;
    }
    if (!user?.id) {
      setError(t("User information not found, please login."));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await initializePayment(selectedVersion, token);
      console.log("Iyzico payment link response:", result);

      if (!result.paymentLink) {
        console.error("No payment link received in response");
        throw new Error(t("Payment link creation failed"));
      }

      window.location.href = result.paymentLink;
    } catch (err) {
      console.error("Payment initialization error:", err);
      setError(t(`Failed to initiate payment: ${err.message}`));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content">
      <div className="container-fluid d-flex justify-content-center align-items-center">
        <Card className="payment-card shadow-lg">
          <Card.Body className="p-4">
            <Card.Title className="text-center mb-4 fs-3 fw-bold text-primary">
              {t("Buy Premium Package")}
            </Card.Title>
            {error && (
              <Alert variant="danger" className="payment-alert">
                {error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">{t("Select Plan")}</Form.Label>
                <Form.Select
                  id="version"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  disabled={loading}
                  required
                  className="payment-select"
                >
                  <option value="">{t("Select a Plan")}</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} - {v.price}₺ / {v.duration_days} days
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
              <div className="text-center">
                <Button
                  type="submit"
                  variant="primary"
                  className="payment-button w-100 rounded-pill"
                  disabled={loading || !selectedVersion}
                >
                  {loading ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-2"
                      />
                      {t("Processing...")}
                    </>
                  ) : (
                    t("Buy Now")
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PaymentForm;

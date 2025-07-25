import { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../components/Auth/AuthContext";
import { fetchAllVersions } from "../api/versionApi";
import { initializePayment } from "../api/paymentApi";
import { Card, Form, Button, Alert, Spinner } from "react-bootstrap";
import "../styles/Payment.css";

const PaymentForm = () => {
  const { user, token } = useContext(AuthContext);
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentToken, setPaymentToken] = useState(null);

  useEffect(() => {
    const loadVersions = async () => {
      try {
        setLoading(true);
        setError("");
        if (!token) {
          throw new Error("Please log in to access payment options.");
        }
        const data = await fetchAllVersions(token);
        const filteredVersions = data.data.filter(
          (version) => version.name.toLowerCase() !== "basic"
        );
        setVersions(filteredVersions);
      } catch (err) {
        console.error("Error loading versions:", err);
        setError(`Plans failed to load: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadVersions();
  }, [token]);

  useEffect(() => {
    const handleIyzicoMessage = (event) => {
      console.log(
        "Received message from:",
        event.origin,
        "Data:",
        JSON.stringify(event.data)
      );
      if (
        event.origin.includes("iyzipay.com") ||
        event.origin.includes("iyzico.com")
      ) {
        try {
          const data =
            typeof event.data === "string"
              ? JSON.parse(event.data)
              : event.data;
          console.log("Parsed Iyzico 3DS message:", data);
          if (data.status === "success") {
            window.location.href = `${import.meta.env.VITE_API_URL}/payment-success`;
          } else if (data.status === "failure") {
            window.location.href = `${import.meta.env.VITE_API_URL}/payment-failure`;
          } else {
            console.warn("Unknown Iyzico message status:", data.status);
            setError("Unexpected payment result. Please try again.");
          }
        } catch (err) {
          console.error(
            "Iyzico message parse error:",
            err,
            "Raw data:",
            event.data
          );
          setError("Failed to process payment result.");
        }
      } else {
        console.log("Ignored message from non-Iyzico origin:", event.origin);
      }
    };

    window.addEventListener("message", handleIyzicoMessage);

    const checkPaymentStatus = setInterval(() => {
      if (
        window.location.href.includes("iyzipay.com") ||
        window.location.href.includes("iyzico.com")
      ) {
        console.log("Still on Iyzico page, checking payment status...");
        let urlToken =
          new URLSearchParams(window.location.search).get("token") ||
          paymentToken;
        if (!urlToken) {
          console.warn("No token found in URL or state");
          setError("Payment token not found. Please try again.");
          return;
        }
        console.log("Checking payment with token:", urlToken);
        fetch(`${import.meta.env.VITE_API_URL}/api/payment/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: urlToken }),
        })
          .then((res) => res.json())
          .then((data) => {
            console.log("Fallback payment check:", data);
            if (data.message === "Payment successful") {
              window.location.href = `${import.meta.env.VITE_API_URL}/payment-success`;
            } else {
              window.location.href = `${import.meta.env.VITE_API_URL}/payment-failure`;
            }
          })
          .catch((err) => {
            console.error("Fallback payment check error:", err);
            setError("Failed to verify payment status.");
          });
      }
    }, 3000);

    return () => {
      window.removeEventListener("message", handleIyzicoMessage);
      clearInterval(checkPaymentStatus);
    };
  }, [paymentToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVersion) {
      setError("Please select a plan.");
      return;
    }
    if (!user?.id) {
      setError("User information not found, please login.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const result = await initializePayment(selectedVersion, token);
      console.log("Iyzico frontend response:", result);

      if (!result.checkoutFormContent) {
        console.error("No checkoutFormContent received in response");
        throw new Error("Payment page failed to open: No checkout form content");
      }

      const checkoutFormDiv = document.getElementById("iyzipay");
      if (!checkoutFormDiv) {
        console.error("Checkout form div not found in DOM");
        throw new Error("Payment form container not found in page");
      }
      checkoutFormDiv.innerHTML = result.checkoutFormContent;

      // Ödeme token'ını kaydet
      const tokenMatch = result.checkoutFormContent.match(/token:"([^"]+)"/);
      if (tokenMatch && tokenMatch[1]) {
        setPaymentToken(tokenMatch[1]);
        console.log("Payment token saved:", tokenMatch[1]);
      } else {
        console.warn("No token found in checkoutFormContent");
        setError("Failed to extract payment token.");
      }

      // İyzico script'ini yükle
      const matches = result.checkoutFormContent.match(
        /<script[^>]*>([\s\S]*?)<\/script>/
      );
      if (matches && matches[1]) {
        const script = document.createElement("script");
        script.type = "text/javascript";
        script.text = matches[1];
        console.log("Iyzico script loaded");
        document.body.appendChild(script);
      } else {
        console.error("Payment form script not found in checkoutFormContent");
        setError("Payment form script not found.");
      }
    } catch (err) {
      console.error("Payment initialization error:", err);
      setError(`Failed to initiate payment: ${err.message}`);
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
              Buy Premium Package
            </Card.Title>
            {error && (
              <Alert variant="danger" className="payment-alert">
                {error}
              </Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label className="fw-bold">Select Plan</Form.Label>
                <Form.Select
                  id="version"
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  disabled={loading}
                  required
                  className="payment-select"
                >
                  <option value="">Select a Plan</option>
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
                      Processing...
                    </>
                  ) : (
                    "Buy Now"
                  )}
                </Button>
              </div>
            </Form>
            <div id="iyzipay" className="mt-4"></div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};

export default PaymentForm;
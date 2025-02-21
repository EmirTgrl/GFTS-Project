import { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import {
  Container,
  Form,
  Button,
  Alert,
  Row,
  Col,
  Card,
} from "react-bootstrap";
import "../styles/HomePage.css";

const HomePage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imports, setImports] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);

  const fetchImports = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/import-gtfs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setImports(data);
      }
    } catch (error) {
      console.error("Failed to fetch imports:", error);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchImports();
    }
  }, [isAuthenticated, token, fetchImports]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError("You must be logged in to upload data.");
      navigate("/auth");
      return;
    }

    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/import-gtfs", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await fetchImports();
        setFile(null);
        setError("");
      } else {
        setError(data.message || "An error occurred during import!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="py-3">
      <Row className="g-3">
        <Col md={6}>
          <Card className="import-card shadow-sm">
            <Card.Body className="p-3">
              <h2 className="card-title h5 mb-2">Import GTFS Data</h2>
              <p className="text-muted small mb-3">
                Upload your GTFS ZIP file to visualize and manage transit data
              </p>

              <Form onSubmit={handleUpload}>
                {error && (
                  <Alert variant="danger" className="py-2 small">
                    {error}
                  </Alert>
                )}

                <Form.Group className="mb-3">
                  <Form.Control
                    type="file"
                    onChange={handleFileChange}
                    accept=".zip"
                    disabled={loading}
                    className="custom-file-input"
                    size="sm"
                  />
                  <Form.Text className="text-muted small">
                    Only .zip files with valid GTFS data are accepted
                  </Form.Text>
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={!file || loading}
                  className="upload-btn w-100"
                  size="sm"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Uploading...
                    </>
                  ) : (
                    "Upload GTFS Data"
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="imports-card shadow-sm">
            <Card.Body className="p-3">
              <h2 className="card-title h5 mb-2">Recent Imports</h2>
              <div className="imports-list">
                {imports.length > 0 ? (
                  imports.map((imp) => (
                    <Card key={imp.import_id} className="import-item mb-2">
                      <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
                        <div>
                          <Card.Title className="mb-0 h6">
                            {imp.file_name}
                          </Card.Title>
                          <Card.Subtitle className="text-muted small">
                            {new Date(imp.import_date).toLocaleDateString()}
                          </Card.Subtitle>
                        </div>
                        <Button variant="outline-primary" size="sm">
                          View
                        </Button>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted text-center py-2 small">
                    No imports yet. Start by uploading a GTFS file!
                  </p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;

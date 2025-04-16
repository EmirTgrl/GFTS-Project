import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import {
  Container,
  Form,
  Button,
  Alert,
  Card,
  ProgressBar,
  ListGroup,
  Accordion,
} from "react-bootstrap";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/ImportPage.css";

const ImportPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState([]);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [openErrorItems, setOpenErrorItems] = useState({});
  const [openWarningItems, setOpenWarningItems] = useState({});
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);

  const importMode = "parallel";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setUploadProgress(0);
    setValidationErrors([]);
    setValidationWarnings([]);
    setOpenErrorItems({});
    setOpenWarningItems({});
  };

  const handleUpload = async (e, forceImport = false) => {
    e.preventDefault();
    if (!file) {
      setError("Please Select a file to upload.");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("importMode", importMode);
    if (forceImport) {
      formData.append("forceImport", "true");
    }

    try {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(percentComplete);
        }
      };

      const promise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        };
        xhr.onerror = () => reject(new Error("Server error!"));
      });

      xhr.open("POST", "http://localhost:5000/api/io/import", true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);

      const data = await promise;
      if (data.success) {
        setFile(null);
        setUploadProgress(0);
        setValidationErrors([]);
        setValidationWarnings([]);
        setOpenErrorItems({});
        setOpenWarningItems({});
        navigate("/projects");
      } else if (data.actionRequired) {
        setValidationErrors(data.errors || []);
        setValidationWarnings(data.warnings || []);
      } else {
        setError(data.message || "An error occurred during import!");
      }
    } catch (error) {
      console.error("Loading Error:", error.message);
      setError(
        error.message || "Failed to connect to server. Please try again.."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContinueImport = (e) => {
    handleUpload(e, true);
  };

  const handleCancelImport = () => {
    setError("Import cancelled.");
    setFile(null);
    setUploadProgress(0);
    setValidationErrors([]);
    setValidationWarnings([]);
    setOpenErrorItems({});
    setOpenWarningItems({});
  };

  const handleErrorToggle = (index) => {
    setOpenErrorItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleWarningToggle = (index) => {
    setOpenWarningItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const hasValidationResults =
    validationErrors.length > 0 || validationWarnings.length > 0;

  return (
    <div className="import-page-wrapper">
      <MapContainer
        center={[39.925533, 32.866287]}
        zoom={6}
        zoomControl={false}
        scrollWheelZoom={true}
        style={{
          height: "100vh",
          width: "100vw",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      </MapContainer>

      <Container fluid className="py-5 import-page">
        <div
          className={`row ${
            hasValidationResults ? "split-layout" : "centered-layout"
          }`}
        >
          <div
            className={hasValidationResults ? "col-md-6" : "col-md-6 mx-auto"}
          >
            <Card className="import-card shadow-sm">
              <Card.Body className="p-4">
                <h2 className="card-title h4 mb-3 text-center">
                  Import GTFS Data
                </h2>
                <p className="text-muted small mb-4 text-center">
                  Manage transit data by uploading GTFS ZIP file
                </p>

                <Form onSubmit={handleUpload}>
                  {error && (
                    <Alert variant="danger" className="py-2 small">
                      {error}
                    </Alert>
                  )}

                  <Form.Group className="mb-4">
                    <Form.Control
                      type="file"
                      onChange={handleFileChange}
                      accept=".zip"
                      disabled={loading}
                      className="custom-file-input"
                      size="sm"
                    />
                    <Form.Text className="text-muted small">
                      Only .zip files containing valid GTFS data are accepted
                    </Form.Text>
                  </Form.Group>

                  {loading && (
                    <ProgressBar
                      animated
                      now={uploadProgress}
                      label={`${uploadProgress}%`}
                      className="mb-3"
                    />
                  )}

                  {/* Validation sonuçları yoksa Load GTFS Data butonunu göster */}
                  {!hasValidationResults && (
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
                          Loading...
                        </>
                      ) : (
                        "Load GTFS Data"
                      )}
                    </Button>
                  )}

                  {hasValidationResults && (
                    <div className="mt-3 d-flex justify-content-between gap-2">
                      <Button
                        variant="outline-primary"
                        onClick={handleContinueImport}
                        disabled={loading}
                        className="flex-grow-1"
                      >
                        Continue Despite Errors
                      </Button>
                      <Button
                        variant="outline-secondary"
                        onClick={handleCancelImport}
                        disabled={loading}
                        className="flex-grow-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </Form>
              </Card.Body>
            </Card>
          </div>

          {hasValidationResults && (
            <div className="col-md-6">
              <Card className="validation-results shadow-sm">
                <Card.Body>
                  <h5 className="mb-3">Validation Results</h5>
                  <Accordion defaultActiveKey="0">
                    {validationErrors.length > 0 && (
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>
                          <strong>Errors ({validationErrors.length})</strong>
                        </Accordion.Header>
                        <Accordion.Body>
                          <Accordion>
                            {validationErrors.map((err, index) => (
                              <Accordion.Item
                                key={index}
                                eventKey={`err-${index}`}
                              >
                                <Accordion.Header
                                  onClick={() => handleErrorToggle(index)}
                                >
                                  <strong>{err.code}</strong>: {err.message}{" "}
                                  (Total: {err.total})
                                </Accordion.Header>
                                <Accordion.Body>
                                  {openErrorItems[index] &&
                                  err.samples &&
                                  err.samples.length > 0 ? (
                                    <ListGroup
                                      variant="flush"
                                      className="small"
                                    >
                                      {err.samples.map((sample, sIndex) => (
                                        <ListGroup.Item key={sIndex}>
                                          <pre>
                                            {JSON.stringify(sample, null, 2)}
                                          </pre>
                                        </ListGroup.Item>
                                      ))}
                                    </ListGroup>
                                  ) : openErrorItems[index] ? (
                                    <p>No details found.</p>
                                  ) : (
                                    <p>Loading...</p>
                                  )}
                                </Accordion.Body>
                              </Accordion.Item>
                            ))}
                          </Accordion>
                        </Accordion.Body>
                      </Accordion.Item>
                    )}
                    {validationWarnings.length > 0 && (
                      <Accordion.Item eventKey="1">
                        <Accordion.Header>
                          <strong>
                            Warnings ({validationWarnings.length})
                          </strong>
                        </Accordion.Header>
                        <Accordion.Body>
                          <Accordion>
                            {validationWarnings.map((warn, index) => (
                              <Accordion.Item
                                key={index}
                                eventKey={`warn-${index}`}
                              >
                                <Accordion.Header
                                  onClick={() => handleWarningToggle(index)}
                                >
                                  <strong>{warn.code}</strong>: {warn.message}{" "}
                                  (Total: {warn.total})
                                </Accordion.Header>
                                <Accordion.Body>
                                  {openWarningItems[index] &&
                                  warn.samples &&
                                  warn.samples.length > 0 ? (
                                    <ListGroup
                                      variant="flush"
                                      className="small"
                                    >
                                      {warn.samples.map((sample, sIndex) => (
                                        <ListGroup.Item key={sIndex}>
                                          <pre>
                                            {JSON.stringify(sample, null, 2)}
                                          </pre>
                                        </ListGroup.Item>
                                      ))}
                                    </ListGroup>
                                  ) : openWarningItems[index] ? (
                                    <p>Details Not Found.</p>
                                  ) : (
                                    <p>Loading...</p>
                                  )}
                                </Accordion.Body>
                              </Accordion.Item>
                            ))}
                          </Accordion>
                        </Accordion.Body>
                      </Accordion.Item>
                    )}
                  </Accordion>
                </Card.Body>
              </Card>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};

export default ImportPage;

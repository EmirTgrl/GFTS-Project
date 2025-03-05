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
} from "react-bootstrap";
import "../styles/ImportPage.css";

const ImportPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0); // Progress bar için
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError("");
    setUploadProgress(0); // Yeni dosya seçildiğinde progress sıfırlanır
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const xhr = new XMLHttpRequest();

      // Progress takibi
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          setUploadProgress(percentComplete);
        }
      };

      // Yükleme tamamlandığında
      const promise = new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error("Network error occurred"));
      });

      xhr.open("POST", "http://localhost:5000/api/io/import", true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);

      const data = await promise;

      if (data.success) {
        setFile(null);
        setUploadProgress(0);
        navigate("/projects"); // Başarılı upload sonrası Projects sayfasına yönlendir
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
    <Container fluid className="py-5 import-page">
      <Card
        className="import-card shadow-sm mx-auto"
        style={{ maxWidth: "500px" }}
      >
        <Card.Body className="p-4">
          <h2 className="card-title h4 mb-3 text-center">Import GTFS Data</h2>
          <p className="text-muted small mb-4 text-center">
            Upload your GTFS ZIP file to manage transit data
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
                Only .zip files with valid GTFS data are accepted
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
    </Container>
  );
};

export default ImportPage;

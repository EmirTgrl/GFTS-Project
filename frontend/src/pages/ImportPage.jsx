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
  FormSelect,
} from "react-bootstrap";
import "../styles/ImportPage.css";

const ImportPage = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importMode, setImportMode] = useState("parallel");
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
    setUploadProgress(0);
  };

  const handleModeChange = (e) => {
    setImportMode(e.target.value);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Lütfen bir dosya seçin");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("importMode", importMode);

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
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error(xhr.statusText));
          }
        };
        xhr.onerror = () => reject(new Error("Ağ hatası oluştu"));
      });

      xhr.open("POST", "http://localhost:5000/api/io/import", true);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.send(formData);

      const data = await promise;

      if (data.success) {
        setFile(null);
        setUploadProgress(0);
        navigate("/projects");
      } else {
        setError(data.message || "İçe aktarma sırasında bir hata oluştu!");
      }
    } catch (error) {
      console.error("Yükleme hatası:", error);
      setError("Sunucuya bağlanılamadı. Lütfen tekrar deneyin.");
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
          <h2 className="card-title h4 mb-3 text-center">
            GTFS Verilerini İçe Aktar
          </h2>
          <p className="text-muted small mb-4 text-center">
            GTFS ZIP dosyanızı yükleyerek toplu taşıma verilerini yönetin
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
                Yalnızca geçerli GTFS verileri içeren .zip dosyaları kabul
                edilir
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="small">İçe Aktarma Yöntemi</Form.Label>
              <FormSelect
                value={importMode}
                onChange={handleModeChange}
                disabled={loading}
                size="sm"
              >
                <option value="parallel">Paralel</option>
                <option value="sequential">Sıralı</option>
              </FormSelect>
              <Form.Text className="text-muted small">
                Paralel: Bağımsız tablolar aynı anda işlenir. Sıralı: Tablolar
                sırayla işlenir.
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
                  Yükleniyor...
                </>
              ) : (
                "GTFS Verilerini Yükle"
              )}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ImportPage;

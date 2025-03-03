import { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import { fetchProjects } from "../api/projectApi.js";
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
  const [projectName, setProjectName] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);

  const loadProjects = useCallback(async () => {
    try {
      const projectsData = await fetchProjects(token);
      // console.log("Fetched projects:", projectsData);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadProjects();
    }
  }, [isAuthenticated, token, loadProjects]);

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
      const response = await fetch("http://localhost:5000/api/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await loadProjects();
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


  const handleCreateProject = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/projects/', {
            method: 'POST',
            headers: {
              'Content-Type':'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ file_name: projectName }) // Use file_name from state
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Project created successfully', data);
            const projectId = data.project_id;
            navigate(`/map/${projectId}`);
            setShowModal(false); // Close the modal after success

        } else {
            console.error('Failed to create project:', response.status);
            setShowModal(false); // Close the modal after failure, if needed
            // Handle error appropriately
        }
    } catch (error) {
        console.error('Error creating project:', error);
        setShowModal(false); // Close the modal after error, if needed
        // Handle error appropriately
    }
};

const handleOpenModal = () => {
    setShowModal(true);
};

const handleCloseModal = () => {
    setShowModal(false);
};

const handleInputChange = (e) => {
    setProjectName(e.target.value);
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
              <div className="d-flex justify-content-between">
                <h2 className="card-title h5 mb-2">Projects</h2>
                <button className="btn btn-primary" onClick={handleOpenModal}>Create Blank Project</button>
                
              </div>
              <div className="imports-list">
                {projects.length > 0 ? (
                  projects.map((project) => (
                    <Card key={project.project_id} className="import-item mb-2">
                      <Card.Body className="py-2 px-3 d-flex justify-content-between align-items-center">
                        <div>
                          <Card.Title className="mb-0 h6">
                            {project.file_name}
                          </Card.Title>
                          <br />
                          <Card.Subtitle className="text-muted small">
                            {new Date(project.import_date).toLocaleDateString()}
                          </Card.Subtitle>
                        </div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="stretched-link"
                          onClick={() => navigate(`/map/${project.project_id}`)}
                        >
                          View
                        </Button>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted text-center py-2 small">
                    No projects yet. Start by uploading a GTFS file!
                  </p>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      {showModal && ( 
        <div className={`popup  ${showModal ? 'show' : ''}`}>
          <div className="popup-content">
            <span className="close" onClick={handleCloseModal}>&times;</span>
            <h2>Enter Project Name</h2>
            <input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={handleInputChange}
            />
            <Button variant="primary" onClick={handleCreateProject}>Create</Button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default HomePage;

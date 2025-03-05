import { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import { fetchProjects } from "../api/projectApi.js";
import { Container, Card, Button, Pagination, Row, Col } from "react-bootstrap";
import { XCircle } from "react-bootstrap-icons"; // Kapatma ikonu için
import "../styles/ProjectsPage.css";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 6;
  const navigate = useNavigate();
  const { isAuthenticated, token } = useContext(AuthContext);

  const loadProjects = useCallback(async () => {
    try {
      const projectsData = await fetchProjects(token);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
    } catch (error) {
      console.error("Failed to load projects:", error);
      setProjects([]);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && token) {
      loadProjects();
    } else {
      navigate("/auth");
    }
  }, [isAuthenticated, token, loadProjects, navigate]);

  const handleCreateProject = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/projects/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_name: projectName }),
      });

      if (response.ok) {
        const data = await response.json();
        const projectId = data.project_id;
        await loadProjects();
        navigate(`/map/${projectId}`);
        setShowModal(false);
      } else {
        console.error("Failed to create project:", response.status);
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setShowModal(false);
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

  // Pagination hesaplamaları
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = projects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <Container fluid className="py-5 projects-page">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Card className="projects-card shadow-lg">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="card-title h3 fw-bold">Your Projects</h2>
                <Button variant="success" size="sm" onClick={handleOpenModal}>
                  + New Project
                </Button>
              </div>
              <hr className="mb-4" />
              <Row>
                {currentProjects.length > 0 ? (
                  currentProjects.map((project) => (
                    <Col key={project.project_id} md={6} className="mb-3">
                      <Card
                        className="project-card shadow-sm h-100"
                        onClick={() => navigate(`/map/${project.project_id}`)}
                      >
                        <Card.Body className="d-flex flex-column justify-content-between">
                          <div>
                            <Card.Title className="h6 fw-semibold mb-2">
                              {project.file_name}
                            </Card.Title>
                            <Card.Text className="text-muted small">
                              Created:{" "}
                              {new Date(
                                project.import_date
                              ).toLocaleDateString()}
                            </Card.Text>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Col>
                    <p className="text-muted text-center py-3 fw-medium">
                      No projects yet. Create one or import a GTFS file!
                    </p>
                  </Col>
                )}
              </Row>

              {projects.length > projectsPerPage && (
                <div className="pagination-section mt-4 text-center">
                  <Pagination className="justify-content-center mb-2">
                    <Pagination.First
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    />
                    {Array.from({ length: totalPages }, (_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={index + 1 === currentPage}
                        onClick={() => handlePageChange(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                  <small className="text-muted">
                    Page {currentPage} of {totalPages} (
                    {indexOfFirstProject + 1}-
                    {Math.min(indexOfLastProject, projects.length)} of{" "}
                    {projects.length} projects)
                  </small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {showModal && (
        <div className={`popup ${showModal ? "show" : ""}`}>
          <div className="popup-content">
            <XCircle
              size={24}
              className="close-icon"
              onClick={handleCloseModal}
            />
            <h2 className="h5 mb-3">Create New Project</h2>
            <input
              type="text"
              placeholder="Project Name"
              value={projectName}
              onChange={handleInputChange}
              className="form-control mb-3"
            />
            <Button variant="primary" onClick={handleCreateProject}>
              Create
            </Button>
          </div>
        </div>
      )}
    </Container>
  );
};

export default ProjectsPage;

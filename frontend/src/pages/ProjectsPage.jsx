import { useState, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../components/Auth/AuthContext";
import {
  fetchProjects,
  deleteProject,
  exportProject,
  createProject,
} from "../api/projectApi.js";
import {
  Container,
  Card,
  Button,
  Table,
  Pagination,
  Row,
  Col,
  Modal,
  Accordion,
} from "react-bootstrap";
import {
  XCircle,
  Trash,
  Download,
  Eye,
  ExclamationTriangle,
  PlusLg,
} from "react-bootstrap-icons";
import Swal from "sweetalert2";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/ProjectsPage.css";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
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
      const data = await createProject(projectName, token);
      const projectId = data.project_id;
      await loadProjects();
      navigate(`/map/${projectId}`);
      setShowModal(false);
    } catch (error) {
      console.error("Error creating project:", error);
      setShowModal(false);
    }
  };

  const handleDeleteProject = async (projectId, projectName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `You are about to delete "${projectName}". This action cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteProject(projectId, token);
        setProjects((prev) => prev.filter((p) => p.project_id !== projectId));
        Swal.fire("Deleted!", "Your GTFS file has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting GTFS file:", error);
        Swal.fire("Error!", "Failed to delete the GTFS file.", "error");
      }
    }
  };

  const handleExportProject = async (projectId) => {
    setExportLoading(true);
    try {
      const { blob, link } = await exportProject(projectId, token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = link;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Swal.fire("Success!", "Your project has been exported.", "success");
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire("Error!", "Failed to export the project.", "error");
    } finally {
      setExportLoading(false);
    }
  };

  const handleShowValidation = (project) => {
    setSelectedProject(project);
    setShowValidationModal(true);
  };

  const handleCloseValidationModal = () => {
    setShowValidationModal(false);
    setSelectedProject(null);
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

  const handleRowClick = (projectId) => {
    navigate(`/map/${projectId}`);
  };

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
    <div className="projects-page-wrapper">
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

      <Container
        fluid
        className="py-5 projects-page"
        style={{ position: "relative", zIndex: 2 }}
      >
        <Row className="justify-content-center">
          <Col md={10} lg={8}>
            <Card className="projects-card shadow-lg">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2 className="card-title h3 fw-bold">Your GTFS Files</h2>
                  <Button variant="success" size="sm" onClick={handleOpenModal}>
                    + New Project
                  </Button>
                </div>
                <hr className="mb-4" />
                {currentProjects.length > 0 ? (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>GTFS File Name</th>
                          <th>Imported Date</th>
                          <th style={{ width: "200px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentProjects.map((project) => (
                          <tr
                            key={project.project_id}
                            className="project-row"
                            onClick={() => handleRowClick(project.project_id)}
                          >
                            <td>{project.file_name}</td>
                            <td>
                              {new Date(
                                project.import_date
                              ).toLocaleDateString()}
                            </td>
                            <td
                              className="d-flex justify-content-around"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="view-btn"
                                onClick={() =>
                                  navigate(`/map/${project.project_id}`)
                                }
                                title="View"
                              >
                                <Eye size={16} />
                              </Button>
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="export-btn"
                                onClick={() =>
                                  handleExportProject(project.project_id)
                                }
                                disabled={exportLoading}
                                title="Export"
                              >
                                {exportLoading ? (
                                  <span className="spinner-border spinner-border-sm me-1" />
                                ) : (
                                  <Download size={16} />
                                )}
                              </Button>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="validation-btn"
                                onClick={() => handleShowValidation(project)}
                                title="Validation Report"
                              >
                                <ExclamationTriangle size={16} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="delete-btn"
                                onClick={() =>
                                  handleDeleteProject(
                                    project.project_id,
                                    project.file_name
                                  )
                                }
                                title="Delete"
                              >
                                <Trash size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
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
                  </>
                ) : (
                  <p className="text-muted text-center py-3 fw-medium">
                    No projects yet. Create one or import a GTFS file!
                  </p>
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

        <Modal
          show={showValidationModal}
          onHide={handleCloseValidationModal}
          size="lg"
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Validation Report for {selectedProject?.file_name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedProject && selectedProject.validation_data ? (
              <Accordion defaultActiveKey={[]}>
                {/* Errors Section */}
                {selectedProject.validation_data.errors?.length > 0 && (
                  <Accordion.Item eventKey="errors">
                    <Accordion.Header>
                      <span className="text-danger me-2">
                        Errors ({selectedProject.validation_data.errors.length})
                      </span>
                      <PlusLg size={16} />
                    </Accordion.Header>
                    <Accordion.Body>
                      <Accordion defaultActiveKey={[]}>
                        {selectedProject.validation_data.errors.map(
                          (err, index) => (
                            <Accordion.Item
                              key={`error-${index}`}
                              eventKey={`error-${index}`}
                            >
                              <Accordion.Header className="inner-accordion-header">
                                <span className="me-2">
                                  {err.code} (Total: {err.total})
                                </span>
                                <PlusLg size={16} />
                              </Accordion.Header>
                              <Accordion.Body>
                                <p className="mb-2">
                                  <strong>Description:</strong>{" "}
                                  {err.userFriendlyMessage}
                                </p>
                                <p className="mb-3">
                                  <strong>Suggestion:</strong> {err.suggestion}
                                </p>
                                <div className="table-container">
                                  <Table
                                    striped
                                    bordered
                                    hover
                                    size="sm"
                                    className="mt-2"
                                  >
                                    <thead>
                                      <tr>
                                        <th>Location</th>
                                        <th>Details</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {err.samples.map((sample, i) => (
                                        <tr key={`${index}-${i}`}>
                                          <td>{sample.location}</td>
                                          <td>{sample.details}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              </Accordion.Body>
                            </Accordion.Item>
                          )
                        )}
                      </Accordion>
                    </Accordion.Body>
                  </Accordion.Item>
                )}

                {/* Warnings Section */}
                {selectedProject.validation_data.warnings?.length > 0 && (
                  <Accordion.Item eventKey="warnings">
                    <Accordion.Header>
                      <span className="text-warning me-2">
                        Warnings (
                        {selectedProject.validation_data.warnings.length})
                      </span>
                      <PlusLg size={16} />
                    </Accordion.Header>
                    <Accordion.Body>
                      <Accordion defaultActiveKey={[]}>
                        {selectedProject.validation_data.warnings.map(
                          (warn, index) => (
                            <Accordion.Item
                              key={`warning-${index}`}
                              eventKey={`warning-${index}`}
                            >
                              <Accordion.Header className="inner-accordion-header">
                                <span className="me-2">
                                  {warn.code} (Total: {warn.total})
                                </span>
                                <PlusLg size={16} />
                              </Accordion.Header>
                              <Accordion.Body>
                                <p className="mb-2">
                                  <strong>Description:</strong>{" "}
                                  {warn.userFriendlyMessage}
                                </p>
                                <p className="mb-3">
                                  <strong>Suggestion:</strong> {warn.suggestion}
                                </p>
                                <div className="table-container">
                                  <Table
                                    striped
                                    bordered
                                    hover
                                    size="sm"
                                    className="mt-2"
                                  >
                                    <thead>
                                      <tr>
                                        <th>Location</th>
                                        <th>Details</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {warn.samples.map((sample, i) => (
                                        <tr key={`${index}-${i}`}>
                                          <td>{sample.location}</td>
                                          <td>{sample.details}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              </Accordion.Body>
                            </Accordion.Item>
                          )
                        )}
                      </Accordion>
                    </Accordion.Body>
                  </Accordion.Item>
                )}

                {!selectedProject.validation_data.errors?.length &&
                  !selectedProject.validation_data.warnings?.length && (
                    <p className="text-muted">No errors or warnings found.</p>
                  )}
              </Accordion>
            ) : (
              <p className="text-muted">
                No validation data available for this project.
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseValidationModal}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default ProjectsPage;

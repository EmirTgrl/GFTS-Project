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
} from "react-bootstrap-icons";
import Swal from "sweetalert2";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/ProjectsPage.css";
import { useTranslation } from "react-i18next";

const ProjectsPage = () => {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState({});
  const projectsPerPage = 10;
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
      text: `"You are about to delete the project ${projectName}" and its associated GTFS data. This operation cannot be undone!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setDeleteLoading((prev) => ({ ...prev, [projectId]: true }));
      try {
        await deleteProject(projectId, token);
        await loadProjects();
        Swal.fire(
          "Deleted!",
          "Your project and associated GTFS data has been deleted.",
          "success"
        );
      } catch (error) {
        console.error("Error deleting GTFS file:", error);
        Swal.fire({
          title: "Error!",
          text:
            error.response?.data?.message === "Project not found"
              ? "Project not found. May have already been deleted."
              : error.response?.data?.details ||
                "An error occurred while deleting project and GTFS data.",
          icon: "error",
        });
      } finally {
        setDeleteLoading((prev) => ({ ...prev, [projectId]: false }));
      }
    }
  };

  const handleExportProject = async (projectId) => {
    setExportLoading(true);
    try {
      const { blob, filename } = await exportProject(projectId, token);

      // Blob nesnesini kontrol et
      if (!blob || !(blob instanceof Blob)) {
        throw new Error("Invalid blob received.");
      }

      // Filename'in geçerli bir string olduğundan emin ol
      const fileName =
        typeof filename === "string" && filename
          ? filename
          : `project-${projectId}.zip`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      Swal.fire("Success!", "Your project has been exported.", "success");
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire(
        "Error!",
        error.message || "An error occurred while exporting the project.",
        "error"
      );
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

  // const handleOpenModal = () => {
  //   setShowModal(true);
  // };

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
                  <h2 className="card-title h3 fw-bold">
                    {t("Your GTFS Files")}
                  </h2>
                  {/* <Button variant="success" size="sm" onClick={handleOpenModal}>
                    + {t("New Project")}
                  </Button> */}
                </div>
                <hr className="mb-4" />
                {currentProjects.length > 0 ? (
                  <>
                    <Table striped bordered hover responsive>
                      <thead>
                        <tr>
                          <th>{t("GTFS File Name")}</th>
                          <th>{t("Import Date")}</th>
                          <th style={{ width: "200px" }}>{t("Actions")}</th>
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
                                title={t("View")}
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
                                title={t("Export")}
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
                                title={t("Validation Report")}
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
                                disabled={deleteLoading[project.project_id]}
                                title={t("Delete")}
                              >
                                {deleteLoading[project.project_id] ? (
                                  <span className="spinner-border spinner-border-sm me-1" />
                                ) : (
                                  <Trash size={16} />
                                )}
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
                          {t("Page")} {currentPage} / {totalPages} (
                          {indexOfFirstProject + 1}-
                          {Math.min(indexOfLastProject, projects.length)} /{" "}
                          {projects.length} {t("projects")})
                        </small>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted text-center py-3 fw-medium">
                    {t(
                      "No project yet. Create a project or import a GTFS file!"
                    )}
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
              <h2 className="h5 mb-3">{t("Create New Project")}</h2>
              <input
                type="text"
                placeholder={t("Project Name")}
                value={projectName}
                onChange={handleInputChange}
                className="form-control mb-3"
              />
              <Button variant="primary" onClick={handleCreateProject}>
                {t("Create")}
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
              {t("Validation Report for", { file: selectedProject?.file_name })}
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
                        {t("Errors")} (
                        {selectedProject.validation_data.errors.length})
                      </span>
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
                                  {err.code} ({t("Total")}: {err.total || 0})
                                </span>
                              </Accordion.Header>
                              <Accordion.Body>
                                <p className="mb-2">
                                  <strong>{t("Error Code")}:</strong> {err.code}
                                </p>
                                <p className="mb-2">
                                  <strong>{t("Description")}:</strong>{" "}
                                  {err.userFriendlyMessage ||
                                    err.message ||
                                    err.description ||
                                    t("Description not available")}
                                </p>
                                <p className="mb-3">
                                  <strong>{t("Recommendation")}:</strong>{" "}
                                  {err.suggestion ||
                                    err.recommendation ||
                                    t("Suggestion not available")}
                                </p>
                                {err.samples?.length > 0 ? (
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
                                          <th>{t("Location")}</th>
                                          <th>{t("Details")}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {err.samples.map((sample, i) => (
                                          <tr key={`${index}-${i}`}>
                                            <td>
                                              {sample.location || t("Unknown")}
                                            </td>
                                            <td>
                                              <pre>
                                                {sample.details ||
                                                  t("No details")}
                                              </pre>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-warning">
                                    {t(
                                      "Sample data is not available for this error. Check the validator output or database."
                                    )}
                                  </p>
                                )}
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
                        {t("Warnings")} (
                        {selectedProject.validation_data.warnings.length})
                      </span>
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
                                  {warn.code} ({t("Total")}: {warn.total || 0})
                                </span>
                              </Accordion.Header>
                              <Accordion.Body>
                                <p className="mb-2">
                                  <strong>{t("Error Code")}:</strong>{" "}
                                  {warn.code}
                                </p>
                                <p className="mb-2">
                                  <strong>{t("Description")}:</strong>{" "}
                                  {warn.userFriendlyMessage ||
                                    warn.message ||
                                    warn.description ||
                                    t("Description not available")}
                                </p>
                                <p className="mb-3">
                                  <strong>{t("Recommendation")}:</strong>{" "}
                                  {warn.suggestion ||
                                    warn.recommendation ||
                                    t("Recommendation not available")}
                                </p>
                                {warn.samples?.length > 0 ? (
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
                                          <th>{t("Location")}</th>
                                          <th>{t("Details")}</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {warn.samples.map((sample, i) => (
                                          <tr key={`${index}-${i}`}>
                                            <td>
                                              {sample.location || t("Unknown")}
                                            </td>
                                            <td>
                                              <pre>
                                                {sample.details ||
                                                  t("No details")}
                                              </pre>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </Table>
                                  </div>
                                ) : (
                                  <p className="text-warning">
                                    {t(
                                      "Sample data is not available for this error. Check the validator output or database."
                                    )}
                                  </p>
                                )}
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
                    <p className="text-muted">
                      {t("Error or warning not found.")}
                    </p>
                  )}
              </Accordion>
            ) : (
              <p className="text-muted">
                {t("Validation data is not available for this project.")}
              </p>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
};

export default ProjectsPage;

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
} from "react-bootstrap";
import { XCircle, Trash, Download, Eye } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import "../styles/ProjectsPage.css";

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [showModal, setShowModal] = useState(false);
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
        Swal.fire("Deleted!", "Your project has been deleted.", "success");
      } catch (error) {
        console.error("Error deleting project:", error);
        Swal.fire("Error!", "Failed to delete the project.", "error");
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

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleInputChange = (e) => {
    setProjectName(e.target.value);
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
              {currentProjects.length > 0 ? (
                <>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Created Date</th>
                        <th style={{ width: "150px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProjects.map((project) => (
                        <tr key={project.project_id}>
                          <td>{project.file_name}</td>
                          <td>
                            {new Date(project.import_date).toLocaleDateString()}
                          </td>
                          <td className="d-flex justify-content-around">
                            <Button
                              variant="outline-primary"
                              size="sm"
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
                              variant="outline-danger"
                              size="sm"
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
    </Container>
  );
};

export default ProjectsPage;

import { useState, useEffect, useContext, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../components/Auth/AuthContext";
import { Container, Row, Col, Card, Table, Spinner } from "react-bootstrap";

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, isAuthenticated } = useContext(AuthContext);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/projects`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      setError(error.message || "Failed to fetch projects.");
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, fetchProjects]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Container className="py-3 mt-5">
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title className="h3 fs-1 text-primary my-4">
                Project Management
              </Card.Title>
              {error && <p className="text-danger">Error: {error}</p>}
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" role="status" />
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>Project ID</th>
                      <th>User Email</th>
                      <th>User Role</th>
                      <th>User Version</th>
                      <th>File Name</th>
                      <th>Import Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project.project_id}>
                        <td>{project.project_id}</td>
                        <td>{project.email}</td>
                        <td>{project.role}</td>
                        <td>{project.version}</td>
                        <td>{project.file_name}</td>
                        <td>
                          {new Date(project.import_date).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminProjects;

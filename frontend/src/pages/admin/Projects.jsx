import { useState, useEffect, useContext, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../components/Auth/AuthContext";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Alert,
  Pagination,
} from "react-bootstrap";
import { useTranslation } from "react-i18next";
import "../../styles/AdminPage.css";

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const { token, user } = useContext(AuthContext);
  const { t } = useTranslation();

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchProjects = useCallback(
    async (pageParam = page) => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `${API_URL}/api/admin/projects?page=${pageParam}&limit=${limit}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setProjects(data.data || []);
        setTotal(data.total || 0);
      } catch (error) {
        setError(t("Projects failed to load."));
        console.error("Error in loading projects:", error);
      } finally {
        setLoading(false);
      }
    },
    [token, API_URL, t, limit, page]
  );

  useEffect(() => {
    if (user?.role === "admin") {
      fetchProjects(page);
    }
  }, [fetchProjects, user?.role, page]);

  const handlePageChange = (newPage) => {
    if (newPage !== page) setPage(newPage);
  };

  const totalPages = Math.ceil(total / limit);

  if (user?.role !== "admin") {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Container className="py-3 mt-5">
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <Card.Title className="h3 fs-1 text-primary my-4">
                {t("Project Management")}
              </Card.Title>
              {error && <Alert variant="danger">{t("Error")}: {error}</Alert>}
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" role="status" />
                  <span className="visually-hidden">{t("Loading...")}</span>
                </div>
              ) : (
                <>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>{t("Project ID")}</th>
                        <th>{t("User Email")}</th>
                        <th>{t("User Role")}</th>
                        <th>{t("User Version")}</th>
                        <th>{t("File Name")}</th>
                        <th>{t("Imported Date")}</th>
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
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-3">
                      <Pagination>
                        <Pagination.First
                          onClick={() => handlePageChange(1)}
                          disabled={page === 1}
                        />
                        <Pagination.Prev
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                        />
                        {[...Array(totalPages)].map((_, idx) => (
                          <Pagination.Item
                            key={idx + 1}
                            active={page === idx + 1}
                            onClick={() => handlePageChange(idx + 1)}
                          >
                            {idx + 1}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === totalPages}
                        />
                        <Pagination.Last
                          onClick={() => handlePageChange(totalPages)}
                          disabled={page === totalPages}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminProjects;

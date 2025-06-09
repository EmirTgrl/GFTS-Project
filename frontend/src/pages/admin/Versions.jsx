import { useState, useEffect, useContext, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../components/Auth/AuthContext";
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Button,
  Modal,
  Form,
  Alert,
} from "react-bootstrap";
import { PencilSquare, Trash } from "react-bootstrap-icons";
import Swal from "sweetalert2";
import "../../styles/AdminPage.css";

const AdminVersions = () => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, user } = useContext(AuthContext);

  const nameRef = useRef(null);
  const editNameRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [versionToEdit, setVersionToEdit] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchVersions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setVersions(data);
    } catch (error) {
      setError(error.message || "Failed to load versions.");
      console.error("Error loading versions:", error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchVersions();
    }
  }, [fetchVersions, user]);

  if (user?.role !== "admin") {
    return <Navigate to="/auth" replace />;
  }

  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setError("");
  };

  const handleAddVersion = async () => {
    const name = nameRef.current.value.trim();
    if (!name) {
      setError("Version name required.");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to add this version?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Add",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/versions/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      handleCloseAddModal();
      fetchVersions();
    } catch (error) {
      setError(error.message || "Failed to add version.");
      console.error("Error adding a version:", error);
    }
  };

  const handleShowEditModal = (version) => {
    setVersionToEdit(version);
    setShowEditModal(true);
  };

  useEffect(() => {
    if (showEditModal && versionToEdit && editNameRef.current) {
      editNameRef.current.value = versionToEdit.name;
    }
  }, [showEditModal, versionToEdit]);

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setVersionToEdit(null);
    setError("");
  };

  const handleUpdateVersion = async () => {
    if (!versionToEdit) return;
    const name = editNameRef.current.value.trim();
    if (!name) {
      setError("Version name required.");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this version?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/versions/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: versionToEdit.id, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      setVersions(
        versions.map((version) =>
          version.id === versionToEdit.id ? { ...version, name } : version
        )
      );
      handleCloseEditModal();
    } catch (error) {
      setError(error.message || "Failed to update version.");
      console.error("Error updating version:", error);
    }
  };

  const handleDeleteVersion = async (version) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete version "${version.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/versions/delete/${version.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setVersions(versions.filter((v) => v.id !== version.id));
      Swal.fire("Deleted!", "Version has been deleted.", "success");
    } catch (error) {
      setError(error.message || "Failed to delete version.");
      console.error("Error deleting a version:", error);
    }
  };

  return (
    <Container className="py-3 mt-5">
      <Row>
        <Col>
          <Card>
            <Card.Body>
              <div className="d-flex">
                <Card.Title className="h3 fs-1 text-primary my-4">
                  Version Management
                </Card.Title>
                <Button
                  variant="outline-success"
                  className="align-self-center ms-auto me-2"
                  onClick={handleShowAddModal}
                >
                  Add New Version
                </Button>
              </div>

              {error && <Alert variant="danger">Hata: {error}</Alert>}
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" role="status" />
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {versions.map((version) => (
                      <tr key={version.id}>
                        <td>{version.id}</td>
                        <td>{version.name}</td>
                        <td className="text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowEditModal(version)}
                          >
                            <PencilSquare size={16} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteVersion(version)}
                          >
                            <Trash size={16} />
                          </Button>
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

      {/* Add Version Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New Version</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Version Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter version name"
                ref={nameRef}
              />
            </Form.Group>
          </Form>
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAddVersion}>
            Add Version
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Version Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit Version</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Version Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter version name"
                ref={editNameRef}
              />
            </Form.Group>
          </Form>
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleUpdateVersion}>
            Edit Version
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminVersions;
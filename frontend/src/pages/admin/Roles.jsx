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
import { useTranslation } from "react-i18next";
import "../../styles/AdminPage.css";

const AdminRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, user } = useContext(AuthContext);
  const { t } = useTranslation();

  const nameRef = useRef(null);
  const editNameRef = useRef(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roleToEdit, setRoleToEdit] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/roles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRoles(data);
    } catch (error) {
      setError(error.message || t("Failed to load roles."));
      console.error("Error loading roles:", error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL, t]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchRoles();
    }
  }, [fetchRoles, user?.role]);

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

  const handleAddRole = async () => {
    const name = nameRef.current.value.trim();
    if (!name) {
      setError(t("Role name required."));
      return;
    }

    const result = await Swal.fire({
      title: t("Are you sure?"),
      text: t("Do you want to add this role?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Add"),
      cancelButtonText: t("Cancel"),
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/roles/create`, {
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
      fetchRoles();
    } catch (error) {
      setError(error.message || t("Failed to add role."));
      console.error("Error adding a role:", error);
    }
  };

  const handleShowEditModal = (role) => {
    setRoleToEdit(role);
    setShowEditModal(true);
  };

  useEffect(() => {
    if (showEditModal && roleToEdit && editNameRef.current) {
      editNameRef.current.value = roleToEdit.name;
    }
  }, [showEditModal, roleToEdit]);

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setRoleToEdit(null);
    setError("");
  };

  const handleUpdateRole = async () => {
    if (!roleToEdit) return;
    const name = editNameRef.current.value.trim();
    if (!name) {
      setError(t("Role name required."));
      return;
    }

    const result = await Swal.fire({
      title: t("Are you sure?"),
      text: t("Do you want to update this role?"),
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("Update"),
      cancelButtonText: t("Cancel"),
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/roles/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: roleToEdit.id, name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      setRoles(
        roles.map((role) =>
          role.id === roleToEdit.id ? { ...role, name } : role
        )
      );
      handleCloseEditModal();
    } catch (error) {
      setError(error.message || t("Failed to update role."));
      console.error("Error updating role:", error);
    }
  };

  const handleDeleteRole = async (role) => {
    const result = await Swal.fire({
      title: t("Are you sure?"),
      text: t('Do you really want to delete role "{{roleName}}"?', { roleName: role.name }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: t("Yes, delete!"),
      cancelButtonText: t("Cancel"),
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/roles/delete/${role.id}`,
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

      setRoles(roles.filter((r) => r.id !== role.id));
      Swal.fire(t("Deleted!"), t("Role has been deleted."), "success");
    } catch (error) {
      setError(error.message || t("Failed to delete role."));
      console.error("Error deleting a role:", error);
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
                  {t("Role Management")}
                </Card.Title>
                <Button
                  variant="outline-success"
                  className="align-self-center ms-auto me-2"
                  onClick={handleShowAddModal}
                >
                  {t("Add New Role")}
                </Button>
              </div>

              {error && <Alert variant="danger">{t("Error")}: {error}</Alert>}
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" role="status" />
                  <span className="visually-hidden">{t("Loading...")}</span>
                </div>
              ) : (
                <Table striped bordered hover responsive>
                  <thead>
                    <tr>
                      <th>{t("ID")}</th>
                      <th>{t("Name")}</th>
                      <th className="text-center">{t("Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id}>
                        <td>{role.id}</td>
                        <td>{role.name}</td>
                        <td className="text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowEditModal(role)}
                          >
                            <PencilSquare size={16} />
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteRole(role)}
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

      {/* Add Role Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("Add New Role")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("Role Name")}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t("Enter role name")}
                ref={nameRef}
              />
            </Form.Group>
          </Form>
          {error && <Alert variant="danger">{t("Error")}: {error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAddRole}>
            {t("Add Role")}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Role Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{t("Edit Role")}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>{t("Role Name")}</Form.Label>
              <Form.Control
                type="text"
                placeholder={t("Enter role name")}
                ref={editNameRef}
              />
            </Form.Group>
          </Form>
          {error && <Alert variant="danger">{t("Error")}: {error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleUpdateRole}>
            {t("Edit Role")}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminRoles;

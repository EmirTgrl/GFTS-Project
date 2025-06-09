import { useState, useEffect, useContext, useCallback, useRef } from "react";
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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, user } = useContext(AuthContext);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const roleIdRef = useRef(null);
  const versionIdRef = useRef(null);

  const editEmailRef = useRef(null);
  const editPasswordRef = useRef(null);
  const editIsActiveRef = useRef(null);
  const editRoleIdRef = useRef(null);
  const editVersionIdRef = useRef(null);

  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/admin/users`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      setError(error.message || "Failed to load users.");
      console.error("Errors in loading users:", error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  const fetchRolesAndVersions = useCallback(async () => {
    try {
      const [rolesResponse, versionsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/admin/versions`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!rolesResponse.ok || !versionsResponse.ok) {
        throw new Error("Failed to load roles or versions.");
      }

      const rolesData = await rolesResponse.json();
      const versionsData = await versionsResponse.json();
      setRoles(rolesData);
      setVersions(versionsData);
    } catch (error) {
      setError(error.message || "Failed to load roles/versions.");
      console.error("Error fetching roles/versions:", error);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetchRolesAndVersions();
    }
  }, [fetchUsers, fetchRolesAndVersions]);

  if (user?.role !== "admin") {
    return <Navigate to="/auth" replace />;
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    handleConfirmDelete(user);
  };

  const handleConfirmDelete = async (user) => {
    if (!user) return;

    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you really want to delete user "${user.email}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/delete/${user.id}`,
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

      setUsers(
        users.map((u) => (u.id === user.id ? { ...u, is_active: false } : u))
      );
      Swal.fire("Deleted!", "User has been deleted.", "success");
    } catch (error) {
      setError(error.message || "Failed to delete user.");
      console.error("Error deleting a user:", error);
    }
  };

  const handleShowAddModal = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setError("");
  };

  const handleAddUser = async () => {
    const email = emailRef.current.value;
    const password = passwordRef.current.value;
    const role_id = roleIdRef.current.value;
    const version_id = versionIdRef.current.value;

    if (!email || !password) {
      setError("Email and password required.");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to add this user?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Add",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role_id, version_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      handleCloseAddModal();
      fetchUsers();
    } catch (error) {
      setError(error.message || "Failed to add user.");
      console.error("Error adding a user:", error);
    }
  };

  const handleShowEditModal = (user) => {
    setUserToEdit(user);
    setShowEditModal(true);
  };

  useEffect(() => {
    if (showEditModal && userToEdit) {
      if (editEmailRef.current) editEmailRef.current.value = userToEdit.email;
      if (editIsActiveRef.current)
        editIsActiveRef.current.checked = userToEdit.is_active;
      if (editRoleIdRef.current)
        editRoleIdRef.current.value =
          roles.find((r) => r.name === userToEdit.role)?.id || "";
      if (editVersionIdRef.current)
        editVersionIdRef.current.value =
          versions.find((v) => v.name === userToEdit.version)?.id || "";
    }
  }, [showEditModal, userToEdit, roles, versions]);

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setUserToEdit(null);
    setError("");
  };

  const handleUpdateUser = async () => {
    if (!userToEdit) return;

    const email = editEmailRef.current.value;
    const password = editPasswordRef.current.value;
    const is_active = editIsActiveRef.current.checked;
    const role_id = editRoleIdRef.current.value;
    const version_id = editVersionIdRef.current.value;

    if (!email) {
      setError("Email required.");
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this user?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const requestBody = {
        id: userToEdit.id,
        email,
        is_active,
        role_id,
        version_id,
      };

      if (password) {
        requestBody.password = password;
      }

      const response = await fetch(`${API_URL}/api/admin/users/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      setUsers(
        users.map((user) =>
          user.id === userToEdit.id
            ? {
                ...user,
                email,
                is_active,
                role:
                  roles.find((r) => r.id === parseInt(role_id))?.name ||
                  user.role,
                version:
                  versions.find((v) => v.id === parseInt(version_id))?.name ||
                  user.version,
              }
            : user
        )
      );
      handleCloseEditModal();
    } catch (error) {
      setError(error.message || "Failed to update user.");
      console.error("Error updating user:", error);
    }
  };

  const handleActivateUser = async (user) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to activate user "${user.email}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Activate",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/users/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          is_active: true,
          role_id: roles.find((r) => r.name === user.role)?.id,
          version_id: versions.find((v) => v.name === user.version)?.id,
        }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setUsers(
        users.map((u) => (u.id === user.id ? { ...u, is_active: true } : u))
      );
      Swal.fire("Activated!", "User has been activated.", "success");
    } catch (error) {
      setError(error.message || "Failed to activate user.");
      console.error("Error activating user:", error);
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
                  User Management
                </Card.Title>
                <Button
                  variant="outline-success"
                  className="align-self-center ms-auto me-2"
                  onClick={handleShowAddModal}
                >
                  Add New User
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
                      <th>Email</th>
                      <th>Role</th>
                      <th>Version</th>
                      <th>Is Active</th>
                      <th>Created Date</th>
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.version}</td>
                        <td>{user.is_active ? "Active" : "Passive"}</td>
                        <td>{new Date(user.created_at).toLocaleString()}</td>
                        <td className="text-center">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleShowEditModal(user)}
                          >
                            <PencilSquare size={16} />
                          </Button>
                          {user.is_active ? (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteClick(user)}
                            >
                              <Trash size={16} />
                            </Button>
                          ) : (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => handleActivateUser(user)}
                            >
                              Activate
                            </Button>
                          )}
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

      {/* Add User Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                ref={emailRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter Password"
                ref={passwordRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select ref={roleIdRef}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Version</Form.Label>
              <Form.Select ref={versionIdRef}>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleAddUser}>
            Add User
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                ref={editEmailRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password (fill in to change)</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter Password"
                ref={editPasswordRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="is_active"
                label="Is Active"
                ref={editIsActiveRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select ref={editRoleIdRef}>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Version</Form.Label>
              <Form.Select ref={editVersionIdRef}>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
          {error && <Alert variant="danger">{error}</Alert>}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleUpdateUser}>
            Edit User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers;

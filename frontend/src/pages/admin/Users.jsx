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
} from "react-bootstrap";
import { PencilSquare, Trash } from "react-bootstrap-icons";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, isAuthenticated } = useContext(AuthContext);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const roleRef = useRef(null);
  const versionRef = useRef(null);

  const editEmailRef = useRef(null);
  const editPasswordRef = useRef(null);
  const editIsActiveRef = useRef(null);
  const editRoleRef = useRef(null);
  const editVersionRef = useRef(null);

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
      setError(error.message || "Failed to fetch users.");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, fetchUsers]);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setUserToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await fetch(
        `${API_URL}/api/admin/users/delete/${userToDelete.id}`,
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
        users.map((user) =>
          user.id === userToDelete.id ? { ...user, is_active: false } : user
        )
      );
      handleCloseDeleteModal();
    } catch (error) {
      setError(error.message || "Failed to delete user.");
      console.error("Error deleting user:", error);
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
    const role = roleRef.current.value;
    const version = versionRef.current.value;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/users/create`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role, version }),
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
      console.error("Error adding user:", error);
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
      if (editRoleRef.current) editRoleRef.current.value = userToEdit.role;
      if (editVersionRef.current)
        editVersionRef.current.value = userToEdit.version;
    }
  }, [showEditModal, userToEdit]);

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
    const role = editRoleRef.current.value;
    const version = editVersionRef.current.value;

    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      const requestBody = {
        id: userToEdit.id,
        email,
        is_active,
        role,
        version,
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
            ? { ...user, email, is_active, role, version }
            : user
        )
      );
      handleCloseEditModal();
    } catch (error) {
      setError(error.message || "Failed to update user.");
      console.error("Error updating user:", error);
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
                  Add User
                </Button>
              </div>

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
                      <th>ID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Version</th>
                      <th>Is Active</th>
                      <th>Created At</th>
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
                        <td>{user.is_active ? "Active" : "Inactive"}</td>
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
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
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

      {/* Delete User Modal */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete user:{" "}
          <strong className="text-danger">{userToDelete?.email}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            <Trash size={16} className="me-1" /> Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add User Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add New User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email address</Form.Label>
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
                placeholder="Password"
                ref={passwordRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select ref={roleRef}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Version</Form.Label>
              <Form.Select ref={versionRef}>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseAddModal}>
            Cancel
          </Button>
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
              <Form.Label>Email address</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter email"
                ref={editEmailRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password (leave blank to keep current)</Form.Label>
              <Form.Control
                type="password"
                placeholder="Password"
                ref={editPasswordRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="is_active"
                label="Active"
                ref={editIsActiveRef}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select ref={editRoleRef}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Version</Form.Label>
              <Form.Select ref={editVersionRef}>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpdateUser}>
            Update User
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminUsers;

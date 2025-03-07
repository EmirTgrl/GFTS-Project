import { useState, useEffect, useContext, useCallback, useRef } from "react";
import { AuthContext } from "../../components/Auth/AuthContext";
import { Container, Row, Col, Card, Table, Spinner, Button, Modal, Form } from "react-bootstrap";
import { PencilSquare, Trash, XCircle } from "react-bootstrap-icons";

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token, isAuthenticated } = useContext(AuthContext);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);


  // Refs for Add User form
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // Refs for Edit User form
  const editEmailRef = useRef(null);
  const editPasswordRef = useRef(null);
  const editIsActiveRef = useRef(null);  // Added ref for is_active


  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:5000/api/admin/users", {
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
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUsers();
    }
  }, [isAuthenticated, fetchUsers]);

  if (!isAuthenticated) {
    return (
      <Container className="mt-5">
        <p>You must be logged in as an administrator to view this page.</p>
      </Container>
    );
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
      const response = await fetch(`http://localhost:5000/api/admin/users/delete/${userToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setUsers(users.map((user) =>
        user.id === userToDelete.id ? { ...user, is_active: false } : user
      ));
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
    setError(""); // Clear any previous errors
  };

  const handleAddUser = async () => {
    const email = emailRef.current.value;
    const password = passwordRef.current.value;

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/admin/users/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json(); // Try to get error message from the server
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const newUser = await response.json();
      setUsers([...users, newUser]); //add new user to users array for instant access
      handleCloseAddModal();
      fetchUsers()
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
      // Set the initial values in the edit form

      if (editEmailRef.current) {
        editEmailRef.current.value = userToEdit.email;
      }

      if (editIsActiveRef.current) {
        editIsActiveRef.current.checked = userToEdit.is_active;
      }
    }
  }, [showEditModal, userToEdit]);


  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setUserToEdit(null);
    setError(""); // Clear any previous errors
  };

  const handleUpdateUser = async () => {
    if (!userToEdit) return;

    const email = editEmailRef.current.value;
    const password = editPasswordRef.current.value; // Password is optional for updates
    const is_active = editIsActiveRef.current.checked;  // Get is_active from checkbox


    if (!email) {
      setError("Email is required.");
      return;
    }

    try {
      const requestBody = {
        id: userToEdit.id, // Include the user ID in the request body
        email: email,
        is_active: is_active, // Include is_active in request
      };

      // Only include password if it's provided
      if (password) {
        requestBody.password = password;
      }

      const response = await fetch("http://localhost:5000/api/admin/users/update", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Update the user in the local state
      setUsers(
        users.map((user) =>
          user.id === userToEdit.id ? { ...user, email: email, is_active: is_active } : user
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
                <Button variant="outline-success" className="align-self-center ms-auto me-2" onClick={handleShowAddModal}>
                  Add user
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
                        <td>{user.is_active ? "active" : "passive"}</td>
                        <td>{user.created_at.split(".")[0].split("T").join(" ")}</td>
                        <td className="text-center">
                          <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleShowEditModal(user)}>
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
              <Form.Control type="email" placeholder="Enter email" ref={emailRef} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control type="password" placeholder="Password" ref={passwordRef} />
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
              <Form.Control type="email" placeholder="Enter email" ref={editEmailRef} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password (leave blank to keep current)</Form.Label>
              <Form.Control type="password" placeholder="Password" ref={editPasswordRef} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                id="is_active"
                label="Active"
                ref={editIsActiveRef}
                defaultChecked={false}
              />
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

export default AdminPage;
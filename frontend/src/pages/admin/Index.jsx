import { useContext } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Outlet, Link, Navigate } from "react-router-dom";
import { AuthContext } from "../../components/Auth/AuthContext";
import { PeopleFill, FolderFill } from "react-bootstrap-icons";

const AdminPage = () => {
  const { isAuthenticated, user } = useContext(AuthContext);

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Container>
      <Navbar bg="secondary" expand="lg" className="my-4 rounded">
        <Navbar.Brand as={Link} to="/admin" className="ms-3">
          Admin Dashboard
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-nav" />
        <Navbar.Collapse id="admin-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/admin/users" className="text-white">
              <PeopleFill className="me-1" /> Users
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/projects" className="text-white">
              <FolderFill className="me-1" /> Projects
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Outlet />{" "}
    </Container>
  );
};

export default AdminPage;

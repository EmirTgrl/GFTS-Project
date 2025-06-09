import { useContext } from "react";
import { Container, Nav, Navbar } from "react-bootstrap";
import { Outlet, Link, Navigate } from "react-router-dom";
import { AuthContext } from "../../components/Auth/AuthContext";
import {
  PeopleFill,
  FolderFill,
  TagFill,
  GearFill,
} from "react-bootstrap-icons";
import "../../styles/AdminPage.css";

const AdminPage = () => {
  const { isAuthenticated } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Container fluid className="py-4 admin-panel">
      <Navbar expand="lg" className="my-4 rounded">
        <Navbar.Brand as={Link} to="/admin" className="ms-3 fw-bold">
          Admin Dashboard
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="admin-nav" />
        <Navbar.Collapse id="admin-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/admin/users">
              <PeopleFill className="me-1" /> Users
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/projects">
              <FolderFill className="me-1" /> Projects
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/roles">
              <TagFill className="me-1" /> Roles
            </Nav.Link>
            <Nav.Link as={Link} to="/admin/versions">
              <GearFill className="me-1" /> Versions
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Navbar>
      <Outlet />
    </Container>
  );
};

export default AdminPage;

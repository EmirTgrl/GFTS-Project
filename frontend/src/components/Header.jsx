import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./Auth/AuthContext.js";
import { Navbar, Nav, NavDropdown, Container } from "react-bootstrap";
import { PersonCircle, Upload } from "react-bootstrap-icons";
import "../styles/Header.css";

const Header = () => {
  const { isAuthenticated, logout, username } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { state: { isLogin: true }, replace: true });
  };

  return (
    <Navbar expand="lg" className="custom-navbar" fixed="top">
      <Container>
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <span className="fs-4">KentKart</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {isAuthenticated ? (
              <>
                <Nav.Link
                  as={Link}
                  to="/import"
                  className="nav-link-custom"
                  title="Import"
                >
                  <Upload size={20} />
                </Nav.Link>
                <NavDropdown
                  title={<PersonCircle size={20} />}
                  id="user-dropdown"
                  align="end"
                  className="nav-link-custom"
                >
                  <NavDropdown.Header className="user-name">
                    {username || "Kullanıcı"}
                  </NavDropdown.Header>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={handleLogout}>
                    Logout
                  </NavDropdown.Item>
                </NavDropdown>
              </>
            ) : null}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;

import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./Auth/AuthContext.js";
import { Navbar, Nav, Button, Container } from "react-bootstrap";
import "../styles/Header.css";

const Header = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth/login", { state: { isLogin: true }, replace: true });
  };

  return (
    <Navbar expand="lg" className="custom-navbar" fixed="top">
      <Container>
        <Navbar.Brand
          as={Link}
          to={isAuthenticated ? "/home" : "/auth"}
          className="navbar-brand"
        >
          <span className="brand-highlight">GTFS</span> Editor
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            {isAuthenticated ? (
              <>
                <Nav.Link as={Link} to="/home" className="nav-link-custom">
                  Home
                </Nav.Link>
                <Nav.Link as={Link} to="/map" className="nav-link-custom">
                  Map
                </Nav.Link>
                <Button
                  variant="outline-light"
                  onClick={handleLogout}
                  className="logout-btn ms-3"
                >
                  Logout
                </Button>
              </>
            ) : (
              <Nav.Link
                as={Link}
                to="/auth"
                state={{ isLogin: true }}
                className="nav-link-custom"
              >
                Login
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;

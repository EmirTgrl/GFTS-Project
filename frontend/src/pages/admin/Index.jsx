// frontend/src/pages/admin/Index.jsx
import React from 'react';
import { Container, Row, Col, Nav, Navbar } from 'react-bootstrap';
import { Outlet, Link } from 'react-router-dom';
import {
  PeopleFill, // Icon for Users
  FolderFill,  // Icon for Projects
} from 'react-bootstrap-icons';

const AdminPage = () => {
  return (
    <Container>
          <Navbar bg="secondary" expand="lg" className="my-4 rounded">
            <Navbar.Brand as={Link} to="/admin" className="ms-3">Admin Dashboard</Navbar.Brand>
            <Navbar.Toggle aria-controls="admin-nav" />
            <Navbar.Collapse id="admin-nav">
              <Nav className="me-auto">
                <Nav.Link as={Link} to="/admin/users" className="text-white">
                    <PeopleFill className="me-1"/> Users
                </Nav.Link>
                <Nav.Link as={Link} to="/admin/projects" className="text-white">
                    <FolderFill className="me-1"/>Projects
                </Nav.Link>
              </Nav>
            </Navbar.Collapse>
          </Navbar>
      

          <Outlet /> {/* This is where child routes (Users, Projects) will be rendered */}
        
    </Container>
  );
};

export default AdminPage;

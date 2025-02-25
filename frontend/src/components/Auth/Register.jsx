import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert } from "react-bootstrap";
import "../../styles/Register.css";

const Register = ({ switchToLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      if (response.ok) {
        navigate("/auth", { state: { isRegister: true, isLogin: true } });
      } else {
        setError("Registration failed!");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError("An error occurred!");
    }
  };

  return (
    <Container className="auth-container">
      <div className="form-wrapper">
        <Form onSubmit={handleRegister}>
          <h2 className="title text-center">Register</h2>
          {error && <Alert variant="danger">{error}</Alert>}

          <Form.Group className="mb-3">
            <Form.Label>Email Address</Form.Label>
            <Form.Control
              className="input-field"
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Password</Form.Label>
            <Form.Control
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Form.Group>

          <Button className="styled-button" variant="primary" type="submit">
            Register
          </Button>

          <p className="switch-link text-center mt-3">
            Already have an account?{" "}
            <span className="link" onClick={switchToLogin}>
              Login here
            </span>
          </p>
        </Form>
      </div>
    </Container>
  );
};
Register.propTypes = {
  switchToLogin: PropTypes.func.isRequired,
};

export default Register;

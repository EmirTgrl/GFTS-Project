import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./Auth/AuthContext.js";
import "../styles/Header.css";

const Header = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  return (
    <nav className="header">
      <ul>
        {isAuthenticated ? (
          <>
            <li>
              <Link to="/home">Home</Link>
            </li>
            <li>
              <Link to="/map">Map</Link>
            </li>
            <li>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/auth">Login</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Header;

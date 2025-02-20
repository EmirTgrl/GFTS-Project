import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const updateAuthState = () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        const decodedToken = jwtDecode(storedToken);
        console.log("Decoded Token:", decodedToken);

        if (decodedToken.exp * 1000 > Date.now()) {
          setToken(storedToken);
          setIsAuthenticated(true);

          const userId = decodedToken.id;
          setUserId(userId);
          console.log("User ID from token:", userId);
        } else {
          localStorage.removeItem("token");
          setToken(null);
          setIsAuthenticated(false);
          setUserId(null);
        }
      } else {
        setToken(null);
        setIsAuthenticated(false);
        setUserId(null);
      }
    };

    updateAuthState();
    window.addEventListener("storage", updateAuthState);

    return () => {
      window.removeEventListener("storage", updateAuthState);
    };
  }, []);

  const login = (newToken) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);

    const decodedToken = jwtDecode(newToken);
    console.log("Decoded Token:", decodedToken);

    const userId = decodedToken.id;
    console.log("User ID from token:", userId);

    setUserId(userId);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, token, userId, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

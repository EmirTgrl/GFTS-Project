import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [userId, setUserId] = useState(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  useEffect(() => {
    const updateAuthState = () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        try {
          const decodedToken = jwtDecode(storedToken);

          if (decodedToken.exp * 1000 > Date.now()) {
            setToken(storedToken);
            setIsAuthenticated(true);
            setUserId(decodedToken.id);
            setIsLoggedOut(false);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Token decode error:", error);
          handleLogout();
        }
      }
    };

    updateAuthState();

    const handleStorageChange = (e) => {
      if (e.key === "token") {
        updateAuthState();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);
    setIsLoggedOut(true);
  };

  const login = (newToken) => {
    try {
      const decodedToken = jwtDecode(newToken);
      localStorage.setItem("token", newToken);
      setToken(newToken);
      setUserId(decodedToken.id);
      setIsAuthenticated(true);
      setIsLoggedOut(false);
    } catch (error) {
      console.error("Login error:", error);
      handleLogout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        userId,
        login,
        logout: handleLogout,
        isLoggedOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

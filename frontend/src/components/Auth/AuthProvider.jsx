import { useState, useEffect, useCallback } from "react";
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

  const updateAuthState = useCallback((newToken) => {
    if (newToken) {
      try {
        const decodedToken = jwtDecode(newToken);
        if (decodedToken.exp * 1000 > Date.now()) {
          localStorage.setItem("token", newToken);
          setToken(newToken);
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
    } else {
      handleLogout();
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    updateAuthState(storedToken);

    const handleStorageChange = (e) => {
      if (e.key === "token") {
        updateAuthState(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [updateAuthState]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUserId(null);
    setIsAuthenticated(false);
    setIsLoggedOut(true);
  };

  const login = (newToken) => {
    updateAuthState(newToken);
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

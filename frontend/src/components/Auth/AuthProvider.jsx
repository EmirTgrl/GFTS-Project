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
  const [username, setUsername] = useState(null); 
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUserId(null);
    setUsername(null);
    setIsAuthenticated(false);
    setIsLoggedOut(true);
  }, []);

  const updateAuthState = useCallback(
    (newToken) => {
      if (newToken) {
        try {
          const decodedToken = jwtDecode(newToken);
          if (decodedToken.exp * 1000 > Date.now()) {
            localStorage.setItem("token", newToken);
            setToken(newToken);
            setIsAuthenticated(true);
            setUserId(decodedToken.id);
            setUsername(decodedToken.email); 
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
    },
    [handleLogout]
  );

  const login = (newToken) => {
    updateAuthState(newToken);
  };

  useEffect(() => {
    const checkTokenExpiration = () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const decodedToken = jwtDecode(storedToken);
          if (decodedToken.exp * 1000 < Date.now()) {
            handleLogout();
          } else {
            setIsAuthenticated(true);
            setUserId(decodedToken.id);
            setUsername(decodedToken.email);
            setToken(storedToken);
            setIsLoggedOut(false);
          }
        } catch (error) {
          console.error("Token decode error in interval:", error);
          handleLogout();
        }
      } else {
        setIsAuthenticated(false);
        setUserId(null);
        setUsername(null);
        setToken(null);
      }
    };

    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 10000);

    return () => clearInterval(interval);
  }, [handleLogout]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "token") {
        updateAuthState(e.newValue);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [updateAuthState]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        token,
        userId,
        username,
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

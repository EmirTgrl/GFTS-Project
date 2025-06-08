import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [user, setUser] = useState(null); // user objesi
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
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
            setUser({
              id: decodedToken.id,
              email: decodedToken.email,
              role: decodedToken.role,
              version: decodedToken.version,
            });
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

  const login = useCallback(
    (newToken) => {
      updateAuthState(newToken);
    },
    [updateAuthState]
  );

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
            setUser({
              id: decodedToken.id,
              email: decodedToken.email,
              role: decodedToken.role,
              version: decodedToken.version,
            });
            setToken(storedToken);
            setIsLoggedOut(false);
          }
        } catch (error) {
          console.error("Token decode error in interval:", error);
          handleLogout();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
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
        user,
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

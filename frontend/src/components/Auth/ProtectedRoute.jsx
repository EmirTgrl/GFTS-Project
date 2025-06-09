import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import PropTypes from "prop-types";

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  // Yüklenme aşamasında hiçbir şey gösterme
  if (isAuthenticated === undefined || user === undefined) return null;

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export const AdminProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useContext(AuthContext);

  // Yüklenme aşamasında hiçbir şey gösterme
  if (isAuthenticated === undefined || user === undefined) return null;

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

AdminProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

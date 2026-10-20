import { Navigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";

/** Redirige a /login si el usuario no está autenticado. */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
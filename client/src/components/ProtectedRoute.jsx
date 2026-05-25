import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, authenticated }) {
  return authenticated ? children : <Navigate to="/login" />;
}

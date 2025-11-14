import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import type { RootState } from "../store";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useSelector((state: RootState) => state.auth);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/auth/login" replace />;

  return children;
}

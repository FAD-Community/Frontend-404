import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useAuth } from "../context/AuthContext";

// أي صفحة جوّه الـ Route بتاع AppLayout هتاخد الـ Sidebar أوتوماتيك
export default function AppLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="content" role="status">Loading session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
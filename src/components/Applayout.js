import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

// أي صفحة جوّه الـ Route بتاع AppLayout هتاخد الـ Sidebar أوتوماتيك
export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
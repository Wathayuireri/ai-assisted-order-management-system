import { Outlet } from "react-router-dom";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Since the main Navbar already has a "Sign out" button, we don't need a separate admin header */}
      <main className="max-w-6xl mx-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
import type { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />
      <main className="admin-main-content">
        <AdminTopbar />
        <div className="admin-content-area">{children}</div>
      </main>
    </div>
  );
}

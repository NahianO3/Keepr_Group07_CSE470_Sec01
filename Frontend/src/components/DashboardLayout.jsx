import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}) {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <main className="dashboard-main">
        {children}
      </main>
    </div>
  );
}
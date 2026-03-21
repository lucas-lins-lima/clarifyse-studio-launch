import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell } from "lucide-react";

const DashboardLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar userRole="admin" />
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">Clarifyse Studio</h2>
          <div className="flex items-center gap-3">
            <button className="relative rounded-md p-2 hover:bg-muted transition-colors">
              <Bell size={20} className="text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-secondary" />
            </button>
          </div>
        </header>
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

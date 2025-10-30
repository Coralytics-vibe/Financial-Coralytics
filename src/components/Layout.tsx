"use client";

import { Outlet } from "react-router-dom"; // Import Outlet for nested routes
import Sidebar from "./Sidebar"; // Corrected import for Sidebar (default export)
// Removed MobileSidebar as it is not exported from Sidebar.tsx

// Removed LayoutProps interface as children are handled by Outlet
const Layout = () => { // Removed React.FC type
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* MobileSidebar would typically go here if implemented */}
          <div className="w-full flex-1">
            {/* You can add a header title or other elements here for mobile */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet /> {/* Render nested routes here */}
        </main>
      </div>
    </div>
  );
};

export default Layout;
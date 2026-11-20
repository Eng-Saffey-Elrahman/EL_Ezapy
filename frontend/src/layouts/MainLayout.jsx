import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pms_sidebar_open');
      if (saved !== null) return saved === 'true';
    }
    return true;
  });

  const handleToggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem('pms_sidebar_open', String(next));
      return next;
    });
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    localStorage.setItem('pms_sidebar_open', 'false');
  };

  // On desktop: if sidebar is open, margin-right: 270px; if closed, expanded (0 margin)
  // On mobile: CSS media query always enforces margin-right: 0
  const wrapperClass = sidebarOpen ? 'main-wrapper' : 'main-wrapper expanded';

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />

      <div className={wrapperClass}>
        <Navbar
          sidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="page-content animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

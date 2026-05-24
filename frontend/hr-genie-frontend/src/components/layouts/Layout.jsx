import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useIsMobile from '../../hooks/useIsMobile';
import MobileLayout from './MobileLayout';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile(1024); // Use lg breakpoint

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ backgroundColor: '#F5F4FF', color: '#0F0D2E' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
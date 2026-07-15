import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import useIsMobile from '../../hooks/useIsMobile';
import MobileLayout from './MobileLayout';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile(1024);

  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: '#F7F7F6', color: '#111318' }}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto" style={{ maxWidth: '1600px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
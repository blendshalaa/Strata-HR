import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Calendar as CalendarIcon, MessageSquare, User, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

const BottomNav = ({ onMenuClick }) => {
  const { t } = useTranslation();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard', 'Home') },
    { to: '/leave', icon: CalendarIcon, label: t('sidebar.myLeave', 'Leave') },
    { to: '/chat', icon: MessageSquare, label: t('sidebar.aiAssistant', 'Chat') },
    { to: '/profile', icon: User, label: t('navbar.myProfile', 'Profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-zinc-200 z-40 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 
              `flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
                isActive ? 'text-[#5B4FE8]' : 'text-zinc-500 hover:text-zinc-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-6 h-6 ${isActive ? 'fill-[#EEF0FF]' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
        
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center w-full h-full gap-1 text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <Menu className="w-6 h-6" strokeWidth={2} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </div>
  );
};

const MobileLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F4FF] text-[#0F0D2E] pb-16">
      {/* 
        We reuse the Sidebar for the "Menu" drawer.
        When open, it slides over. 
      */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top Navbar */}
      <Navbar onMenuClick={() => setSidebarOpen(true)} isMobileLayout={true} />

      <main className="flex-1 p-4">
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />
    </div>
  );
};

export default MobileLayout;

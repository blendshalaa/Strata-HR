import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, User, ChevronDown, Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationBell from '../notifications/NotificationBell';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'sq', label: 'SQ' },
  { code: 'de', label: 'DE' },
];

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);
  const langRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (langRef.current && !langRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setLangOpen(false);
  };

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-zinc-100 rounded-md transition-colors"
            >
              <Menu className="w-6 h-6 text-zinc-600" />
            </button>

            <div className="hidden lg:block">
              <h2 className="text-[15px] font-semibold text-zinc-900 tracking-tight">
                {user?.name?.split(' ')[0]}
              </h2>
              <p className="text-[13px] text-zinc-500">
                {user?.org_name && <span className="text-zinc-700 font-medium">{user.org_name}</span>}
                {user?.org_name && user?.department && <span> · </span>}
                {user?.department}
              </p>
            </div>
          </div>

          {/* Right side - Language + Notifications + User menu */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-zinc-100 rounded-md transition-all duration-200 text-zinc-500 hover:text-zinc-900"
              >
                <Globe className="w-4 h-4" />
                <span className="text-[12px] font-bold uppercase tracking-wider">{i18n.language?.substring(0, 2).toUpperCase()}</span>
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-1 w-28 bg-white rounded-md shadow-sm border border-zinc-200 py-1 animate-slideUp z-50">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors ${
                        i18n.language === lang.code
                          ? 'bg-zinc-100 text-zinc-900 font-semibold'
                          : 'text-zinc-600 hover:bg-zinc-50'
                      }`}
                    >
                      {t(`language.${lang.code}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NotificationBell />

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-100 rounded-md transition-all duration-200"
              >
                <div className="w-8 h-8 bg-zinc-900 rounded-md flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-sm border border-zinc-200 py-1.5 animate-slideUp">
                  <div className="px-4 py-2.5 border-b border-zinc-100">
                    <p className="text-[14px] font-medium text-zinc-900">{user?.name}</p>
                    <p className="text-[13px] text-zinc-500">{user?.email}</p>
                  </div>

                  <div className="px-3 py-2">
                    <div className="px-3 py-2 bg-zinc-50 rounded-md">
                      <div className="flex justify-between mb-1 text-[13px] text-zinc-500">
                        <span>{t('navbar.sickLeave')}</span>
                        <span className="font-medium text-zinc-900">{user?.sick_leave_balance}d</span>
                      </div>
                      <div className="flex justify-between text-[13px] text-zinc-500">
                        <span>{t('navbar.vacation')}</span>
                        <span className="font-medium text-zinc-900">{user?.vacation_balance}d</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-zinc-100 px-1.5 pt-1 space-y-0.5">
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors font-medium"
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>{t('navbar.myProfile')}</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] text-zinc-700 hover:bg-zinc-100 rounded-md transition-colors font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t('auth.signOut')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
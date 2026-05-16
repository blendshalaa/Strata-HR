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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setDropdownOpen(false);
      if (langRef.current && !langRef.current.contains(event.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => { logout(); window.location.href = '/login'; };
  const changeLanguage = (code) => { i18n.changeLanguage(code); setLangOpen(false); };

  return (
    <nav
      className="sticky top-0 z-30"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '0.5px solid rgba(0,0,0,0.08)',
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Left */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md transition-colors"
              style={{ color: '#6B7280' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F4FF'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden lg:block">
              <h2 className="text-[15px] font-semibold" style={{ color: '#0F0D2E' }}>
                {user?.name?.split(' ')[0]}
              </h2>
              <p className="text-[13px]" style={{ color: '#6B7280' }}>
                {user?.org_name && <span style={{ color: '#0F0D2E', fontWeight: 500 }}>{user.org_name}</span>}
                {user?.org_name && user?.department && <span> · </span>}
                {user?.department}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1">

            {/* Language switcher */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider transition-colors"
                style={{ color: '#6B7280' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F5F4FF'; e.currentTarget.style.color = '#5B4FE8'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6B7280'; }}
              >
                <Globe className="w-4 h-4" />
                {i18n.language?.substring(0, 2).toUpperCase()}
              </button>

              {langOpen && (
                <div
                  className="absolute right-0 mt-1 w-28 rounded-lg py-1 animate-slideUp z-50"
                  style={{ backgroundColor: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className="w-full text-left px-3 py-1.5 text-[13px] transition-colors"
                      style={{
                        color: i18n.language === lang.code ? '#5B4FE8' : '#6B7280',
                        fontWeight: i18n.language === lang.code ? '600' : '400',
                        backgroundColor: i18n.language === lang.code ? '#EEF0FF' : 'transparent',
                      }}
                      onMouseEnter={e => { if (i18n.language !== lang.code) e.currentTarget.style.backgroundColor = '#F5F4FF'; }}
                      onMouseLeave={e => { if (i18n.language !== lang.code) e.currentTarget.style.backgroundColor = 'transparent'; }}
                    >
                      {t(`language.${lang.code}`)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <NotificationBell />

            {/* User menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F4FF'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
              <div
                  className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center text-white font-bold text-[12px]"
                  style={{ backgroundColor: '#5B4FE8' }}
                >
                  {user?.profile_picture ? (
                    <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || <User className="w-4 h-4" />
                  )}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: '#9CA3AF' }}
                />
              </button>

              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-1 w-64 rounded-lg py-1.5 animate-slideUp z-50"
                  style={{ backgroundColor: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                >
                  {/* User info */}
                  <div className="px-4 py-2.5 flex items-center gap-3" style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-[13px] shrink-0" style={{ backgroundColor: '#5B4FE8' }}>
                      {user?.profile_picture ? (
                        <img src={user.profile_picture} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold truncate" style={{ color: '#0F0D2E' }}>{user?.name}</p>
                      <p className="text-[12px] truncate" style={{ color: '#6B7280' }}>{user?.email}</p>
                    </div>
                  </div>

                  {/* Leave balances */}
                  <div className="px-3 py-2">
                    <div className="px-3 py-2 rounded-md" style={{ backgroundColor: '#F5F4FF' }}>
                      <div className="flex justify-between mb-1 text-[13px]">
                        <span style={{ color: '#6B7280' }}>{t('navbar.sickLeave')}</span>
                        <span className="font-semibold" style={{ color: '#0F0D2E' }}>{user?.sick_leave_balance}d</span>
                      </div>
                      <div className="flex justify-between text-[13px]">
                        <span style={{ color: '#6B7280' }}>{t('navbar.vacation')}</span>
                        <span className="font-semibold" style={{ color: '#0F0D2E' }}>{user?.vacation_balance}d</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-1.5 pt-1 space-y-0.5" style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)' }}>
                    <button
                      onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-md transition-colors font-medium"
                      style={{ color: '#0F0D2E' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F5F4FF'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <User className="w-3.5 h-3.5" style={{ color: '#6B7280' }} />
                      {t('navbar.myProfile')}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[13px] rounded-md transition-colors font-medium"
                      style={{ color: '#DC2626' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t('auth.signOut')}
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
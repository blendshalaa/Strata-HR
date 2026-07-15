import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Menu, LogOut, User, ChevronDown, Globe, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NotificationBell from '../notifications/NotificationBell';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'sq', label: 'SQ' },
  { code: 'de', label: 'DE' },
];

// Map route paths → breadcrumb labels
const BREADCRUMBS = {
  '/dashboard':       ['Dashboard'],
  '/chat':            ['AI Assistant'],
  '/leave':           ['My Work', 'Leave'],
  '/my-timesheets':   ['My Work', 'Timesheets'],
  '/shifts':          ['My Work', 'Shifts'],
  '/my-payslips':     ['My Work', 'Payslips'],
  '/performance':     ['My Work', 'Performance'],
  '/calendar':        ['People', 'Calendar'],
  '/directory':       ['People', 'Directory'],
  '/knowledge':       ['People', 'Knowledge Base'],
  '/training':        ['People', 'Training'],
  '/documents':       ['People', 'Documents'],
  '/recruitment':     ['HR & Payroll', 'Recruitment'],
  '/payroll':         ['HR & Payroll', 'Payroll'],
  '/leave-approvals': ['HR & Payroll', 'Leave Approvals'],
  '/timesheets':      ['HR & Payroll', 'Timesheet Approvals'],
  '/reports':         ['HR & Payroll', 'Reports'],
  '/users':           ['Admin', 'User Management'],
  '/departments':     ['Admin', 'Departments'],
  '/org-settings':    ['Admin', 'Organization'],
  '/audit-log':       ['Admin', 'Audit Log'],
  '/profile':         ['Profile'],
};

const Navbar = ({ onMenuClick, isMobileLayout = false }) => {
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const dropdownRef = useRef(null);
  const langRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => { await logout(); window.location.href = '/login'; };
  const changeLanguage = (code) => { i18n.changeLanguage(code); setLangOpen(false); };

  const crumbs = BREADCRUMBS[location.pathname] || [];

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <nav
      className="sticky top-0 z-30"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        height: '52px',
      }}
    >
      <div className="flex items-center justify-between h-full px-5">

        {/* Left — mobile menu + breadcrumb */}
        <div className="flex items-center gap-3 min-w-0">
          {!isMobileLayout && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-1.5 rounded transition-colors"
              style={{ color: '#6B7280' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Breadcrumb trail */}
          {crumbs.length > 0 && (
            <nav className="hidden sm:flex items-center gap-1" aria-label="Breadcrumb">
              {crumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && (
                    <ChevronRight className="w-3 h-3" style={{ color: '#D1D5DB', flexShrink: 0 }} />
                  )}
                  <span
                    style={{
                      fontSize: '13px',
                      color: i === crumbs.length - 1 ? '#111318' : '#9CA3AF',
                      fontWeight: i === crumbs.length - 1 ? '500' : '400',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </nav>
          )}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">

          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 px-2 py-1.5 rounded text-[12px] font-medium transition-colors"
              style={{ color: '#6B7280' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Globe className="w-3.5 h-3.5" />
              {i18n.language?.substring(0, 2).toUpperCase()}
            </button>

            {langOpen && (
              <div
                className="absolute right-0 mt-1 w-24 rounded-md py-1 animate-slideUp z-50"
                style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="w-full text-left px-3 py-1.5 text-[12px] transition-colors"
                    style={{
                      color: i18n.language?.startsWith(lang.code) ? '#111318' : '#6B7280',
                      fontWeight: i18n.language?.startsWith(lang.code) ? '600' : '400',
                      backgroundColor: i18n.language?.startsWith(lang.code) ? '#F3F4F6' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!i18n.language?.startsWith(lang.code)) e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
                    onMouseLeave={e => { if (!i18n.language?.startsWith(lang.code)) e.currentTarget.style.backgroundColor = 'transparent'; }}
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
              className="flex items-center gap-2 px-2 py-1.5 rounded transition-colors"
              style={{ color: '#374151' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F3F4F6'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {user?.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={user.name}
                  className="w-7 h-7 rounded object-cover"
                  style={{ border: '1px solid #E5E7EB' }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded flex items-center justify-center text-white text-[11px] font-medium"
                  style={{ backgroundColor: '#111318' }}  
                >
                  {initials}
                </div>
              )}
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                style={{ color: '#9CA3AF' }}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-60 rounded-md animate-slideUp z-50 overflow-hidden"
                style={{ backgroundColor: '#fff', border: '1px solid #E5E7EB', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
              >
                {/* Identity */}
                <div className="px-3 py-2.5" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <p className="text-[13px] font-medium" style={{ color: '#111318' }}>{user?.name}</p>
                  <p className="text-[12px]" style={{ color: '#9CA3AF' }}>{user?.email}</p>
                </div>

                {/* Leave balances */}
                <div className="px-3 py-2" style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span style={{ color: '#6B7280' }}>{t('navbar.sickLeave')}</span>
                    <span className="tabular font-medium" style={{ color: '#111318' }}>{user?.sick_leave_balance ?? '—'} days</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px]">
                    <span style={{ color: '#6B7280' }}>{t('navbar.vacation')}</span>
                    <span className="tabular font-medium" style={{ color: '#111318' }}>{user?.vacation_balance ?? '—'} days</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="py-1">
                  <button
                    onClick={() => { setDropdownOpen(false); navigate('/profile'); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors text-left"
                    style={{ color: '#374151' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <User className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                    {t('navbar.myProfile')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors text-left"
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
    </nav>
  );
};

export default Navbar;
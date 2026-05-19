import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Calendar as CalendarIcon,
  BookOpen, Bot, X, Users, CheckSquare, Building2, Briefcase,
  CircleDollarSign, TrendingUp, CalendarDays, Sparkles, Clock,
  User, FileText, Contact, ChevronDown, Target, BarChart3,
  Settings, Layers
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isOpen, onClose }) => {
  const { isHR, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      key: 'overview',
      label: t('sidebar.overview'),
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard'), roles: ['employee', 'hr', 'admin'] },
        { to: '/chat', icon: MessageSquare, label: t('sidebar.aiAssistant'), roles: ['employee', 'hr', 'admin'] },
      ]
    },
    {
      key: 'my-work',
      label: t('sidebar.myWork'),
      items: [
        { to: '/leave', icon: CalendarIcon, label: t('sidebar.myLeave'), roles: ['employee', 'hr', 'admin'] },
        { to: '/my-timesheets', icon: Clock, label: t('sidebar.myTimesheets'), roles: ['employee', 'hr', 'admin'] },
        { to: '/shifts', icon: Layers, label: t('sidebar.myShifts'), roles: ['employee', 'hr', 'admin'] },
        { to: '/my-payslips', icon: FileText, label: t('sidebar.myPayslips'), roles: ['employee', 'hr', 'admin'] },
        { to: '/performance', icon: TrendingUp, label: t('sidebar.performance'), roles: ['employee', 'hr', 'admin'] },
      ]
    },
    {
      key: 'company',
      label: t('sidebar.company'),
      items: [
        { to: '/calendar', icon: CalendarDays, label: t('sidebar.calendar'), roles: ['employee', 'hr', 'admin'] },
        { to: '/directory', icon: Contact, label: t('sidebar.directory'), roles: ['employee', 'hr', 'admin'] },
        { to: '/knowledge', icon: BookOpen, label: t('sidebar.knowledgeBase'), roles: ['employee', 'hr', 'admin'] },
        { to: '/documents', icon: FileText, label: t('sidebar.documents'), roles: ['employee', 'hr', 'admin'] },
      ]
    },
    {
      key: 'hr',
      label: t('sidebar.hrManagement'),
      items: [
        { to: '/recruitment', icon: Briefcase, label: t('sidebar.recruitment'), roles: ['hr', 'admin'] },
        { to: '/payroll', icon: CircleDollarSign, label: t('sidebar.payroll'), roles: ['hr', 'admin'] },
        { to: '/leave-approvals', icon: CheckSquare, label: t('sidebar.leaveApprovals'), roles: ['hr', 'admin'] },
        { to: '/timesheets', icon: Clock, label: t('sidebar.timesheetApprovals'), roles: ['hr', 'admin'] },
        { to: '/reports', icon: BarChart3, label: t('sidebar.reports'), roles: ['hr', 'admin'] },
      ]
    },
    {
      key: 'admin',
      label: t('sidebar.administration'),
      items: [
        { to: '/users', icon: Users, label: t('sidebar.userManagement'), roles: ['admin', 'hr'] },
        { to: '/departments', icon: Building2, label: t('sidebar.departments'), roles: ['admin', 'hr'] },
        { to: '/org-settings', icon: Settings, label: t('sidebar.organization'), roles: ['admin'] },
      ]
    },
  ];

  const shouldShowItem = (item) => {
    if (isAdmin) return true;
    if (isHR && (item.roles.includes('hr') || item.roles.includes('employee'))) return true;
    return item.roles.includes('employee');
  };

  const shouldShowSection = (section) => section.items.some(shouldShowItem);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{ backgroundColor: '#1E1B4B', width: '240px' }}
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div
          className="flex items-center justify-between px-5 h-16 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2.5">
            <Logo className="w-8 h-8" />
            <h1 className="text-[15px] font-bold text-white tracking-tight">
              {t('common.appName')}
            </h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {sections.filter(shouldShowSection).map((section, idx) => {
            const isCollapsed = collapsed[section.key];
            const visibleItems = section.items.filter(shouldShowItem);

            return (
              <div key={section.key} className={idx > 0 ? 'mt-5' : ''}>
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-2 py-1.5 mb-1"
                >
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.1em]"
                    style={{ color: 'rgba(255,255,255,0.35)' }}
                  >
                    {section.label}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                        className="block"
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: isActive ? '600' : '400',
                          color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                          backgroundColor: isActive ? '#5B4FE8' : 'transparent',
                          transition: 'all 0.15s ease',
                          textDecoration: 'none',
                        })}
                        onMouseEnter={e => {
                          if (!e.currentTarget.style.backgroundColor.includes('5B4FE8')) {
                            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.07)';
                            e.currentTarget.style.color = '#FFFFFF';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!e.currentTarget.getAttribute('aria-current')) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'rgba(255,255,255,0.65)';
                          }
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              className="flex-shrink-0"
                              style={{
                                width: '15px',
                                height: '15px',
                                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                              }}
                            />
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom help card */}
        <div
          className="p-4 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: 'rgba(91,79,232,0.25)', border: '1px solid rgba(91,79,232,0.3)' }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" style={{ color: '#A89CFF' }} />
              <p className="text-[12px] font-semibold text-white">
                {t('sidebar.helpAndSupport')}
              </p>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {t('sidebar.askAiAboutPolicies')}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

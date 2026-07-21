import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, MessageSquare, Calendar as CalendarIcon,
  BookOpen, X, Users, CheckSquare, Building2, Briefcase,
  CircleDollarSign, TrendingUp, CalendarDays, Clock,
  User, FileText, Contact, ChevronRight, Target, BarChart3,
  Settings, Layers, ShieldCheck, GraduationCap, Bot, Trophy
} from 'lucide-react';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const NAV_GROUPS = (t) => [
  {
    key: 'overview',
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard'),   roles: ['employee', 'hr', 'admin'] },
      { to: '/chat',      icon: Bot,             label: 'AI Assistant',            roles: ['employee', 'hr', 'admin'] },
    ]
  },
  {
    key: 'my-work',
    label: 'My Work',
    items: [
      { to: '/leave',          icon: CalendarIcon, label: t('sidebar.myLeave'),        roles: ['employee', 'hr', 'admin'] },
      { to: '/my-timesheets',  icon: Clock,         label: t('sidebar.myTimesheets'),   roles: ['employee', 'hr', 'admin'] },
      { to: '/shifts',         icon: Layers,        label: t('sidebar.myShifts'),       roles: ['employee', 'hr', 'admin'] },
      { to: '/my-payslips',    icon: FileText,      label: t('sidebar.myPayslips'),     roles: ['employee', 'hr', 'admin'] },
      { to: '/goals',          icon: Trophy,        label: t('sidebar.goals', 'Goals'), roles: ['employee', 'hr', 'admin'] },
      { to: '/performance',    icon: TrendingUp,    label: t('sidebar.performance'),    roles: ['employee', 'hr', 'admin'] },
    ]
  },
  {
    key: 'people',
    label: 'People',
    items: [
      { to: '/calendar',   icon: CalendarDays,    label: t('sidebar.calendar'),      roles: ['employee', 'hr', 'admin'] },
      { to: '/directory',  icon: Contact,         label: t('sidebar.directory'),     roles: ['employee', 'hr', 'admin'] },
      { to: '/knowledge',  icon: BookOpen,        label: t('sidebar.knowledgeBase'), roles: ['employee', 'hr', 'admin'] },
      { to: '/training',   icon: GraduationCap,   label: 'Training',                 roles: ['employee', 'hr', 'admin'] },
      { to: '/documents',  icon: FileText,        label: t('sidebar.documents'),     roles: ['employee', 'hr', 'admin'] },
    ]
  },
  {
    key: 'hr',
    label: 'HR & Payroll',
    items: [
      { to: '/recruitment',     icon: Briefcase,        label: t('sidebar.recruitment'),         roles: ['hr', 'admin'] },
      { to: '/payroll',         icon: CircleDollarSign, label: t('sidebar.payroll'),             roles: ['hr', 'admin'] },
      { to: '/leave-approvals', icon: CheckSquare,      label: t('sidebar.leaveApprovals'),      roles: ['hr', 'admin'] },
      { to: '/timesheets',      icon: Clock,            label: t('sidebar.timesheetApprovals'),  roles: ['hr', 'admin'] },
      { to: '/reports',         icon: BarChart3,        label: t('sidebar.reports'),             roles: ['hr', 'admin'] },
    ]
  },
  {
    key: 'admin',
    label: 'Admin',
    items: [
      { to: '/users',       icon: Users,       label: t('sidebar.userManagement'), roles: ['admin', 'hr'] },
      { to: '/departments', icon: Building2,   label: t('sidebar.departments'),    roles: ['admin', 'hr'] },
      { to: '/org-settings',icon: Settings,    label: t('sidebar.organization'),   roles: ['admin'] },
      { to: '/audit-log',   icon: ShieldCheck, label: t('sidebar.auditLog'),       roles: ['admin', 'hr'] },
    ]
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { isHR, isAdmin } = useAuth();
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState({});

  const toggle = (key) => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));

  const canSee = (item) => {
    if (isAdmin) return true;
    if (isHR && (item.roles.includes('hr') || item.roles.includes('employee'))) return true;
    return item.roles.includes('employee');
  };

  const groups = NAV_GROUPS(t).filter(g => g.items.some(canSee));

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={onClose}
        />
      )}

      <aside
        style={{ backgroundColor: '#1A1D23', width: '240px', minWidth: '240px' }}
        className={`
          fixed top-0 left-0 z-50 h-screen flex flex-col flex-shrink-0
          transform transition-transform duration-250 ease-in-out
          lg:translate-x-0 lg:static lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / brand */}
        <div
          className="flex items-center justify-between px-4 h-[52px] flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2.5">
            <Logo className="w-7 h-7" color="#ffffff" />
            <span className="text-[14px] font-medium text-white tracking-tight">
              {t('common.appName')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {groups.map((group, idx) => {
            const isCollapsed = collapsed[group.key];
            const visible = group.items.filter(canSee);
            return (
              <div key={group.key} className={idx > 0 ? 'mt-4' : ''}>
                {/* Group header */}
                <button
                  onClick={() => toggle(group.key)}
                  className="w-full flex items-center justify-between px-2 py-1 mb-0.5 group"
                >
                  <span
                    className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    {group.label}
                  </span>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform duration-150 ${isCollapsed ? '' : 'rotate-90'}`}
                    style={{ color: 'rgba(255,255,255,0.2)' }}
                  />
                </button>

                {!isCollapsed && (
                  <div>
                    {visible.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                        style={({ isActive }) => ({
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '400',
                          position: 'relative',
                          textDecoration: 'none',
                          color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                          backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                          marginBottom: '1px',
                          transition: 'color 0.12s ease, background-color 0.12s ease',
                        })}
                        onMouseEnter={e => {
                          if (!e.currentTarget.dataset.active) {
                            e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
                          }
                        }}
                        onMouseLeave={e => {
                          if (!e.currentTarget.dataset.active) {
                            // let the style prop take over on re-render
                          }
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            {/* Left border accent — active only */}
                            {isActive && (
                              <span
                                style={{
                                  position: 'absolute',
                                  left: 0,
                                  top: '6px',
                                  bottom: '6px',
                                  width: '2px',
                                  borderRadius: '0 2px 2px 0',
                                  backgroundColor: '#FFFFFF',
                                }}
                              />
                            )}
                            <item.icon
                              style={{
                                width: '15px',
                                height: '15px',
                                flexShrink: 0,
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.35)',
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

        {/* Bottom version tag */}
        <div
          className="px-4 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
            Strata HR · v2.0
          </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

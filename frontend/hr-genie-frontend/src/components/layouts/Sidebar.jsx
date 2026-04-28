import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Calendar as CalendarIcon,
  BookOpen,
  Bot,
  X,
  Users,
  CheckSquare,
  Building2,
  Briefcase,
  CircleDollarSign,
  TrendingUp,
  CalendarDays,
  Sparkles,
  Clock,
  User,
  FileText,
  Contact,
  ChevronDown,
  Target,
  BarChart3,
  Settings,
  Layers
} from 'lucide-react';
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
        { to: '/shifts', icon: Layers, label: t('sidebar.shiftSchedule'), roles: ['hr', 'admin'] },
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

  const shouldShowSection = (section) => {
    return section.items.some(shouldShowItem);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-[240px]
          bg-zinc-50 border-r border-zinc-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-zinc-900 rounded-[4px] flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-[15px] font-bold text-zinc-900 tracking-tight">{t('common.appName')}</h1>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-3 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {sections.filter(shouldShowSection).map((section, idx) => {
            const isCollapsed = collapsed[section.key];
            const visibleItems = section.items.filter(shouldShowItem);

            return (
              <div key={section.key} className={idx > 0 ? 'mt-4' : ''}>
                <button
                  onClick={() => toggleSection(section.key)}
                  className="w-full flex items-center justify-between px-3 py-1.5 mb-1 group"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-zinc-600 transition-colors">
                    {section.label}
                  </span>
                  <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {visibleItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => window.innerWidth < 1024 && onClose()}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-md transition-all duration-150 group ${isActive
                            ? 'bg-zinc-200/50 text-zinc-900 font-medium'
                            : 'text-zinc-600 hover:bg-zinc-100/80 hover:text-zinc-900'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon className={`w-[16px] h-[16px] ${isActive ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                            <span className="text-[13px]">{item.label}</span>
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

        {/* Bottom Help Card */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 bg-zinc-50">
          <div className="p-3 bg-white border border-zinc-200 rounded-md">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-zinc-900" />
              <p className="text-xs font-semibold text-zinc-900">
                {t('sidebar.helpAndSupport')}
              </p>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              {t('sidebar.askAiAboutPolicies')}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

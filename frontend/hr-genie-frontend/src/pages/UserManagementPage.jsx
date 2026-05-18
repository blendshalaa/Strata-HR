import React, { useState, useEffect } from 'react';
import { userAPI, departmentAPI } from '../services/api';
import { Users, Search, Edit, Mail, Briefcase, Calendar, Save, X, Plus, Trash2, UserPlus, Shield, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const UserManagementPage = () => {
  const { isHR, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!isHR) {
      navigate('/dashboard');
      return;
    }
    fetchDepartments();
  }, [isHR]);

  // Fetch users whenever filters change (also runs on mount)
  useEffect(() => {
    if (!isHR) return;
    fetchUsers();
  }, [isHR, filterDepartment, filterRole]);

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAll({
        department: filterDepartment || undefined,
        role: filterRole || undefined,
      });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentAPI.getAll();
      setDepartments(response.data.departments || []);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDelete = async (userId) => {
    setDeleteLoading(true);
    try {
      await userAPI.delete(userId);
      setShowDeleteConfirm(null);
      toast.success(t('users.userDeleted'));
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || t('users.failedToDelete'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    const colors = {
      admin: 'bg-red-50 text-red-700 border-red-200',
      hr: 'bg-amber-50 text-amber-700 border-amber-200',
      employee: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    };
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${colors[role]}`}>
        {role === 'admin' && <Shield className="w-3 h-3" />}
        {role}
      </span>
    );
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Deterministic colour from name so each person always gets the same hue
  const INITIALS_COLORS = [
    'bg-blue-100 border-blue-200 text-blue-900',
    'bg-emerald-100 border-emerald-200 text-emerald-900',
    'bg-violet-100 border-violet-200 text-violet-900',
    'bg-amber-100 border-amber-200 text-amber-900',
    'bg-rose-100 border-rose-200 text-rose-900',
    'bg-sky-100 border-sky-200 text-sky-900',
    'bg-orange-100 border-orange-200 text-orange-900',
    'bg-teal-100 border-teal-200 text-teal-900',
  ];
  const getInitialsColor = (name = '') => {
    const hash = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return INITIALS_COLORS[hash % INITIALS_COLORS.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-[#5B4FE8] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('users.title')}</h1>
          <p className="text-zinc-500 text-sm">{t('users.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="hidden sm:flex items-center gap-2 bg-white text-zinc-700 border border-zinc-200 px-5 py-2.5 rounded-md hover:bg-zinc-50 transition-colors font-bold text-sm"
          >
            <Mail className="w-4 h-4" />
            {t('users.invite')}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#5B4FE8] text-white px-5 py-2.5 rounded-md hover:bg-[#4a3fd4] transition-colors font-bold text-sm"
          >
            <UserPlus className="w-4 h-4" />
            {t('users.addUser')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-zinc-200 rounded-md p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('users.searchPlaceholder')}
                className="w-full px-4 py-2.5 pl-10 bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder-zinc-400 text-sm font-medium outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
              />
            </div>
          </div>
          <div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 text-sm font-medium outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
            >
              <option value="">{t('users.allRoles')}</option>
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </div>
          <div>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 text-sm font-medium outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
            >
              <option value="">{t('users.allDepartments')}</option>
              {(() => {
                const deptNames = new Set([
                  ...departments.map(d => d.name),
                  ...users.map(u => u.department).filter(Boolean)
                ]);
                return [...deptNames].sort().map(name => (
                  <option key={name} value={name}>{name}</option>
                ));
              })()}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-zinc-200 rounded-md p-5">
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">{t('users.totalUsers')}</p>
            <p className="text-2xl font-black text-zinc-900">{users.length}</p>
          </div>
          {isAdmin && (
            <div className="bg-white border border-zinc-200 rounded-md p-5">
              <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">{t('users.admins')}</p>
              <p className="text-2xl font-black text-zinc-900">{users.filter(u => u.role === 'admin').length}</p>
            </div>
          )}
          <div className="bg-white border border-zinc-200 rounded-md p-5">
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">{t('users.hrStaff')}</p>
            <p className="text-2xl font-black text-zinc-900">{users.filter(u => u.role === 'hr').length}</p>
          </div>
          <div className="bg-white border border-zinc-200 rounded-md p-5">
            <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-2">{t('users.employees')}</p>
            <p className="text-2xl font-black text-zinc-900">{users.filter(u => u.role === 'employee').length}</p>
          </div>
        </div>

      {/* Desktop Users Table */}
      <div className="bg-white border border-zinc-200 rounded-md overflow-hidden shadow-sm hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('users.user')}</th>
                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('nav.departments')}</th>
                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('users.role')}</th>
                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('leave.startDate')}</th>
                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('users.leaveBalance')}</th>
                <th className="px-6 py-4 font-black text-zinc-900 text-[10px] uppercase tracking-widest">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-md flex items-center justify-center font-black text-[11px] ${getInitialsColor(user.name)}`}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-[14px]">{user.name}</p>
                        <p className="text-[12px] text-zinc-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-700 font-medium text-[13px]">
                      {user.department || <span className="text-zinc-400 italic">{t('common.unassigned')}</span>}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 font-medium text-[13px]">
                    {user.hire_date ? new Date(user.hire_date).toLocaleDateString() : <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[12px] space-y-1">
                      <p><span className="inline-block w-8 font-black text-zinc-900">{user.sick_leave_balance}</span><span className="text-zinc-400 font-bold">{t('users.sick')}</span></p>
                      <p><span className="inline-block w-8 font-black text-zinc-900">{user.vacation_balance}</span><span className="text-zinc-400 font-bold">{t('users.vacationLabel')}</span></p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(user)} className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors" title={t('users.editUser')}><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setShowDeleteConfirm(user)} className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title={t('users.deleteUser')}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center">
                    <Users className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-[14px] font-black text-zinc-900 uppercase tracking-widest">{t('users.noUsersFound')}</p>
                    <p className="text-[12px] text-zinc-500 mt-1">{t('users.tryAdjusting')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile User Cards */}
      <div className="md:hidden space-y-3">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white border border-zinc-200 rounded-md p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-md flex items-center justify-center font-black text-[12px] border ${getInitialsColor(user.name)}`}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-zinc-900 text-[14px] truncate">{user.name}</p>
                <p className="text-[12px] text-zinc-500 truncate">{user.email}</p>
              </div>
              {getRoleBadge(user.role)}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px] bg-zinc-50 rounded-md p-3 border border-zinc-100 mb-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">{t('nav.departments')}</p>
                <p className="font-medium text-zinc-700">{user.department || <span className="text-zinc-400 italic">{t('common.unassigned')}</span>}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">{t('leave.startDate')}</p>
                <p className="font-medium text-zinc-700">{user.hire_date ? new Date(user.hire_date).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">{t('users.sick')}</p>
                <p className="font-bold text-zinc-900">{user.sick_leave_balance}d</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mb-0.5">{t('users.vacationLabel')}</p>
                <p className="font-bold text-zinc-900">{user.vacation_balance}d</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-3">
              <button onClick={() => handleEdit(user)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-zinc-600 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors">
                <Edit className="w-3.5 h-3.5" /> {t('common.edit')}
              </button>
              <button onClick={() => setShowDeleteConfirm(user)} className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-bold text-red-600 border border-red-100 rounded-md hover:bg-red-50 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="bg-white border border-zinc-200 rounded-md p-12 text-center">
            <Users className="w-10 h-10 text-zinc-200 mx-auto mb-3" />
            <p className="text-[13px] font-bold text-zinc-500">{t('users.noUsersFound')}</p>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <EditUserModal
          user={editingUser}
          departments={departments}
          isAdmin={isAdmin}
          isHR={isHR}
          onClose={() => {
            setShowEditModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-lg max-w-md w-full animate-fadeIn shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900 mb-2">{t('users.deleteUser')}</h3>
              <p className="text-zinc-600 mb-1">
                {t('users.deleteUserConfirm')} <strong>{showDeleteConfirm.name}</strong>?
              </p>
              <p className="text-sm text-zinc-500">{t('users.cannotBeUndone')}</p>
            </div>
            <div className="border-t border-zinc-200 p-4 flex gap-3">
            <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 bg-white text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors font-bold text-sm"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm.id)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors font-bold text-sm disabled:opacity-50"
              >
                {deleteLoading ? t('common.deleting') : t('users.deleteUser')}
              </button>
            </div>
          </div>
        </div>
      )}
      {showCreateModal && (
        <CreateUserModal
          departments={departments}
          isAdmin={isAdmin}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
            toast.success(t('users.userCreated'));
          }}
        />
      )}

      {showInviteModal && (
        <InviteUserModal onClose={() => setShowInviteModal(false)} />
      )}
    </div>
  );
};

// Invite User Modal
const InviteUserModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await userAPI.invite(email);
      setSuccess(true);
      setTimeout(onClose, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invitation');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full animate-fadeIn shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="border-b border-zinc-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-md">
              <Mail className="w-5 h-5 text-zinc-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Invite User via Email</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-md transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-md flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">Invitation Sent!</h3>
            <p className="text-zinc-500">An invitation email has been sent to {email}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] text-zinc-900 outline-none transition-all"
                placeholder="employee@company.com"
                required
              />
              <p className="text-xs text-zinc-500 mt-2">The user will receive an email with an invite link to set up their account.</p>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-zinc-200 mt-6">
              <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="px-5 py-2.5 text-sm font-bold bg-[#5B4FE8] text-white rounded-md hover:bg-[#4a3fd4] transition-colors disabled:opacity-50">
                {loading ? 'Sending...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Create User Modal
const CreateUserModal = ({ departments, isAdmin, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    department: '',
    role: 'employee',
    hire_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await userAPI.create(formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full animate-fadeIn shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="border-b border-zinc-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-md">
              <UserPlus className="w-5 h-5 text-zinc-600" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900">Add New User</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-md transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
                placeholder="John Doe"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
                placeholder="john@company.com"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
                placeholder="Minimum 6 characters"
                minLength={6}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
              >
                <option value="">Select department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
                required
              >
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                {isAdmin && <option value="admin">Admin</option>}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Hire Date</label>
              <input
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5B4FE8] text-white px-4 py-3 rounded-md hover:bg-[#4a3fd4] transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-sm"
            >
              <UserPlus className="w-5 h-5" />
              {loading ? 'Creating...' : 'Create User'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors font-bold text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
const EditUserModal = ({ user, departments, isAdmin, isHR, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    department: user.department || '',
    role: user.role,
    hire_date: user.hire_date ? user.hire_date.split('T')[0] : '',
    sick_leave_balance: user.sick_leave_balance,
    vacation_balance: user.vacation_balance,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await userAPI.update(user.id, formData);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-lg w-full animate-fadeIn shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="border-b border-zinc-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-100 rounded-md">
              <Edit className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Edit User</h2>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-md transition-colors">
            <X className="w-5 h-5 text-zinc-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Department</label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
            >
              <option value="">Select department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
              required
            >
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">Hire Date</label>
            <input
              type="date"
              value={formData.hire_date}
              onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
              className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Sick Leave Balance</label>
              <input
                type="number"
                value={formData.sick_leave_balance}
                onChange={(e) => setFormData({ ...formData, sick_leave_balance: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1.5">Vacation Balance</label>
              <input
                type="number"
                value={formData.vacation_balance}
                onChange={(e) => setFormData({ ...formData, vacation_balance: parseInt(e.target.value) })}
                className="w-full px-4 py-2.5 bg-white border border-zinc-200 rounded-md text-zinc-900 outline-none focus:border-[#5B4FE8] focus:ring-1 focus:ring-[#5B4FE8] transition-all"
                min="0"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-zinc-200">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#5B4FE8] text-white px-4 py-3 rounded-md hover:bg-[#4a3fd4] transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-sm"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white text-zinc-700 border border-zinc-200 rounded-md hover:bg-zinc-50 transition-colors font-bold text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserManagementPage;
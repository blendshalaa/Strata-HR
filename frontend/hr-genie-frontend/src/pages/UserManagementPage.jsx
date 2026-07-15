import React, { useState, useEffect } from 'react';
import { userAPI, departmentAPI } from '../services/api';
import { Users, Search, Edit, Mail, Save, X, Plus, Trash2, UserPlus, Shield, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const COLORS = ['#111318','#16A34A','#D97706','#DC2626','#374151','#0891B2','#BE185D','#047857'];
const avatarColor = (name = '') => {
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLORS[h % COLORS.length];
};

const RoleChip = ({ role }) => {
  const map = { admin: 'chip-red', hr: 'chip-amber', employee: 'chip-neutral' };
  return (
    <span className={`chip ${map[role] || 'chip-neutral'}`}>
      {role === 'admin' && <Shield className="w-2.5 h-2.5" />}
      {role}
    </span>
  );
};

const UserManagementPage = () => {
  const { isHR, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!isHR) { navigate('/dashboard'); return; }
    departmentAPI.getAll().then(r => setDepartments(r.data.departments || [])).catch(() => {});
  }, [isHR]);

  useEffect(() => {
    if (!isHR) return;
    userAPI.getAll({ department: filterDept || undefined, role: filterRole || undefined })
      .then(r => setUsers(r.data.users))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isHR, filterDept, filterRole]);

  const handleSort = (key) => {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(true); }
  };

  const filtered = users
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const av = (a[sortKey] || '').toString().toLowerCase();
      const bv = (b[sortKey] || '').toString().toLowerCase();
      return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av);
    });

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await userAPI.delete(deleteTarget.id);
      toast.success('User deleted');
      setDeleteTarget(null);
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const SortIcon = ({ col }) => (
    sortKey === col
      ? (sortAsc ? <ChevronUp className="w-3 h-3 inline ml-0.5" /> : <ChevronDown className="w-3 h-3 inline ml-0.5" />)
      : <span className="w-3 h-3 inline-block ml-0.5 opacity-0">↕</span>
  );

  if (loading) return (
    <div className="space-y-4 animate-fadeIn">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="skeleton h-10 w-full rounded" />
      <div className="skeleton h-64 w-full rounded" />
    </div>
  );

  const allDeptNames = [...new Set([
    ...departments.map(d => d.name),
    ...users.map(u => u.department).filter(Boolean),
  ])].sort();

  return (
    <div className="space-y-4 animate-fadeIn">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            People
            <span className="section-label normal-case font-normal">· {filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowInvite(true)} className="btn-secondary">
            <Mail className="w-3.5 h-3.5" />
            Invite
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <UserPlus className="w-3.5 h-3.5" />
            Add user
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name or email…"
            className="input pl-8"
            style={{ height: '34px', fontSize: '13px' }}
          />
        </div>
        <select
          value={filterRole}
          onChange={e => setFilterRole(e.target.value)}
          className="input"
          style={{ width: '130px', height: '34px', fontSize: '13px' }}
        >
          <option value="">All roles</option>
          <option value="employee">Employee</option>
          <option value="hr">HR</option>
          {isAdmin && <option value="admin">Admin</option>}
        </select>
        <select
          value={filterDept}
          onChange={e => setFilterDept(e.target.value)}
          className="input"
          style={{ width: '160px', height: '34px', fontSize: '13px' }}
        >
          <option value="">All departments</option>
          {allDeptNames.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>

      {/* Quick stat strip */}
      <div className="flex items-stretch border border-[#E5E7EB] rounded-md bg-white overflow-hidden">
        {[
          { label: 'Total', value: users.length },
          { label: 'Employees', value: users.filter(u => u.role === 'employee').length },
          { label: 'HR Staff', value: users.filter(u => u.role === 'hr').length },
          ...(isAdmin ? [{ label: 'Admins', value: users.filter(u => u.role === 'admin').length }] : []),
        ].map((s, i, arr) => (
          <div
            key={s.label}
            className="flex-1 px-4 py-2.5"
            style={{ borderRight: i < arr.length - 1 ? '1px solid #E5E7EB' : 'none' }}
          >
            <p className="section-label mb-0.5">{s.label}</p>
            <p className="tabular text-[18px] font-medium" style={{ color: '#111318', lineHeight: '1.2' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th>
                <button onClick={() => handleSort('name')} className="flex items-center gap-0.5 hover:text-gray-700 transition-colors">
                  Employee <SortIcon col="name" />
                </button>
              </th>
              <th>
                <button onClick={() => handleSort('department')} className="flex items-center gap-0.5 hover:text-gray-700 transition-colors">
                  Department <SortIcon col="department" />
                </button>
              </th>
              <th>Role</th>
              <th>
                <button onClick={() => handleSort('hire_date')} className="flex items-center gap-0.5 hover:text-gray-700 transition-colors">
                  Hire date <SortIcon col="hire_date" />
                </button>
              </th>
              <th>Leave balance</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(user => (
              <tr key={user.id} className="group">
                <td>
                  <div className="flex items-center gap-2.5">
                    {user.profile_picture ? (
                      <img src={user.profile_picture} alt={user.name}
                        className="w-7 h-7 rounded object-cover flex-shrink-0"
                        style={{ border: '1px solid #E5E7EB' }} />
                    ) : (
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0"
                        style={{ backgroundColor: avatarColor(user.name) }}
                      >
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate" style={{ fontSize: '13px', color: '#111318' }}>{user.name}</p>
                      <p className="truncate" style={{ fontSize: '11px', color: '#9CA3AF' }}>{user.email}</p>
                    </div>
                  </div>
                </td>
                <td style={{ color: '#6B7280' }}>
                  {user.department || <span style={{ color: '#D1D5DB' }}>—</span>}
                </td>
                <td><RoleChip role={user.role} /></td>
                <td className="tabular" style={{ color: '#6B7280' }}>
                  {user.hire_date
                    ? new Date(user.hire_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : <span style={{ color: '#D1D5DB' }}>—</span>}
                </td>
                <td className="tabular" style={{ fontSize: '12px', color: '#6B7280' }}>
                  <span style={{ color: '#111318', fontWeight: '500' }}>{user.sick_leave_balance}</span> sick ·{' '}
                  <span style={{ color: '#111318', fontWeight: '500' }}>{user.vacation_balance}</span> vac
                </td>
                <td>
                  <div className="row-actions flex items-center gap-1 justify-end">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: '#9CA3AF' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                      title="Edit user"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(user)}
                      className="p-1.5 rounded transition-colors"
                      style={{ color: '#9CA3AF' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#FEF2F2'; e.currentTarget.style.color = '#DC2626'; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
                      title="Delete user"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <p style={{ fontSize: '13px', color: '#9CA3AF' }}>No users match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.map(user => (
          <div key={user.id} className="card">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded flex items-center justify-center text-white text-[11px] font-medium"
                style={{ backgroundColor: avatarColor(user.name) }}>
                {getInitials(user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium" style={{ fontSize: '13px' }}>{user.name}</p>
                <p style={{ fontSize: '11px', color: '#9CA3AF' }}>{user.email}</p>
              </div>
              <RoleChip role={user.role} />
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[12px] mb-3">
              <div><p className="section-label mb-0.5">Dept</p><p style={{ color: '#374151' }}>{user.department || '—'}</p></div>
              <div><p className="section-label mb-0.5">Hired</p><p style={{ color: '#374151' }}>{user.hire_date ? new Date(user.hire_date).toLocaleDateString() : '—'}</p></div>
              <div><p className="section-label mb-0.5">Sick</p><p className="tabular font-medium">{user.sick_leave_balance}d</p></div>
              <div><p className="section-label mb-0.5">Vacation</p><p className="tabular font-medium">{user.vacation_balance}d</p></div>
            </div>
            <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid #F3F4F6' }}>
              <button onClick={() => setEditingUser(user)} className="btn-secondary flex-1" style={{ fontSize: '12px', padding: '5px 10px' }}>
                <Edit className="w-3 h-3" /> Edit
              </button>
              <button onClick={() => setDeleteTarget(user)} className="btn-ghost flex-1" style={{ fontSize: '12px', color: '#DC2626' }}>
                <Trash2 className="w-3 h-3" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {editingUser && (
        <EditModal
          user={editingUser}
          departments={allDeptNames}
          isAdmin={isAdmin}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            userAPI.getAll().then(r => setUsers(r.data.users)).catch(() => {});
            toast.success('User updated');
          }}
        />
      )}

      {showCreate && (
        <CreateModal
          departments={allDeptNames}
          isAdmin={isAdmin}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            userAPI.getAll().then(r => setUsers(r.data.users)).catch(() => {});
            toast.success('User created');
          }}
        />
      )}

      {showInvite && <InviteModal onClose={() => setShowInvite(false)} />}

      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-panel" style={{ maxWidth: '360px' }} onClick={e => e.stopPropagation()}>
            <div className="p-5">
              <h2 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '6px' }}>Delete {deleteTarget.name}?</h2>
              <p style={{ fontSize: '13px', color: '#6B7280' }}>This action cannot be undone. All associated data will be removed.</p>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} disabled={deleteLoading} className="btn-danger flex-1">
                {deleteLoading ? 'Deleting…' : 'Delete user'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Shared form field ─────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '5px' }}>{label}</label>
    {children}
  </div>
);

/* ── Edit Modal ─────────────────────────────────────────────────────────── */
const EditModal = ({ user, departments, isAdmin, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: user.name,
    department: user.department || '',
    role: user.role,
    hire_date: user.hire_date ? user.hire_date.split('T')[0] : '',
    sick_leave_balance: user.sick_leave_balance,
    vacation_balance: user.vacation_balance,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await userAPI.update(user.id, form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: '500' }}>Edit user</h2>
            <p style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>{user.email}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="modal-body p-5 space-y-3">
          {error && <div className="chip chip-red w-full text-xs p-2 rounded">{error}</div>}
          <Field label="Full name *"><input className="input" value={form.name} onChange={set('name')} required /></Field>
          <Field label="Department">
            <select className="input" value={form.department} onChange={set('department')}>
              <option value="">Unassigned</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Role *">
            <select className="input" value={form.role} onChange={set('role')} required>
              <option value="employee">Employee</option>
              <option value="hr">HR</option>
              {isAdmin && <option value="admin">Admin</option>}
            </select>
          </Field>
          <Field label="Hire date">
            <input type="date" className="input" value={form.hire_date} onChange={set('hire_date')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sick leave days">
              <input type="number" min="0" className="input" value={form.sick_leave_balance}
                onChange={e => setForm(f => ({ ...f, sick_leave_balance: parseInt(e.target.value) }))} />
            </Field>
            <Field label="Vacation days">
              <input type="number" min="0" className="input" value={form.vacation_balance}
                onChange={e => setForm(f => ({ ...f, vacation_balance: parseInt(e.target.value) }))} />
            </Field>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              <Save className="w-3.5 h-3.5" />
              {loading ? 'Saving…' : 'Save changes'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Create Modal ───────────────────────────────────────────────────────── */
const CreateModal = ({ departments, isAdmin, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', department: '', role: 'employee',
    hire_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await userAPI.create(form);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500' }}>Add new user</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="modal-body p-5 space-y-3">
          {error && <div style={{ fontSize: '12px', color: '#DC2626', padding: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>{error}</div>}
          <Field label="Full name *"><input className="input" value={form.name} onChange={set('name')} required placeholder="Jane Smith" /></Field>
          <Field label="Email *"><input type="email" className="input" value={form.email} onChange={set('email')} required placeholder="jane@company.com" /></Field>
          <Field label="Password *"><input type="password" className="input" value={form.password} onChange={set('password')} required minLength={6} placeholder="Min. 6 characters" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <select className="input" value={form.department} onChange={set('department')}>
                <option value="">None</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Role *">
              <select className="input" value={form.role} onChange={set('role')} required>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
                {isAdmin && <option value="admin">Admin</option>}
              </select>
            </Field>
          </div>
          <Field label="Hire date">
            <input type="date" className="input" value={form.hire_date} onChange={set('hire_date')} />
          </Field>
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              <UserPlus className="w-3.5 h-3.5" />
              {loading ? 'Creating…' : 'Create user'}
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Invite Modal ───────────────────────────────────────────────────────── */
const InviteModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await userAPI.invite(email);
      setSent(true);
      setTimeout(onClose, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #E5E7EB' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500' }}>Invite via email</h2>
          <button onClick={onClose} className="btn-ghost p-1"><X className="w-4 h-4" /></button>
        </div>
        {sent ? (
          <div className="p-8 text-center">
            <div className="chip chip-green mx-auto mb-3 px-3 py-1.5 text-sm">Invitation sent</div>
            <p style={{ fontSize: '13px', color: '#6B7280' }}>An invite link was emailed to <strong>{email}</strong></p>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            {error && <div style={{ fontSize: '12px', color: '#DC2626', padding: '8px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px' }}>{error}</div>}
            <Field label="Email address *">
              <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} required placeholder="employee@company.com" />
            </Field>
            <p style={{ fontSize: '12px', color: '#9CA3AF' }}>The user will receive a link to create their account.</p>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                <Mail className="w-3.5 h-3.5" />
                {loading ? 'Sending…' : 'Send invite'}
              </button>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;
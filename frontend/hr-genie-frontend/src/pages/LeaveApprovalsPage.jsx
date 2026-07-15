import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../services/api';
import api from '../services/api';
import { CheckCircle, XCircle, Clock, Calendar, User, Filter, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LeaveApprovalsPage = () => {
  const { isHR, isAdmin } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (!isHR && !isAdmin) {
      navigate('/dashboard');
      return;
    }
    fetchRequests();
  }, [filter, isHR, isAdmin]);

  const fetchRequests = async () => {
    try {
      const response = await leaveAPI.getAllRequests(filter || undefined);
      setRequests(response.data.leave_requests);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, status) => {
    setActionLoading(id);
    try {
      await leaveAPI.updateStatus(id, status);
      await fetchRequests();
      toast.success(`Leave request ${status} successfully`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
      approved: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
      rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
    };
    const { bg, text, border, icon: Icon } = config[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border uppercase tracking-wider ${bg} ${text} ${border}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('leaveApprovals.title')}</h1>
        </div>
        <button
          onClick={async () => {
            try {
              const res = await api.get('/export/leave', { responseType: 'blob' });
              const url = window.URL.createObjectURL(new Blob([res.data]));
              const a = document.createElement('a'); a.href = url; a.download = 'leave_export.csv'; a.click();
              window.URL.revokeObjectURL(url);
              toast.success(t('leaveApprovals.leaveCsvDownloaded'));
            } catch { toast.error(t('leaveApprovals.exportFailed')); }
          }}
          className="btn-secondary flex items-center gap-2 text-[13px] font-bold uppercase tracking-wider"
        >
          <Download className="w-3.5 h-3.5" /> {t('common.exportCsv')}
        </button>
      </div>

      {/* Filter */}
      <div className="card bg-white border border-zinc-200 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-4 h-4 text-zinc-400" />
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status === 'all' ? '' : status)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-bold uppercase tracking-wider transition-colors border ${
                  (status === 'all' && filter === '') || filter === status
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <span className="ml-auto text-[12px] font-bold text-zinc-400 uppercase tracking-wider">
            {requests.length} request{requests.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="card bg-white border border-zinc-200 text-center py-12">
          <Calendar className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 text-[13px] font-bold uppercase tracking-wider">{t('leaveApprovals.noRequestsFound')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((request) => (
            <div key={request.id} className="card bg-white border border-zinc-200 p-6 hover:border-zinc-400 transition-colors">
              <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 bg-zinc-100 border border-zinc-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-zinc-600" />
                      </div>
                      <div>
                        <h3 className="text-[15px] font-bold text-zinc-900 leading-none mb-1.5">{request.employee_name}</h3>
                        <p className="text-[11px] font-bold text-zinc-500 tracking-wider uppercase">{request.department}</p>
                      </div>
                    </div>
                    {/* Status badge */}
                    <div className="shrink-0">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>

                  {/* Grid Data */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-zinc-50 border border-zinc-100 rounded-md mb-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">{t('common.type')}</p>
                      <p className="text-[13px] font-bold text-zinc-900 capitalize">{request.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">{t('leave.startDate')}</p>
                      <p className="text-[13px] font-bold text-zinc-900">{new Date(request.start_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">{t('leave.endDate')}</p>
                      <p className="text-[13px] font-bold text-zinc-900">{new Date(request.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1">{t('leaveApprovals.duration')}</p>
                      <p className="text-[13px] font-bold text-zinc-900">{request.days} {request.days !== 1 ? t('leaveApprovals.dayPlural') : t('leaveApprovals.day')}</p>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="mb-6 pl-4 border-l border-zinc-200">
                      <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mb-1.5">{t('common.reason')}</p>
                      <p className="text-[13px] text-zinc-600 leading-relaxed">{request.reason}</p>
                    </div>
                  )}

                  {/* Footer metadata */}
                  <div className="flex items-center flex-wrap gap-4 pt-4 border-t border-zinc-100">
                    {request.approver_name && (
                      <span className="text-[12px] font-bold text-zinc-400 flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {t('leaveApprovals.reviewedBy')} <span className="text-zinc-700">{request.approver_name}</span>
                      </span>
                    )}
                    <span className="text-[12px] font-bold text-zinc-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {t('leaveApprovals.submitted')} {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions side */}
                {request.status === 'pending' && (
                  <div className="flex flex-row md:flex-col gap-3 justify-center md:pl-6 md:border-l md:border-zinc-100 shrink-0">
                    <button
                      onClick={() => handleApproval(request.id, 'approved')}
                      disabled={actionLoading === request.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#111318] text-white border border-zinc-900 rounded-md hover:bg-[#374151] transition-colors disabled:opacity-50 text-[12px] font-bold uppercase tracking-wider"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {t('leaveApprovals.approve')}
                    </button>
                    <button
                      onClick={() => handleApproval(request.id, 'rejected')}
                      disabled={actionLoading === request.id}
                      className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-red-600 border border-red-200 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 text-[12px] font-bold uppercase tracking-wider"
                    >
                      <XCircle className="w-4 h-4" />
                      {t('leaveApprovals.reject')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeaveApprovalsPage;

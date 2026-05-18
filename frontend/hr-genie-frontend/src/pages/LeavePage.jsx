import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../services/api';
import LeaveBalance from '../components/leave/LeaveBalance';
import LeaveRequestForm from '../components/leave/LeaveRequestForm';
import LeaveRequestList from '../components/leave/LeaveRequestList';
import { useTranslation } from 'react-i18next';
import { Plus, X, Calendar } from 'lucide-react';

const LeavePage = () => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      const [balanceRes, requestsRes] = await Promise.all([
        leaveAPI.getBalance(),
        leaveAPI.getMyRequests(),
      ]);
      setBalance(balanceRes.data.balance);
      setRequests(requestsRes.data.leave_requests);
    } catch (error) {
      console.error('Failed to fetch leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (formData) => {
    await leaveAPI.createRequest(formData);
    await fetchLeaveData();
    setIsFormOpen(false);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">{t('leave.leaveManagement')}</h1>
        <button
          onClick={() => setIsFormOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {t('leaveForm.requestLeave')}
        </button>
      </div>

      <LeaveBalance balance={balance} />

      <LeaveRequestList requests={requests} />

      {/* Request Leave Modal */}
      {isFormOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="modal-panel"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-zinc-100 border border-zinc-200 rounded-md">
                  <Calendar className="w-4 h-4 text-zinc-600" />
                </div>
                <h2 className="text-[16px] font-bold text-zinc-900">{t('leaveForm.requestLeave')}</h2>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 hover:bg-zinc-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
            <div className="p-6 modal-body">
              <LeaveRequestForm onSubmit={handleSubmitRequest} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavePage;
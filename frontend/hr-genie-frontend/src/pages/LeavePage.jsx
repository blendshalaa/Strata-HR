import React, { useState, useEffect } from 'react';
import { leaveAPI } from '../services/api';
import LeaveBalance from '../components/leave/LeaveBalance';
import LeaveRequestForm from '../components/leave/LeaveRequestForm';
import LeaveRequestList from '../components/leave/LeaveRequestList';
import { useTranslation } from 'react-i18next';

const LeavePage = () => {
  const { t } = useTranslation();
  const [balance, setBalance] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{t('leave.leaveManagement')}</h1>
        <p className="text-zinc-500 text-sm">{t('leave.manageLeaveRequests')}</p>
      </div>

      <LeaveBalance balance={balance} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <LeaveRequestForm onSubmit={handleSubmitRequest} />
        </div>

        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-[16px] font-bold text-zinc-900">{t('leave.myLeaveRequests')}</h2>
            <p className="text-[13px] text-zinc-500 mt-0.5">{t('leave.trackSubmitted')}</p>
          </div>
          <LeaveRequestList requests={requests} />
        </div>
      </div>
    </div>
  );
};

export default LeavePage;
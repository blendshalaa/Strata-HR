import React, { useState } from 'react';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LeaveRequestForm = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    type: 'vacation',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      await onSubmit(formData);
      setSuccess(true);
      setFormData({
        type: 'vacation',
        start_date: '',
        end_date: '',
        reason: '',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || t('leaveForm.failedToSubmit'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-white border border-zinc-200">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-zinc-100">
        <div className="p-1.5 bg-zinc-100 border border-zinc-200 rounded-md">
          <Calendar className="w-4 h-4 text-zinc-600" />
        </div>
        <h2 className="text-[16px] font-bold text-zinc-900">{t('leaveForm.requestLeave')}</h2>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-md flex items-start gap-3">
          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-[13px] font-medium text-green-800">{t('leaveForm.submitted')}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold text-zinc-700 mb-2">
            {t('leaveForm.leaveType')}
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
            required
          >
            <option value="vacation">{t('leaveForm.vacation')}</option>
            <option value="sick">{t('leaveForm.sickLeave')}</option>
            <option value="personal">{t('leaveForm.personal')}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-bold text-zinc-700 mb-2">
              {t('leaveForm.startDate')}
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-zinc-700 mb-2">
              {t('leaveForm.endDate')}
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-zinc-700 mb-2">
            {t('leaveForm.reason')}
          </label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-md text-[13px] text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors resize-none"
            rows="3"
            placeholder={t('leaveForm.reasonPlaceholder')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2.5 text-[13px] font-bold uppercase tracking-wider text-white bg-zinc-900 border border-zinc-900 rounded-md hover:bg-zinc-800 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? t('common.submitting') : t('leaveForm.submitRequest')}
        </button>
      </form>
    </div>
  );
};

export default LeaveRequestForm;

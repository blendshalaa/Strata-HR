import React, { useState } from 'react';
import { CheckCircle, XCircle, Loader, ShieldCheck } from 'lucide-react';

const ConfirmationCard = ({ confirmation, onConfirm, onReject }) => {
  const [status, setStatus] = useState('pending'); // pending | confirming | confirmed | rejected

  const handleConfirm = async () => {
    setStatus('confirming');
    try {
      await onConfirm(confirmation);
      setStatus('confirmed');
    } catch {
      setStatus('pending');
    }
  };

  const handleReject = () => {
    setStatus('rejected');
    onReject?.(confirmation);
  };

  const actionLabels = {
    approve_leave_request: 'Approve Leave',
    reject_leave_request: 'Reject Leave',
    create_shift: 'Create Shift',
    create_event: 'Create Event',
    submit_leave_request: 'Submit Leave',
  };

  if (status === 'confirmed') {
    return (
      <div className="my-2 mx-10 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 animate-fadeIn">
        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
        <span className="text-[13px] font-medium text-green-800">Done — {confirmation.summary}</span>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="my-2 mx-10 p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center gap-2 animate-fadeIn">
        <XCircle className="w-4 h-4 text-zinc-400 shrink-0" />
        <span className="text-[13px] font-medium text-zinc-500 line-through">Cancelled — {confirmation.summary}</span>
      </div>
    );
  }

  return (
    <div className="my-3 mx-10 bg-amber-50 border border-amber-200 rounded-lg overflow-hidden animate-fadeIn shadow-sm">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-amber-200 bg-amber-100/50 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-700" />
        <span className="text-[12px] font-bold text-amber-800 uppercase tracking-wider">
          Confirm Action — {actionLabels[confirmation.action] || confirmation.action}
        </span>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        <p className="text-[13px] text-amber-900 mb-3">{confirmation.summary}</p>

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={status === 'confirming'}
            className="px-4 py-1.5 bg-zinc-900 text-white rounded-md text-[12px] font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {status === 'confirming' ? (
              <><Loader className="w-3 h-3 animate-spin" /> Confirming...</>
            ) : (
              <><CheckCircle className="w-3 h-3" /> Confirm</>
            )}
          </button>
          <button
            onClick={handleReject}
            disabled={status === 'confirming'}
            className="px-4 py-1.5 bg-white text-zinc-600 border border-zinc-200 rounded-md text-[12px] font-medium hover:bg-zinc-50 transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            <XCircle className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationCard;

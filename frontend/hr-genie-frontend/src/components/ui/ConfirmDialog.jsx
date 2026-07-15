import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ConfirmDialog = ({
  isOpen, onClose, onConfirm,
  title, message, confirmLabel,
  confirmVariant = 'danger', loading = false
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 60 }} onClick={onClose}>
      <div
        className="animate-fadeIn"
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: '20px 20px 16px' }}>
          <div className="flex items-start gap-3">
            <div style={{ padding: '8px', backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px', flexShrink: 0 }}>
              <AlertTriangle style={{ width: '15px', height: '15px', color: '#DC2626' }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#111318', marginBottom: '4px' }}>
                {title || t('common.confirm')}
              </h3>
              <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: '1.6' }}>{message}</p>
            </div>
            <button
              onClick={onClose}
              style={{ padding: '4px', color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = '#374151'}
              onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
            >
              <X style={{ width: '15px', height: '15px' }} />
            </button>
          </div>
        </div>

        <div
          className="flex items-center justify-end gap-2"
          style={{ padding: '12px 20px', borderTop: '1px solid #F3F4F6', backgroundColor: '#FAFAFA' }}
        >
          <button onClick={onClose} disabled={loading} className="btn-secondary" style={{ fontSize: '12px', padding: '6px 12px' }}>
            {t('common.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            {loading ? t('common.loading') : (confirmLabel || t('common.confirm'))}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

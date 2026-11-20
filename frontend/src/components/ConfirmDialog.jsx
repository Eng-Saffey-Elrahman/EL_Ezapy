import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'تأكيد العملية',
  message = 'هل أنت متأكد من تنفيذ هذا الإجراء؟ لا يمكن التراجع عنه.',
  confirmText = 'تأكيد الحذف',
  cancelText = 'إلغاء',
  isDanger = true,
  loading = false
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isDanger ? 'var(--danger)' : 'var(--warning)' }}>
          <AlertTriangle size={22} />
          <span>{title}</span>
        </div>
      }
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </button>
          <button
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'جاري التنفيذ...' : confirmText}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  );
};

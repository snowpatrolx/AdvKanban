import { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
            <button className="modal-close" onClick={onClose}>✕</button>
          </div>
        )}
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open, title, message, confirmText = '确认', cancelText = '取消', onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="confirm-message">{message}</p>
      <div className="confirm-actions">
        <button className="btn btn-secondary btn-sm" onClick={onCancel}>{cancelText}</button>
        <button className="btn btn-danger btn-sm" onClick={onConfirm}>{confirmText}</button>
      </div>
    </Modal>
  );
}

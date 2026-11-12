import { useEffect, useRef } from 'react';
import { AlertTriangle, Trash2, CheckCircle2, HelpCircle } from 'lucide-react';
import './ConfirmModal.css';

export default function ConfirmModal({
  isOpen,
  title = '¿Estás seguro?',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger', // 'danger' | 'warning' | 'primary' | 'success'
  onConfirm,
  onCancel,
}) {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    setTimeout(() => confirmBtnRef.current?.focus(), 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const renderIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="confirm-icon-wrapper confirm-icon-danger">
            <Trash2 size={24} />
          </div>
        );
      case 'warning':
        return (
          <div className="confirm-icon-wrapper confirm-icon-warning">
            <AlertTriangle size={24} />
          </div>
        );
      case 'success':
        return (
          <div className="confirm-icon-wrapper confirm-icon-success">
            <CheckCircle2 size={24} />
          </div>
        );
      case 'primary':
      default:
        return (
          <div className="confirm-icon-wrapper confirm-icon-info">
            <HelpCircle size={24} />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger':
        return 'confirm-btn-danger';
      case 'warning':
        return 'confirm-btn-warning';
      case 'primary':
      default:
        return 'confirm-btn-primary';
    }
  };

  return (
    <div
      className="confirm-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="confirm-modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-message"
      >
        <div className="confirm-modal-body">
          {renderIcon()}
          <div className="confirm-text-wrap">
            <h3 id="confirm-modal-title" className="confirm-title">
              {title}
            </h3>
            <p id="confirm-modal-message" className="confirm-message">
              {message}
            </p>
          </div>
        </div>

        <div className="confirm-modal-actions">
          {cancelText && (
            <button
              type="button"
              className="confirm-btn-cancel"
              onClick={onCancel}
            >
              {cancelText}
            </button>
          )}
          <button
            ref={confirmBtnRef}
            type="button"
            className={getConfirmButtonClass()}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}


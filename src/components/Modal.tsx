import React, { useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'info' | 'danger' | 'warning' | 'success';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  variant = 'info'
}) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      {/* Modal Content */}
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 fade-in duration-300">
        <div className="p-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-black text-brand-dark font-headline tracking-tight leading-none">{title}</h3>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-brand-dark hover:bg-slate-100 rounded-2xl transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="text-slate-500 font-medium leading-relaxed">
            {children}
          </div>

          {footer && (
            <div className="flex gap-3 justify-end mt-10">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ConfirmModalProps extends Omit<ModalProps, 'footer'> {
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'info'
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} variant={variant}>
      {children}
      <div className="flex gap-4 mt-10">
        <Button 
          variant="secondary" 
          onClick={onClose} 
          disabled={isLoading}
          className="flex-1 !py-4"
        >
          {cancelText}
        </Button>
        <Button 
          onClick={onConfirm} 
          disabled={isLoading}
          className={`flex-1 !py-4 ${variant === 'danger' ? '!bg-red-500 hover:!bg-red-600' : ''}`}
        >
          {isLoading ? 'Processing...' : confirmText}
        </Button>
      </div>
    </Modal>
  );
};

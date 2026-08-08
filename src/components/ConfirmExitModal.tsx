import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmExitModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmExitModal: React.FC<ConfirmExitModalProps> = ({
  isOpen,
  title = 'Bạn có chắc chắn muốn thoát game?',
  message = 'Tiến trình ván đấu hiện tại của bạn sẽ không được lưu lại.',
  confirmText = 'Xác Nhận Thoát',
  cancelText = 'Tiếp Tục Chơi',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-200 font-vietnamese">
      <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-200 text-white">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 animate-bounce" />
        </div>

        <div>
          <h3 className="text-lg font-black text-amber-300">{title}</h3>
          <p className="text-xs text-slate-300 font-medium mt-1.5 leading-relaxed">{message}</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 font-vietnamese"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-rose-950/80 text-rose-300 hover:text-rose-200 text-xs font-bold rounded-xl border border-slate-700 hover:border-rose-500/60 transition-all cursor-pointer active:scale-95 font-vietnamese"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};


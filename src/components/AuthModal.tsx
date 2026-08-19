import React, { useState } from 'react';
import { X, User as UserIcon, Lock, Check, AlertCircle, ShieldCheck, Sparkles, UserPlus, LogIn, KeyRound } from 'lucide-react';
import { User } from '../types';
import { loginUser, registerUser, DEFAULT_ADMIN } from '../utils/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUser(username, password);
        if (res.success && res.user) {
          setSuccessMsg(res.message);
          setTimeout(() => {
            onLoginSuccess(res.user!);
            onClose();
          }, 400);
        } else {
          setError(res.message);
        }
      } else {
        const res = await registerUser(username, password, displayName);
        if (res.success && res.user) {
          setSuccessMsg(res.message + ' Đang đăng nhập...');
          setTimeout(() => {
            onLoginSuccess(res.user!);
            onClose();
          }, 600);
        } else {
          setError(res.message);
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setMode('login');
    setUsername('lannhi');
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#0D99FF]/10 text-[#0D99FF] flex items-center justify-center font-bold">
            {mode === 'login' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          </div>
          <div>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#0D99FF] bg-blue-50 px-2 py-0.5 rounded-md">
              ❖ Authentication
            </span>
            <h2 className="text-xl font-black text-slate-900">
              {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Đăng Ký Tài Khoản Mới'}
            </h2>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 font-semibold text-xs text-slate-600">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccessMsg(null);
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'
            }`}
          >
            Đăng Ký Mới
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-700">
            <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Họ & Tên hiển thị (Tùy chọn)
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tên đăng nhập <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'Nhập lannhi hoặc tên tài khoản' : 'Nhập tên đăng nhập (viết liền)'}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mật khẩu <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu (tối thiểu 4 ký tự)"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#0D99FF] hover:bg-[#0088FF] text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Đăng Nhập Ngay</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Hoàn Tất Đăng Ký</span>
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-[11px] text-slate-500 space-y-1">
          {mode === 'login' ? (
            <p>
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-[#0D99FF] font-bold hover:underline cursor-pointer"
              >
                Đăng ký tài khoản mới miễn phí
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-[#0D99FF] font-bold hover:underline cursor-pointer"
              >
                Đăng nhập tại đây
              </button>
            </p>
          )}
          <p className="text-slate-400">
            Dữ liệu đăng ký được lưu an toàn vào Google Sheet quản trị và thiết bị của bạn.
          </p>
        </div>
      </div>
    </div>
  );
};

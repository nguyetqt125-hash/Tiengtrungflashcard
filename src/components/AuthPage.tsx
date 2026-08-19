import React, { useState } from 'react';
import {
  LogIn,
  UserPlus,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { loginUser, registerUser } from '../utils/auth';
import { User } from '../types';

interface AuthPageProps {
  onLoginSuccess: (user: User) => void;
  onContinueAsGuest: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setDisplayName('');
    setError(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.');
      return;
    }
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp.');
        return;
      }
      if (password.length < 4) {
        setError('Mật khẩu phải có ít nhất 4 ký tự.');
        return;
      }

      setLoading(true);
      const res = await registerUser(username, password, displayName);
      setLoading(false);

      if (res.success && res.user) {
        setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 600);
      } else {
        setError(res.message);
      }
    } else {
      setLoading(true);
      const res = await loginUser(username, password);
      setLoading(false);

      if (res.success && res.user) {
        setSuccessMsg('Đăng nhập thành công!');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 500);
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-[#0D99FF] selection:text-white">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600 rounded-full blur-[128px]"></div>
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#0D99FF] rounded-full blur-[128px]"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-rose-600 rounded-full blur-[128px]"></div>
      </div>

      {/* Top Header */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-rose-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">
            学
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-2">
              Hán Ngữ Flashcard
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-md">
                ❖ Pro
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Nền tảng học & quản lý từ vựng tiếng Trung</p>
          </div>
        </div>

        <button
          onClick={onContinueAsGuest}
          className="text-xs font-semibold text-slate-400 hover:text-white px-3.5 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-800/40 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Vào xem khóa học</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 max-w-5xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Feature Showcase */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/80 border border-indigo-800/60 rounded-full text-indigo-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hệ thống Flashcard Chuyên Nghiệp</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Ghi nhớ chữ Hán chuẩn xác & Lưu trữ dữ liệu linh hoạt
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed">
            Học tập với phương pháp lặp lại ngắt quãng (SRS), tạo vở tập viết chữ Hán PDF A4, làm bài kiểm tra trắc nghiệm & tự luận, đồng bộ 2 chiều qua Google Sheets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200 mb-1">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Khóa Học Chuẩn</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Học viên tự do học & ôn tập các bộ khóa học HSK chuẩn được biên soạn.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-xs">
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-200 mb-1">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Google Sheet Cá Nhân</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Tự tạo bộ từ vựng của riêng bạn và lưu trực tiếp vào Google Drive cá nhân.
              </p>
            </div>
          </div>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-6">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
            {/* Tab switch */}
            <div className="grid grid-cols-2 p-1 bg-slate-900/80 border border-slate-700/60 rounded-2xl mb-6 font-bold text-xs text-slate-400">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetForm();
                }}
                className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-[#0D99FF] text-white shadow-md'
                    : 'hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Đăng Nhập</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  resetForm();
                }}
                className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-[#0D99FF] text-white shadow-md'
                    : 'hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Đăng Ký</span>
              </button>
            </div>

            {/* Title */}
            <div className="mb-5">
              <h3 className="text-xl font-black text-white">
                {mode === 'login' ? 'Đăng Nhập Tài Khoản' : 'Tạo Tài Khoản Học Viên Mới'}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {mode === 'login'
                  ? 'Nhập tên đăng nhập và mật khẩu để tiếp tục'
                  : 'Đăng ký để tạo và lưu trữ các bộ từ vựng cá nhân'}
              </p>
            </div>

            {/* Error & Success Notification */}
            {error && (
              <div className="mb-4 p-3 bg-rose-950/80 border border-rose-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: hocvien123"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent font-medium"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Họ & Tên hiển thị (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent font-medium"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent font-medium"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0D99FF] hover:bg-[#0088FF] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50 mt-2"
              >
                {loading
                  ? 'Đang xử lý...'
                  : mode === 'login'
                  ? 'Đăng Nhập'
                  : 'Đăng Ký Tài Khoản'}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-700/60 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-medium text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                ← Xem thử bài học với tư cách Khách
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl w-full mx-auto px-6 py-6 text-center text-xs text-slate-500 border-t border-slate-800">
        <span>Hán Ngữ Flashcard — Hệ thống học tiếng Trung thông minh</span>
      </footer>
    </div>
  );
};

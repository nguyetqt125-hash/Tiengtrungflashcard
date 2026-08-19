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
  Brain,
  FileText,
  Gamepad2,
  Flame,
  Check,
  GraduationCap,
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
        setSuccessMsg('Đăng ký tài khoản thành công! Đang chuyển hướng...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 400);
      } else {
        setError(res.message);
      }
    } else {
      setLoading(true);
      const res = await loginUser(username, password);
      setLoading(false);

      if (res.success && res.user) {
        setSuccessMsg('Đăng nhập thành công! Đang mở ứng dụng...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 400);
      } else {
        setError(res.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-[#0D99FF]/20 selection:text-[#0D99FF]">
      {/* Top Clean Figma Navbar */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0D99FF] to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-[#0D99FF]/20">
              汉
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-slate-900 tracking-tight">
                  Hán Ngữ Flashcard
                </span>
                <span className="text-[10px] font-extrabold text-[#0D99FF] bg-[#0D99FF]/10 px-2 py-0.5 rounded-full border border-[#0D99FF]/20">
                  FIGMA PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Học từ vựng tiếng Trung với Flashcard 7 trường & SRS
              </p>
            </div>
          </div>

          <button
            onClick={onContinueAsGuest}
            className="text-xs font-bold text-slate-600 hover:text-[#0D99FF] bg-slate-100 hover:bg-[#0D99FF]/10 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200/80 active:scale-95"
          >
            <span>Vào xem thử (Khách)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Horizontal Layout Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex items-center justify-center">
        <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* Left Column: Bright Figma Product Showcase (Horizontal 7 cols) */}
          <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-blue-200/80 rounded-full text-[#0D99FF] text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#0D99FF]" />
                <span>Nền tảng Học Tiếng Trung Thông Minh</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.15]">
                  Ghi nhớ chữ Hán <br />
                  <span className="text-[#0D99FF]">chuẩn xác & tự nhiên</span>
                </h1>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
                  Ứng dụng Flashcard 7 trường dữ liệu chuẩn, thuật toán lặp lại ngắt quãng SRS, tạo vở tập viết PDF A4 và làm bài thi trắc nghiệm chấm điểm tức thì.
                </p>
              </div>

              {/* Figma-Style Interactive Flashcard Preview */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-md space-y-4 max-w-lg">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                    Thẻ Mẫu • HSK 1
                  </span>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Hộp SRS 3 (Đã thuộc)
                  </span>
                </div>

                <div className="flex items-center gap-5">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-100 flex flex-col items-center justify-center shrink-0 shadow-inner">
                    <span className="text-3xl font-black text-slate-900 font-serif">学</span>
                    <span className="text-xs font-bold text-[#0D99FF] mt-0.5">xué</span>
                  </div>

                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-extrabold text-slate-900">Học tập, học thức</span>
                      <span className="text-[11px] font-semibold text-slate-500">[Động từ]</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1 italic">
                      Ví dụ: 我在学习汉语。(Tôi đang học tiếng Trung.)
                    </p>
                    <p className="text-[11px] text-amber-700 font-medium bg-amber-50/80 px-2.5 py-1 rounded-md border border-amber-200/60 inline-block">
                      💡 Mẹo: Bộ Tử (con) dưới mái nhà miên
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Bright Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl font-bold">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">SRS 3 Cấp</h4>
                  <p className="text-[11px] text-slate-500">Ôn đúng chu kỳ</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Vở Viết A4</h4>
                  <p className="text-[11px] text-slate-500">Xuất PDF in ấn</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Game & Thi</h4>
                  <p className="text-[11px] text-slate-500">Luyện phản xạ</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean White Figma Authentication Form (Horizontal 5 cols) */}
          <div className="lg:col-span-5 p-6 sm:p-10 lg:p-12 bg-white flex flex-col justify-center">
            
            {/* Segmented Tab Switch (Figma Style) */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl mb-6 font-bold text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetForm();
                }}
                className={`py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <LogIn className="w-4 h-4 text-[#0D99FF]" />
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
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <UserPlus className="w-4 h-4 text-indigo-600" />
                <span>Đăng Ký Mới</span>
              </button>
            </div>

            {/* Form Header */}
            <div className="mb-5">
              <h3 className="text-xl font-black text-slate-900">
                {mode === 'login' ? 'Chào mừng bạn trở lại' : 'Tạo tài khoản học viên'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'login'
                  ? 'Nhập thông tin tài khoản để tiếp tục học tập'
                  : 'Đăng ký để tạo và lưu trữ các bộ từ vựng cá nhân'}
              </p>
            </div>

            {/* Notifications */}
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-in fade-in duration-150">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{successMsg}</span>
              </div>
            )}

            {/* Form Inputs */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên đăng nhập
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: hocvien01"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent font-medium transition-all"
                  />
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ & Tên hiển thị (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="ví dụ: Nguyễn Văn A"
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent font-medium transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent font-medium transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D99FF] focus:border-transparent font-medium transition-all"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0D99FF] hover:bg-[#0088FF] text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-md shadow-[#0D99FF]/30 hover:shadow-lg transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Đang xử lý...</span>
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng Nhập Vào Ứng Dụng</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Tạo Tài Khoản Mới</span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom Guest Option Link */}
            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-bold text-slate-500 hover:text-[#0D99FF] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span>Bỏ qua & Xem bài học với tư cách Khách</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0D99FF]" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Light Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© Hán Ngữ Flashcard — Thiết kế theo phong cách hiện đại Figma</span>
          <span className="text-slate-400">Tối ưu cho việc học HSK & Thi chứng chỉ tiếng Trung</span>
        </div>
      </footer>
    </div>
  );
};

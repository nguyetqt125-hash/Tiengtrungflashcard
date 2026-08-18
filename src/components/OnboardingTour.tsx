import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  BookOpen,
  Brain,
  FileText,
  Gamepad2,
  FileCheck2,
  Layers,
  CheckCircle,
  Lightbulb,
  MousePointer2,
  CornerDownLeft,
} from 'lucide-react';

export interface TourStep {
  id: string;
  targetSelector?: string;
  title: string;
  subtitle?: string;
  content: string;
  tips?: string[];
  icon: React.ReactNode;
  badge: string;
  placement?: 'bottom' | 'top' | 'left' | 'right' | 'center';
  actionPrompt?: string;
  highlightText?: string;
  figmaTag?: string;
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSampleLesson?: () => void;
  currentView?: 'courses' | 'lessons';
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onClose,
  onNavigateToSampleLesson,
  currentView = 'courses',
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = [
    {
      id: 'step-create-course',
      targetSelector: '#tour-add-course-btn, #tour-navbar-add-course',
      badge: 'Bước 1/6 • Khởi Đầu',
      figmaTag: 'Button / + Tạo Khóa Học',
      title: 'Tạo Khóa Học Mới',
      subtitle: 'Ấn vào đây để bắt đầu bài học',
      highlightText: '👉 Bấm vào nút "+ Tạo Khóa Học"',
      content:
        'Bạn có thể tạo các khóa học theo cấp độ (HSK 1, HSK 2, Giáo trình Hán ngữ, Khẩu ngữ...) để sắp xếp các bài học một cách khoa học.',
      tips: [
        'Đặt tên khóa học rõ ràng kèm cấp độ HSK.',
        'Mỗi khóa học sẽ chứa nhiều bài học nhỏ bên trong.',
      ],
      icon: <Plus className="w-4 h-4 text-[#0D99FF]" />,
      placement: 'bottom',
      actionPrompt: 'Nhấn vào đây để tạo danh mục khóa học đầu tiên!',
    },
    {
      id: 'step-course-cards',
      targetSelector: '#tour-first-course, #tour-course-cards',
      badge: 'Bước 2/6 • Danh Sách Bài',
      figmaTag: 'Component / CourseCard',
      title: 'Vào Xem & Quản Lý Bài Học',
      subtitle: 'Nhấp để mở bài học bên trong',
      highlightText: '👉 Bấm "Xem Bài Học" trên thẻ này',
      content:
        'Nhấn vào khóa học để mở danh sách các bài học. Tại đây bạn có thể thêm bài học mới, sửa tên hoặc xóa bài học.',
      tips: [
        'Mỗi bài học tương ứng với một chủ đề (ví dụ: Bài 1: Chào hỏi, Bài 2: Mua sắm...).',
        'Có thanh tìm kiếm và lọc bài học nhanh chóng.',
      ],
      icon: <BookOpen className="w-4 h-4 text-[#10B981]" />,
      placement: 'bottom',
      actionPrompt: 'Bấm vào để vào xem danh sách bài học và từ vựng!',
    },
    {
      id: 'step-srs-streak',
      targetSelector: '#tour-srs-box, #tour-streak-box',
      badge: 'Bước 3/6 • Lặp Lại Ngắt Quãng',
      figmaTag: 'Widget / SpacedRepetition',
      title: 'Chuỗi Học & Hộp Nhớ SRS',
      subtitle: 'Học thông minh không lo quên từ',
      highlightText: '👉 Xem số từ đến hạn ôn tập tại đây',
      content:
        'Hệ thống tự động theo dõi số ngày bạn học liên tiếp (Streak) và phân loại từ vựng thành 3 Hộp Nhớ (H1: Từ mới, H2: Đang học, H3: Đã thuộc lâu dài).',
      tips: [
        'Hệ thống tự tính toán ngày cần ôn lại từng từ.',
        'Bấm vào để xem danh sách các từ cần ôn hôm nay.',
      ],
      icon: <Brain className="w-4 h-4 text-[#F59E0B]" />,
      placement: 'bottom',
      actionPrompt: 'Duy trì học 5-10 phút mỗi ngày để giữ chuỗi!',
    },
    {
      id: 'step-batch-import',
      targetSelector: '#tour-batch-import-btn, #tour-add-single-card-btn',
      badge: 'Bước 4/6 • Nhập Liệu Nhanh',
      figmaTag: 'Action / BatchImport',
      title: 'Nhập Từ Vựng Hàng Loạt (Text/Excel)',
      subtitle: 'Không cần gõ từng từ thủ công',
      highlightText: '👉 Bấm "📄 Nhập Hàng Loạt" để dán từ',
      content:
        'Chỉ cần copy danh sách từ vựng từ Excel, Word hoặc website rồi dán vào, hệ thống tự động tách Chữ Hán, Phiên âm Pinyin và Nghĩa tiếng Việt!',
      tips: [
        'Hỗ trợ dán bảng Excel nhiều cột hoặc text tự do.',
        'Hỗ trợ đầy đủ 7 trường: Chữ Hán, Pinyin, Nghĩa, Âm Hán Việt, Ví dụ, Dịch nghĩa, Mẹo nhớ.',
      ],
      icon: <Layers className="w-4 h-4 text-[#8B5CF6]" />,
      placement: 'bottom',
      actionPrompt: 'Dán 50-100 từ vựng chỉ trong 3 giây!',
    },
    {
      id: 'step-study-modes',
      targetSelector: '#tour-study-all-btn, #tour-study-actions',
      badge: 'Bước 5/6 • Luyện Tập Đa Dạng',
      figmaTag: 'Module / QuizletStudy',
      title: '4 Chế Độ Học & Ôn Tập Quizlet',
      subtitle: 'Thuộc từ vựng siêu tốc',
      highlightText: '👉 Chọn chế độ ôn tập ở thanh này',
      content:
        'Bao gồm: ⚡ Ôn tập thông minh (Quizlet trắc nghiệm, ẩn Pinyin, chia từng đợt 10 từ và ôn lại tùy thích), 🎴 Flashcard lật thẻ, 🎮 Trò chơi ghép thẻ, 📝 Làm bài kiểm tra tính điểm.',
      tips: [
        'Có tính năng phát âm giọng chuẩn bản xứ.',
        'Có nút "Ẩn Pinyin" giúp luyện phản xạ nhận diện mặt chữ Hán.',
        'Có thể bấm chọn từng đợt (Đợt 1, Đợt 2) để ôn lại bất cứ lúc nào.',
      ],
      icon: <CheckCircle className="w-4 h-4 text-[#0D99FF]" />,
      placement: 'top',
      actionPrompt: 'Bấm "Học Tất Cả Từ Vựng" để trải nghiệm ngay!',
    },
    {
      id: 'step-worksheet-export',
      targetSelector: '#tour-worksheet-btn, #tour-lesson-worksheet-btn',
      badge: 'Bước 6/6 • Luyện Viết & In A4',
      figmaTag: 'Export / PDFWorksheet',
      title: 'Luyện Viết Chữ Hán & In Vở Tập Viết',
      subtitle: 'Viết đúng thứ tự từng nét bút thuận',
      highlightText: '👉 Bấm "Vở Tập Viết (A4)" để in file PDF',
      content:
        'Xem thứ tự từng nét chữ Hán có hoạt họa hướng dẫn viết tay, hoặc xuất file PDF Vở Tập Viết A4 (kẻ ô Điền Tự Cách / Mễ Tự Cách) để in ra giấy luyện viết!',
      tips: [
        'Hỗ trợ in kèm Pinyin, nghĩa và các ô mờ để đồ theo nét.',
        'Dữ liệu tự lưu trên máy tính của bạn, hoàn toàn riêng tư và tức thì.',
      ],
      icon: <FileText className="w-4 h-4 text-[#F59E0B]" />,
      placement: 'bottom',
      actionPrompt: 'Xuất file PDF đẹp mắt chỉ với 1 cú nhấp chuột!',
    },
  ];

  const currentStep = steps[currentStepIndex];

  // Update target rect
  const updateTargetRect = useCallback(() => {
    if (!isOpen) return;
    const selector = currentStep.targetSelector;
    if (!selector) {
      setTargetRect(null);
      return;
    }

    const selectors = selector.split(',').map((s) => s.trim());
    let element: HTMLElement | null = null;
    for (const sel of selectors) {
      const el = document.querySelector<HTMLElement>(sel);
      if (el && el.offsetParent !== null) {
        element = el;
        break;
      }
    }

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      setTargetRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        updateTargetRect();
        setIsAnimating(false);
      }, 100);

      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect);
      };
    }
  }, [isOpen, currentStepIndex, updateTargetRect]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  // Calculate tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        position: 'fixed',
        zIndex: 100,
      };
    }

    const padding = 16;
    const tooltipWidth = Math.min(460, window.innerWidth - 32);
    let top = targetRect.bottom + padding;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    // Boundary checks
    if (left < padding) left = padding;
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }

    // If bottom overflow, place above
    if (top + 340 > window.innerHeight && targetRect.top > 360) {
      top = targetRect.top - 360;
    }

    return {
      top: `${Math.max(padding, top)}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      position: 'fixed',
      zIndex: 100,
    };
  };

  return (
    <div className="fixed inset-0 z-9999 pointer-events-auto select-none font-sans">
      {/* SVG Mask Definition for Spotlight Cutout Hole */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 89 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers all -> backdrop-filter blur is applied everywhere */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cuts out the target hole -> NO blur or overlay inside this box, crystal clear! */}
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="14"
                ry="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
      </svg>

      {/* Light Frosted Blur Backdrop with Cutout Hole Mask */}
      <div
        className="fixed inset-0 pointer-events-auto cursor-pointer transition-all duration-300"
        onClick={onClose}
        title="Nhấp vào ngoài để đóng hướng dẫn"
        style={{
          zIndex: 90,
          backgroundColor: 'rgba(15, 23, 42, 0.16)',
          backdropFilter: 'blur(8px) saturate(140%)',
          WebkitBackdropFilter: 'blur(8px) saturate(140%)',
          mask: targetRect ? 'url(#tour-spotlight-mask)' : 'none',
          WebkitMask: targetRect ? 'url(#tour-spotlight-mask)' : 'none',
        }}
      />

      {/* Target Element Figma Selection Box & Spotlight Highlight (Un-blurred inside) */}
      {targetRect && (
        <div
          style={{
            position: 'fixed',
            top: `${targetRect.top - 6}px`,
            left: `${targetRect.left - 6}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
            zIndex: 95,
          }}
          className="rounded-xl pointer-events-none transition-all duration-300 ease-out border-2 border-[#0D99FF] shadow-[0_0_0_2px_rgba(255,255,255,0.9),0_8px_30px_rgba(13,153,255,0.35)]"
        >
          {/* Subtle pulse highlight glow */}
          <div className="absolute inset-0 rounded-xl ring-4 ring-[#0D99FF]/30 animate-pulse pointer-events-none" />

          {/* 4 Corner Figma Resize Handles */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#0D99FF] rounded-xs shadow-xs" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#0D99FF] rounded-xs shadow-xs" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#0D99FF] rounded-xs shadow-xs" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#0D99FF] rounded-xs shadow-xs" />

          {/* Figma Frame / Layer Tag Header */}
          <div className="absolute -top-7 left-0 flex items-center gap-1.5 bg-[#0D99FF] text-white text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-t-md shadow-md">
            <span className="opacity-80">❖</span>
            <span>{currentStep.figmaTag || 'Component'}</span>
          </div>

          {/* Animated Figma Cursor Pointer Label */}
          {currentStep.highlightText && (
            <div className="absolute -bottom-11 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-900 font-bold text-xs px-3.5 py-1.5 rounded-full shadow-[0_10px_25px_rgba(0,0,0,0.15)] border border-slate-200 flex items-center gap-1.5 animate-bounce">
              <MousePointer2 className="w-3.5 h-3.5 text-[#0D99FF] fill-[#0D99FF]" />
              <span className="text-[#0D99FF] font-extrabold">{currentStep.highlightText}</span>
            </div>
          )}
        </div>
      )}

      {/* Figma Inspector Card (Light Theme Tooltip) */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-5 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.2),0_0_1px_1px_rgba(0,0,0,0.05)] text-slate-900 space-y-3.5 animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Top Figma Tool Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#0D99FF]/10 text-[#0D99FF] flex items-center justify-center border border-[#0D99FF]/20 shadow-2xs">
              {currentStep.icon}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold text-[#0D99FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {currentStep.badge}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
                {currentStep.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng hướng dẫn (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-2.5">
          {currentStep.subtitle && (
            <div className="text-xs font-semibold text-amber-800 bg-amber-50/90 border border-amber-200/70 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{currentStep.subtitle}</span>
            </div>
          )}

          <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
            {currentStep.content}
          </p>

          {/* Quick tips list in Figma Property Inspector style */}
          {currentStep.tips && currentStep.tips.length > 0 && (
            <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                💡 Điểm lưu ý:
              </span>
              {currentStep.tips.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                  <span className="text-[#0D99FF] font-bold">•</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions & Step Progress Dots */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
          {/* Step Progress Indicators */}
          <div className="flex items-center gap-1">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStepIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-[#0D99FF]'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                title={`Chuyển sang Bước ${idx + 1}`}
              />
            ))}
          </div>

          {/* Next / Prev Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 bg-[#0D99FF] hover:bg-[#0088FF] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>{currentStepIndex === steps.length - 1 ? 'Bắt Đầu Học' : 'Tiếp Theo'}</span>
              {currentStepIndex === steps.length - 1 ? (
                <CornerDownLeft className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Subtle Keyboard Shortcuts Bar at Bottom */}
        <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <span>Nhấn <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded-sm text-slate-500 font-bold">Esc</kbd> để đóng</span>
          <span><kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded-sm text-slate-500 font-bold">←</kbd> <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded-sm text-slate-500 font-bold">→</kbd> để chuyển</span>
        </div>
      </div>
    </div>
  );
};

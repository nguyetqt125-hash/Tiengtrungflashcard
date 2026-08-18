import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  BookOpen,
  Brain,
  FileText,
  Layers,
  CheckCircle,
  MousePointer2,
  CornerDownLeft,
  Info,
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
  const tooltipRef = useRef<HTMLDivElement>(null);

  const steps: TourStep[] = [
    {
      id: 'step-create-course',
      targetSelector: '#tour-add-course-btn, #tour-navbar-add-course',
      badge: 'Step 1/6 • Khởi Đầu',
      figmaTag: 'Button / Tạo Khóa Học',
      title: 'Tạo Khóa Học Mới',
      subtitle: 'Tổ chức bài học theo cấp độ',
      highlightText: 'Bấm nút "+ Tạo Khóa Học"',
      content:
        'Tạo các khóa học theo cấp độ (HSK 1, HSK 2, Giáo trình Hán ngữ, Khẩu ngữ...) để sắp xếp lộ trình học tập khoa học.',
      tips: [
        'Đặt tên khóa học rõ ràng kèm phân loại cấp độ.',
        'Mỗi khóa học quản lý danh sách nhiều bài học độc lập.',
      ],
      icon: <Plus className="w-4 h-4 text-[#0D99FF]" />,
      placement: 'bottom',
      actionPrompt: 'Nhấn vào đây để tạo danh mục khóa học đầu tiên',
    },
    {
      id: 'step-course-cards',
      targetSelector: '#tour-first-course, #tour-course-cards',
      badge: 'Step 2/6 • Danh Sách Bài',
      figmaTag: 'Card / CourseItem',
      title: 'Quản Lý Bài Học & Từ Vựng',
      subtitle: 'Xem cấu trúc bài học chi tiết',
      highlightText: 'Bấm "Xem Bài Học" trên thẻ này',
      content:
        'Nhấn vào từng khóa học để mở danh sách các bài học. Bạn có thể thêm bài học mới, chỉnh sửa thông tin hoặc lọc tìm kiếm tức thì.',
      tips: [
        'Mỗi bài học tương ứng với một chủ đề hội thoại hoặc ngữ cảnh cụ thể.',
        'Hỗ trợ tìm kiếm nhanh theo tiêu đề và số lượng từ vựng.',
      ],
      icon: <BookOpen className="w-4 h-4 text-[#10B981]" />,
      placement: 'bottom',
      actionPrompt: 'Bấm vào để vào xem danh sách bài học và từ vựng',
    },
    {
      id: 'step-srs-streak',
      targetSelector: '#tour-srs-box, #tour-streak-box',
      badge: 'Step 3/6 • Ghi Nhớ SRS',
      figmaTag: 'Widget / SpacedRepetition',
      title: 'Chuỗi Học & Hộp Nhớ SRS',
      subtitle: 'Thuật toán lặp lại ngắt quãng',
      highlightText: 'Theo dõi từ đến hạn ôn tập tại đây',
      content:
        'Hệ thống tự động theo dõi chuỗi ngày học liên tục và phân loại từ vựng thành 3 hộp nhớ (H1: Từ mới, H2: Đang học, H3: Thuộc lâu dài) để nhắc lịch ôn tập chính xác.',
      tips: [
        'Tự động tính toán chu kỳ ôn tập tối ưu theo đường cong quên lãng.',
        'Nhấn trực tiếp vào widget để xem danh sách từ cần ôn trong ngày.',
      ],
      icon: <Brain className="w-4 h-4 text-[#F59E0B]" />,
      placement: 'bottom',
      actionPrompt: 'Duy trì học 5-10 phút mỗi ngày để bảo toàn chuỗi',
    },
    {
      id: 'step-batch-import',
      targetSelector: '#tour-batch-import-btn, #tour-add-single-card-btn',
      badge: 'Step 4/6 • Nhập Liệu',
      figmaTag: 'Action / BatchImport',
      title: 'Nhập Từ Vựng Hàng Loạt',
      subtitle: 'Tự động phân tách dữ liệu thông minh',
      highlightText: 'Bấm "Nhập Hàng Loạt" để dán danh sách',
      content:
        'Chỉ cần sao chép bảng từ vựng từ Excel, Word hoặc website rồi dán vào. Hệ thống sẽ tự động tách Chữ Hán, Phiên âm Pinyin và Nghĩa tiếng Việt trong vài giây.',
      tips: [
        'Hỗ trợ dán bảng Excel nhiều cột hoặc định dạng văn bản tự do.',
        'Đầy đủ 7 trường dữ liệu: Chữ Hán, Pinyin, Nghĩa, Âm Hán Việt, Ví dụ, Bản dịch, Mẹo nhớ.',
      ],
      icon: <Layers className="w-4 h-4 text-[#8B5CF6]" />,
      placement: 'bottom',
      actionPrompt: 'Nhập từ 50-100 từ vựng chỉ với 1 thao tác',
    },
    {
      id: 'step-study-modes',
      targetSelector: '#tour-study-all-btn, #tour-study-actions',
      badge: 'Step 5/6 • Chế Độ Học',
      figmaTag: 'Module / StudyModes',
      title: '4 Chế Độ Ôn Luyện Toàn Diện',
      subtitle: 'Luyện phản xạ và ghi nhớ sâu',
      highlightText: 'Chọn chế độ ôn tập trên thanh điều khiển',
      content:
        'Tích hợp 4 phương pháp ôn luyện: Ôn tập Quizlet trắc nghiệm (chia đợt ôn lại tùy chọn), Lật thẻ Flashcard, Trò chơi ghép thẻ tương tác và Bài kiểm tra trắc nghiệm tính điểm.',
      tips: [
        'Hỗ trợ phát âm chuẩn bản xứ cho từng từ và ví dụ.',
        'Chức năng "Ẩn Pinyin" giúp rèn luyện khả năng nhận diện mặt chữ Hán thuần thục.',
      ],
      icon: <CheckCircle className="w-4 h-4 text-[#0D99FF]" />,
      placement: 'top',
      actionPrompt: 'Bấm "Học Tất Cả Từ Vựng" để bắt đầu trải nghiệm',
    },
    {
      id: 'step-worksheet-export',
      targetSelector: '#tour-worksheet-btn, #tour-lesson-worksheet-btn',
      badge: 'Step 6/6 • Xuất PDF',
      figmaTag: 'Export / PDFWorksheet',
      title: 'Luyện Viết & Xuất Vở Tập Viết A4',
      subtitle: 'Chuẩn quy tắc bút thuận',
      highlightText: 'Bấm "Vở Tập Viết (A4)" để xuất PDF',
      content:
        'Xem trực quan từng nét bút thuận chữ Hán với hoạt họa viết tay hoặc xuất file PDF Vở Tập Viết A4 (kẻ ô Điền Tự Cách / Mễ Tự Cách) chất lượng cao để in ra giấy luyện viết.',
      tips: [
        'Tùy chọn in kèm Pinyin, nghĩa và các ô mờ nét mẫu để đồ theo.',
        'Dữ liệu lưu trữ cục bộ an toàn, phản hồi tức thì.',
      ],
      icon: <FileText className="w-4 h-4 text-[#0D99FF]" />,
      placement: 'bottom',
      actionPrompt: 'Xuất file PDF chuẩn in ấn chỉ với một cú nhấp',
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
      const timer = setTimeout(() => {
        updateTargetRect();
      }, 80);

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

  // Calculate intelligent horizontal tooltip position
  const getTooltipStyle = (): React.CSSProperties => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
    const padding = 16;
    
    // Horizontal wide layout: min 640px on desktop or screenWidth - 32px on mobile
    const tooltipWidth = Math.min(680, screenWidth - 32);
    const estimatedHeight = screenWidth > 640 ? 190 : 310;

    if (!targetRect) {
      return {
        bottom: `${padding}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        width: `${tooltipWidth}px`,
        position: 'fixed',
        zIndex: 100,
      };
    }

    let top: number;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    // Check boundary horizontal
    if (left < padding) left = padding;
    if (left + tooltipWidth > screenWidth - padding) {
      left = screenWidth - tooltipWidth - padding;
    }

    // Vertical placement logic:
    const spaceBelow = screenHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;

    if (spaceBelow < estimatedHeight + 30 && spaceAbove >= estimatedHeight + 20) {
      // Place ABOVE target
      top = targetRect.top - estimatedHeight - 14;
    } else if (spaceBelow >= estimatedHeight + 20) {
      // Place BELOW target
      top = targetRect.bottom + 14;
    } else {
      // Fallback
      if (spaceAbove > spaceBelow) {
        top = Math.max(padding, targetRect.top - estimatedHeight - 12);
      } else {
        top = Math.min(screenHeight - estimatedHeight - padding, targetRect.bottom + 12);
      }
    }

    // Hard clamps
    if (top < padding) top = padding;
    if (top + estimatedHeight > screenHeight - padding) {
      top = screenHeight - estimatedHeight - padding;
    }

    return {
      top: `${top}px`,
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
                rx="12"
                ry="12"
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
          className="rounded-xl pointer-events-none transition-all duration-300 ease-out border-2 border-[#0D99FF] shadow-[0_0_0_2px_rgba(255,255,255,0.95),0_8px_25px_rgba(13,153,255,0.3)]"
        >
          {/* Subtle pulse highlight ring */}
          <div className="absolute inset-0 rounded-xl ring-2 ring-[#0D99FF]/20 animate-pulse pointer-events-none" />

          {/* 4 Corner Figma Resize Handles */}
          <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white border border-[#0D99FF] rounded-xs shadow-2xs" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-white border border-[#0D99FF] rounded-xs shadow-2xs" />
          <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-white border border-[#0D99FF] rounded-xs shadow-2xs" />
          <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white border border-[#0D99FF] rounded-xs shadow-2xs" />

          {/* Figma Frame / Layer Tag Header */}
          <div className="absolute -top-6 left-0 flex items-center gap-1.5 bg-[#0D99FF] text-white text-[11px] font-mono font-medium px-2 py-0.5 rounded-t-md shadow-xs">
            <span className="opacity-75">❖</span>
            <span>{currentStep.figmaTag || 'Component'}</span>
          </div>

          {/* Figma Cursor Pointer Label */}
          {currentStep.highlightText && (
            <div className="absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white text-slate-800 font-bold text-xs px-3 py-1 rounded-full shadow-md border border-slate-200 flex items-center gap-1.5">
              <MousePointer2 className="w-3.5 h-3.5 text-[#0D99FF] fill-[#0D99FF]" />
              <span className="text-[#0D99FF] font-semibold">{currentStep.highlightText}</span>
            </div>
          )}
        </div>
      )}

      {/* Figma Inspector Card (Horizontal Landscape Layout - Never overflows) */}
      <div
        ref={tooltipRef}
        style={getTooltipStyle()}
        className="bg-white/98 backdrop-blur-xl border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-[0_20px_50px_-15px_rgba(15,23,42,0.2),0_0_1px_1px_rgba(0,0,0,0.05)] text-slate-900 animate-in fade-in zoom-in-95 duration-200 max-h-[85vh] overflow-y-auto"
      >
        {/* Horizontal Split Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          
          {/* Left Main Content Column (7 cols) */}
          <div className="sm:col-span-7 space-y-2">
            {/* Header with icon & badge */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-[#0D99FF]/10 text-[#0D99FF] flex items-center justify-center border border-[#0D99FF]/20 shrink-0 font-mono text-xs font-bold">
                  ❖
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#0D99FF] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {currentStep.badge}
                </span>
              </div>

              {/* Mobile Close Button */}
              <button
                onClick={onClose}
                className="sm:hidden w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng hướng dẫn (Esc)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Title & Subtitle */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {currentStep.title}
              </h3>
              {currentStep.subtitle && (
                <div className="mt-0.5 text-[11px] font-medium text-slate-500 flex items-center gap-1">
                  <Info className="w-3 h-3 text-[#0D99FF] shrink-0" />
                  <span>{currentStep.subtitle}</span>
                </div>
              )}
            </div>

            {/* Description Text */}
            <p className="text-xs text-slate-600 leading-relaxed">
              {currentStep.content}
            </p>
          </div>

          {/* Right Action & Controls Column (5 cols) */}
          <div className="sm:col-span-5 flex flex-col justify-between h-full space-y-2.5 sm:border-l sm:border-slate-100 sm:pl-4">
            {/* Header Close on Desktop */}
            <div className="hidden sm:flex items-center justify-between">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Properties</span>
              <button
                onClick={onClose}
                className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Quick tips list compact */}
            {currentStep.tips && currentStep.tips.length > 0 && (
              <div className="bg-slate-50/90 p-2 rounded-xl border border-slate-200/70 space-y-1">
                {currentStep.tips.slice(0, 2).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-tight">
                    <span className="text-[#0D99FF] font-bold shrink-0">•</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation & Progress Dock */}
            <div className="space-y-2 pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2">
                {/* Step Indicators */}
                <div className="flex items-center gap-1">
                  {steps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentStepIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${
                        idx === currentStepIndex
                          ? 'w-5 bg-[#0D99FF]'
                          : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                      }`}
                      title={`Bước ${idx + 1}`}
                    />
                  ))}
                </div>

                {/* Next / Prev Buttons */}
                <div className="flex items-center gap-1.5">
                  {currentStepIndex > 0 && (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Trước</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-3.5 py-1.5 bg-[#0D99FF] hover:bg-[#0088FF] text-white text-xs font-semibold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                  >
                    <span>{currentStepIndex === steps.length - 1 ? 'Bắt Đầu' : 'Tiếp Theo'}</span>
                    {currentStepIndex === steps.length - 1 ? (
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Keyboard shortcuts */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Esc: Đóng</span>
                <span>← / → hoặc Enter</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  X,
  Search,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Send,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Award,
  HardDrive,
  Bell,
  Layers,
  MessageSquareQuote,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickGuide {
  id: string;
  roleLevel: number | 'all';
  roleTag: string;
  title: string;
  summary: string;
  steps: { title: string; desc: string }[];
  tip?: string;
}

interface FaqItem {
  id: string;
  category: 'auth' | 'activity' | 'score' | 'drive';
  categoryLabel: string;
  question: string;
  answer: string;
}

export const HelpCenterModal: React.FC<HelpCenterModalProps> = ({ isOpen, onClose }) => {
  const { user, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'guides' | 'faq' | 'contact'>('guides');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Quick Support Ticket State
  const [ticketName, setTicketName] = useState(user.fullName || '');
  const [ticketEmail, setTicketEmail] = useState(user.email || '');
  const [ticketCategory, setTicketCategory] = useState('auth_issue');
  const [ticketContent, setTicketContent] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const guides: QuickGuide[] = [
    {
      id: 'guide-student',
      roleLevel: 1,
      roleTag: 'Cấp 1 - Sinh viên',
      title: 'Tra cứu Điểm Rèn Luyện & Nộp Minh Chứng SV5T',
      summary: 'Dành cho sinh viên tra cứu sổ điểm rèn luyện, xem lịch sử cộng/trừ điểm và nộp hồ sơ xét chọn Sinh viên 5 Tốt.',
      steps: [
        {
          title: '1. Đăng nhập Google SSO',
          desc: 'Sử dụng tài khoản email sinh viên trường (@hcmuaf.edu.vn) hoặc email đã đăng ký để đăng nhập vào hệ thống.'
        },
        {
          title: '2. Vào "Cổng Sinh Viên & SV5T"',
          desc: 'Xem điểm rèn luyện tổng, xếp loại học kỳ và 5 tiêu chí Sinh viên 5 Tốt (Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập).'
        },
        {
          title: '3. Nộp Minh Chứng từ Google Drive',
          desc: 'Tại mục nộp minh chứng, đính kèm link tệp chứng nhận/hình ảnh từ Google Drive để Ban Chấp Hành Đoàn duyệt điểm bổ sung.'
        },
        {
          title: '4. Bật Thông Báo Đẩy (Web Push)',
          desc: 'Cho phép thông báo để nhận thông báo tức thời ngay khi hoạt động bạn tham gia được duyệt hoặc điểm ĐRL được cập nhật.'
        }
      ],
      tip: 'Điểm thưởng hoạt động và minh chứng được cộng tự động vào tiêu chí ĐRL tương ứng sau khi cấp có thẩm quyền phê duyệt.'
    },
    {
      id: 'guide-branch',
      roleLevel: 2,
      roleTag: 'Cấp 2 - Chi đoàn / CLB',
      title: 'Đăng Ký Kế Hoạch Hoạt Động & Nhập File Điểm Excel',
      summary: 'Quy trình tạo hồ sơ chương trình, nộp hồ sơ lên Đoàn Khoa phê duyệt và nạp danh sách tham gia từ file bảng tính Excel.',
      steps: [
        {
          title: '1. Tạo Hoạt Động Mới',
          desc: 'Vào "Quản Lý Hoạt Động" > bấm "Đăng Ký Hoạt Động Mới". Nhập tên hoạt động, mục tiêu, chọn tiêu chí ĐRL và điểm tương ứng.'
        },
        {
          title: '2. Nộp Trình Phê Duyệt',
          desc: 'Sau khi hoàn thiện kế hoạch, gửi hồ sơ phê duyệt để chuyển trạng thái sang Chờ BCH Đoàn Khoa (Cấp 3) thẩm định.'
        },
        {
          title: '3. Nạp Danh Sách Sinh Viên Tham Gia (Excel)',
          desc: 'Sau khi hoạt động diễn ra, mở tab "Người Tham Gia" > bấm "Nạp File Excel Danh Sách" để đối soát MSSV và tự động ghi nhận điểm.'
        },
        {
          title: '4. Đánh Giá 4 Mức Chuẩn Đoàn Viên',
          desc: 'Vào "Danh Mục & Sổ Điểm SV", lọc Chi đoàn của bạn để phân loại đoàn viên theo 4 mức: Xuất sắc, Khá, Trung bình, Yếu kém.'
        }
      ],
      tip: 'Mẫu file Excel chỉ cần 2 cột cơ bản: Cột A là "MSSV", Cột B là "Họ và Tên", hệ thống sẽ tự động khớp tên sinh viên trong cơ sở dữ liệu.'
    },
    {
      id: 'guide-faculty',
      roleLevel: 3,
      roleTag: 'Cấp 3 - BCH Đoàn Khoa',
      title: 'Thẩm Định Kế Hoạch & Quản Lý Thi Đua Các Chi Đoàn',
      summary: 'Duyệt kế hoạch hoạt động của các Chi đoàn/CLB Khoa, theo dõi bảng xếp hạng thi đua và quản trị sổ điểm rèn luyện toàn khoa.',
      steps: [
        {
          title: '1. Thẩm Định & Phê Duyệt Hoạt Động',
          desc: 'Vào "Quản Lý Hoạt Động", kiểm tra các hoạt động đang ở trạng thái "Chờ Duyệt Cấp 3", xem xét nội dung và duyệt hoặc yêu cầu chỉnh sửa.'
        },
        {
          title: '2. Theo Dõi Thi Đua Các Chi Đoàn',
          desc: 'Vào "Dashboard" hoặc "Sổ Điểm SV > Thi Đua", xem tổng hợp điểm phong trào, tỷ lệ sinh viên đạt ĐRL Xuất sắc theo từng Chi đoàn.'
        },
        {
          title: '3. Điều Chỉnh & Duyệt Điểm Hàng Loạt',
          desc: 'Sử dụng công cụ "Thao Tác Hàng Loạt" trong Sổ Điểm để cộng điểm thưởng sự kiện khoa hoặc chuẩn hóa xếp loại toàn khoa.'
        }
      ],
      tip: 'BCH Đoàn Khoa có thể xuất báo cáo thống kê định dạng Excel hoặc PDF để phục vụ công tác tổng kết năm học.'
    },
    {
      id: 'guide-school',
      roleLevel: 4,
      roleTag: 'Cấp 4 - BTV Đoàn Trường',
      title: 'Quản Trị Hệ Thống, Cấp Quyền SSO & Sao Lưu Google Drive',
      summary: 'Toàn quyền điều hành toàn trường, phân quyền tài khoản cán bộ Google SSO, cấu hình mẫu phôi chứng nhận và sao lưu đám mây.',
      steps: [
        {
          title: '1. Cấp Quyền Tài Khoản Google SSO',
          desc: 'Vào phân hệ "Cấp Quyền & Tài Khoản", thêm email Google của cán bộ phụ trách, chọn đơn vị và cấp độ (Cấp 2, Cấp 3, Cấp 4).'
        },
        {
          title: '2. Phê Duyệt Cấp Trường & Khóa Hồ Sơ',
          desc: 'Phê duyệt các chương trình cấp trường và thực hiện khóa bảo vệ dữ liệu hồ sơ cá nhân khi đến hạn chót năm học.'
        },
        {
          title: '3. Cấp Giấy Chứng Nhận Điện Tử Hàng Loạt',
          desc: 'Tùy biến phôi giấy chứng nhận NLU Youth, cấu hình mã QR đối soát và phát hành chứng nhận điện tử cho sinh viên đạt danh hiệu.'
        },
        {
          title: '4. Sao Lưu Dữ Liệu Lên Google Drive',
          desc: 'Bấm nút "Sao Lưu Drive" trên Header để tạo bản sao lưu dữ liệu toàn diện định dạng JSON mã hóa an toàn lưu trữ trên Google Drive.'
        }
      ],
      tip: 'Hệ thống hỗ trợ nhập danh sách tài khoản cán bộ số lượng lớn qua tệp Excel để thiết lập nhanh đầu mỗi nhiệm kỳ.'
    }
  ];

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'auth',
      categoryLabel: 'Tài khoản & SSO',
      question: 'Tôi đã đăng nhập bằng tài khoản Google nhưng hệ thống báo "Chưa được cấp quyền"?',
      answer: 'Hệ thống NLU Youth 2026 áp dụng cơ chế bảo mật phân quyền 2 lớp: Xác thực danh tính qua Google SSO và Phân quyền cán bộ theo đơn vị. Nếu email của bạn chưa nằm trong danh mục "Cấp Quyền Hệ Thống", bạn chỉ có quyền xem thông tin công khai trên Dashboard. Vui lòng liên hệ Quản trị viên Cấp 4 (Ban Thường vụ Đoàn trường) qua email doanhoi@hcmuaf.edu.vn kèm theo thông tin đơn vị công tác để được mở quyền.'
    },
    {
      id: 'faq-2',
      category: 'drive',
      categoryLabel: 'Google Drive & Minh chứng',
      question: 'Làm thế nào để đính kèm link minh chứng hoạt động từ Google Drive?',
      answer: 'Khi nộp minh chứng tại Cổng Sinh Viên hoặc Quản Lý Hoạt Động, bạn tải tệp minh chứng lên Google Drive cá nhân, chọn quyền chia sẻ "Bất kỳ ai có đường liên kết đều có thể xem" (Anyone with the link can view), sau đó dán đường dẫn vào ô liên kết minh chứng.'
    },
    {
      id: 'faq-3',
      category: 'activity',
      categoryLabel: 'Nạp File Excel',
      question: 'File Excel danh sách tham gia hoạt động cần có cấu trúc như thế nào?',
      answer: 'Hệ thống hỗ trợ đọc trực tiếp tệp .xlsx và .xls. Bảng tính cần có dòng tiêu đề chứa cột "MSSV" (hoặc "Mã sinh viên") và cột "Họ và tên". Bạn có thể tải tệp mẫu chuẩn từ nút "Tải File Mẫu Excel" trong cửa sổ nạp danh sách để tránh lỗi sai định dạng cột.'
    },
    {
      id: 'faq-4',
      category: 'score',
      categoryLabel: 'Điểm Rèn Luyện',
      question: 'Khi nào điểm rèn luyện của sinh viên được tự động cập nhật vào sổ?',
      answer: 'Điểm rèn luyện được tự động tính toán và cộng dồn ngay khi: (1) Ban tổ chức nạp danh sách tham gia qua file Excel; (2) Hoạt động được Cấp 3 hoặc Cấp 4 phê duyệt chính thức; (3) Ban Chấp Hành duyệt minh chứng do sinh viên tự nộp.'
    },
    {
      id: 'faq-5',
      category: 'auth',
      categoryLabel: 'Bảo mật & Quyền riêng tư',
      question: 'Dữ liệu cá nhân và điểm số của sinh viên được bảo vệ như thế nào?',
      answer: 'Hệ thống phân cấp nghiêm ngặt: Sinh viên (Cấp 1) chỉ xem được thông tin cá nhân của chính mình; Chi đoàn (Cấp 2) chỉ xem và quản lý lớp phụ trách; Đoàn Khoa (Cấp 3) phụ trách phạm vi khoa; Cấp Trường (Cấp 4) quản lý toàn diện. Mọi thao tác thay đổi điểm số đều được lưu vết chi tiết trong Sổ Kiểm Toán (Audit Log).'
    }
  ];

  const filteredGuides = useMemo(() => {
    return guides.filter(g => {
      const matchRole = selectedRoleFilter === 'all' || g.roleLevel === selectedRoleFilter;
      const matchSearch =
        searchQuery.trim() === '' ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.desc.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchRole && matchSearch;
    });
  }, [guides, selectedRoleFilter, searchQuery]);

  const filteredFaqs = useMemo(() => {
    return faqs.filter(f => {
      return (
        searchQuery.trim() === '' ||
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [faqs, searchQuery]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Đã sao chép: ${text}`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketContent.trim()) {
      showToast('Vui lòng nhập nội dung yêu cầu hỗ trợ!', 'warning');
      return;
    }

    setIsSubmittingTicket(true);
    setTimeout(() => {
      setIsSubmittingTicket(false);
      showToast('Đã gửi yêu cầu trợ giúp kỹ thuật thành công! Đội ngũ IT Đoàn - Hội NLU sẽ phản hồi sớm nhất qua email của bạn.', 'success', {
        title: 'Gửi Hỗ Trợ Kỹ Thuật Thành Công',
        durationMs: 6000
      });
      setTicketContent('');
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 transition-colors">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 dark:from-emerald-950 dark:via-teal-950 dark:to-slate-950 text-white relative flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black tracking-tight">
                  Trung Tâm Trợ Giúp & Hỗ Trợ Kỹ Thuật
                </h3>
                <span className="text-[11px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  NLU Youth 2026
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 dark:text-emerald-200/80 mt-0.5">
                Cẩm nang hướng dẫn sử dụng nhanh theo vai trò và kênh kết nối đội ngũ hỗ trợ trực tiếp
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng cửa sổ trợ giúp"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Navigation Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-2xl self-start">
            <button
              type="button"
              onClick={() => setActiveTab('guides')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'guides'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Hướng Dẫn Nhanh</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('faq')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'faq'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <MessageSquareQuote className="w-4 h-4" />
              <span>Câu Hỏi Thường Gặp (FAQ)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'contact'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Phone className="w-4 h-4" />
              <span>Liên Hệ Kỹ Thuật</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm hướng dẫn, lỗi..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: QUICK START GUIDES */}
          {activeTab === 'guides' && (
            <div className="space-y-5">
              {/* Role Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
                <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">Lọc theo vai trò:</span>
                {[
                  { id: 'all', label: 'Tất cả các cấp' },
                  { id: 1, label: '🎓 Cấp 1 - Sinh viên' },
                  { id: 2, label: '👥 Cấp 2 - Chi đoàn / CLB' },
                  { id: 3, label: '🏛️ Cấp 3 - Đoàn Khoa' },
                  { id: 4, label: '👑 Cấp 4 - BTV Đoàn Trường' }
                ].map(r => (
                  <button
                    key={String(r.id)}
                    type="button"
                    onClick={() => setSelectedRoleFilter(r.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                      selectedRoleFilter === r.id
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Guide Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredGuides.map(guide => (
                  <div
                    key={guide.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          <Sparkles className="w-3 h-3" />
                          {guide.roleTag}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                        {guide.title}
                      </h4>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {guide.summary}
                      </p>

                      <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        {guide.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <div>
                              <strong className="text-slate-800 dark:text-slate-200 font-bold block">
                                {step.title}
                              </strong>
                              <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                                {step.desc}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {guide.tip && (
                      <div className="mt-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong>Mẹo hữu ích:</strong> {guide.tip}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredGuides.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
                  Không tìm thấy hướng dẫn nào khớp với từ khóa "{searchQuery}".
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3.5 max-w-3xl mx-auto">
              {filteredFaqs.map(faq => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-800/60 overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                    >
                      <div className="space-y-1">
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          {faq.categoryLabel}
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                          {faq.question}
                        </h4>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 mt-1 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180 text-emerald-600' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-5 sm:px-5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700/60 pt-3 bg-slate-50/50 dark:bg-slate-900/30">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}

              {filteredFaqs.length === 0 && (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs">
                  Không tìm thấy câu hỏi FAQ nào khớp với từ khóa "{searchQuery}".
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CONTACT TECH SUPPORT */}
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              {/* Left Column: Contact Cards */}
              <div className="md:col-span-2 space-y-4">
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-emerald-950 dark:text-emerald-200">
                        Đường Dây Nóng Kỹ Thuật
                      </h4>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                        Văn phòng Đoàn - Hội Trường NLU
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Hotline</span>
                        <span className="font-black text-slate-900 dark:text-white font-mono text-sm">
                          028.3896.6780
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('02838966780', 'phone')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                        title="Sao chép số điện thoại"
                      >
                        {copiedField === 'phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/60">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">Email Tiếp Nhận</span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                          doanhoi@hcmuaf.edu.vn
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard('doanhoi@hcmuaf.edu.vn', 'email')}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                        title="Sao chép email"
                      >
                        {copiedField === 'email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Location & Operating Hours */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 space-y-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-bold block">Văn Phòng Trực Tiếp</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                        Phòng 105, Nhà Sinh Hoạt Sinh Viên, ĐH Nông Lâm TP.HCM (KP6, P. Linh Trung, TP. Thủ Đức).
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                    <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 dark:text-white font-bold block">Thời Gian Làm Việc</strong>
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        Thứ Hai - Thứ Sáu: 07:30 - 17:00 (Hỗ trợ online 24/7 trong tuần cao điểm)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Quick Support Ticket Form */}
              <div className="md:col-span-3 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60">
                <div className="mb-4">
                  <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    Gửi Yêu Cầu Trợ Giúp Kỹ Thuật Nhanh
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Mô tả sự cố bạn gặp phải (phân quyền, lỗi nạp file, điểm rèn luyện), đội ngũ IT sẽ xử lý trong 2-4 giờ.
                  </p>
                </div>

                <form onSubmit={handleSendTicket} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Họ và Tên
                      </label>
                      <input
                        type="text"
                        value={ticketName}
                        onChange={e => setTicketName(e.target.value)}
                        required
                        placeholder="Nguyễn Văn A"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                        Email Phản Hồi
                      </label>
                      <input
                        type="email"
                        value={ticketEmail}
                        onChange={e => setTicketEmail(e.target.value)}
                        required
                        placeholder="email@hcmuaf.edu.vn"
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Vấn đề cần hỗ trợ
                    </label>
                    <select
                      value={ticketCategory}
                      onChange={e => setTicketCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    >
                      <option value="auth_issue">🔐 Lỗi cấp quyền Google SSO / Tài khoản</option>
                      <option value="excel_upload">📊 Sự cố nạp danh sách tệp Excel</option>
                      <option value="score_discrepancy">🎖️ Thắc mắc tính Điểm Rèn Luyện / SV5T</option>
                      <option value="activity_workflow">📋 Trục trặc duyệt kế hoạch hoạt động</option>
                      <option value="other">💬 Đóng góp ý kiến & Đề xuất nâng cấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Chi tiết mô tả sự cố
                    </label>
                    <textarea
                      rows={4}
                      value={ticketContent}
                      onChange={e => setTicketContent(e.target.value)}
                      required
                      placeholder="Vui lòng nêu rõ mã số sinh viên, tên chi đoàn/khoa hoặc thông báo lỗi xuất hiện..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md shadow-emerald-700/20 transition-all hover:scale-[1.01] active:scale-98"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmittingTicket ? 'Đang gửi thông tin...' : 'Gửi Phiếu Trợ Giúp Kỹ Thuật'}</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Hệ thống Quản lý Đoàn - Hội NLU Youth 2026</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold transition-colors text-xs"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};

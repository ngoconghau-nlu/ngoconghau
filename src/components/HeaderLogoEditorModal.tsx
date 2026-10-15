import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Settings2,
  X,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Link
} from 'lucide-react';

interface HeaderLogoEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_LOGOS: Array<{ name: string; url: string; description: string }> = [];

export const HeaderLogoEditorModal: React.FC<HeaderLogoEditorModalProps> = ({ isOpen, onClose }) => {
  const { headerBranding, updateHeaderBranding, resetHeaderBranding, user, showToast } = useApp();

  const [form, setForm] = useState({
    logoUrl: '',
    secondaryLogoUrl: '',
    badgeText: '',
    titleText: '',
    subtitleText: ''
  });

  useEffect(() => {
    if (isOpen && headerBranding) {
      setForm({
        logoUrl: headerBranding.logoUrl || '',
        secondaryLogoUrl: headerBranding.secondaryLogoUrl || '',
        badgeText: headerBranding.badgeText || 'Đoàn - Hội Nông Lâm',
        titleText: headerBranding.titleText || 'NLU YOUTH 2026',
        subtitleText: headerBranding.subtitleText || 'Tuổi trẻ Đại học Nông Lâm TP. Hồ Chí Minh'
      });
    }
  }, [isOpen, headerBranding]);

  if (!isOpen) return null;

  const isLevel4 = user.currentRole.roleLevel === 4;

  if (!isLevel4) {
    return (
      <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/75 backdrop-blur-xs p-3 sm:p-6 flex flex-col justify-center items-center">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in fade-in duration-200">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Truy cập bị từ chối (Cấp 4)</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            Chức năng cấu hình nhận diện thương hiệu và Logo hệ thống chỉ dành riêng cho Quản trị viên Cấp trường (Cấp 4).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user.currentRole.roleLevel !== 4) {
      showToast('Từ chối quyền: Yêu cầu tài khoản Quản trị Cấp 4.', 'error');
      return;
    }
    const res = await updateHeaderBranding(form);
    if (res.success) {
      onClose();
    }
  };

  const handleReset = async () => {
    if (user.currentRole.roleLevel !== 4) {
      showToast('Từ chối quyền: Yêu cầu tài khoản Quản trị Cấp 4.', 'error');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại biểu trưng Logo & Tiêu đề mặc định của Header?')) {
      const res = await resetHeaderBranding();
      if (res.success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-slate-900/75 backdrop-blur-xs p-3 sm:p-6 flex flex-col justify-start sm:justify-center items-center">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 shrink-0">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <ImageIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Thêm & Chỉnh Sửa Logo Header (Cấp 4)
              </h3>
              <p className="text-xs text-emerald-100">
                Thay đổi Logo nhận diện, huy hiệu & tiêu đề hiển thị trên thanh Header hệ thống
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Section */}
        <div className="p-4 bg-slate-100 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
            <span>Xem trước hiển thị trực tiếp (Live Header Preview):</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Cấp 4 Admin
            </span>
          </div>
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-3">
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Logo xem trước"
                className="w-10 h-10 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-sky-700 flex items-center justify-center text-white font-black text-sm shadow-xs">
                NLU
              </div>
            )}

            {form.secondaryLogoUrl && (
              <img
                src={form.secondaryLogoUrl}
                alt="Logo phụ xem trước"
                className="w-9 h-9 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white"
              />
            )}

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
                  {form.titleText || 'NLU YOUTH 2026'}
                </h1>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  {form.badgeText || 'Đoàn - Hội Nông Lâm'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {form.subtitleText || 'Tuổi trẻ Đại học Nông Lâm TP. Hồ Chí Minh'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-emerald-600" />
              URL Hình ảnh Logo Chính (Primary Logo Image URL)
            </label>
            <input
              type="url"
              value={form.logoUrl}
              onChange={e => setForm(prev => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="Nhập đường dẫn URL hình ảnh Logo (https://...)"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Để trống nếu muốn sử dụng Logo chữ khối NLU mầu xanh phong cách mặc định.
            </p>
          </div>

          {/* Quick Preset Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
              Hoặc chọn nhanh biểu trưng có sẵn:
            </label>
            {PRESET_LOGOS.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {PRESET_LOGOS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, logoUrl: p.url }))}
                    className={`p-2 rounded-xl border text-left transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                      form.logoUrl === p.url
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <img src={p.url} alt={p.name} className="w-8 h-8 object-contain rounded-lg bg-white p-0.5" />
                    <span className="font-bold text-[10px] text-center line-clamp-1">{p.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[11px] italic">
                Sử dụng đường dẫn URL hình ảnh logo chính thức đã xác minh hoặc giữ trống để hiển thị huy hiệu chữ NLU chuẩn.
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-teal-600" />
              URL Logo Phụ (Tùy chọn - Huy hiệu Đoàn / Hội)
            </label>
            <input
              type="url"
              value={form.secondaryLogoUrl}
              onChange={e => setForm(prev => ({ ...prev, secondaryLogoUrl: e.target.value }))}
              placeholder="https://example.com/logo-doan-hoi.png"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Tên Tiêu Đề Chính (Header Title)
              </label>
              <input
                type="text"
                required
                value={form.titleText}
                onChange={e => setForm(prev => ({ ...prev, titleText: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                Nhãn Huy Hiệu (Badge Text)
              </label>
              <input
                type="text"
                required
                value={form.badgeText}
                onChange={e => setForm(prev => ({ ...prev, badgeText: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
              Mô Tả Phụ (Header Subtitle)
            </label>
            <input
              type="text"
              required
              value={form.subtitleText}
              onChange={e => setForm(prev => ({ ...prev, subtitleText: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-bold transition text-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Đặt Lại Mặc Định
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu Thay Đổi Logo
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

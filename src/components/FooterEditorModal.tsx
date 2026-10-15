import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { FooterConfig, FooterCustomLink } from '../types';
import {
  Settings2,
  X,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building,
  FileText,
  Link as LinkIcon
} from 'lucide-react';

interface FooterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FooterEditorModal: React.FC<FooterEditorModalProps> = ({ isOpen, onClose }) => {
  const { footerConfig, updateFooterConfig, resetFooterConfig, user, showToast } = useApp();

  const [form, setForm] = useState<FooterConfig>({
    orgName: '',
    unitName: '',
    systemTitle: '',
    contactEmail: '',
    hotline: '',
    address: '',
    websiteUrl: '',
    copyrightText: '',
    customLinks: []
  });

  const [newLink, setNewLink] = useState<FooterCustomLink>({ label: '', url: '' });

  useEffect(() => {
    if (isOpen) {
      setForm(JSON.parse(JSON.stringify(footerConfig)));
    }
  }, [isOpen, footerConfig]);

  if (!isOpen) return null;

  // Level 4 Check
  const isLevel4 = user.currentRole.roleLevel === 4;
  if (!isLevel4) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <X className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Thẩm Quyền Giới Hạn</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Chức năng chỉnh sửa thông tin Footer Chân trang chỉ dành cho tài khoản quản trị Cấp Trường (Cấp 4).
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition w-full"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const handleAddLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLink.label.trim() || !newLink.url.trim()) {
      showToast('Vui lòng nhập đầy đủ tên và đường dẫn liên kết!', 'warning');
      return;
    }

    setForm(prev => ({
      ...prev,
      customLinks: [...(prev.customLinks || []), { label: newLink.label.trim(), url: newLink.url.trim() }]
    }));
    setNewLink({ label: '', url: '' });
  };

  const handleDeleteLink = (index: number) => {
    setForm(prev => ({
      ...prev,
      customLinks: (prev.customLinks || []).filter((_, idx) => idx !== index)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateFooterConfig(form);
    onClose();
  };

  const handleReset = () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục lại cấu hình Footer mặc định của hệ thống?')) {
      resetFooterConfig();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-amber-300" />
              Chỉnh Sửa Thông Tin Footer Chân Trang (Cấp Trường)
            </h3>
            <p className="text-xs text-emerald-100">
              Điều chỉnh tên tổ chức, thông tin liên hệ, hotline, địa chỉ, bản quyền và các liên kết liên quan ở chân trang
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-emerald-200 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          {/* Main Unit & System info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-600" />
                Tên Tổ Chức / Đơn Vị Quản Lý
              </label>
              <input
                type="text"
                required
                value={form.orgName}
                onChange={e => setForm(prev => ({ ...prev, orgName: e.target.value }))}
                placeholder="VD: ĐOÀN THANH NIÊN - HỘI SINH VIÊN"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold uppercase text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-sky-600" />
                Tên Trường / Viện / Cơ Sở
              </label>
              <input
                type="text"
                required
                value={form.unitName}
                onChange={e => setForm(prev => ({ ...prev, unitName: e.target.value }))}
                placeholder="VD: Trường Đại học Nông Lâm TP. Hồ Chí Minh"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              Mô Tả / Tiêu Đề Hệ Thống
            </label>
            <input
              type="text"
              required
              value={form.systemTitle}
              onChange={e => setForm(prev => ({ ...prev, systemTitle: e.target.value }))}
              placeholder="VD: Hệ thống Quản lý Hoạt động & Điểm Rèn luyện NLU Youth 2026"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium text-slate-900 dark:text-white"
            />
          </div>

          {/* Contact info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                Email Liên Hệ Văn Phòng
              </label>
              <input
                type="email"
                required
                value={form.contactEmail}
                onChange={e => setForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                placeholder="VD: doanhoi@hcmuaf.edu.vn"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-emerald-700 dark:text-emerald-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                Số Điện Thoại Hotline / Văn Phòng
              </label>
              <input
                type="text"
                value={form.hotline || ''}
                onChange={e => setForm(prev => ({ ...prev, hotline: e.target.value }))}
                placeholder="VD: (028) 3896 6780"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Địa Chỉ Văn Phòng Đoàn - Hội
              </label>
              <input
                type="text"
                value={form.address || ''}
                onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="VD: Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600" />
                Địa Chỉ Website Chính Thức
              </label>
              <input
                type="url"
                value={form.websiteUrl || ''}
                onChange={e => setForm(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="VD: https://doantruong.hcmuaf.edu.vn"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-indigo-700 dark:text-indigo-400 font-semibold"
              />
            </div>
          </div>

          {/* Copyright note */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Ghi Chú Bản Quyền & Bản Quyền Hệ Thống
            </label>
            <input
              type="text"
              required
              value={form.copyrightText}
              onChange={e => setForm(prev => ({ ...prev, copyrightText: e.target.value }))}
              placeholder="VD: © 2026 Ban Thường vụ Đoàn Trường ĐH Nông Lâm TP.HCM. Bảo lưu mọi quyền."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
            />
          </div>

          {/* Custom Links List */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-emerald-600" />
                Các Liên Kết Nhanh Ở Chân Trang ({form.customLinks?.length || 0})
              </label>
            </div>

            <div className="space-y-2">
              {(form.customLinks || []).map((link, lIdx) => (
                <div key={lIdx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-900 dark:text-white flex-1 truncate">{link.label}</span>
                  <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 flex-1 truncate">{link.url}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteLink(lIdx)}
                    className="p-1 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="Xóa liên kết này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Link Row */}
            <div className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-emerald-50/50 dark:bg-slate-800/40 rounded-xl border border-emerald-200 dark:border-slate-700">
              <input
                type="text"
                placeholder="Tên liên kết (VD: Fanpage Đoàn)"
                value={newLink.label}
                onChange={e => setNewLink(prev => ({ ...prev, label: e.target.value }))}
                className="w-full sm:flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs"
              />
              <input
                type="url"
                placeholder="URL (VD: https://facebook.com/...)"
                value={newLink.url}
                onChange={e => setNewLink(prev => ({ ...prev, url: e.target.value }))}
                className="w-full sm:flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-mono"
              />
              <button
                type="button"
                onClick={handleAddLink}
                className="w-full sm:w-auto px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
              >
                + Thêm
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Khôi phục thông tin Footer mặc định ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi Phục Mặc Định
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Lưu Cấu Hình Footer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

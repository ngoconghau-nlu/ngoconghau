import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FooterEditorModal } from './FooterEditorModal';
import { Settings2, Mail, Phone, ExternalLink } from 'lucide-react';

export const Footer: React.FC = () => {
  const { footerConfig, user } = useApp();
  const [showEditorModal, setShowEditorModal] = useState(false);

  const isLevel4 = user?.currentRole?.roleLevel === 4;

  const cfg = footerConfig || {
    orgName: 'ĐOÀN THANH NIÊN - HỘI SINH VIÊN',
    unitName: 'Trường Đại học Nông Lâm TP. Hồ Chí Minh',
    systemTitle: 'Hệ thống Quản lý Hoạt động & Điểm Rèn luyện NLU Youth 2026',
    contactEmail: 'doanhoi@hcmuaf.edu.vn',
    hotline: '(028) 3896 6780',
    address: 'Khu phố 6, Phường Linh Trung, TP. Thủ Đức, TP. Hồ Chí Minh',
    websiteUrl: 'https://doantruong.hcmuaf.edu.vn',
    copyrightText: '© 2026 Ban Thường vụ Đoàn Trường ĐH Nông Lâm TP.HCM. Bảo lưu mọi quyền.',
    customLinks: []
  };

  return (
    <>
      <footer className="mt-12 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 py-6 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-slate-800 dark:text-slate-200 font-bold">
              <span>{cfg.orgName}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>{cfg.unitName}</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {cfg.systemTitle} — {cfg.address}
            </p>
          </div>

          {/* Right Contacts & Links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-[11px]">
            {cfg.contactEmail && (
              <a
                href={`mailto:${cfg.contactEmail}`}
                className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                <Mail className="w-3.5 h-3.5" />
                {cfg.contactEmail}
              </a>
            )}
            {cfg.hotline && (
              <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <Phone className="w-3.5 h-3.5 text-teal-500" />
                {cfg.hotline}
              </span>
            )}
            {cfg.websiteUrl && (
              <a
                href={cfg.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition font-medium"
              >
                <span>Website</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {isLevel4 && (
              <button
                type="button"
                onClick={() => setShowEditorModal(true)}
                className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Chỉnh sửa Footer (Cấp 4 Admin)"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-[10.5px] text-slate-400 dark:text-slate-500 text-center">
          {cfg.copyrightText}
        </div>
      </footer>

      {isLevel4 && (
        <FooterEditorModal isOpen={showEditorModal} onClose={() => setShowEditorModal(false)} />
      )}
    </>
  );
};

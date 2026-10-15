import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchDriveFiles, createDriveFile, deleteDriveFile } from '../services/driveService';
import { DriveItem } from '../types';
import {
  HardDrive,
  RefreshCw,
  Plus,
  ExternalLink,
  Trash2,
  FileText,
  FolderPlus,
  Search,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  FileImage,
  File
} from 'lucide-react';

export const GoogleDriveExplorer: React.FC = () => {
  const { accessToken, googleUser, loginGoogle, logoutGoogle, isConnectingGoogle, showToast } = useApp();
  const [files, setFiles] = useState<DriveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New file modal state
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load files
  const loadFiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await fetchDriveFiles(accessToken, searchQuery ? `name contains '${searchQuery}'` : undefined);
      setFiles(data);
    } catch (err: any) {
      showToast(err.message || 'Không thể tải danh sách tệp Google Drive', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      loadFiles();
    }
  }, [accessToken]);

  // Create file on Drive
  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newFileName) return;

    setIsCreating(true);
    try {
      const item = await createDriveFile(accessToken, newFileName, newFileContent || 'Tài liệu NLU Youth 2026');
      showToast(`Đã tạo tệp trên Google Drive: ${item.name}`, 'success');
      setShowCreateModal(false);
      setNewFileName('');
      setNewFileContent('');
      loadFiles();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tạo tệp Google Drive', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete file with Mandatory Confirmation Dialog (Workspace Integration Guideline)
  const handleDeleteFile = async (file: DriveItem) => {
    if (!accessToken) return;
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn xóa tệp "${file.name}" khỏi Google Drive không? Thao tác này không thể hoàn tác.`
    );
    if (!confirmed) return;

    try {
      await deleteDriveFile(accessToken, file.id);
      showToast(`Đã xóa tệp: ${file.name}`, 'info');
      setFiles(prev => prev.filter(f => f.id !== file.id));
    } catch (err: any) {
      showToast(err.message || 'Không thể xóa tệp trên Google Drive', 'error');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
    }
    if (mimeType.includes('image')) {
      return <FileImage className="w-5 h-5 text-purple-600" />;
    }
    if (mimeType.includes('document') || mimeType.includes('pdf')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <File className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header & Connection Status */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <HardDrive className="w-6 h-6 text-sky-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Lưu Trữ & Quản Lý Hồ Sơ Trên Google Drive
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kết nối trực tiếp tài khoản Google Drive để lưu trữ văn bản trình ký (VB trình ký), minh chứng hoạt động và xuất báo cáo.
          </p>
        </div>

        <div>
          {googleUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Đang liên kết</span>
                <span className="text-xs font-bold text-slate-800">{googleUser.email}</span>
              </div>
              <button
                onClick={logoutGoogle}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
              >
                Ngắt kết nối
              </button>
            </div>
          ) : (
            <button
              onClick={loginGoogle}
              disabled={isConnectingGoogle}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <HardDrive className="w-4 h-4 text-sky-400" />
              {isConnectingGoogle ? 'Đang xác thực...' : 'Đăng nhập Google Drive (SSO)'}
            </button>
          )}
        </div>
      </div>

      {!googleUser ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4">
            <HardDrive className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Chưa liên kết Google Drive</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6 leading-relaxed">
            Hệ thống NLU Youth 2026 sử dụng Google Workspace Drive để lưu trữ tài liệu minh chứng,
            VB trình ký và sổ điểm sinh viên. Bấm nút dưới đây để kết nối với tài khoản Google của bạn.
          </p>
          <button
            onClick={loginGoogle}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <HardDrive className="w-4 h-4" />
            Ủy Quyền & Kết Nối Google Drive
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Controls bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tệp trên Google Drive..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadFiles()}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                onClick={loadFiles}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                title="Làm mới"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo Tệp Minh Chứng Mới
            </button>
          </div>

          {/* Files List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Tên Tệp Trên Drive</th>
                  <th className="px-4 py-3">Kích Thước</th>
                  <th className="px-4 py-3">Ngày Sửa Đổi</th>
                  <th className="px-4 py-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400">
                      Đang đồng bộ danh sách tệp từ Google Drive...
                    </td>
                  </tr>
                ) : files.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-slate-400">
                      Không tìm thấy tệp nào trên Google Drive hoặc từ khóa tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  files.map(file => (
                    <tr key={file.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.mimeType)}
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-sm">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              ID: {file.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-500">{file.size || '--'}</td>

                      <td className="px-4 py-3 text-slate-500">{file.modifiedTime || 'Vừa xong'}</td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition"
                          >
                            <ExternalLink className="w-3 h-3" /> Mở Trên Drive
                          </a>

                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="Xóa tệp (yêu cầu xác nhận)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create File Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Tạo Tệp Ghi Nhận Minh Chứng Mới Trên Google Drive</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateFile} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Tên tệp (kèm phần mở rộng .txt, .json, .csv) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: VB_TrinhKy_HoiThao_2026.txt"
                  value={newFileName}
                  onChange={e => setNewFileName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Nội dung tệp minh chứng
                </label>
                <textarea
                  rows={4}
                  placeholder="Ghi chú nội dung văn bản, quyết định hoặc biên bản họp..."
                  value={newFileContent}
                  onChange={e => setNewFileContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm"
                >
                  {isCreating ? 'Đang tạo...' : 'Lưu Vào Google Drive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

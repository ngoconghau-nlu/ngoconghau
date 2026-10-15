import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  RotateCcw,
  Trash2,
  AlertTriangle,
  X,
  Calendar,
  Users,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  Search
} from 'lucide-react';

interface TrashRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrashRecoveryModal: React.FC<TrashRecoveryModalProps> = ({ isOpen, onClose }) => {
  const {
    deletedActivities,
    deletedStudents,
    restoreActivity,
    permanentDeleteActivity,
    restoreStudent,
    permanentDeleteStudent
  } = useApp();

  const [activeTab, setActiveTab] = useState<'activities' | 'students'>('activities');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter based on search
  const filteredActivities = deletedActivities.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.orgName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = deletedStudents.filter(s =>
    s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.facultyCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.classCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRestoreActivity = async (id: string, title: string) => {
    try {
      setProcessingId(id);
      await restoreActivity(id);
      setSuccessMessage(`Đã khôi phục thành công hoạt động: "${title}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Lỗi khi khôi phục: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleHardDeleteActivity = async (id: string, title: string) => {
    if (!window.confirm(`HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!\nBạn có chắc chắn muốn xóa vĩnh viễn hoạt động "${title}" khỏi hệ thống?`)) {
      return;
    }
    try {
      setProcessingId(id);
      await permanentDeleteActivity(id);
      setSuccessMessage(`Đã xóa vĩnh viễn hoạt động "${title}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Lỗi khi xóa vĩnh viễn: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRestoreStudent = async (mssv: string, name: string) => {
    try {
      setProcessingId(mssv);
      await restoreStudent(mssv);
      setSuccessMessage(`Đã khôi phục thành công sinh viên: "${name}" (${mssv})`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Lỗi khi khôi phục: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  const handleHardDeleteStudent = async (mssv: string, name: string) => {
    if (!window.confirm(`HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!\nBạn có chắc chắn muốn xóa vĩnh viễn sinh viên "${name}" (${mssv}) khỏi hệ thống?`)) {
      return;
    }
    try {
      setProcessingId(mssv);
      await permanentDeleteStudent(mssv);
      setSuccessMessage(`Đã xóa vĩnh viễn sinh viên "${name}"`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      alert(`Lỗi khi xóa vĩnh viễn: ${err.message || err}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100 my-0 sm:my-6">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Thùng rác & Phục hồi dữ liệu</h2>
              <p className="text-xs text-slate-300">
                Quản lý các bản ghi đã xóa mềm (Soft-deleted) theo chuẩn quy định NLU Youth 2026
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800 px-6 py-3 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-sm font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {successMessage}
          </div>
        )}

        {/* Tab Controls & Filter */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab('activities'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'activities'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Hoạt động ({deletedActivities.length})
            </button>
            <button
              onClick={() => { setActiveTab('students'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                activeTab === 'students'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Sinh viên ({deletedStudents.length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'activities' ? "Tìm theo tên hoạt động..." : "Tìm theo MSSV, Họ tên, Lớp..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {activeTab === 'activities' ? (
            filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-600">Thùng rác hoạt động trống</p>
                <p className="text-xs text-slate-400 mt-1">Không có hoạt động nào đang ở trạng thái đã xóa.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                          Đã xóa mềm
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 font-mono">
                          Mã: {act.id}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700">
                          {act.hostLevelName || `Cấp ${act.hostLevel}`}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-base truncate">{act.title}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Đơn vị: {act.orgName}
                        </span>
                        {act.branchClass && (
                          <span>Chi đoàn: {act.branchClass}</span>
                        )}
                        {act.deletedAt && (
                          <span className="flex items-center gap-1 text-rose-600 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Xóa lúc: {new Date(act.deletedAt).toLocaleString('vi-VN')}
                          </span>
                        )}
                        {act.deletedReason && (
                          <span className="text-slate-400 italic">
                            Lý do: {act.deletedReason}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleRestoreActivity(act.id, act.title)}
                        disabled={processingId === act.id}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Khôi phục
                      </button>
                      <button
                        onClick={() => handleHardDeleteActivity(act.id, act.title)}
                        disabled={processingId === act.id}
                        className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredStudents.length === 0 ? (
              <div className="text-center py-12">
                <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-600">Thùng rác sinh viên trống</p>
                <p className="text-xs text-slate-400 mt-1">Không có sinh viên nào đang ở trạng thái đã xóa.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map((stu) => (
                  <div
                    key={stu.studentId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          Đã xóa mềm
                        </span>
                        <span className="font-mono px-2 py-0.5 rounded text-[11px] font-bold bg-slate-900 dark:bg-slate-800 text-white border border-slate-700">
                          MSSV: {stu.studentId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Lớp: {stu.classCode}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-base">{stu.fullName}</h4>
                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span>Khoa: {stu.facultyCode}</span>
                        <span>Điểm: {stu.totalScore}đ ({stu.rankGrade})</span>
                        {stu.deletedAt && (
                          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            Xóa lúc: {new Date(stu.deletedAt).toLocaleString('vi-VN')}
                          </span>
                        )}
                        {stu.deletedReason && (
                          <span className="text-slate-400 italic">
                            Lý do: {stu.deletedReason}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
                      <button
                        onClick={() => handleRestoreStudent(stu.studentId, stu.fullName)}
                        disabled={processingId === stu.studentId}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition disabled:opacity-50 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Khôi phục
                      </button>
                      <button
                        onClick={() => handleHardDeleteStudent(stu.studentId, stu.fullName)}
                        disabled={processingId === stu.studentId}
                        className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Xóa vĩnh viễn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Chỉ Quản trị viên Cấp 4 mới có quyền khôi phục hoặc xóa vĩnh viễn dữ liệu.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

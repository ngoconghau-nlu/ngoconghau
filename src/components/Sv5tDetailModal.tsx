import React from 'react';
import { useApp } from '../context/AppContext';
import { StudentScoreRecord } from '../types';
import { SV5T_STANDARDS, checkSv5tEligibility } from '../data/mockData';
import {
  Award,
  CheckCircle2,
  XCircle,
  ExternalLink,
  X,
  Sparkles,
  Check,
  ShieldCheck,
  GraduationCap,
  Building,
  UserCheck
} from 'lucide-react';

interface Sv5tDetailModalProps {
  student: StudentScoreRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPortal?: (studentId: string) => void;
}

export const Sv5tDetailModal: React.FC<Sv5tDetailModalProps> = ({
  student,
  isOpen,
  onClose,
  onOpenPortal
}) => {
  const { toggleSv5tCriterion, user } = useApp();
  const isOfficer = user.currentRole.roleLevel >= 2;

  if (!isOpen || !student) return null;

  const sv5tMap = student.sv5tCriteriaAchieved || {};
  const stats = checkSv5tEligibility(sv5tMap);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white">
              <Award className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                Hồ Sơ Đánh Giá Danh Hiệu "Sinh Viên 5 Tốt" (SV5T)
              </h3>
              <p className="text-xs text-emerald-100">
                {student.fullName} • MSSV: <span className="font-mono font-bold text-white">{student.studentId}</span> • Lớp: {student.classCode}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {/* Status summary banner */}
          <div
            className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              stats.isEligible
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  stats.isEligible
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {stats.isEligible ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm">
                  {stats.isEligible
                    ? 'ĐẠT 100% TIÊU CHUẨN SINH VIÊN 5 TỐT'
                    : `ĐÃ ĐẠT ${stats.totalAchieved}/${stats.totalRequired} TIÊU CHÍ (${stats.percent}%)`}
                </p>
                <p className="text-xs opacity-90 mt-0.5">
                  {stats.isEligible
                    ? 'Sinh viên đủ điều kiện tuyên dương và cấp Giấy chứng nhận SV5T cấp Trường/Khoa.'
                    : 'Chưa đủ điều kiện xét chọn. Cần hoàn thành 100% các tiêu chí bắt buộc theo quy định.'}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-2xl font-black">{stats.percent}%</span>
              <span className="text-[11px] block font-semibold">Tỷ lệ hoàn thành</span>
            </div>
          </div>

          {/* Quick stats chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Tổng Điểm ĐRL</span>
              <span className="text-base font-black text-emerald-700 font-mono">
                {student.totalScore} đ <span className="text-xs font-bold text-emerald-600">({student.totalScore}%)</span>
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Xếp Loại Đoàn</span>
              <span className="text-xs font-bold text-slate-800 line-clamp-1">{student.rankGrade}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Hoạt Động Tham Gia</span>
              <span className="text-base font-black text-blue-700">{student.approvedActivitiesCount || 0}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Đối Tượng</span>
              <span className="text-xs font-bold text-emerald-700">
                {student.membershipType === 'DOAN_VIEN'
                  ? 'Đoàn viên'
                  : student.membershipType === 'HOI_VIEN'
                  ? 'Hội viên'
                  : 'Sinh viên'}
              </span>
            </div>
          </div>

          {/* 5 Standard Groups */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Chi Tiết 5 Nhóm Tiêu Chuẩn Theo Quy Định Ban Thường Vụ Đoàn Trường
              </h4>
              {isOfficer && (
                <span className="text-[10px] text-slate-500 italic">
                  * Cán bộ có thể nhấp để thẩm định / xác nhận tiêu chí
                </span>
              )}
            </div>

            {SV5T_STANDARDS.map((group, gIdx) => {
              const groupAchieved = group.criteria.filter(c => sv5tMap[c.id]).length;
              const groupTotal = group.criteria.length;
              const isGroupComplete = groupAchieved === groupTotal;

              return (
                <div
                  key={group.id}
                  className="border border-slate-200 rounded-2xl p-3.5 bg-white shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black ${
                          isGroupComplete
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {gIdx + 1}
                      </span>
                      {group.name}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        isGroupComplete
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {groupAchieved}/{groupTotal} tiêu chí
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {group.criteria.map(crit => {
                      const achieved = Boolean(sv5tMap[crit.id]);
                      return (
                        <div
                          key={crit.id}
                          onClick={() => {
                            if (isOfficer) {
                              toggleSv5tCriterion(student.studentId, crit.id);
                            }
                          }}
                          className={`flex items-start justify-between gap-3 p-2 rounded-xl transition ${
                            isOfficer ? 'cursor-pointer hover:bg-slate-50' : ''
                          } ${
                            achieved
                              ? 'bg-emerald-50/50 border border-emerald-100'
                              : 'bg-slate-50/50 border border-slate-100'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="shrink-0 mt-0.5">
                              {achieved ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center" />
                              )}
                            </div>
                            <div>
                              <p
                                className={`text-[11px] leading-relaxed ${
                                  achieved
                                    ? 'font-bold text-slate-900'
                                    : 'font-normal text-slate-600'
                                }`}
                              >
                                <span className="font-mono font-bold text-emerald-800 mr-1">
                                  [{crit.code}]
                                </span>
                                {crit.title}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              achieved
                                ? 'bg-emerald-200 text-emerald-900'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {achieved ? 'Đạt' : 'Chưa'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] text-slate-500">
            Dữ liệu SV5T được cập nhật thời gian thực từ hoạt động Đoàn - Hội và hồ sơ minh chứng.
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-xl font-medium transition"
            >
              Đóng
            </button>
            {onOpenPortal && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPortal(student.studentId);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition"
              >
                <ExternalLink className="w-4 h-4" />
                Mở Cổng Sinh Viên ({student.studentId})
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

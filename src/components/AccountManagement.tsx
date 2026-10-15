import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { SystemUserAccount, RoleLevel } from '../types';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  Search,
  Building,
  Mail,
  Lock,
  Edit2,
  Filter,
  FileSpreadsheet,
  Trash2,
  History
} from 'lucide-react';
import { BulkAccountImportModal } from './BulkAccountImportModal';

export const AccountManagement: React.FC = () => {
  const { accounts, addAccount, updateAccount, deleteAccount, toggleAccountStatus, organizations, branchClasses, user, showToast, setActiveTab } = useApp();

  const isLevel4 = user.currentRole.roleLevel === 4;

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkAccountModal, setShowBulkAccountModal] = useState(false);

  // Form State: Add Account
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [roleLevel, setRoleLevel] = useState<RoleLevel>(3);
  const [orgCode, setOrgCode] = useState('CNTT');
  const [classCode, setClassCode] = useState('');

  // Form State: Edit Account (Chỉ Cấp trường - Cấp 4 mới có quyền sửa)
  const [editingAccount, setEditingAccount] = useState<SystemUserAccount | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    roleLevel: 3 as RoleLevel,
    orgCode: 'CNTT',
    classCode: '',
    status: 'Active' as 'Active' | 'Inactive',
  });

  const selectedOrg = organizations.find(o => o.code === orgCode);

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (roleFilter !== 'ALL' && String(acc.roleLevel) !== roleFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          acc.fullName.toLowerCase().includes(q) ||
          acc.email.toLowerCase().includes(q) ||
          acc.orgName.toLowerCase().includes(q) ||
          acc.orgCode.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [accounts, roleFilter, searchTerm]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLevel4) {
      showToast('Chỉ Cấp trường (Cấp 4) mới có quyền tạo và cấp tài khoản!', 'error');
      return;
    }
    if (!email || !fullName) return;

    addAccount({
      email: email.trim(),
      fullName: fullName.trim(),
      roleLevel,
      orgCode,
      orgName: selectedOrg ? selectedOrg.name : orgCode,
      classCode: roleLevel === 2 ? classCode : undefined,
      status: 'Active',
    });

    setEmail('');
    setFullName('');
    setShowAddModal(false);
  };

  const handleOpenEdit = (acc: SystemUserAccount) => {
    if (!isLevel4) {
      showToast('Chỉ Cấp trường (Cấp 4) có quyền sửa tài khoản. Các cấp tài khoản khác không có quyền sửa!', 'error');
      return;
    }
    setEditingAccount(acc);
    setEditForm({
      fullName: acc.fullName,
      email: acc.email,
      roleLevel: acc.roleLevel,
      orgCode: acc.orgCode,
      classCode: acc.classCode || '',
      status: acc.status,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLevel4) {
      showToast('Chỉ Cấp trường (Cấp 4) có quyền sửa tài khoản. Các cấp tài khoản khác không có quyền sửa!', 'error');
      return;
    }
    if (!editingAccount) return;

    const targetOrg = organizations.find(o => o.code === editForm.orgCode);
    updateAccount(editingAccount.id, {
      fullName: editForm.fullName.trim(),
      email: editForm.email.trim(),
      roleLevel: editForm.roleLevel,
      orgCode: editForm.orgCode,
      orgName: targetOrg ? targetOrg.name : editForm.orgCode,
      classCode: editForm.roleLevel === 2 ? editForm.classCode : undefined,
      status: editForm.status,
    });

    setEditingAccount(null);
  };

  const handleToggleStatus = (acc: SystemUserAccount) => {
    if (!isLevel4) {
      showToast('Chỉ Cấp trường (Cấp 4) có quyền thay đổi trạng thái tài khoản!', 'error');
      return;
    }
    toggleAccountStatus(acc.id);
  };

  const getRoleBadge = (level: RoleLevel) => {
    switch (level) {
      case 4:
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 3:
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 2:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 1:
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const handleExportAccountExcel = () => {
    const data = filteredAccounts.map((acc, idx) => ({
      'STT': idx + 1,
      'Email Google SSO': acc.email,
      'Họ và Tên Cán Bộ': acc.fullName,
      'Cấp Độ Phân Quyền': `Cấp ${acc.roleLevel}`,
      'Tên Cấp Quyền': acc.roleLevel === 4 ? 'Cấp Trường (BTV Đoàn)' : acc.roleLevel === 3 ? 'Cấp Khoa / CLB Trường' : acc.roleLevel === 2 ? 'Cấp Chi Đoàn / CLB' : 'Cấp Sinh Viên',
      'Đơn Vị Quản Lý': acc.orgName || acc.orgCode || '-',
      'Mã Chi Đoàn': acc.classCode || '-',
      'Trạng Thái Tài Khoản': acc.status === 'Active' ? 'Kích Hoạt' : 'Tạm Khóa'
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 28 },
      { wch: 25 },
      { wch: 18 },
      { wch: 25 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSach_TaiKhoan');
    XLSX.writeFile(wb, `DanhSach_TaiKhoan_GoogleSSO_NLU_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Đã xuất danh sách tài khoản ra file Excel (.xlsx) thành công!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Informational Banner on Edit Permissions */}
      <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
        isLevel4
          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
          : 'bg-amber-50 border-amber-200 text-amber-900'
      }`}>
        <div className="flex items-center gap-2.5">
          <Shield className={`w-5 h-5 shrink-0 ${isLevel4 ? 'text-emerald-700' : 'text-amber-700'}`} />
          <div>
            <span className="font-bold block">
              {isLevel4
                ? 'Quyền hạn Quản trị viên Cấp 4 (Trường): Có toàn quyền chỉnh sửa và cấp mới tài khoản'
                : 'Chế độ xem tài khoản (Phân quyền bảo vệ): Cấp trường (Cấp 4) có quyền sửa tài khoản'}
            </span>
            <span className="text-[11px] opacity-90">
              {isLevel4
                ? 'Bạn đang đăng nhập bằng tài khoản Cấp Trường, có đầy đủ thẩm quyền thêm mới, sửa thông tin, đổi cấp bậc và phân bổ đơn vị cho mọi tài khoản.'
                : `Tài khoản hiện tại của bạn thuộc Cấp ${user.currentRole.roleLevel} (${user.currentRole.roleName}). Các cấp tài khoản khác không có quyền sửa tài khoản theo quy chế bảo mật.`}
            </span>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] shrink-0 border ${
          isLevel4
            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
            : 'bg-amber-100 text-amber-800 border-amber-300'
        }`}>
          {isLevel4 ? 'Toàn Quyền Sửa (Cấp 4)' : 'Chỉ Xem (Không có quyền sửa)'}
        </span>
      </div>

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Cấp Quyền Hệ Thống & Quản Lý Tài Khoản Google SSO {isLevel4 ? '(Cấp Trường)' : ''}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ủy quyền truy cập và phân cấp quản lý (Cấp 1 - Cấp 4) cho các email Google SSO (@gmail.com, @hcmuaf.edu.vn). Người dùng khi đăng nhập Google SSO sẽ tự động nhận diện và phân quyền theo danh sách này.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isLevel4 ? (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('activity-logs')}
                className="inline-flex items-center gap-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-xs font-bold px-3.5 py-2.5 rounded-xl shadow-xs transition"
                title="Xem toàn bộ lịch sử phân quyền và thay đổi tài khoản"
              >
                <History className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                Nhật Ký Phân Quyền
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
              >
                <UserPlus className="w-4 h-4" />
                Cấp Tài Khoản Mới
              </button>
              <button
                type="button"
                onClick={() => setShowBulkAccountModal(true)}
                className="inline-flex items-center gap-2 bg-emerald-900 hover:bg-emerald-950 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition border border-emerald-600"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                Cấp Tài Khoản Bằng Excel
              </button>
            </>
          ) : (
            <div className="text-[11px] text-slate-500 bg-slate-100 px-3 py-2 rounded-xl flex items-center gap-1.5 border border-slate-200">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Chức năng cấp và sửa tài khoản chỉ dành cho Cấp Trường (Cấp 4)
            </div>
          )}

          <button
            type="button"
            onClick={handleExportAccountExcel}
            className="inline-flex items-center gap-2 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
            title="Tải về danh sách tài khoản hệ thống ra file Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            Tải Danh Sách Excel (.xlsx)
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo email, tên cán bộ, tên đơn vị..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'Tất cả tài khoản' },
            { id: '4', label: 'Cấp 4 (Trường)' },
            { id: '3', label: 'Cấp 3 (Khoa)' },
            { id: '2', label: 'Cấp 2 (CLB/Chi đoàn)' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setRoleFilter(f.id)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                roleFilter === f.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Họ Tên & Email Đăng Nhập</th>
                <th className="px-4 py-3">Cấp Quyền Hệ Thống</th>
                <th className="px-4 py-3">Đơn Vị Quản Lý</th>
                <th className="px-4 py-3">Ngày Cấp</th>
                <th className="px-4 py-3 text-center">Trạng Thái</th>
                <th className="px-4 py-3 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredAccounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-900 block">{acc.fullName}</span>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {acc.email}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadge(
                        acc.roleLevel
                      )}`}
                    >
                      {acc.roleLevel === 4
                        ? 'Cấp 4: Quản Trị Trường'
                        : acc.roleLevel === 3
                        ? 'Cấp 3: Đoàn Khoa'
                        : acc.roleLevel === 2
                        ? 'Cấp 2: CLB / Chi đoàn'
                        : 'Cấp 1: Sinh viên'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800 block">{acc.orgName}</span>
                    {acc.classCode && (
                      <span className="text-[10px] text-emerald-700 font-mono">Lớp: {acc.classCode}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{acc.createdAt}</td>

                  <td className="px-4 py-3 text-center">
                    {isLevel4 ? (
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(acc)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          acc.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                        }`}
                      >
                        {acc.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {acc.status === 'Active' ? 'Đang kích hoạt' : 'Tạm khóa'}
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          acc.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        {acc.status === 'Active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {acc.status === 'Active' ? 'Đang kích hoạt' : 'Tạm khóa'}
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {isLevel4 ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(acc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 rounded-lg text-xs font-bold transition border border-sky-200 shadow-2xs"
                          title="Cấp trường (cấp 4) có quyền sửa tài khoản"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-sky-600" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(acc)}
                          className={`text-xs font-semibold px-2 py-1 rounded-md transition ${
                            acc.status === 'Active'
                              ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50'
                              : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
                          }`}
                        >
                          {acc.status === 'Active' ? 'Khóa' : 'Mở'}
                        </button>
                        {acc.email.toLowerCase() !== 'conghau.nlu@gmail.com' && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Bạn có chắc chắn muốn thu hồi quyền truy cập của tài khoản [${acc.email}] không?`)) {
                                deleteAccount(acc.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                            title="Thu hồi quyền truy cập"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-end">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-400 rounded-lg text-[11px] font-medium border border-slate-200"
                          title="Cấp trường (cấp 4) có quyền sửa tài khoản. Các cấp tài khoản khác không có quyền sửa."
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          Không có quyền sửa
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-emerald-800 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-300" />
                Khởi Tạo & Cấp Quyền Tài Khoản
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-emerald-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Email Google Đăng Nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Vd: bch.cntt@hcmuaf.edu.vn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ và Tên Cán Bộ / Tên Ban Chấp Hành <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: BCH Đoàn Khoa Công nghệ Thông tin"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Cấp Quyền Truy Cập</label>
                <select
                  value={roleLevel}
                  onChange={e => setRoleLevel(parseInt(e.target.value) as RoleLevel)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value={3}>Cấp 3: Đoàn Khoa / LCH Sinh viên Khoa (Phê duyệt cấp Khoa)</option>
                  <option value={2}>Cấp 2: Chi đoàn / CLB / Đội / Nhóm (Tạo hoạt động cơ sở)</option>
                  <option value={4}>Cấp 4: Đoàn Trường / HSV Trường (Super Admin)</option>
                  <option value={1}>Cấp 1: Sinh viên / Đoàn viên cá nhân</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Đơn vị trực thuộc</label>
                <select
                  value={orgCode}
                  onChange={e => setOrgCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {organizations.map(org => (
                    <option key={org.code} value={org.code}>
                      [{org.code}] {org.name} ({org.hostLevelName})
                    </option>
                  ))}
                </select>
              </div>

              {roleLevel === 2 && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Chi đoàn (Nếu là tài khoản Bí thư Chi đoàn)
                  </label>
                  <select
                    value={classCode}
                    onChange={e => setClassCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  >
                    <option value="">Không thuộc chi đoàn cụ thể (Tài khoản CLB)</option>
                    {branchClasses.map(cls => (
                      <option key={cls.code} value={cls.code}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm"
                >
                  Cấp Tài Khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Tài Khoản (Chỉ Cấp 4 có quyền sửa) */}
      {isLevel4 && editingAccount && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Chỉnh Sửa Tài Khoản [{editingAccount.email}]
              </h3>
              <button
                onClick={() => setEditingAccount(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Email Google Đăng Nhập <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Họ và Tên Cán Bộ / Ban Chấp Hành <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={e => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">Cấp Quyền Hệ Thống</label>
                  <select
                    value={editForm.roleLevel}
                    onChange={e => setEditForm(prev => ({ ...prev, roleLevel: parseInt(e.target.value) as RoleLevel }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value={4}>Cấp 4: Quản Trị Trường</option>
                    <option value={3}>Cấp 3: Đoàn Khoa</option>
                    <option value={2}>Cấp 2: CLB / Chi đoàn</option>
                    <option value={1}>Cấp 1: Sinh viên</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Trạng Thái Tài Khoản</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value as 'Active' | 'Inactive' }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="Active">Đang kích hoạt</option>
                    <option value="Inactive">Tạm khóa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Đơn Vị Quản Lý / Trực Thuộc</label>
                <select
                  value={editForm.orgCode}
                  onChange={e => setEditForm(prev => ({ ...prev, orgCode: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {organizations.map(org => (
                    <option key={org.code} value={org.code}>
                      [{org.code}] {org.name} ({org.hostLevelName})
                    </option>
                  ))}
                </select>
              </div>

              {editForm.roleLevel === 2 && (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Chi đoàn (Nếu là tài khoản Chi đoàn)
                  </label>
                  <select
                    value={editForm.classCode}
                    onChange={e => setEditForm(prev => ({ ...prev, classCode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-emerald-500 font-mono"
                  >
                    <option value="">Không thuộc chi đoàn cụ thể (Tài khoản CLB)</option>
                    {branchClasses.map(cls => (
                      <option key={cls.code} value={cls.code}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingAccount(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg shadow-sm"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cấp Tài Khoản Hàng Loạt Bằng Excel */}
      <BulkAccountImportModal
        isOpen={showBulkAccountModal}
        onClose={() => setShowBulkAccountModal(false)}
      />
    </div>
  );
};

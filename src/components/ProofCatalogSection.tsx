import React, { useState, useMemo } from 'react';
import { ScoringCatalogItem, SelfProofCategoryType } from '../types';
import {
  Award,
  BookOpen,
  Briefcase,
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  XCircle,
  RotateCcw,
  Info,
  Shield,
  Star,
  X,
  Sparkles
} from 'lucide-react';

interface ProofCatalogSectionProps {
  catalogName: string;
  category: SelfProofCategoryType;
  iconType: 'award' | 'research' | 'position' | 'party';
  items: ScoringCatalogItem[];
  onUpdate: (next: ScoringCatalogItem[]) => void;
  onReset: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ProofCatalogSection: React.FC<ProofCatalogSectionProps> = ({
  catalogName,
  category,
  iconType,
  items,
  onUpdate,
  onReset,
  showToast
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<ScoringCatalogItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ScoringCatalogItem>>({
    code: '',
    title: '',
    points: 10,
    category,
    level: '',
    description: '',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  });

  const getIcon = () => {
    switch (iconType) {
      case 'award':
        return <Award className="w-5 h-5 text-amber-500" />;
      case 'research':
        return <BookOpen className="w-5 h-5 text-purple-500" />;
      case 'position':
        return <Briefcase className="w-5 h-5 text-blue-500" />;
      case 'party':
        return <Users className="w-5 h-5 text-rose-500" />;
      default:
        return <Award className="w-5 h-5 text-emerald-500" />;
    }
  };

  const filteredItems = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return items;
    return items.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        (item.level && item.level.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [items, searchQuery]);

  const handleToggleActive = (id: string) => {
    const next = items.map(it => (it.id === id ? { ...it, active: !it.active } : it));
    onUpdate(next);
    showToast('Đã cập nhật trạng thái áp dụng!', 'info');
  };

  const handleDeleteItem = (id: string, title: string) => {
    if (!window.confirm(`Xóa hạng mục quy chuẩn '${title}' khỏi danh mục?`)) return;
    const next = items.filter(it => it.id !== id);
    onUpdate(next);
    showToast(`Đã xóa hạng mục ${title}!`, 'success');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editingItem.title.trim()) {
      alert('Vui lòng nhập tên hạng mục!');
      return;
    }
    const next = items.map(it => (it.id === editingItem.id ? editingItem : it));
    onUpdate(next);
    setEditingItem(null);
    showToast('Đã lưu thay đổi hạng mục quy chuẩn!', 'success');
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title?.trim()) {
      alert('Vui lòng nhập tên tiêu chí / hạng mục!');
      return;
    }
    const generatedId = `${category}_${Date.now()}`;
    const code = (newItem.code || generatedId).trim().toUpperCase();

    if (items.some(it => it.code.toUpperCase() === code)) {
      alert(`Mã định danh '${code}' đã tồn tại trong danh mục!`);
      return;
    }

    const created: ScoringCatalogItem = {
      id: generatedId,
      code,
      title: newItem.title.trim(),
      points: Number(newItem.points) || 5,
      category,
      level: newItem.level?.trim() || 'Cấp Trường',
      description: newItem.description?.trim() || '',
      maxCapNote: newItem.maxCapNote?.trim() || 'Chỉ tính 01 mức điểm cao nhất trong năm học',
      active: newItem.active !== false
    };

    onUpdate([...items, created]);
    setShowAddModal(false);
    setNewItem({
      code: '',
      title: '',
      points: 10,
      category,
      level: '',
      description: '',
      maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
      active: true
    });
    showToast(`Đã bổ sung hạng mục '${created.title}' vào danh mục!`, 'success');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header & Description */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base flex items-center gap-2">
                {catalogName}
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                  {items.length} hạng mục
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Cấp 4 cấu hình khung điểm chuẩn cho cán bộ & sinh viên khai báo minh chứng trên cổng cá nhân.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            title="Khôi phục danh mục về quy chuẩn ban đầu"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục mặc định</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs rounded-xl shadow-md shadow-emerald-700/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Hạng Mục Quy Chuẩn</span>
          </button>
        </div>
      </div>

      {/* Ràng buộc quy chế Highlight Banner */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 dark:from-emerald-950/40 dark:via-teal-950/40 dark:to-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
        <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-emerald-950 dark:text-emerald-200">
          <p className="font-extrabold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            RÀNG BUỘC QUY CHẾ TÍNH ĐIỂM ĐOÀN - HỘI NLU:
          </p>
          <p className="leading-relaxed">
            Sinh viên được phép nộp <strong>nhiều minh chứng</strong> ở các cấp độ khác nhau để lưu trữ toàn diện hồ sơ thành tích.
            Tuy nhiên, hệ thống tự động áp dụng ràng buộc: <strong>CHỈ TÍNH DUY NHẤT 01 MỨC ĐIỂM CAO NHẤT</strong> trong danh mục này vào Điểm Rèn Luyện chính thức (không cộng dồn tràn lan).
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên hạng mục, mã, cấp bậc..."
            className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Hiển thị <strong>{filteredItems.length}</strong> / {items.length} hạng mục
        </span>
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 gap-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500">
            Không tìm thấy hạng mục nào phù hợp với từ khóa '{searchQuery}'.
          </div>
        ) : (
          filteredItems.map((item, idx) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border transition-all ${
                item.active
                  ? 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-750 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                        {item.code}
                      </span>
                      {item.level && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {item.level}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.active
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {item.active ? 'Đang áp dụng' : 'Tạm tắt'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    )}

                    {item.maxCapNote && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-1 font-semibold">
                        <Info className="w-3 h-3" />
                        {item.maxCapNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Points Badge & Actions */}
                <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80">
                    <span className="block text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400">
                      Điểm chuẩn
                    </span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
                      +{item.points} đ
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id)}
                      className={`p-2 rounded-lg transition cursor-pointer ${
                        item.active
                          ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50'
                          : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={item.active ? 'Tạm tắt hạng mục' : 'Kích hoạt hạng mục'}
                    >
                      {item.active ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition cursor-pointer"
                      title="Chỉnh sửa điểm chuẩn & thông tin"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id, item.title)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                      title="Xóa khỏi danh mục"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-emerald-600" />
                Chỉnh Sửa Hạng Mục Quy Chuẩn [{editingItem.code}]
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên tiêu chí / Hạng mục khen thưởng / Chức vụ *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mức điểm chuẩn (+ĐRL) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={editingItem.points}
                    onChange={e => setEditingItem({ ...editingItem, points: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cấp bậc áp dụng
                  </label>
                  <input
                    type="text"
                    value={editingItem.level || ''}
                    onChange={e => setEditingItem({ ...editingItem, level: e.target.value })}
                    placeholder="Vd: Cấp Trường, Cấp Khoa, Cấp Bộ..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết / Căn cứ quyết định
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Mô tả tiêu chuẩn xét tặng hoặc phạm vi công nhận..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Ghi chú ràng buộc quy chế
                </label>
                <input
                  type="text"
                  value={editingItem.maxCapNote || ''}
                  onChange={e => setEditingItem({ ...editingItem, maxCapNote: e.target.value })}
                  placeholder="Vd: Chỉ tính 01 mức điểm cao nhất trong năm học..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-item-active"
                  checked={editingItem.active}
                  onChange={e => setEditingItem({ ...editingItem, active: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="edit-item-active" className="font-bold text-slate-700 dark:text-slate-300">
                  Kích hoạt áp dụng cho sinh viên tự khai báo
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                Thêm Hạng Mục Quy Chuẩn Cấp 4 ({catalogName})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã định danh *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Vd: AW_MOI_1"
                    value={newItem.code || ''}
                    onChange={e => setNewItem({ ...newItem, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cấp bậc áp dụng
                  </label>
                  <input
                    type="text"
                    placeholder="Vd: Cấp Trường, Cấp Khoa, Cấp Bộ..."
                    value={newItem.level || ''}
                    onChange={e => setNewItem({ ...newItem, level: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên tiêu chí / Hạng mục quy chuẩn *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Bằng khen UBND Tỉnh/Thành phố..."
                  value={newItem.title || ''}
                  onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mức điểm chuẩn (+ĐRL) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newItem.points}
                    onChange={e => setNewItem({ ...newItem, points: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-black text-sm text-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quy tắc tính điểm
                  </label>
                  <input
                    type="text"
                    value={newItem.maxCapNote || ''}
                    onChange={e => setNewItem({ ...newItem, maxCapNote: e.target.value })}
                    placeholder="Chỉ tính 01 mức điểm cao nhất..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Mô tả chi tiết nội dung
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả cụ thể về điều kiện đạt được..."
                  value={newItem.description || ''}
                  onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Tạo Hạng Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

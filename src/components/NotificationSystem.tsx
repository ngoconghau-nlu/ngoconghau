import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SystemNotification, NotificationPriority, NotificationType, StudentPushNotification } from '../types';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Calendar,
  Award,
  FileText,
  X,
  Sparkles,
  ChevronRight,
  Send,
  CheckCheck,
  Trash2,
  ExternalLink,
  Volume2,
  Radio,
  Zap,
  Check
} from 'lucide-react';

export const NotificationSystem: React.FC = () => {
  const {
    user,
    activities,
    selfProofs,
    setActiveTab,
    showToast,
    studentPushNotifications,
    sendStudentPushNotification,
    markPushNotificationAsRead,
    markAllPushNotificationsAsRead,
    clearPushNotifications,
    requestNotificationPermission
  } = useApp();

  const currentLevel = user.currentRole.roleLevel;
  const currentOrgCode = user.currentRole.orgCode;
  const currentClassCode = user.currentRole.classCode;
  const isGuest = currentLevel === 0;

  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [webPushStatus, setWebPushStatus] = useState<NotificationPermission | 'unsupported'>('default');

  // Track last role to trigger welcoming/alert toast on role change
  const lastRoleRef = useRef<string | null>(null);

  // Sync browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setWebPushStatus(Notification.permission);
    } else {
      setWebPushStatus('unsupported');
    }
  }, [isOpen]);

  // Current student push notifications (filtered for user or all if officer)
  const relevantPushNotifs = useMemo(() => {
    if (currentLevel >= 3) {
      return studentPushNotifications;
    }
    const myMssv = user.studentId || '22130001';
    return studentPushNotifications.filter(n => n.studentId === myMssv);
  }, [studentPushNotifications, currentLevel, user.studentId]);

  const unreadPushCount = relevantPushNotifs.filter(n => !n.isRead).length;

  // Generate dynamic, real-time notifications based on current system state and role
  const generatedNotifications: SystemNotification[] = useMemo(() => {
    const list: SystemNotification[] = [];
    const now = new Date();
    const nowMs = now.getTime();

    // 1. CẢNH BÁO ĐẾN HẠN NỘP MINH CHỨNG ĐIỂM RÈN LUYỆN
    if (currentLevel === 1) {
      list.push({
        id: 'notif_proof_deadline_student',
        type: 'deadline',
        title: 'Hạn chót nộp minh chứng Điểm rèn luyện Đợt 1',
        message: 'Hạn chót nộp hồ sơ minh chứng ĐRL học kỳ 1 (Năm học 2026-2027) là 23:59 ngày 15/11/2026. Sinh viên cần sớm nộp minh chứng NCKH, Chức vụ và Khen thưởng lên Google Drive.',
        timestamp: 'Còn 5 ngày nữa',
        priority: 'urgent',
        targetTab: 'student-portal',
        actionText: 'Nộp Minh Chứng Ngay'
      });

      const approvedProofs = selfProofs.filter(p => p.studentId === user.studentId && p.status === 'Approved');
      if (approvedProofs.length > 0) {
        list.push({
          id: 'notif_proof_approved_student',
          type: 'proof',
          title: 'Minh chứng ĐRL đã được phê duyệt',
          message: `Bạn có ${approvedProofs.length} minh chứng rèn luyện đã được Đoàn - Hội duyệt và cộng điểm vào sổ điểm chính thức.`,
          timestamp: 'Vừa cập nhật',
          priority: 'info',
          targetTab: 'student-portal',
          actionText: 'Xem Sổ ĐRL Cá Nhân'
        });
      }
    }

    // Đối với Cán bộ Cấp 2, Cấp 3, Cấp 4:
    if (currentLevel >= 2) {
      const pendingProofs = selfProofs.filter(p => p.status === 'Pending');
      if (pendingProofs.length > 0) {
        list.push({
          id: 'notif_pending_proofs_officer',
          type: 'proof',
          title: 'Hồ sơ minh chứng ĐRL sinh viên đang chờ thẩm định',
          message: `Hiện có ${pendingProofs.length} hồ sơ minh chứng ĐRL (khen thưởng, NCKH, cán bộ) sinh viên đã nộp và đang chờ Ban Chấp hành kiểm tra phê duyệt trước thời hạn tổng kết.`,
          timestamp: 'Cần xử lý',
          priority: 'warning',
          targetTab: 'score-roster',
          actionText: 'Duyệt Minh Chứng'
        });
      }

      list.push({
        id: 'notif_proof_timeline_officer',
        type: 'deadline',
        title: 'Thời hạn hoàn tất rà soát & khóa sổ Điểm rèn luyện',
        message: 'Theo kế hoạch năm học 2026-2027, hạn cuối để các Chi đoàn và Đoàn Khoa hoàn tất đánh giá 4 mức chuẩn đoàn viên và xếp loại rèn luyện là ngày 20/11/2026.',
        timestamp: 'Quy chế năm học',
        priority: 'urgent',
        targetTab: 'score-roster',
        actionText: 'Xem Sổ Điểm'
      });
    }

    // 2. CẢNH BÁO KẾ HOẠCH HOẠT ĐỘNG MỚI
    if (currentLevel >= 3) {
      const pendingActivities = activities.filter(
        a => a.status === 'Pending_L3' || a.status === 'Pending_L4'
      );
      if (pendingActivities.length > 0) {
        list.push({
          id: 'notif_new_activity_plan',
          type: 'activity',
          title: 'Kế hoạch hoạt động mới đang chờ phê duyệt',
          message: `Có ${pendingActivities.length} chương trình hoạt động mới được gửi lên hệ thống. Vui lòng thẩm định nội dung, văn bản trình ký và duyệt điểm phân cấp.`,
          timestamp: 'Mới gửi',
          priority: 'urgent',
          targetTab: 'activities',
          actionText: 'Thẩm Định Kế Hoạch'
        });
      }
    }

    // Thông báo hoạt động mới được phê duyệt cho các đơn vị
    const approvedActivities = activities.filter(a => a.status === 'Approved');
    if (approvedActivities.length > 0) {
      const latestApproved = approvedActivities[0];
      list.push({
        id: `notif_act_approved_${latestApproved.id}`,
        type: 'activity',
        title: `Hoạt động #${latestApproved.id} đã được phê duyệt`,
        message: `Chương trình "${latestApproved.title}" (${latestApproved.orgName}) đã hoàn tất quy trình phê duyệt Cấp L4 và sẵn sàng tổ chức.`,
        timestamp: latestApproved.startDate,
        priority: 'info',
        targetTab: 'activities',
        targetId: latestApproved.id,
        actionText: 'Xem Kế Hoạch'
      });
    }

    // 3. CẢNH BÁO QUÁ HẠN NỘP DANH SÁCH HOẠT ĐỘNG (1-Week Overdue Deadline)
    approvedActivities.forEach(act => {
      const startMs = new Date(act.startDate).getTime();
      const daysPassed = Math.floor((nowMs - startMs) / (1000 * 60 * 60 * 24));
      const isFinished = nowMs >= startMs;
      const isRosterMissing = !act.participants || act.participants.length === 0;

      if (isFinished && isRosterMissing && daysPassed > 7) {
        const isMyScope =
          currentLevel === 4 ||
          (currentLevel === 3 && (act.orgCode === currentOrgCode || act.branchClass?.startsWith(currentOrgCode || ''))) ||
          (currentLevel === 2 && act.branchClass === currentClassCode);

        if (isMyScope) {
          list.push({
            id: `notif_overdue_${act.id}`,
            type: 'overdue',
            title: `Quá hạn nộp danh sách: Hoạt động #${act.id}`,
            message: `Hoạt động "${act.title}" đã kết thúc quá ${daysPassed} ngày (> 7 ngày theo quy định) nhưng đơn vị tổ chức chưa nạp danh sách sinh viên tham gia chính thức để cấp điểm rèn luyện!`,
            timestamp: `Quá hạn ${daysPassed - 7} ngày`,
            priority: 'urgent',
            targetTab: 'activities',
            targetId: act.id,
            actionText: 'Nạp File Excel Ngay'
          });
        }
      }
    });

    return list;
  }, [currentLevel, currentOrgCode, currentClassCode, activities, selfProofs, user.studentId]);

  // Filter out dismissed notifications
  const activeNotifications = useMemo(() => {
    return generatedNotifications.filter(n => !dismissedIds.has(n.id));
  }, [generatedNotifications, dismissedIds]);

  // Visible notifications after category tab filter
  const filteredNotifications = useMemo(() => {
    if (filterType === 'ALL') return activeNotifications;
    return activeNotifications.filter(n => {
      if (filterType === 'deadline') return n.type === 'deadline' || n.type === 'proof';
      if (filterType === 'activity') return n.type === 'activity';
      if (filterType === 'overdue') return n.type === 'overdue';
      return true;
    });
  }, [activeNotifications, filterType]);

  const unreadSysCount = activeNotifications.filter(n => !readIds.has(n.id)).length;
  const totalUnreadCount = unreadSysCount + unreadPushCount;
  const urgentCount = activeNotifications.filter(n => n.priority === 'urgent' && !readIds.has(n.id)).length;

  // Auto alert via Toast on role change or on first mount if there are urgent notifications
  useEffect(() => {
    const currentRoleId = user.currentRole.roleId;
    if (lastRoleRef.current !== currentRoleId && activeNotifications.length > 0) {
      lastRoleRef.current = currentRoleId;

      const topUrgent = activeNotifications.find(n => n.priority === 'urgent') || activeNotifications[0];
      if (topUrgent) {
        showToast(
          topUrgent.message,
          topUrgent.priority === 'urgent' ? 'error' : 'info',
          {
            title: `🔔 ${topUrgent.title}`,
            actionLabel: topUrgent.actionText || 'Xem ngay',
            onAction: () => {
              if (topUrgent.targetTab) setActiveTab(topUrgent.targetTab);
            },
            durationMs: 5000
          }
        );
      }
    }
  }, [user.currentRole.roleId, activeNotifications, showToast, setActiveTab]);

  // Handle Mark All Read
  const handleMarkAllRead = () => {
    const allIds = new Set(readIds);
    activeNotifications.forEach(n => allIds.add(n.id));
    setReadIds(allIds);
    markAllPushNotificationsAsRead();
    showToast('Đã đánh dấu tất cả thông báo là đã đọc', 'info');
  };

  // Handle Dismiss
  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds(prev => new Set(prev).add(id));
  };

  // Trigger Toast Notification for a specific alert
  const handleTriggerToast = (n: SystemNotification, e: React.MouseEvent) => {
    e.stopPropagation();
    showToast(
      n.message,
      n.priority === 'urgent' ? 'error' : n.priority === 'warning' ? 'info' : 'success',
      {
        title: `🔔 ${n.title}`,
        actionLabel: n.actionText || 'Mở liên kết',
        onAction: () => {
          if (n.targetTab) setActiveTab(n.targetTab);
          setIsOpen(false);
        },
        durationMs: 5000
      }
    );
    setReadIds(prev => new Set(prev).add(n.id));
  };

  // Trigger Test Push Notification
  const handleTestPushNotification = (type: 'activity' | 'score') => {
    const stdId = user.studentId || '22130001';
    if (type === 'activity') {
      sendStudentPushNotification(stdId, {
        type: 'activity_approved',
        title: '🎉 [Test Push] Hoạt Động Được Duyệt',
        message: 'Hoạt động "Chiến dịch Tình nguyện Mùa Hè Xanh NLU 2026" vừa được Đoàn trường phê duyệt! Điểm rèn luyện dự kiến: +10đ.',
        activityId: 'A001',
        activityTitle: 'Chiến dịch Mùa Hè Xanh NLU 2026',
        scoreDiff: 10,
        linkTab: 'student-portal'
      });
    } else {
      sendStudentPushNotification(stdId, {
        type: 'score_updated',
        title: '📈 [Test Push] Điểm Rèn Luyện Cập Nhật',
        message: 'Điểm rèn luyện của bạn vừa được cập nhật: Tổng 88/100đ (+5đ điểm thưởng) • Xếp loại: Hoàn thành xuất sắc nhiệm vụ.',
        scoreDiff: 5,
        linkTab: 'student-portal'
      });
    }
  };

  const handleEnableWebPush = async () => {
    const res = await requestNotificationPermission();
    setWebPushStatus(res);
  };

  const handleItemClick = (n: SystemNotification) => {
    setReadIds(prev => new Set(prev).add(n.id));
    if (n.targetTab) {
      setActiveTab(n.targetTab);
      setIsOpen(false);
    }
  };

  const handlePushItemClick = (item: StudentPushNotification) => {
    markPushNotificationAsRead(item.id);
    if (item.linkTab) {
      setActiveTab(item.linkTab);
      setIsOpen(false);
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'warning':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'info':
      default:
        return 'bg-sky-100 text-sky-800 border-sky-300';
    }
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-rose-600" />;
      case 'activity':
        return <Calendar className="w-4 h-4 text-emerald-600" />;
      case 'proof':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  const getPushTypeBadge = (type: StudentPushNotification['type']) => {
    switch (type) {
      case 'activity_approved':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">Hoạt Động Duyệt</span>;
      case 'score_updated':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-100 text-indigo-800 border border-indigo-300">Cập Nhật ĐRL</span>;
      case 'proof_approved':
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-300">Minh Chứng Duyệt</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-slate-100 text-slate-800 border border-slate-300">Hệ Thống</span>;
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Hệ thống thông báo đẩy & Cảnh báo thời hạn NLU"
        className="relative p-2 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
      >
        <Bell className="w-5 h-5" />

        {/* Counter Badge */}
        {totalUnreadCount > 0 && (
          <span
            className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-white shadow-xs ${
              urgentCount > 0 ? 'bg-rose-600 animate-pulse' : 'bg-emerald-600'
            }`}
          >
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-2xs"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="absolute right-0 mt-2 w-96 sm:w-[460px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                    <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm leading-none flex items-center gap-1.5">
                      Thông Báo Đẩy NLU
                      <span className="px-1.5 py-0.2 rounded-sm bg-emerald-400/20 text-emerald-200 text-[9px] font-mono border border-emerald-400/30">
                        PUSH 2026
                      </span>
                    </h3>
                    <p className="text-[10px] text-emerald-200 mt-1">
                      Thông báo đẩy tức thời khi hoạt động được duyệt & ĐRL cập nhật
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {totalUnreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] shadow-xs">
                      {totalUnreadCount} mới
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Web Push Status Bar */}
              <div className="mt-3 pt-2.5 border-t border-white/15 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px]">
                  {webPushStatus === 'granted' ? (
                    <span className="inline-flex items-center gap-1 text-emerald-200 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-400/30">
                      <Check className="w-3 h-3 text-emerald-300" /> Web Push: Đã Bật
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleEnableWebPush}
                      className="inline-flex items-center gap-1 text-amber-200 font-bold bg-amber-950/40 hover:bg-amber-900/60 px-2 py-0.5 rounded-lg border border-amber-400/40 transition"
                    >
                      <Zap className="w-3 h-3 text-amber-300 animate-bounce" /> Bật Web Push Trình Duyệt
                    </button>
                  )}
                </div>

                {/* Quick Test Trigger Buttons */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleTestPushNotification('activity')}
                    title="Gửi thử nghiệm thông báo đẩy Hoạt động được duyệt"
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold rounded-lg transition"
                  >
                    <Volume2 className="w-3 h-3 text-amber-300" />
                    Thử Push HĐ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTestPushNotification('score')}
                    title="Gửi thử nghiệm thông báo đẩy Điểm rèn luyện cập nhật"
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold rounded-lg transition"
                  >
                    <Sparkles className="w-3 h-3 text-cyan-300" />
                    Thử Push Điểm
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Categories Tabs */}
            <div className="px-3 pt-2.5 pb-1 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'push', label: `🔔 Push Sinh Viên (${relevantPushNotifs.length})` },
                { id: 'deadline', label: 'Hạn chót ĐRL' },
                { id: 'activity', label: 'Kế hoạch mới' },
                { id: 'overdue', label: 'Quá hạn 7 ngày' },
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition ${
                    filterType === tab.id
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Notification List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {/* Push Notifications Section */}
              {(filterType === 'ALL' || filterType === 'push') && relevantPushNotifs.length > 0 && (
                <div className="space-y-1 pb-1">
                  {filterType === 'ALL' && (
                    <div className="px-2 py-1 text-[10px] font-black uppercase text-emerald-800 tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Radio className="w-3 h-3 text-emerald-600" /> Thông Báo Đẩy Tức Thời (Push)
                      </span>
                      <span className="text-slate-400 font-normal">{relevantPushNotifs.length} thông báo</span>
                    </div>
                  )}

                  {relevantPushNotifs.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handlePushItemClick(item)}
                      className={`p-3 rounded-xl cursor-pointer transition-all border ${
                        item.isRead
                          ? 'bg-white border-transparent hover:bg-slate-50 text-slate-600'
                          : 'bg-gradient-to-r from-emerald-50/70 to-teal-50/40 border-emerald-200 hover:bg-emerald-50 text-slate-900 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                          {item.type === 'activity_approved' ? (
                            <Calendar className="w-4 h-4 text-emerald-700" />
                          ) : item.type === 'score_updated' ? (
                            <Award className="w-4 h-4 text-indigo-700" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-700" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              {getPushTypeBadge(item.type)}
                              {item.scoreDiff !== undefined && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-black font-mono ${
                                  item.scoreDiff >= 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}>
                                  {item.scoreDiff >= 0 ? `+${item.scoreDiff}đ` : `${item.scoreDiff}đ`}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {item.createdAt.slice(5, 16)}
                            </span>
                          </div>

                          <h4 className={`text-xs font-bold ${item.isRead ? 'text-slate-800' : 'text-slate-950 font-black'}`}>
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                            {item.message}
                          </p>

                          {/* Push Item Action */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                            <span className="text-[11px] text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5">
                              {item.type === 'activity_approved' ? 'Xem Kế Hoạch Hoạt Động' : 'Xem Sổ Điểm Rèn Luyện'} <ChevronRight className="w-3 h-3" />
                            </span>

                            <span className="text-[10px] font-medium text-slate-400">
                              {item.studentName ? `MSSV: ${item.studentId}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* System Notifications Section */}
              {filterType !== 'push' && filteredNotifications.length > 0 && (
                <div className="space-y-1">
                  {filterType === 'ALL' && (
                    <div className="px-2 pt-2 pb-1 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Cảnh Báo Hệ Thống & Hạn Chót
                    </div>
                  )}

                  {filteredNotifications.map(item => {
                    const isRead = readIds.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className={`p-3 rounded-xl cursor-pointer transition-all border ${
                          isRead
                            ? 'bg-white border-transparent hover:bg-slate-50 text-slate-600'
                            : 'bg-emerald-50/40 border-emerald-100 hover:bg-emerald-50/70 text-slate-900 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                            {getIconForType(item.type)}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-sm border ${getPriorityBadge(
                                  item.priority
                                )}`}
                              >
                                {item.priority === 'urgent'
                                  ? 'Khẩn cấp'
                                  : item.priority === 'warning'
                                  ? 'Cảnh báo'
                                  : 'Thông tin'}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3" />
                                {item.timestamp}
                              </span>
                            </div>

                            <h4 className={`text-xs font-bold ${isRead ? 'text-slate-800' : 'text-slate-950 font-black'}`}>
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                              {item.message}
                            </p>

                            {/* Action Bar */}
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-1.5">
                                {item.actionText && (
                                  <span className="text-[11px] text-emerald-700 font-bold hover:underline inline-flex items-center gap-0.5">
                                    {item.actionText} <ChevronRight className="w-3 h-3" />
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleTriggerToast(item, e)}
                                  title="Bật thông báo Toast trên màn hình"
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 transition"
                                >
                                  Toast
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDismiss(item.id, e)}
                                  title="Ẩn thông báo này"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {filteredNotifications.length === 0 && (filterType !== 'push' || relevantPushNotifs.length === 0) && (
                <div className="py-12 text-center text-slate-400">
                  <CheckCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                  <p className="text-xs font-semibold text-slate-600">Không có thông báo mới nào</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Tất cả thông báo đẩy và kế hoạch đã được xử lý đầy đủ!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium truncate max-w-[200px]">
                {user.fullName} ({user.currentRole.roleName})
              </span>
              <div className="flex items-center gap-2">
                {relevantPushNotifs.length > 0 && filterType === 'push' && (
                  <button
                    type="button"
                    onClick={() => clearPushNotifications(currentLevel === 1 ? user.studentId : undefined)}
                    className="text-slate-400 hover:text-rose-600 transition inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Xóa tất cả
                  </button>
                )}
                {(activeNotifications.length > 0 || unreadPushCount > 0) && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Đọc tất cả
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

import * as XLSX from 'xlsx';
import {
  ActivitySubmission,
  Organization,
  BranchClass,
  HostLevel,
  PlanYearOption,
  ActivityStatus
} from '../types';
import {
  TARGET_SCALE_CONFIG,
  HOST_LEVEL_POINTS,
  calculateProgramLevelScore,
  generateActivityCode,
  DRL_CRITERIA,
  SV5T_STANDARDS,
  HOI_PROGRAMS,
  DOAN_PROGRAMS,
  CURRENT_ACADEMIC_YEAR
} from '../data/mockData';

// 15 Standard Registration Items (C.1 - C.15) Headers & Keys
export interface ParsedActivity15Row {
  index: number;
  // 15 Items
  title: string; // 1. Tên chương trình
  orgCode: string; // 2. Mã đơn vị tổ chức
  orgName: string;
  branchClass: string; // 3. Mã Chi đoàn tổ chức
  scaleId: number; // 4. Quy mô đối tượng (1-6)
  scaleName: string;
  scalePoints: number;
  startDate: string; // 5. Ngày bắt đầu
  endDate: string; // 5. Ngày kết thúc
  managerName: string; // 6. Họ tên người phụ trách
  managerStudentId: string; // 6. MSSV người phụ trách
  signedDocUrl: string; // 7. Link VB trình ký (Drive)
  proofArticleUrl: string; // 8. Link bài viết minh chứng
  needsCertificate: boolean; // 9. Nhu cầu cấp GCN (Có/Không)
  planYearOption: PlanYearOption; // 10. Thuộc kế hoạch năm
  drlCriteriaId: string; // 11. Mã tiêu chí ĐRL
  drlCriteriaText: string;
  sv5tCriteriaId: string; // 12. Mã tiêu chí SV5T
  sv5tCriteriaText: string;
  hoiProgramId: string; // 13. Mã mảng CT Hội
  hoiProgramText: string;
  doanProgramId: string; // 14. Mã mảng CT Đoàn
  doanProgramText: string;
  dataCommitment: boolean; // 15. Cam kết tính chính xác dữ liệu

  // Calculated fields
  hostLevel: HostLevel;
  hostLevelId: number;
  hostLevelName: string;
  hostLevelPoints: number;
  totalLevelScore: number;
  programLevel: number;
  semester: 'HK1' | 'HK2' | 'HK_HE';
  activityType: 'DOAN' | 'HOI' | 'DOAN_HOI';

  // Validation
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Tải file biểu mẫu Excel chuẩn 15 mục đăng ký hoạt động (.xlsx)
 * Dành cho tài khoản Cấp 4 và các đơn vị nạp hàng loạt
 */
export function downloadActivity15BlankTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Mẫu đăng ký 15 mục
  const headers = [
    'Mục 1: Tên chương trình (*)',
    'Mục 2: Mã đơn vị tổ chức (*)',
    'Mục 3: Mã Chi đoàn tổ chức (nếu có)',
    'Mục 4: Quy mô đối tượng (1-6) (*)',
    'Mục 5: Ngày bắt đầu (YYYY-MM-DD) (*)',
    'Mục 5: Ngày kết thúc (YYYY-MM-DD)',
    'Mục 6: Họ tên người phụ trách (*)',
    'Mục 6: MSSV người phụ trách (*)',
    'Mục 7: Link văn bản trình ký Drive',
    'Mục 8: Link bài viết minh chứng',
    'Mục 9: Nhu cầu cấp GCN (CO/KHONG) (*)',
    'Mục 10: Thuộc kế hoạch năm (*)',
    'Mục 11: Tiêu chí ĐRL (Mã B1, B2...) (*)',
    'Mục 12: Tiêu chí SV5T (Mã A5, B8...) (*)',
    'Mục 13: Mảng CT Hội (Mã 1-9) (*)',
    'Mục 14: Mảng CT Đoàn (Mã KR1.1-KR5.3) (*)',
    'Mục 15: Cam kết dữ liệu (CO/KHONG) (*)'
  ];

  const sampleRows = [
    [
      'Tập huấn Kỹ năng Cán bộ Đoàn - Hội NLU 2026',
      'DT',
      '',
      5,
      '2026-03-25',
      '2026-03-26',
      'Nguyễn Văn An',
      '22130001',
      'https://drive.google.com/file/d/sample_kehoach_01',
      'https://facebook.com/nlu.youth/posts/sample01',
      'CO',
      'Trong kế hoạch năm',
      'E1',
      'A5',
      '8',
      'KR3.3',
      'CO'
    ],
    [
      'Hội thảo Chuyển đổi số & AI trong Nông nghiệp Thông minh',
      'K_CNTT',
      'DH24IT01',
      4,
      '2026-04-12',
      '2026-04-12',
      'Lê Nguyễn Bảo Anh',
      '24130111',
      'https://drive.google.com/file/d/sample_kehoach_02',
      'https://facebook.com/it.nlu/posts/sample02',
      'CO',
      'Trong kế hoạch năm',
      'B1',
      'B8',
      '3',
      'KR2.3',
      'CO'
    ],
    [
      'Chiến dịch Tình nguyện Mùa Hè Xanh NLU 2026',
      'DT',
      '',
      5,
      '2026-07-05',
      '2026-07-25',
      'Phạm Hoàng Khang',
      '24140022',
      'https://drive.google.com/file/d/sample_kehoach_03',
      'https://facebook.com/mhx.nlu/posts/sample03',
      'CO',
      'Trong kế hoạch năm',
      'C2',
      'C9.1',
      '5',
      'KR2.2',
      'CO'
    ],
    [
      'Ngày hội Hiến máu Tình nguyện - Giọt Hồng Nông Lâm',
      'HSV',
      '',
      5,
      '2026-05-18',
      '2026-05-18',
      'Vũ Thị Minh Hạnh',
      '24130333',
      'https://drive.google.com/file/d/sample_kehoach_04',
      'https://facebook.com/hsv.nlu/posts/sample04',
      'KHONG',
      'Trong kế hoạch năm',
      'C2',
      'C9.1',
      '5',
      'KR2.2',
      'CO'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  ws['!cols'] = [
    { wch: 45 }, // Mục 1: Tên chương trình
    { wch: 22 }, // Mục 2: Mã đơn vị
    { wch: 25 }, // Mục 3: Mã Chi đoàn
    { wch: 25 }, // Mục 4: Quy mô đối tượng
    { wch: 26 }, // Mục 5: Ngày bắt đầu
    { wch: 26 }, // Mục 5: Ngày kết thúc
    { wch: 26 }, // Mục 6: Người phụ trách
    { wch: 24 }, // Mục 6: MSSV phụ trách
    { wch: 35 }, // Mục 7: Link Drive
    { wch: 35 }, // Mục 8: Link minh chứng
    { wch: 25 }, // Mục 9: Cấp GCN
    { wch: 26 }, // Mục 10: Kế hoạch năm
    { wch: 26 }, // Mục 11: Tiêu chí ĐRL
    { wch: 26 }, // Mục 12: Tiêu chí SV5T
    { wch: 24 }, // Mục 13: Mảng CT Hội
    { wch: 28 }, // Mục 14: Mảng CT Đoàn
    { wch: 26 }  // Mục 15: Cam kết dữ liệu
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Mau_DangKy_15Muc');

  // Sheet 2: Danh mục tra cứu tiêu chí chuẩn (Reference Guide)
  const refHeaders = ['Loại Danh Mục', 'Mã Tra Cứu', 'Tên / Diễn Giải Chi Tiết', 'Ghi Chú'];
  const refData: (string | number)[][] = [refHeaders];

  // Quy mô
  TARGET_SCALE_CONFIG.forEach(sc => {
    refData.push(['4. Quy mô đối tượng', sc.id, sc.name, `${sc.points} điểm quy mô`]);
  });

  // Tiêu chí ĐRL
  DRL_CRITERIA.forEach(drl => {
    refData.push(['11. Tiêu chí ĐRL', drl.id, drl.title, 'Khung điểm rèn luyện']);
  });

  // Tiêu chí SV5T
  SV5T_STANDARDS.forEach(std => {
    std.criteria.forEach(c => {
      refData.push([`12. Tiêu chí SV5T (${std.name})`, c.id, c.title, c.required ? 'Tiêu chuẩn bắt buộc' : 'Tiêu chuẩn cộng']);
    });
  });

  // Mảng CT Hội
  HOI_PROGRAMS.forEach(hp => {
    refData.push(['13. Mảng CT Hội SV', hp.id, hp.title, 'Chương trình công tác Hội']);
  });

  // Mảng CT Đoàn
  DOAN_PROGRAMS.forEach(dp => {
    refData.push(['14. Mảng CT Đoàn TN', dp.id, dp.title, 'Nhiệm vụ trọng tâm Đoàn']);
  });

  const wsRef = XLSX.utils.aoa_to_sheet(refData);
  wsRef['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 55 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsRef, 'HuongDan_TraCuu_15Muc');

  XLSX.writeFile(wb, `Mau_DangKy_HoatDong_15Muc_NLU_${Date.now()}.xlsx`);
}

/**
 * Xuất danh sách hoạt động hàng loạt ra Excel chuẩn 15 mục đăng ký
 */
export function exportActivitiesToExcel15Items(
  activitiesToExport: ActivitySubmission[],
  filenamePrefix = 'DanhSach_HoatDong_15Muc_NLU'
): void {
  const wb = XLSX.utils.book_new();

  const headers = [
    'STT',
    'Mã Hoạt Động',
    'Mục 1: Tên chương trình',
    'Mục 2: Mã đơn vị tổ chức',
    'Tên đơn vị tổ chức',
    'Mục 3: Chi đoàn tổ chức',
    'Mục 4: Điểm quy mô (1-6)',
    'Tên quy mô đối tượng',
    'Mục 5: Ngày bắt đầu',
    'Mục 5: Ngày kết thúc',
    'Mục 6: Người phụ trách',
    'Mục 6: MSSV người phụ trách',
    'Mục 7: Link VB trình ký (Drive)',
    'Mục 8: Link bài viết minh chứng',
    'Mục 9: Nhu cầu cấp GCN',
    'Mục 10: Thuộc kế hoạch năm',
    'Mục 11: Mã tiêu chí ĐRL',
    'Diễn giải tiêu chí ĐRL',
    'Mục 12: Mã tiêu chí SV5T',
    'Diễn giải tiêu chí SV5T',
    'Mục 13: Mã mảng CT Hội',
    'Diễn giải mảng CT Hội',
    'Mục 14: Mã mảng CT Đoàn',
    'Diễn giải mảng CT Đoàn',
    'Mục 15: Cam kết dữ liệu',
    'Cấp đăng cai',
    'Điểm phân cấp',
    'Phân cấp chương trình',
    'Số lượng SV tham gia',
    'Trạng thái phê duyệt',
    'Khóa sổ',
    'Học kỳ',
    'Năm học'
  ];

  const rows = activitiesToExport.map((act, idx) => {
    return [
      idx + 1,
      act.id,
      act.title,
      act.orgCode,
      act.orgName || '',
      act.branchClass || '',
      act.scalePoints || act.scaleId,
      act.scaleName || '',
      act.startDate,
      act.endDate || act.startDate,
      act.managerName,
      act.managerStudentId || '',
      act.signedDocUrl || '',
      act.proofArticleUrl || '',
      act.needsCertificate ? 'Có cấp GCN' : 'Không cấp GCN',
      act.planYearOption || 'Trong kế hoạch năm',
      act.drlCriteriaId || '',
      act.drlCriteriaText || '',
      act.sv5tCriteriaId || '',
      act.sv5tCriteriaText || '',
      act.hoiProgramId || '',
      act.hoiProgramText || '',
      act.doanProgramId || '',
      act.doanProgramText || '',
      act.dataCommitment ? 'Đã cam kết' : 'Chưa cam kết',
      act.hostLevel || 'B',
      act.totalLevelScore || 0,
      `Cấp ${act.programLevel || 1}`,
      act.officialParticipantCount || (act.participants ? act.participants.length : 0),
      act.status === 'Approved'
        ? 'Đã Phê Duyệt'
        : act.status === 'Pending_L4'
        ? 'Chờ Trường Duyệt (L4)'
        : act.status === 'Pending_L3'
        ? 'Chờ Khoa Duyệt (L3)'
        : act.status === 'Request_Edit'
        ? 'Yêu Cầu Sửa'
        : 'Từ Chối',
      act.isLocked ? 'Đã Khóa' : 'Mở',
      act.semester || 'HK1',
      act.planYear || CURRENT_ACADEMIC_YEAR
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 40 },
    { wch: 18 },
    { wch: 25 },
    { wch: 20 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 22 },
    { wch: 16 },
    { wch: 30 },
    { wch: 30 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 32 },
    { wch: 16 },
    { wch: 32 },
    { wch: 16 },
    { wch: 32 },
    { wch: 16 },
    { wch: 32 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 18 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'HoatDong_Mau15Muc');
  XLSX.writeFile(wb, `${filenamePrefix}_${Date.now()}.xlsx`);
}

/**
 * Đọc và phân tích file Excel / CSV nhập hàng loạt theo mẫu 15 mục
 */
export async function parseActivity15Excel(
  file: File,
  organizations: Organization[],
  branchClasses: BranchClass[]
): Promise<ParsedActivity15Row[]> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) {
    throw new Error('Hệ thống chỉ chấp nhận tệp định dạng Excel (.xlsx). Vui lòng chuyển đổi tệp của bạn sang .xlsx!');
  }

  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to array of objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const parsedList: ParsedActivity15Row[] = [];

  rawRows.forEach((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Helper: find column by multiple possible headers
    const getVal = (candidates: string[]): string => {
      for (const key of Object.keys(row)) {
        const cleanKey = key.toLowerCase().replace(/[:\-_.*()]/g, ' ').replace(/\s+/g, ' ').trim();
        for (const c of candidates) {
          const cleanCandidate = c.toLowerCase().replace(/[:\-_.*()]/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanKey.includes(cleanCandidate)) {
            return String(row[key] ?? '').trim();
          }
        }
      }
      return '';
    };

    // 1. Tên chương trình
    const title = getVal(['mục 1', 'tên chương trình', 'ten chuong trinh', 'hoạt động', 'tên hoạt động', 'title']);
    if (!title) {
      errors.push('Mục 1: Thiếu tên chương trình / hoạt động');
    }

    // 2. Đơn vị tổ chức
    let orgCode = getVal(['mục 2', 'mã đơn vị', 'đơn vị tổ chức', 'ma don vi', 'orgcode', 'don vi']);
    if (!orgCode) {
      orgCode = 'DT'; // Mặc định Cấp Trường nếu không nhập
      warnings.push('Mục 2: Không có mã đơn vị, tự động gán Cấp Trường (DT)');
    }
    const matchedOrg = organizations.find(
      o => o.code.toLowerCase() === orgCode.toLowerCase() || o.name.toLowerCase().includes(orgCode.toLowerCase())
    ) || organizations.find(o => o.code === 'DT') || organizations[0];
    const orgName = matchedOrg?.name || orgCode;
    orgCode = matchedOrg?.code || orgCode;

    // 3. Chi đoàn tổ chức
    const branchClass = getVal(['mục 3', 'chi đoàn', 'chi doan', 'lớp', 'branchclass']);

    // 4. Quy mô đối tượng (1-6)
    const rawScale = getVal(['mục 4', 'quy mô', 'quy mo', 'scale', 'đối tượng']);
    let scaleId = parseInt(rawScale, 10);
    if (isNaN(scaleId) || scaleId < 1 || scaleId > 6) {
      // Thử dò theo từ khóa
      if (rawScale.includes('trực tuyến') || rawScale.includes('online')) scaleId = 1;
      else if (rawScale.includes('chi đoàn') || rawScale.includes('chi hội')) scaleId = 2;
      else if (rawScale.includes('clb cấp trường') || rawScale.includes('đội nhóm')) scaleId = 3;
      else if (rawScale.includes('toàn khoa')) scaleId = 4;
      else if (rawScale.includes('toàn trường') || rawScale.includes('trường')) scaleId = 5;
      else if (rawScale.includes('thành phố') || rawScale.includes('quốc')) scaleId = 6;
      else scaleId = matchedOrg?.type === 'KHOA' ? 4 : 5; // Fallback
    }
    const matchedScale = TARGET_SCALE_CONFIG.find(s => s.id === scaleId) || TARGET_SCALE_CONFIG[3];

    // 5. Thời gian tổ chức
    let startDate = getVal(['mục 5', 'ngày bắt đầu', 'ngay bat dau', 'startdate', 'thời gian bắt đầu']);
    let endDate = getVal(['ngày kết thúc', 'ngay ket thuc', 'enddate', 'thời gian kết thúc']);

    if (!startDate) {
      startDate = new Date().toISOString().split('T')[0];
      warnings.push('Mục 5: Thiếu ngày bắt đầu, sử dụng ngày hiện tại');
    } else {
      // Normalize date if needed (e.g. DD/MM/YYYY)
      if (startDate.includes('/')) {
        const parts = startDate.split('/');
        if (parts.length === 3) {
          startDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }
    if (!endDate) endDate = startDate;
    else if (endDate.includes('/')) {
      const parts = endDate.split('/');
      if (parts.length === 3) {
        endDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }

    // 6. Người phụ trách
    let managerName = getVal(['mục 6', 'họ tên người phụ trách', 'người phụ trách', 'nguoi phu trach', 'manager']);
    let managerStudentId = getVal(['mssv người phụ trách', 'mssv', 'mã số sinh viên', 'managerstudentid']);
    if (!managerName) {
      managerName = 'Ban Tổ Chức';
      warnings.push('Mục 6: Chưa nhập người phụ trách, tạm gán Ban Tổ Chức');
    }
    if (!managerStudentId) {
      managerStudentId = '22130001';
    }

    // 7. Link VB trình ký Drive
    const signedDocUrl = getVal(['mục 7', 'văn bản trình ký', 'vb trình ký', 'drive', 'signeddocurl', 'kế hoạch']);

    // 8. Link bài viết minh chứng
    const proofArticleUrl = getVal(['mục 8', 'bài viết minh chứng', 'minh chứng', 'truyền thông', 'proofarticleurl', 'link bài']);

    // 9. Nhu cầu cấp GCN
    const rawCert = getVal(['mục 9', 'nhu cầu cấp gcn', 'cấp gcn', 'giấy chứng nhận', 'needscertificate']).toUpperCase();
    const needsCertificate = !rawCert.includes('KHONG') && !rawCert.includes('FALSE') && !rawCert.includes('0');

    // 10. Thuộc kế hoạch năm
    const rawPlanYear = getVal(['mục 10', 'thuộc kế hoạch năm', 'kế hoạch năm', 'planyearoption']);
    const planYearOption: PlanYearOption = rawPlanYear.toLowerCase().includes('ngoài') || rawPlanYear.toLowerCase().includes('ngoai')
      ? 'Nằm ngoài kế hoạch năm'
      : 'Trong kế hoạch năm';

    // 11. Tiêu chí ĐRL
    let drlCriteriaId = getVal(['mục 11', 'tiêu chí đrl', 'tiêu chí drl', 'drl', 'drlcriteriaid']).toUpperCase();
    if (!drlCriteriaId || !DRL_CRITERIA.some(d => d.id === drlCriteriaId)) {
      drlCriteriaId = 'B2';
    }
    const matchedDrl = DRL_CRITERIA.find(d => d.id === drlCriteriaId);
    const drlCriteriaText = matchedDrl ? matchedDrl.title : `Tiêu chí ĐRL ${drlCriteriaId}`;

    // 12. Tiêu chí SV5T
    let sv5tCriteriaId = getVal(['mục 12', 'tiêu chí sv5t', 'sv5t', 'sv5tcriteriaid']).toUpperCase();
    if (!sv5tCriteriaId) sv5tCriteriaId = 'B8.2';
    let sv5tCriteriaText = `Tiêu chuẩn SV5T ${sv5tCriteriaId}`;
    SV5T_STANDARDS.forEach(std => {
      std.criteria.forEach(c => {
        if (c.id === sv5tCriteriaId || c.code === sv5tCriteriaId) {
          sv5tCriteriaText = `${std.name} - ${c.title}`;
        }
      });
    });

    // 13. Mảng CT Hội
    let hoiProgramId = getVal(['mục 13', 'mảng ct hội', 'chương trình hội', 'hoiprogramid']);
    if (!hoiProgramId) hoiProgramId = '3';
    const matchedHoi = HOI_PROGRAMS.find(h => h.id === hoiProgramId);
    const hoiProgramText = matchedHoi ? matchedHoi.title : `Chương trình Hội ${hoiProgramId}`;

    // 14. Mảng CT Đoàn
    let doanProgramId = getVal(['mục 14', 'mảng ct đoàn', 'chương trình đoàn', 'doanprogramid']).toUpperCase();
    if (!doanProgramId) doanProgramId = 'KR2.3';
    const matchedDoan = DOAN_PROGRAMS.find(d => d.id === doanProgramId);
    const doanProgramText = matchedDoan ? matchedDoan.title : `Chương trình Đoàn ${doanProgramId}`;

    // 15. Cam kết dữ liệu
    const rawCommit = getVal(['mục 15', 'cam kết dữ liệu', 'cam kết', 'datacommitment']).toUpperCase();
    const dataCommitment = !rawCommit.includes('KHONG') && !rawCommit.includes('FALSE') && !rawCommit.includes('0');

    // Host Level Points and Calculation
    const hostLevelPts = matchedOrg?.hostLevelScorePoint || 3;
    const hostLevel: HostLevel = hostLevelPts >= 5 ? 'A' : 'B';
    const matchedHostConfig = HOST_LEVEL_POINTS.find(h => h.points === hostLevelPts) || HOST_LEVEL_POINTS[2];

    const calculated = calculateProgramLevelScore(matchedScale.points, 0, hostLevelPts, { orgCode, orgName });
    if (calculated.isSchoolEnforcedLevel) {
      warnings.push(`Mục 4: Hoạt động do ${orgName} tổ chức áp dụng mức sàn quy chế tối thiểu Cấp 3.`);
    }

    // Activity Semester calculation
    let semester: 'HK1' | 'HK2' | 'HK_HE' = 'HK1';
    try {
      const month = new Date(startDate).getMonth() + 1;
      if (month >= 9 || month === 1) semester = 'HK1';
      else if (month >= 2 && month <= 6) semester = 'HK2';
      else if (month >= 7 && month <= 8) semester = 'HK_HE';
    } catch {}

    const activityType: 'DOAN' | 'HOI' | 'DOAN_HOI' = 'DOAN_HOI';

    parsedList.push({
      index: index + 1,
      title,
      orgCode,
      orgName,
      branchClass,
      scaleId: matchedScale.id,
      scaleName: matchedScale.name,
      scalePoints: matchedScale.points,
      startDate,
      endDate,
      managerName,
      managerStudentId,
      signedDocUrl,
      proofArticleUrl,
      needsCertificate,
      planYearOption,
      drlCriteriaId,
      drlCriteriaText,
      sv5tCriteriaId,
      sv5tCriteriaText,
      hoiProgramId,
      hoiProgramText,
      doanProgramId,
      doanProgramText,
      dataCommitment,
      hostLevel,
      hostLevelId: matchedHostConfig.id,
      hostLevelName: matchedHostConfig.name,
      hostLevelPoints: hostLevelPts,
      totalLevelScore: calculated.totalScore,
      programLevel: calculated.programLevel,
      semester,
      activityType,
      isValid: errors.length === 0,
      errors,
      warnings
    });
  });

  return parsedList;
}

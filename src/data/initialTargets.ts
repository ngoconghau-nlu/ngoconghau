import {
  TargetItem,
  TargetCategory,
  TargetAiForecastStatus,
  TargetOrgType,
  TargetSubAllocation,
  TargetRegistrationStatus
} from '../types';

/**
 * Master standard KPI targets for NLU Youth 2026 (Năm học 2026-2027)
 * Phân chia chuẩn hóa thành 2 nhóm:
 * 1. Đoàn Thanh niên: Gắn với 14. Mảng CT Đoàn & Phong trào TT (C.14) (KR1.1 -> KR8.2)
 * 2. Hội Sinh viên: Gắn với 13. Mảng CT Hội & Phong trào SV (C.13) (1 -> 9)
 */
export const INITIAL_TARGETS: TargetItem[] = [
  // ============================================================================
  // TAB 1: ĐOÀN THANH NIÊN - 14. MẢNG CT ĐOÀN & PHONG TRÀO TT (C.14)
  // ============================================================================
  {
    id: 'CT-DOAN-01',
    code: 'CT-D01',
    name: '100% Chi đoàn tổ chức sinh hoạt chính trị học tập và làm theo tư tưởng Bác',
    description: 'Tổ chức các diễn đàn, buổi sinh hoạt chi đoàn chuyên đề về lý tưởng cách mạng, Chỉ thị 05-CT/TW và bài học thanh niên tiên tiến làm theo lời Bác.',
    orgType: 'DOAN',
    programId: 'KR1.1',
    programText: 'KR1.1. Thực hiện hiệu quả Chỉ thị 05-CT/TW và 42-CT/TW gắn giáo dục',
    category: 'TO_CHUC_DOAN_HOI',
    metricType: 'PERCENTAGE',
    unitOfMeasure: '% Chi đoàn',
    targetValue: 100,
    currentValue: 86.5,
    completionRate: 86.5,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 5,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: ['A001', 'B001'],
    linkedActivityCount: 2,
    allocations: [
      {
        id: 'alc-d01-1',
        unitCode: 'CNTT',
        unitName: 'Đoàn Khoa Công nghệ Thông tin',
        unitType: 'KHOA',
        targetQuota: 100,
        registeredValue: 100,
        assignedValue: 100,
        currentValue: 92,
        completionRate: 92.0,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false,
        registeredBy: 'BCH Đoàn Khoa CNTT',
        registeredAt: '2026-09-15T08:30:00Z',
        decidedBy: 'Ban Thường vụ Đoàn trường',
        decidedAt: '2026-09-18T10:00:00Z',
        decisionNote: 'Phê duyệt 100% cam kết tổ chức tại 12 Chi đoàn K21-K24'
      },
      {
        id: 'alc-d01-2',
        unitCode: 'CNTY',
        unitName: 'Đoàn Khoa Chăn nuôi Thú y',
        unitType: 'KHOA',
        targetQuota: 100,
        registeredValue: 100,
        assignedValue: 100,
        currentValue: 88,
        completionRate: 88.0,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false,
        registeredBy: 'BCH Đoàn Khoa CNTY',
        registeredAt: '2026-09-16T09:00:00Z',
        decidedBy: 'Ban Thường vụ Đoàn trường',
        decidedAt: '2026-09-18T10:00:00Z'
      },
      {
        id: 'alc-d01-3',
        unitCode: 'KT',
        unitName: 'Đoàn Khoa Kinh tế',
        unitType: 'KHOA',
        targetQuota: 100,
        registeredValue: 95,
        assignedValue: 0,
        currentValue: 70,
        completionRate: 70.0,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHO_DUYET',
        isAutoAllocatedBySchool: false,
        registeredBy: 'BCH Đoàn Khoa KT',
        registeredAt: '2026-10-02T14:15:00Z',
        actionPlan: 'Đăng ký 95% do 2 chi đoàn năm cuối đang đi thực tập tốt nghiệp'
      },
      {
        id: 'alc-d01-4',
        unitCode: 'CKCN',
        unitName: 'Đoàn Khoa Cơ khí - Công nghệ',
        unitType: 'KHOA',
        targetQuota: 100,
        assignedValue: 0,
        currentValue: 50,
        completionRate: 50.0,
        forecastStatus: 'NGUY_CO',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 4,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 92,
    aiForecastAnalysis: 'Tiến độ chung đạt 86.5% tại học kỳ 1, đa số Chi đoàn hoàn thành đợt sinh hoạt kỷ niệm 70 năm truyền thống trường. Dự báo 100% đạt chỉ tiêu.',
    aiSuggestedActions: [
      'Đôn đốc Đoàn Khoa Cơ khí - Công nghệ hoàn thiện thủ tục đăng ký và tổ chức các buổi sinh hoạt chi đoàn mẫu',
      'Đẩy mạnh triển khai chuyên đề trên chuyên trang Sinh hoạt Chi đoàn điện tử'
    ],
    evidenceChecks: [
      { id: 'ev-d1', activityId: 'A001', activityTitle: 'Sinh hoạt Chi đoàn chủ điểm Tháng 9/2026', checkedAt: '2026-10-01T10:00:00Z', participantCountVerified: 450, qrVerifiedCount: 442, aiVerificationConfidence: 0.98, status: 'VERIFIED', notes: 'Đối soát 100% biên bản sinh hoạt chi đoàn' }
    ],
    createdBy: {
      userId: 'usr_btv',
      userName: 'Ban Thường vụ Đoàn trường',
      userEmail: 'doanhoi@hcmuaf.edu.vn',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-DOAN-02',
    code: 'CT-D02',
    name: '100% Đoàn viên hoàn thành tối thiểu 02 ngày Tình nguyện vì Cộng đồng',
    description: 'Chỉ tiêu bắt buộc toàn khóa: tham gia Ngày Chủ nhật xanh, Ngày Thứ bảy tình nguyện, hỗ trợ địa phương hoặc các chiến dịch tình nguyện cao điểm.',
    orgType: 'DOAN',
    programId: 'KR2.2',
    programText: 'KR2.2. Phong trào Thanh niên tình nguyện',
    category: 'TRACH_NHIEM_XA_HOI',
    metricType: 'PERCENTAGE',
    unitOfMeasure: '% Đoàn viên',
    targetValue: 100,
    currentValue: 78.2,
    completionRate: 78.2,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 5,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: ['B001'],
    linkedActivityCount: 1,
    allocations: [
      {
        id: 'alc-d02-1',
        unitCode: 'CNTT',
        unitName: 'Đoàn Khoa Công nghệ Thông tin',
        unitType: 'KHOA',
        targetQuota: 100,
        registeredValue: 100,
        assignedValue: 100,
        currentValue: 85,
        completionRate: 85.0,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false,
        registeredBy: 'BCH Đoàn Khoa CNTT',
        registeredAt: '2026-09-12T09:00:00Z',
        decidedBy: 'Ban Thường vụ Đoàn trường',
        decidedAt: '2026-09-18T10:00:00Z'
      },
      {
        id: 'alc-d02-2',
        unitCode: 'LN',
        unitName: 'Đoàn Khoa Lâm nghiệp',
        unitType: 'KHOA',
        targetQuota: 100,
        registeredValue: 100,
        assignedValue: 100,
        currentValue: 71,
        completionRate: 71.0,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-d02-3',
        unitCode: 'MTTN',
        unitName: 'Đoàn Khoa Môi trường và Tài nguyên',
        unitType: 'KHOA',
        targetQuota: 100,
        assignedValue: 0,
        currentValue: 60,
        completionRate: 60.0,
        forecastStatus: 'NGUY_CO',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 3,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 88,
    aiForecastAnalysis: 'Chỉ tiêu đạt khả quan sau đợt Mùa hè xanh và các đợt Ngày Chủ nhật xanh đầu khóa. Dự kiến sau Chiến dịch Xuân Tình Nguyện 2027 sẽ hoàn thành 100%.',
    aiSuggestedActions: [
      'Cấp trường kích hoạt phân bổ chỉ tiêu cho Đoàn Khoa Môi trường nếu đơn vị không đăng ký trước 25/10',
      'Mở thêm 03 đợt "Ngày Thứ Bảy Tình Nguyện" làm đẹp khuôn viên giảng đường'
    ],
    evidenceChecks: [
      { id: 'ev-d2', activityId: 'B001', activityTitle: 'Chiến dịch Ngày Chủ Nhật Xanh Lần 145', checkedAt: '2026-10-02T16:00:00Z', participantCountVerified: 320, qrVerifiedCount: 315, aiVerificationConfidence: 0.99, status: 'VERIFIED', notes: 'Ghi nhận thời gian thực qua mã QR' }
    ],
    createdBy: {
      userId: 'usr_btv',
      userName: 'Ban Thường vụ Đoàn trường',
      userEmail: 'doanhoi@hcmuaf.edu.vn',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-DOAN-03',
    code: 'CT-D03',
    name: 'Tối thiểu 500 đoàn viên đăng ký Ý tưởng Sáng tạo & Đề tài Nghiên cứu Khoa học Trẻ',
    description: 'Vận động nộp ý tưởng trên Cổng Ngân hàng Ý tưởng Sáng tạo Đoàn Khối và tham gia Giải thưởng Sinh viên Nghiên cứu Khoa học Euréka.',
    orgType: 'DOAN',
    programId: 'KR2.3',
    programText: 'KR2.3. Phong trào Tuổi trẻ sáng tạo',
    category: 'HOC_THUAT',
    metricType: 'NUMBER',
    unitOfMeasure: 'Đoàn viên',
    targetValue: 500,
    currentValue: 345,
    completionRate: 69.0,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 4,
    isLocked: false,
    registrationDeadline: '2026-10-30',
    linkedActivityIds: ['A001'],
    linkedActivityCount: 1,
    allocations: [
      {
        id: 'alc-d03-1',
        unitCode: 'CNTT',
        unitName: 'Đoàn Khoa Công nghệ Thông tin',
        unitType: 'KHOA',
        targetQuota: 90,
        registeredValue: 90,
        assignedValue: 90,
        currentValue: 82,
        completionRate: 91.1,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-d03-2',
        unitCode: 'KHSH',
        unitName: 'Đoàn Khoa Khoa học Sinh học',
        unitType: 'KHOA',
        targetQuota: 70,
        registeredValue: 70,
        assignedValue: 70,
        currentValue: 45,
        completionRate: 64.3,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-d03-3',
        unitCode: 'NH',
        unitName: 'Đoàn Khoa Nông học',
        unitType: 'KHOA',
        targetQuota: 80,
        assignedValue: 0,
        currentValue: 30,
        completionRate: 37.5,
        forecastStatus: 'NGUY_CO',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 3,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'BAO_DONG',
    aiForecastProbability: 68,
    aiForecastAnalysis: 'Khoa Nông học chưa đăng ký chỉ tiêu chính thức. Tiến độ hiện tại đạt 69%, cần bổ sung tối thiểu 155 ý tưởng trong học kỳ 1.',
    aiSuggestedActions: [
      'Cấp trường áp đặt phân bổ 80 chỉ tiêu cho Đoàn Khoa Nông học nếu quá hạn đăng ký',
      'Tổ chức Cuộc thi Sáng tạo Ý tưởng Khởi nghiệp Xanh 2026 để thu hút thêm 200 lượt đăng ký'
    ],
    createdBy: {
      userId: 'usr_btv',
      userName: 'Ban Thường vụ Đoàn trường',
      userEmail: 'doanhoi@hcmuaf.edu.vn',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-DOAN-04',
    code: 'CT-D04',
    name: 'Tổ chức 20 Khóa huấn luyện Kỹ năng thực hành xã hội & Ngoại ngữ hội nhập',
    description: 'Bồi dưỡng kỹ năng thuyết trình, làm việc nhóm, công nghệ số/AI, giao tiếp tiếng Anh và kỹ năng xin việc cho đoàn viên thanh niên.',
    orgType: 'DOAN',
    programId: 'KR3.3',
    programText: 'KR3.3. Chương trình phát triển kỹ năng thực hành xã hội, thể chất, văn hóa',
    category: 'KY_NANG',
    metricType: 'NUMBER',
    unitOfMeasure: 'Khóa / Lớp',
    targetValue: 20,
    currentValue: 14,
    completionRate: 70.0,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 4,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: ['A002'],
    linkedActivityCount: 1,
    allocations: [
      {
        id: 'alc-d04-1',
        unitCode: 'CLB_BAS',
        unitName: 'CLB Học thuật - Kỹ năng B.A.S',
        unitType: 'CLB',
        targetQuota: 6,
        registeredValue: 6,
        assignedValue: 6,
        currentValue: 5,
        completionRate: 83.3,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-d04-2',
        unitCode: 'CLB_KN',
        unitName: 'CLB Khởi nghiệp',
        unitType: 'CLB',
        targetQuota: 4,
        registeredValue: 3,
        assignedValue: 0,
        currentValue: 2,
        completionRate: 66.7,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHO_DUYET',
        isAutoAllocatedBySchool: false,
        actionPlan: 'Đề xuất 3 khóa chuyên sâu về gọi vốn và thẩm định dự án'
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 0,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 89,
    aiForecastAnalysis: 'Đã hoàn thành 14/20 khóa huấn luyện kỹ năng. Tốc độ triển khai đồng đều giữa các CLB.',
    aiSuggestedActions: [
      'Duyệt kế hoạch của CLB Khởi nghiệp và giao thêm 1 khóa kỹ năng số',
      'Mở thêm 2 workshop chuyên đề Trí tuệ nhân tạo (AI) ứng dụng trong học tập'
    ],
    createdBy: {
      userId: 'usr_btv',
      userName: 'Ban Thường vụ Đoàn trường',
      userEmail: 'doanhoi@hcmuaf.edu.vn',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-DOAN-05',
    code: 'CT-D05',
    name: 'Tối thiểu 90% Chi đoàn đạt xếp loại Hoàn thành tốt nhiệm vụ trở lên',
    description: '100% Chi đoàn triển khai Sổ tay đoàn viên điện tử, sinh hoạt định kỳ tối thiểu 1 lần/tháng và đánh giá chất lượng đúng quy định.',
    orgType: 'DOAN',
    programId: 'KR5.2',
    programText: 'KR5.2. Xây dựng Đoàn vững mạnh về tổ chức',
    category: 'TO_CHUC_DOAN_HOI',
    metricType: 'PERCENTAGE',
    unitOfMeasure: '% Chi đoàn',
    targetValue: 90,
    currentValue: 84.7,
    completionRate: 94.1,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 5,
    isLocked: false,
    registrationDeadline: '2026-10-20',
    linkedActivityIds: [],
    linkedActivityCount: 0,
    allocations: [
      {
        id: 'alc-d05-1',
        unitCode: 'CNTT',
        unitName: 'Đoàn Khoa Công nghệ Thông tin',
        unitType: 'KHOA',
        targetQuota: 95,
        registeredValue: 95,
        assignedValue: 95,
        currentValue: 91,
        completionRate: 95.8,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-d05-2',
        unitCode: 'CKCN',
        unitName: 'Đoàn Khoa Cơ khí - Công nghệ',
        unitType: 'KHOA',
        targetQuota: 85,
        assignedValue: 0,
        currentValue: 68,
        completionRate: 80.0,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 93,
    aiForecastAnalysis: '84.7% Chi đoàn đang duy trì chế độ sinh hoạt đều đặn và nộp báo cáo đúng hạn trên hệ thống. Khả năng hoàn thành chỉ tiêu đạt mức rất cao.',
    aiSuggestedActions: [
      'Tập huấn cán bộ Bí thư Chi đoàn khóa mới về số hóa hồ sơ Đoàn vụ',
      'Đôn đốc Đoàn Khoa CKCN đăng ký mức giao chất lượng Chi đoàn'
    ],
    createdBy: {
      userId: 'usr_btv',
      userName: 'Ban Thường vụ Đoàn trường',
      userEmail: 'doanhoi@hcmuaf.edu.vn',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-DOAN-06',
    code: 'CT-D06',
    name: 'Giới thiệu tối thiểu 150 Đoàn viên ưu tú cho Đảng bộ Trường xem xét kết nạp',
    description: 'Phát hiện, bồi dưỡng đoàn viên ưu tú qua phong trào hành động cách mạng, hoàn thành lớp Bồi dưỡng Nhận thức về Đảng.',
    orgType: 'DOAN',
    programId: 'KR5.5',
    programText: 'KR5.5. Đoàn tham gia xây dựng, bảo vệ Đảng và hệ thống chính trị',
    category: 'TO_CHUC_DOAN_HOI',
    metricType: 'NUMBER',
    unitOfMeasure: 'Đoàn viên ưu tú',
    targetValue: 150,
    currentValue: 92,
    completionRate: 61.3,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 5,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: [],
    linkedActivityCount: 0,
    allocations: [
      {
        id: 'alc-d06-1',
        unitCode: 'CNTT',
        unitName: 'Đoàn Khoa Công nghệ Thông tin',
        unitType: 'KHOA',
        targetQuota: 25,
        registeredValue: 25,
        assignedValue: 25,
        currentValue: 18,
        completionRate: 72.0,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-d06-2',
        unitCode: 'KT',
        unitName: 'Đoàn Khoa Kinh tế',
        unitType: 'KHOA',
        targetQuota: 20,
        assignedValue: 0,
        currentValue: 10,
        completionRate: 50.0,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'BAO_DONG',
    aiForecastProbability: 74,
    aiForecastAnalysis: 'Đã giới thiệu 92 đồng chí trong đợt 1. Cần đẩy mạnh xét chọn tại các Chi đoàn năm 3 và năm 4 để hoàn thành đủ 150 chỉ tiêu.',
    aiSuggestedActions: [
      'Đoàn trường tự động phân bổ 20 chỉ tiêu cho Đoàn Khoa Kinh tế nếu không nộp đăng ký',
      'Phối hợp Văn phòng Đảng ủy mở lớp Cảm tình Đảng đợt 2 vào tháng 12/2026'
    ],
    createdBy: {
      userId: 'usr_btv',
      userName: 'Ban Thường vụ Đoàn trường',
      userEmail: 'doanhoi@hcmuaf.edu.vn',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },

  // ============================================================================
  // TAB 2: HỘI SINH VIÊN - 13. MẢNG CT HỘI & PHONG TRÀO SV (C.13)
  // ============================================================================
  {
    id: 'CT-HOI-01',
    code: 'CT-H01',
    name: '100% Hội viên, sinh viên được tiếp cận tuyên truyền và đăng ký xét Sinh viên 5 tốt',
    description: 'Tổ chức chuỗi ngày hội kết nối phong trào Sinh viên 5 tốt, hướng dẫn sinh viên theo dõi tự động 5 tiêu chuẩn trên hệ thống số.',
    orgType: 'HOI',
    programId: '1',
    programText: '1. Công tác tuyên truyền, triển khai phong trào “Sinh viên 5 tốt”',
    category: 'TO_CHUC_DOAN_HOI',
    metricType: 'PERCENTAGE',
    unitOfMeasure: '% Sinh viên',
    targetValue: 100,
    currentValue: 91.2,
    completionRate: 91.2,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 5,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: ['A001'],
    linkedActivityCount: 1,
    allocations: [
      {
        id: 'alc-h01-1',
        unitCode: 'CNTT',
        unitName: 'Liên chi hội SV Khoa CNTT',
        unitType: 'KHOA',
        targetQuota: 100,
        registeredValue: 100,
        assignedValue: 100,
        currentValue: 95,
        completionRate: 95.0,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-h01-2',
        unitCode: 'CNTY',
        unitName: 'Liên chi hội SV Khoa Chăn nuôi Thú y',
        unitType: 'KHOA',
        targetQuota: 100,
        registeredValue: 100,
        assignedValue: 100,
        currentValue: 90,
        completionRate: 90.0,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-h01-3',
        unitCode: 'NNSP',
        unitName: 'Liên chi hội SV Khoa Ngoại ngữ - Sư phạm',
        unitType: 'KHOA',
        targetQuota: 100,
        assignedValue: 0,
        currentValue: 70,
        completionRate: 70.0,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 3,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 95,
    aiForecastAnalysis: 'Chỉ tiêu đạt 91.2% nhờ tính năng Tự động xét duyệt SV5T trên nền tảng. Dự kiến đạt 100% trong học kỳ 1.',
    aiSuggestedActions: [
      'Phê chuẩn phân bổ chỉ tiêu cho LCH Ngoại ngữ - Sư phạm',
      'Đẩy mạnh truyền thông gương Sinh viên 5 tốt tiêu biểu các năm trước'
    ],
    evidenceChecks: [
      { id: 'ev-h1', activityId: 'A001', activityTitle: 'Ngày hội Sinh viên 5 tốt NLU 2026', checkedAt: '2026-10-01T14:00:00Z', participantCountVerified: 850, qrVerifiedCount: 840, aiVerificationConfidence: 0.99, status: 'VERIFIED', notes: '100% sinh viên xác nhận QR' }
    ],
    createdBy: {
      userId: 'usr_btk',
      userName: 'Ban Thư ký Hội Sinh viên trường',
      userEmail: 'hsvdhnonglam@hoisinhvientphcm.com',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-HOI-02',
    code: 'CT-H02',
    name: 'Tối thiểu 90% Sinh viên đạt Điểm rèn luyện từ loại Khá trở lên (≥ 70 điểm)',
    description: 'Nâng cao ý thức kỷ luật, chấp hành quy chế học đường, tích cực tham gia các hoạt động Đoàn - Hội và không có sinh viên xếp loại rèn luyện Yếu.',
    orgType: 'HOI',
    programId: '2',
    programText: '2. Sinh viên vun đắp lý tưởng, rèn luyện đạo đức, tác phong',
    category: 'TO_CHUC_DOAN_HOI',
    metricType: 'PERCENTAGE',
    unitOfMeasure: '% Sinh viên',
    targetValue: 90,
    currentValue: 88.4,
    completionRate: 98.2,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 5,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: [],
    linkedActivityCount: 0,
    allocations: [
      {
        id: 'alc-h02-1',
        unitCode: 'CNTT',
        unitName: 'Liên chi hội SV Khoa CNTT',
        unitType: 'KHOA',
        targetQuota: 90,
        registeredValue: 92,
        assignedValue: 92,
        currentValue: 90,
        completionRate: 97.8,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-h02-2',
        unitCode: 'KT',
        unitName: 'Liên chi hội SV Khoa Kinh tế',
        unitType: 'KHOA',
        targetQuota: 90,
        registeredValue: 90,
        assignedValue: 0,
        currentValue: 82,
        completionRate: 91.1,
        forecastStatus: 'DAT',
        registrationStatus: 'CHO_DUYET',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 0,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 96,
    aiForecastAnalysis: 'Tỷ lệ sinh viên rèn luyện từ loại Khá trở lên đang đạt 88.4% (so với chỉ tiêu 90%). Tiến độ rất tích cực.',
    aiSuggestedActions: [
      'Duyệt chính thức đăng ký cho LCH Khoa Kinh tế',
      'Đôn đốc kiểm tra sinh viên có nguy cơ dưới 65 điểm rèn luyện'
    ],
    createdBy: {
      userId: 'usr_btk',
      userName: 'Ban Thư ký Hội Sinh viên trường',
      userEmail: 'hsvdhnonglam@hoisinhvientphcm.com',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-HOI-03',
    code: 'CT-H03',
    name: 'Tuyên dương tối thiểu 200 Sinh viên 5 tốt cấp trường & 30 Đề tài NCKH xuất sắc',
    description: 'Xét chọn và trao danh hiệu Sinh viên 5 tốt cấp Trường nhân kỷ niệm Ngày truyền thống HSSV 09/01 và khen thưởng đề tài nghiên cứu khoa học đạt giải.',
    orgType: 'HOI',
    programId: '3',
    programText: '3. Sinh viên học tập, sáng tạo, nghiên cứu khoa học',
    category: 'HOC_THUAT',
    metricType: 'NUMBER',
    unitOfMeasure: 'Sinh viên & Đề tài',
    targetValue: 200,
    currentValue: 142,
    completionRate: 71.0,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 5,
    isLocked: false,
    registrationDeadline: '2026-10-30',
    linkedActivityIds: ['A001'],
    linkedActivityCount: 1,
    allocations: [
      {
        id: 'alc-h03-1',
        unitCode: 'CNTT',
        unitName: 'Liên chi hội SV Khoa CNTT',
        unitType: 'KHOA',
        targetQuota: 45,
        registeredValue: 45,
        assignedValue: 45,
        currentValue: 38,
        completionRate: 84.4,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-h03-2',
        unitCode: 'KHSH',
        unitName: 'Liên chi hội SV Khoa KHSH',
        unitType: 'KHOA',
        targetQuota: 30,
        assignedValue: 0,
        currentValue: 15,
        completionRate: 50.0,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 86,
    aiForecastAnalysis: 'Đã có 142 hồ sơ đạt đủ 5/5 tiêu chuẩn SV5T trên hệ thống kiểm toán tự động. Dự kiến đợt xét cuối tháng 12/2026 sẽ vượt mốc 200 sinh viên.',
    aiSuggestedActions: [
      'Phân bổ áp đặt 30 chỉ tiêu cho LCH Khoa KHSH nếu đơn vị không đăng ký',
      'Hướng dẫn sinh viên hoàn thiện chứng chỉ ngoại ngữ B1 còn thiếu'
    ],
    evidenceChecks: [
      { id: 'ev-h3', activityId: 'A001', activityTitle: 'Hội nghị Báo cáo Đề tài NCKH Sinh viên 2026', checkedAt: '2026-10-02T10:00:00Z', participantCountVerified: 142, qrVerifiedCount: 142, aiVerificationConfidence: 0.99, status: 'VERIFIED', notes: 'Hồ sơ đạt chuẩn' }
    ],
    createdBy: {
      userId: 'usr_btk',
      userName: 'Ban Thư ký Hội Sinh viên trường',
      userEmail: 'hsvdhnonglam@hoisinhvientphcm.com',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-HOI-04',
    code: 'CT-H04',
    name: '80% Sinh viên đạt danh hiệu "Thanh niên Khỏe" hoặc đạt chuẩn Thể lực SV5T',
    description: 'Tham gia Ngày hội Thể thao Sinh viên, giải chạy truyền thống NLU Run hoặc đạt tiêu chuẩn thể lực theo quy định Hội Sinh viên.',
    orgType: 'HOI',
    programId: '4',
    programText: '4. Sinh viên rèn luyện thể chất',
    category: 'THE_LUC',
    metricType: 'PERCENTAGE',
    unitOfMeasure: '% Sinh viên',
    targetValue: 80,
    currentValue: 48.0,
    completionRate: 60.0,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 4,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: [],
    linkedActivityCount: 0,
    allocations: [
      {
        id: 'alc-h04-1',
        unitCode: 'CNTT',
        unitName: 'Liên chi hội SV Khoa CNTT',
        unitType: 'KHOA',
        targetQuota: 80,
        registeredValue: 75,
        assignedValue: 0,
        currentValue: 42,
        completionRate: 52.5,
        forecastStatus: 'NGUY_CO',
        registrationStatus: 'CHO_DUYET',
        isAutoAllocatedBySchool: false,
        actionPlan: 'Đề xuất 75% do cơ sở vật chất sân bãi hạn chế'
      },
      {
        id: 'alc-h04-2',
        unitCode: 'KT',
        unitName: 'Liên chi hội SV Khoa Kinh tế',
        unitType: 'KHOA',
        targetQuota: 80,
        assignedValue: 0,
        currentValue: 54,
        completionRate: 67.5,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'NGUY_CO',
    aiForecastProbability: 45,
    aiForecastAnalysis: 'CẢNH BÁO: Tỷ lệ đạt chuẩn thể lực hiện tại chỉ đạt 48% (mục tiêu 80%). Chưa có nhiều giải đấu cấp trường được kích hoạt trong HK1.',
    aiSuggestedActions: [
      'KHẨN CẤP: Tổ chức Giải Việt dã "NLU Green Run 2026" trong tháng 11/2026 để cấp chứng nhận Thể lực cho trên 1,500 sinh viên',
      'Cấp trường chỉ định phân bổ chỉ tiêu cho LCH Kinh tế và yêu cầu tổ chức giải bóng đá khoa'
    ],
    createdBy: {
      userId: 'usr_btk',
      userName: 'Ban Thư ký Hội Sinh viên trường',
      userEmail: 'hsvdhnonglam@hoisinhvientphcm.com',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-HOI-05',
    code: 'CT-H05',
    name: 'Đạt 2,500 lượt sinh viên tham gia Hiến máu nhân đạo và An sinh xã hội',
    description: 'Tổ chức các đợt Ngày hội Hiến máu tình nguyện "Giọt hồng Nông Lâm" và quyên góp hỗ trợ sinh viên có hoàn cảnh khó khăn.',
    orgType: 'HOI',
    programId: '5',
    programText: '5. Sinh viên tình nguyện vì cuộc sống cộng đồng',
    category: 'TRACH_NHIEM_XA_HOI',
    metricType: 'NUMBER',
    unitOfMeasure: 'Lượt tham gia',
    targetValue: 2500,
    currentValue: 1820,
    completionRate: 72.8,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 4,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: ['B001'],
    linkedActivityCount: 1,
    allocations: [
      {
        id: 'alc-h05-1',
        unitCode: 'DOI_CTXH',
        unitName: 'Đội Công tác Xã hội',
        unitType: 'CLB',
        targetQuota: 1500,
        registeredValue: 1500,
        assignedValue: 1500,
        currentValue: 1100,
        completionRate: 73.3,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-h05-2',
        unitCode: 'CNTY',
        unitName: 'Liên chi hội SV Khoa CNTY',
        unitType: 'KHOA',
        targetQuota: 400,
        assignedValue: 0,
        currentValue: 250,
        completionRate: 62.5,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 95,
    aiForecastAnalysis: 'Đã tổ chức 2 đợt hiến máu lớn thu hút hơn 1,800 lượt đăng ký. Đợt 3 dự kiến tổ chức vào tháng 03/2027 chắc chắn sẽ giúp vượt chỉ tiêu 2,500 lượt.',
    aiSuggestedActions: [
      'Phê duyệt phân bổ áp đặt cho LCH CNTY nếu không đăng ký',
      'Phối hợp Hội Chữ thập đỏ chuẩn bị quà tặng cho đợt hiến máu tiếp theo'
    ],
    evidenceChecks: [
      { id: 'ev-h5', activityId: 'B001', activityTitle: 'Ngày Hội Hiến Máu Tình Nguyện Đợt 2', checkedAt: '2026-10-02T12:00:00Z', participantCountVerified: 580, qrVerifiedCount: 575, aiVerificationConfidence: 0.98, status: 'VERIFIED', notes: 'Đối soát bệnh viện Huyết học' }
    ],
    createdBy: {
      userId: 'usr_btk',
      userName: 'Ban Thư ký Hội Sinh viên trường',
      userEmail: 'hsvdhnonglam@hoisinhvientphcm.com',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-HOI-06',
    code: 'CT-H06',
    name: '500 Sinh viên tham gia Giao lưu quốc tế và Hội nhập thanh niên toàn cầu',
    description: 'Tham gia các diễn đàn thanh niên ASEAN, chương trình trao đổi sinh viên quốc tế, cuộc thi hùng biện tiếng Anh và giao lưu văn hóa.',
    orgType: 'HOI',
    programId: '6',
    programText: '6. Sinh viên chủ động hội nhập quốc tế',
    category: 'KY_NANG',
    metricType: 'NUMBER',
    unitOfMeasure: 'Sinh viên',
    targetValue: 500,
    currentValue: 310,
    completionRate: 62.0,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 4,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: ['A002'],
    linkedActivityCount: 1,
    allocations: [
      {
        id: 'alc-h06-1',
        unitCode: 'NNSP',
        unitName: 'Liên chi hội SV Khoa NNSP',
        unitType: 'KHOA',
        targetQuota: 150,
        registeredValue: 150,
        assignedValue: 150,
        currentValue: 110,
        completionRate: 73.3,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-h06-2',
        unitCode: 'CLB_SFF',
        unitName: 'CLB Tiếng Anh SFF',
        unitType: 'CLB',
        targetQuota: 80,
        assignedValue: 0,
        currentValue: 40,
        completionRate: 50.0,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'BAO_DONG',
    aiForecastProbability: 70,
    aiForecastAnalysis: 'Tiến độ hội nhập quốc tế cần đẩy mạnh trong HK2 thông qua tuần lễ văn hóa các nước.',
    aiSuggestedActions: [
      'Cấp trường phân bổ bổ sung cho CLB Tiếng Anh SFF và CLB BEC',
      'Tổ chức Ngày hội Giao lưu Văn hóa ASEAN Sinh viên NLU 2026'
    ],
    createdBy: {
      userId: 'usr_btk',
      userName: 'Ban Thư ký Hội Sinh viên trường',
      userEmail: 'hsvdhnonglam@hoisinhvientphcm.com',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-HOI-07',
    code: 'CT-H07',
    name: 'Trao 100 suất Học bổng Đồng hành & Hỗ trợ 2,000 lượt sinh viên tiếp cận việc làm',
    description: 'Vận động các doanh nghiệp, cựu sinh viên tài trợ học bổng vượt khó; tổ chức Ngày hội Việc làm & Khởi nghiệp NLU Career Fair.',
    orgType: 'HOI',
    programId: '7',
    programText: '7. Chương trình tư vấn, đồng hành, hỗ trợ sinh viên',
    category: 'TRACH_NHIEM_XA_HOI',
    metricType: 'NUMBER',
    unitOfMeasure: 'Suất học bổng',
    targetValue: 100,
    currentValue: 68,
    completionRate: 68.0,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 4,
    isLocked: false,
    registrationDeadline: '2026-10-25',
    linkedActivityIds: [],
    linkedActivityCount: 0,
    allocations: [
      {
        id: 'alc-h07-1',
        unitCode: 'CLB_DH',
        unitName: 'CLB Đồng hành',
        unitType: 'CLB',
        targetQuota: 40,
        registeredValue: 40,
        assignedValue: 40,
        currentValue: 32,
        completionRate: 80.0,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 1,
    unregisteredUnitsCount: 0,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 88,
    aiForecastAnalysis: 'Đã trao 68 suất học bổng đầu năm học. Dự kiến đợt học bổng Tết 2027 sẽ trao thêm 40 suất.',
    aiSuggestedActions: [
      'Mở đợt vận động Quỹ Đồng hành Sinh viên Nông Lâm vượt khó học kỳ 2'
    ],
    createdBy: {
      userId: 'usr_btk',
      userName: 'Ban Thư ký Hội Sinh viên trường',
      userEmail: 'hsvdhnonglam@hoisinhvientphcm.com',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  },
  {
    id: 'CT-HOI-08',
    code: 'CT-H08',
    name: 'Kết nạp 3,000 Hội viên mới & Thành lập ít nhất 02 CLB - Đội - Nhóm mới',
    description: 'Tổ chức kết nạp Hội viên cho sinh viên khóa mới; hỗ trợ ươm mầm các CLB học thuật, năng khiếu và tình nguyện mới thành lập.',
    orgType: 'HOI',
    programId: '8',
    programText: '8. Chương trình xây dựng Hội Sinh viên Việt Nam vững mạnh',
    category: 'TO_CHUC_DOAN_HOI',
    metricType: 'NUMBER',
    unitOfMeasure: 'Hội viên',
    targetValue: 3000,
    currentValue: 2750,
    completionRate: 91.7,
    academicYear: 'Năm học 2026-2027',
    semester: 'ALL',
    level: 'TRUONG',
    priorityWeight: 5,
    isLocked: false,
    registrationDeadline: '2026-10-20',
    linkedActivityIds: [],
    linkedActivityCount: 0,
    allocations: [
      {
        id: 'alc-h08-1',
        unitCode: 'CNTT',
        unitName: 'Liên chi hội SV Khoa CNTT',
        unitType: 'KHOA',
        targetQuota: 450,
        registeredValue: 450,
        assignedValue: 450,
        currentValue: 420,
        completionRate: 93.3,
        forecastStatus: 'DAT',
        registrationStatus: 'DA_DUYET',
        isAutoAllocatedBySchool: false
      },
      {
        id: 'alc-h08-2',
        unitCode: 'KT',
        unitName: 'Liên chi hội SV Khoa Kinh tế',
        unitType: 'KHOA',
        targetQuota: 500,
        assignedValue: 0,
        currentValue: 380,
        completionRate: 76.0,
        forecastStatus: 'BAO_DONG',
        registrationStatus: 'CHUA_DANG_KY',
        isAutoAllocatedBySchool: false
      }
    ],
    allocatedUnitsCount: 2,
    unregisteredUnitsCount: 1,
    aiForecastStatus: 'DAT',
    aiForecastProbability: 97,
    aiForecastAnalysis: '2,750 tân sinh viên K24 đã được cấp thẻ Hội viên điện tử. Chỉ tiêu sắp hoàn thành vượt mức.',
    aiSuggestedActions: [
      'Cấp trường chỉ định phân bổ 500 chỉ tiêu cho LCH Kinh tế',
      'Thành lập CLB Trí tuệ Nhân tạo và Dữ liệu lớn NLU (AI & Data Club)'
    ],
    createdBy: {
      userId: 'usr_btk',
      userName: 'Ban Thư ký Hội Sinh viên trường',
      userEmail: 'hsvdhnonglam@hoisinhvientphcm.com',
      roleLevel: 4
    },
    createdAt: '2026-09-01T08:00:00Z',
    updatedAt: '2026-10-08T07:00:00Z'
  }
];

/**
 * AI Forecast & Progress Calculation Helper
 */
export function calculateTargetAiForecast(target: TargetItem, elapsedMonths: number = 2, totalMonths: number = 10): {
  completionRate: number;
  status: TargetAiForecastStatus;
  probability: number;
  analysis: string;
  suggestedActions: string[];
} {
  const targetVal = target.targetValue || 1;
  const currentVal = target.currentValue || 0;
  const completionRate = Math.min(100, Math.round((currentVal / targetVal) * 1000) / 10);

  const timeRatio = Math.max(0.1, Math.min(1, elapsedMonths / totalMonths));
  const expectedAtThisTime = timeRatio * 100;
  const performanceRatio = completionRate / expectedAtThisTime;

  let status: TargetAiForecastStatus = 'DAT';
  let probability = 85;

  if (performanceRatio >= 0.9) {
    status = 'DAT';
    probability = Math.min(99, Math.round(75 + performanceRatio * 20));
  } else if (performanceRatio >= 0.65) {
    status = 'BAO_DONG';
    probability = Math.round(50 + performanceRatio * 25);
  } else {
    status = 'NGUY_CO';
    probability = Math.max(15, Math.round(performanceRatio * 50));
  }

  let analysis = '';
  if (status === 'DAT') {
    analysis = `Tiến độ thực tế đạt ${completionRate}%, vượt so với kỳ vọng ${Math.round(expectedAtThisTime)}% ở mốc thời gian này. Dự báo hoàn thành tốt mục tiêu đề ra.`;
  } else if (status === 'BAO_DONG') {
    analysis = `BÁO ĐỘNG: Tiến độ thực tế ${completionRate}% đang chậm hơn mức kỳ vọng ${Math.round(expectedAtThisTime)}%. Cần đẩy nhanh tổ chức các hoạt động quy mô lớn trong quý tới.`;
  } else {
    analysis = `NGUY CƠ THIẾU HỤT: Tiến độ chỉ đạt ${completionRate}% so với mốc thời gian ${Math.round(expectedAtThisTime)}%. Cần kích hoạt chiến dịch khẩn cấp và rà soát các đơn vị chậm trễ.`;
  }

  const suggestedActions = [...(target.aiSuggestedActions || [])];
  if (status === 'NGUY_CO' && !suggestedActions.some(a => a.includes('KHẨN CẤP'))) {
    suggestedActions.unshift(`Kích hoạt họp giao ban đột xuất giữa Ban Thường vụ với các đơn vị chưa đạt 50% chỉ tiêu [${target.code}]`);
  }

  return {
    completionRate,
    status,
    probability,
    analysis,
    suggestedActions
  };
}

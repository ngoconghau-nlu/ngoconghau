import { ScoringCatalogItem } from '../types';

/**
 * Danh mục Khen thưởng hằng năm (Cấp 4 có thể cấu hình)
 * Quy định: Sinh viên được nộp nhiều minh chứng nhưng chỉ tính 01 mức điểm cao nhất.
 */
export const INITIAL_ANNUAL_AWARDS_CATALOG: ScoringCatalogItem[] = [
  {
    id: 'AW_TW',
    code: 'AW_TW',
    title: 'Bằng khen Trung ương Đoàn / Trung ương Hội Sinh viên Việt Nam',
    points: 25,
    category: 'KHEN_THUONG',
    level: 'Cấp Trung ương',
    description: 'Bằng khen do Ban Chấp hành Trung ương Đoàn hoặc Trung ương Hội SVVN trao tặng.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'AW_TP',
    code: 'AW_TP',
    title: 'Bằng khen Thành Đoàn TP.HCM / Hội Sinh viên TP.HCM / UBND TP.HCM',
    points: 20,
    category: 'KHEN_THUONG',
    level: 'Cấp Thành phố',
    description: 'Khen thưởng cấp Thành phố cho thành tích xuất sắc trong công tác Đoàn - Hội và phong trào sinh viên.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'AW_TRUONG_HT',
    code: 'AW_TRUONG_HT',
    title: 'Giấy khen Hiệu trưởng Trường Đại học Nông Lâm TP.HCM',
    points: 15,
    category: 'KHEN_THUONG',
    level: 'Cấp Trường',
    description: 'Giấy khen toàn diện của Hiệu trưởng nhà trường ghi nhận đóng góp và thành tích học tập, rèn luyện.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'AW_TRUONG_DT',
    code: 'AW_TRUONG_DT',
    title: 'Giấy khen Ban Thường vụ Đoàn trường / Ban Thư ký Hội SV Trường',
    points: 12,
    category: 'KHEN_THUONG',
    level: 'Cấp Trường',
    description: 'Giấy khen cấp Trường do Đoàn Thanh niên hoặc Hội Sinh viên Trường NLU trao tặng.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'AW_KHOA',
    code: 'AW_KHOA',
    title: 'Giấy khen Ban Chấp hành Đoàn Khoa / Liên chi hội Khoa',
    points: 8,
    category: 'KHEN_THUONG',
    level: 'Cấp Khoa',
    description: 'Giấy khen ghi nhận thành tích cấp Khoa / Bộ môn trực thuộc.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'AW_CO_SO',
    code: 'AW_CO_SO',
    title: 'Giấy khen / Thư khen Chi đoàn / Câu lạc bộ / Đơn vị phối hợp',
    points: 5,
    category: 'KHEN_THUONG',
    level: 'Cấp Chi đoàn / CLB',
    description: 'Khen thưởng biểu dương cấp cơ sở hoặc đơn vị địa phương nơi tình nguyện.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  }
];

/**
 * Danh mục Nghiên cứu khoa học (NCKH) & Đổi mới sáng tạo (Cấp 4 có thể cấu hình)
 * Quy định: Sinh viên được nộp nhiều minh chứng nhưng chỉ tính 01 mức điểm cao nhất.
 */
export const INITIAL_RESEARCH_AWARDS_CATALOG: ScoringCatalogItem[] = [
  {
    id: 'NCKH_EUREKA_1',
    code: 'NCKH_EUREKA_1',
    title: 'Giải Nhất Giải thưởng Sinh viên NCKH Euréka / NCKH Cấp Bộ',
    points: 30,
    category: 'NCKH',
    level: 'Cấp Quốc gia / Bộ',
    description: 'Đạt giải Nhất tại Giải thưởng Sinh viên NCKH Euréka toàn quốc hoặc cấp Bộ GD&ĐT.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'NCKH_EUREKA_2',
    code: 'NCKH_EUREKA_2',
    title: 'Giải Nhì / Giải Ba Giải thưởng Sinh viên NCKH Euréka / Cấp Bộ',
    points: 25,
    category: 'NCKH',
    level: 'Cấp Quốc gia / Bộ',
    description: 'Đạt giải Nhì hoặc Ba tại các cuộc thi khoa học quy mô toàn quốc, cấp Bộ.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'NCKH_EUREKA_KK',
    code: 'NCKH_EUREKA_KK',
    title: 'Giải Khuyến khích Euréka / Giải thưởng NCKH cấp Tỉnh - Thành',
    points: 20,
    category: 'NCKH',
    level: 'Cấp Tỉnh / Thành',
    description: 'Đạt giải Khuyến khích Euréka hoặc giải thưởng sáng tạo cấp Tỉnh/Thành phố.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'NCKH_BAI_BAO',
    code: 'NCKH_BAI_BAO',
    title: 'Bài báo khoa học đăng trên Tạp chí Quốc tế (Scopus/WoS) / Tạp chí chuyên ngành uy tín',
    points: 22,
    category: 'NCKH',
    level: 'Cấp Quốc tế / Quốc gia',
    description: 'Tác giả hoặc đồng tác giả bài báo khoa học xuất bản trên tạp chí có chỉ số ISSN/Scopus.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'NCKH_TRUONG_1',
    code: 'NCKH_TRUONG_1',
    title: 'Đề tài NCKH Sinh viên Cấp Trường đạt Giải Nhất / Xuất sắc',
    points: 18,
    category: 'NCKH',
    level: 'Cấp Trường',
    description: 'Đề tài NCKH sinh viên Trường ĐH Nông Lâm TP.HCM nghiệm thu xếp loại Xuất sắc / Giải Nhất hội nghị sinh viên NCKH.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'NCKH_TRUONG_2',
    code: 'NCKH_TRUONG_2',
    title: 'Đề tài NCKH Sinh viên Cấp Trường đạt Giải Nhì / Ba',
    points: 14,
    category: 'NCKH',
    level: 'Cấp Trường',
    description: 'Đề tài NCKH sinh viên nghiệm thu xếp loại Tốt / Giải Nhì, Ba cấp Trường.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'NCKH_TRUONG_DAT',
    code: 'NCKH_TRUONG_DAT',
    title: 'Đề tài NCKH Sinh viên Cấp Trường nghiệm thu Đạt',
    points: 10,
    category: 'NCKH',
    level: 'Cấp Trường',
    description: 'Đề tài NCKH sinh viên bảo vệ thành công và được Hội đồng cấp Trường nghiệm thu Đạt.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'NCKH_HOI_THAO',
    code: 'NCKH_HOI_THAO',
    title: 'Báo cáo viên / Trưng bày Poster tại Hội thảo Khoa học các cấp',
    points: 6,
    category: 'NCKH',
    level: 'Cấp Hội thảo',
    description: 'Tham gia trình bày báo cáo hoặc poster khoa học tại hội thảo do Trường / Khoa tổ chức.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  }
];

/**
 * Danh mục Chức vụ & Cán bộ Đoàn - Hội (Cấp 4 có thể cấu hình)
 * Quy định: Sinh viên giữ nhiều chức vụ nhưng chỉ tính 01 mức điểm cao nhất.
 */
export const INITIAL_POSITION_ROLES_CATALOG: ScoringCatalogItem[] = [
  {
    id: 'POS_BTV_TRUONG',
    code: 'POS_BTV_TRUONG',
    title: 'UV Ban Thường vụ Đoàn trường / Ban Thư ký Hội Sinh viên trường',
    points: 20,
    category: 'CHUC_VU',
    level: 'Cấp Trường (BTV)',
    description: 'Ủy viên Ban Thường vụ Đoàn trường, Ban Thư ký Hội SV trường ĐH Nông Lâm TP.HCM.',
    maxCapNote: 'Chỉ tính 01 chức vụ có điểm cao nhất',
    active: true
  },
  {
    id: 'POS_BCH_TRUONG',
    code: 'POS_BCH_TRUONG',
    title: 'UV Ban Chấp hành Đoàn trường / Hội Sinh viên trường',
    points: 16,
    category: 'CHUC_VU',
    level: 'Cấp Trường (BCH)',
    description: 'Ủy viên Ban Chấp hành Đoàn trường, Ban Chấp hành Hội Sinh viên trường.',
    maxCapNote: 'Chỉ tính 01 chức vụ có điểm cao nhất',
    active: true
  },
  {
    id: 'POS_BT_KHOA',
    code: 'POS_BT_KHOA',
    title: 'Bí thư Đoàn Khoa / Liên chi hội trưởng Khoa',
    points: 14,
    category: 'CHUC_VU',
    level: 'Cấp Khoa (Trưởng)',
    description: 'Người đứng đầu tổ chức Đoàn - Hội cấp Khoa, Bộ môn.',
    maxCapNote: 'Chỉ tính 01 chức vụ có điểm cao nhất',
    active: true
  },
  {
    id: 'POS_PBT_KHOA',
    code: 'POS_PBT_KHOA',
    title: 'Phó Bí thư Đoàn Khoa / LCH Phó / Chủ nhiệm CLB-Đội-Nhóm cấp Trường',
    points: 12,
    category: 'CHUC_VU',
    level: 'Cấp Khoa (Phó) / CLB Trường',
    description: 'Phó Bí thư Đoàn Khoa, Liên chi hội phó, Chủ nhiệm các CLB trực thuộc Đoàn - Hội trường.',
    maxCapNote: 'Chỉ tính 01 chức vụ có điểm cao nhất',
    active: true
  },
  {
    id: 'POS_BT_CHIDOAN',
    code: 'POS_BT_CHIDOAN',
    title: 'Bí thư Chi đoàn / Chi hội trưởng / Lớp trưởng',
    points: 10,
    category: 'CHUC_VU',
    level: 'Cấp Chi đoàn (Trưởng)',
    description: 'Bí thư Chi đoàn sinh viên, Chi hội trưởng, Lớp trưởng các lớp học phần/khóa.',
    maxCapNote: 'Chỉ tính 01 chức vụ có điểm cao nhất',
    active: true
  },
  {
    id: 'POS_UV_BCH_KHOA',
    code: 'POS_UV_BCH_KHOA',
    title: 'UV Ban Chấp hành Đoàn Khoa / Ban Chủ nhiệm CLB cấp Khoa',
    points: 8,
    category: 'CHUC_VU',
    level: 'Cấp Khoa (UV)',
    description: 'Ủy viên Ban Chấp hành Đoàn Khoa, Ban Chủ nhiệm CLB thuộc Khoa.',
    maxCapNote: 'Chỉ tính 01 chức vụ có điểm cao nhất',
    active: true
  },
  {
    id: 'POS_PBT_CHIDOAN',
    code: 'POS_PBT_CHIDOAN',
    title: 'Phó Bí thư Chi đoàn / Chi hội phó / Lớp phó',
    points: 7,
    category: 'CHUC_VU',
    level: 'Cấp Chi đoàn (Phó)',
    description: 'Phó Bí thư Chi đoàn, Chi hội phó, Lớp phó phụ trách phong trào/học tập.',
    maxCapNote: 'Chỉ tính 01 chức vụ có điểm cao nhất',
    active: true
  },
  {
    id: 'POS_CAN_SU',
    code: 'POS_CAN_SU',
    title: 'Cán sự lớp / Nhóm trưởng chuyên trách / Thành viên ban điều hành',
    points: 5,
    category: 'CHUC_VU',
    level: 'Cấp Nhóm / Cán sự',
    description: 'Tổ trưởng, cán sự bộ môn hoặc phụ trách chuyên trách các mảng công tác.',
    maxCapNote: 'Chỉ tính 01 chức vụ có điểm cao nhất',
    active: true
  }
];

/**
 * Danh mục Đảng viên hướng dẫn & Đoàn viên ưu tú (Cấp 4 có thể cấu hình)
 * Quy định: Sinh viên được nộp nhiều minh chứng nhưng chỉ tính 01 mức điểm cao nhất.
 */
export const INITIAL_PARTY_MENTOR_CATALOG: ScoringCatalogItem[] = [
  {
    id: 'PARTY_HUONG_DAN',
    code: 'PARTY_HUONG_DAN',
    title: 'Đảng viên chính thức được phân công hướng dẫn bồi dưỡng phát triển Đảng',
    points: 15,
    category: 'DANG_VIEN_HUONG_DAN',
    level: 'Chi bộ phân công',
    description: 'Đảng viên sinh viên chính thức được Chi bộ giao nhiệm vụ kèm cặp, theo dõi và giúp đỡ quần chúng ưu tú kết nạp Đảng.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'PARTY_DV_UU_TU',
    code: 'PARTY_DV_UU_TU',
    title: 'Đoàn viên ưu tú được chi bộ ra nghị quyết bồi dưỡng & hoàn thành lớp Nhận thức về Đảng',
    points: 12,
    category: 'DANG_VIEN_HUONG_DAN',
    level: 'Đoàn viên ưu tú',
    description: 'Đoàn viên ưu tú được bình xét xếp loại xuất sắc, được cử tham gia và nhận chứng chỉ bồi dưỡng nhận thức về Đảng.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'PARTY_TIEN_TIEN',
    code: 'PARTY_TIEN_TIEN',
    title: 'Thanh niên tiên tiến làm theo lời Bác cấp Trường trở lên',
    points: 10,
    category: 'DANG_VIEN_HUONG_DAN',
    level: 'Tuyên dương cấp Trường',
    description: 'Được tuyên dương danh hiệu Thanh niên tiên tiến làm theo lời Bác tiêu biểu trong năm học.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  },
  {
    id: 'PARTY_GIOI_THIEU',
    code: 'PARTY_GIOI_THIEU',
    title: 'Cán bộ Đoàn trực tiếp thẩm tra, giới thiệu đoàn viên ưu tú vào Đảng',
    points: 8,
    category: 'DANG_VIEN_HUONG_DAN',
    level: 'Cán bộ thẩm tra',
    description: 'Bí thư/Phó Bí thư Chi đoàn tham gia thẩm tra hồ sơ lý lịch và làm biên bản giới thiệu đoàn viên ưu tú cho Đảng ủy.',
    maxCapNote: 'Chỉ tính 01 mức điểm cao nhất trong năm học',
    active: true
  }
];

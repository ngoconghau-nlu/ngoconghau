import { SystemTermItem } from '../types';

export const DEFAULT_SYSTEM_TERMS: SystemTermItem[] = [
  // 1. TITLES_DESCRIPTIONS (Tiêu Đề & Mô Tả Trang)
  {
    id: 'term_app_title',
    key: 'term_app_title',
    originalText: 'SỔ TAY ĐOÀN VIÊN & THI ĐUA RÈN LUYỆN',
    customText: 'SỔ TAY ĐOÀN VIÊN & THI ĐUA RÈN LUYỆN',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Tiêu đề chính hiển thị ở thanh Tiêu đề (Header) và Trang chủ hệ thống'
  },
  {
    id: 'term_app_subtitle',
    key: 'term_app_subtitle',
    originalText: 'Hệ thống Quản lý Hoạt động Phong trào, Điểm rèn luyện & Tuyên dương Sinh viên 5 tốt',
    customText: 'Hệ thống Quản lý Hoạt động Phong trào, Điểm rèn luyện & Tuyên dương Sinh viên 5 tốt',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Dòng mô tả phụ dưới tên hệ thống'
  },
  {
    id: 'term_dashboard_hero_title',
    key: 'term_dashboard_hero_title',
    originalText: 'Tổng Quan Thi Đua & Hoạt Động Phong Trào',
    customText: 'Tổng Quan Thi Đua & Hoạt Động Phong Trào',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Tiêu đề khối Thống kê tổng quan trên Dashboard'
  },
  {
    id: 'term_dashboard_hero_desc',
    key: 'term_dashboard_hero_desc',
    originalText: 'Thống kê thời gian thực số lượng Đoàn viên, Lượt tham gia hoạt động và Điểm rèn luyện đồng bộ 100%',
    customText: 'Thống kê thời gian thực số lượng Đoàn viên, Lượt tham gia hoạt động và Điểm rèn luyện đồng bộ 100%',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Nội dung mô tả khối Dashboard tổng quan'
  },
  {
    id: 'term_score_roster_title',
    key: 'term_score_roster_title',
    originalText: 'Sổ Điểm Rèn Luyện & Bảng Thi Đua Cán Bộ Đoàn - Sinh Viên',
    customText: 'Sổ Điểm Rèn Luyện & Bảng Thi Đua Cán Bộ Đoàn - Sinh Viên',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Tiêu đề phân hệ quản lý Sổ điểm rèn luyện & xếp loại thi đua'
  },
  {
    id: 'term_score_roster_desc',
    key: 'term_score_roster_desc',
    originalText: 'Theo dõi danh sách Đoàn viên, tổng hợp điểm rèn luyện, khen thưởng, chức vụ và xét duyệt SV5T',
    customText: 'Theo dõi danh sách Đoàn viên, tổng hợp điểm rèn luyện, khen thưởng, chức vụ và xét duyệt SV5T',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Mô tả chi tiết phân hệ Sổ điểm rèn luyện'
  },
  {
    id: 'term_activity_mgmt_title',
    key: 'term_activity_mgmt_title',
    originalText: 'Quản Lý Hoạt Động Phong Trào & Sự Kiện Đoàn - Hội',
    customText: 'Quản Lý Hoạt Động Phong Trào & Sự Kiện Đoàn - Hội',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Tiêu đề phân hệ Quản lý hoạt động phong trào'
  },
  {
    id: 'term_activity_mgmt_desc',
    key: 'term_activity_mgmt_desc',
    originalText: 'Tạo mới, phân cấp chương trình, xét duyệt kế hoạch và điểm danh sinh viên tham gia',
    customText: 'Tạo mới, phân cấp chương trình, xét duyệt kế hoạch và điểm danh sinh viên tham gia',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Mô tả chi tiết phân hệ Quản lý hoạt động phong trào'
  },
  {
    id: 'term_cert_mgmt_title',
    key: 'term_cert_mgmt_title',
    originalText: 'Quản Lý & Phát Hành Giấy Chứng Nhận Điện Tử',
    customText: 'Quản Lý & Phát Hành Giấy Chứng Nhận Điện Tử',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Tiêu đề phân hệ Quản lý & cấp phát Giấy chứng nhận'
  },
  {
    id: 'term_cert_mgmt_desc',
    key: 'term_cert_mgmt_desc',
    originalText: 'Thiết kế mẫu phôi, phát hành và xác thực chứng nhận điện tử QR Code cho sinh viên',
    customText: 'Thiết kế mẫu phôi, phát hành và xác thực chứng nhận điện tử QR Code cho sinh viên',
    category: 'TITLES_DESCRIPTIONS',
    description: 'Mô tả chi tiết phân hệ Giấy chứng nhận điện tử'
  },

  // 2. SYSTEM_NOTICES (Thông Báo & Ghi Chú System)
  {
    id: 'term_sync_notice_title',
    key: 'term_sync_notice_title',
    originalText: 'Đồng Bộ Dữ Liệu Thời Gian Thực 3 Phân Hệ',
    customText: 'Đồng Bộ Dữ Liệu Thời Gian Thực 3 Phân Hệ',
    category: 'SYSTEM_NOTICES',
    description: 'Tiêu đề thông báo trạng thái đồng bộ dữ liệu giữa Sinh viên, Hoạt động & Thi đua'
  },
  {
    id: 'term_sync_notice_desc',
    key: 'term_sync_notice_desc',
    originalText: 'Hệ thống tự động liên kết và đối soát dữ liệu 100% giữa danh sách Đoàn viên và lượt tham gia hoạt động phong trào',
    customText: 'Hệ thống tự động liên kết và đối soát dữ liệu 100% giữa danh sách Đoàn viên và lượt tham gia hoạt động phong trào',
    category: 'SYSTEM_NOTICES',
    description: 'Nội dung chi tiết thông báo đồng bộ dữ liệu'
  },
  {
    id: 'term_score_audit_notice',
    key: 'term_score_audit_notice',
    originalText: 'Nhật Ký Kiểm Toán Minh Bạch',
    customText: 'Nhật Ký Kiểm Toán Minh Bạch',
    category: 'SYSTEM_NOTICES',
    description: 'Thông báo ghi vết audit log mỗi khi điều chỉnh điểm rèn luyện hoặc minh chứng'
  },
  {
    id: 'term_activity_lock_notice',
    key: 'term_activity_lock_notice',
    originalText: 'Lưu Ý Về Khóa Sổ Dữ Liệu Hoạt Động',
    customText: 'Lưu Ý Về Khóa Sổ Dữ Liệu Hoạt Động',
    category: 'SYSTEM_NOTICES',
    description: 'Cảnh báo khi khóa dữ liệu hoạt động cấp Trường'
  },

  // 3. SECTION_LABELS (Thẻ Nhãn & Tiêu Đề Bảng Biểu)
  {
    id: 'term_label_mssv',
    key: 'term_label_mssv',
    originalText: 'Mã Số Sinh Viên (MSSV)',
    customText: 'Mã Số Sinh Viên (MSSV)',
    category: 'SECTION_LABELS',
    description: 'Tiêu đề cột MSSV trên các bảng dữ liệu'
  },
  {
    id: 'term_label_fullname',
    key: 'term_label_fullname',
    originalText: 'Họ Và Tên Đoàn Viên',
    customText: 'Họ Và Tên Đoàn Viên',
    category: 'SECTION_LABELS',
    description: 'Tiêu đề cột Họ tên sinh viên / đoàn viên'
  },
  {
    id: 'term_label_class',
    key: 'term_label_class',
    originalText: 'Chi Đoàn / Lớp Sinh Hoạt',
    customText: 'Chi Đoàn / Lớp Sinh Hoạt',
    category: 'SECTION_LABELS',
    description: 'Nhãn danh mục lớp / chi đoàn'
  },
  {
    id: 'term_label_faculty',
    key: 'term_label_faculty',
    originalText: 'Đoàn Khoa / Đơn Vị Quản Lý',
    customText: 'Đoàn Khoa / Đơn Vị Quản Lý',
    category: 'SECTION_LABELS',
    description: 'Nhãn danh mục Khoa / Đơn vị'
  },
  {
    id: 'term_label_total_score',
    key: 'term_label_total_score',
    originalText: 'Tổng Điểm Rèn Luyện',
    customText: 'Tổng Điểm Rèn Luyện',
    category: 'SECTION_LABELS',
    description: 'Nhãn cột Tổng điểm rèn luyện'
  },
  {
    id: 'term_label_rank_grade',
    key: 'term_label_rank_grade',
    originalText: 'Xếp Loại Nhiệm Vụ Đoàn Viên',
    customText: 'Xếp Loại Nhiệm Vụ Đoàn Viên',
    category: 'SECTION_LABELS',
    description: 'Nhãn mức đánh giá nhiệm vụ (Xuất sắc / Tốt / Hoàn thành)'
  },

  // 4. CERTIFICATES_REPORTS (Báo Cáo & Giấy Chứng Nhận)
  {
    id: 'term_cert_org_title',
    key: 'term_cert_org_title',
    originalText: 'BAN CHẤP HÀNH ĐOÀN TRƯỜNG',
    customText: 'BAN CHẤP HÀNH ĐOÀN TRƯỜNG',
    category: 'CERTIFICATES_REPORTS',
    description: 'Tiêu đề đơn vị phát hành trên Giấy chứng nhận điện tử'
  },
  {
    id: 'term_cert_signatory',
    key: 'term_cert_signatory',
    originalText: 'TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG - BÍ THƯ',
    customText: 'TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG - BÍ THƯ',
    category: 'CERTIFICATES_REPORTS',
    description: 'Chức danh người ký duyệt chứng nhận'
  },
  {
    id: 'term_report_pdf_header',
    key: 'term_report_pdf_header',
    originalText: 'BÁO CÁO THỐNG KÊ KẾT QUẢ RÈN LUYỆN & THI ĐUA ĐOÀN VIÊN',
    customText: 'BÁO CÁO THỐNG KÊ KẾT QUẢ RÈN LUYỆN & THI ĐUA ĐOÀN VIÊN',
    category: 'CERTIFICATES_REPORTS',
    description: 'Tiêu đề mẫu xuất báo cáo file PDF / Báo cáo thi đua'
  },

  // 5. ORGANIZATION
  {
    id: 'term_doan_vien',
    key: 'term_doan_vien',
    originalText: 'Đoàn viên',
    customText: 'Đoàn viên',
    category: 'ORGANIZATION',
    description: 'Danh xưng đoàn viên thanh niên trong toàn bộ danh mục sinh viên và bảng thống kê'
  },
  {
    id: 'term_chi_doan',
    key: 'term_chi_doan',
    originalText: 'Chi đoàn',
    customText: 'Chi đoàn',
    category: 'ORGANIZATION',
    description: 'Tên gọi cấp cơ sở Chi đoàn / Lớp trực thuộc Đoàn Khoa'
  },
  {
    id: 'term_doan_khoa',
    key: 'term_doan_khoa',
    originalText: 'Đoàn Khoa & Đơn vị',
    customText: 'Đoàn Khoa & Đơn vị',
    category: 'ORGANIZATION',
    description: 'Tên gọi các Đoàn Khoa, Liên chi đoàn và Đơn vị trực thuộc Đoàn Trường'
  },
  {
    id: 'term_doan_truong',
    key: 'term_doan_truong',
    originalText: 'Đoàn Trường',
    customText: 'Đoàn Trường',
    category: 'ORGANIZATION',
    description: 'Tên gọi Ban Thường vụ / Đoàn Thanh niên Cấp Trường'
  },
  {
    id: 'term_clb_doi_nhom',
    key: 'term_clb_doi_nhom',
    originalText: 'Câu lạc bộ / Đội / Nhóm',
    customText: 'Câu lạc bộ / Đội / Nhóm',
    category: 'ORGANIZATION',
    description: 'Tên gọi các tổ chức, CLB, Đội, Nhóm sinh viên thuộc Trường'
  },

  // 6. SCORE_EMULATION
  {
    id: 'term_so_diem_ren_luyen',
    key: 'term_so_diem_ren_luyen',
    originalText: 'Sổ Điểm Rèn Luyện',
    customText: 'Sổ Điểm Rèn Luyện',
    category: 'SCORE_EMULATION',
    description: 'Tên phân hệ theo dõi và đánh giá điểm rèn luyện của sinh viên'
  },
  {
    id: 'term_diem_ren_luyen',
    key: 'term_diem_ren_luyen',
    originalText: 'Điểm Rèn Luyện',
    customText: 'Điểm Rèn Luyện',
    category: 'SCORE_EMULATION',
    description: 'Nhãn hiển thị thang điểm rèn luyện trung bình học kỳ / năm học'
  },
  {
    id: 'term_xep_loai_thi_dua',
    key: 'term_xep_loai_thi_dua',
    originalText: 'Xếp Loại Thi Đua',
    customText: 'Xếp Loại Thi Đua',
    category: 'SCORE_EMULATION',
    description: 'Tên danh mục phân loại xếp loại thi đua cá nhân và tập thể'
  },
  {
    id: 'term_sinh_vien_5_tot',
    key: 'term_sinh_vien_5_tot',
    originalText: 'Sinh Viên 5 Tốt',
    customText: 'Sinh Viên 5 Tốt',
    category: 'SCORE_EMULATION',
    description: 'Tên phong trào và danh hiệu tuyên dương Sinh viên 5 tốt'
  },

  // 7. ACTIVITIES
  {
    id: 'term_hoat_dong',
    key: 'term_hoat_dong',
    originalText: 'Hoạt Động Phong Trào',
    customText: 'Hoạt Động Phong Trào',
    category: 'ACTIVITIES',
    description: 'Tên gọi phân hệ quản lý hoạt động, sự kiện và phong trào sinh viên'
  },
  {
    id: 'term_luot_tham_gia',
    key: 'term_luot_tham_gia',
    originalText: 'Lượt Tham Gia Hoạt Động',
    customText: 'Lượt Tham Gia Hoạt Động',
    category: 'ACTIVITIES',
    description: 'Chỉ số lượt đoàn viên thanh niên đăng ký và tham gia thực tế các hoạt động'
  },
  {
    id: 'term_minh_chung',
    key: 'term_minh_chung',
    originalText: 'Minh Chứng Hoạt Động',
    customText: 'Minh Chứng Hoạt Động',
    category: 'ACTIVITIES',
    description: 'Tài liệu, hình ảnh, liên kết minh chứng điểm tham gia của sinh viên'
  },
  {
    id: 'term_giay_chung_nhan',
    key: 'term_giay_chung_nhan',
    originalText: 'Giấy Chứng Nhận',
    customText: 'Giấy Chứng Nhận',
    category: 'ACTIVITIES',
    description: 'Tên văn bản / Chứng nhận điện tử cấp cho sinh viên hoàn thành hoạt động'
  },

  // 8. SYSTEM_ROLES
  {
    id: 'term_cap_1_sinh_vien',
    key: 'term_cap_1_sinh_vien',
    originalText: 'Cấp 1: Đoàn Viên / Sinh Viên',
    customText: 'Cấp 1: Đoàn Viên / Sinh Viên',
    category: 'SYSTEM_ROLES',
    description: 'Tên phân quyền tài khoản cá nhân cấp sinh viên'
  },
  {
    id: 'term_cap_2_chi_doan',
    key: 'term_cap_2_chi_doan',
    originalText: 'Cấp 2: Ban Chấp Hành Chi Đoàn',
    customText: 'Cấp 2: Ban Chấp Hành Chi Đoàn',
    category: 'SYSTEM_ROLES',
    description: 'Tên phân quyền quản lý tài khoản cấp Chi đoàn / Lớp'
  },
  {
    id: 'term_cap_3_doan_khoa',
    key: 'term_cap_3_doan_khoa',
    originalText: 'Cấp 3: Ban Chấp Hành Đoàn Khoa',
    customText: 'Cấp 3: Ban Chấp Hành Đoàn Khoa',
    category: 'SYSTEM_ROLES',
    description: 'Tên phân quyền quản lý tài khoản cấp Đoàn Khoa / Đơn vị'
  },
  {
    id: 'term_cap_4_cap_truong',
    key: 'term_cap_4_cap_truong',
    originalText: 'Cấp 4: Ban Thường Vụ Đoàn Trường',
    customText: 'Cấp 4: Ban Thường Vụ Đoàn Trường',
    category: 'SYSTEM_ROLES',
    description: 'Tên phân quyền quản trị cao nhất hệ thống Cấp Trường'
  },

  // 9. GENERAL
  {
    id: 'term_tong_so_doan_vien',
    key: 'term_tong_so_doan_vien',
    originalText: 'Tổng Số Đoàn Viên',
    customText: 'Tổng Số Đoàn Viên',
    category: 'GENERAL',
    description: 'Chỉ số thống kê tổng số lượng đoàn viên đồng bộ 100% toàn hệ thống'
  },
  {
    id: 'term_dong_bo_du_lieu',
    key: 'term_dong_bo_du_lieu',
    originalText: 'Đồng Bộ Dữ Liệu 3 Phân Hệ',
    customText: 'Đồng Bộ Dữ Liệu 3 Phân Hệ',
    category: 'GENERAL',
    description: 'Tên quy trình chuẩn hóa và kiểm tra sai lệch số liệu giữa Sinh viên, Hoạt động, Thi đua'
  }
];

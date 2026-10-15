import { Organization, BranchClass, ParticipantRoleType, HostLevel, ActivitySubmission, StudentScoreRecord, StudentSelfProof, ProgramPersonnelQuota } from '../types';

export const CURRENT_ACADEMIC_YEAR = 'Năm học 2026-2027';

export const HOST_LEVEL_POINTS: { id: number; name: string; points: number; hostLevel: HostLevel }[] = [
  { id: 1, name: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', points: 1, hostLevel: 'B' },
  { id: 2, name: 'Câu lạc bộ, tổ, đội nhóm cấp trường', points: 2, hostLevel: 'B' },
  { id: 3, name: 'Đoàn khoa, Liên chi hội Sinh viên khoa', points: 3, hostLevel: 'B' },
  { id: 4, name: 'Đoàn, Hội trường và tương đương', points: 4, hostLevel: 'A' },
  { id: 5, name: 'Thành Đoàn và tương đương', points: 5, hostLevel: 'A' },
  { id: 6, name: 'TW và tương đương', points: 6, hostLevel: 'A' },
];

export const ORGANIZATIONS_LIST: Organization[] = [
  { id: 1, code: 'DT', name: 'Đoàn trường', type: 'TRUONG', hostLevel: 'A', hostLevelName: 'Đoàn, Hội trường và tương đương', hostLevelScorePoint: 4, email1: 'doanhoi@hcmuaf.edu.vn', email2: 'hsvdhnonglam@hoisinhvientphcm.com', activityCount: 3 },
  { id: 2, code: 'HSVT', name: 'Hội Sinh viên trường', type: 'TRUONG', hostLevel: 'A', hostLevelName: 'Đoàn, Hội trường và tương đương', hostLevelScorePoint: 4, email1: 'doanhoi@hcmuaf.edu.vn', email2: 'hsvdhnonglam@hoisinhvientphcm.com', activityCount: 2 },
  { id: 3, code: 'TD', name: 'Thành Đoàn', type: 'TRUONG', hostLevel: 'A', hostLevelName: 'Thành Đoàn và tương đương', hostLevelScorePoint: 5, email1: 'doanhoi@hcmuaf.edu.vn', email2: 'hsvdhnonglam@hoisinhvientphcm.com', activityCount: 0 },
  { id: 4, code: 'HSVT_TP', name: 'HSV Thành phố', type: 'TRUONG', hostLevel: 'A', hostLevelName: 'Thành Đoàn và tương đương', hostLevelScorePoint: 5, email1: 'doanhoi@hcmuaf.edu.vn', email2: 'hsvdhnonglam@hoisinhvientphcm.com', activityCount: 0 },
  { id: 5, code: 'TW', name: 'TW và tương đương', type: 'TRUONG', hostLevel: 'A', hostLevelName: 'TW và tương đương', hostLevelScorePoint: 6, email1: 'doanhoi@hcmuaf.edu.vn', email2: 'hsvdhnonglam@hoisinhvientphcm.com', activityCount: 0 },
  { id: 6, code: 'KHSH', name: 'Khoa Khoa học Sinh học', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoakhoahocsinhhoc@hcmuaf.edu.vn', email2: 'khsh@tuoitrenonglam.com', activityCount: 2 },
  { id: 7, code: 'CNTY', name: 'Khoa Chăn nuôi Thú y', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoachannuoithuy@hcmuaf.edu.vn', email2: 'cnty@tuoitrenonglam.com', activityCount: 4 },
  { id: 8, code: 'CKCN', name: 'Khoa Cơ khí - Công nghệ', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoacokhi@hcmuaf.edu.vn', email2: 'ckcn@tuoitrenonglam.com', activityCount: 1 },
  { id: 9, code: 'CNTT', name: 'Khoa Công nghệ Thông tin', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoacongnghethongtin@hcmuaf.edu.vn', email2: 'cntt@tuoitrenonglam.com', activityCount: 5 },
  { id: 10, code: 'CNHTP', name: 'Khoa Công nghệ Hoá học và Thực phẩm', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoahoathucpham@hcmuaf.edu.vn', email2: 'cnhhtp@tuoitrenonglam.com', activityCount: 2 },
  { id: 11, code: 'KT', name: 'Khoa Kinh tế', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoakinhte@hcmuaf.edu.vn', email2: 'kt@tuoitrenonglam.com', activityCount: 3 },
  { id: 12, code: 'LN', name: 'Khoa Lâm nghiệp', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoalamnghiep@hcmuaf.edu.vn', email2: 'ln@tuoitrenonglam.com', activityCount: 1 },
  { id: 13, code: 'MTTN', name: 'Khoa Môi trường và Tài nguyên', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoamoitruongtainguyen@hcmuaf.edu.vn', email2: 'mttn@tuoitrenonglam.com', activityCount: 2 },
  { id: 14, code: 'NNSP', name: 'Khoa Ngoại ngữ - Sư phạm', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoangoaingusupham@hcmuaf.edu.vn', email2: 'nnsp@tuoitrenonglam.com', activityCount: 2 },
  { id: 15, code: 'NH', name: 'Khoa Nông học', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoanonghoc@hcmuaf.edu.vn', email2: 'nh@tuoitrenonglam.com', activityCount: 2 },
  { id: 16, code: 'QLDDBDS', name: 'Khoa Quản lý đất đai và Bất động sản', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoaquanlydatdaibatdongsan@hcmuaf.edu.vn', email2: 'qldd@tuoitrenonglam.com', activityCount: 1 },
  { id: 17, code: 'TS', name: 'Khoa Thủy sản', type: 'KHOA', hostLevel: 'B', hostLevelName: 'Đoàn khoa, Liên chi hội Sinh viên khoa', hostLevelScorePoint: 3, email1: 'doankhoathuysan@hcmuaf.edu.vn', email2: 'ts@tuoitrenonglam.com', activityCount: 2 },
  { id: 18, code: 'VC_NLD', name: 'Chi đoàn Viên chức, người lao động', type: 'CHI_DOAN', hostLevel: 'B', hostLevelName: 'Chi đoàn trực thuộc BTV Đoàn trường', hostLevelScorePoint: 3, email1: 'doanhoi@hcmuaf.edu.vn', activityCount: 0 },
  { id: 19, code: 'HGD', name: 'Tổ Tu dưỡng Rèn luyện Hạt Giống Đỏ', type: 'CLB_TRUONG', category: 'TO', categoryName: 'Tổ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'hgd@tuoitrenonglam.com', activityCount: 1 },
  { id: 20, code: 'NSX', name: 'CLB Cán bộ Đoàn Ngôi Sao Xanh', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'nsx@tuoitrenonglam.com', activityCount: 2 },
  { id: 21, code: 'CLB_DH', name: 'CLB Đồng hành', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'ac@tuoitrenonglam.com', activityCount: 1 },
  { id: 22, code: 'DOI_RD', name: 'Đội Văn nghệ Rạng Đông', type: 'CLB_TRUONG', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'rd@tuoitrenonglam.com', activityCount: 3 },
  { id: 23, code: 'DOI_CTXH', name: 'Đội Công tác Xã hội', type: 'CLB_TRUONG', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'ctxh@tuoitrenonglam.com', activityCount: 4 },
  { id: 24, code: 'DOI_NDX', name: 'Đội Văn nghệ Xung kích Nhịp Điệu Xanh', type: 'CLB_TRUONG', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'ndx@tuoitrenonglam.com', activityCount: 2 },
  { id: 25, code: 'CLB_BAS', name: 'CLB Học thuật - Kỹ năng Quản trị B.A.S', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'bas@tuoitrenonglam.com', activityCount: 1 },
  { id: 26, code: 'CLB_NLR', name: 'CLB Truyền thông Nông Lâm Radio', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'nlr@tuoitrenonglam.com', activityCount: 2 },
  { id: 27, code: 'CLB_KNTC', name: 'CLB Kết nối Thành công', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'kntc@tuoitrenonglam.com', activityCount: 0 },
  { id: 28, code: 'CLB_KN', name: 'CLB Khởi nghiệp', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'clbkhoinghiep@tuoitrenonglam.com', activityCount: 1 },
  { id: 29, code: 'CLB_SHD', name: 'CLB Sách và Hành động', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'sachvahanhdong@tuoitrenonglam.com', activityCount: 1 },
  { id: 30, code: 'CLB_BR', name: 'CLB Bóng rổ', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'bongro@tuoitrenonglam.com', activityCount: 1 },
  { id: 31, code: 'CLB_KRT', name: 'CLB KARATE-DO', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'karatedo@tuoitrenonglam.com', activityCount: 1 },
  { id: 32, code: 'HOD_CDV', name: 'Nhóm Cổ động viên NLU', type: 'CLB_TRUONG', category: 'NHOM', categoryName: 'Nhóm', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'nlb@tuoitrenonglam.com', activityCount: 0 },
  { id: 33, code: 'CLB_PWF', name: 'CLB Thể Thao Điện Tử PWF', type: 'CLB_TRUONG', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'pwf@tuoitrenonglam.com', activityCount: 1 },
  { id: 34, code: 'CLB_DTY', name: 'CLB Dược Thú y', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'dty@tuoitrenonglam.com', facultyCode: 'CNTY', parentCode: 'CNTY', activityCount: 1 },
  { id: 35, code: 'CLB_MSK', name: 'CLB Một sức khoẻ', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'onehealth@tuoitrenonglam.com', facultyCode: 'CNTY', parentCode: 'CNTY', activityCount: 0 },
  { id: 36, code: 'CLB_THD', name: 'CLB Thú hoang dã', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'thd@tuoitrenonglam.com', facultyCode: 'CNTY', parentCode: 'CNTY', activityCount: 1 },
  { id: 37, code: 'CLB_ENG', name: 'CLB Thú y Engscope', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'engscope@tuoitrenonglam.com', facultyCode: 'CNTY', parentCode: 'CNTY', activityCount: 0 },
  { id: 38, code: 'DOI_KVTT', name: 'Đội Khát Vọng Tuổi Trẻ', type: 'CLB_KHOA', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'doikhatvongtuoitre@tuoitrenonglam.com', facultyCode: 'CKCN', parentCode: 'CKCN', activityCount: 1 },
  { id: 39, code: 'CLB_SFF', name: 'CLB Tiếng Anh SFF', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'sff@tuoitrenonglam.com', facultyCode: 'NNSP', parentCode: 'NNSP', activityCount: 1 },
  { id: 40, code: 'CLB_BEC', name: 'CLB Tiếng Anh BEC', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'bec@tuoitrenonglam.com', facultyCode: 'KT', parentCode: 'KT', activityCount: 0 },
  { id: 41, code: 'DOI_MFB', name: 'Đội Văn nghệ MFB', type: 'CLB_KHOA', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'mfb@tuoitrenonglam.com', facultyCode: 'CNHTP', parentCode: 'CNHTP', activityCount: 1 },
  { id: 42, code: 'DOI_DXK', name: 'Đội Xung kích', type: 'CLB_KHOA', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'dxk@tuoitrenonglam.com', facultyCode: 'CNTT', parentCode: 'CNTT', activityCount: 1 },
  { id: 43, code: 'CLB_EFB', name: 'CLB Tiếng Anh EFB', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'efb@tuoitrenonglam.com', facultyCode: 'CNTT', parentCode: 'CNTT', activityCount: 1 },
  { id: 44, code: 'DOI_NHRX', name: 'Đội Nhiệt huyết Rừng xanh', type: 'CLB_KHOA', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'nhrx@tuoitrenonglam.com', facultyCode: 'LN', parentCode: 'LN', activityCount: 0 },
  { id: 45, code: 'CLB_DLST', name: 'CLB Du lịch Sinh thái', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'dlst@tuoitrenonglam.com', facultyCode: 'LN', parentCode: 'LN', activityCount: 0 },
  { id: 46, code: 'CLB_YMT', name: 'CLB Yêu môi trường', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'ymt@tuoitrenonglam.com', facultyCode: 'MTTN', parentCode: 'MTTN', activityCount: 1 },
  { id: 47, code: 'CLB_FIRE', name: 'CLB Tiếng Anh FiRE', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'fireenglishclub@tuoitrenonglam.com', facultyCode: 'MTTN', parentCode: 'MTTN', activityCount: 0 },
  { id: 48, code: 'CLB_AGROE', name: 'CLB Tiếng Anh AgroE', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'agroe@tuoitrenonglam.com', facultyCode: 'NH', parentCode: 'NH', activityCount: 1 },
  { id: 49, code: 'CLB_SV5T', name: 'CLB Sinh viên 5 tốt', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'sv5t@tuoitrenonglam.com', facultyCode: 'KHSH', parentCode: 'KHSH', activityCount: 2 },
  { id: 50, code: 'DOI_LX', name: 'Đội Lửa xanh', type: 'CLB_KHOA', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'luaxanh@tuoitrenonglam.com', facultyCode: 'LN', parentCode: 'LN', activityCount: 0 },
  { id: 51, code: 'DOI_LT', name: 'Đội Lễ tân', type: 'CLB_KHOA', category: 'DOI', categoryName: 'Đội', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'letan@tuoitrenonglam.com', facultyCode: 'QLDDBDS', parentCode: 'QLDDBDS', activityCount: 1 },
  { id: 52, code: 'CLB_MEC', name: 'CLB Truyền thông và Sự kiện', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'mec@tuoitrenonglam.com', facultyCode: 'KT', parentCode: 'KT', activityCount: 1 },
  { id: 53, code: 'CLB_LLT', name: 'CLB Lý luận trẻ', type: 'CLB_KHOA', category: 'CLB', categoryName: 'Câu Lạc Bộ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'llt@tuoitrenonglam.com', facultyCode: 'TS', parentCode: 'TS', activityCount: 1 },
  { id: 54, code: 'TO_KT_DT', name: 'Tổ Kỹ thuật & Công nghệ số', type: 'CLB_TRUONG', category: 'TO', categoryName: 'Tổ', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'tokythuat@tuoitrenonglam.com', activityCount: 2 },
  { id: 55, code: 'TO_HTSV', name: 'Tổ Hỗ trợ & Tư vấn Sinh viên', type: 'CLB_KHOA', category: 'TO', categoryName: 'Tổ', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'tohtsv@tuoitrenonglam.com', facultyCode: 'CNTT', parentCode: 'CNTT', activityCount: 1 },
  { id: 56, code: 'NHOM_NCKH', name: 'Nhóm Nghiên cứu Khoa học Trẻ', type: 'CLB_TRUONG', category: 'NHOM', categoryName: 'Nhóm', hostLevel: 'B', hostLevelName: 'Câu lạc bộ, tổ, đội nhóm cấp trường', hostLevelScorePoint: 2, email1: 'nhomnckh@tuoitrenonglam.com', activityCount: 2 },
  { id: 57, code: 'NHOM_TNT', name: 'Nhóm Tình nguyện Xanh Môi trường', type: 'CLB_KHOA', category: 'NHOM', categoryName: 'Nhóm', hostLevel: 'B', hostLevelName: 'Chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', hostLevelScorePoint: 1, email1: 'nhomtinhnguyen@tuoitrenonglam.com', facultyCode: 'MTTN', parentCode: 'MTTN', activityCount: 1 },
];

export const BRANCH_CLASSES: BranchClass[] = [
  // 1. Khoa Công nghệ Thông tin (CNTT)
  { id: 'cls_DH21IT01', code: 'DH21IT01', name: 'Chi đoàn DH21IT01 (K21 CNTT)', facultyCode: 'CNTT', academicYear: '2021-2025' },
  { id: 'cls_DH22IT01', code: 'DH22IT01', name: 'Chi đoàn DH22IT01 (K22 CNTT 1)', facultyCode: 'CNTT', academicYear: '2022-2026' },
  { id: 'cls_DH22IT02', code: 'DH22IT02', name: 'Chi đoàn DH22IT02 (K22 CNTT 2)', facultyCode: 'CNTT', academicYear: '2022-2026' },
  { id: 'cls_DH23IT01', code: 'DH23IT01', name: 'Chi đoàn DH23IT01 (K23 CNTT 1)', facultyCode: 'CNTT', academicYear: '2023-2027' },
  { id: 'cls_DH23IT02', code: 'DH23IT02', name: 'Chi đoàn DH23IT02 (K23 CNTT 2)', facultyCode: 'CNTT', academicYear: '2023-2027' },
  { id: 'cls_DH24IT01', code: 'DH24IT01', name: 'Chi đoàn DH24IT01 (K24 Khóa Mới CNTT 1)', facultyCode: 'CNTT', academicYear: '2024-2028' },
  { id: 'cls_DH24IT02', code: 'DH24IT02', name: 'Chi đoàn DH24IT02 (K24 Khóa Mới CNTT 2)', facultyCode: 'CNTT', academicYear: '2024-2028' },

  // 2. Khoa Chăn nuôi Thú y (CNTY)
  { id: 'cls_DH21TY01', code: 'DH21TY01', name: 'Chi đoàn DH21TY01 (K21 Thú Y)', facultyCode: 'CNTY', academicYear: '2021-2026' },
  { id: 'cls_DH22TY01', code: 'DH22TY01', name: 'Chi đoàn DH22TY01 (K22 Thú Y 1)', facultyCode: 'CNTY', academicYear: '2022-2027' },
  { id: 'cls_DH22TY02', code: 'DH22TY02', name: 'Chi đoàn DH22TY02 (K22 Thú Y 2)', facultyCode: 'CNTY', academicYear: '2022-2027' },
  { id: 'cls_DH23TY01', code: 'DH23TY01', name: 'Chi đoàn DH23TY01 (K23 Thú Y 1)', facultyCode: 'CNTY', academicYear: '2023-2028' },
  { id: 'cls_DH23TY02', code: 'DH23TY02', name: 'Chi đoàn DH23TY02 (K23 Thú Y 2)', facultyCode: 'CNTY', academicYear: '2023-2028' },
  { id: 'cls_DH24TY01', code: 'DH24TY01', name: 'Chi đoàn DH24TY01 (K24 Thú Y 1)', facultyCode: 'CNTY', academicYear: '2024-2029' },
  { id: 'cls_DH24TY02', code: 'DH24TY02', name: 'Chi đoàn DH24TY02 (K24 Thú Y 2)', facultyCode: 'CNTY', academicYear: '2024-2029' },

  // 3. Khoa Kinh tế (KT)
  { id: 'cls_DH22KT01', code: 'DH22KT01', name: 'Chi đoàn DH22KT01 (K22 Quản trị Kinh doanh)', facultyCode: 'KT', academicYear: '2022-2026' },
  { id: 'cls_DH22KT02', code: 'DH22KT02', name: 'Chi đoàn DH22KT02 (K22 Kế toán)', facultyCode: 'KT', academicYear: '2022-2026' },
  { id: 'cls_DH23KT01', code: 'DH23KT01', name: 'Chi đoàn DH23KT01 (K23 Tài chính - Ngân hàng)', facultyCode: 'KT', academicYear: '2023-2027' },
  { id: 'cls_DH23KT02', code: 'DH23KT02', name: 'Chi đoàn DH23KT02 (K23 Kinh tế Nông nghiệp)', facultyCode: 'KT', academicYear: '2023-2027' },
  { id: 'cls_DH24KT01', code: 'DH24KT01', name: 'Chi đoàn DH24KT01 (K24 Quản trị Kinh doanh)', facultyCode: 'KT', academicYear: '2024-2028' },
  { id: 'cls_DH24KT02', code: 'DH24KT02', name: 'Chi đoàn DH24KT02 (K24 Kế toán)', facultyCode: 'KT', academicYear: '2024-2028' },

  // 4. Khoa Khoa học Sinh học (KHSH)
  { id: 'cls_DH22SH01', code: 'DH22SH01', name: 'Chi đoàn DH22SH01 (K22 Sinh học Ứng dụng)', facultyCode: 'KHSH', academicYear: '2022-2026' },
  { id: 'cls_DH23SH01', code: 'DH23SH01', name: 'Chi đoàn DH23SH01 (K23 Công nghệ Sinh học)', facultyCode: 'KHSH', academicYear: '2023-2027' },
  { id: 'cls_DH24SH01', code: 'DH24SH01', name: 'Chi đoàn DH24SH01 (K24 Sinh học Ứng dụng & CNSH)', facultyCode: 'KHSH', academicYear: '2024-2028' },

  // 5. Khoa Cơ khí - Công nghệ (CKCN)
  { id: 'cls_DH22CK01', code: 'DH22CK01', name: 'Chi đoàn DH22CK01 (K22 Kỹ thuật Cơ khí)', facultyCode: 'CKCN', academicYear: '2022-2026' },
  { id: 'cls_DH23CK01', code: 'DH23CK01', name: 'Chi đoàn DH23CK01 (K23 Công nghệ Chế tạo máy)', facultyCode: 'CKCN', academicYear: '2023-2027' },
  { id: 'cls_DH24CK01', code: 'DH24CK01', name: 'Chi đoàn DH24CK01 (K24 Kỹ thuật Cơ khí & Tự động hóa)', facultyCode: 'CKCN', academicYear: '2024-2028' },

  // 6. Khoa Công nghệ Hoá học và Thực phẩm (CNHTP)
  { id: 'cls_DH22HH01', code: 'DH22HH01', name: 'Chi đoàn DH22HH01 (K22 Công nghệ Thực phẩm 1)', facultyCode: 'CNHTP', academicYear: '2022-2026' },
  { id: 'cls_DH22TP01', code: 'DH22TP01', name: 'Chi đoàn DH22TP01 (K22 Kỹ thuật Thực phẩm)', facultyCode: 'CNHTP', academicYear: '2022-2026' },
  { id: 'cls_DH23HH01', code: 'DH23HH01', name: 'Chi đoàn DH23HH01 (K23 Đảm bảo CL & ATTP)', facultyCode: 'CNHTP', academicYear: '2023-2027' },
  { id: 'cls_DH24HH01', code: 'DH24HH01', name: 'Chi đoàn DH24HH01 (K24 Công nghệ Thực phẩm)', facultyCode: 'CNHTP', academicYear: '2024-2028' },
  { id: 'cls_DH24TP01', code: 'DH24TP01', name: 'Chi đoàn DH24TP01 (K24 Kỹ thuật Thực phẩm & ATTP)', facultyCode: 'CNHTP', academicYear: '2024-2028' },

  // 7. Khoa Lâm nghiệp (LN)
  { id: 'cls_DH22LN01', code: 'DH22LN01', name: 'Chi đoàn DH22LN01 (K22 Quản lý Tài nguyên rừng)', facultyCode: 'LN', academicYear: '2022-2026' },
  { id: 'cls_DH23LN01', code: 'DH23LN01', name: 'Chi đoàn DH23LN01 (K23 Lâm học)', facultyCode: 'LN', academicYear: '2023-2027' },
  { id: 'cls_DH24LN01', code: 'DH24LN01', name: 'Chi đoàn DH24LN01 (K24 Quản lý Tài nguyên rừng & Lâm học)', facultyCode: 'LN', academicYear: '2024-2028' },

  // 8. Khoa Môi trường và Tài nguyên (MTTN)
  { id: 'cls_DH22MT01', code: 'DH22MT01', name: 'Chi đoàn DH22MT01 (K22 Kỹ thuật Môi trường)', facultyCode: 'MTTN', academicYear: '2022-2026' },
  { id: 'cls_DH23MT01', code: 'DH23MT01', name: 'Chi đoàn DH23MT01 (K23 Khoa học Môi trường)', facultyCode: 'MTTN', academicYear: '2023-2027' },
  { id: 'cls_DH24MT01', code: 'DH24MT01', name: 'Chi đoàn DH24MT01 (K24 Tài nguyên & Môi trường)', facultyCode: 'MTTN', academicYear: '2024-2028' },

  // 9. Khoa Ngoại ngữ - Sư phạm (NNSP)
  { id: 'cls_DH22SP01', code: 'DH22SP01', name: 'Chi đoàn DH22SP01 (K22 Ngôn ngữ Anh)', facultyCode: 'NNSP', academicYear: '2022-2026' },
  { id: 'cls_DH23SP01', code: 'DH23SP01', name: 'Chi đoàn DH23SP01 (K23 Sư phạm Kỹ thuật Nông nghiệp)', facultyCode: 'NNSP', academicYear: '2023-2027' },
  { id: 'cls_DH24SP01', code: 'DH24SP01', name: 'Chi đoàn DH24SP01 (K24 Ngôn ngữ Anh & SPKT)', facultyCode: 'NNSP', academicYear: '2024-2028' },

  // 10. Khoa Nông học (NH)
  { id: 'cls_DH22NH01', code: 'DH22NH01', name: 'Chi đoàn DH22NH01 (K22 Khoa học Cây trồng)', facultyCode: 'NH', academicYear: '2022-2026' },
  { id: 'cls_DH23NH01', code: 'DH23NH01', name: 'Chi đoàn DH23NH01 (K23 Bảo vệ Thực vật)', facultyCode: 'NH', academicYear: '2023-2027' },
  { id: 'cls_DH24NH01', code: 'DH24NH01', name: 'Chi đoàn DH24NH01 (K24 Khoa học Cây trồng & BVTV)', facultyCode: 'NH', academicYear: '2024-2028' },

  // 11. Khoa Quản lý đất đai và Bất động sản (QLDDBDS)
  { id: 'cls_DH22DD01', code: 'DH22DD01', name: 'Chi đoàn DH22DD01 (K22 Quản lý Đất đai)', facultyCode: 'QLDDBDS', academicYear: '2022-2026' },
  { id: 'cls_DH22QL01', code: 'DH22QL01', name: 'Chi đoàn DH22QL01 (K22 Quy hoạch Đất đai)', facultyCode: 'QLDDBDS', academicYear: '2022-2026' },
  { id: 'cls_DH23DD01', code: 'DH23DD01', name: 'Chi đoàn DH23DD01 (K23 Bất động sản)', facultyCode: 'QLDDBDS', academicYear: '2023-2027' },
  { id: 'cls_DH24DD01', code: 'DH24DD01', name: 'Chi đoàn DH24DD01 (K24 Quản lý Đất đai)', facultyCode: 'QLDDBDS', academicYear: '2024-2028' },
  { id: 'cls_DH24QL01', code: 'DH24QL01', name: 'Chi đoàn DH24QL01 (K24 Quy hoạch Đất đai & Bất động sản)', facultyCode: 'QLDDBDS', academicYear: '2024-2028' },

  // 12. Khoa Thủy sản (TS)
  { id: 'cls_DH22TS01', code: 'DH22TS01', name: 'Chi đoàn DH22TS01 (K22 Nuôi trồng Thủy sản)', facultyCode: 'TS', academicYear: '2022-2026' },
  { id: 'cls_DH23TS01', code: 'DH23TS01', name: 'Chi đoàn DH23TS01 (K23 Bệnh học Thủy sản)', facultyCode: 'TS', academicYear: '2023-2027' },
  { id: 'cls_DH24TS01', code: 'DH24TS01', name: 'Chi đoàn DH24TS01 (K24 Nuôi trồng Thủy sản & Bệnh học)', facultyCode: 'TS', academicYear: '2024-2028' },

  // 13. Chi đoàn Viên chức, người lao động (VC_NLD)
  { id: 'cls_CD_VCNLD', code: 'CD_VCNLD', name: 'Chi đoàn Cán bộ Viên chức - Giảng viên Trẻ', facultyCode: 'VC_NLD', academicYear: '2022-2027' },
];

/**
 * Tự động sinh Mã hoạt động:
 * Cấp A: A001, A002...
 * Cấp B: B001, B002...
 */
export function generateActivityCode(hostLevel: HostLevel, existingActs: ActivitySubmission[]): string {
  const prefix = hostLevel === 'A' ? 'A' : 'B';
  const matchingCodes = existingActs
    .map(a => a.id)
    .filter(id => id.startsWith(prefix))
    .map(id => parseInt(id.replace(prefix, ''), 10))
    .filter(num => !isNaN(num));

  const maxNum = matchingCodes.length > 0 ? Math.max(...matchingCodes) : 0;
  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(3, '0')}`;
}

// Quy mô đối tượng tham gia (1 - 6 điểm)
export const TARGET_SCALE_CONFIG = [
  { id: 1, name: 'Tham gia trực tuyến', points: 1 },
  { id: 2, name: 'Quy mô chi đoàn, chi hội hoặc câu lạc bộ, tổ, đội nhóm cấp khoa', points: 2 },
  { id: 3, name: 'Quy mô câu lạc bộ, tổ, đội nhóm cấp trường', points: 3 },
  { id: 4, name: 'Quy mô toàn khoa', points: 4 },
  { id: 5, name: 'Quy mô toàn trường', points: 5 },
  { id: 6, name: 'Quy mô thành phố hoặc toàn quốc', points: 6 },
];

export function getParticipantCountPoints(count: number): number {
  if (!count || count <= 0) return 0;
  if (count < 50) return 1;
  if (count <= 100) return 2;
  if (count <= 200) return 3;
  if (count <= 500) return 4;
  if (count <= 1000) return 5;
  return 6;
}

export function calculateProgramLevelScore(
  scalePoints: number,
  participantCount: number,
  hostLevelPoints: number,
  orgContext?: { orgCode?: string; orgName?: string }
): {
  totalScore: number;
  programLevel: number;
  participantPoints: number;
  isSchoolEnforcedLevel?: boolean;
} {
  const participantPoints = getParticipantCountPoints(participantCount);
  const totalScore = scalePoints + participantPoints + hostLevelPoints;

  let programLevel = 1;
  if (totalScore <= 5) programLevel = 1;
  else if (totalScore <= 11) programLevel = 2;
  else if (totalScore <= 17) programLevel = 3;
  else programLevel = 4;

  let isSchoolEnforcedLevel = false;
  // Ràng buộc quy chế NLU: Chương trình/hoạt động do Đoàn trường, Hội Sinh viên trường tổ chức phải là chương trình Cấp 3 trở lên
  const isSchool = orgContext && (
    (orgContext.orgCode && ['DT', 'HSVT'].includes(orgContext.orgCode.trim().toUpperCase())) ||
    (orgContext.orgName && (orgContext.orgName.toLowerCase().includes('đoàn trường') || orgContext.orgName.toLowerCase().includes('hội sinh viên trường')))
  );

  if (isSchool && programLevel < 3) {
    programLevel = 3;
    isSchoolEnforcedLevel = true;
  }

  return { totalScore, programLevel, participantPoints, isSchoolEnforcedLevel };
}

export const ROLE_POINTS_MATRIX: Record<ParticipantRoleType, { c1: number; c2: number; c3: number; c4: number }> = {
  'Giải Nhất': { c1: 5, c2: 6, c3: 7, c4: 8 },
  'Giải Nhì': { c1: 4, c2: 5, c3: 6, c4: 7 },
  'Giải Ba': { c1: 3, c2: 4, c3: 5, c4: 6 },
  'Ban Tổ chức': { c1: 5, c2: 6, c3: 7, c4: 8 },
  'Cộng tác viên': { c1: 3, c2: 4, c3: 5, c4: 6 },
  'Tham gia dự thi vòng 1 trực tiếp (offline)': { c1: 2, c2: 3, c3: 4, c4: 5 },
  'Tham dự': { c1: 1, c2: 2, c3: 3, c4: 4 },
  'Tham gia dự thi 1 vòng trực tuyến (online)': { c1: 1, c2: 2, c3: 3, c4: 4 },
};

export function getPointsForRole(
  role: ParticipantRoleType,
  programLevel: number,
  customMatrix?: Record<string, { c1: number; c2: number; c3: number; c4: number }>
): number {
  const matrix = customMatrix || ROLE_POINTS_MATRIX;
  const entry = matrix[role] || matrix['Tham dự'] || { c1: 1, c2: 2, c3: 3, c4: 4 };
  const level = Math.min(4, Math.max(1, programLevel || 1));
  if (level === 1) return entry.c1;
  if (level === 2) return entry.c2;
  if (level === 3) return entry.c3;
  return entry.c4;
}

// Cấu hình ràng buộc mặc định số lượng nhân sự BTC và CTV theo Cấp chương trình (Cấp 1 đến Cấp 4)
export const DEFAULT_PROGRAM_PERSONNEL_QUOTAS: ProgramPersonnelQuota[] = [
  {
    level: 1,
    levelName: 'Chương trình Cấp 1',
    description: 'Chi đoàn, chi hội hoặc cấp nhỏ (Tổng điểm phân cấp <= 5)',
    maxBtc: 5,
    maxCtv: 10,
  },
  {
    level: 2,
    levelName: 'Chương trình Cấp 2',
    description: 'Đoàn khoa, liên chi hội hoặc quy mô vừa (Tổng điểm phân cấp 6 - 11)',
    maxBtc: 10,
    maxCtv: 20,
  },
  {
    level: 3,
    levelName: 'Chương trình Cấp 3',
    description: 'Quy mô liên khoa / cấp trường diện rộng (Tổng điểm phân cấp 12 - 17)',
    maxBtc: 15,
    maxCtv: 30,
  },
  {
    level: 4,
    levelName: 'Chương trình Cấp 4',
    description: 'Quy mô toàn trường lớn, trọng điểm cấp cao (Tổng điểm phân cấp >= 18)',
    maxBtc: 20,
    maxCtv: 40,
  },
];

export function getPersonnelQuotaForLevel(
  level: number,
  customQuotas?: ProgramPersonnelQuota[]
): ProgramPersonnelQuota {
  const quotas = customQuotas || DEFAULT_PROGRAM_PERSONNEL_QUOTAS;
  const normalizedLevel = Math.min(4, Math.max(1, level || 1));
  const found = quotas.find(q => q.level === normalizedLevel);
  return (
    found || {
      level: normalizedLevel,
      levelName: `Chương trình Cấp ${normalizedLevel}`,
      maxBtc: normalizedLevel === 1 ? 5 : normalizedLevel === 2 ? 10 : normalizedLevel === 3 ? 15 : 20,
      maxCtv: normalizedLevel === 1 ? 10 : normalizedLevel === 2 ? 20 : normalizedLevel === 3 ? 30 : 40,
    }
  );
}

export const DRL_CRITERIA = [
  { id: 'A1', title: 'A1. Chấp hành các quy định pháp luật & chỉ đạo của Bộ, ngành' },
  { id: 'A2', title: 'A2. Chấp hành nội quy, quy chế và các quy định nhà trường' },
  { id: 'B1', title: 'B1. Trách nhiệm, thái độ tham gia hoạt động học tập, NCKH' },
  { id: 'B2', title: 'B2. Trách nhiệm và tinh thần tham gia các kỳ thi, cuộc thi' },
  { id: 'B3', title: 'B3. Tinh thần vượt khó, phấn đấu vươn lên trong học tập' },
  { id: 'C1', title: 'C1. Tham gia hoạt động rèn luyện chính trị, xã hội, văn hóa, thể thao' },
  { id: 'C2', title: 'C2. Tham gia hoạt động công ích, tình nguyện, công tác xã hội' },
  { id: 'C3', title: 'C3. Tham gia tuyên truyền, phòng chống tội phạm và tệ nạn xã hội' },
  { id: 'D1', title: 'D1. Tuyên truyền chủ trương của Đảng, chính sách, pháp luật Nhà nước' },
  { id: 'D2', title: 'D2. Hoạt động xã hội được ghi nhận, biểu dương, khen thưởng' },
  { id: 'E1', title: 'E1. Uy tín, kỹ năng tổ chức công tác quản lý lớp, Đoàn - Hội trường' },
  { id: 'E2', title: 'E2. Hỗ trợ và tham gia tích cực hoạt động chung lớp, khoa, trường' },
  { id: 'E3', title: 'E3. Thành tích NCKH, sáng kiến cải tiến kỹ thuật, khởi nghiệp' },
];

export interface Sv5tStandardGroup {
  id: string;
  name: string;
  criteria: { id: string; code: string; title: string; required: boolean }[];
}

export const SV5T_STANDARDS: Sv5tStandardGroup[] = [
  {
    id: 'STD_DAO_DUC',
    name: 'Tiêu chuẩn 1: Đạo đức tốt',
    criteria: [
      { id: 'A1', code: 'A1', title: 'Có lòng yêu nước, trung thành lý tưởng cách mạng của Đảng', required: true },
      { id: 'A2', code: 'A2', title: 'Không vi phạm pháp luật và nội quy, quy chế nhà trường, địa phương', required: true },
      { id: 'A3', code: 'A3', title: 'Điểm rèn luyện đạt từ 85 điểm trở lên', required: true },
      { id: 'A4', code: 'A4', title: 'Đánh giá chất lượng đoàn viên cuối năm Hoàn thành xuất sắc nhiệm vụ', required: true },
      { id: 'A5', code: 'A5', title: 'Tham gia thi tìm hiểu Mác - Lênin / Bài diễn đàn / Thanh niên tiên tiến làm theo Bác', required: true },
    ],
  },
  {
    id: 'STD_HOC_TAP',
    name: 'Tiêu chuẩn 2: Học tập tốt',
    criteria: [
      { id: 'B6', code: 'B6', title: 'Động cơ, thái độ học tập đúng đắn; không gian lận trong thi cử, không nợ môn', required: true },
      { id: 'B7', code: 'B7', title: 'Điểm trung bình chung học tập của năm học đạt từ 3.4/4.0 trở lên', required: true },
      { id: 'B8', code: 'B8', title: 'Tham gia nghiên cứu khoa học: Đề tài/khóa luận ≥8.0 hoặc Euréka/Bài báo tạp chí', required: true },
    ],
  },
  {
    id: 'STD_THE_LUC',
    name: 'Tiêu chuẩn 3: Thể lực tốt',
    criteria: [
      { id: 'C9.1', code: 'C9.1', title: 'Đạt danh hiệu "Thanh niên khỏe" cấp trường trở lên hoặc tham gia thể thao cấp Thành', required: true },
      { id: 'C9.2', code: 'C9.2', title: 'Tham gia và đạt giải tại các hoạt động thể thao cấp trường trở lên (hoặc môn TDTT định kỳ)', required: true },
    ],
  },
  {
    id: 'STD_TINH_NGUYEN',
    name: 'Tiêu chuẩn 4: Tình nguyện tốt',
    criteria: [
      { id: 'D10', code: 'D10', title: 'Được khen thưởng từ cấp Trường trở lên về hoạt động tình nguyện', required: true },
      { id: 'D11', code: 'D11', title: 'Tham gia Mùa hè xanh, Xuân tình nguyện hoặc Tiếp sức mùa thi (đủ từ 05 ngày tình nguyện)', required: true },
    ],
  },
  {
    id: 'STD_HOI_NHAP',
    name: 'Tiêu chuẩn 5: Hội nhập tốt',
    criteria: [
      { id: 'E12', code: 'E12', title: 'Đạt chứng chỉ tiếng Anh B1 trở lên hoặc ĐTB ngoại ngữ tích lũy từ 3.2/4.0 trở lên', required: true },
      { id: 'E13', code: 'E13', title: 'Giấy chứng nhận tham gia ít nhất 01 hoạt động giao lưu quốc tế / giải thi ngoại ngữ', required: true },
      { id: 'E14', code: 'E14', title: 'Hoàn thành ít nhất 01 khóa kỹ năng thực hành xã hội hoặc khen thưởng Đoàn - Hội trường+', required: true },
    ],
  },
];

export const SV5T_CRITERIA = SV5T_STANDARDS.flatMap(std =>
  std.criteria.map(c => ({
    id: c.id,
    group: std.name.split(':')[1]?.trim() || std.name,
    title: `${c.code}. ${c.title}`,
  }))
);

const ALL_SV5T_CRITERIA_IDS: string[] = SV5T_STANDARDS.flatMap(s => s.criteria.map(c => c.id));
const TOTAL_REQUIRED_CRITERIA_COUNT = ALL_SV5T_CRITERIA_IDS.length;

export function checkSv5tEligibility(achievedMap: Record<string, boolean>): {
  isEligible: boolean;
  totalRequired: number;
  totalAchieved: number;
  percent: number;
} {
  if (!achievedMap) {
    return { isEligible: false, totalRequired: TOTAL_REQUIRED_CRITERIA_COUNT, totalAchieved: 0, percent: 0 };
  }

  let totalAchieved = 0;
  for (let i = 0; i < ALL_SV5T_CRITERIA_IDS.length; i++) {
    if (achievedMap[ALL_SV5T_CRITERIA_IDS[i]]) {
      totalAchieved++;
    }
  }

  const percent = TOTAL_REQUIRED_CRITERIA_COUNT > 0 ? Math.round((totalAchieved / TOTAL_REQUIRED_CRITERIA_COUNT) * 100) : 0;
  const isEligible = totalAchieved >= TOTAL_REQUIRED_CRITERIA_COUNT && TOTAL_REQUIRED_CRITERIA_COUNT > 0;

  return { isEligible, totalRequired: TOTAL_REQUIRED_CRITERIA_COUNT, totalAchieved, percent };
}

export interface Sv5tLookupIndex {
  activityCriteriaByStudent: Map<string, Set<string>>;
  proofFlagsByStudent: Map<string, { hasNckh: boolean; hasBonus: boolean; hasPosition: boolean }>;
}

export function buildSv5tIndex(
  activities: ActivitySubmission[],
  selfProofs: StudentSelfProof[]
): Sv5tLookupIndex {
  const activityCriteriaByStudent = new Map<string, Set<string>>();
  const proofFlagsByStudent = new Map<string, { hasNckh: boolean; hasBonus: boolean; hasPosition: boolean }>();

  // Index activities
  for (let i = 0; i < activities.length; i++) {
    const act = activities[i];
    if (act.status !== 'Approved' || !act.sv5tCriteriaId || !act.participants) continue;
    const crit = act.sv5tCriteriaId;
    const parts = act.participants;

    for (let j = 0; j < parts.length; j++) {
      const sid = parts[j].studentId?.trim().toLowerCase();
      if (!sid) continue;

      let set = activityCriteriaByStudent.get(sid);
      if (!set) {
        set = new Set<string>();
        activityCriteriaByStudent.set(sid, set);
      }
      if (crit.startsWith('A5')) set.add('A5');
      if (crit.startsWith('B8')) set.add('B8');
      if (crit.startsWith('C9.1')) set.add('C9.1');
      if (crit.startsWith('C9.2')) set.add('C9.2');
      if (crit.startsWith('D10')) set.add('D10');
      if (crit.startsWith('D11')) set.add('D11');
      if (crit.startsWith('E12')) set.add('E12');
      if (crit.startsWith('E13')) set.add('E13');
      if (crit.startsWith('E14')) set.add('E14');
    }
  }

  // Index self-proofs
  for (let i = 0; i < selfProofs.length; i++) {
    const p = selfProofs[i];
    if (p.status !== 'Approved' || !p.studentId) continue;
    const sid = p.studentId.trim().toLowerCase();

    let flags = proofFlagsByStudent.get(sid);
    if (!flags) {
      flags = { hasNckh: false, hasBonus: false, hasPosition: false };
      proofFlagsByStudent.set(sid, flags);
    }
    if (p.type === 'NCKH') flags.hasNckh = true;
    if (p.type === 'KHEN_THUONG') flags.hasBonus = true;
    if (p.type === 'CHUC_VU') flags.hasPosition = true;
  }

  return { activityCriteriaByStudent, proofFlagsByStudent };
}

/**
 * Yêu cầu 4: Tự động hóa xét duyệt SV5T
 * Đối soát lịch sử tham gia hoạt động, minh chứng và điểm số của sinh viên
 * Đã tối ưu hóa tốc độ O(1) qua index hoặc O(N) thông thường
 */
export function computeAutoSv5t(
  student: StudentScoreRecord,
  activities: ActivitySubmission[],
  selfProofs: StudentSelfProof[],
  precomputedIndex?: Sv5tLookupIndex
): Record<string, boolean> {
  const map: Record<string, boolean> = { ...(student.sv5tCriteriaAchieved || {}) };

  // Tiêu chuẩn 1: Đạo đức tốt
  map['A1'] = true;
  map['A2'] = true;
  map['A3'] = student.totalScore >= 85;
  map['A4'] = student.rankGrade === 'Hoàn thành xuất sắc nhiệm vụ';

  const cleanId = student.studentId?.trim().toLowerCase() || '';

  if (precomputedIndex) {
    const actCriteria = precomputedIndex.activityCriteriaByStudent.get(cleanId);
    if (actCriteria) {
      for (const crit of actCriteria) {
        map[crit] = true;
      }
    }

    const proofFlags = precomputedIndex.proofFlagsByStudent.get(cleanId);
    if (proofFlags) {
      if (proofFlags.hasNckh || student.researchScore > 0) map['B8'] = true;
      if (proofFlags.hasBonus && student.bonusScore >= 10) map['A5'] = true;
      if (proofFlags.hasPosition || student.positionScore > 0) map['E14'] = true;
    } else {
      if (student.researchScore > 0) map['B8'] = true;
      if (student.bonusScore >= 10) map['A5'] = true;
      if (student.positionScore > 0) map['E14'] = true;
    }
  } else {
    // Fallback direct check
    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      if (act.status !== 'Approved' || !act.sv5tCriteriaId || !act.participants) continue;
      const isParticipant = act.participants.some(p => p.studentId?.trim().toLowerCase() === cleanId);
      if (isParticipant) {
        if (act.sv5tCriteriaId.startsWith('A5')) map['A5'] = true;
        if (act.sv5tCriteriaId.startsWith('B8')) map['B8'] = true;
        if (act.sv5tCriteriaId.startsWith('C9.1')) map['C9.1'] = true;
        if (act.sv5tCriteriaId.startsWith('C9.2')) map['C9.2'] = true;
        if (act.sv5tCriteriaId.startsWith('D10')) map['D10'] = true;
        if (act.sv5tCriteriaId.startsWith('D11')) map['D11'] = true;
        if (act.sv5tCriteriaId.startsWith('E12')) map['E12'] = true;
        if (act.sv5tCriteriaId.startsWith('E13')) map['E13'] = true;
        if (act.sv5tCriteriaId.startsWith('E14')) map['E14'] = true;
      }
    }

    for (let i = 0; i < selfProofs.length; i++) {
      const p = selfProofs[i];
      if (p.studentId?.trim().toLowerCase() === cleanId && p.status === 'Approved') {
        if (p.type === 'NCKH' || student.researchScore > 0) map['B8'] = true;
        if (p.type === 'KHEN_THUONG' && student.bonusScore >= 10) map['A5'] = true;
        if (p.type === 'CHUC_VU' || student.positionScore > 0) map['E14'] = true;
      }
    }
    if (student.researchScore > 0) map['B8'] = true;
    if (student.bonusScore >= 10) map['A5'] = true;
    if (student.positionScore > 0) map['E14'] = true;
  }

  // Học tập tốt criteria defaults
  if (student.totalScore >= 40) map['B6'] = true;
  if (student.totalScore >= 50) map['B7'] = true;

  return map;
}

/**
 * High-performance batch updater for all students.
 * Preserves object references if criteria didn't change (prevents unneeded React re-renders).
 */
export function computeAllStudentsAutoSv5t(
  students: StudentScoreRecord[],
  activities: ActivitySubmission[],
  selfProofs: StudentSelfProof[]
): StudentScoreRecord[] {
  if (!students || students.length === 0) return students;
  const index = buildSv5tIndex(activities, selfProofs);

  let hasAnyChanges = false;
  const nextStudents = students.map(std => {
    const autoCriteria = computeAutoSv5t(std, activities, selfProofs, index);
    const { isEligible } = checkSv5tEligibility(autoCriteria);
    const rankGeneral = calculateGeneralRank(std.totalScore);

    // Check if anything actually changed
    const prevMap = std.sv5tCriteriaAchieved || {};
    let criteriaChanged = false;
    for (const key of ALL_SV5T_CRITERIA_IDS) {
      if (!!prevMap[key] !== !!autoCriteria[key]) {
        criteriaChanged = true;
        break;
      }
    }

    if (!criteriaChanged && std.isSv5tEligible === isEligible && std.rankGeneral === rankGeneral) {
      return std; // Exact reference preservation
    }

    hasAnyChanges = true;
    return {
      ...std,
      sv5tCriteriaAchieved: autoCriteria,
      isSv5tEligible: isEligible,
      rankGeneral
    };
  });

  return hasAnyChanges ? nextStudents : students;
}

export const HOI_PROGRAMS = [
  { id: '1', title: '1. Công tác tuyên truyền, triển khai phong trào “Sinh viên 5 tốt”' },
  { id: '2', title: '2. Sinh viên vun đắp lý tưởng, rèn luyện đạo đức, tác phong' },
  { id: '3', title: '3. Sinh viên học tập, sáng tạo, nghiên cứu khoa học' },
  { id: '4', title: '4. Sinh viên rèn luyện thể chất' },
  { id: '5', title: '5. Sinh viên tình nguyện vì cuộc sống cộng đồng' },
  { id: '6', title: '6. Sinh viên chủ động hội nhập quốc tế' },
  { id: '7', title: '7. Chương trình tư vấn, đồng hành, hỗ trợ sinh viên' },
  { id: '8', title: '8. Chương trình xây dựng Hội Sinh viên Việt Nam vững mạnh' },
  { id: '8.1', title: '8.1. Công tác cán bộ Hội' },
  { id: '8.2', title: '8.2. Công tác tổ chức cơ sở Hội' },
  { id: '8.3', title: '8.3. Công tác Hội viên' },
  { id: '8.4', title: '8.4. Công tác kiểm tra, thi đua khen thưởng' },
  { id: '8.5', title: '8.5. Công tác phối hợp, tham mưu, chỉ đạo' },
  { id: '9', title: '9. Phát huy vai trò sinh viên trong xây dựng, bảo vệ Đảng và hệ thống chính trị' },
];

export const DOAN_PROGRAMS = [
  { id: 'KR1.1', title: 'KR1.1. Thực hiện hiệu quả Chỉ thị 05-CT/TW và 42-CT/TW gắn giáo dục' },
  { id: 'KR1.2', title: 'KR1.2. Đổi mới phương thức tuyên truyền, giáo dục của Đoàn' },
  { id: 'KR2.1', title: 'KR2.1. Phong trào Tuổi trẻ xung kích bảo vệ Tổ quốc' },
  { id: 'KR2.2', title: 'KR2.2. Phong trào Thanh niên tình nguyện' },
  { id: 'KR2.3', title: 'KR2.3. Phong trào Tuổi trẻ sáng tạo' },
  { id: 'KR3.1', title: 'KR3.1. Chương trình đồng hành cùng thanh niên trong học tập' },
  { id: 'KR3.2', title: 'KR3.2. Chương trình đồng hành cùng thanh niên lập nghiệp, khởi nghiệp' },
  { id: 'KR3.3', title: 'KR3.3. Chương trình phát triển kỹ năng thực hành xã hội, thể chất, văn hóa' },
  { id: 'KR4.1', title: 'KR4.1. Chương trình Vì đàn em thân yêu' },
  { id: 'KR4.2', title: 'KR4.2. Công tác quốc tế thanh niên' },
  { id: 'KR5.1', title: 'KR5.1. Xây dựng Đoàn vững mạnh về tư tưởng chính trị' },
  { id: 'KR5.2', title: 'KR5.2. Xây dựng Đoàn vững mạnh về tổ chức' },
  { id: 'KR5.3', title: 'KR5.3. Công tác kiểm tra, giám sát của Đoàn' },
  { id: 'KR5.4', title: 'KR5.4. Nâng cao vai trò nòng cốt chính trị đối với HSV, mở rộng mặt trận' },
  { id: 'KR5.5', title: 'KR5.5. Đoàn tham gia xây dựng, bảo vệ Đảng và hệ thống chính trị' },
  { id: 'KR6.1', title: 'KR6.1. Công tác tham mưu' },
  { id: 'KR6.2', title: 'KR6.2. Công tác phối hợp' },
  { id: 'KR6.3', title: 'KR6.3. Công tác chỉ đạo' },
  { id: 'KR7.1', title: 'KR7.1. Sáng tạo trong Công tác giáo dục' },
  { id: 'KR7.2', title: 'KR7.2. Sáng tạo trong Hoạt động phong trào' },
  { id: 'KR7.3', title: 'KR7.3. Sáng tạo trong Công tác xây dựng Đoàn và mở rộng đoàn kết' },
  { id: 'KR7.4', title: 'KR7.4. Sáng tạo trong Công tác tham mưu, phối hợp, chỉ đạo' },
  { id: 'KR8.1', title: 'KR8.1. Chủ động với đơn vị' },
  { id: 'KR8.2', title: 'KR8.2. Chủ động với cấp thành, cấp trung ương' },
];

export function calculateRankGrade(totalScore: number, academicYearNumber?: number): 'Hoàn thành xuất sắc nhiệm vụ' | 'Hoàn thành tốt nhiệm vụ' | 'Hoàn thành nhiệm vụ' | 'Không hoàn thành nhiệm vụ' {
  const score = Number.isFinite(totalScore) ? totalScore : 0;
  if (score >= 90) return 'Hoàn thành xuất sắc nhiệm vụ';
  if (score >= 80) return 'Hoàn thành tốt nhiệm vụ';
  if (score >= 50) return 'Hoàn thành nhiệm vụ';
  return 'Không hoàn thành nhiệm vụ';
}

/**
 * Xếp loại thi đua rèn luyện chung 5 mức quy chuẩn:
 * Xuất sắc, Tốt, Khá, Trung bình, Yếu (Không áp dụng mức trần 100)
 */
export function calculateGeneralRank(totalScore: number): 'Xuất sắc' | 'Tốt' | 'Khá' | 'Trung bình' | 'Yếu' {
  const score = Number.isFinite(totalScore) ? totalScore : 0;
  if (score >= 90) return 'Xuất sắc';
  if (score >= 80) return 'Tốt';
  if (score >= 65) return 'Khá';
  if (score >= 50) return 'Trung bình';
  return 'Yếu';
}

export const DEFAULT_CERTIFICATE_TEMPLATE = {
  id: 'tpl_default_2026',
  title: 'GIẤY CHỨNG NHẬN',
  subTitle: 'BAN CHẤP HÀNH ĐOÀN TRƯỜNG ĐẠI HỌC NÔNG LÂM TP. HỒ CHÍ MINH',
  introText: 'CHỨNG NHẬN ĐỒNG CHÍ:',
  contentTemplate: 'Đã hoàn thành xuất sắc nhiệm vụ và tích cực tham gia chương trình hoạt động phong trào Đoàn - Hội',
  signatoryTitle: 'TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG\nBÍ THƯ',
  signatoryName: 'ThS. Lê Hoàng Tuấn',
  themeColor: 'gold' as const,
  fontStyle: 'classic' as const,
  borderStyle: 'double' as const,
  showQrCode: true,
  academicYear: CURRENT_ACADEMIC_YEAR,
};

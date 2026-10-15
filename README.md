# NLU Youth 2026 - Hệ Thống Quản Lý Hoạt Động & Điểm Rèn Luyện

> **Đại học Nông Lâm TP. Hồ Chí Minh**  
> Bản phát hành nâng cấp: Tái cấu trúc thanh điều hướng mô-đun và đồng bộ giao diện toàn diện.

---

## 1. Giới Thiệu
NLU Youth 2026 là nền tảng quản lý số hóa toàn diện dành cho Đoàn Thanh niên - Hội Sinh viên Trường Đại học Nông Lâm TP.HCM. Hệ thống phục vụ việc quản lý hoạt động, điểm danh mã QR, tính toán Điểm Rèn luyện (ĐRL), hồ sơ Sinh viên 5 Tốt (SV5T), cấp phát Giấy chứng nhận điện tử và theo dõi thi đua 53 đơn vị Đoàn - Hội trực thuộc.

---

## 2. Kiến Trúc Thanh Điều Hướng (Modular Header)

Hệ thống điều hướng đã được tách nhỏ thành các component độc lập tại `src/components/header/`:

| Component | Đường dẫn | Chức năng chính |
|---|---|---|
| **AppHeader** | `src/components/header/AppHeader.tsx` | Main container điều phối Top Banner, Brand, Nav desktop, Mobile Drawer và Modals |
| **BrandSection** | `src/components/header/BrandSection.tsx` | Logo NLU, nhận diện thương hiệu, tên hệ thống và nút sửa logo Cấp 4 |
| **DesktopNavigation** | `src/components/header/DesktopNavigation.tsx` | Thanh menu ngang trên desktop, tự động gọi NavigationGroup hoặc NavigationItem |
| **MobileNavigationDrawer** | `src/components/header/MobileNavigationDrawer.tsx` | Ngăn kéo di động accordion cho điện thoại, tự động mở nhóm chức năng đang chọn |
| **NavigationGroup** | `src/components/header/NavigationGroup.tsx` | Nhóm phân hệ có sub-menus với dropdown popover tinh gọn |
| **NavigationItem** | `src/components/header/NavigationItem.tsx` | Nút điều hướng đơn lẻ với viền dưới active (prominent bottom underline) |
| **HeaderActions** | `src/components/header/HeaderActions.tsx` | Cụm công cụ: PWA, Trợ giúp, Dark/Light Mode, Đồng bộ, Sao lưu Drive, Thùng rác |
| **UserProfileMenu** | `src/components/header/UserProfileMenu.tsx` | Thẻ danh tính Google SSO, huy hiệu phân quyền Cấp 0–4 và chuyển vai trò |
| **NavigationSearch** | `src/components/header/NavigationSearch.tsx` | Modal tìm kiếm nhanh phân hệ với phím tắt `⌘K` / `Ctrl+K` |

---

## 3. Cấu Hình Điều Hướng Tập Trung
Tất cả các mục menu chính và menu con được định nghĩa tập trung tại `src/config/navigationConfig.ts`:
- **`CANONICAL_NAVIGATION_CONFIG`**: Định nghĩa 11 phân hệ và các phân hệ con.
- **Tự động đồng bộ**: Đồng bộ hai chiều với `customNavItems` của quản trị viên và Firestore.

---

## 4. Các Sửa Đổi Nghiệp Vụ Quan Trọng
1. **Quản Lý Quy Điểm (`system-catalogs`):** Kết nối trực tiếp đến `<ScoringCatalogsManagement />` (8 danh mục chuẩn hóa: ĐRL, SV5T, quy mô đối tượng, đơn vị, mảng CT Đoàn/Hội).
2. **Điểm Danh QR (`checkin-qr`):** Mở trực tiếp chế độ quét mã tự động `<StudentCheckIn embeddedMode={true} />`.
3. **Bảng Thi Đua Cơ Sở:** Các nhánh 16 Khoa, Chi đoàn cơ sở, 37 CLB/Đội/Nhóm liên kết chính xác vào từng sub-tab của `<ScoreRoster />`.
4. **Hiệu năng:** Áp dụng `React.lazy` và `Suspense` cho toàn bộ các phân hệ lớn trong `App.tsx`.
5. **Sắp xếp Menu:** Bổ sung nút ArrowUp/ArrowDown và phím tắt bàn phím `Alt + ArrowUp/Down` trong `MenuEditorModal`.

---

## 5. Hướng Dẫn Phát Triển & Kiểm Thử
```bash
# Cài đặt thư viện
npm install

# Kiểm tra Linter và TypeScript
npm run lint

# Khởi chạy môi trường phát triển (Dev Server port 3000)
npm run dev

# Biên dịch kiểm thử Production
npm run build
```

---
© 2026 Ban Thường vụ Đoàn Trường Đại học Nông Lâm TP.HCM. Bảo lưu mọi quyền.

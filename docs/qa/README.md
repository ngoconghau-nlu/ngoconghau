# Tài Liệu Kiểm Thử Giao Diện & Điều Hướng (QA) - NLU Youth 2026

Tài liệu ghi nhận kết quả kiểm thử giao diện và điều hướng của hệ thống NLU Youth 2026 sau khi tái cấu trúc mô-đun:

---

## 1. Kịch Bản Kiểm Thử 1: Tổng Quan Máy Tính (Desktop 1440px)
- **Mục tiêu**: Kiểm tra giao diện máy tính để bàn và màn hình lớn.
- **Tiêu chuẩn đạt được**:
  + Thanh menu ngang hiển thị đầy đủ 11 phân hệ và các nhóm phân hệ con (`NavigationGroup`).
  + Hover và focus-visible hiển thị tooltip mô tả và viền dưới nhận diện (prominent bottom underline).
  + Dropdown menu cấu hình Cấp 4 (`Settings2`) mở nhanh, thao tác không bị lệch vị trí.
  + Không xuất hiện thanh cuộn ngang ngoài ý muốn.

---

## 2. Kịch Bản Kiểm Thử 2: Menu Điện Thoại (Mobile 375px)
- **Mục tiêu**: Kiểm tra giao diện di động trên màn hình hẹp (375px - 414px).
- **Tiêu chuẩn đạt được**:
  + Nút mở menu chính (Menu Drawer Trigger) nổi bật ở góc phải header.
  + Ngăn kéo `MobileNavigationDrawer` mở mượt mà từ bên phải.
  + Tự động mở nhóm (accordion) chứa phân hệ đang được chọn (`defaultExpandedId`).
  + Kích thước vùng chạm tối thiểu đạt chuẩn $\ge 44\text{px}$.
  + Đóng nhanh bằng phím `Escape`, nút X hoặc chạm vào nền mờ (backdrop).
  + Tích hợp đầy đủ các chức năng: tìm kiếm, đổi theme, đăng xuất, sao lưu, thùng rác.

---

## 3. Kịch Bản Kiểm Thử 3: Giao Diện Tối (Dark Mode)
- **Mục tiêu**: Kiểm tra khả năng tương phản và đồng bộ màu ban đêm.
- **Tiêu chuẩn đạt được**:
  + Nền màu `slate-900` / `slate-950` kết hợp sắc xanh `emerald-600` / `emerald-400` chuẩn nhận diện NLU.
  + Độ tương phản chữ và icon đạt chuẩn WCAG AA (tối thiểu 4.5:1).
  + Chuyển đổi giữa Chế độ Sáng và Tối tức thì, không gây giật lag hay nhấp nháy layout shift.

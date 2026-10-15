/**
 * Utility functions for exporting official Youth Union reports to PDF / Offline HTML
 * Supports:
 * 1. Sổ điểm sinh viên & Đánh giá phân loại đoàn viên
 * 2. Bảng xếp hạng thi đua Đoàn Khoa
 * 3. Bảng xếp hạng thi đua Chi đoàn
 * 4. Bảng xếp hạng thi đua Câu lạc bộ, Đội, Nhóm
 */

export interface ExportReportOptions {
  title: string;
  subTitle?: string;
  academicYear?: string;
  semester?: string;
  unitName?: string;
  scopeLabel?: string;
  generatedBy?: string;
  signerTitle?: string;
  signerName?: string;
  orientation?: 'portrait' | 'landscape';
  summaryStats?: Array<{ label: string; value: string | number; note?: string }>;
  columns: Array<{ header: string; key: string; width?: string; align?: 'left' | 'center' | 'right' }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Array<Record<string, any>>;
}

export function generateReportHtml(options: ExportReportOptions): string {
  const {
    title,
    subTitle = 'HỆ THỐNG QUẢN LÝ HOẠT ĐỘNG & ĐIỂM RÈN LUYỆN ĐOÀN VIÊN NLU',
    academicYear = '2025 - 2026',
    semester = 'Học kỳ 2',
    unitName = 'ĐOÀN TRƯỜNG ĐẠI HỌC NÔNG LÂM TP. HỒ CHÍ MINH',
    scopeLabel = 'Toàn trường',
    generatedBy = 'Cán bộ Quản trị Hệ thống',
    signerTitle = 'TM. BAN THƯỜNG VỤ ĐOÀN TRƯỜNG\nBÍ THƯ',
    signerName = 'ThS. Nguyễn Văn A',
    orientation = 'landscape',
    summaryStats = [],
    columns,
    rows
  } = options;

  const currentDate = new Date();
  const dateStr = `TP. Hồ Chí Minh, ngày ${currentDate.getDate()} tháng ${currentDate.getMonth() + 1} năm ${currentDate.getFullYear()}`;
  const reportCode = `NLU-YOUTH-${Date.now().toString().slice(-6)}`;

  const statsHtml = summaryStats.length > 0
    ? `
      <div class="summary-box">
        <div class="summary-title">THỐNG KÊ TỔNG QUAN</div>
        <div class="summary-grid">
          ${summaryStats.map(s => `
            <div class="summary-card">
              <div class="stat-label">${s.label}</div>
              <div class="stat-value">${s.value}</div>
              ${s.note ? `<div class="stat-note">${s.note}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `
    : '';

  const tableHeaders = columns.map(c => `
    <th style="width: ${c.width || 'auto'}; text-align: ${c.align || 'left'};">
      ${c.header}
    </th>
  `).join('');

  const tableRows = rows.map((row, idx) => `
    <tr>
      <td style="text-align: center; font-weight: 500;">${idx + 1}</td>
      ${columns.slice(1).map(c => {
        const val = row[c.key] ?? '-';
        const align = c.align || 'left';
        let formattedVal = val;
        if (typeof val === 'number') {
          formattedVal = Number.isInteger(val) ? val.toLocaleString('vi-VN') : val.toFixed(1);
        }
        return `<td style="text-align: ${align};">${formattedVal}</td>`;
      }).join('')}
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title} - ${academicYear}</title>
  <style>
    @page {
      size: A4 ${orientation};
      margin: 12mm 10mm 15mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: "Times New Roman", Times, serif, system-ui;
      font-size: 11pt;
      line-height: 1.35;
      color: #111827;
      background: #ffffff;
      margin: 0;
      padding: 10px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: top;
      padding: 0;
    }
    .unit-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
    }
    .sub-unit {
      font-size: 9.5pt;
      font-weight: bold;
      text-align: center;
      margin-top: 2px;
    }
    .motto-title {
      font-size: 10pt;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
    }
    .motto-sub {
      font-size: 9.5pt;
      font-weight: bold;
      text-align: center;
      margin-top: 2px;
    }
    .line-divider {
      width: 120px;
      height: 1px;
      background: #111827;
      margin: 4px auto 0 auto;
    }
    .doc-number {
      font-size: 9pt;
      margin-top: 4px;
      text-align: center;
      font-style: italic;
    }
    .date-line {
      font-size: 9.5pt;
      font-style: italic;
      text-align: center;
      margin-top: 4px;
    }
    .report-title-container {
      text-align: center;
      margin: 16px 0 12px 0;
    }
    .main-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      color: #047857;
      margin: 0;
    }
    .sub-title-info {
      font-size: 10.5pt;
      font-weight: bold;
      color: #374151;
      margin-top: 4px;
    }
    .scope-info {
      font-size: 9.5pt;
      font-style: italic;
      color: #6b7280;
      margin-top: 2px;
    }
    .summary-box {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }
    .summary-title {
      font-size: 9pt;
      font-weight: bold;
      color: #0f172a;
      text-transform: uppercase;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .summary-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .summary-card {
      flex: 1;
      min-width: 110px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 6px 8px;
      text-align: center;
    }
    .stat-label {
      font-size: 8.5pt;
      color: #475569;
      font-weight: bold;
    }
    .stat-value {
      font-size: 13pt;
      font-weight: bold;
      color: #047857;
      margin: 2px 0;
    }
    .stat-note {
      font-size: 7.5pt;
      color: #64748b;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 16px;
    }
    .data-table th, .data-table td {
      border: 1px solid #94a3b8;
      padding: 5px 6px;
    }
    .data-table th {
      background: #e2e8f0;
      color: #0f172a;
      font-weight: bold;
      text-align: center;
      font-size: 8.5pt;
      text-transform: uppercase;
    }
    .data-table tr:nth-child(even) td {
      background: #f8fafc;
    }
    .footer-sign-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 18px;
      page-break-inside: avoid;
    }
    .footer-sign-table td {
      vertical-align: top;
      text-align: center;
      width: 50%;
      font-size: 10pt;
    }
    .sign-title {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .sign-sub {
      font-style: italic;
      font-size: 8.5pt;
      color: #4b5563;
      margin-bottom: 45px;
    }
    .sign-name {
      font-weight: bold;
      font-size: 10.5pt;
    }
    .meta-bar {
      margin-top: 15px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #6b7280;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Formal Youth Union Header -->
  <table class="header-table">
    <tr>
      <td style="width: 48%;">
        <div class="unit-title">${unitName}</div>
        <div class="sub-unit">${subTitle}</div>
        <div class="line-divider"></div>
        <div class="doc-number">Mã văn bản: ${reportCode}</div>
      </td>
      <td style="width: 4%;"></td>
      <td style="width: 48%;">
        <div class="motto-title">ĐOÀN TNCS HỒ CHÍ MINH</div>
        <div class="motto-sub">BAN CHẤP HÀNH ĐOÀN TRƯỜNG</div>
        <div class="line-divider"></div>
        <div class="date-line">${dateStr}</div>
      </td>
    </tr>
  </table>

  <!-- Main Report Title -->
  <div class="report-title-container">
    <h1 class="main-title">${title}</h1>
    <div class="sub-title-info">ÁP DỤNG CHO: ${semester.toUpperCase()} - NĂM HỌC ${academicYear}</div>
    <div class="scope-info">Phạm vi thống kê: ${scopeLabel} · Tổng số bản ghi: ${rows.length} đơn vị/đoàn viên</div>
  </div>

  <!-- Summary Statistics -->
  ${statsHtml}

  <!-- Main Data Table -->
  <table class="data-table">
    <thead>
      <tr>
        ${tableHeaders}
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <!-- Official Signature Block -->
  <table class="footer-sign-table">
    <tr>
      <td>
        <div class="sign-title">NGƯỜI LẬP BẢNG BÁO CÁO</div>
        <div class="sign-sub">(Ký, ghi rõ họ tên & chức vụ)</div>
        <div class="sign-name">${generatedBy}</div>
      </td>
      <td>
        <div class="sign-title">${signerTitle.replace(/\n/g, '<br>')}</div>
        <div class="sign-sub">(Ký tên và đóng dấu)</div>
        <div class="sign-name">${signerName}</div>
      </td>
    </tr>
  </table>

  <div class="meta-bar">
    <span>Hệ thống Quản lý Hoạt động & Điểm Rèn Luyện NLU Youth Portal</span>
    <span>Trích xuất lúc: ${currentDate.toLocaleTimeString('vi-VN')} ${currentDate.toLocaleDateString('vi-VN')}</span>
    <span>Bản quyền © Đoàn Thanh niên ĐH Nông Lâm TP.HCM</span>
  </div>

</body>
</html>
  `;
}

/**
 * Triggers instant printing / Save as PDF via browser standard print dialog
 */
export function printReportAsPdf(options: ExportReportOptions) {
  const html = generateReportHtml(options);
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  } else {
    // Fallback if popup blocker is active
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bao_Cao_${options.title.replace(/\s+/g, '_')}_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

/**
 * Downloads standalone offline HTML report that can be opened anywhere without internet
 */
export function downloadOfflineReport(options: ExportReportOptions) {
  const html = generateReportHtml(options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Bao_Cao_Offline_${options.title.replace(/\s+/g, '_')}_${options.academicYear?.replace(/\s+/g, '') || 'NLU'}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

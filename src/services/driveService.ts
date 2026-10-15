import { DriveItem } from '../types';

/**
 * Service to interact directly with Google Drive v3 REST API
 * using OAuth Bearer Token from client-side Firebase Auth.
 */

export async function fetchDriveFiles(accessToken: string, queryFilter?: string): Promise<DriveItem[]> {
  try {
    let q = "trashed = false";
    if (queryFilter) {
      q += ` and (${queryFilter})`;
    }
    const params = new URLSearchParams({
      pageSize: '25',
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, size, modifiedTime)',
      orderBy: 'modifiedTime desc',
      q
    });

    const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Lỗi Google Drive API: ${res.statusText}`);
    }

    const data = await res.json();
    return (data.files || []).map((f: any) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      webViewLink: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
      thumbnailLink: f.thumbnailLink,
      size: f.size ? `${(parseInt(f.size) / (1024 * 1024)).toFixed(2)} MB` : undefined,
      modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString('vi-VN') : undefined,
    }));
  } catch (error) {
    console.error('Lỗi tải tệp từ Google Drive:', error);
    throw error;
  }
}

/**
 * Tạo một thư mục hoặc tệp ghi nhận trên Google Drive
 */
export async function createDriveFile(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain'
): Promise<DriveItem> {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: 'Tài liệu minh chứng - NLU Youth 2026',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append('file', new Blob([content], { type: mimeType }));

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || 'Không thể tạo file trên Google Drive');
  }

  const result = await res.json();
  return {
    id: result.id,
    name: result.name,
    mimeType: result.mimeType,
    webViewLink: result.webViewLink || `https://drive.google.com/file/d/${result.id}/view`,
  };
}

/**
 * Xóa file trên Google Drive (Yêu cầu xác nhận rõ ràng trước khi gọi)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok && res.status !== 204) {
    throw new Error('Lỗi khi xóa tệp trên Google Drive');
  }
  return true;
}

/**
 * Tự động sao lưu toàn bộ cơ sở dữ liệu hệ thống lên Google Drive (Yêu cầu 1)
 */
export async function backupDatabaseToDrive(accessToken: string, backupPayload: any): Promise<DriveItem> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `Backup_NLU_Youth_2026_${timestamp}.json`;
  const content = JSON.stringify(backupPayload, null, 2);
  return createDriveFile(accessToken, fileName, content, 'application/json');
}

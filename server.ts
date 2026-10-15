import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client safely with user agent telemetry
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

const ai = GEMINI_API_KEY ? new GoogleGenAI({
  apiKey: GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// API Route for AI Activity Title Normalization
app.post('/api/gemini/normalize-title', async (req, res) => {
  try {
    const { title, titles, context } = req.body;

    if (!title && (!titles || !Array.isArray(titles) || titles.length === 0)) {
      return res.status(400).json({ error: 'Missing title or titles array' });
    }

    const isBatch = Array.isArray(titles) && titles.length > 0;
    const inputPayload: string[] = isBatch ? titles : [title];

    if (!ai) {
      return res.json({
        success: false,
        fallback: isBatch ? inputPayload : inputPayload[0],
        message: 'Gemini API key is not configured. Falling back to rule-based engine.'
      });
    }

    const systemInstruction = `
Bạn là chuyên gia cố vấn truyền thông và quản lý hoạt động Đoàn - Hội - Đội của Trường Đại học Nông Lâm TP.HCM (NLU Youth).
Nhiệm vụ của bạn là CHUẨN HÓA các tên hoạt động / tên chương trình viết tắt, viết vắt, ngắn ngủi, sơ xài thành TÊN CHƯƠNG TRÌNH ĐẦY ĐỦ, CHUYÊN NGHIỆP, TRỌN VẸN Ý NGHĨA.

Quy tắc chuẩn hóa:
1. Giữ nguyên bản chất, chủ đề và ý định cốt lõi của hoạt động ban đầu. Không tự thêm năm hay các cụm từ không có căn cứ.
2. Mở rộng tất cả các từ viết tắt tiếng Việt/Đoàn Hội:
   - "MHX" -> "Chiến dịch Tình nguyện Mùa Hè Xanh"
   - "XTN" -> "Chiến dịch Tình nguyện Xuân Tình Nguyện"
   - "SHCD" -> "Tuần sinh hoạt công dân - sinh viên"
   - "ĐRL" -> "Điểm rèn luyện"
   - "SV5T" -> "Phong trào Sinh viên 5 tốt"
   - "NCKH" -> "Hội nghị Nghiên cứu Khoa học"
   - "HMTN" -> "Ngày hội Hiến máu Nhân đạo"
   - "Bí thư CS" -> "Bí thư Chi đoàn Cơ sở"
   - "CLB" -> "Câu lạc bộ"
   - "Lớp cán bộ" -> "Khóa Tập huấn Kỹ năng Cán bộ Đoàn - Hội"
3. Chuẩn hóa chính tả tiếng Việt chuẩn, viết hoa đầu từ chính danh.
4. Trả về đúng định dạng JSON: { "results": ["Tên đã chuẩn hóa 1", "Tên đã chuẩn hóa 2"] }.
`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: `Hãy chuẩn hóa danh sách tên hoạt động sau đây: ${JSON.stringify(inputPayload)}${context ? ` (Bối cảnh: ${JSON.stringify(context)})` : ''}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      }
    });

    const responseText = response.text || '';
    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { results: inputPayload };
    }

    const results = Array.isArray(parsed?.results) ? parsed.results : (parsed?.normalizedTitle ? [parsed.normalizedTitle] : [responseText.trim()]);

    if (isBatch) {
      return res.json({ success: true, results });
    } else {
      return res.json({ success: true, normalizedTitle: results[0] || title });
    }
  } catch (error: any) {
    console.warn('AI title normalization failed, returning rule fallback:', error?.message);
    return res.json({
      success: false,
      fallback: req.body.title || (req.body.titles ? req.body.titles[0] : ''),
      message: 'Lỗi khi gọi Gemini API, chuyển sang quy tắc chuẩn hóa offline.'
    });
  }
});

// ----------------------------------------------------
// MONGODB REST API ENDPOINTS
// ----------------------------------------------------
import {
  connectToMongo,
  getMongoStatus,
  getCollectionDocs,
  saveCollectionDoc,
  bulkSaveCollectionDocs,
  deleteCollectionDoc,
  bulkDeleteCollectionDocs,
  cleanupMongoDuplicates,
  exportPackageFromMongo,
  importPackageToMongo
} from './src/server/mongoManager.js';

// Auto-connect MongoDB on startup
connectToMongo().catch(err => console.warn('MongoDB initial connection attempt:', err?.message));

// Check status
app.get('/api/mongo/status', async (_req, res) => {
  try {
    const status = await getMongoStatus();
    res.json({ success: true, ...status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Configure or test MONGODB_URI
app.post('/api/mongo/config', async (req, res) => {
  try {
    const { uri } = req.body;
    const result = await connectToMongo(uri);
    const status = await getMongoStatus();
    res.json({ success: result.success, message: result.message, status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Get collection docs
app.get('/api/mongo/collections/:name', async (req, res) => {
  try {
    const docs = await getCollectionDocs(req.params.name);
    res.json({ success: true, collection: req.params.name, count: docs.length, data: docs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Save single doc
app.post('/api/mongo/collections/:name', async (req, res) => {
  try {
    const result = await saveCollectionDoc(req.params.name, req.body);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Bulk save docs
app.post('/api/mongo/collections/:name/bulk', async (req, res) => {
  try {
    const { items } = req.body;
    const result = await bulkSaveCollectionDocs(req.params.name, items || []);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Delete single doc
app.delete('/api/mongo/collections/:name/:id', async (req, res) => {
  try {
    const deleted = await deleteCollectionDoc(req.params.name, req.params.id);
    res.json({ success: deleted });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Bulk delete docs
app.post('/api/mongo/collections/:name/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const result = await bulkDeleteCollectionDocs(req.params.name, ids || []);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Full database migration seed
app.post('/api/mongo/migrate-all', async (req, res) => {
  try {
    const payload = req.body || {};
    const report: Record<string, number> = {};

    for (const [colName, items] of Object.entries(payload)) {
      if (Array.isArray(items) && items.length > 0) {
        const resStats = await bulkSaveCollectionDocs(colName, items);
        report[colName] = resStats.count;
      }
    }

    res.json({ success: true, report, message: 'Đã hoàn tất đồng bộ toàn bộ dữ liệu ứng dụng sang MongoDB!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Cleanup duplicates
app.post('/api/mongo/cleanup-duplicates', async (_req, res) => {
  try {
    const report = await cleanupMongoDuplicates();
    res.json({ success: true, ...report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Export package
app.get('/api/mongo/export-package', async (_req, res) => {
  try {
    const packageData = await exportPackageFromMongo();
    res.json({ success: true, package: packageData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

// Import package
app.post('/api/mongo/import-package', async (req, res) => {
  try {
    const result = await importPackageToMongo(req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});


// Configure Vite Express middlewares in dev mode
if (process.env.NODE_ENV !== 'production') {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
    appType: 'custom',
  });
  app.use(vite.middlewares);
  app.use('*', async (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) return next();
    try {
      const url = req.originalUrl;
      const fs = await import('fs/promises');
      let template = await fs.readFile(path.resolve('./index.html'), 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
} else {
  // Static serve in production
  app.use(express.static('dist'));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve('./dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

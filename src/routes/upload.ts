// ============================================================
// ROUTE: POST /upload
// Accepts a CSV file upload, parses and validates it,
// and returns structured transaction JSON.
// ============================================================

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { parseCSV } from '../services/parser';

const router = Router();

// Store uploaded file in memory (no disk I/O needed)
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /upload
 * Body: multipart/form-data with a "file" field containing the CSV
 * Returns: { success, transactions, errors, rowCount }
 */
router.post('/', upload.single('file'), (req: Request, res: Response): void => {
  try {
    // Validate that a file was provided
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded. Please attach a CSV file with the field name "file".',
      });
      return;
    }

    // Read the file buffer as UTF-8 text
    const csvText = req.file.buffer.toString('utf-8');

    // Parse and validate
    const result = parseCSV(csvText);

    // Return appropriate status based on validation
    const status = result.success ? 200 : 207; // 207 = partial success (some rows failed)
    res.status(status).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process CSV file.',
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;

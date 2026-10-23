import { Router, Request, Response, NextFunction } from 'express';
import { runDataQualityScan, processBulkImport } from '../services/dataQualityService.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const qualityRouter = Router();

// Run or view data quality audit
qualityRouter.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await runDataQualityScan();
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Bulk import endpoint
qualityRouter.post(
  '/bulk-import',
  authenticate,
  authorize(['PLATFORM_ADMIN', 'MESS_ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rows } = req.body;
      if (!rows || !Array.isArray(rows)) {
        return res
          .status(400)
          .json({ success: false, error: { message: 'Payload must contain a "rows" array.' } });
      }

      const report = await processBulkImport(rows);
      res.json({
        success: true,
        message: `Import processed: ${report.acceptedCount} accepted, ${report.rejectedCount} rejected.`,
        data: report,
      });
    } catch (err) {
      next(err);
    }
  }
);

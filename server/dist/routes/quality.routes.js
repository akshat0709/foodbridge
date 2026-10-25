import { Router } from 'express';
import { runDataQualityScan, processBulkImport } from '../services/dataQualityService.js';
import { authenticate, authorize } from '../middleware/auth.js';
export const qualityRouter = Router();
// Run or view data quality audit
qualityRouter.get('/', authenticate, authorize(['PLATFORM_ADMIN']), async (req, res, next) => {
    try {
        const result = await runDataQualityScan();
        res.json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// Bulk import endpoint
qualityRouter.post('/bulk-import', authenticate, authorize(['PLATFORM_ADMIN', 'MESS_ADMIN']), async (req, res, next) => {
    try {
        const { rows } = req.body;
        if (!rows || !Array.isArray(rows)) {
            return res
                .status(400)
                .json({ success: false, error: { message: 'Payload must contain a "rows" array.' } });
        }
        // Mess admins may only import rows for their own mess.
        if (req.user.role === 'MESS_ADMIN') {
            const foreign = rows.find((r) => String(r?.messId) !== String(req.user.organizationId));
            if (foreign || !req.user.organizationId) {
                return res.status(403).json({
                    success: false,
                    error: { code: 'FORBIDDEN', message: 'You can only import meal logs for your own mess.' },
                });
            }
        }
        const report = await processBulkImport(rows);
        res.json({
            success: true,
            message: `Import processed: ${report.acceptedCount} accepted, ${report.rejectedCount} rejected.`,
            data: report,
        });
    }
    catch (err) {
        next(err);
    }
});

import { Router, Request, Response, NextFunction } from 'express';
import { BenchmarkResult } from '../models/BenchmarkResult.js';
import { runBenchmarkSuite, BENCHMARK_QUERIES } from '../services/benchmarkService.js';
import { authenticate, authorize } from '../middleware/auth.js';

export const benchmarkRouter = Router();

// Get benchmark results
benchmarkRouter.get('/', authenticate, authorize(['PLATFORM_ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scale = '100k' } = req.query;
    let results = await BenchmarkResult.find({ datasetScale: scale }).sort({ runAt: -1 }).lean();

    // If no results for this scale yet, run them automatically or provide reference baseline
    if (results.length === 0) {
      await runBenchmarkSuite(scale as string);
      results = await BenchmarkResult.find({ datasetScale: scale }).sort({ runAt: -1 }).lean();
    }

    // Organize by queryId
    const queryCards: any = {};
    BENCHMARK_QUERIES.forEach(q => {
      queryCards[q.id] = {
        id: q.id,
        name: q.name,
        description: q.description,
        indexed: results.find(r => r.queryId === q.id && r.useIndex),
        unindexed: results.find(r => r.queryId === q.id && !r.useIndex),
      };
    });

    res.json({
      success: true,
      data: {
        results,
        queryCards: Object.values(queryCards),
        availableScales: ['10k', '100k', '1M'],
        currentScale: scale,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Run benchmark on demand
benchmarkRouter.post('/run', authenticate, authorize(['PLATFORM_ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const scale = (req.body.scale as string) || '100k';
    const results = await runBenchmarkSuite(scale);
    res.json({
      success: true,
      message: `Completed benchmark suite across 8 queries for scale ${scale}`,
      data: results,
    });
  } catch (err) {
    next(err);
  }
});

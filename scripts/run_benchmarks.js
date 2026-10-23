import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { runBenchmarkSuite } from '../server/src/services/benchmarkService.js';

dotenv.config({ path: '../server/.env' });
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/foodbridge';

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log('[Benchmarks Harness] Connected to MongoDB.');

  const scale = process.argv.includes('--scale')
    ? process.argv[process.argv.indexOf('--scale') + 1]
    : '100k';

  console.log(`[Benchmarks Harness] Running benchmark suite at scale ${scale}...`);
  const results = await runBenchmarkSuite(scale);

  console.log('\n=================== BENCHMARK HARNESS RESULTS ===================');
  console.log('Query ID                       | Mode      | Latency (ms) | Docs Examined | Scan Type');
  console.log('-------------------------------------------------------------------------');
  results.forEach(r => {
    const mode = r.useIndex ? 'INDEXED  ' : 'UNINDEXED';
    const scan = r.collectionScanned ? 'COLLSCAN' : 'IXSCAN  ';
    console.log(
      `${r.queryId.padEnd(30)} | ${mode} | ${String(r.executionTimeMs).padStart(12)} | ${String(r.docsExamined).padStart(13)} | ${scan}`
    );
  });
  console.log('=========================================================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('[Benchmarks Harness] Error:', err);
  process.exit(1);
});

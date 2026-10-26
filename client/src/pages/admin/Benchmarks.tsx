import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Gauge, Play, Database, Layers, CheckCircle2, Cpu } from 'lucide-react';

export const Benchmarks: React.FC = () => {
  const [scale, setScale] = useState<string>('100k');
  const [benchmarkData, setBenchmarkData] = useState<any | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const fetchBenchmarks = (targetScale = scale) => {
    apiRequest(`/benchmarks?scale=${targetScale}`)
      .then(setBenchmarkData)
      .catch(console.error);
  };

  useEffect(() => {
    fetchBenchmarks(scale);
  }, [scale]);

  const handleRun = async () => {
    setIsRunning(true);
    setRunMessage(null);
    try {
      const res = await apiRequest('/benchmarks/run', {
        method: 'POST',
        body: JSON.stringify({ scale }),
      });
      setRunMessage(res.message);
      fetchBenchmarks(scale);
    } catch (e: any) {
      alert(e.message || 'Benchmark execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const queryCards = benchmarkData?.queryCards || [];

  // Chart data: compare indexed vs unindexed latency (ms)
  const chartData = queryCards.map((qc: any) => ({
    query: qc.id.replace('Q', '').replace('_', ' ').slice(0, 14),
    name: qc.name,
    indexedLatencyMs: qc.indexed?.executionTimeMs || 0,
    unindexedLatencyMs: qc.unindexed?.executionTimeMs || 0,
    speedup:
      qc.indexed?.executionTimeMs > 0
        ? ((qc.unindexed?.executionTimeMs || 1) / qc.indexed.executionTimeMs).toFixed(1)
        : '1.0',
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight text-text-primary-light dark:text-text-primary-dark">
            Query benchmarks
          </h1>
          <p className="text-[15px] text-text-secondary-light dark:text-text-secondary-dark mt-1 max-w-2xl">
          How eight representative queries perform with and without indexes, and how fast bulk imports run.
        </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Scale Selector */}
          <div className="flex items-center gap-1 p-0.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-xs font-mono">
            {['10k', '100k', '1M'].map(sc => (
              <button
                key={sc}
                onClick={() => setScale(sc)}
                className={`px-2.5 py-1 rounded-xs transition-colors ${
                  scale === sc
                    ? 'bg-brand text-white font-semibold'
                    : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-medium text-xs text-white bg-brand hover:bg-brand-dark transition-colors shadow-2xs disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Benchmarking 8 Queries...' : 'Run Benchmark Suite'}</span>
          </button>
        </div>
      </div>

      {runMessage && (
        <div className="p-3 rounded bg-[#E1EFE6] dark:bg-[#1B3A2A] border border-[#C6DFCF] text-xs text-[#1E5B3C] dark:text-[#9FD4B2] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{runMessage}</span>
        </div>
      )}

      {/* Latency Comparison Chart (Log Scale / Grouped Bars) */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Query Latency: Composite Index (IXSCAN) vs Full Table Scan (COLLSCAN) (ms)
            </h2>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
              Empirical latency recorded from <code className="font-mono bg-bg-light dark:bg-bg-dark px-1 rounded">explain("executionStats")</code> at dataset scale {scale}.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-brand">Scale: {scale} records</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCE3E0" opacity={0.4} />
              <XAxis dataKey="query" tick={{ fontSize: 10 }} />
              <YAxis unit=" ms" tick={{ fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#16201C',
                  borderColor: '#25332D',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="indexedLatencyMs" fill="#1E5B3C" radius={[3, 3, 0, 0]} name="Indexed IXSCAN Latency (ms)" />
              <Bar dataKey="unindexedLatencyMs" fill="#B4432E" radius={[3, 3, 0, 0]} name="Unindexed COLLSCAN Latency (ms)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Benchmark Results Table */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          Representative Query Execution Profiles & Evidence Table
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark text-left text-text-muted-light font-medium">
                <th className="py-2.5 px-3 font-sans">Representative Query ID & Description</th>
                <th className="py-2.5 px-3 text-right">Indexed (ms)</th>
                <th className="py-2.5 px-3 text-right">Unindexed (ms)</th>
                <th className="py-2.5 px-3 text-right">Speedup</th>
                <th className="py-2.5 px-3 text-right">Docs Examined</th>
                <th className="py-2.5 px-3 text-right">Docs Returned</th>
                <th className="py-2.5 px-3 text-right">Throughput</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {queryCards.map((card: any) => {
                const idxMs = card.indexed?.executionTimeMs || 1;
                const noIdxMs = card.unindexed?.executionTimeMs || 1;
                const speedup = (noIdxMs / idxMs).toFixed(1);

                return (
                  <tr key={card.id} className="hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark">
                    <td className="py-3 px-3">
                      <div className="font-sans font-medium text-text-primary-light dark:text-text-primary-dark">
                        {card.name}
                      </div>
                      <div className="text-xs font-sans text-text-muted-light dark:text-text-muted-dark leading-snug mt-0.5">
                        {card.description}
                      </div>
                      <div className="text-xs text-text-muted-light font-mono mt-1">
                        [{card.id}]
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-brand">{idxMs} ms</td>
                    <td className="py-3 px-3 text-right font-bold text-danger">{noIdxMs} ms</td>
                    <td className="py-3 px-3 text-right font-bold text-brand">{speedup}x</td>

                    <td className="py-3 px-3 text-right">
                      {card.indexed?.docsExamined?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {card.indexed?.docsReturned?.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right text-text-secondary-light">
                      {card.indexed?.throughputRps ? `${card.indexed.throughputRps} rps` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

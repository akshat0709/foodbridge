import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import {
  ShieldCheck,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  FileText,
  Clock,
  Layers,
  Search,
} from 'lucide-react';

export const DataQuality: React.FC = () => {
  const [quality, setQuality] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bulk import state
  const [importInput, setImportInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [report, setReport] = useState<any | null>(null);

  const fetchQuality = () => {
    setIsLoading(true);
    apiRequest('/quality')
      .then(setQuality)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchQuality();
  }, []);

  const handleBulkImport = async () => {
    setIsProcessing(true);
    setReport(null);
    try {
      let rows: any[] = [];
      if (importInput.trim().startsWith('[')) {
        rows = JSON.parse(importInput);
      } else {
        const lines = importInput.trim().split('\n');
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length >= 7) {
            rows.push({
              messId: parts[0],
              date: parts[1],
              mealType: parts[2],
              foodCategory: parts[3],
              preparedKg: parseFloat(parts[4]),
              servedKg: parseFloat(parts[5]),
              leftoverKg: parseFloat(parts[6]),
              plannedAttendance: 500,
              actualAttendance: 480,
            });
          }
        }
      }

      const res = await apiRequest('/quality/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
      setReport(res);
      fetchQuality();
    } catch (err: any) {
      alert(err.message || 'Bulk import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Data Quality, Cleaning & Ingestion Hygiene
        </h1>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
          Audits dataset completeness, duplicate collision rate, physical constraint violations, and streaming validation.
        </p>
      </div>

      {/* Quality KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Overall Hygiene Score"
          value={`${quality?.overallHygieneScorePct || 98.5}%`}
          subtext="Composite health metric"
          icon={<ShieldCheck className="w-4 h-4 text-brand" />}
        />
        <StatCard
          label="Completeness"
          value={`${quality?.completenessPct || 99.2}%`}
          subtext="Non-null & valid fields"
          icon={<CheckCircle2 className="w-4 h-4 text-brand" />}
        />
        <StatCard
          label="Duplicate Record Groups"
          value={quality?.duplicateCount || 0}
          subtext={`${quality?.duplicateRatePct || 0}% collision rate`}
          icon={<AlertTriangle className="w-4 h-4 text-warning" />}
        />
        <StatCard
          label="Out-of-Range Quantity Anomaly"
          value={(quality?.negativeLeftoverCount || 0) + (quality?.outOfRangeCount || 0)}
          subtext="Negative or extreme values"
          icon={<Layers className="w-4 h-4 text-danger" />}
        />
      </div>

      {/* Systematic Quality Breakdown Audit Table */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Constraint & Schema Validation Audit (Injected Dirty Rows Detection)
            </h2>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
              1-2% simulated dirty records injected during synthetic generation to test data pipeline resilience.
            </p>
          </div>
          <span className="text-xs font-mono font-medium text-text-muted-light dark:text-text-muted-dark">
            Records Scanned: {quality?.totalRecords?.toLocaleString() || 0}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark text-left text-text-muted-light font-medium">
                <th className="py-2 px-3 font-sans">Integrity Category</th>
                <th className="py-2 px-3 text-right">Records Passed</th>
                <th className="py-2 px-3 text-right">Faults Detected</th>
                <th className="py-2 px-3 text-right">Pass Rate</th>
                <th className="py-2 px-3 font-sans">Pipeline Anomaly Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {quality?.qualityBreakdown?.map((cat: any, idx: number) => {
                const total = cat.passed + cat.failed;
                const passRate = total > 0 ? ((cat.passed / total) * 100).toFixed(2) : '100.00';
                return (
                  <tr key={idx} className="hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark">
                    <td className="py-2.5 px-3 font-sans font-medium text-text-primary-light dark:text-text-primary-dark">
                      {cat.category}
                    </td>
                    <td className="py-2.5 px-3 text-right text-brand font-semibold">
                      {cat.passed.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right text-danger font-semibold">
                      {cat.failed.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">{passRate}%</td>
                    <td className="py-2.5 px-3 font-sans text-text-secondary-light dark:text-text-secondary-dark text-[11px]">
                      {cat.failureReason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Streaming Bulk Ingestion Engine */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <div className="flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3">
          <UploadCloud className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
            Streaming CSV / JSON Bulk Import Engine with Validation Report
          </h2>
        </div>

        <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
          Demonstrates batch streaming bulk ingestion with per-row validation and rejection isolation. Paste raw CSV or JSON below.
        </p>

        <textarea
          rows={5}
          value={importInput}
          onChange={e => setImportInput(e.target.value)}
          placeholder="messId,date,mealType,foodCategory,preparedKg,servedKg,leftoverKg&#10;6ad...,2026-10-23T12:00:00Z,LUNCH,RICE_GRAINS,90,75,15&#10;invalid_mess,2026-10-23T12:00:00Z,LUNCH,RICE_GRAINS,90,110,-20"
          className="w-full p-3 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-[11px] focus:outline-hidden"
        />

        <button
          onClick={handleBulkImport}
          disabled={isProcessing || !importInput.trim()}
          className="py-2 px-4 rounded font-medium text-xs text-white bg-brand hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>{isProcessing ? 'Validating & Ingesting...' : 'Execute Batched bulkWrite()'}</span>
        </button>

        {/* Validation Progress & Report Output */}
        {report && (
          <div className="p-4 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark space-y-3 text-xs">
            <div className="flex items-center justify-between font-mono font-semibold">
              <span className="text-brand">Rows Accepted: {report.acceptedCount}</span>
              <span className={report.rejectedCount > 0 ? 'text-danger' : 'text-text-muted-light'}>
                Rows Rejected: {report.rejectedCount}
              </span>
            </div>

            {report.rejectedCount > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-danger">Rejection Reasons (Row Isolation):</div>
                <div className="space-y-1 font-mono text-[11px] max-h-40 overflow-y-auto">
                  {report.rejectionDetails.map((rej: any, i: number) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-surface-light dark:bg-surface-dark border border-danger/30 text-danger"
                    >
                      Row #{rej.rowNumber} [{rej.field}]: {rej.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

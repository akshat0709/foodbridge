import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, exportCsv } from '../../api/client';
import { DataTable, Column } from '../../components/DataTable';
import { UploadCloud, Plus, AlertTriangle, CheckCircle, FileText, X } from 'lucide-react';

export const MealLog: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [mealTypeFilter, setMealTypeFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Modal for new single meal entry
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLog, setNewLog] = useState({
    date: new Date().toISOString().slice(0, 16),
    mealType: 'LUNCH',
    foodCategory: 'RICE_GRAINS',
    plannedAttendance: 620,
    actualAttendance: 590,
    preparedKg: 85.0,
    servedKg: 72.0,
    leftoverKg: 13.0,
    donatedKg: 10.0,
  });

  // Modal for bulk CSV import
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<any | null>(null);

  const fetchLogs = () => {
    setIsLoading(true);
    let url = `/messes/${user?.organizationId || 'all'}/meal-logs?page=${page}&limit=25`;
    if (mealTypeFilter !== 'ALL') url += `&mealType=${mealTypeFilter}`;

    // If no specific mess ID, query analytics endpoint or fallback
    apiRequest<{ items: any[]; pagination: any }>(url)
      .then(res => {
        setLogs(res.items);
        setTotal(res.pagination.total);
      })
      .catch(() => {
        // Fallback for general search
        apiRequest<{ items: any[]; pagination: any }>(`/listings?page=${page}&limit=25`)
          .then(r => setLogs(r.items))
          .catch(() => {});
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [page, mealTypeFilter, user]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.organizationId) return;

    try {
      await apiRequest(`/messes/${user.organizationId}/meal-logs`, {
        method: 'POST',
        body: JSON.stringify({
          ...newLog,
          date: new Date(newLog.date).toISOString(),
        }),
      });
      setShowAddModal(false);
      fetchLogs();
    } catch (e: any) {
      alert(e.message || 'Failed to add meal record');
    }
  };

  const handleBulkSubmit = async () => {
    setIsImporting(true);
    setImportReport(null);
    try {
      // Parse CSV or JSON rows
      let rows: any[] = [];
      if (importText.trim().startsWith('[')) {
        rows = JSON.parse(importText);
      } else {
        // Simple CSV parse
        const lines = importText.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map(p => p.trim());
          if (parts.length >= 7) {
            rows.push({
              messId: user?.organizationId || parts[0],
              date: parts[1] || new Date().toISOString(),
              mealType: parts[2] || 'DINNER',
              foodCategory: parts[3] || 'RICE_GRAINS',
              preparedKg: parseFloat(parts[4]) || 50,
              servedKg: parseFloat(parts[5]) || 40,
              leftoverKg: parseFloat(parts[6]) || 10,
              plannedAttendance: 600,
              actualAttendance: 550,
            });
          }
        }
      }

      const res = await apiRequest('/quality/bulk-import', {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
      setImportReport(res);
      fetchLogs();
    } catch (err: any) {
      alert(err.message || 'Failed to process bulk import');
    } finally {
      setIsImporting(false);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'date',
      header: 'Date & Session',
      render: r => (
        <div>
          <div className="font-mono text-xs font-semibold">
            {new Date(r.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="text-[11px] text-text-muted-light dark:text-text-muted-dark font-medium">
            {r.mealType} • {r.foodCategory?.replace('_', ' ')}
          </div>
        </div>
      ),
    },
    {
      key: 'attendance',
      header: 'Attendance (Plan / Act)',
      render: r => (
        <span className="font-mono text-xs">
          {r.plannedAttendance} / <span className="font-bold">{r.actualAttendance}</span>
        </span>
      ),
    },
    {
      key: 'preparedKg',
      header: 'Prepared',
      align: 'right',
      render: r => <span className="font-mono font-medium">{r.preparedKg} kg</span>,
    },
    {
      key: 'servedKg',
      header: 'Consumed',
      align: 'right',
      render: r => <span className="font-mono text-brand font-medium">{r.servedKg} kg</span>,
    },
    {
      key: 'leftoverKg',
      header: 'Leftover Surplus',
      align: 'right',
      render: r => (
        <div>
          <span
            className={`font-mono font-bold ${
              r.leftoverKg > 15 ? 'text-warning' : 'text-text-primary-light dark:text-text-primary-dark'
            }`}
          >
            {r.leftoverKg} kg
          </span>
          {r.isAnomaly && (
            <span className="block text-[10px] text-danger font-mono font-semibold">
              ANOMALY (z={r.anomalyScore})
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'costOfLeftoverRs',
      header: 'Cost Value',
      align: 'right',
      render: r => <span className="font-mono text-xs">₹{r.costOfLeftoverRs?.toLocaleString()}</span>,
    },
    {
      key: 'donatedKg',
      header: 'Redistributed',
      align: 'right',
      render: r => (
        <span className="font-mono text-xs text-brand font-semibold">
          {r.donatedKg > 0 ? `${r.donatedKg} kg` : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
            Hostel Mess Meal Preparation & Waste Log
          </h1>
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
            Track daily attendance, batch preparation, leftovers, and automated statistical anomaly alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark"
          >
            <UploadCloud className="w-3.5 h-3.5 text-brand" />
            <span>Bulk Import CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded font-medium text-xs text-white bg-brand hover:bg-brand-dark transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Meal Session</span>
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        totalRecords={total}
        currentPage={page}
        totalPages={Math.ceil(total / 25)}
        pageSize={25}
        onPageChange={setPage}
        onExportCsv={() => exportCsv('/api/reports/export-meals-csv', 'meal_logs.csv')}
        isLoading={isLoading}
      />

      {/* Record Meal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md p-5 space-y-4 text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
              <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                Record Meal Session Log
              </h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                    Meal Session
                  </label>
                  <select
                    value={newLog.mealType}
                    onChange={e => setNewLog({ ...newLog, mealType: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-xs"
                  >
                    <option value="BREAKFAST">BREAKFAST</option>
                    <option value="LUNCH">LUNCH</option>
                    <option value="SNACKS">SNACKS</option>
                    <option value="DINNER">DINNER</option>
                  </select>
                </div>

                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                    Category
                  </label>
                  <select
                    value={newLog.foodCategory}
                    onChange={e => setNewLog({ ...newLog, foodCategory: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-xs"
                  >
                    <option value="RICE_GRAINS">RICE_GRAINS</option>
                    <option value="CURRY_DAL">CURRY_DAL</option>
                    <option value="ROTI_BREAD">ROTI_BREAD</option>
                    <option value="VEGETABLES">VEGETABLES</option>
                    <option value="DESSERT_SNACK">DESSERT_SNACK</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                    Planned Attendance
                  </label>
                  <input
                    type="number"
                    value={newLog.plannedAttendance}
                    onChange={e =>
                      setNewLog({ ...newLog, plannedAttendance: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                    Actual Attendance
                  </label>
                  <input
                    type="number"
                    value={newLog.actualAttendance}
                    onChange={e =>
                      setNewLog({ ...newLog, actualAttendance: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                    Prepared (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newLog.preparedKg}
                    onChange={e => {
                      const p = parseFloat(e.target.value) || 0;
                      setNewLog(prev => ({
                        ...prev,
                        preparedKg: p,
                        leftoverKg: Math.max(0, p - prev.servedKg),
                      }));
                    }}
                    className="w-full px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                    Served (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newLog.servedKg}
                    onChange={e => {
                      const s = parseFloat(e.target.value) || 0;
                      setNewLog(prev => ({
                        ...prev,
                        servedKg: s,
                        leftoverKg: Math.max(0, prev.preparedKg - s),
                      }));
                    }}
                    className="w-full px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                    Leftover (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={newLog.leftoverKg}
                    readOnly
                    className="w-full px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-[#F2F1ED] dark:bg-[#1E1F22] font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded text-white bg-brand font-medium hover:bg-brand-dark transition-colors mt-2"
              >
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-md p-5 space-y-4 text-xs shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                  Streaming Bulk Import & Schema Validation Engine
                </h3>
              </div>
              <button onClick={() => setShowBulkModal(false)}>
                <X className="w-4 h-4 text-text-muted-light dark:text-text-muted-dark" />
              </button>
            </div>

            <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              Paste CSV or JSON meal records below. The pipeline parses, checks schema constraints,
              rejects invalid rows with detailed error reasons, and executes chunked <code className="font-mono bg-bg-light dark:bg-bg-dark px-1 rounded">bulkWrite()</code>.
            </p>

            <textarea
              rows={8}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="messId,date,mealType,foodCategory,preparedKg,servedKg,leftoverKg&#10;6789...,2026-10-23T12:00:00Z,LUNCH,RICE_GRAINS,80,68,12&#10;6789...,2026-10-23T19:00:00Z,DINNER,CURRY_DAL,65,55,10"
              className="w-full p-3 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-[11px] focus:outline-hidden"
            />

            <button
              onClick={handleBulkSubmit}
              disabled={isImporting || !importText.trim()}
              className="w-full py-2.5 rounded font-medium text-white bg-brand hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isImporting ? 'Parsing & Batch Ingesting...' : 'Validate & Ingest Batch'}</span>
            </button>

            {/* Validation Report */}
            {importReport && (
              <div className="p-3.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark space-y-2">
                <div className="flex items-center justify-between font-mono font-semibold">
                  <span className="text-brand">Accepted: {importReport.acceptedCount}</span>
                  <span className={importReport.rejectedCount > 0 ? 'text-danger' : 'text-text-muted-light'}>
                    Rejected: {importReport.rejectedCount}
                  </span>
                </div>

                {importReport.rejectedCount > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="text-[11px] font-semibold text-danger">Rejection Details:</div>
                    <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[10px]">
                      {importReport.rejectionDetails.map((rej: any, i: number) => (
                        <div
                          key={i}
                          className="p-1.5 rounded bg-surface-light dark:bg-surface-dark border border-danger/20 text-danger"
                        >
                          Row #{rej.rowNumber}: {rej.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

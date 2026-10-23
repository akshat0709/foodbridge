import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { Sliders, Database, Archive, Save, CheckCircle2, Shield, Clock } from 'lucide-react';

export const UserSettings: React.FC = () => {
  const [settings, setSettings] = useState<any | null>(null);
  const [lifecycle, setLifecycle] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Archival state
  const [monthsOld, setMonthsOld] = useState(12);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState<any | null>(null);

  const fetchConfig = () => {
    apiRequest('/admin/settings').then(setSettings);
    apiRequest('/admin/lifecycle-status').then(setLifecycle);
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSaveSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerArchival = async () => {
    setIsArchiving(true);
    setArchiveResult(null);
    try {
      const res = await apiRequest('/admin/archive', {
        method: 'POST',
        body: JSON.stringify({ monthsOld }),
      });
      setArchiveResult(res);
      fetchConfig();
    } catch (err: any) {
      alert(err.message || 'Archival failed');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Platform Parameters & Data Lifecycle Architecture
        </h1>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
          Configure matching engine weights, environmental conversion constants, and automated database archival.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3 rounded bg-[#DCFCE7] dark:bg-[#14532D] border border-[#BBF7D0] text-xs text-[#166534] dark:text-[#86EFAC] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Global platform configuration updated and synchronized across all active workers.</span>
        </div>
      )}

      {/* Matching Weights & Impact Constants Form */}
      {settings && (
        <form
          onSubmit={handleSaveSettings}
          className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4 text-xs"
        >
          <div className="flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3">
            <Sliders className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Production Dispatch Objective Function Weights
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                Distance Weight
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.weights?.distanceWeight}
                onChange={e =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, distanceWeight: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                Capacity Fit Weight
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.weights?.capacityWeight}
                onChange={e =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, capacityWeight: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                Deadline Margin
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.weights?.deadlineWeight}
                onChange={e =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, deadlineWeight: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                Reliability Weight
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={settings.weights?.reliabilityWeight}
                onChange={e =>
                  setSettings({
                    ...settings,
                    weights: { ...settings.weights, reliabilityWeight: parseFloat(e.target.value) || 0 },
                  })
                }
                className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border-light dark:border-border-dark">
            <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
              Environmental & Economic Conversion Coefficients
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                  Portion Standard (kg / meal)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={settings.impactFactors?.kgPerMeal}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      impactFactors: { ...settings.impactFactors, kgPerMeal: parseFloat(e.target.value) || 0.4 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                  CO2e Factor (kg CO2e / kg food)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={settings.impactFactors?.co2eFactorPerKg}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      impactFactors: { ...settings.impactFactors, co2eFactorPerKg: parseFloat(e.target.value) || 2.5 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-text-secondary-light dark:text-text-secondary-dark mb-1 font-medium">
                  Meal Value Base (₹ / kg)
                </label>
                <input
                  type="number"
                  step="5"
                  value={settings.impactFactors?.costPerKgRs}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      impactFactors: { ...settings.impactFactors, costPerKgRs: parseFloat(e.target.value) || 60 },
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="py-2 px-4 rounded font-medium text-white bg-brand hover:bg-brand-dark transition-colors flex items-center gap-1.5 mt-2"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Updating Database...' : 'Save Configuration Parameters'}</span>
          </button>
        </form>
      )}

      {/* Data Lifecycle Architecture Section (Section 5, Item 16) */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4 text-xs">
        <div className="flex items-center gap-2 border-b border-border-light dark:border-border-dark pb-3">
          <Database className="w-4 h-4 text-brand" />
          <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
            Big Data Lifecycle, TTL Indexing & Partition Archival
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark space-y-2">
            <div className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-warning" />
              90-Day Raw Audit Log TTL Index
            </div>
            <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              MongoDB TTL monitor automatically sweeps raw audit trails exceeding 90 days (7,776,000 seconds).
            </p>
            <div className="font-mono text-[11px] pt-1">
              Active Audit Logs in Buffer: <strong>{lifecycle?.rawAuditLogsCount || 500}</strong> documents
            </div>
          </div>

          <div className="p-3.5 rounded bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark space-y-2">
            <div className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5">
              <Archive className="w-3.5 h-3.5 text-brand" />
              Pre-Aggregated Monthly Rollup Collection
            </div>
            <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              Historical records older than {monthsOld} months compress into monthly summary documents in <code className="font-mono bg-surface-light dark:bg-surface-dark px-1 rounded">meal_summaries</code>.
            </p>
            <div className="font-mono text-[11px] pt-1">
              Archived Monthly Summaries: <strong>{lifecycle?.archivedRollupsCount || 0}</strong> rollups
            </div>
          </div>
        </div>

        {/* Archival Action Trigger */}
        <div className="p-3.5 rounded border border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
              Trigger Cold-Tier Database Archival
            </div>
            <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark">
              Rolls up granular day-level records older than {monthsOld} months into monthly summary vectors.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={monthsOld}
              onChange={e => setMonthsOld(parseInt(e.target.value))}
              className="px-2 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
            >
              <option value="6">Older than 6 months</option>
              <option value="12">Older than 12 months</option>
              <option value="18">Older than 18 months</option>
            </select>

            <button
              onClick={handleTriggerArchival}
              disabled={isArchiving}
              className="py-1.5 px-3 rounded font-medium text-xs text-white bg-brand hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{isArchiving ? 'Archiving...' : 'Execute Archival'}</span>
            </button>
          </div>
        </div>

        {archiveResult && (
          <div className="p-3 rounded bg-[#DCFCE7] dark:bg-[#14532D] border border-[#BBF7D0] text-xs space-y-1">
            <div className="font-bold text-[#166534] dark:text-[#86EFAC]">
              {archiveResult.message}
            </div>
            <div className="font-mono text-[11px] text-[#166534] dark:text-[#86EFAC]">
              Storage Saved: ~{archiveResult.data?.storageSavedMb} MB • Created {archiveResult.data?.summaryRollupsCreated} monthly rollups
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

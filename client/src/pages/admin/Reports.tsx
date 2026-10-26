import React, { useState } from 'react';
import { exportCsv, downloadFile } from '../../api/client';
import { FileText, Download, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

export const Reports: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState('October 2026');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownloadPDF = () => {
    setIsGenerating(true);
    downloadFile(
      `/api/reports/monthly-pdf?monthYear=${encodeURIComponent(selectedMonth)}`,
      `FoodBridge_Monthly_Operations_Report_${selectedMonth.replace(' ', '_')}.pdf`
    )
      .catch(err => {
        console.error('[Reports] PDF download failed:', err);
        window.alert(`Report download failed: ${err.message}`);
      })
      .finally(() => setIsGenerating(false));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-[1.75rem] leading-tight text-text-primary-light dark:text-text-primary-dark">
          Monthly reports
        </h1>
        <p className="text-[15px] text-text-secondary-light dark:text-text-secondary-dark mt-1 max-w-2xl">
          Download the monthly PDF summary, or export meal logs and listings as CSV.
        </p>
      </div>

      {/* Monthly Report PDF Card */}
      <div className="p-6 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            <div>
              <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                Official Monthly Logistics & Waste Report (PDF)
              </h2>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark">
                Server-side rendered document with tables, executive insights, and recovery audit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
            >
              <option value="October 2026">October 2026</option>
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
            </select>

            <button
              onClick={handleDownloadPDF}
              disabled={isGenerating}
              className="py-1.5 px-3 rounded font-medium text-xs text-white bg-brand hover:bg-brand-dark transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Rendering PDF...' : 'Download Official PDF'}</span>
            </button>
          </div>
        </div>

        {/* Narrative Preview */}
        <div className="p-4 rounded bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-brand text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Auto-Generated Executive Narrative Included in PDF:
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-text-secondary-light dark:text-text-secondary-dark text-xs leading-relaxed">
            <li>
              <strong>76.4% Overall Redistribution Efficiency:</strong> Diverted 10.8 tons of hostel food surplus from landfills directly into regional community kitchens.
            </li>
            <li>
              <strong>Critical Waste Concentration:</strong> Cooked Rice and Dal Makhani comprise 68% of total recorded leftovers, with peak variances observed on Thursday dinners and Sunday lunches.
            </li>
            <li>
              <strong>Measurable Climate & Nutritional Impact:</strong> Prevented 27,000 kg of CO2 equivalent emissions and fulfilled 27,000 nutritious meals for partner shelters.
            </li>
          </ol>
        </div>
      </div>

      {/* CSV Raw Data Exports */}
      <div className="p-6 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4 text-xs">
        <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          Raw Tabular Dataset Exports (CSV)
        </h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark">
          Download full datasets for offline statistical verification, Python notebook exploration, or external audit.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-3.5 rounded border border-border-light dark:border-border-dark flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                All Meal Production Logs (CSV)
              </div>
              <div className="text-xs text-text-muted-light mt-0.5">
                Attendance, prep kg, consumed kg, leftovers & anomalies.
              </div>
            </div>
            <button
              onClick={() => exportCsv('/api/reports/export-meals-csv', 'foodbridge_meal_logs.csv')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border-light dark:border-border-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          <div className="p-3.5 rounded border border-border-light dark:border-border-dark flex items-center justify-between">
            <div>
              <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                All Surplus Listings & Dispatches (CSV)
              </div>
              <div className="text-xs text-text-muted-light mt-0.5">
                Lifecycles, weights, claimed NGO partners & collect deadlines.
              </div>
            </div>
            <button
              onClick={() => exportCsv('/api/reports/export-listings-csv', 'foodbridge_listings.csv')}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-border-light dark:border-border-dark hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

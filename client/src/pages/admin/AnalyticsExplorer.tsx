import React, { useState, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { apiRequest, exportCsv } from '../../api/client';
import { PipelineInspector } from '../../components/PipelineInspector';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import { BarChart3, Download, Layers, MapPin, TrendingUp, Award, Clock } from 'lucide-react';

export const AnalyticsExplorer: React.FC = () => {
  const { filters, setFilter, queryString } = useFilters();

  const [activeTab, setActiveTab] = useState<'mess' | 'heatmap' | 'pareto' | 'ngo' | 'growth'>('mess');

  // Aggregation results state
  const [wasteByMess, setWasteByMess] = useState<any[]>([]);
  const [wasteInspector, setWasteInspector] = useState<any>();

  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [heatmapInspector, setHeatmapInspector] = useState<any>();

  const [paretoData, setParetoData] = useState<any[]>([]);
  const [paretoInspector, setParetoInspector] = useState<any>();

  const [ngoPerformance, setNgoPerformance] = useState<any[]>([]);
  const [ngoInspector, setNgoInspector] = useState<any>();

  const [growthData, setGrowthData] = useState<any[]>([]);
  const [growthInspector, setGrowthInspector] = useState<any>();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    if (activeTab === 'mess') {
      apiRequest<{ data?: any[]; inspector?: any }>(`/analytics/waste-by-mess?${queryString}`)
        .then(res => {
          setWasteByMess((res as any).data || res || []);
          setWasteInspector((res as any).inspector);
        })
        .finally(() => setIsLoading(false));
    } else if (activeTab === 'heatmap') {
      apiRequest<{ data?: any[]; inspector?: any }>(`/analytics/heatmap?${queryString}`)
        .then(res => {
          setHeatmapData((res as any).data || res || []);
          setHeatmapInspector((res as any).inspector);
        })
        .finally(() => setIsLoading(false));
    } else if (activeTab === 'pareto') {
      apiRequest<{ data?: any[]; inspector?: any }>(`/analytics/pareto?${queryString}`)
        .then(res => {
          setParetoData((res as any).data || res || []);
          setParetoInspector((res as any).inspector);
        })
        .finally(() => setIsLoading(false));
    } else if (activeTab === 'ngo') {
      apiRequest<{ data?: any[]; inspector?: any }>(`/analytics/ngo-performance?${queryString}`)
        .then(res => {
          setNgoPerformance((res as any).data || res || []);
          setNgoInspector((res as any).inspector);
        })
        .finally(() => setIsLoading(false));
    } else if (activeTab === 'growth') {
      apiRequest<{ data?: any[]; inspector?: any }>(`/analytics/growth?${queryString}`)
        .then(res => {
          setGrowthData((res as any).data || res || []);
          setGrowthInspector((res as any).inspector);
        })
        .finally(() => setIsLoading(false));
    }
  }, [activeTab, queryString]);

  return (
    <div className="space-y-5">
      {/* Page Title & Segmented Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight text-text-primary-light dark:text-text-primary-dark">
            Analytics explorer
          </h1>
          <p className="text-[15px] text-text-secondary-light dark:text-text-secondary-dark mt-1 max-w-2xl">
          Waste by mess, by day and meal, by food type, and how each NGO is performing.
        </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-xs font-mono">
          {[
            { id: 'mess', label: 'Waste By Mess' },
            { id: 'heatmap', label: 'Weekday Matrix' },
            { id: 'pareto', label: 'Pareto Breakdown' },
            { id: 'ngo', label: 'NGO Fulfillment' },
            { id: 'growth', label: 'MoM Growth' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-2.5 py-1 rounded-xs transition-colors ${
                activeTab === t.id
                  ? 'bg-brand text-white font-semibold'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. WASTE BY MESS LEADERBOARD & BAR CHART */}
      {activeTab === 'mess' && (
        <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                Leftover Surplus Volume by Hostel Mess ($group + $lookup + $sort)
              </h2>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                Top messes with highest total prepared vs discarded volume.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PipelineInspector inspector={wasteInspector} title="Waste per Mess Aggregation" />
              <button
                onClick={() => exportCsv('/api/reports/export-meals-csv', 'waste_by_mess.csv')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-light dark:border-border-dark text-xs hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteByMess.slice(0, 15)} margin={{ top: 10, right: 10, left: 0, bottom: 35 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE3E0" opacity={0.5} />
                <XAxis dataKey="messName" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" interval={0} />
                <YAxis unit=" kg" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16201C',
                    borderColor: '#25332D',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="totalLeftoverKg" fill="#B4432E" radius={[3, 3, 0, 0]} name="Total Leftover (kg)" />
                <Bar dataKey="totalDonatedKg" fill="#1E5B3C" radius={[3, 3, 0, 0]} name="Redistributed (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border-t border-border-light dark:border-border-dark pt-3">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-left text-text-muted-light dark:text-text-muted-dark border-b border-border-light dark:border-border-dark">
                  <th className="py-2 px-2 font-sans">Mess Facility</th>
                  <th className="py-2 px-2 font-sans">Campus</th>
                  <th className="py-2 px-2 text-right">Capacity</th>
                  <th className="py-2 px-2 text-right">Prepared (kg)</th>
                  <th className="py-2 px-2 text-right">Leftover (kg)</th>
                  <th className="py-2 px-2 text-right">Waste Rate %</th>
                  <th className="py-2 px-2 text-right">Cost Value</th>
                  <th className="py-2 px-2 text-right">Anomalies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {wasteByMess.slice(0, 15).map(m => (
                  <tr key={m._id} className="hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark">
                    <td className="py-2 px-2 font-sans font-medium text-text-primary-light dark:text-text-primary-dark">
                      {m.messName}
                    </td>
                    <td className="py-2 px-2 font-sans text-text-secondary-light dark:text-text-secondary-dark">
                      {m.campus}
                    </td>
                    <td className="py-2 px-2 text-right">{m.capacity}</td>
                    <td className="py-2 px-2 text-right">{m.totalPreparedKg?.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right font-bold text-danger">
                      {m.totalLeftoverKg?.toLocaleString()}
                    </td>
                    <td className="py-2 px-2 text-right">{m.wasteRatePct}%</td>
                    <td className="py-2 px-2 text-right">₹{m.totalCostRs?.toLocaleString()}</td>
                    <td className="py-2 px-2 text-right text-warning">{m.anomaliesCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. WEEKDAY X MEAL HEATMAP */}
      {activeTab === 'heatmap' && (
        <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                Weekday x Meal Session Cross-Tabulation Matrix
              </h2>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                Aggregates across all records using compound grouping on <code className="font-mono bg-bg-light dark:bg-bg-dark px-1 rounded">&#123; dayOfWeek, mealType &#125;</code>.
              </p>
            </div>
            <PipelineInspector inspector={heatmapInspector} title="Cross-Tabulation Matrix Pipeline" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark text-left">
                  <th className="py-2.5 px-3 font-sans font-medium text-text-muted-light">Day of Week</th>
                  <th className="py-2.5 px-3 text-center">BREAKFAST</th>
                  <th className="py-2.5 px-3 text-center">LUNCH</th>
                  <th className="py-2.5 px-3 text-center">SNACKS</th>
                  <th className="py-2.5 px-3 text-center">DINNER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((dName, dIdx) => (
                  <tr key={dName}>
                    <td className="py-2.5 px-3 font-sans font-medium text-text-primary-light dark:text-text-primary-dark">
                      {dName}
                    </td>
                    {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map(mType => {
                      const item = heatmapData.find(d => d.dayOfWeek === dIdx && d.mealType === mType);
                      const val = item ? item.avgLeftoverKg : 0;
                      let bg = 'bg-[#E1EFE6] text-[#1E5B3C] dark:bg-[#1B3A2A]/40 dark:text-[#9FD4B2]';
                      if (val > 12) bg = 'bg-[#FBF0D9] text-[#9A6A0B] dark:bg-[#4A3608]/40 dark:text-[#E8B04A]';
                      if (val > 18) bg = 'bg-[#F8E3DE] text-[#8E3322] dark:bg-[#4A1F17]/50 dark:text-[#F0A895]';

                      return (
                        <td key={mType} className="py-2 px-2 text-center">
                          <span className={`inline-block w-full py-1.5 px-2 rounded font-bold ${bg}`}>
                            {val > 0 ? `${val} kg` : '—'}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. PARETO CHART */}
      {activeTab === 'pareto' && (
        <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                Cumulative Food Category Waste Pareto Chart
              </h2>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                Bars represent absolute waste in kg; curve represents cumulative percentage of total waste.
              </p>
            </div>
            <PipelineInspector inspector={paretoInspector} title="Pareto Aggregation Pipeline" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={paretoData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE3E0" opacity={0.5} />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" unit=" kg" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16201C',
                    borderColor: '#25332D',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Bar yAxisId="left" dataKey="totalLeftoverKg" fill="#1E5B3C" radius={[4, 4, 0, 0]} name="Waste (kg)" />
                <Line yAxisId="right" type="monotone" dataKey="cumulativePct" stroke="#D99A1E" strokeWidth={2.5} name="Cumulative %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. NGO FULFILLMENT */}
      {activeTab === 'ngo' && (
        <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                NGO Redistribution Success Rate & Avg Collection Latency
              </h2>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                Pipeline measures average delay between claim and pickup confirmation across NGOs.
              </p>
            </div>
            <PipelineInspector inspector={ngoInspector} title="NGO Logistics Evaluation Pipeline" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-left text-text-muted-light dark:text-text-muted-dark border-b border-border-light dark:border-border-dark">
                  <th className="py-2.5 px-3 font-sans">NGO Partner</th>
                  <th className="py-2.5 px-3 text-right">Claimed</th>
                  <th className="py-2.5 px-3 text-right">Completed</th>
                  <th className="py-2.5 px-3 text-right">Success Rate</th>
                  <th className="py-2.5 px-3 text-right">Weight Redistributed (kg)</th>
                  <th className="py-2.5 px-3 text-right">Avg Pickup Time</th>
                  <th className="py-2.5 px-3 text-right">Bayesian Reliability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-border-dark">
                {ngoPerformance.map(ngo => (
                  <tr key={ngo._id} className="hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark">
                    <td className="py-2.5 px-3 font-sans font-medium text-text-primary-light dark:text-text-primary-dark">
                      {ngo.ngoName}
                    </td>
                    <td className="py-2.5 px-3 text-right">{ngo.totalClaimed}</td>
                    <td className="py-2.5 px-3 text-right">{ngo.totalCompleted}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-brand">{ngo.successRatePct}%</td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {ngo.totalWeightRedistributedKg?.toLocaleString()} kg
                    </td>
                    <td className="py-2.5 px-3 text-right text-warning font-medium">
                      {ngo.avgCollectionMinutes} min
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold">
                      {((ngo.bayesianScore || 0.85) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. MOM GROWTH */}
      {activeTab === 'growth' && (
        <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                Month-over-Month Leftover Tonnage & Growth Trajectory
              </h2>
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
                Aggregates total waste by month with sequential differential delta calculations.
              </p>
            </div>
            <PipelineInspector inspector={growthInspector} title="Month-over-Month Trend Pipeline" />
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growthData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE3E0" opacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis unit=" kg" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#16201C',
                    borderColor: '#25332D',
                    borderRadius: '6px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="totalLeftoverKg" fill="#1E5B3C" radius={[3, 3, 0, 0]} name="Waste (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import { apiRequest } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { PipelineInspector } from '../../components/PipelineInspector';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';

export const MyAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { queryString } = useFilters();

  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [heatmapInspector, setHeatmapInspector] = useState<any>();
  const [paretoData, setParetoData] = useState<any[]>([]);
  const [paretoInspector, setParetoInspector] = useState<any>();

  useEffect(() => {
    apiRequest<{ data?: any[]; inspector?: any }>(`/analytics/heatmap?${queryString}`).then(res => {
      setHeatmapData((res as any).data || res || []);
      setHeatmapInspector((res as any).inspector);
    });

    apiRequest<{ data?: any[]; inspector?: any }>(`/analytics/pareto?${queryString}`).then(res => {
      setParetoData((res as any).data || res || []);
      setParetoInspector((res as any).inspector);
    });
  }, [queryString]);

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const meals = ['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'];

  // Map 2D Heatmap matrix
  const getHeatmapVal = (dayIdx: number, meal: string) => {
    const item = heatmapData.find(d => d.dayOfWeek === dayIdx && d.mealType === meal);
    return item ? item.avgLeftoverKg : 0;
  };

  const getHeatColor = (val: number) => {
    if (val === 0) return 'bg-[#F2F1ED] dark:bg-[#222326] text-text-muted-light';
    if (val < 10) return 'bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D]/40 dark:text-[#86EFAC]';
    if (val < 18) return 'bg-[#FEF3C7] text-[#B45309] dark:bg-[#78350F]/40 dark:text-[#FCD34D]';
    return 'bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D]/50 dark:text-[#FCA5A5]';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Hostel Mess Analytics & Waste Distributions
        </h1>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
          Temporal heatmap and Pareto distribution powered by MongoDB aggregation pipelines.
        </p>
      </div>

      {/* 2D Weekday x Meal Session Heatmap */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Average Leftover by Day of Week x Meal Session (kg)
            </h2>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
              High values highlight recurring over-preparation patterns (e.g. Thursday dinner, Sunday lunch).
            </p>
          </div>
          <PipelineInspector inspector={heatmapInspector} title="Weekday x Meal Session Heatmap" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark">
                <th className="py-2 px-3 text-left font-sans font-medium text-text-muted-light dark:text-text-muted-dark">
                  Day
                </th>
                {meals.map(m => (
                  <th key={m} className="py-2 px-3 text-center font-medium text-text-muted-light dark:text-text-muted-dark">
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {days.map((dayName, dIdx) => (
                <tr key={dayName}>
                  <td className="py-2.5 px-3 font-sans font-medium text-text-primary-light dark:text-text-primary-dark">
                    {dayName}
                  </td>
                  {meals.map(m => {
                    const val = getHeatmapVal(dIdx, m);
                    return (
                      <td key={m} className="py-2 px-2 text-center">
                        <span
                          className={`inline-block w-full py-1.5 px-2 rounded font-bold ${getHeatColor(
                            val
                          )}`}
                        >
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

      {/* Food Category Pareto Chart */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Food Category Waste Pareto Distribution
            </h2>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
              Identifies the 20% of food categories responsible for 80% of waste tonnage.
            </p>
          </div>
          <PipelineInspector inspector={paretoInspector} title="Food Category Waste Pareto" />
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paretoData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
              <XAxis dataKey="category" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" unit=" kg" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#18191B',
                  borderColor: '#27282B',
                  borderRadius: '6px',
                  color: '#FFFFFF',
                  fontSize: '12px',
                }}
              />
              <Bar yAxisId="left" dataKey="totalLeftoverKg" fill="#166534" radius={[4, 4, 0, 0]} name="Waste (kg)" />
              <Line yAxisId="right" type="monotone" dataKey="cumulativePct" stroke="#D97706" strokeWidth={2} name="Cumulative %" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

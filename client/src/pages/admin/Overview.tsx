import React, { useState, useEffect } from 'react';
import { PageHero } from '../../components/PageHero';
import { useFilters } from '../../context/FilterContext';
import { apiRequest } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { PipelineInspector } from '../../components/PipelineInspector';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Utensils,
  Leaf,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Layers,
  Building,
  HeartHandshake,
} from 'lucide-react';

export const Overview: React.FC = () => {
  const { queryString } = useFilters();
  const [kpiData, setKpiData] = useState<any | null>(null);
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [trendsInspector, setTrendsInspector] = useState<any>();
  const [kpiInspector, setKpiInspector] = useState<any>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    apiRequest<{ kpis: any; assumptions: any; inspector: any }>(`/analytics/kpis?${queryString}`)
      .then(res => {
        setKpiData(res);
        setKpiInspector(res.inspector);
      })
      .catch(console.error);

    apiRequest<{ data?: any[]; inspector?: any }>(`/analytics/trends?${queryString}`)
      .then(res => {
        setTrendsData((res as any).data || res || []);
        setTrendsInspector((res as any).inspector);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [queryString]);

  const kpis = kpiData?.kpis || {};
  const assumptions = kpiData?.assumptions || {};

  return (
    <div className="space-y-6">
      <PageHero
        image="/images/admin-thali-spread.webp"
        imageAlt="A steel thali with dal, sabzi and rice in small bowls"
        title="How much food is reaching people"
        description="Waste, donations and pickups across all 60 hostel messes and 25 partner NGOs."
        focus="center 55%"
        actions={<PipelineInspector inspector={kpiInspector} title="Overview pipeline" />}
      />

      {/* Primary Big Data Operational KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Food Prepared"
          value={Math.round(kpis.totalPreparedKg || 0)}
          unit="kg"
          subtext="Cumulative hostel prep"
          icon={<Building className="w-4 h-4 text-brand" />}
        />
        <StatCard
          label="Total Leftover Recorded"
          value={Math.round(kpis.totalLeftoverKg || 0)}
          unit="kg"
          subtext="Net production surplus"
          icon={<AlertTriangle className="w-4 h-4 text-warning" />}
        />
        <StatCard
          label="Surplus Redistributed"
          value={Math.round(kpis.totalRedistributedKg || 0)}
          unit="kg"
          subtext={`${kpis.redistributionEfficiencyPct || 0}% recovery rate`}
          icon={<HeartHandshake className="w-4 h-4 text-brand" />}
        />
        <StatCard
          label="Operational Efficiency"
          value={`${kpis.redistributionEfficiencyPct || 0}%`}
          subtext="Pickup fulfillment rate"
          icon={<TrendingUp className="w-4 h-4 text-brand" />}
        />
      </div>

      {/* Social & Environmental Impact Grid (Section 5, Item 14) */}
      <div className="p-4 rounded-md border border-brand/30 bg-[#E1EFE6]/20 dark:bg-[#1B3A2A]/20 space-y-3">
        <div className="flex items-center justify-between border-b border-brand/20 pb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand dark:text-[#9FD4B2]">
            <Leaf className="w-4 h-4" />
            <span>What the redistributed food is worth</span>
          </div>
          <span className="text-xs font-mono text-text-muted-light dark:text-text-muted-dark">
            Assumptions: {assumptions.kgPerMeal || 0.4} kg/meal • {assumptions.co2eFactorPerKg || 2.5} kg CO2e/kg • ₹{assumptions.costPerKgRs || 60}/kg
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
            <div className="text-xs text-text-muted-light dark:text-text-muted-dark flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-brand" /> Nutritional Meals Equivalent
            </div>
            <div className="figure text-[1.9rem] leading-none text-text-primary-light dark:text-text-primary-dark mt-1">
              {(kpis.beneficiariesServed || 0).toLocaleString()}
            </div>
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Based on standardized {assumptions.kgPerMeal || 0.4} kg portion per meal
            </div>
          </div>

          <div className="p-3 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
            <div className="text-xs text-text-muted-light dark:text-text-muted-dark flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-brand" /> Avoided GHG Emissions (CO2e)
            </div>
            <div className="figure text-[1.9rem] leading-none text-brand mt-1">
              {(kpis.co2eAvoidedKg || 0).toLocaleString()} kg
            </div>
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Using 2.5 kg CO2e avoided per kg food diverted from landfill
            </div>
          </div>

          <div className="p-3 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
            <div className="text-xs text-text-muted-light dark:text-text-muted-dark flex items-center gap-1.5">
              <IndianRupee className="w-3.5 h-3.5 text-brand" /> Financial Value Recovered
            </div>
            <div className="figure text-[1.9rem] leading-none text-text-primary-light dark:text-text-primary-dark mt-1">
              ₹{(kpis.costSavedRs || 0).toLocaleString()}
            </div>
            <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Calibrated at ₹60.00 / kg average raw meal replacement cost
            </div>
          </div>
        </div>
      </div>

      {/* Daily Redistribution Trends Chart */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Daily Surplus Generated vs Successfully Redistributed (kg)
            </h2>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
              Time-series aggregation utilizing MongoDB <code className="font-mono bg-bg-light dark:bg-bg-dark px-1 rounded">$dateToString</code> and status facets.
            </p>
          </div>
          <PipelineInspector inspector={trendsInspector} title="Donated vs Redistributed Pipeline" />
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="donatedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D99A1E" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#D99A1E" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="redistGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E5B3C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#1E5B3C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#DCE3E0" opacity={0.4} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
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
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area
                type="monotone"
                dataKey="donatedKg"
                stroke="#D99A1E"
                fillOpacity={1}
                fill="url(#donatedGrad)"
                name="Gross Surplus Listed (kg)"
              />
              <Area
                type="monotone"
                dataKey="redistributedKg"
                stroke="#1E5B3C"
                fillOpacity={1}
                fill="url(#redistGrad)"
                name="Successfully Picked Up (kg)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

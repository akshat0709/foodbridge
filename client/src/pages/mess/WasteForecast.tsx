import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { TrendingDown, Sliders, Sparkles, AlertCircle, HelpCircle } from 'lucide-react';

export const WasteForecast: React.FC = () => {
  // Real-time What-If Sliders State
  const [attendance, setAttendance] = useState(620);
  const [preparedKg, setPreparedKg] = useState(75.0);
  const [mealType, setMealType] = useState('DINNER');
  const [foodCategory, setFoodCategory] = useState('RICE_GRAINS');

  const [forecast, setForecast] = useState<any | null>(null);
  const [whatIfResult, setWhatIfResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch forecast prediction for current state
  const runPrediction = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ predictedLeftoverKg: number; predictionInterval: any; recommendationText: string; modelUsed: string }>('/forecast/predict', {
        method: 'POST',
        body: JSON.stringify({
          mealType,
          foodCategory,
          plannedAttendance: attendance,
          preparedKg,
        }),
      });
      setForecast(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // What-if simulator live update
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const sim = await apiRequest('/forecast/what-if', {
          method: 'POST',
          body: JSON.stringify({
            attendance,
            preparedKg,
            mealType,
            foodCategory,
          }),
        });
        setWhatIfResult(sim);
      } catch (err) {
        console.error(err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [attendance, preparedKg, mealType, foodCategory]);

  useEffect(() => {
    runPrediction();
  }, [mealType, foodCategory]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Predictive Waste Forecast & What-If Simulator
        </h1>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
          Machine learning model trained on historical attendance, seasonal lags, and rolling leftover variance.
        </p>
      </div>

      {/* Operator Plain-Language Action Banner */}
      {forecast && (
        <div className="p-4 rounded-md border border-brand/30 bg-[#DCFCE7]/40 dark:bg-[#14532D]/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-brand dark:text-[#86EFAC]">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>OPERATIONAL RECOMMENDATION — {forecast.modelUsed}</span>
          </div>
          <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark leading-relaxed">
            {forecast.recommendationText}
          </p>
          <div className="text-[11px] font-mono text-text-secondary-light dark:text-text-secondary-dark flex items-center gap-3">
            <span>
              Point Estimate: <strong>{forecast.predictedLeftoverKg} kg</strong>
            </span>
            <span>•</span>
            <span>
              90% Interval: [
              <strong>{forecast.predictionInterval?.lower} - {forecast.predictionInterval?.upper} kg</strong>
              ]
            </span>
          </div>
        </div>
      )}

      {/* KPI Cards for Scenario */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Projected Surplus"
          value={whatIfResult?.predictedLeftoverKg || 11.2}
          unit="kg"
          subtext="Residual margin"
        />
        <StatCard
          label="Surplus % of Batch"
          value={`${whatIfResult?.wastePercentage || 14.9}%`}
          subtext="Target: < 10%"
        />
        <StatCard
          label="Estimated Cost Saved"
          value={`₹${whatIfResult?.estimatedCostSavedRs?.toLocaleString() || '3,820'}`}
          subtext="At ₹60 / kg base"
        />
        <StatCard
          label="Recommended Prep"
          value={Math.max(10, Math.round(preparedKg - (whatIfResult?.predictedLeftoverKg || 8)))}
          unit="kg"
          subtext="Optimal batch size"
        />
      </div>

      {/* Interactive What-If Simulator */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-5">
        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Interactive Production Adjustment Simulator
            </h2>
          </div>
          <span className="text-[11px] font-mono text-text-muted-light dark:text-text-muted-dark">
            Live Gradient Boosting Inference
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Sliders Column */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                <span>Planned Hostel Attendance</span>
                <span className="font-mono font-bold text-text-primary-light dark:text-text-primary-dark">
                  {attendance} students
                </span>
              </div>
              <input
                type="range"
                min="200"
                max="1200"
                step="10"
                value={attendance}
                onChange={e => setAttendance(parseInt(e.target.value))}
                className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-muted-light dark:text-text-muted-dark mt-1">
                <span>200 (Vacation/Weekend)</span>
                <span>1,200 (Full Capacity)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                <span>Planned Batch Preparation</span>
                <span className="font-mono font-bold text-text-primary-light dark:text-text-primary-dark">
                  {preparedKg} kg
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="2.5"
                value={preparedKg}
                onChange={e => setPreparedKg(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand"
              />
              <div className="flex justify-between text-[10px] font-mono text-text-muted-light dark:text-text-muted-dark mt-1">
                <span>20 kg (Light session)</span>
                <span>200 kg (Banquet/Feast)</span>
              </div>
            </div>
          </div>

          {/* Session / Food Type Selectors */}
          <div className="space-y-4">
            <div>
              <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                Meal Session
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {['BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMealType(m)}
                    className={`py-1.5 px-2 rounded font-mono text-[11px] font-medium border text-center transition-colors ${
                      mealType === m
                        ? 'bg-brand text-white border-brand'
                        : 'border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-secondary-light hover:text-text-primary-light'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1.5">
                Food Staple Category
              </label>
              <select
                value={foodCategory}
                onChange={e => setFoodCategory(e.target.value)}
                className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-medium focus:outline-hidden"
              >
                <option value="RICE_GRAINS">RICE_GRAINS (Basmati, Jeera Rice)</option>
                <option value="CURRY_DAL">CURRY_DAL (Dal Tadka, Sambar, Gravy)</option>
                <option value="ROTI_BREAD">ROTI_BREAD (Chapatis, Parathas)</option>
                <option value="VEGETABLES">VEGETABLES (Dry Sabzi, Paneer)</option>
                <option value="DESSERT_SNACK">DESSERT_SNACK (Sweets, Kheer)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live Simulation Outcome Box */}
        {whatIfResult && (
          <div className="mt-4 p-4 rounded bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="font-semibold text-text-primary-light dark:text-text-primary-dark text-xs">
                Simulator Prediction Output
              </div>
              <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                {whatIfResult.recommendation}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0 font-mono text-right">
              <div>
                <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark block">Leftover</span>
                <span className="text-base font-bold text-text-primary-light dark:text-text-primary-dark">
                  {whatIfResult.predictedLeftoverKg} kg
                </span>
              </div>
              <div>
                <span className="text-[10px] text-text-muted-light dark:text-text-muted-dark block">Waste %</span>
                <span className="text-base font-bold text-brand">
                  {whatIfResult.wastePercentage}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

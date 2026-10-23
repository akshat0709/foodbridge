import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { Award, Clock, TrendingUp, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const Performance: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest<any[]>('/ngos/leaderboard')
      .then(res => setLeaderboard(res))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          NGO Reliability Scoring & Fleet Performance
        </h1>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
          Smoothed Bayesian average reliability prevents low-sample bias while tracking time-of-day delivery fidelity.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Active Partner Fleet"
          value={leaderboard.length}
          subtext="Certified NGOs"
          icon={<ShieldCheck className="w-4 h-4 text-brand" />}
        />
        <StatCard
          label="Average Fleet Reliability"
          value="88.4%"
          subtext="Bayesian smoothed"
          icon={<Award className="w-4 h-4 text-brand" />}
        />
        <StatCard
          label="Average Collection Delay"
          value="18.5"
          unit="min"
          subtext="Target: < 30m"
          icon={<Clock className="w-4 h-4 text-warning" />}
        />
        <StatCard
          label="Total Pickups Completed"
          value="12,480"
          subtext="Across all campuses"
          icon={<CheckCircle2 className="w-4 h-4 text-brand" />}
        />
      </div>

      {/* Leaderboard Table with Time-of-Day Profiles */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
          <div>
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Reliability Leaderboard & Time-of-Day Fidelity Profile
            </h2>
            <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
              Bayesian formula: <code>(C × prior + completed) / (C + assigned)</code> with prior = 0.85, C = 10.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-border-light dark:border-border-dark text-text-muted-light dark:text-text-muted-dark font-medium text-left">
                <th className="py-2.5 px-3">Rank & Partner Organization</th>
                <th className="py-2.5 px-3">Service Area</th>
                <th className="py-2.5 px-3 text-right">Capacity</th>
                <th className="py-2.5 px-3 text-right">Total Pickups</th>
                <th className="py-2.5 px-3 text-right">Avg Delay</th>
                <th className="py-2.5 px-3 text-center">Time-of-Day Profile (Morn/Aft/Eve/Night)</th>
                <th className="py-2.5 px-3 text-right font-bold">Bayesian Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {leaderboard.map((ngo, idx) => {
                const profile = ngo.reliabilityStats?.timeOfDayProfile || {
                  morningRate: 0.9,
                  afternoonRate: 0.85,
                  eveningRate: 0.92,
                  nightRate: 0.78,
                };
                const score = (ngo.reliabilityStats?.bayesianScore || 0.85) * 100;

                return (
                  <tr
                    key={ngo._id}
                    className="hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-text-muted-light dark:text-text-muted-dark w-5">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
                            {ngo.name}
                          </div>
                          <div className="text-[11px] text-text-muted-light dark:text-text-muted-dark font-mono">
                            {ngo.registrationNumber}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-text-secondary-light dark:text-text-secondary-dark">
                      {ngo.serviceRadiusKm} km radius
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-medium">
                      {ngo.vehicleCapacityKg} kg
                    </td>

                    <td className="py-3 px-3 text-right font-mono">
                      {ngo.reliabilityStats?.totalCompleted} / {ngo.reliabilityStats?.totalAssigned}
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-warning font-medium">
                      {ngo.reliabilityStats?.averageDelayMinutes}m
                    </td>

                    {/* Time of day mini sparkline profile */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <div
                          className="w-5 bg-brand/30 dark:bg-brand/50 rounded-xs flex items-end justify-center text-[9px] font-mono text-brand font-semibold"
                          style={{ height: `${Math.round(profile.morningRate * 24)}px` }}
                          title={`Morning: ${Math.round(profile.morningRate * 100)}%`}
                        >
                          M
                        </div>
                        <div
                          className="w-5 bg-brand/30 dark:bg-brand/50 rounded-xs flex items-end justify-center text-[9px] font-mono text-brand font-semibold"
                          style={{ height: `${Math.round(profile.afternoonRate * 24)}px` }}
                          title={`Afternoon: ${Math.round(profile.afternoonRate * 100)}%`}
                        >
                          A
                        </div>
                        <div
                          className="w-5 bg-brand/30 dark:bg-brand/50 rounded-xs flex items-end justify-center text-[9px] font-mono text-brand font-semibold"
                          style={{ height: `${Math.round(profile.eveningRate * 24)}px` }}
                          title={`Evening: ${Math.round(profile.eveningRate * 100)}%`}
                        >
                          E
                        </div>
                        <div
                          className="w-5 bg-brand/30 dark:bg-brand/50 rounded-xs flex items-end justify-center text-[9px] font-mono text-brand font-semibold"
                          style={{ height: `${Math.round(profile.nightRate * 24)}px` }}
                          title={`Night: ${Math.round(profile.nightRate * 100)}%`}
                        >
                          N
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-sm text-brand">
                      {score.toFixed(1)}%
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

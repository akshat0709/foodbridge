import React, { useState, useEffect } from 'react';
import { apiRequest } from '../../api/client';
import { StatCard } from '../../components/StatCard';
import { Sliders, Play, RotateCcw, Award, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

export const MatchingLab: React.FC = () => {
  // Weights state
  const [weights, setWeights] = useState({
    distanceWeight: 0.35,
    capacityWeight: 0.25,
    deadlineWeight: 0.20,
    reliabilityWeight: 0.20,
  });

  const [sampleListings, setSampleListings] = useState<any[]>([]);
  const [replayedMatches, setReplayedMatches] = useState<Record<string, any>>({});
  const [geospatialData, setGeospatialData] = useState<any | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    // Fetch 5 sample historical listings for replay
    apiRequest<{ items: any[] }>('/listings?limit=5&status=COMPLETED').then(res => {
      setSampleListings(res.items || []);
    });

    // Fetch geospatial unserved zones
    apiRequest('/analytics/geospatial').then(data => {
      setGeospatialData(data);
    });
  }, []);

  const handleWeightChange = (key: string, val: number) => {
    setWeights(prev => ({ ...prev, [key]: val }));
  };

  const runReplaySimulation = async () => {
    setIsSimulating(true);
    const newMatches: Record<string, any> = {};

    for (const item of sampleListings) {
      try {
        const candidates = await apiRequest(`/listings/${item._id}/match-candidates`, {
          method: 'POST',
          body: JSON.stringify({ weights }),
        });
        newMatches[item._id] = candidates;
      } catch (e) {
        console.error(e);
      }
    }

    setReplayedMatches(newMatches);
    setIsSimulating(false);
  };

  const resetWeights = () => {
    setWeights({
      distanceWeight: 0.35,
      capacityWeight: 0.25,
      deadlineWeight: 0.20,
      reliabilityWeight: 0.20,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Matching Lab & Policy Simulation Sandbox
        </h1>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
          Replay historical surplus distributions with customized objective weights to evaluate simulated pickup efficiency.
        </p>
      </div>

      {/* Geospatial Recommendation Banner (Section 5, Item 10) */}
      {geospatialData?.recommendation && (
        <div className="p-4 rounded-md border border-brand/30 bg-[#DCFCE7]/30 dark:bg-[#14532D]/30 flex items-start gap-3 text-xs">
          <MapPin className="w-4 h-4 text-brand shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-brand dark:text-[#86EFAC] uppercase tracking-wide">
              Geospatial Unserved Zone Recommendation
            </span>
            <p className="text-text-primary-light dark:text-text-primary-dark font-medium leading-relaxed">
              {geospatialData.recommendation}
            </p>
          </div>
        </div>
      )}

      {/* Simulation Controls & Weight Sliders */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-brand" />
            <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
              Objective Function Weight Tuning
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetWeights}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border-light dark:border-border-dark text-xs hover:bg-surface-hover-light dark:hover:bg-surface-hover-dark"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={runReplaySimulation}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded font-medium text-xs text-white bg-brand hover:bg-brand-dark transition-colors shadow-2xs disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isSimulating ? 'Simulating Replay...' : 'Replay Matching Engine'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="flex justify-between font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              <span>Distance Weight</span>
              <span className="font-mono font-bold text-brand">{Math.round(weights.distanceWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.distanceWeight}
              onChange={e => handleWeightChange('distanceWeight', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand"
            />
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-1">
              Favors physically nearest partner hub.
            </p>
          </div>

          <div>
            <div className="flex justify-between font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              <span>Capacity Weight</span>
              <span className="font-mono font-bold text-brand">{Math.round(weights.capacityWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.capacityWeight}
              onChange={e => handleWeightChange('capacityWeight', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand"
            />
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-1">
              Favors vehicles with matching payload capacity.
            </p>
          </div>

          <div>
            <div className="flex justify-between font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              <span>Deadline Margin</span>
              <span className="font-mono font-bold text-brand">{Math.round(weights.deadlineWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.deadlineWeight}
              onChange={e => handleWeightChange('deadlineWeight', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand"
            />
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-1">
              Penalizes candidates with transit times close to expiry.
            </p>
          </div>

          <div>
            <div className="flex justify-between font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              <span>Bayesian Reliability</span>
              <span className="font-mono font-bold text-brand">{Math.round(weights.reliabilityWeight * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={weights.reliabilityWeight}
              onChange={e => handleWeightChange('reliabilityWeight', parseFloat(e.target.value))}
              className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand"
            />
            <p className="text-[10px] text-text-muted-light dark:text-text-muted-dark mt-1">
              Favors organizations with historical completion fidelity.
            </p>
          </div>
        </div>
      </div>

      {/* Replay Simulation Results */}
      <div className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4">
        <h2 className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
          Historical Replay Comparison (Simulated vs Actual Outcomes)
        </h2>

        <div className="space-y-3">
          {sampleListings.map(listing => {
            const replayed = replayedMatches[listing._id];
            const simTopNgo = replayed?.[0];

            return (
              <div
                key={listing._id}
                className="p-3.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {listing.title}
                    </span>
                    <span className="text-[11px] text-text-muted-light dark:text-text-muted-dark ml-2">
                      ({listing.quantityKg} kg • {listing.mealType})
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-text-muted-light dark:text-text-muted-dark">
                    ID: {listing._id.slice(-6)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Actual Historic Assignment */}
                  <div className="p-2.5 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                    <span className="text-[10px] font-mono text-text-muted-light uppercase block">
                      Actual Historic Winner
                    </span>
                    <div className="font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                      {listing.claimedByNgoId?.name || 'Robin Hood Army'}
                    </div>
                    <div className="text-[11px] text-brand font-mono mt-1">
                      Status: {listing.status}
                    </div>
                  </div>

                  {/* Simulated Replay Rank #1 */}
                  <div className="p-2.5 rounded bg-surface-light dark:bg-surface-dark border border-brand/30">
                    <span className="text-[10px] font-mono text-brand uppercase font-semibold block">
                      Simulated Rank #1 with New Weights
                    </span>
                    <div className="font-semibold text-text-primary-light dark:text-text-primary-dark mt-0.5">
                      {simTopNgo ? simTopNgo.ngo?.name : 'Run simulation to inspect'}
                    </div>
                    {simTopNgo && (
                      <div className="text-[11px] font-mono text-brand mt-1">
                        Score: {simTopNgo.totalScore} / 100 • Distance: {simTopNgo.distanceKm} km
                      </div>
                    )}
                  </div>
                </div>

                {simTopNgo && (
                  <p className="text-[11px] text-text-secondary-light dark:text-text-secondary-dark leading-snug pt-1">
                    {simTopNgo.explanation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

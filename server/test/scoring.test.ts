import { describe, it, expect } from 'vitest';
import { calculateScoreBreakdown } from '../src/services/matchingEngine.js';

describe('Matching Engine Scoring Function', () => {
  const baseReliability = {
    bayesianScore: 0.92,
    averageDelayMinutes: 12,
    timeOfDayProfile: {
      morningRate: 0.95,
      afternoonRate: 0.90,
      eveningRate: 0.95,
      nightRate: 0.80,
    },
  };

  it('assigns high score to a close NGO with sufficient vehicle capacity and good reliability', () => {
    const collectBy = new Date(Date.now() + 180 * 60000); // 3 hours window
    const { breakdown, explanation } = calculateScoreBreakdown(
      3.2, // 3.2 km
      20,  // 20 km radius
      250, // 250 kg capacity
      45,  // 45 kg quantity
      collectBy,
      baseReliability,
      new Date()
    );

    expect(breakdown.distanceScore).toBeGreaterThanOrEqual(80);
    expect(breakdown.capacityScore).toBeGreaterThanOrEqual(85);
    expect(breakdown.deadlineScore).toBe(100);
    expect(breakdown.reliabilityScore).toBeGreaterThanOrEqual(80);
    expect(explanation).toContain('km away');
  });

  it('penalizes distance when candidate is near service radius boundary', () => {
    const collectBy = new Date(Date.now() + 180 * 60000);
    const { breakdown } = calculateScoreBreakdown(
      19.0, // 19 km
      20,   // 20 km radius
      200,
      50,
      collectBy,
      baseReliability,
      new Date()
    );

    expect(breakdown.distanceScore).toBeLessThan(20);
  });

  it('penalizes deadline feasibility when remaining window is shorter than transit time', () => {
    const collectBy = new Date(Date.now() + 25 * 60000); // only 25 minutes left
    const { breakdown } = calculateScoreBreakdown(
      15.0, // transit alone takes 15 + 15*2.5 + 15 = 67.5 mins
      25,
      200,
      50,
      collectBy,
      baseReliability,
      new Date()
    );

    expect(breakdown.deadlineScore).toBeLessThan(50);
  });
});

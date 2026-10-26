import React, { useState, useEffect } from 'react';
import { PageHero } from '../../components/PageHero';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Send, MapPin, Calculator, AlertCircle, CheckCircle2, Award } from 'lucide-react';

export const ReportSurplus: React.FC = () => {
  const { user } = useAuth();
  const [messes, setMesses] = useState<any[]>([]);
  const [selectedMessId, setSelectedMessId] = useState<string>('');

  const [form, setForm] = useState({
    title: 'Dinner Surplus: Steamed Rice & Dal Tadka',
    foodCategory: 'COOKED_MEALS',
    mealType: 'DINNER',
    quantityKg: 24.5,
    portionsEstimate: 60,
    preparedAt: new Date().toISOString().slice(0, 16),
    collectBy: new Date(Date.now() + 3.5 * 3600000).toISOString().slice(0, 16),
    dietaryTags: ['VEG', 'HALAL'],
    notes: 'Stored in sanitary thermal insulated containers. Loading dock available at Gate 2.',
  });

  const [matches, setMatches] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    apiRequest('/messes').then(data => {
      setMesses(data);
      if (user?.organizationId) {
        setSelectedMessId(user.organizationId);
      } else if (data.length > 0) {
        setSelectedMessId(data[0]._id);
      }
    });
  }, [user]);

  // Portions Auto-Calculator based on meal type
  useEffect(() => {
    const factors: Record<string, number> = {
      BREAKFAST: 3.5,
      LUNCH: 2.5,
      SNACKS: 4.0,
      DINNER: 2.5,
    };
    const factor = factors[form.mealType] || 2.5;
    setForm(prev => ({ ...prev, portionsEstimate: Math.round(prev.quantityKg * factor) }));
  }, [form.quantityKg, form.mealType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        messId: selectedMessId,
        title: form.title,
        foodCategory: form.foodCategory,
        mealType: form.mealType,
        quantityKg: Number(form.quantityKg),
        portionsEstimate: Number(form.portionsEstimate),
        preparedAt: new Date(form.preparedAt).toISOString(),
        collectBy: new Date(form.collectBy).toISOString(),
        dietaryTags: form.dietaryTags,
        notes: form.notes,
      };

      const res = await apiRequest('/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccessMessage(
        `Posted. ${res.matchingScores?.length || 0} nearby NGOs can see it now, closest first.`
      );
      setMatches(res.matchingScores || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Could not post this food. Check the fields and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMess = messes.find(m => m._id === selectedMessId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHero
        image="/images/mess-thali-tray.webp"
        imageAlt="A stainless steel mess tray with sabzi, roti and dal"
        title="Post surplus food"
        description="Tell nearby NGOs what is left after this meal. The closest ones with room in their van are matched first."
        focus="center 60%"
      />

      {successMessage && (
        <div className="p-3 rounded-md bg-[#E1EFE6] dark:bg-[#1B3A2A] border border-[#C6DFCF] dark:border-[#1E5B3C] text-xs text-[#1E5B3C] dark:text-[#9FD4B2] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-md bg-[#F8E3DE] dark:bg-[#4A1F17] border border-[#EFC5BB] dark:border-[#8E3322] text-xs text-[#8E3322] dark:text-[#F0A895] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Form */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-2 p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4 text-xs"
        >
          {/* Mess Selection */}
          <div>
            <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Mess
            </label>
            <select
              value={selectedMessId}
              onChange={e => setSelectedMessId(e.target.value)}
              className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-medium focus:outline-hidden"
              required
            >
              {messes.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name} — {m.campus} ({m.capacity} students)
                </option>
              ))}
            </select>
            {selectedMess && (
              <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-brand" /> {selectedMess.address}
              </p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              What is left
            </label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-medium focus:outline-hidden"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Food Category
              </label>
              <select
                value={form.foodCategory}
                onChange={e => setForm({ ...form, foodCategory: e.target.value })}
                className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-medium focus:outline-hidden"
              >
                <option value="COOKED_MEALS">Cooked Meals (Warm)</option>
                <option value="GRAINS_STAPLES">Grains & Staples</option>
                <option value="RAW_VEGETABLES">Raw Produce / Veg</option>
                <option value="BAKERY_SNACKS">Bakery & Snacks</option>
                <option value="PACKAGED">Packaged Provisions</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Meal
              </label>
              <select
                value={form.mealType}
                onChange={e => setForm({ ...form, mealType: e.target.value })}
                className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-medium focus:outline-hidden"
              >
                <option value="BREAKFAST">Breakfast (07:00 - 10:00)</option>
                <option value="LUNCH">Lunch (12:00 - 15:00)</option>
                <option value="SNACKS">Snacks (17:00 - 19:00)</option>
                <option value="DINNER">Dinner (20:00 - 22:30)</option>
              </select>
            </div>
          </div>

          {/* Quantities */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Quantity (kg)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={form.quantityKg}
                onChange={e => setForm({ ...form, quantityKg: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-mono font-medium focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1 flex items-center justify-between">
                <span>Portions (approx.)</span>
                <span className="text-xs text-brand flex items-center gap-0.5">
                  <Calculator className="w-3 h-3" /> Auto
                </span>
              </label>
              <input
                type="number"
                value={form.portionsEstimate}
                onChange={e => setForm({ ...form, portionsEstimate: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-mono font-medium focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Cooked at
              </label>
              <input
                type="datetime-local"
                value={form.preparedAt}
                onChange={e => setForm({ ...form, preparedAt: e.target.value })}
                className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-mono focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Must be collected by
              </label>
              <input
                type="datetime-local"
                value={form.collectBy}
                onChange={e => setForm({ ...form, collectBy: e.target.value })}
                className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-mono focus:outline-hidden"
                required
              />
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Notes for the pickup team
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-text-primary-light dark:text-text-primary-dark font-medium focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded font-medium text-white bg-brand hover:bg-brand-dark transition-colors flex items-center justify-center gap-2 shadow-2xs disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Posting…' : 'Post to nearby NGOs'}</span>
          </button>
        </form>

        {/* Sidebar Info & Match Preview */}
        <div className="space-y-4">
          <div className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-3 text-xs">
            <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5">
              <Award className="w-4 h-4 text-brand" />
              Automated Dispatch Logic
            </h3>
            <p className="text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
              When published, MongoDB executes a <code className="font-mono bg-bg-light dark:bg-bg-dark px-1 py-0.5 rounded">$geoNear</code> query
              filtering NGOs within their verified service perimeter.
            </p>
            <div className="space-y-1 font-mono text-xs pt-1">
              <div className="flex justify-between py-1 border-b border-border-light dark:border-border-dark">
                <span className="text-text-muted-light dark:text-text-muted-dark">Distance Weight</span>
                <span>35%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-light dark:border-border-dark">
                <span className="text-text-muted-light dark:text-text-muted-dark">Capacity Fit</span>
                <span>25%</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border-light dark:border-border-dark">
                <span className="text-text-muted-light dark:text-text-muted-dark">Deadline Margin</span>
                <span>20%</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-text-muted-light dark:text-text-muted-dark">Bayesian Reliability</span>
                <span>20%</span>
              </div>
            </div>
          </div>

          {/* Real-time Match Recommendations */}
          {matches.length > 0 && (
            <div className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-2.5 text-xs">
              <h4 className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                Ranked Candidates ({matches.length})
              </h4>
              <div className="space-y-2">
                {matches.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-2 rounded bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark"
                  >
                    <div className="flex items-center justify-between font-mono font-medium">
                      <span>Rank #{m.rank}</span>
                      <span className="text-brand font-bold">{m.totalScore} / 100</span>
                    </div>
                    <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 leading-snug">
                      {m.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { Settings2, Save, CheckCircle2, Truck, Navigation, Clock } from 'lucide-react';

export const ServiceSettings: React.FC = () => {
  const { user } = useAuth();
  const [ngo, setNgo] = useState<any | null>(null);
  const [form, setForm] = useState({
    serviceRadiusKm: 15,
    vehicleCapacityKg: 200,
    operatingStart: '07:00',
    operatingEnd: '23:30',
    contactPerson: '',
    phone: '',
  });

  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    apiRequest<any[]>('/ngos').then(ngos => {
      const current = user?.organizationId
        ? ngos.find(n => n._id === user.organizationId) || ngos[0]
        : ngos[0];
      setNgo(current);
      if (current) {
        setForm({
          serviceRadiusKm: current.serviceRadiusKm || 15,
          vehicleCapacityKg: current.vehicleCapacityKg || 200,
          operatingStart: current.operatingHours?.start || '07:00',
          operatingEnd: current.operatingHours?.end || '23:30',
          contactPerson: current.contactPerson || '',
          phone: current.phone || '',
        });
      }
    });
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ngo) return;
    setIsSaving(true);
    setIsSaved(false);

    try {
      const payload = {
        serviceRadiusKm: Number(form.serviceRadiusKm),
        vehicleCapacityKg: Number(form.vehicleCapacityKg),
        operatingHours: {
          start: form.operatingStart,
          end: form.operatingEnd,
        },
        contactPerson: form.contactPerson,
        phone: form.phone,
      };

      const updated = await apiRequest(`/ngos/${ngo._id}/settings`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      setNgo(updated);
      setIsSaved(true);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-[1.75rem] leading-tight text-text-primary-light dark:text-text-primary-dark">
          Service area
        </h1>
        <p className="text-[15px] text-text-secondary-light dark:text-text-secondary-dark mt-1 max-w-2xl">
          How far your team can travel and how much your vehicle carries. Matching uses these to decide what you see.
        </p>
      </div>

      {isSaved && (
        <div className="p-3 rounded-md bg-[#E1EFE6] dark:bg-[#1B3A2A] border border-[#C6DFCF] dark:border-[#1E5B3C] text-xs text-[#1E5B3C] dark:text-[#9FD4B2] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Operational settings updated successfully. Dispatch radius updated in MongoDB.</span>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="p-5 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-4 text-xs"
      >
        <div className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5 pb-2 border-b border-border-light dark:border-border-dark">
          <Settings2 className="w-4 h-4 text-brand" />
          Organization: {ngo?.name || 'NGO Partner'}
        </div>

        {/* Service Radius Slider */}
        <div>
          <div className="flex justify-between font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            <span className="flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-brand" /> Maximum Service Radius
            </span>
            <span className="font-mono font-bold text-text-primary-light dark:text-text-primary-dark">
              {form.serviceRadiusKm} km
            </span>
          </div>
          <input
            type="range"
            min="3"
            max="40"
            step="1"
            value={form.serviceRadiusKm}
            onChange={e => setForm({ ...form, serviceRadiusKm: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand"
          />
          <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-1">
            The platform will only broadcast surplus listings from hostel messes located within {form.serviceRadiusKm} km of your depot.
          </p>
        </div>

        {/* Vehicle Payload Capacity */}
        <div>
          <div className="flex justify-between font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-brand" /> Active Fleet Payload Capacity
            </span>
            <span className="font-mono font-bold text-text-primary-light dark:text-text-primary-dark">
              {form.vehicleCapacityKg} kg
            </span>
          </div>
          <input
            type="range"
            min="50"
            max="1000"
            step="25"
            value={form.vehicleCapacityKg}
            onChange={e => setForm({ ...form, vehicleCapacityKg: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-border-light dark:bg-border-dark rounded-lg appearance-none cursor-pointer accent-brand"
          />
        </div>

        {/* Operating Hours */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Operating Window Starts
            </label>
            <input
              type="time"
              value={form.operatingStart}
              onChange={e => setForm({ ...form, operatingStart: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Operating Window Ends
            </label>
            <input
              type="time"
              value={form.operatingEnd}
              onChange={e => setForm({ ...form, operatingEnd: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
            />
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Dispatch Coordinator Name
            </label>
            <input
              type="text"
              value={form.contactPerson}
              onChange={e => setForm({ ...form, contactPerson: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-xs"
            />
          </div>

          <div>
            <label className="block font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Operations Phone Hotline
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark font-mono text-xs"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-2.5 rounded font-medium text-white bg-brand hover:bg-brand-dark transition-colors flex items-center justify-center gap-1.5 mt-2"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Updating...' : 'Save Service Parameters'}</span>
        </button>
      </form>
    </div>
  );
};

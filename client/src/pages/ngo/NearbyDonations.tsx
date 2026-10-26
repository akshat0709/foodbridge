import React, { useState, useEffect } from 'react';
import { PageHero } from '../../components/PageHero';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge } from '../../components/StatusBadge';
import { MapPin, Truck, Clock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

// Custom Map Pins for Leaflet
const messIcon = new L.DivIcon({
  className: 'custom-pin',
  html: `<div style="background-color:#1E5B3C;width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.3)">M</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const ngoIcon = new L.DivIcon({
  className: 'custom-ngo-pin',
  html: `<div style="background-color:#D99A1E;width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 2px 5px rgba(0,0,0,0.4)">NGO</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export const NearbyDonations: React.FC = () => {
  const { user } = useAuth();
  const [ngoDetails, setNgoDetails] = useState<any | null>(null);
  const [nearbyListings, setNearbyListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchNgoAndNearby = async () => {
    setIsLoading(true);
    try {
      // Fetch NGO profile
      const ngos = await apiRequest<any[]>('/ngos');
      const currentNgo = user?.organizationId
        ? ngos.find(n => n._id === user.organizationId) || ngos[0]
        : ngos[0];
      setNgoDetails(currentNgo);

      if (currentNgo) {
        const donations = await apiRequest<any[]>(`/ngos/${currentNgo._id}/nearby-donations`);
        setNearbyListings(donations);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNgoAndNearby();
  }, [user]);

  // ATOMIC CLAIM ACTION
  const handleClaim = async (listingId: string) => {
    if (!ngoDetails) return;
    setClaimingId(listingId);
    setActionMessage(null);

    try {
      const res = await apiRequest(`/listings/${listingId}/claim`, {
        method: 'POST',
        body: JSON.stringify({
          ngoId: ngoDetails._id,
          note: `Claimed via NGO Dispatch Terminal by ${user?.name || 'Operator'}`,
        }),
      });

      setActionMessage({
        type: 'success',
        text: `Claimed “${res.title}”. It is held for your team. You will find it under My pickups.`,
      });
      fetchNgoAndNearby();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err.message || 'Claim collision: This listing was already reserved by another organization.',
      });
    } finally {
      setClaimingId(null);
    }
  };

  const centerLat = ngoDetails?.location?.coordinates[1] || 28.545;
  const centerLng = ngoDetails?.location?.coordinates[0] || 77.192;
  const radiusMeters = (ngoDetails?.serviceRadiusKm || 15) * 1000;

  return (
    <div className="space-y-4">
      <PageHero
        image="/images/ngo-van-loading.webp"
        imageAlt="A volunteer loading cartons into the back of a van"
        title="Food near you"
        description="Leftover meals from hostel messes inside your service area. Claim one and it is held for your team."
        focus="center 45%"
      />

      {actionMessage && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-[#E1EFE6] dark:bg-[#1B3A2A] border-[#C6DFCF] text-[#1E5B3C] dark:text-[#9FD4B2]'
              : 'bg-[#F8E3DE] dark:bg-[#4A1F17] border-[#EFC5BB] text-[#8E3322] dark:text-[#F0A895]'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Interactive Map View */}
      <div className="h-80 w-full rounded-md border border-border-light dark:border-border-dark overflow-hidden relative z-0">
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* NGO Location & Radius Circle */}
          {ngoDetails && (
            <>
              <Marker position={[centerLat, centerLng]} icon={ngoIcon}>
                <Popup>
                  <div className="font-sans text-xs">
                    <strong>{ngoDetails.name} (Your Hub)</strong>
                    <br />
                    Vehicle Capacity: {ngoDetails.vehicleCapacityKg} kg
                    <br />
                    Service Radius: {ngoDetails.serviceRadiusKm} km
                  </div>
                </Popup>
              </Marker>

              <Circle
                center={[centerLat, centerLng]}
                radius={radiusMeters}
                pathOptions={{
                  color: '#1E5B3C',
                  fillColor: '#1E5B3C',
                  fillOpacity: 0.08,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
            </>
          )}

          {/* Available Donation Markers */}
          {nearbyListings.map(item => {
            const coords = item.mess?.location?.coordinates || item.pickupLocation?.coordinates;
            if (!coords) return null;
            return (
              <Marker
                key={item._id}
                position={[coords[1], coords[0]]}
                icon={messIcon}
              >
                <Popup>
                  <div className="font-sans text-xs space-y-1">
                    <strong className="text-brand">{item.title}</strong>
                    <div>{item.mess?.name}</div>
                    <div className="font-mono">
                      {item.quantityKg} kg (~{item.portionsEstimate} portions)
                    </div>
                    <div className="text-xs text-gray-500">
                      Collect before {new Date(item.collectBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Available surplus */}
      <section className="space-y-3" aria-labelledby="nearby-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="nearby-heading" className="text-xl text-text-primary-light dark:text-text-primary-dark">
            {nearbyListings.length === 1 ? '1 batch ready to collect' : `${nearbyListings.length} batches ready to collect`}
          </h2>
          <span className="text-sm text-text-muted-light dark:text-text-muted-dark">
            Within {ngoDetails?.serviceRadiusKm || 15} km of your base, up to {ngoDetails?.vehicleCapacityKg || 250} kg per trip
          </span>
        </div>

        {nearbyListings.length === 0 ? (
          <div className="p-10 text-center rounded-lg border border-dashed border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
            <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">Nothing to collect nearby right now</p>
            <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
              New food usually appears after lunch and dinner service. To see more messes, widen your service area.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {nearbyListings.map(listing => {
              const collectBy = new Date(listing.collectBy);
              const minsLeft = Math.round((collectBy.getTime() - Date.now()) / 60000);
              const timeLeft =
                minsLeft <= 0 ? 'past the deadline' : minsLeft < 60 ? `${minsLeft} min left` : `${Math.floor(minsLeft / 60)} h ${minsLeft % 60} min left`;
              const urgent = minsLeft < 60;
              return (
                <article
                  key={listing._id}
                  className="rounded-lg border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col overflow-hidden"
                >
                  <div className="p-4 flex-1">
                    <div className="flex items-center justify-between">
                      <StatusBadge status={listing.status} size="sm" />
                      <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                        {listing.distanceKm} km away
                      </span>
                    </div>

                    <h3 className="mt-3 text-lg leading-snug text-text-primary-light dark:text-text-primary-dark">{listing.title}</h3>
                    <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{listing.mess?.name || 'Hostel mess'}</p>

                    <div className="mt-4 flex items-end gap-6">
                      <div>
                        <span className="figure text-3xl leading-none text-text-primary-light dark:text-text-primary-dark">{listing.quantityKg}</span>
                        <span className="ml-1 text-sm text-text-muted-light dark:text-text-muted-dark">kg</span>
                      </div>
                      <div>
                        <span className="figure text-3xl leading-none text-text-primary-light dark:text-text-primary-dark">~{listing.portionsEstimate}</span>
                        <span className="ml-1 text-sm text-text-muted-light dark:text-text-muted-dark">portions</span>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`px-4 py-2.5 flex items-center gap-2 text-sm ${
                      urgent
                        ? 'bg-turmeric-light dark:bg-[#4A3608] text-[#7A5205] dark:text-[#E8B04A] font-semibold'
                        : 'bg-bg-light dark:bg-bg-dark text-text-secondary-light dark:text-text-secondary-dark'
                    }`}
                  >
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>
                      Collect by {collectBy.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ({timeLeft})
                    </span>
                  </div>

                  <div className="p-4 pt-3">
                    <button
                      onClick={() => handleClaim(listing._id)}
                      disabled={claimingId === listing._id}
                      className="w-full h-10 px-3 rounded-md font-semibold text-white bg-brand hover:bg-brand-dark transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{claimingId === listing._id ? 'Claiming…' : 'Claim this pickup'}</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

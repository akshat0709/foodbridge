import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge } from '../../components/StatusBadge';
import { MapPin, Truck, Clock, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

// Custom Map Pins for Leaflet
const messIcon = new L.DivIcon({
  className: 'custom-pin',
  html: `<div style="background-color:#166534;width:24px;height:24px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:10px;box-shadow:0 2px 4px rgba(0,0,0,0.3)">M</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const ngoIcon = new L.DivIcon({
  className: 'custom-ngo-pin',
  html: `<div style="background-color:#D97706;width:28px;height:28px;border-radius:50%;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;font-size:11px;box-shadow:0 2px 5px rgba(0,0,0,0.4)">NGO</div>`,
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
        text: `Successfully claimed ${res.title}! Status updated to RESERVED. Vehicle dispatch assigned.`,
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
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Nearby Available Food Surplus & Active Coverage
        </h1>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
          Real-time geospatial distribution of unreserved hostel mess surpluses within your verified service radius.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`p-3 rounded-md border text-xs flex items-center gap-2 ${
            actionMessage.type === 'success'
              ? 'bg-[#DCFCE7] dark:bg-[#14532D] border-[#BBF7D0] text-[#166534] dark:text-[#86EFAC]'
              : 'bg-[#FEE2E2] dark:bg-[#7F1D1D] border-[#FECACA] text-[#991B1B] dark:text-[#FCA5A5]'
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
                  color: '#166534',
                  fillColor: '#166534',
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
                    <div className="text-[11px] text-gray-500">
                      Collect before {new Date(item.collectBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Available Surplus Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
            Surplus Batches Available for Pickup ({nearbyListings.length})
          </span>
          <span className="text-text-muted-light dark:text-text-muted-dark font-mono">
            Service Radius: {ngoDetails?.serviceRadiusKm || 15} km | Capacity: {ngoDetails?.vehicleCapacityKg || 250} kg
          </span>
        </div>

        {nearbyListings.length === 0 ? (
          <div className="p-8 text-center rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark text-text-muted-light dark:text-text-muted-dark text-xs">
            No unclaimed surpluses in your perimeter right now. Checking for next meal logs...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearbyListings.map(listing => (
              <div
                key={listing._id}
                className="p-4 rounded-md border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col justify-between space-y-3 text-xs"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={listing.status} size="sm" />
                    <span className="font-mono text-brand font-bold text-[11px]">
                      {listing.distanceKm} km away
                    </span>
                  </div>

                  <h3 className="font-semibold text-text-primary-light dark:text-text-primary-dark mt-2 leading-snug">
                    {listing.title}
                  </h3>

                  <p className="text-[11px] text-text-muted-light dark:text-text-muted-dark mt-0.5">
                    {listing.mess?.name || 'Campus Hostel Mess'}
                  </p>

                  <div className="mt-2.5 p-2 rounded bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark font-mono text-[11px] flex justify-between">
                    <span>
                      Qty: <strong>{listing.quantityKg} kg</strong>
                    </span>
                    <span>~{listing.portionsEstimate} portions</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-border-light dark:border-border-dark pt-2.5">
                  <div className="flex items-center justify-between text-[11px] text-text-secondary-light dark:text-text-secondary-dark">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-warning" /> Collect before
                    </span>
                    <span className="font-mono font-medium">
                      {new Date(listing.collectBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={() => handleClaim(listing._id)}
                    disabled={claimingId === listing._id}
                    className="w-full py-1.5 px-3 rounded font-medium text-white bg-brand hover:bg-brand-dark transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{claimingId === listing._id ? 'Securing Claim...' : 'Accept & Reserve Pickup'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

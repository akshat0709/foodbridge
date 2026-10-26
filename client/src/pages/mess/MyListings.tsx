import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest, exportCsv } from '../../api/client';
import { DataTable, Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { SideDrawer } from '../../components/SideDrawer';
import { Clock, MapPin, Truck, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const MyListings: React.FC = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);

  const fetchListings = () => {
    setIsLoading(true);
    let url = `/listings?page=${page}&limit=25`;
    if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
    if (user?.organizationId) url += `&messId=${user.organizationId}`;

    apiRequest<{ items: any[]; pagination: any }>(url)
      .then(res => {
        setListings(res.items);
        setTotal(res.pagination.total);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchListings();
  }, [page, statusFilter, user]);

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Title / Menu Surplus',
      render: r => (
        <div>
          <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
            {r.title}
          </div>
          <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
            {r.messId?.name || 'Mess Facility'}
          </div>
        </div>
      ),
    },
    {
      key: 'quantityKg',
      header: 'Quantity',
      align: 'right',
      render: r => (
        <div>
          <span className="font-mono font-semibold">{r.quantityKg} kg</span>
          <span className="block text-xs text-text-muted-light dark:text-text-muted-dark">
            ~{r.portionsEstimate} portions
          </span>
        </div>
      ),
    },
    {
      key: 'mealType',
      header: 'Meal / Category',
      render: r => (
        <div>
          <span className="font-medium">{r.mealType}</span>
          <span className="block text-xs text-text-muted-light dark:text-text-muted-dark">
            {r.foodCategory?.replace('_', ' ')}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: r => <StatusBadge status={r.status} />,
    },
    {
      key: 'claimedByNgoId',
      header: 'Assigned NGO',
      render: r => (
        <span className="text-xs">
          {r.claimedByNgoId ? (
            <span className="font-medium text-brand">{r.claimedByNgoId.name}</span>
          ) : (
            <span className="text-text-muted-light dark:text-text-muted-dark">Not claimed yet</span>
          )}
        </span>
      ),
    },
    {
      key: 'collectBy',
      header: 'Collect Deadline',
      align: 'right',
      render: r => (
        <div className="font-mono text-xs">
          <div>{new Date(r.collectBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
            {new Date(r.collectBy).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[1.75rem] leading-tight text-text-primary-light dark:text-text-primary-dark">
            My listings
          </h1>
          <p className="text-[15px] text-text-secondary-light dark:text-text-secondary-dark mt-1 max-w-2xl">
          Every batch you have posted and where it is now. Select a row to see its full history.
        </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded text-xs">
          {['ALL', 'AVAILABLE', 'RESERVED', 'COLLECTED', 'COMPLETED', 'EXPIRED'].map(st => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                statusFilter === st
                  ? 'bg-brand text-white font-semibold'
                  : 'text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light'
              }`}
            >
              {({ ALL: 'All', AVAILABLE: 'Available', RESERVED: 'Claimed', COLLECTED: 'Picked up', COMPLETED: 'Delivered', EXPIRED: 'Expired' } as Record<string, string>)[st]}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={listings}
        totalRecords={total}
        currentPage={page}
        totalPages={Math.ceil(total / 25)}
        pageSize={25}
        onPageChange={setPage}
        onRowClick={row => setSelectedListing(row)}
        onExportCsv={() => exportCsv('/api/reports/export-listings-csv', 'my_listings.csv')}
        isLoading={isLoading}
      />

      {/* Side Drawer for Listing Inspection */}
      <SideDrawer
        isOpen={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        title={selectedListing?.title || 'Listing Details'}
        subtitle={`ID: ${selectedListing?._id}`}
      >
        {selectedListing && (
          <div className="space-y-5 text-xs">
            {/* Status & Quantities Banner */}
            <div className="p-3.5 rounded-md bg-bg-light dark:bg-bg-dark border border-border-light dark:border-border-dark flex items-center justify-between">
              <div>
                <div className="text-text-muted-light dark:text-text-muted-dark">Current Lifecycle State</div>
                <div className="mt-1">
                  <StatusBadge status={selectedListing.status} />
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-mono font-bold text-text-primary-light dark:text-text-primary-dark">
                  {selectedListing.quantityKg} kg
                </div>
                <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
                  ~{selectedListing.portionsEstimate} estimated portions
                </div>
              </div>
            </div>

            {/* Location & Contact Info */}
            <div className="space-y-2">
              <div className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand" />
                Pickup Location & Logistics
              </div>
              <div className="p-3 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-1 text-xs">
                <div>
                  <strong>Address:</strong> {selectedListing.pickupAddress}
                </div>
                <div>
                  <strong>Prepared At:</strong>{' '}
                  {new Date(selectedListing.preparedAt).toLocaleString()}
                </div>
                <div>
                  <strong>Collect Deadline:</strong>{' '}
                  <span className="text-danger font-mono font-medium">
                    {new Date(selectedListing.collectBy).toLocaleString()}
                  </span>
                </div>
                {selectedListing.notes && (
                  <div className="pt-1 text-text-secondary-light dark:text-text-secondary-dark italic">
                    "{selectedListing.notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Partner Details */}
            {selectedListing.claimedByNgoId && (
              <div className="space-y-2">
                <div className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-brand" />
                  Claiming NGO Partner
                </div>
                <div className="p-3 rounded border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-1">
                  <div className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {selectedListing.claimedByNgoId.name}
                  </div>
                  <div className="text-text-secondary-light dark:text-text-secondary-dark">
                    Contact: {selectedListing.claimedByNgoId.phone}
                  </div>
                  <div className="text-text-muted-light dark:text-text-muted-dark font-mono text-xs">
                    Vehicle Capacity: {selectedListing.claimedByNgoId.vehicleCapacityKg || 250} kg |
                    Radius: {selectedListing.claimedByNgoId.serviceRadiusKm || 15} km
                  </div>
                </div>
              </div>
            )}

            {/* Matching Engine Score Breakdown */}
            {selectedListing.matchingScores?.length > 0 && (
              <div className="space-y-2">
                <div className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-brand" />
                  Dispatch Engine Scoring Breakdown
                </div>
                <div className="space-y-2">
                  {selectedListing.matchingScores.slice(0, 3).map((score: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded border border-border-light dark:border-border-dark bg-bg-light dark:bg-bg-dark text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <span className="font-medium">Candidate #{score.rank}</span>
                        <span className="text-brand font-bold">{score.totalScore}/100</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-xs font-mono text-center">
                        <div className="p-1 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                          <div>Dist</div>
                          <div className="font-bold text-text-primary-light dark:text-text-primary-dark">
                            {score.breakdown?.distanceScore}
                          </div>
                        </div>
                        <div className="p-1 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                          <div>Cap</div>
                          <div className="font-bold text-text-primary-light dark:text-text-primary-dark">
                            {score.breakdown?.capacityScore}
                          </div>
                        </div>
                        <div className="p-1 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                          <div>Time</div>
                          <div className="font-bold text-text-primary-light dark:text-text-primary-dark">
                            {score.breakdown?.deadlineScore}
                          </div>
                        </div>
                        <div className="p-1 rounded bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark">
                          <div>Rel</div>
                          <div className="font-bold text-text-primary-light dark:text-text-primary-dark">
                            {score.breakdown?.reliabilityScore}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-snug">
                        {score.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lifecycle Status History Timeline */}
            <div className="space-y-2">
              <div className="font-semibold text-text-primary-light dark:text-text-primary-dark flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand" />
                Audit Trail & Status Timeline
              </div>
              <div className="border-l-2 border-border-light dark:border-border-dark ml-2 pl-3 space-y-3">
                {selectedListing.statusHistory?.map((step: any, idx: number) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-brand" />
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{step.status}</span>
                      <span className="text-xs font-mono text-text-muted-light dark:text-text-muted-dark">
                        {new Date(step.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {step.note && (
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                        {step.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SideDrawer>
    </div>
  );
};

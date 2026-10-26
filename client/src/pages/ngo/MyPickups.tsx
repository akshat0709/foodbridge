import React, { useState, useEffect } from 'react';
import { PageHero } from '../../components/PageHero';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../api/client';
import { DataTable, Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { Check, Truck, CheckCircle2, AlertOctagon, Clock } from 'lucide-react';

export const MyPickups: React.FC = () => {
  const { user } = useAuth();
  const [pickups, setPickups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPickups = () => {
    setIsLoading(true);
    let url = `/listings?page=${page}&limit=25`;
    if (user?.organizationId) {
      url += `&claimedByNgoId=${user.organizationId}`;
    }

    apiRequest<{ items: any[]; pagination: any }>(url)
      .then(res => {
        setPickups(res.items);
        setTotal(res.pagination.total);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPickups();
  }, [page, user]);

  const handleTransition = async (listingId: string, status: string, note: string) => {
    setProcessingId(listingId);
    try {
      await apiRequest(`/listings/${listingId}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status, note }),
      });
      fetchPickups();
    } catch (err: any) {
      alert(err.message || 'Status transition failed');
    } finally {
      setProcessingId(null);
    }
  };

  const columns: Column<any>[] = [
    {
      key: 'title',
      header: 'Pickup Mission',
      render: r => (
        <div>
          <div className="font-medium text-text-primary-light dark:text-text-primary-dark">
            {r.title}
          </div>
          <div className="text-xs text-text-muted-light dark:text-text-muted-dark">
            {r.messId?.name} • {r.pickupAddress}
          </div>
        </div>
      ),
    },
    {
      key: 'quantityKg',
      header: 'Weight / Portions',
      align: 'right',
      render: r => (
        <span className="font-mono">
          <strong>{r.quantityKg} kg</strong> (~{r.portionsEstimate})
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: r => <StatusBadge status={r.status} />,
    },
    {
      key: 'collectBy',
      header: 'Safe Window',
      align: 'right',
      render: r => (
        <div className="font-mono text-xs">
          <div>{new Date(r.collectBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Operational Transition',
      align: 'center',
      render: r => (
        <div className="flex items-center justify-center gap-1.5">
          {r.status === 'RESERVED' && (
            <button
              onClick={() =>
                handleTransition(
                  r._id,
                  'COLLECTED',
                  'Vehicle reached hostel mess and loaded insulated containers'
                )
              }
              disabled={processingId === r._id}
              className="px-2 py-1 rounded bg-[#E2EAF2] text-[#2F4F6E] dark:bg-[#1E2F40] dark:text-[#A9C2DA] font-medium text-xs hover:opacity-80 transition-opacity"
            >
              Mark Collected
            </button>
          )}

          {r.status === 'COLLECTED' && (
            <button
              onClick={() =>
                handleTransition(
                  r._id,
                  'COMPLETED',
                  'Successfully transferred to community distribution shelter'
                )
              }
              disabled={processingId === r._id}
              className="px-2 py-1 rounded bg-[#E1EFE6] text-[#1E5B3C] dark:bg-[#1B3A2A] dark:text-[#9FD4B2] font-medium text-xs hover:opacity-80 transition-opacity flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Complete Delivery</span>
            </button>
          )}

          {(r.status === 'RESERVED' || r.status === 'COLLECTED') && (
            <button
              onClick={() =>
                handleTransition(
                  r._id,
                  'FAILED',
                  'Logistical transit delay breach safe consumption temperature'
                )
              }
              disabled={processingId === r._id}
              className="px-2 py-1 rounded bg-[#F8E3DE] text-[#8E3322] dark:bg-[#4A1F17] dark:text-[#F0A895] font-medium text-xs hover:opacity-80 transition-opacity"
            >
              Fail
            </button>
          )}

          {(r.status === 'COMPLETED' || r.status === 'EXPIRED' || r.status === 'FAILED') && (
            <span className="text-xs text-text-muted-light dark:text-text-muted-dark font-mono">
              Archived
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHero
        image="/images/ngo-packing-bags.webp"
        imageAlt="A volunteer packing paper bags of food at a distribution point"
        title="My pickups"
        description="Mark each pickup as collected when it is in your van, and delivered once it has been handed out."
        focus="center 35%"
      />

      <DataTable
        columns={columns}
        data={pickups}
        totalRecords={total}
        currentPage={page}
        totalPages={Math.ceil(total / 25)}
        pageSize={25}
        onPageChange={setPage}
        isLoading={isLoading}
      />
    </div>
  );
};

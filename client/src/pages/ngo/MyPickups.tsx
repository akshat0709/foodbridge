import React, { useState, useEffect } from 'react';
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
          <div className="text-[11px] text-text-muted-light dark:text-text-muted-dark">
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
              className="px-2 py-1 rounded bg-[#E0E7FF] text-[#3730A3] dark:bg-[#312E81] dark:text-[#A5B4FC] font-medium text-[11px] hover:opacity-80 transition-opacity"
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
              className="px-2 py-1 rounded bg-[#DCFCE7] text-[#166534] dark:bg-[#14532D] dark:text-[#86EFAC] font-medium text-[11px] hover:opacity-80 transition-opacity flex items-center gap-1"
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
              className="px-2 py-1 rounded bg-[#FEE2E2] text-[#991B1B] dark:bg-[#7F1D1D] dark:text-[#FCA5A5] font-medium text-[11px] hover:opacity-80 transition-opacity"
            >
              Fail
            </button>
          )}

          {(r.status === 'COMPLETED' || r.status === 'EXPIRED' || r.status === 'FAILED') && (
            <span className="text-[11px] text-text-muted-light dark:text-text-muted-dark font-mono">
              Archived
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary-light dark:text-text-primary-dark">
          Assigned Pickups & Mission Execution
        </h1>
        <p className="text-xs text-text-muted-light dark:text-text-muted-dark mt-0.5">
          Execute handoffs from Reserved to Collected to Completed with atomic transition logging.
        </p>
      </div>

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

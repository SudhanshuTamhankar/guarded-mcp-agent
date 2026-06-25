import { useState, useEffect } from 'react';
import { CheckSquare, Check, X } from 'lucide-react';
import { api } from '../api/client';

export default function Approvals() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchPending();
    const interval = setInterval(fetchPending, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchPending = async () => {
    try {
      const data = await api.approvals.getPending();
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (id: string, approved: boolean) => {
    setProcessing(id);
    try {
      if (approved) {
        await api.approvals.approve(id);
      } else {
        await api.approvals.deny(id, 'Denied by Admin via Dashboard');
      }
      await fetchPending();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Approval Queue</h1>
          <p className="text-slate-400">Review and resolve tools blocked by REQUIRE_APPROVAL policies.</p>
        </div>
        <div className="bg-amber-900/30 px-4 py-2 rounded flex items-center gap-2 border border-amber-500/50">
          <CheckSquare className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-400">{requests.length} Pending</span>
        </div>
      </div>

      {loading && requests.length === 0 ? (
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-slate-800 rounded-xl"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => (
            <div key={req.id} className="bg-slate-800 border border-slate-700 p-5 rounded-xl">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Tool Execution Paused</h3>
                  <p className="text-sm text-slate-400">Reason: {req.reason}</p>
                  
                  <div className="mt-4 flex gap-4 text-sm text-slate-500">
                    <div>
                      <span className="block text-slate-600 mb-1 text-xs uppercase font-bold">Request ID</span>
                      <span className="font-mono">{req.id.substring(0,8)}</span>
                    </div>
                    <div>
                      <span className="block text-slate-600 mb-1 text-xs uppercase font-bold">Requested At</span>
                      {new Date(req.requested_at).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="block text-slate-600 mb-1 text-xs uppercase font-bold">Expires</span>
                      {new Date(req.expires_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDecision(req.id, false)}
                    disabled={processing === req.id}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
                  >
                    <X size={16} /> Deny
                  </button>
                  <button
                    onClick={() => handleDecision(req.id, true)}
                    disabled={processing === req.id}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded transition-colors disabled:opacity-50"
                  >
                    <Check size={16} /> Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
          {requests.length === 0 && (
            <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <CheckSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">All caught up</h3>
              <p className="text-slate-500">No pending approval requests.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

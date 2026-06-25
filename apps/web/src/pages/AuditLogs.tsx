import { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../api/client';

export default function AuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.logs.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (severity: string) => {
    if (severity === 'WARNING') return <ShieldAlert className="w-5 h-5 text-amber-500" />;
    if (severity === 'ERROR') return <XCircle className="w-5 h-5 text-red-500" />;
    return <CheckCircle className="w-5 h-5 text-emerald-500" />;
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
          <p className="text-slate-400">Security events and policy decisions.</p>
        </div>
      </div>

      {loading && logs.length === 0 ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
          {logs.map((log) => (
            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-slate-900 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                {getIcon(log.severity)}
              </div>
              
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-700 bg-slate-800 shadow">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                    log.severity === 'WARNING' ? 'bg-amber-900/50 text-amber-400' :
                    log.severity === 'ERROR' ? 'bg-red-900/50 text-red-400' :
                    'bg-slate-700 text-slate-300'
                  }`}>
                    {log.event_type}
                  </span>
                  <time className="text-xs text-slate-500 font-mono">{new Date(log.created_at).toLocaleTimeString()}</time>
                </div>
                <div className="text-slate-300 text-sm">{log.message}</div>
                {log.metadata_json && (
                  <div className="mt-2 text-xs font-mono text-slate-500 bg-slate-900 p-2 rounded break-words">
                    {log.metadata_json}
                  </div>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-12 text-slate-500 italic relative z-10 bg-slate-900">
              No audit logs recorded yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

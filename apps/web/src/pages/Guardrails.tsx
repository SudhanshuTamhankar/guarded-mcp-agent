import { useState, useEffect } from 'react';
import { ShieldAlert, Activity } from 'lucide-react';
import { api } from '../api/client';

export default function Guardrails() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const data = await api.policy.getRules();
      setRules(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (id: string, currentEnabled: boolean) => {
    try {
      // Optimistic update
      setRules(rules.map(r => r.id === id ? { ...r, enabled: !currentEnabled } : r));
      await api.policy.toggleRule(id, !currentEnabled);
    } catch (err) {
      console.error(err);
      // Revert on error
      await fetchRules();
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Policy Guardrails</h1>
          <p className="text-slate-400">Manage real-time execution policies for the agent.</p>
        </div>
        <div className="bg-slate-800 px-4 py-2 rounded flex items-center gap-2 border border-slate-700">
          <Activity className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-medium text-slate-200">Engine Active</span>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-slate-800 border ${rule.enabled ? 'border-indigo-500/50' : 'border-slate-700/50'} p-5 rounded-xl flex items-center justify-between transition-colors`}>
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${rule.enabled ? 'bg-indigo-900/50' : 'bg-slate-700/50'}`}>
                  <ShieldAlert className={`w-6 h-6 ${rule.enabled ? 'text-indigo-400' : 'text-slate-500'}`} />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    {rule.name}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                      rule.type === 'BLOCK_TOOL' ? 'bg-red-900/50 text-red-400' :
                      rule.type === 'REQUIRE_APPROVAL' ? 'bg-amber-900/50 text-amber-400' :
                      'bg-blue-900/50 text-blue-400'
                    }`}>
                      {rule.type}
                    </span>
                  </h3>
                  <div className="text-sm text-slate-400 mt-1 font-mono">
                    Target: <span className="text-slate-300">{rule.server_id}__{rule.tool_name}</span>
                  </div>
                  {rule.config_json && rule.config_json !== '{}' && (
                    <div className="text-xs text-slate-500 mt-2 font-mono bg-slate-900 p-2 rounded">
                      {rule.config_json}
                    </div>
                  )}
                </div>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={rule.enabled}
                  onChange={() => toggleRule(rule.id, rule.enabled)}
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          ))}
          {rules.length === 0 && <div className="text-slate-500 italic text-center p-8">No policy rules found in database.</div>}
        </div>
      )}
    </div>
  );
}

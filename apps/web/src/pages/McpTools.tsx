import { useState, useEffect } from 'react';
import { Server, Wrench } from 'lucide-react';
import { api } from '../api/client';

export default function McpTools() {
  const [servers, setServers] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, toolsRes] = await Promise.all([
          api.mcp.getStatus(),
          api.mcp.getTools()
        ]);
        setServers(statusRes.servers || []);
        setTools(toolsRes.tools || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">MCP Integration</h1>
          <p className="text-slate-400">Live view of connected servers and discovered tools.</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-slate-800 rounded-xl"></div>
          <div className="h-64 bg-slate-800 rounded-xl"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Servers Section */}
          <section>
            <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" />
              Connected Servers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servers.map((s, i) => (
                <div key={i} className="bg-slate-800 border border-slate-700 p-5 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${s.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                    <div>
                      <h3 className="text-lg font-medium text-white">{s.id}</h3>
                      <p className="text-sm text-slate-400 capitalize">{s.type} Connection</p>
                    </div>
                  </div>
                </div>
              ))}
              {servers.length === 0 && <div className="text-slate-500 italic p-4 bg-slate-800/50 rounded-xl">No servers configured.</div>}
            </div>
          </section>

          {/* Tools Section */}
          <section>
            <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-emerald-400" />
              Discovered Tools
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((t, i) => {
                const toolIdentifier = t.exposedName || t.name || '';
                const [serverId, ...toolNameParts] = toolIdentifier.split('__');
                const toolName = toolNameParts.length > 0 ? toolNameParts.join('__') : toolIdentifier;
                return (
                  <div key={i} className="bg-slate-800/50 border border-slate-700/50 p-5 rounded-xl hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-indigo-900/50 text-indigo-300 text-xs rounded font-mono">{serverId}</span>
                      <span className="text-slate-200 font-medium truncate" title={toolName}>{toolName}</span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-3" title={t.description}>
                      {t.description || 'No description provided.'}
                    </p>
                  </div>
                );
              })}
              {tools.length === 0 && <div className="text-slate-500 italic p-4 bg-slate-800/50 rounded-xl col-span-full">No tools discovered.</div>}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

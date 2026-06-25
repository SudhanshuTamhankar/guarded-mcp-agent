import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ShieldAlert, Terminal, Wrench, CheckSquare, History } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api } from './api/client';
import ChatConsole from './pages/ChatConsole';
import McpTools from './pages/McpTools';
import Guardrails from './pages/Guardrails';
import Approvals from './pages/Approvals';
import AuditLogs from './pages/AuditLogs';

function App() {
  const [pendingCount, setPendingCount] = useState(0);
  const [globalConvId, setGlobalConvId] = useState<string | undefined>();

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const data = await api.approvals.getPending();
        setPendingCount(data.length);
      } catch (err) {
        console.error(err);
      }
    };
    
    // Clear all pending approvals on hard refresh (F5) to reset the demo state
    api.approvals.clearAll().catch(console.error).then(() => fetchPending());
    
    const interval = setInterval(fetchPending, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-900 text-slate-50">
        <nav className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-indigo-500" />
            <h1 className="font-bold text-lg">Guarded Agent</h1>
          </div>
          <div className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              <li>
                <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 transition-colors">
                  <Terminal className="w-5 h-5 text-slate-400" />
                  <span>Chat Console</span>
                </Link>
              </li>
              <li>
                <Link to="/mcp" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 transition-colors">
                  <Wrench className="w-5 h-5 text-slate-400" />
                  <span>MCP Tools</span>
                </Link>
              </li>
              <li>
                <Link to="/guardrails" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 transition-colors">
                  <ShieldAlert className="w-5 h-5 text-slate-400" />
                  <span>Guardrails</span>
                </Link>
              </li>
              <li>
                <Link to="/approvals" className="flex items-center justify-between px-3 py-2 rounded hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-5 h-5 text-slate-400" />
                    <span>Approval Queue</span>
                  </div>
                  {pendingCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link to="/logs" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-slate-800 transition-colors">
                  <History className="w-5 h-5 text-slate-400" />
                  <span>Audit Logs</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>
        <main className="flex-1 h-screen overflow-hidden bg-slate-950 relative">
          <Routes>
            <Route path="/" element={<ChatConsole globalConvId={globalConvId} setGlobalConvId={setGlobalConvId} />} />
            <Route path="/mcp" element={<div className="h-full overflow-y-auto"><McpTools /></div>} />
            <Route path="/guardrails" element={<div className="h-full overflow-y-auto"><Guardrails /></div>} />
            <Route path="/approvals" element={<div className="h-full overflow-y-auto"><Approvals /></div>} />
            <Route path="/logs" element={<div className="h-full overflow-y-auto"><AuditLogs /></div>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;

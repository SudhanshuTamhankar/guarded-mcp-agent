const API_URL = 'http://localhost:3001/api';

export const api = {
  chat: {
    send: async (message: string, conversationId?: string) => {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversationId })
      });
      return res.json();
    },
    getHistory: async (conversationId: string) => {
      const res = await fetch(`${API_URL}/chat/${conversationId}`);
      return res.json();
    }
  },
  mcp: {
    getStatus: async () => {
      const res = await fetch(`${API_URL}/mcp/status`);
      return res.json();
    },
    getTools: async () => {
      const res = await fetch(`${API_URL}/mcp/tools`);
      return res.json();
    }
  },
  policy: {
    getRules: async () => {
      const res = await fetch(`${API_URL}/policy/rules`);
      return res.json();
    },
    toggleRule: async (id: string, enabled: boolean) => {
      const res = await fetch(`${API_URL}/policy/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      return res.json();
    }
  },
  approvals: {
    getPending: async () => {
      const res = await fetch(`${API_URL}/approvals`);
      return res.json();
    },
    approve: async (id: string) => {
      const res = await fetch(`${API_URL}/approvals/${id}/approve`, { method: 'POST' });
      return res.json();
    },
    deny: async (id: string, reason: string) => {
      const res = await fetch(`${API_URL}/approvals/${id}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      return res.json();
    },
    clearAll: async () => {
      const res = await fetch(`${API_URL}/approvals`, { method: 'DELETE' });
      return res.json();
    }
  },
  logs: {
    getAuditLogs: async () => {
      const res = await fetch(`${API_URL}/logs`);
      return res.json();
    }
  }
};

// REST API client connected to backend with JWT authentication
// Supports real MongoDB backend and automatic offline fallback

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "/api";
const TOKEN_KEY = "bhoomi_token_v1";

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${endpoint}`;

  let res;
  try {
    res = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    console.warn(`[API] Network failure connecting to ${url}:`, netErr.message);
    const err = new Error("Unable to connect to backend server. Please verify backend is running on port 5000.");
    err.status = 0;
    err.data = {
      success: false,
      message: "Unable to connect to backend server. Please verify backend is running on port 5000.",
    };
    throw err;
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = {
      success: res.ok,
      message: res.statusText || `Request returned status ${res.status}`,
    };
  }

  if (!res.ok) {
    if (res.status === 401) {
      setToken(null);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("bhoomi:auth-expired", {
            detail: {
              code: data.code || "TOKEN_EXPIRED",
              message: data.message || "Your session has expired. Please log in again.",
            },
          })
        );
      }
    }
    const err = new Error(data.message || `Request failed with status ${res.status}`);
    err.status = res.status;
    err.code = data.code;
    err.data = data;
    throw err;
  }

  return data;
}

// ---------------------------------------------------------------------
// Generic REST resource helper
// ---------------------------------------------------------------------
function restResource(resourcePath) {
  return {
    async list(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") query.append(k, v);
      });
      const qs = query.toString() ? `?${query.toString()}` : "";
      const res = await request(`${resourcePath}${qs}`);
      return res.data || [];
    },
    async get(id) {
      const res = await request(`${resourcePath}/${encodeURIComponent(id)}`);
      return res.data;
    },
    async create(data) {
      const res = await request(resourcePath, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.data;
    },
    async update(id, patch) {
      const res = await request(`${resourcePath}/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(patch),
      });
      return res.data;
    },
    async remove(id) {
      const res = await request(`${resourcePath}/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return res.data;
    },
  };
}

export const api = {
  // ---- Auth ----
  async login({ email, password, role }) {
    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role }),
    });
    if (res.token) setToken(res.token);
    return res.user;
  },

  async register(data) {
    const res = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.token) setToken(res.token);
    return res.user;
  },

  async googleLogin({ credential, email, name, googleId, role }) {
    const res = await request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential, email, name, googleId, role }),
    });
    if (res.token) setToken(res.token);
    return res.user;
  },

  async getGoogleAuthUrl({ role = "citizen", redirect = "/app/dashboard" } = {}) {
    return request(`/auth/google/url?role=${encodeURIComponent(role)}&redirect=${encodeURIComponent(redirect)}`);
  },

  async exchangeGoogleCode({ code, state, redirect_uri }) {
    const res = await request("/auth/google/exchange", {
      method: "POST",
      body: JSON.stringify({ code, state, redirect_uri }),
    });
    if (res.token) setToken(res.token);
    return res;
  },

  async completeGoogleRegistration(data) {
    const res = await request("/auth/google/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.token) setToken(res.token);
    return res.user;
  },

  async getMe() {
    const res = await request("/auth/me");
    return res.user;
  },

  async updateProfile(id, patch) {
    const res = await request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(patch),
    });
    return res.user;
  },

  async logout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    } finally {
      setToken(null);
    }
  },

  // ---- Entities ----
  properties: {
    ...restResource("/properties"),
    async getRecentlyViewed() {
      try {
        const res = await request("/properties/recently-viewed");
        return res.data || [];
      } catch {
        return [];
      }
    },
  },

  landParcels: restResource("/land-parcels"),

  registrations: {
    ...restResource("/registrations"),
  },

  surveyor: {
    async getQueue() {
      const res = await request("/surveyor/queue");
      return res.data || [];
    },
    async verifyBoundary(id, { boundaryVerified, remarks, surveyNo }) {
      const res = await request(`/surveyor/verify/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify({ boundaryVerified, remarks, surveyNo }),
      });
      return res.data;
    },
  },

  registrar: {
    async getQueue() {
      const res = await request("/registrar/queue");
      return res.data || [];
    },
    async approve(id, { remarks, office } = {}) {
      const res = await request(`/registrar/approve/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify({ remarks, office }),
      });
      return res.data;
    },
    async reject(id, { remarks } = {}) {
      const res = await request(`/registrar/reject/${encodeURIComponent(id)}`, {
        method: "POST",
        body: JSON.stringify({ remarks }),
      });
      return res.data;
    },
  },

  deeds: {
    ...restResource("/deeds"),
    async getByNumber(deedNumber) {
      const res = await request(`/deeds/${encodeURIComponent(deedNumber)}`);
      return res.data;
    },
    async verifyPublic(deedNumber) {
      const res = await request(`/deeds/verify/${encodeURIComponent(deedNumber)}`);
      return res;
    },
    async updateStatus(deedNumber, { status, remarks }) {
      const res = await request(`/deeds/${encodeURIComponent(deedNumber)}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, remarks }),
      });
      return res.data;
    },
    getPdfDownloadUrl(deedNumber) {
      return `/api/deeds/${encodeURIComponent(deedNumber)}/pdf`;
    },
  },

  transfers: {
    ...restResource("/transfers"),
    async approve(id, { remarks } = {}) {
      return request(`/transfers/${encodeURIComponent(id)}/approve`, {
        method: "POST",
        body: JSON.stringify({ remarks }),
      });
    },
    async reject(id, { remarks } = {}) {
      return request(`/transfers/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        body: JSON.stringify({ remarks }),
      });
    },
  },
  documents: restResource("/documents"),
  payments: restResource("/payments"),
  appointments: restResource("/appointments"),

  notifications: {
    ...restResource("/notifications"),
    async getHistory(params = {}) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") query.append(k, v);
      });
      const qs = query.toString() ? `?${query.toString()}` : "";
      return request(`/notifications${qs}`);
    },
    async markAsRead(id) {
      return request(`/notifications/${encodeURIComponent(id)}/read`, { method: "PUT" });
    },
    async markAllRead() {
      return request("/notifications/read-all", { method: "PUT" });
    },
    async retry(id) {
      return request(`/notifications/${encodeURIComponent(id)}/retry`, { method: "POST" });
    },
  },

  users: {
    ...restResource("/users"),
    async updateRole(id, role, isActive) {
      return request(`/users/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify({ role, isActive }),
      });
    },
  },

  // ---- Stats & Tracking ----
  async stats() {
    try {
      const res = await request("/stats");
      return res.data;
    } catch {
      return {
        properties: 0,
        registrations: 0,
        pendingRegistrations: 0,
        transfers: 0,
        payments: 0,
        duePayments: 0,
        appointments: 0,
        documents: 0,
        pendingDocuments: 0,
        users: 0,
        deeds: 0,
      };
    }
  },

  async trackApplication(ref) {
    const res = await request(`/registrations/track/${encodeURIComponent(ref.trim())}`);
    return res;
  },

  // ---- Chatbot ----
  async askChatbot(message) {
    const res = await request("/chatbot/message", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
    return res;
  },
};

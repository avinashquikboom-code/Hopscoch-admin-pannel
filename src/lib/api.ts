/**
 * Shared API utility for admin panel.
 * All API calls use this helper — never hardcode data in pages.
 */

//  export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.fciseller.com';
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.100:5001';
export const APP_TYPE = 'admin'; // Admin panel specific app type

/**
 * Normalizes image URLs for display across the admin panel.
 * Handles relative paths, double slashes, blob URLs, and overrides stale local IP hostnames.
 */
export function getImageUrl(url?: any): string {
  if (!url) return '';

  // 1. Handle object/array inputs (e.g. { url: '...' }, { imageUrl: '...' }, ['...'])
  if (typeof url === 'object') {
    if (Array.isArray(url)) {
      url = url[0];
    } else {
      url = url.url || url.imageUrl || url.image_url || url.path || url.src || '';
    }
    if (!url) return '';
  }

  if (typeof url !== 'string') return '';

  url = url.trim();
  if (!url) return '';

  // 2. Handle JSON strings (e.g. '["/uploads/123.jpg"]' or '{"url":"/uploads/123.jpg"}')
  if (url.startsWith('[') || url.startsWith('{')) {
    try {
      const parsed = JSON.parse(url);
      return getImageUrl(parsed);
    } catch {
      // Not valid JSON, continue normal string parsing
    }
  }

  // 3. Strip escaped wrapping quotes (e.g. '"/uploads/123.jpg"')
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }

  // 4. Local file previews (blob URLs / base64 data URIs)
  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }

  // 5. If full HTTP/HTTPS URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsed = new URL(url);

      const isBrowserLocalhost = typeof window !== 'undefined' && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );

      // Only rewrite localhost/local IP URLs to API_BASE if the frontend is running in production (not on localhost)
      if (
        !isBrowserLocalhost &&
        (
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname.startsWith('192.168.') ||
          parsed.hostname.startsWith('10.') ||
          parsed.hostname.startsWith('172.')
        )
      ) {
        const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
        const path = parsed.pathname.startsWith('/') ? parsed.pathname : `/${parsed.pathname}`;
        return `${cleanBase}${path}${parsed.search}`;
      }

      // Upgrade HTTP to HTTPS if site is served over HTTPS (unless it's localhost)
      if (
        typeof window !== 'undefined' &&
        window.location.protocol === 'https:' &&
        parsed.protocol === 'http:' &&
        !parsed.hostname.includes('localhost') &&
        !parsed.hostname.includes('127.0.0.1')
      ) {
        return url.replace(/^http:\/\//, 'https://');
      }

      return url;
    } catch {
      return url;
    }
  }

  // 6. Relative path cleanup
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  const cleanBase = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  return `${cleanBase}${cleanPath}`;
}



function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

function getApiKey(): string {
  return process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';
}

export function authHeaders(): HeadersInit {
  const token = getToken();
  const apiKey = getApiKey();
  return {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey,
    'X-App-Type': APP_TYPE,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...authHeaders(), ...(options.headers || {}) },
    });
  } catch {
    // fetch only rejects on network-level failures (server down, DNS, CORS)
    throw new Error('Cannot reach the server. Please check your connection and try again.');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON body (proxy error page, empty response) — fall through to status handling
  }

  if (res.status === 401 && typeof window !== 'undefined' && !path.startsWith('/api/auth/')) {
    // Session expired — clear stale token and send the user back to login
    localStorage.removeItem('auth_token');
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    throw new Error(data?.message || `Request failed: ${res.status}`);
  }

  return data as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const api = {
  // Dashboard
  dashboard: {
    getStats: () => apiRequest<any>('/api/admin/dashboard'),
  },

  // Profile
  profile: {
    get: () => apiRequest<any>('/api/admin/profile'),
    update: (body: Record<string, any>) =>
      apiRequest<any>('/api/admin/profile', { method: 'PUT', body: JSON.stringify(body) }),
  },

  // Orders — admin endpoints (see /api/admin/orders)
  orders: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/admin/orders${qs}`);
    },
    getById: (id: string | number) => apiRequest<any>(`/api/admin/orders/${id}`),
    updateStatus: (id: string | number, status: string) =>
      apiRequest<any>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    getTimeline: (id: string | number) => apiRequest<any>(`/api/admin/orders/${id}/timeline`),
    cancel: (id: string | number) =>
      apiRequest<any>(`/api/admin/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'CANCELLED' }) }),
  },

  // Products
  products: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/products${qs}`);
    },
    getById: (id: string) => apiRequest<any>(`/api/products/${id}`),
  },

  // Categories
  categories: {
    getAll: () => apiRequest<any>('/api/categories'),
    getById: (id: string) => apiRequest<any>(`/api/categories/${id}`),
  },

  // Collections
  collections: {
    getAll: () => apiRequest<any>('/api/collections'),
    create: (body: Record<string, any>) =>
      apiRequest<any>('/api/collections', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, any>) =>
      apiRequest<any>(`/api/collections/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      apiRequest<any>(`/api/collections/${id}`, { method: 'DELETE' }),
  },

  // Inventory
  inventory: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/inventory${qs}`);
    },
    getLowStock: () => apiRequest<any>('/api/inventory/alerts/low-stock'),
    getMovements: () => apiRequest<any>('/api/inventory/movements'),
    updateThreshold: (body: Record<string, any>) =>
      apiRequest<any>('/api/inventory/threshold', { method: 'PATCH', body: JSON.stringify(body) }),
    createMovement: (body: Record<string, any>) =>
      apiRequest<any>('/api/inventory/movements', { method: 'POST', body: JSON.stringify(body) }),
  },

  // Customers
  customers: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/users${qs}`);
    },
    getById: (id: string) => apiRequest<any>(`/api/users/${id}`),
  },

  // Returns
  returns: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/returns${qs}`);
    },
    getById: (id: string) => apiRequest<any>(`/api/returns/${id}`),
    updateStatus: (id: string, status: string) =>
      apiRequest<any>(`/api/returns/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  },

  // Reviews
  reviews: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/reviews${qs}`);
    },
    approve: (id: string) =>
      apiRequest<any>(`/api/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'approved' }) }),
    reject: (id: string) =>
      apiRequest<any>(`/api/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'reported' }) }),
  },

  // Coupons
  coupons: {
    getAll: () => apiRequest<any>('/api/coupons'),
    create: (body: Record<string, any>) =>
      apiRequest<any>('/api/coupons', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Record<string, any>) =>
      apiRequest<any>(`/api/coupons/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) =>
      apiRequest<any>(`/api/coupons/${id}`, { method: 'DELETE' }),
  },

  // Payments
  payments: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/payments${qs}`);
    },
    refunds: {
      getAll: () => apiRequest<any>('/api/payments/refunds'),
    },
  },

  // Reports
  reports: {
    getSales: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/reports/sales${qs}`);
    },
    getInventory: () => apiRequest<any>('/api/reports/inventory'),
    getCustomers: () => apiRequest<any>('/api/reports/customers'),
    getOrders: () => apiRequest<any>('/api/reports/orders'),
    getDashboard: () => apiRequest<any>('/api/reports/dashboard'),
  },

  // Shipping
  shipping: {
    getAll: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return apiRequest<any>(`/api/shipments/admin/all${qs}`);
    },
  },

  // Settings
  settings: {
    get: () => apiRequest<any>('/api/settings'),
    update: (body: Record<string, any>) =>
      apiRequest<any>('/api/settings', { method: 'PUT', body: JSON.stringify(body) }),
    getCountryInfo: (countryCode: string) =>
      apiRequest<any>(`/api/settings/country-info/${countryCode}`),
  },

  // Notifications
  notifications: {
    getAll: () => apiRequest<any>('/api/notifications'),
    send: (id: string) =>
      apiRequest<any>(`/api/notifications/${id}/send`, { method: 'POST' }),
    delete: (id: string) =>
      apiRequest<any>(`/api/notifications/${id}`, { method: 'DELETE' }),
  },

  // Activity logs
  activityLogs: {
    getAll: () => apiRequest<any>('/api/admin/activity-logs'),
  },
};

export default api;

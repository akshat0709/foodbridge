const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '');

export const TOKEN_STORAGE_KEY = 'foodbridge_token';
/** Dispatched on window when the API rejects the session (401); AuthContext signs out. */
export const AUTH_EXPIRED_EVENT = 'foodbridge:auth-expired';

function notifyIfUnauthorized(response: Response, endpoint: string) {
  // A 401 from /auth/login just means wrong credentials, not an expired session.
  if (response.status === 401 && !endpoint.startsWith('/auth/login')) {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
  }
}

/** Resolves '/api/...' paths against VITE_API_BASE so downloads hit the same backend as apiRequest. */
export function resolveApiUrl(url: string): string {
  if (url.startsWith('/api/') || url === '/api') {
    return `${API_BASE}${url.slice(4)}`;
  }
  return url;
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function errorFromResponse(response: Response, data: any): Error {
  const apiError = data?.error;
  const errorMsg =
    (typeof apiError === 'string' ? apiError : apiError?.message) ||
    `Request failed with status ${response.status}`;
  const err: any = new Error(errorMsg);
  err.code = typeof apiError === 'string' ? apiError : apiError?.code;
  err.details = apiError?.details;
  err.status = response.status;
  return err;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers as any || {}),
  };

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    // fetch only rejects when the server is unreachable (offline, wrong URL, CORS block)
    console.error(`[API] Network error calling ${API_BASE}${endpoint}:`, networkErr);
    const err: any = new Error('Cannot reach the FoodBridge API server. Check that the backend is running.');
    err.code = 'NETWORK_ERROR';
    err.status = 0;
    throw err;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    notifyIfUnauthorized(response, endpoint);
    throw errorFromResponse(response, data);
  }

  return data?.data !== undefined ? data.data : data;
}

/** Downloads a file from the API, throwing a meaningful error instead of saving an error body. */
export async function downloadFile(url: string, filename: string): Promise<void> {
  const response = await fetch(resolveApiUrl(url), { headers: authHeaders() });
  if (!response.ok) {
    notifyIfUnauthorized(response, url);
    const data = await response.json().catch(() => null);
    throw errorFromResponse(response, data);
  }
  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
}

export function exportCsv(url: string, filename: string) {
  downloadFile(url, filename).catch(err => {
    console.error('[API] Export failed:', err);
    window.alert(`Export failed: ${err.message}`);
  });
}

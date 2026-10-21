const configuredApiUrl = import.meta.env.VITE_API_URL;
const BASE_URL = configuredApiUrl || 'http://localhost:5000/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('vmcare_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data.message || `Request failed with status ${res.status}`);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If network error (offline)
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const isDeployed = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
      const guidance = isDeployed && !configuredApiUrl
        ? 'The deployed app has no VITE_API_URL. Set it to your API project URL ending in /api, then redeploy.'
        : 'Device is offline or the VMcare API is unreachable.';
      const netError = new Error(guidance);
      netError.isOffline = true;
      throw netError;
    }
    throw error;
  }
}

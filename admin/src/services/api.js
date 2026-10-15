const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

let accessToken = localStorage.getItem('ruralcare_token') || '';

export function setToken(token) {
  accessToken = token;
  localStorage.setItem('ruralcare_token', token);
}

export function logout() {
  accessToken = '';
  localStorage.removeItem('ruralcare_token');
  localStorage.removeItem('ruralcare_refresh');
}

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...(options.headers || {})
    },
    body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export async function login(email, password) {
  const data = await api('/auth/login', { method: 'POST', body: { email, password } });
  setToken(data.accessToken);
  localStorage.setItem('ruralcare_refresh', data.refreshToken);
  return data.user;
}

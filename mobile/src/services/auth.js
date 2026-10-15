import { setSetting, getSetting } from '../storage/db';
import { getApiUrl } from './sync';

export async function login(email, password) {
  const baseUrl = await getApiUrl();
  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Login failed');
  await setSetting('accessToken', data.accessToken);
  await setSetting('user', JSON.stringify(data.user));
  return data.user;
}

export async function logout() {
  await setSetting('accessToken', '');
  await setSetting('user', '');
}

export async function getToken() {
  return getSetting('accessToken');
}

export async function getCurrentUser() {
  const raw = await getSetting('user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

import { apiRequest } from './api';

export async function getNearbyFacilities({ lat, lng, radius = 10000 }) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) });
  const response = await apiRequest(`/clinics/nearby?${params}`);
  return response.facilities || [];
}

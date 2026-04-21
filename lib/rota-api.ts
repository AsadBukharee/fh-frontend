import API_URL from "@/app/utils/ENV";

export async function getContracts(token: string) {
  const response = await fetch(`${API_URL}/api/staff/contracts/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
}

export async function getDrivers(token: string) {
  const response = await fetch(`${API_URL}/api/profiles/list-names/?type=driver`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.data || [];
}

export async function getShifts(token: string, userId: string) {
  const response = await fetch(`${API_URL}/api/staff/shifts/?user_id=${userId}&scope=contract`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];
  const data = await response.json();
  return Array.isArray(data) ? data : data.data || [];
}

export async function getReportingData(params: URLSearchParams, token: string) {
  const response = await fetch(`${API_URL}/api/rota/child-rota/reporting/?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;
  return await response.json();
}

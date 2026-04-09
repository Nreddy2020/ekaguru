import { ParentAnalytics } from '../types/analytics';

const BASE = '/api/analytics';

export async function fetchStudentSummary(studentId: string): Promise<ParentAnalytics> {
  const res = await fetch(`${BASE}/summary/${encodeURIComponent(studentId)}`);
  if (!res.ok) throw new Error(`Failed to fetch analytics: ${res.status}`);
  const data = await res.json();
  return data as ParentAnalytics;
}

export default { fetchStudentSummary };

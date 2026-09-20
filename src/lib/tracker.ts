import { supabase } from './supabase';
import { detectDeviceInfo } from './deviceDetector';

let hasTrackedCurrentSession = false;

export async function logDeviceVisit(page = '/', userEmail?: string | null) {
  if (hasTrackedCurrentSession) return;
  hasTrackedCurrentSession = true;

  setTimeout(() => {
    hasTrackedCurrentSession = false;
  }, 20000);

  try {
    const info = await detectDeviceInfo(page, userEmail);

    // 1. Send to serverless tracking endpoint (stores in Supabase site_visits automatically)
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    }).catch(() => {});

    // 2. Fallback to SQL table if it exists
    try {
      await supabase.from('site_visits').insert([info]);
    } catch {
      // ignore
    }
  } catch {
    // Non-blocking
  }
}

export async function fetchDeviceVisits(limit = 50): Promise<any[]> {
  try {
    // 1. Fetch from serverless visits endpoint (which uses service_role key to retrieve logs)
    const res = await fetch('/api/visits');
    if (res.ok) {
      const data = await res.json();
      if (data.visits && data.visits.length > 0) {
        return data.visits.slice(0, limit);
      }
    }

    // 2. Fallback to SQL table if configured
    const { data: tableData, error: tableError } = await supabase
      .from('site_visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!tableError && tableData && tableData.length > 0) {
      return tableData;
    }

    return [];
  } catch (err) {
    console.error('Error in fetchDeviceVisits:', err);
    return [];
  }
}

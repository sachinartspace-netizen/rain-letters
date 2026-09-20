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

    // 1. Send to serverless tracking endpoint (stores in Supabase site_visits bucket automatically)
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    }).catch(() => {});

    // 2. Fallback attempt to SQL table if it exists
    try {
      await supabase.from('site_visits').insert([info]);
    } catch {
      // ignore
    }
  } catch {
    // Non-blocking
  }
}

export async function fetchDeviceVisits(limit = 30): Promise<any[]> {
  try {
    // 1. Try fetching from SQL table first
    const { data: tableData, error: tableError } = await supabase
      .from('site_visits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!tableError && tableData && tableData.length > 0) {
      return tableData;
    }

    // 2. Fetch from Supabase Storage bucket (auto-created with zero setup)
    const { data: fileList, error: listError } = await supabase.storage
      .from('site_visits')
      .list('', {
        limit,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (listError || !fileList) {
      return [];
    }

    // Filter only json files
    const jsonFiles = fileList.filter((f) => f.name.endsWith('.json'));

    const visits = await Promise.all(
      jsonFiles.slice(0, limit).map(async (file) => {
        try {
          const publicUrl = `https://wdjfcqdclqnnojjzqyao.supabase.co/storage/v1/object/public/site_visits/${file.name}`;
          const res = await fetch(publicUrl);
          if (res.ok) {
            return await res.json();
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    return visits.filter(Boolean);
  } catch (err) {
    console.error('Error in fetchDeviceVisits:', err);
    return [];
  }
}

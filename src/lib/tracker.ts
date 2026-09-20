import { supabase } from './supabase';
import { detectDeviceInfo, DeviceVisitData } from './deviceDetector';

let hasTrackedCurrentSession = false;

export async function logDeviceVisit(page = '/', userEmail?: string | null) {
  // Prevent duplicate logs in the exact same tab session within 30 seconds
  if (hasTrackedCurrentSession) return;
  hasTrackedCurrentSession = true;

  setTimeout(() => {
    hasTrackedCurrentSession = false;
  }, 30000);

  try {
    const info = await detectDeviceInfo(page, userEmail);

    // Save into Supabase site_visits table
    const { error } = await supabase.from('site_visits').insert([
      {
        device_brand: info.device_brand,
        device_model: info.device_model,
        os: info.os,
        browser: info.browser,
        screen_size: info.screen_size,
        language: info.language,
        page_visited: info.page_visited,
        user_email: info.user_email,
        city: info.city || null,
        country: info.country || null,
      },
    ]);

    if (error) {
      console.warn('Visit log note:', error.message);
    }
  } catch (err) {
    // Non-blocking
  }
}

export async function fetchDeviceVisits(limit = 100) {
  const { data, error } = await supabase
    .from('site_visits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching device visits:', error);
    return [];
  }
  return data || [];
}

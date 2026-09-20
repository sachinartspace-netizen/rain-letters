import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wdjfcqdclqnnojjzqyao.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkamZjcWRjbHFubm9qanpxeWFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3ODI3OSwiZXhwIjoyMTAzODU0Mjc5fQ.Dy_iISoODXAHvD6k7c2ghxnFWLvwp7JBWXouf_TpjQo';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    const city = req.headers['x-vercel-ip-city'] || body.city || '';
    const country = req.headers['x-vercel-ip-country'] || body.country || '';
    const ua = req.headers['user-agent'] || '';

    const visitData = {
      id: `visit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      device_brand: body.device_brand || 'Unknown',
      device_model: body.device_model || 'Generic Device',
      os: body.os || 'Unknown OS',
      browser: body.browser || 'Unknown Browser',
      screen_size: body.screen_size || '',
      page_visited: body.page_visited || '/',
      user_email: body.user_email || null,
      city: decodeURIComponent(city),
      country: country,
      ip: typeof ip === 'string' ? ip.split(',')[0].trim() : '',
      user_agent: ua,
    };

    const fileName = `${visitData.id}.json`;
    const fileContent = JSON.stringify(visitData);

    const { error } = await supabaseAdmin.storage
      .from('site_visits')
      .upload(fileName, fileContent, {
        contentType: 'application/json',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, visitId: visitData.id });
  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
}

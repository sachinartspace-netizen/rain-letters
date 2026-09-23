import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wdjfcqdclqnnojjzqyao.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkamZjcWRjbHFubm9qanpxeWFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3ODI3OSwiZXhwIjoyMTAzODU0Mjc5fQ.Dy_iISoODXAHvD6k7c2ghxnFWLvwp7JBWXouf_TpjQo';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { data: fileList, error: listError } = await supabaseAdmin.storage
      .from('site_visits')
      .list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'desc' },
      });

    if (listError || !fileList) {
      return res.status(200).json({ visits: [] });
    }

    const jsonFiles = fileList.filter((f) => f.name.endsWith('.json'));

    const visits = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const download = await supabaseAdmin.storage
            .from('site_visits')
            .download(file.name);

          if (download.data) {
            const text = await download.data.text();
            return JSON.parse(text);
          }
          return null;
        } catch {
          return null;
        }
      })
    );

    const validVisits = visits.filter(Boolean);
    validVisits.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return res.status(200).json({ visits: validVisits });
  } catch (err) {
    console.error('Visits API error:', err);
    return res.status(500).json({ error: err.message });
  }
}

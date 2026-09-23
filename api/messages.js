import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wdjfcqdclqnnojjzqyao.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkamZjcWRjbHFubm9qanpxeWFvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODI3ODI3OSwiZXhwIjoyMTAzODU0Mjc5fQ.Dy_iISoODXAHvD6k7c2ghxnFWLvwp7JBWXouf_TpjQo';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const FILE_NAME = 'messages.json';
const BUCKET = 'chat_data';

async function getStoredMessages() {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(FILE_NAME);

    if (error || !data) {
      return [];
    }
    const text = await data.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveStoredMessages(messages) {
  const content = JSON.stringify(messages);
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(FILE_NAME, content, {
      contentType: 'application/json',
      cacheControl: '0',
      upsert: true,
    });
  if (error) {
    throw error;
  }
}

export default async function handler(req, res) {
  // CORS & No-cache headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: Fetch all unified messages
  if (req.method === 'GET') {
    try {
      const messages = await getStoredMessages();
      return res.status(200).json({ messages });
    } catch (err) {
      console.error('GET messages error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST: Add new message OR batch sync messages
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const existing = await getStoredMessages();

      const msgMap = new Map();
      for (const m of existing) {
        if (m && m.id) msgMap.set(m.id, m);
      }

      // Handle single message or array of messages
      const incomingList = Array.isArray(body.messages)
        ? body.messages
        : body.message
        ? [body.message]
        : body.id
        ? [body]
        : [];

      for (const item of incomingList) {
        if (item && item.id && item.message) {
          msgMap.set(item.id, {
            id: String(item.id),
            created_at: item.created_at || new Date().toISOString(),
            sender_id: String(item.sender_id || ''),
            sender_email: String(item.sender_email || ''),
            sender_name: String(item.sender_name || 'User'),
            message: String(item.message),
          });
        }
      }

      // Sort by created_at ascending
      const merged = Array.from(msgMap.values()).sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      await saveStoredMessages(merged);
      return res.status(200).json({ success: true, messages: merged });
    } catch (err) {
      console.error('Error saving messages:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

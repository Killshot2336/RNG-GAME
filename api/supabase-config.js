/**
 * Safe client config — anon key only. Service role stays server-side.
 */
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return res.status(503).json({
      error: 'Supabase not configured.',
      hint: 'Set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel env.',
    });
  }

  return res.status(200).json({ url, anonKey });
}

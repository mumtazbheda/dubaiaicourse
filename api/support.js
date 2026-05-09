const { createClient } = require('@supabase/supabase-js');

async function readBody(req) {
  let body = '';
  for await (const chunk of req) body += chunk;
  return body;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let parsed;
  try {
    const raw = await readBody(req);
    parsed = JSON.parse(raw);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const name = String(parsed?.name || '').trim();
  const email = String(parsed?.email || '').trim().toLowerCase();
  const message = String(parsed?.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (message.length > 2000 || name.length > 200 || email.length > 200) {
    return res.status(400).json({ error: 'Field too long' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from('support_messages').insert({
    name: name.slice(0, 200),
    email: email.slice(0, 200),
    message: message.slice(0, 2000),
    user_agent: (req.headers['user-agent'] || '').slice(0, 500),
  });

  if (error) {
    console.error('Support insert error:', error);
    return res.status(500).json({ error: 'Could not save message' });
  }

  res.status(200).json({ ok: true });
};

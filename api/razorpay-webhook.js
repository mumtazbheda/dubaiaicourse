const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let rawBody;
  try {
    rawBody = await readRawBody(req);
  } catch {
    return res.status(400).json({ error: 'Could not read body' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: 'Webhook secret not configured' });
  if (!signature) return res.status(400).json({ error: 'Missing signature header' });

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  if (
    expected.length !== signature.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  ) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const event = payload.event;
  const captured =
    event === 'payment.captured' ||
    event === 'payment_link.paid' ||
    event === 'order.paid';

  if (!captured) {
    return res.status(200).json({ ok: true, ignored: event });
  }

  const paymentEntity =
    payload?.payload?.payment?.entity ||
    payload?.payload?.order?.entity ||
    {};

  const email = (paymentEntity.email || paymentEntity.customer_email || '').trim().toLowerCase();
  const phone = paymentEntity.contact || paymentEntity.customer_contact || null;
  const fullName = paymentEntity.notes?.name || paymentEntity.customer_name || null;
  const paymentId = paymentEntity.id || paymentEntity.payment_id || null;
  const orderId = paymentEntity.order_id || paymentEntity.id || null;
  const amount = paymentEntity.amount || null;
  const currency = paymentEntity.currency || 'AED';

  if (!email) {
    return res.status(400).json({ error: 'No email in payment payload' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from('registrations').upsert(
    {
      email,
      full_name: fullName,
      phone,
      paid: true,
      amount,
      currency,
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      paid_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );

  if (error) {
    console.error('Supabase upsert error:', error);
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ ok: true });
};

handler.config = { api: { bodyParser: false } };
module.exports = handler;

const { createClient } = require('@supabase/supabase-js');

const TOTAL_SEATS = 50;
const BASELINE_TAKEN = 27;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');

  let paidCount = 0;
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { count, error } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('paid', true);
    if (!error && typeof count === 'number') paidCount = count;
  } catch (err) {
    console.error('Seats count error:', err);
  }

  const taken = Math.min(TOTAL_SEATS, BASELINE_TAKEN + paidCount);
  const remaining = Math.max(0, TOTAL_SEATS - taken);
  const percent = Math.round((taken / TOTAL_SEATS) * 100);

  res.status(200).json({ taken, total: TOTAL_SEATS, remaining, percent });
};

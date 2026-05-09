import { getConfig } from './app.js';
import { openAuthModal } from './auth.js';

export async function wireCheckoutButtons() {
  let cfg;
  try {
    cfg = await getConfig();
  } catch {
    cfg = {};
  }
  const payUrl = cfg.razorpayPaymentPageUrl;

  document.querySelectorAll(
    'a[href="https://buy.stripe.com/REPLACE_ME"], a[href="https://pages.razorpay.com/REPLACE_ME"], [data-razorpay-pay]'
  ).forEach((el) => {
    if (payUrl) {
      el.setAttribute('href', payUrl);
      el.setAttribute('rel', 'noopener');
    } else {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        alert('Payments are not configured yet. Set RAZORPAY_PAYMENT_PAGE_URL in Vercel.');
      });
    }
  });

  if (new URLSearchParams(window.location.search).has('paid')) {
    showPaidToast();
    setTimeout(() => openAuthModal(null, {
      title: 'You’re in. Now claim your seat.',
      subtitle: 'Sign in with the email you just paid with to unlock the prompt vault and WhatsApp community.',
    }), 600);
    history.replaceState(null, '', window.location.pathname);
  }
}

function showPaidToast() {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[70] rounded-full bg-good text-ink font-semibold px-5 py-3 shadow-card text-[14px]';
  toast.textContent = 'Payment received. See you Sunday May 16.';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 8000);
}

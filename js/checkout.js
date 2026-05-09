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

  // Footer "Already paid? Sign in" trigger
  document.querySelectorAll('[data-signin-trigger]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      openAuthModal(null, {
        title: 'Already paid? Sign in',
        subtitle: 'Enter the email you used at checkout — we\'ll send you a magic link.',
      });
    });
  });

  const params = new URLSearchParams(window.location.search);
  if (params.has('paid')) {
    showToast(
      'Payment received ✅',
      "We've sent an access link to the email you just paid with. Check your inbox (and spam) — clicking it unlocks your seat."
    );
    history.replaceState(null, '', window.location.pathname);
  } else if (params.has('welcome')) {
    showToast(
      "You're in 🎉",
      "Bookmark this page. We'll send Sunday's Zoom link to your email 24 hours before the workshop."
    );
    history.replaceState(null, '', window.location.pathname);
  }
}

function showToast(title, body) {
  const toast = document.createElement('div');
  toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 z-[70] rounded-2xl bg-good text-ink px-5 py-4 shadow-card text-[14px] max-w-sm w-[calc(100%-2rem)] text-center';
  toast.innerHTML = `<div class="font-bold">${title}</div><div class="mt-1 font-normal text-[13px] leading-snug">${body}</div>`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 500);
  }, 12000);
}

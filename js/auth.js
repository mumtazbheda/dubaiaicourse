import { getSupabase } from './app.js';

const modalHTML = `
<div id="auth-modal" class="fixed inset-0 z-[60] hidden items-center justify-center bg-black/70 backdrop-blur p-4">
  <div class="w-full max-w-md rounded-2xl border border-line2 bg-ink2 p-6 shadow-card">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h3 id="auth-title" class="display text-[22px] font-bold">Create your account</h3>
        <p id="auth-subtitle" class="text-mute text-[13px] mt-1">Sign up to reserve your seat for May 16.</p>
      </div>
      <button id="auth-close" class="text-mute hover:text-paper text-2xl leading-none" aria-label="Close">&times;</button>
    </div>

    <div id="auth-tabs" class="mt-5 grid grid-cols-2 gap-2 text-[12px] font-semibold uppercase tracking-wider">
      <button data-tab="signup" type="button" class="rounded-full py-2 transition">Sign up</button>
      <button data-tab="signin" type="button" class="rounded-full py-2 transition">Sign in</button>
    </div>

    <div class="mt-5 grid grid-cols-1 gap-2">
      <button id="auth-google" type="button" class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-white text-ink py-3 font-semibold text-[14px] hover:bg-paper transition">
        <svg viewBox="0 0 24 24" class="h-4 w-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.07 5.07 0 0 1-2.2 3.32v2.77h3.56c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.56-2.77c-.99.67-2.26 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.45.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.95l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
        Continue with Google
      </button>
      <button id="auth-apple" type="button" class="w-full inline-flex items-center justify-center gap-2 rounded-full bg-black text-white py-3 font-semibold text-[14px] border border-white/10 hover:bg-neutral-900 transition">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
        Continue with Apple
      </button>
    </div>

    <div class="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-mute">
      <span class="h-px flex-1 bg-line"></span>or<span class="h-px flex-1 bg-line"></span>
    </div>

    <form id="auth-form" class="space-y-3">
      <div id="auth-name-row">
        <label class="block text-[11px] uppercase tracking-wider text-mute mb-1.5" for="auth-name">Full name</label>
        <input id="auth-name" type="text" autocomplete="name" class="w-full rounded-xl border border-line2 bg-ink px-4 py-3 text-paper outline-none focus:border-orange" placeholder="Your name">
      </div>
      <div>
        <label class="block text-[11px] uppercase tracking-wider text-mute mb-1.5" for="auth-email">Email</label>
        <input id="auth-email" type="email" autocomplete="email" required class="w-full rounded-xl border border-line2 bg-ink px-4 py-3 text-paper outline-none focus:border-orange" placeholder="you@example.com">
      </div>
      <div id="auth-password-row">
        <label class="block text-[11px] uppercase tracking-wider text-mute mb-1.5" for="auth-password">Password</label>
        <input id="auth-password" type="password" autocomplete="current-password" minlength="6" class="w-full rounded-xl border border-line2 bg-ink px-4 py-3 text-paper outline-none focus:border-orange" placeholder="At least 6 characters">
        <label class="mt-2 inline-flex items-center gap-2 text-[12px] text-mute cursor-pointer">
          <input id="auth-magic" type="checkbox" class="accent-orange"> Email me a magic link instead
        </label>
      </div>
      <button id="auth-submit" type="submit" class="cta w-full rounded-full px-6 py-3.5 text-[14px] font-bold uppercase tracking-wider text-white">Sign up</button>
      <p id="auth-error" class="hidden text-[13px] text-rose-400"></p>
      <p id="auth-info" class="hidden text-[13px] text-emerald-400"></p>
    </form>
  </div>
</div>`;

let mode = 'signup';
let onSuccessCb = null;
let lastOverride = null;

const $ = (id) => document.getElementById(id);

function setMode(m) {
  mode = m;
  document.querySelectorAll('#auth-tabs button').forEach((b) => {
    const active = b.dataset.tab === m;
    b.className = active
      ? 'rounded-full py-2 transition border border-orange bg-orange/10 text-orange'
      : 'rounded-full py-2 transition border border-line2 text-mute hover:text-paper';
  });
  $('auth-name-row').classList.toggle('hidden', m !== 'signup');
  $('auth-name').required = m === 'signup';
  $('auth-password').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
  $('auth-password').required = !$('auth-magic').checked;
  $('auth-submit').textContent = m === 'signup' ? 'Sign up' : 'Sign in';
  if (lastOverride) {
    $('auth-title').textContent = lastOverride.title || ($('auth-title').textContent);
    $('auth-subtitle').textContent = lastOverride.subtitle || ($('auth-subtitle').textContent);
  } else {
    $('auth-title').textContent = m === 'signup' ? 'Create your account' : 'Welcome back';
    $('auth-subtitle').textContent = m === 'signup'
      ? 'Sign up to reserve your seat for May 16.'
      : 'Sign in to continue to checkout.';
  }
  hideMessages();
}

function showError(msg) { const e = $('auth-error'); e.textContent = msg; e.classList.remove('hidden'); $('auth-info').classList.add('hidden'); }
function showInfo(msg)  { const e = $('auth-info');  e.textContent = msg; e.classList.remove('hidden'); $('auth-error').classList.add('hidden'); }
function hideMessages() { $('auth-error').classList.add('hidden'); $('auth-info').classList.add('hidden'); }

export function openAuthModal(onSuccess, override) {
  onSuccessCb = onSuccess || null;
  lastOverride = override || null;
  const modal = $('auth-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  setMode(override ? 'signin' : 'signup');
}

export function closeAuthModal() {
  const modal = $('auth-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

export async function initAuth() {
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  $('auth-close').addEventListener('click', closeAuthModal);
  $('auth-modal').addEventListener('click', (e) => {
    if (e.target.id === 'auth-modal') closeAuthModal();
  });
  document.querySelectorAll('#auth-tabs button').forEach((b) => {
    b.addEventListener('click', () => setMode(b.dataset.tab));
  });
  $('auth-magic').addEventListener('change', () => {
    const m = $('auth-magic').checked;
    $('auth-password-row').querySelector('input#auth-password').required = !m;
    $('auth-password-row').querySelector('input#auth-password').disabled = m;
    $('auth-submit').textContent = m ? 'Send me a link' : (mode === 'signup' ? 'Sign up' : 'Sign in');
  });

  const oauthHandler = (provider) => async () => {
    hideMessages();
    try {
      const sb = await getSupabase();
      const { error } = await sb.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + '/?postauth=1' },
      });
      if (error) throw error;
    } catch (err) {
      showError(err.message || `${provider} sign-in failed`);
    }
  };
  $('auth-google').addEventListener('click', oauthHandler('google'));
  $('auth-apple').addEventListener('click', oauthHandler('apple'));

  $('auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();
    try {
      const sb = await getSupabase();
      const email = $('auth-email').value.trim();
      const password = $('auth-password').value;
      const fullName = $('auth-name').value.trim();
      const magic = $('auth-magic').checked;

      if (magic) {
        const { error } = await sb.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: window.location.origin + '/?postauth=1',
            shouldCreateUser: true,
            data: fullName ? { full_name: fullName } : undefined,
          },
        });
        if (error) throw error;
        showInfo('Check your inbox — we sent you a sign-in link.');
        return;
      }

      if (mode === 'signup') {
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + '/?postauth=1',
            data: fullName ? { full_name: fullName } : undefined,
          },
        });
        if (error) throw error;
        if (!data.session) {
          showInfo('Account created. Check your inbox to confirm your email, then sign in.');
          return;
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }

      closeAuthModal();
      if (onSuccessCb) onSuccessCb();
    } catch (err) {
      showError(err.message || 'Something went wrong');
    }
  });

  const sb = await getSupabase();
  sb.auth.onAuthStateChange((_event, session) => updateNavForUser(session?.user || null));
  const { data } = await sb.auth.getUser();
  updateNavForUser(data.user);
}

function updateNavForUser(user) {
  const slot = document.getElementById('nav-auth');
  if (!slot) return;
  if (user) {
    slot.innerHTML = `
      <span class="hidden lg:inline text-mute text-[12px] mr-2 truncate max-w-[160px]">${user.email || ''}</span>
      <button id="nav-signout" class="rounded-full border border-line2 px-3 py-1.5 text-[12px] hover:bg-white/5">Sign out</button>`;
    document.getElementById('nav-signout').addEventListener('click', async () => {
      const sb = await getSupabase();
      await sb.auth.signOut();
    });
  } else {
    slot.innerHTML = `
      <button id="nav-signin" class="rounded-full border border-line2 px-3 py-1.5 text-[12px] hover:bg-white/5">Sign in</button>`;
    document.getElementById('nav-signin').addEventListener('click', () => openAuthModal());
  }
}

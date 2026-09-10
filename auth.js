(() => {
  const loginScreen = document.getElementById('loginScreen');
  const app = document.getElementById('app');
  const form = document.getElementById('loginForm');
  const email = document.getElementById('loginEmail');
  const password = document.getElementById('loginPassword');
  const error = document.getElementById('loginError');
  const toggle = document.getElementById('togglePassword');
  const forgot = document.getElementById('forgotPassword');
  const remember = document.getElementById('rememberMe');
  const logout = document.getElementById('logoutBtn');

  const SESSION_KEY = 'campusone_session';

  function showApp(user) {
    loginScreen.hidden = true;
    app.hidden = false;
    const name = user.email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const profileName = document.getElementById('profileName');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileMeta = document.getElementById('profileMeta');
    if (profileName) profileName.textContent = name || 'Student';
    if (profileAvatar) profileAvatar.textContent = (name || 'S').split(' ').map(x => x[0]).slice(0,2).join('').toUpperCase();
    if (profileMeta) profileMeta.textContent = 'Student';
  }

  function showLogin() {
    app.hidden = true;
    loginScreen.hidden = false;
    email.focus();
  }

  const saved = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
  if (saved) {
    try { showApp(JSON.parse(saved)); } catch { sessionStorage.removeItem(SESSION_KEY); localStorage.removeItem(SESSION_KEY); showLogin(); }
  } else {
    showLogin();
  }

  toggle.addEventListener('click', () => {
    const visible = password.type === 'text';
    password.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'Show' : 'Hide';
    toggle.setAttribute('aria-label', visible ? 'Show password' : 'Hide password');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    error.textContent = '';
    const value = email.value.trim().toLowerCase();
    const pass = password.value;
    if (!value) { error.textContent = 'Please enter your institutional email.'; email.focus(); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) { error.textContent = 'Please enter a valid email address.'; email.focus(); return; }
    if (!pass) { error.textContent = 'Please enter your password.'; password.focus(); return; }
    if (pass.length < 8) { error.textContent = 'Password must contain at least 8 characters.'; password.focus(); return; }

    const user = { email: value, signedInAt: Date.now() };
    const storage = remember.checked ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(user));
    showApp(user);
    if (typeof window.navigate === 'function') window.navigate('home');
  });

  forgot.addEventListener('click', () => {
    error.textContent = 'Password recovery must be connected to your institution’s authentication service.';
  });

  logout?.addEventListener('click', () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    showLogin();
  });
})();

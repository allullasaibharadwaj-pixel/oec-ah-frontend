/* Login, register and admin login forms */
function showMsg(text, type = 'error') {
  document.getElementById('msg').innerHTML = alertHtml(text, type);
}

function initLogin() {
  if (getToken() && getUser()) { window.location.href = getUser().role === 'ADMIN' ? 'admin-dashboard.html' : 'index.html'; return; }
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) return showMsg('Please enter your email and password');
    const btn = e.target.querySelector('button');
    setLoading(btn, true, 'Logging in...');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      setAuth(data);
      window.location.href = data.user.role === 'ADMIN' ? 'admin-dashboard.html' : safeRedirect('index.html');
    } catch (err) { showMsg(err.message); setLoading(btn, false); }
  });
}

function initRegister() {
  if (getToken() && getUser()) { window.location.href = 'index.html'; return; }
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const v = id => document.getElementById(id).value.trim();
    const body = { name: v('name'), email: v('email'), password: document.getElementById('password').value, phone: v('phone'), address: v('address') };
    if (!body.name) return showMsg('Full name is required');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) return showMsg('Enter a valid email address');
    if (body.password.length < 6) return showMsg('Password must be at least 6 characters');
    if (body.password !== document.getElementById('confirm').value) return showMsg('Passwords do not match');
    if (!/^\+?[0-9]{10,15}$/.test(body.phone)) return showMsg('Enter a valid phone number (10-15 digits)');
    if (!body.address) return showMsg('Address is required');
    const btn = e.target.querySelector('button');
    setLoading(btn, true, 'Creating account...');
    try {
      const data = await api('/api/auth/register', { method: 'POST', body });
      setAuth(data);
      window.location.href = 'index.html';
    } catch (err) { showMsg(err.message); setLoading(btn, false); }
  });
}

function initAdminLogin() {
  const u = getUser();
  if (getToken() && u && u.role === 'ADMIN') { window.location.href = 'admin-dashboard.html'; return; }
  document.getElementById('adminLoginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    if (!email || !password) return showMsg('Please enter your email and password');
    const btn = e.target.querySelector('button');
    setLoading(btn, true, 'Signing in...');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      if (data.user.role !== 'ADMIN') { showMsg('This account does not have administrator access'); setLoading(btn, false); return; }
      setAuth(data);
      window.location.href = 'admin-dashboard.html';
    } catch (err) { showMsg(err.message); setLoading(btn, false); }
  });
}

const authPage = document.body.dataset.page;
if (authPage === 'login') initLogin();
if (authPage === 'register') initRegister();
if (authPage === 'admin-login') initAdminLogin();

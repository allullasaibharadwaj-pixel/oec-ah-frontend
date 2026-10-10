/* Shared helpers: API wrapper (Fetch API), auth storage, formatting, UI helpers */
// When the page is served by Spring Boot (port 8080) calls are same-origin.
// When opened another way (Live Server, file://) the backend is called directly.
const API_BASE = window.location.port === '8080' ? '' : 'http://localhost:8080';
const CURRENCY = '$'; // change to '₹', '€', ... to switch the displayed currency

const CATEGORY_ICONS = {
  'Electronics': '💻', 'Fashion': '👗', 'Home & Kitchen': '🏠', 'Beauty': '💄',
  'Books': '📚', 'Sports': '⚽', 'Accessories': '🎒'
};

/* ---------- auth storage ---------- */
function getToken() { return localStorage.getItem('token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; }
}
function setAuth(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
}
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/* ---------- fetch wrapper ---------- */
async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  let res;
  try {
    res = await fetch(API_BASE + path, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
  } catch (e) {
    throw new Error('Cannot reach the server. Make sure the backend is running on http://localhost:8080');
  }
  let data = null;
  const text = await res.text();
  if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
  if (!res.ok) {
    if (res.status === 401 && token) {
      clearAuth();
      const prot = document.body.dataset.protected;
      if (prot) { window.location.href = prot === 'admin' ? 'admin-login.html' : 'login.html'; }
    }
    const err = new Error((data && data.message) || 'Request failed (' + res.status + ')');
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- formatting ---------- */
function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function money(n) { return CURRENCY + Number(n || 0).toFixed(2); }
function fmtDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDay(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}
function qs(name) { return new URLSearchParams(window.location.search).get(name); }
function categoryIcon(name) { return CATEGORY_ICONS[name] || '🛍️'; }

/* ---------- UI helpers ---------- */
function toast(message, type = 'info') {
  let box = document.getElementById('toast-container');
  if (!box) { box = document.createElement('div'); box.id = 'toast-container'; document.body.appendChild(box); }
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = message;
  box.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 3200);
}
function loaderHtml() { return '<div class="loader"><div class="spinner"></div></div>'; }
function skeletons(n = 4) { return '<div class="product-grid">' + '<div class="skeleton"></div>'.repeat(n) + '</div>'; }
function emptyHtml(icon, title, text, actionHtml = '') {
  return `<div class="empty"><div class="ico">${icon}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${actionHtml}</div>`;
}
function alertHtml(message, type = 'error') { return `<div class="alert alert-${type}">${esc(message)}</div>`; }
function statusBadge(s) { return `<span class="status status-${esc(s)}">${esc(s)}</span>`; }
function imgSrc(url) { return url && url.trim() ? url.trim() : 'images/placeholder.svg'; }
function imgTag(url, alt, cls = '') {
  return `<img ${cls ? `class="${cls}" ` : ''}src="${esc(imgSrc(url))}" alt="${esc(alt)}" loading="lazy" onerror="this.onerror=null;this.src='images/placeholder.svg'">`;
}
function stars(r) {
  const full = Math.round(Number(r) || 0);
  return `<span class="stars">${'★'.repeat(full)}${'☆'.repeat(5 - full)}<small>${Number(r || 0).toFixed(1)}</small></span>`;
}
function stockHtml(n) {
  if (n <= 0) return '<span class="stock out">Out of stock</span>';
  if (n <= 5) return `<span class="stock low">Only ${n} left</span>`;
  return '<span class="stock in">In stock</span>';
}
function discountPct(p) {
  return p.oldPrice && Number(p.oldPrice) > Number(p.price) ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
}
function priceHtml(p) {
  return `<span class="price">${money(p.price)}</span>` +
    (discountPct(p) ? `<span class="old-price">${money(p.oldPrice)}</span>` : '');
}
function productCard(p) {
  const pct = discountPct(p);
  const out = p.stockQuantity <= 0;
  return `<div class="product-card">
    ${pct ? `<span class="badge-sale">-${pct}%</span>` : ''}${out ? '<span class="badge-out">Sold out</span>' : ''}
    <a class="img-wrap" href="product-details.html?id=${p.id}">${imgTag(p.imageUrl, p.name)}</a>
    <div class="body">
      <span class="brand">${esc(p.brand || p.categoryName)}</span>
      <h3><a href="product-details.html?id=${p.id}">${esc(p.name)}</a></h3>
      ${stars(p.rating)}
      <div class="foot"><div>${priceHtml(p)}</div>
        <button class="btn btn-sm" ${out ? 'disabled' : ''} onclick="addToCart(${p.id},1)">Add</button></div>
    </div></div>`;
}

/* ---------- cart helpers ---------- */
async function updateCartBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  if (!getToken()) { badge.classList.add('hidden'); return; }
  try {
    const cart = await api('/api/cart');
    badge.textContent = cart.itemCount;
    badge.classList.toggle('hidden', cart.itemCount === 0);
  } catch (e) { badge.classList.add('hidden'); }
}
async function addToCart(productId, quantity = 1) {
  if (!getToken()) {
    toast('Please log in to add items to your cart', 'error');
    setTimeout(() => { window.location.href = 'login.html?redirect=' + encodeURIComponent(location.pathname.split('/').pop() + location.search); }, 900);
    return false;
  }
  try {
    await api('/api/cart/add', { method: 'POST', body: { productId, quantity } });
    toast('Added to cart', 'success');
    updateCartBadge();
    return true;
  } catch (e) { toast(e.message, 'error'); return false; }
}
function setLoading(btn, loading, text) {
  if (!btn) return;
  if (loading) { btn.dataset.text = btn.textContent; btn.disabled = true; btn.textContent = text || 'Please wait...'; }
  else { btn.disabled = false; btn.textContent = btn.dataset.text || btn.textContent; }
}
function safeRedirect(fallback) {
  const r = qs('redirect');
  return r && /^[A-Za-z0-9_\-]+\.html(\?[A-Za-z0-9_=&\-]*)?$/.test(r) ? r : fallback;
}

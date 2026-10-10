/* Builds the shared header / footer / admin sidebar and enforces page access. */
window.ACCESS_OK = true;

function logout() { clearAuth(); window.location.href = 'index.html'; }

function requireLogin() {
  if (!getToken()) {
    window.ACCESS_OK = false;
    window.location.href = 'login.html?redirect=' + encodeURIComponent(location.pathname.split('/').pop() + location.search);
  }
}
function requireAdmin() {
  const u = getUser();
  if (!getToken() || !u || u.role !== 'ADMIN') {
    window.ACCESS_OK = false;
    window.location.href = 'admin-login.html';
  }
}

function renderHeader() {
  const u = getUser();
  const loggedIn = !!(getToken() && u);
  const account = loggedIn ? `
    <div class="dropdown">
      <button class="link">👤 Hi, ${esc((u.name || '').split(' ')[0])} ▾</button>
      <div class="dropdown-menu">
        <a href="profile.html">My Profile</a>
        <a href="orders.html">My Orders</a>
        ${u.role === 'ADMIN' ? '<a href="admin-dashboard.html">Admin Panel</a>' : ''}
        <button onclick="logout()">Logout</button>
      </div>
    </div>` : `<a href="login.html">Login</a><a class="btn btn-sm" href="register.html">Register</a>`;
  document.getElementById('site-header').innerHTML = `
    <div class="topbar">🚚 Free delivery on orders over ${money(100)} &nbsp;•&nbsp; Demo store – no real payments are made</div>
    <header class="site-header"><div class="nav">
      <a class="logo" href="index.html">🛍️ Shop<span>Ease</span></a>
      <form class="search-form" id="searchForm">
        <input id="searchInput" type="search" placeholder="Search products, brands, categories..." value="${esc(qs('search') || '')}">
        <button type="submit">Search</button>
      </form>
      <nav class="nav-links">
        <a href="products.html">Products</a>
        ${account}
        <a class="cart-link" href="cart.html" title="Cart">🛒<span class="cart-badge hidden" id="cartBadge">0</span></a>
      </nav>
    </div></header>`;
  document.getElementById('searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = document.getElementById('searchInput').value.trim();
    window.location.href = 'products.html' + (v ? '?search=' + encodeURIComponent(v) : '');
  });
  updateCartBadge();
}

function renderFooter() {
  document.getElementById('site-footer').innerHTML = `
    <footer class="site-footer">
      <div class="footer-grid">
        <div><a class="logo" href="index.html">🛍️ Shop<span>Ease</span></a>
          <p>Your one-stop online store for electronics, fashion, home, beauty, books and more.</p></div>
        <div><h4>Shop</h4><a href="products.html">All Products</a><a href="products.html?sort=newest">New Arrivals</a><a href="products.html?sort=popular">Best Sellers</a></div>
        <div><h4>Account</h4><a href="login.html">Login</a><a href="register.html">Register</a><a href="orders.html">My Orders</a><a href="profile.html">My Profile</a></div>
        <div><h4>Contact</h4><a href="#">support@shopease.demo</a><a href="#">Mon - Sat, 9am - 6pm</a><a href="admin-login.html">Admin Login</a></div>
      </div>
      <div class="copyright">© ${new Date().getFullYear()} ShopEase – Java Full Stack E-Commerce Demo</div>
    </footer>`;
}

function renderAdminSide() {
  const active = document.body.dataset.nav;
  const link = (key, href, label) => `<a href="${href}" class="${active === key ? 'active' : ''}">${label}</a>`;
  document.getElementById('admin-side').innerHTML = `
    <a class="logo" href="admin-dashboard.html">🛠️ Shop<span>Ease</span></a>
    ${link('dashboard', 'admin-dashboard.html', '📊 Dashboard')}
    ${link('products', 'admin-products.html', '📦 Products')}
    ${link('add-product', 'admin-add-product.html', '➕ Add Product')}
    ${link('categories', 'admin-categories.html', '🗂️ Categories')}
    ${link('orders', 'admin-orders.html', '🧾 Orders')}
    ${link('users', 'admin-users.html', '👥 Users')}
    <hr>
    <a href="index.html">🏬 View Store</a>
    <button onclick="logout()">🚪 Logout</button>`;
}

(function initLayout() {
  const prot = document.body.dataset.protected;
  if (prot === 'user') requireLogin();
  if (prot === 'admin') requireAdmin();
  if (!window.ACCESS_OK) return;
  if (document.getElementById('site-header')) renderHeader();
  if (document.getElementById('site-footer')) renderFooter();
  if (document.getElementById('admin-side')) renderAdminSide();
})();

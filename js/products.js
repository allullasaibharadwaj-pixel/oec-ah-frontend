/* Product catalog: search, filter, sort */
let categoriesCache = [];
let searchTimer = null;

function readFilters() {
  return {
    search: document.getElementById('fSearch').value.trim(),
    categoryId: document.getElementById('fCategory').value,
    minPrice: document.getElementById('fMin').value,
    maxPrice: document.getElementById('fMax').value,
    sort: document.getElementById('fSort').value
  };
}

async function loadProducts() {
  const f = readFilters();
  const params = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => { if (v !== '') params.set(k, v); });
  // keep the URL shareable
  try { history.replaceState(null, '', 'products.html' + (params.toString() ? '?' + params : '')); } catch (e) { /* ignore (file://) */ }
  const cat = categoriesCache.find(c => String(c.id) === String(f.categoryId));
  document.getElementById('pageTitle').textContent = f.search ? `Results for "${f.search}"` : (cat ? cat.name : 'All Products');
  const box = document.getElementById('productList');
  box.innerHTML = skeletons(6);
  try {
    const list = await api('/api/products?' + params);
    document.getElementById('resultCount').textContent = list.length + (list.length === 1 ? ' product found' : ' products found');
    box.innerHTML = list.length
      ? `<div class="product-grid">${list.map(productCard).join('')}</div>`
      : emptyHtml('🔍', 'No products found', 'Try a different search or clear some filters.', '<button class="btn" onclick="resetFilters()">Clear filters</button>');
  } catch (e) { box.innerHTML = alertHtml(e.message); }
}

function resetFilters() {
  ['fSearch', 'fCategory', 'fMin', 'fMax'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('fSort').value = 'newest';
  const hs = document.getElementById('searchInput'); if (hs) hs.value = '';
  loadProducts();
}

async function initProducts() {
  try {
    categoriesCache = await api('/api/categories');
    document.getElementById('fCategory').insertAdjacentHTML('beforeend',
      categoriesCache.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join(''));
  } catch (e) { toast(e.message, 'error'); }
  document.getElementById('fSearch').value = qs('search') || '';
  document.getElementById('fCategory').value = qs('categoryId') || '';
  document.getElementById('fMin').value = qs('minPrice') || '';
  document.getElementById('fMax').value = qs('maxPrice') || '';
  document.getElementById('fSort').value = qs('sort') || 'newest';

  document.getElementById('applyBtn').addEventListener('click', loadProducts);
  document.getElementById('resetBtn').addEventListener('click', resetFilters);
  ['fCategory', 'fSort'].forEach(id => document.getElementById(id).addEventListener('change', loadProducts));
  document.getElementById('fSearch').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(loadProducts, 350); });
  ['fMin', 'fMax'].forEach(id => document.getElementById(id).addEventListener('keydown', e => { if (e.key === 'Enter') loadProducts(); }));
  loadProducts();
}
if (ACCESS_OK) initProducts();

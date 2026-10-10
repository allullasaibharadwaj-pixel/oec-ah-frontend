/* Home page */
async function section(id, params) {
  const box = document.getElementById(id);
  box.innerHTML = skeletons(4);
  try {
    const list = await api('/api/products?' + params);
    box.innerHTML = list.length ? `<div class="product-grid">${list.map(productCard).join('')}</div>`
      : emptyHtml('📭', 'No products yet', 'Check back soon.');
  } catch (e) { box.innerHTML = alertHtml(e.message); }
}

async function initHome() {
  document.getElementById('freeDel').textContent = 'On orders over ' + money(100);
  const cats = document.getElementById('categories');
  try {
    const list = await api('/api/categories');
    cats.innerHTML = list.map(c => `<a class="category-card" href="products.html?categoryId=${c.id}">
      <span class="ico">${categoryIcon(c.name)}</span>${esc(c.name)}</a>`).join('');
  } catch (e) { cats.innerHTML = alertHtml(e.message); }
  section('featured', 'sort=rating&limit=8');
  section('bestsellers', 'sort=popular&limit=4');
  section('newarrivals', 'sort=newest&limit=4');
}
if (ACCESS_OK) initHome();

/* Admin products: list (admin-products.html) and add/edit form (admin-add-product.html / admin-edit-product.html) */
let allProducts = [];

function toRequest(p, overrides = {}) {
  return Object.assign({
    name: p.name, description: p.description, price: p.price, oldPrice: p.oldPrice, categoryId: p.categoryId,
    brand: p.brand, imageUrl: p.imageUrl, stockQuantity: p.stockQuantity, rating: p.rating
  }, overrides);
}

function renderTable(filter = '') {
  const f = filter.trim().toLowerCase();
  const list = allProducts.filter(p => !f || [p.name, p.brand, p.categoryName].some(v => (v || '').toLowerCase().includes(f)));
  const area = document.getElementById('productsArea');
  if (!list.length) { area.innerHTML = emptyHtml('📦', 'No products found', 'Add your first product to get started.', '<a class="btn" href="admin-add-product.html">+ Add Product</a>'); return; }
  area.innerHTML = `<div class="table-wrap"><table><thead><tr><th></th><th>Name</th><th>Category</th><th>Brand</th><th>Price</th><th>Stock</th><th>Rating</th><th>Actions</th></tr></thead><tbody>
    ${list.map(p => `<tr>
      <td>${imgTag(p.imageUrl, p.name, 'thumb')}</td>
      <td><b>${esc(p.name)}</b></td><td>${esc(p.categoryName)}</td><td>${esc(p.brand || '-')}</td>
      <td>${money(p.price)}</td>
      <td><div class="actions"><input class="form-control" type="number" min="0" id="stock-${p.id}" value="${p.stockQuantity}" style="width:80px;padding:6px 8px"><button class="btn btn-sm btn-ghost" onclick="updateStock(${p.id})">Update</button></div></td>
      <td>${Number(p.rating).toFixed(1)} ★</td>
      <td><div class="actions"><a class="btn btn-sm" href="admin-edit-product.html?id=${p.id}">Edit</a><button class="btn btn-sm btn-danger" onclick="deleteProduct(${p.id})">Delete</button></div></td>
    </tr>`).join('')}</tbody></table></div>`;
}

async function loadProductsTable() {
  try { allProducts = await api('/api/products?sort=newest'); renderTable(document.getElementById('tableSearch').value); }
  catch (e) { document.getElementById('productsArea').innerHTML = alertHtml(e.message); }
}

async function updateStock(id) {
  const p = allProducts.find(x => x.id === id);
  const qty = parseInt(document.getElementById('stock-' + id).value, 10);
  if (isNaN(qty) || qty < 0) return toast('Enter a valid stock quantity', 'error');
  try { await api('/api/products/' + id, { method: 'PUT', body: toRequest(p, { stockQuantity: qty }) }); toast('Stock updated', 'success'); loadProductsTable(); }
  catch (e) { toast(e.message, 'error'); }
}

async function deleteProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!confirm('Delete "' + p.name + '"? This cannot be undone.')) return;
  try { await api('/api/products/' + id, { method: 'DELETE' }); toast('Product deleted', 'success'); loadProductsTable(); }
  catch (e) { toast(e.message, 'error'); }
}

async function initForm(editing) {
  const msg = document.getElementById('msg');
  const form = document.getElementById('productForm');
  const $ = id => document.getElementById(id);
  let product = null;
  try {
    const cats = await api('/api/categories');
    if (!cats.length) { msg.innerHTML = alertHtml('Create a category first (Categories page).'); }
    $('pCategory').innerHTML = cats.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join('');
    if (editing) {
      const id = qs('id');
      if (!id) { form.innerHTML = alertHtml('No product selected'); return; }
      product = await api('/api/products/' + encodeURIComponent(id));
      $('pName').value = product.name; $('pBrand').value = product.brand || ''; $('pCategory').value = product.categoryId;
      $('pStock').value = product.stockQuantity; $('pPrice').value = product.price; $('pOldPrice').value = product.oldPrice || '';
      $('pRating').value = product.rating; $('pImage').value = product.imageUrl || ''; $('pDesc').value = product.description || '';
      $('preview').src = imgSrc(product.imageUrl);
    }
  } catch (e) { msg.innerHTML = alertHtml(e.message); return; }

  $('preview').onerror = function () { this.onerror = null; this.src = 'images/placeholder.svg'; };
  $('pImage').addEventListener('input', () => { $('preview').src = imgSrc($('pImage').value); });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const body = {
      name: $('pName').value.trim(), brand: $('pBrand').value.trim(), categoryId: Number($('pCategory').value),
      stockQuantity: parseInt($('pStock').value, 10), price: parseFloat($('pPrice').value),
      oldPrice: $('pOldPrice').value ? parseFloat($('pOldPrice').value) : null,
      rating: $('pRating').value ? parseFloat($('pRating').value) : 0,
      imageUrl: $('pImage').value.trim(), description: $('pDesc').value.trim()
    };
    if (!body.name) return msg.innerHTML = alertHtml('Product name is required');
    if (!body.categoryId) return msg.innerHTML = alertHtml('Please select a category');
    if (!(body.price > 0)) return msg.innerHTML = alertHtml('Enter a valid price');
    if (isNaN(body.stockQuantity) || body.stockQuantity < 0) return msg.innerHTML = alertHtml('Enter a valid stock quantity');
    if (body.rating < 0 || body.rating > 5) return msg.innerHTML = alertHtml('Rating must be between 0 and 5');
    const btn = $('saveBtn');
    setLoading(btn, true, 'Saving...');
    try {
      await api(editing ? '/api/products/' + product.id : '/api/products', { method: editing ? 'PUT' : 'POST', body });
      window.location.href = 'admin-products.html';
    } catch (err) { msg.innerHTML = alertHtml(err.message); setLoading(btn, false); }
  });
}

if (ACCESS_OK) {
  const pg = document.body.dataset.page;
  if (pg === 'admin-products') {
    document.getElementById('tableSearch').addEventListener('input', e => renderTable(e.target.value));
    loadProductsTable();
  }
  if (pg === 'admin-add') initForm(false);
  if (pg === 'admin-edit') initForm(true);
}

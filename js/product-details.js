/* Single product page */
let currentProduct = null;
let qtyValue = 1;

function changeQty(delta) {
  const max = Math.max(1, currentProduct.stockQuantity);
  qtyValue = Math.min(max, Math.max(1, qtyValue + delta));
  document.getElementById('qtyVal').textContent = qtyValue;
}

async function detailAdd(buyNow) {
  const ok = await addToCart(currentProduct.id, qtyValue);
  if (ok && buyNow) window.location.href = 'checkout.html';
}

async function initDetails() {
  const id = qs('id');
  const box = document.getElementById('detail');
  if (!id) { box.innerHTML = emptyHtml('❓', 'No product selected', 'Please choose a product from the catalog.', '<a class="btn" href="products.html">Browse products</a>'); return; }
  try {
    const p = await api('/api/products/' + encodeURIComponent(id));
    currentProduct = p;
    document.title = p.name + ' | ShopEase';
    const pct = discountPct(p);
    const out = p.stockQuantity <= 0;
    box.innerHTML = `
      <div class="breadcrumb"><a href="index.html">Home</a> / <a href="products.html?categoryId=${p.categoryId}">${esc(p.categoryName)}</a> / ${esc(p.name)}</div>
      <div class="details">
        <div class="big-img">${pct ? `<span class="badge-sale">-${pct}%</span>` : ''}${imgTag(p.imageUrl, p.name)}</div>
        <div>
          <span class="brand" style="color:var(--muted);font-weight:600;text-transform:uppercase;font-size:.8rem">${esc(p.brand || '')}</span>
          <h1>${esc(p.name)}</h1>
          ${stars(p.rating)}
          <div style="margin:14px 0">${priceHtml(p)} ${pct ? `<span class="status status-DELIVERED">Save ${pct}%</span>` : ''}</div>
          <div>${stockHtml(p.stockQuantity)}${p.stockQuantity > 0 ? ` <small style="color:var(--muted)">(${p.stockQuantity} available)</small>` : ''}</div>
          <p class="desc">${esc(p.description || 'No description available.')}</p>
          <ul class="meta-list"><li><b>Category</b> ${esc(p.categoryName)}</li><li><b>Brand</b> ${esc(p.brand || '-')}</li><li><b>Sold</b> ${p.salesCount} units</li></ul>
          <div class="buy-row">
            <div class="qty"><button onclick="changeQty(-1)" ${out ? 'disabled' : ''}>−</button><span id="qtyVal">1</span><button onclick="changeQty(1)" ${out ? 'disabled' : ''}>+</button></div>
            <button class="btn" ${out ? 'disabled' : ''} onclick="detailAdd(false)">🛒 Add to Cart</button>
            <button class="btn btn-accent" ${out ? 'disabled' : ''} onclick="detailAdd(true)">Buy Now</button>
          </div>
        </div>
      </div>`;
    loadRelated(p);
  } catch (e) {
    box.innerHTML = emptyHtml('😕', 'Product not found', e.message, '<a class="btn" href="products.html">Browse products</a>');
  }
}

async function loadRelated(p) {
  try {
    const list = (await api('/api/products?categoryId=' + p.categoryId + '&sort=rating&limit=5')).filter(x => x.id !== p.id).slice(0, 4);
    if (!list.length) return;
    document.getElementById('related').innerHTML = `<div class="product-grid">${list.map(productCard).join('')}</div>`;
    document.getElementById('relatedSection').classList.remove('hidden');
  } catch (e) { /* related products are optional */ }
}
if (ACCESS_OK) initDetails();

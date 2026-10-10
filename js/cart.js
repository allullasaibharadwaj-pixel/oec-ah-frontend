/* Shopping cart page */
const FREE_DELIVERY_THRESHOLD = 100;

async function loadCart() {
  const area = document.getElementById('cartArea');
  try {
    const cart = await api('/api/cart');
    renderCart(cart);
  } catch (e) { area.innerHTML = alertHtml(e.message); }
}

function renderCart(cart) {
  const area = document.getElementById('cartArea');
  updateCartBadge();
  if (!cart.items.length) {
    area.innerHTML = emptyHtml('🛒', 'Your cart is empty', 'Looks like you have not added anything yet.', '<a class="btn" href="products.html">Start shopping</a>');
    return;
  }
  const remaining = FREE_DELIVERY_THRESHOLD - Number(cart.subtotal);
  area.innerHTML = `
    <div class="two-col">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <b>${cart.itemCount} item${cart.itemCount === 1 ? '' : 's'}</b>
          <button class="btn btn-sm btn-ghost" onclick="clearCart()">Clear cart</button>
        </div>
        ${cart.items.map(i => `
          <div class="cart-item">
            <a href="product-details.html?id=${i.productId}">${imgTag(i.imageUrl, i.name)}</a>
            <div>
              <h3><a href="product-details.html?id=${i.productId}">${esc(i.name)}</a></h3>
              <div class="unit">${money(i.price)} each</div>
              ${i.quantity >= i.stockQuantity ? `<div class="stock low">Max stock reached (${i.stockQuantity})</div>` : ''}
              <button class="link-danger" onclick="removeItem(${i.productId})">Remove</button>
            </div>
            <div class="qty">
              <button onclick="setQty(${i.productId},${i.quantity - 1})" ${i.quantity <= 1 ? 'disabled' : ''}>−</button>
              <span>${i.quantity}</span>
              <button onclick="setQty(${i.productId},${i.quantity + 1})" ${i.quantity >= i.stockQuantity ? 'disabled' : ''}>+</button>
            </div>
            <div class="item-total">${money(i.subtotal)}</div>
          </div>`).join('')}
      </div>
      <div class="card summary">
        <h3>Order Summary</h3>
        <div class="sum-row"><span>Items (${cart.itemCount})</span><span>${money(cart.subtotal)}</span></div>
        <div class="sum-row"><span>Delivery</span><span>${Number(cart.deliveryCharge) === 0 ? '<span class="free">FREE</span>' : money(cart.deliveryCharge)}</span></div>
        <div class="sum-row total"><span>Total</span><span>${money(cart.total)}</span></div>
        ${remaining > 0 ? `<div class="alert alert-info" style="margin-top:14px">Add ${money(remaining)} more for free delivery!</div>` : ''}
        <a class="btn btn-accent btn-block" style="margin-top:14px" href="checkout.html">Proceed to Checkout</a>
        <a class="btn btn-ghost btn-block" style="margin-top:8px" href="products.html">Continue shopping</a>
      </div>
    </div>`;
}

async function setQty(productId, quantity) {
  if (quantity < 1) return;
  try { renderCart(await api('/api/cart/update', { method: 'PUT', body: { productId, quantity } })); }
  catch (e) { toast(e.message, 'error'); loadCart(); }
}
async function removeItem(productId) {
  try { renderCart(await api('/api/cart/remove/' + productId, { method: 'DELETE' })); toast('Item removed', 'success'); }
  catch (e) { toast(e.message, 'error'); loadCart(); }
}
async function clearCart() {
  if (!confirm('Remove all items from your cart?')) return;
  try { renderCart(await api('/api/cart/clear', { method: 'DELETE' })); toast('Cart cleared', 'success'); }
  catch (e) { toast(e.message, 'error'); }
}
if (ACCESS_OK) loadCart();

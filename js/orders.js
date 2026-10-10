/* Customer orders: order-success.html, orders.html, order-details.html */
const STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
const STEP_ICONS = { PLACED: '📝', CONFIRMED: '✔️', PACKED: '📦', SHIPPED: '🚚', DELIVERED: '🏠' };

function orderItemsHtml(order) {
  return `<div class="line-items">${order.items.map(i => `
    <div class="row">${imgTag(i.imageUrl, i.productName)}
      <div class="grow"><a href="product-details.html?id=${i.productId}"><b>${esc(i.productName)}</b></a><div style="color:var(--muted);font-size:.88rem">${money(i.price)} × ${i.quantity}</div></div>
      <b>${money(i.subtotal)}</b></div>`).join('')}</div>`;
}
function orderTotalsHtml(o) {
  return `<div class="sum-row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
    <div class="sum-row"><span>Delivery</span><span>${Number(o.deliveryCharge) === 0 ? '<span class="free">FREE</span>' : money(o.deliveryCharge)}</span></div>
    <div class="sum-row total"><span>Total</span><span>${money(o.totalAmount)}</span></div>`;
}
const payLabel = m => m === 'COD' ? 'Cash on Delivery' : 'Demo Card Payment';

async function initSuccess() {
  const area = document.getElementById('successArea');
  try {
    const o = await api('/api/orders/' + encodeURIComponent(qs('id')));
    area.innerHTML = `
      <div class="success-box card">
        <div class="check">✓</div>
        <h1>Order placed successfully!</h1>
        <p style="color:var(--muted);margin:8px 0 18px">Thank you for shopping with us. Your order <b>#${o.id}</b> has been received.</p>
        <div style="text-align:left;background:#f9fafb;border-radius:12px;padding:16px;margin-bottom:18px">
          ${orderItemsHtml(o)}${orderTotalsHtml(o)}
          <div class="sum-row"><span>Payment</span><span>${payLabel(o.paymentMethod)} ${statusBadge(o.paymentStatus)}</span></div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
          <a class="btn" href="order-details.html?id=${o.id}">View order</a>
          <a class="btn btn-outline" href="products.html">Continue shopping</a>
        </div>
      </div>`;
    updateCartBadge();
  } catch (e) { area.innerHTML = emptyHtml('😕', 'Order not found', e.message, '<a class="btn" href="orders.html">My orders</a>'); }
}

async function initOrders() {
  const area = document.getElementById('ordersArea');
  try {
    const orders = await api('/api/orders');
    if (!orders.length) { area.innerHTML = emptyHtml('📦', 'No orders yet', 'When you place an order it will appear here.', '<a class="btn" href="products.html">Start shopping</a>'); return; }
    area.innerHTML = orders.map(o => `
      <div class="order-card">
        <div class="order-head">
          <div><b>Order #${o.id}</b><small>${fmtDate(o.createdAt)}</small></div>
          <div>${statusBadge(o.orderStatus)}</div>
          <div><small>Total</small><b>${money(o.totalAmount)}</b></div>
          <a class="btn btn-sm btn-outline" href="order-details.html?id=${o.id}">View details</a>
        </div>
        <div style="color:var(--muted);font-size:.9rem">${o.items.map(i => esc(i.productName) + ' × ' + i.quantity).join(' • ')}</div>
      </div>`).join('');
  } catch (e) { area.innerHTML = alertHtml(e.message); }
}

async function cancelOrder(id) {
  if (!confirm('Cancel this order?')) return;
  try { await api('/api/orders/' + id + '/cancel', { method: 'PUT' }); toast('Order cancelled', 'success'); initDetails(); }
  catch (e) { toast(e.message, 'error'); }
}

async function initDetails() {
  const area = document.getElementById('orderArea');
  try {
    const o = await api('/api/orders/' + encodeURIComponent(qs('id')));
    const idx = STEPS.indexOf(o.orderStatus);
    const timeline = o.orderStatus === 'CANCELLED'
      ? '<div class="alert alert-error">This order was cancelled.</div>'
      : `<div class="timeline">${STEPS.map((s, i) => `<div class="tl-step ${i < idx || o.orderStatus === 'DELIVERED' ? 'done' : ''} ${i === idx && o.orderStatus !== 'DELIVERED' ? 'current' : ''}"><i>${i <= idx ? STEP_ICONS[s] : ''}</i>${s}</div>`).join('')}</div>`;
    area.innerHTML = `
      <div class="two-col">
        <div class="card">
          <div class="order-head"><div><h2>Order #${o.id}</h2><small>Placed on ${fmtDate(o.createdAt)}</small></div>${statusBadge(o.orderStatus)}</div>
          ${timeline}
          <h3 style="margin:22px 0 6px">Items</h3>${orderItemsHtml(o)}
          <div class="info-grid">
            <div><h4>Shipping address</h4>${esc(o.shippingAddress)}</div>
            <div><h4>Phone</h4>${esc(o.phone)}</div>
            <div><h4>Payment</h4>${payLabel(o.paymentMethod)} ${statusBadge(o.paymentStatus)}</div>
          </div>
        </div>
        <div class="card summary"><h3>Payment Summary</h3>${orderTotalsHtml(o)}
          ${['PLACED', 'CONFIRMED'].includes(o.orderStatus) ? `<button class="btn btn-danger btn-block" style="margin-top:16px" onclick="cancelOrder(${o.id})">Cancel order</button>` : ''}
          <a class="btn btn-ghost btn-block" style="margin-top:8px" href="orders.html">← All orders</a>
        </div>
      </div>`;
  } catch (e) { area.innerHTML = emptyHtml('😕', 'Order not found', e.message, '<a class="btn" href="orders.html">My orders</a>'); }
}

if (ACCESS_OK) {
  const pg = document.body.dataset.page;
  if (pg === 'order-success') initSuccess();
  if (pg === 'orders') initOrders();
  if (pg === 'order-details') initDetails();
}

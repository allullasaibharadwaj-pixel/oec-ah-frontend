/* Admin order management */
const ALL_STATUSES = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
let allOrders = [];

function closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); }

function renderOrders() {
  const filter = document.getElementById('statusFilter').value;
  const list = allOrders.filter(o => !filter || o.orderStatus === filter);
  const area = document.getElementById('ordersArea');
  if (!list.length) { area.innerHTML = emptyHtml('🧾', 'No orders found', filter ? 'No orders with this status.' : 'Orders will appear here once customers check out.'); return; }
  area.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>Update status</th><th></th></tr></thead><tbody>
    ${list.map(o => {
      const locked = o.orderStatus === 'CANCELLED' || o.orderStatus === 'DELIVERED';
      return `<tr><td><b>#${o.id}</b></td><td>${esc(o.userName)}<br><small style="color:var(--muted)">${esc(o.userEmail)}</small></td>
      <td>${fmtDate(o.createdAt)}</td><td><b>${money(o.totalAmount)}</b></td>
      <td>${o.paymentMethod}<br>${statusBadge(o.paymentStatus)}</td><td>${statusBadge(o.orderStatus)}</td>
      <td>${locked ? '<small style="color:var(--muted)">Final</small>' : `<div class="actions">
        <select class="form-control" id="st-${o.id}" style="width:140px;padding:6px 8px">${ALL_STATUSES.map(s => `<option ${s === o.orderStatus ? 'selected' : ''}>${s}</option>`).join('')}</select>
        <button class="btn btn-sm" onclick="saveStatus(${o.id})">Save</button></div>`}</td>
      <td><button class="btn btn-sm btn-ghost" onclick="viewOrder(${o.id})">View</button></td></tr>`;
    }).join('')}</tbody></table></div>`;
}

async function saveStatus(id) {
  const status = document.getElementById('st-' + id).value;
  if (status === 'CANCELLED' && !confirm('Cancel this order? Stock will be returned to inventory.')) return;
  try {
    const updated = await api('/api/admin/orders/' + id + '/status', { method: 'PUT', body: { status } });
    allOrders = allOrders.map(o => o.id === id ? updated : o);
    toast('Order #' + id + ' is now ' + updated.orderStatus, 'success');
    renderOrders();
  } catch (e) { toast(e.message, 'error'); }
}

function viewOrder(id) {
  const o = allOrders.find(x => x.id === id);
  closeModal();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-bg" id="modal" onclick="if(event.target===this)closeModal()"><div class="modal">
      <h2>Order #${o.id} ${statusBadge(o.orderStatus)}</h2>
      <div class="info-grid" style="grid-template-columns:1fr 1fr">
        <div><h4>Customer</h4>${esc(o.userName)}<br>${esc(o.userEmail)}</div>
        <div><h4>Placed</h4>${fmtDate(o.createdAt)}</div>
        <div><h4>Shipping address</h4>${esc(o.shippingAddress)}</div>
        <div><h4>Phone</h4>${esc(o.phone)}</div>
        <div><h4>Payment</h4>${o.paymentMethod} ${statusBadge(o.paymentStatus)}</div>
      </div>
      <div class="line-items">${o.items.map(i => `<div class="row">${imgTag(i.imageUrl, i.productName)}<div class="grow"><b>${esc(i.productName)}</b><div style="color:var(--muted);font-size:.85rem">${money(i.price)} × ${i.quantity}</div></div><b>${money(i.subtotal)}</b></div>`).join('')}</div>
      <div class="sum-row"><span>Subtotal</span><span>${money(o.subtotal)}</span></div>
      <div class="sum-row"><span>Delivery</span><span>${money(o.deliveryCharge)}</span></div>
      <div class="sum-row total"><span>Total</span><span>${money(o.totalAmount)}</span></div>
      <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Close</button></div>
    </div></div>`);
}

async function initAdminOrders() {
  const sf = document.getElementById('statusFilter');
  sf.insertAdjacentHTML('beforeend', ALL_STATUSES.map(s => `<option>${s}</option>`).join(''));
  sf.addEventListener('change', renderOrders);
  try { allOrders = await api('/api/admin/orders'); renderOrders(); }
  catch (e) { document.getElementById('ordersArea').innerHTML = alertHtml(e.message); }
}
if (ACCESS_OK) initAdminOrders();

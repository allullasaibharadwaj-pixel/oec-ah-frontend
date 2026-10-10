/* Admin dashboard */
async function initDashboard() {
  const box = document.getElementById('dash');
  try {
    const d = await api('/api/admin/dashboard');
    const stats = [
      ['📦', d.totalProducts, 'Total Products'], ['👥', d.totalUsers, 'Total Users'], ['🧾', d.totalOrders, 'Total Orders'],
      ['💰', money(d.totalRevenue), 'Total Revenue'], ['⏳', d.pendingOrders, 'Pending Orders'], ['✅', d.deliveredOrders, 'Delivered Orders']
    ];
    const maxCount = Math.max(1, ...Object.values(d.statusSummary));
    box.innerHTML = `
      <div class="stat-grid">${stats.map(s => `<div class="stat"><div class="ico">${s[0]}</div><div><b>${s[1]}</b><small>${s[2]}</small></div></div>`).join('')}</div>
      <div class="panel-grid">
        <div class="panel"><h3>Recent Orders</h3>
          ${d.recentOrders.length ? `<div class="table-wrap" style="box-shadow:none"><table><thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>
            ${d.recentOrders.map(o => `<tr><td>#${o.id}</td><td>${esc(o.userName)}</td><td>${money(o.totalAmount)}</td><td>${statusBadge(o.orderStatus)}</td></tr>`).join('')}
          </tbody></table></div>` : '<p style="color:var(--muted)">No orders yet.</p>'}
          <a href="admin-orders.html" style="color:var(--primary);font-weight:600;display:inline-block;margin-top:12px">Manage orders →</a>
        </div>
        <div class="panel"><h3>Order Status Summary</h3>
          ${Object.entries(d.statusSummary).map(([k, v]) => `<div class="bar-row"><span class="label">${k}</span><div class="bar"><i style="width:${(v / maxCount) * 100}%"></i></div><span>${v}</span></div>`).join('')}
        </div>
      </div>
      <div class="panel"><h3>Recently Added Products</h3>
        <div class="table-wrap" style="box-shadow:none"><table><thead><tr><th></th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th></tr></thead><tbody>
          ${d.recentProducts.map(p => `<tr><td>${imgTag(p.imageUrl, p.name, 'thumb')}</td><td>${esc(p.name)}</td><td>${esc(p.categoryName)}</td><td>${money(p.price)}</td><td>${p.stockQuantity}</td></tr>`).join('')}
        </tbody></table></div></div>`;
  } catch (e) { box.innerHTML = alertHtml(e.message); }
}
if (ACCESS_OK) initDashboard();

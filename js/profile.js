/* Customer profile */
async function initProfile() {
  const area = document.getElementById('profileArea');
  try {
    const p = await api('/api/users/profile');
    area.innerHTML = `
      <div class="two-col" style="grid-template-columns:1fr 320px">
        <div class="card">
          <h3 style="margin-bottom:16px">Edit Profile</h3>
          <div id="msg"></div>
          <form id="profileForm" novalidate>
            <div class="form-group"><label for="name">Full name</label><input class="form-control" id="name" value="${esc(p.name)}"></div>
            <div class="form-group"><label>Email (cannot be changed)</label><input class="form-control" value="${esc(p.email)}" readonly></div>
            <div class="form-group"><label for="phone">Phone number</label><input class="form-control" id="phone" value="${esc(p.phone || '')}"></div>
            <div class="form-group"><label for="address">Address</label><textarea class="form-control" id="address">${esc(p.address || '')}</textarea></div>
            <button class="btn" type="submit">Save changes</button>
          </form>
        </div>
        <div class="card">
          <h3 style="margin-bottom:14px">Account Information</h3>
          <div class="info-grid" style="grid-template-columns:1fr">
            <div><h4>Account type</h4>${esc(p.role)}</div>
            <div><h4>Member since</h4>${fmtDay(p.createdAt)}</div>
            <div><h4>Status</h4>${p.enabled ? '<span class="status status-DELIVERED">ACTIVE</span>' : '<span class="status status-CANCELLED">DISABLED</span>'}</div>
          </div>
          <a class="btn btn-outline btn-block" href="orders.html">View my orders</a>
        </div>
      </div>`;
    document.getElementById('profileForm').addEventListener('submit', async e => {
      e.preventDefault();
      const body = { name: document.getElementById('name').value.trim(), phone: document.getElementById('phone').value.trim(), address: document.getElementById('address').value.trim() };
      const msg = document.getElementById('msg');
      if (!body.name || !body.address) { msg.innerHTML = alertHtml('Name and address are required'); return; }
      if (!/^\+?[0-9]{10,15}$/.test(body.phone)) { msg.innerHTML = alertHtml('Enter a valid phone number (10-15 digits)'); return; }
      const btn = e.target.querySelector('button');
      setLoading(btn, true, 'Saving...');
      try {
        const updated = await api('/api/users/profile', { method: 'PUT', body });
        localStorage.setItem('user', JSON.stringify(updated));
        msg.innerHTML = alertHtml('Profile updated successfully', 'success');
        renderHeader();
      } catch (err) { msg.innerHTML = alertHtml(err.message); }
      setLoading(btn, false);
    });
  } catch (e) { area.innerHTML = alertHtml(e.message); }
}
if (ACCESS_OK) initProfile();

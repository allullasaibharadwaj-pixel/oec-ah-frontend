/* Admin user management */
let allUsers = [];
function closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); }

function renderUsers() {
  const area = document.getElementById('usersArea');
  if (!allUsers.length) { area.innerHTML = emptyHtml('👥', 'No users', 'Registered users will appear here.'); return; }
  area.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>
    ${allUsers.map(u => `<tr><td>${u.id}</td><td><b>${esc(u.name)}</b></td><td>${esc(u.email)}</td><td>${esc(u.phone || '-')}</td>
      <td><span class="status ${u.role === 'ADMIN' ? 'status-CONFIRMED' : 'status-PLACED'}">${u.role}</span></td>
      <td>${u.enabled ? '<span class="status status-DELIVERED">ACTIVE</span>' : '<span class="status status-CANCELLED">DISABLED</span>'}</td>
      <td>${fmtDay(u.createdAt)}</td>
      <td><div class="actions"><button class="btn btn-sm btn-ghost" onclick="viewUser(${u.id})">View</button>
        ${u.role === 'ADMIN' ? '' : `<button class="btn btn-sm ${u.enabled ? 'btn-danger' : 'btn-success'}" onclick="toggleUser(${u.id},${!u.enabled})">${u.enabled ? 'Disable' : 'Enable'}</button>`}</div></td></tr>`).join('')}
  </tbody></table></div>`;
}

async function toggleUser(id, enabled) {
  try {
    const updated = await api('/api/admin/users/' + id + '/status', { method: 'PUT', body: { enabled } });
    allUsers = allUsers.map(u => u.id === id ? updated : u);
    toast('User ' + (enabled ? 'enabled' : 'disabled'), 'success');
    renderUsers();
  } catch (e) { toast(e.message, 'error'); }
}

async function viewUser(id) {
  try {
    const u = await api('/api/admin/users/' + id);
    closeModal();
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-bg" id="modal" onclick="if(event.target===this)closeModal()"><div class="modal">
        <h2>${esc(u.name)}</h2>
        <div class="info-grid" style="grid-template-columns:1fr 1fr">
          <div><h4>User ID</h4>${u.id}</div><div><h4>Role</h4>${u.role}</div>
          <div><h4>Email</h4>${esc(u.email)}</div><div><h4>Phone</h4>${esc(u.phone || '-')}</div>
          <div><h4>Address</h4>${esc(u.address || '-')}</div><div><h4>Joined</h4>${fmtDate(u.createdAt)}</div>
          <div><h4>Status</h4>${u.enabled ? 'Active' : 'Disabled'}</div>
        </div>
        <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Close</button></div>
      </div></div>`);
  } catch (e) { toast(e.message, 'error'); }
}

async function initUsers() {
  try { allUsers = await api('/api/admin/users'); renderUsers(); }
  catch (e) { document.getElementById('usersArea').innerHTML = alertHtml(e.message); }
}
if (ACCESS_OK) initUsers();

/* Admin category management */
let allCategories = [];
function closeModal() { const m = document.getElementById('modal'); if (m) m.remove(); }

function renderCategories() {
  const area = document.getElementById('catArea');
  if (!allCategories.length) { area.innerHTML = emptyHtml('🗂️', 'No categories', 'Create your first category.'); return; }
  area.innerHTML = `<div class="table-wrap"><table><thead><tr><th>ID</th><th>Name</th><th>Description</th><th>Actions</th></tr></thead><tbody>
    ${allCategories.map(c => `<tr><td>${c.id}</td><td><b>${categoryIcon(c.name)} ${esc(c.name)}</b></td><td>${esc(c.description || '-')}</td>
      <td><div class="actions"><button class="btn btn-sm" onclick="openForm(${c.id})">Edit</button><button class="btn btn-sm btn-danger" onclick="deleteCategory(${c.id})">Delete</button></div></td></tr>`).join('')}
  </tbody></table></div>`;
}

function openForm(id) {
  const c = id ? allCategories.find(x => x.id === id) : null;
  closeModal();
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-bg" id="modal" onclick="if(event.target===this)closeModal()"><div class="modal">
      <h2>${c ? 'Edit' : 'Add'} Category</h2>
      <div id="msg"></div>
      <div class="form-group"><label for="cName">Name *</label><input class="form-control" id="cName" value="${esc(c ? c.name : '')}"></div>
      <div class="form-group"><label for="cDesc">Description</label><textarea class="form-control" id="cDesc">${esc(c ? c.description || '' : '')}</textarea></div>
      <div class="modal-actions"><button class="btn btn-ghost" onclick="closeModal()">Cancel</button><button class="btn" id="saveCat">Save</button></div>
    </div></div>`);
  document.getElementById('saveCat').addEventListener('click', async () => {
    const body = { name: document.getElementById('cName').value.trim(), description: document.getElementById('cDesc').value.trim() };
    if (!body.name) return document.getElementById('msg').innerHTML = alertHtml('Category name is required');
    try {
      await api(c ? '/api/categories/' + c.id : '/api/categories', { method: c ? 'PUT' : 'POST', body });
      closeModal(); toast('Category saved', 'success'); loadCategories();
    } catch (e) { document.getElementById('msg').innerHTML = alertHtml(e.message); }
  });
}

async function deleteCategory(id) {
  const c = allCategories.find(x => x.id === id);
  if (!confirm('Delete category "' + c.name + '"?')) return;
  try { await api('/api/categories/' + id, { method: 'DELETE' }); toast('Category deleted', 'success'); loadCategories(); }
  catch (e) { toast(e.message, 'error'); }
}

async function loadCategories() {
  try { allCategories = await api('/api/categories'); renderCategories(); }
  catch (e) { document.getElementById('catArea').innerHTML = alertHtml(e.message); }
}
if (ACCESS_OK) {
  document.getElementById('addCatBtn').addEventListener('click', () => openForm(null));
  loadCategories();
}

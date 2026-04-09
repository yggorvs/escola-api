let materias = [];

async function carregar() {
  showLoading('tabela-materias');
  try {
    materias = await apiFetch('/materias');
    render(materias);
  } catch (err) { showToast(err.message, 'error'); }
}

function render(lista) {
  const c = document.getElementById('tabela-materias');
  if (!lista.length) { showEmpty('tabela-materias', 'Nenhuma matéria cadastrada'); return; }
  c.innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr><th>Nome</th><th>Código</th><th>Carga Horária</th><th>Descrição</th><th>Ações</th></tr></thead>
        <tbody>
          ${lista.map(m => `
            <tr>
              <td style="font-weight:600">📚 ${m.nome}</td>
              <td>${m.codigo ? `<span class="badge badge-info">${m.codigo}</span>` : '—'}</td>
              <td>${m.cargaHoraria ? `${m.cargaHoraria}h` : '—'}</td>
              <td style="color:var(--text-muted)">${m.descricao || '—'}</td>
              <td><div class="flex gap-1">
                <button class="btn btn-outline btn-sm" onclick="editar(${m.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deletar(${m.id})">🗑️</button>
              </div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function abrirModal() {
  document.getElementById('modal-titulo').textContent = 'Nova Matéria';
  document.getElementById('mat-id').value = '';
  ['nome','codigo','descricao'].forEach(f => document.getElementById(`mat-${f}`).value = '');
  document.getElementById('mat-carga').value = '';
  openModal('modal-materia');
}

function editar(id) {
  const m = materias.find(x => x.id === id);
  if (!m) return;
  document.getElementById('modal-titulo').textContent = 'Editar Matéria';
  document.getElementById('mat-id').value = m.id;
  document.getElementById('mat-nome').value = m.nome;
  document.getElementById('mat-codigo').value = m.codigo || '';
  document.getElementById('mat-carga').value = m.cargaHoraria || '';
  document.getElementById('mat-descricao').value = m.descricao || '';
  openModal('modal-materia');
}

async function salvar() {
  const id = document.getElementById('mat-id').value;
  const nome = document.getElementById('mat-nome').value.trim();
  if (!nome) { showToast('Nome é obrigatório', 'error'); return; }

  const payload = {
    nome,
    codigo: document.getElementById('mat-codigo').value || null,
    cargaHoraria: parseInt(document.getElementById('mat-carga').value) || null,
    descricao: document.getElementById('mat-descricao').value || null,
  };

  const btn = document.getElementById('btn-salvar');
  btn.disabled = true;
  try {
    if (id) await apiFetch(`/materias/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await apiFetch('/materias', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Matéria salva!');
    closeModal('modal-materia');
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
  finally { btn.disabled = false; }
}

async function deletar(id) {
  const m = materias.find(x => x.id === id);
  if (!confirm(`Excluir "${m?.nome}"?`)) return;
  try {
    await apiFetch(`/materias/${id}`, { method: 'DELETE' });
    showToast('Matéria excluída');
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
}

document.addEventListener('DOMContentLoaded', carregar);

let professores = [];

async function carregarProfessores() {
  showLoading('tabela-professores');
  try {
    professores = await apiFetch('/professores');
    renderTabela(professores);
  } catch (err) {
    showToast('Erro ao carregar professores', 'error');
  }
}

function renderTabela(lista) {
  const container = document.getElementById('tabela-professores');
  if (!lista.length) { showEmpty('tabela-professores', 'Nenhum professor cadastrado'); return; }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr>
          <th>Professor</th><th>CPF</th><th>Especialidade</th><th>Contato</th><th>Status</th><th>Ações</th>
        </tr></thead>
        <tbody>
          ${lista.map(p => `
            <tr>
              <td><div class="flex items-center gap-1">
                <div class="avatar" style="background:linear-gradient(135deg,#8b5cf6,#6366f1)">${getInitials(p.nome)}</div>
                <div>
                  <div style="font-weight:600">${p.nome}</div>
                  ${p.email ? `<div style="font-size:12px;color:var(--text-muted)">${p.email}</div>` : ''}
                </div>
              </div></td>
              <td>${p.cpf || '—'}</td>
              <td>${p.especialidade ? `<span class="badge badge-purple">${p.especialidade}</span>` : '—'}</td>
              <td>${p.telefone || '—'}</td>
              <td>${p.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>'}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-outline btn-sm" onclick="editarProfessor(${p.id})">✏️</button>
                  <button class="btn btn-outline btn-sm" onclick="toggleAtivo(${p.id}, ${p.ativo})">${p.ativo ? '🚫' : '✅'}</button>
                  <button class="btn btn-danger btn-sm" onclick="deletar(${p.id})">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="padding:12px 16px;color:var(--text-muted);font-size:12px">${lista.length} professor(es) encontrado(s)</div>
  `;
}

function abrirModalNovo() {
  document.getElementById('modal-titulo').textContent = 'Novo Professor';
  document.getElementById('prof-id').value = '';
  ['nome','cpf','especialidade','email','telefone'].forEach(f => document.getElementById(`prof-${f}`).value = '');
  openModal('modal-professor');
}

function editarProfessor(id) {
  const p = professores.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-titulo').textContent = 'Editar Professor';
  document.getElementById('prof-id').value = p.id;
  document.getElementById('prof-nome').value = p.nome;
  document.getElementById('prof-cpf').value = p.cpf || '';
  document.getElementById('prof-especialidade').value = p.especialidade || '';
  document.getElementById('prof-email').value = p.email || '';
  document.getElementById('prof-telefone').value = p.telefone || '';
  openModal('modal-professor');
}

async function salvarProfessor() {
  const id = document.getElementById('prof-id').value;
  const nome = document.getElementById('prof-nome').value.trim();
  if (!nome) { showToast('Nome é obrigatório', 'error'); return; }

  const payload = {
    nome,
    cpf: document.getElementById('prof-cpf').value || null,
    especialidade: document.getElementById('prof-especialidade').value || null,
    email: document.getElementById('prof-email').value || null,
    telefone: document.getElementById('prof-telefone').value || null,
  };

  const btn = document.getElementById('btn-salvar');
  btn.disabled = true;
  try {
    if (id) await apiFetch(`/professores/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await apiFetch('/professores', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Professor salvo com sucesso!');
    closeModal('modal-professor');
    carregarProfessores();
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
  finally { btn.disabled = false; }
}

async function toggleAtivo(id, ativo) {
  try {
    await apiFetch(`/professores/${id}/toggle-ativo`, { method: 'PATCH' });
    showToast(ativo ? 'Professor desativado' : 'Professor ativado');
    carregarProfessores();
  } catch (err) { showToast(err.message, 'error'); }
}

async function deletar(id) {
  const p = professores.find(x => x.id === id);
  if (!confirm(`Excluir professor "${p?.nome}"?`)) return;
  try {
    await apiFetch(`/professores/${id}`, { method: 'DELETE' });
    showToast('Professor excluído');
    carregarProfessores();
  } catch (err) { showToast(err.message, 'error'); }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarProfessores();
  let timer;
  document.getElementById('input-busca').addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const busca = e.target.value.toLowerCase();
      renderTabela(professores.filter(p => p.nome.toLowerCase().includes(busca)));
    }, 300);
  });
});

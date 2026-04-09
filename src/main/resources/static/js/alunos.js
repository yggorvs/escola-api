let alunos = [];

async function carregarAlunos() {
  showLoading('tabela-alunos');
  try {
    alunos = await apiFetch('/alunos');
    renderTabela(alunos);
  } catch (err) {
    showToast('Erro ao carregar alunos', 'error');
    document.getElementById('tabela-alunos').innerHTML = `<div class="alert alert-danger">❌ ${err.message}</div>`;
  }
}

function renderTabela(lista) {
  const container = document.getElementById('tabela-alunos');
  if (!lista.length) { showEmpty('tabela-alunos', 'Nenhum aluno cadastrado'); return; }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr>
          <th>Aluno</th><th>Matrícula</th><th>Nascimento</th>
          <th>Contato</th><th>Status</th><th>Ações</th>
        </tr></thead>
        <tbody>
          ${lista.map(a => `
            <tr>
              <td><div class="flex items-center gap-1">
                <div class="avatar">${getInitials(a.nome)}</div>
                <div>
                  <div style="font-weight:600">${a.nome}</div>
                  ${a.email ? `<div style="font-size:12px;color:var(--text-muted)">${a.email}</div>` : ''}
                </div>
              </div></td>
              <td><span class="badge badge-gray">${a.matricula}</span></td>
              <td>${formatDate(a.dataNascimento)}</td>
              <td>${a.telefone || '—'}</td>
              <td>${a.ativo ? '<span class="badge badge-success">Ativo</span>' : '<span class="badge badge-gray">Inativo</span>'}</td>
              <td>
                <div class="flex gap-1">
                  <button class="btn btn-outline btn-sm" onclick="editarAluno(${a.id})">✏️</button>
                  <button class="btn btn-outline btn-sm" onclick="toggleAtivo(${a.id}, ${a.ativo})">${a.ativo ? '🚫' : '✅'}</button>
                  <button class="btn btn-danger btn-sm" onclick="deletarAluno(${a.id})">🗑️</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="padding:12px 16px;color:var(--text-muted);font-size:12px">${lista.length} aluno(s) encontrado(s)</div>
  `;
}

function abrirModalNovo() {
  document.getElementById('modal-titulo').textContent = 'Novo Aluno';
  document.getElementById('aluno-id').value = '';
  ['nome','matricula','email','telefone','endereco'].forEach(f => document.getElementById(`aluno-${f}`).value = '');
  document.getElementById('aluno-nascimento').value = '';
  openModal('modal-aluno');
  document.getElementById('aluno-nome').focus();
}

async function editarAluno(id) {
  const a = alunos.find(x => x.id === id);
  if (!a) return;
  document.getElementById('modal-titulo').textContent = 'Editar Aluno';
  document.getElementById('aluno-id').value = a.id;
  document.getElementById('aluno-nome').value = a.nome;
  document.getElementById('aluno-matricula').value = a.matricula;
  document.getElementById('aluno-nascimento').value = a.dataNascimento || '';
  document.getElementById('aluno-email').value = a.email || '';
  document.getElementById('aluno-telefone').value = a.telefone || '';
  document.getElementById('aluno-endereco').value = a.endereco || '';
  openModal('modal-aluno');
}

async function salvarAluno() {
  const id = document.getElementById('aluno-id').value;
  const nome = document.getElementById('aluno-nome').value.trim();
  const matricula = document.getElementById('aluno-matricula').value.trim();

  if (!nome || !matricula) { showToast('Nome e matrícula são obrigatórios', 'error'); return; }

  const payload = {
    nome,
    matricula,
    dataNascimento: document.getElementById('aluno-nascimento').value || null,
    email: document.getElementById('aluno-email').value || null,
    telefone: document.getElementById('aluno-telefone').value || null,
    endereco: document.getElementById('aluno-endereco').value || null,
  };

  const btn = document.getElementById('btn-salvar');
  btn.disabled = true; btn.textContent = 'Salvando...';

  try {
    if (id) {
      await apiFetch(`/alunos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Aluno atualizado com sucesso!');
    } else {
      await apiFetch('/alunos', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Aluno cadastrado com sucesso!');
    }
    closeModal('modal-aluno');
    carregarAlunos();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '💾 Salvar';
  }
}

async function toggleAtivo(id, ativo) {
  try {
    await apiFetch(`/alunos/${id}/toggle-ativo`, { method: 'PATCH' });
    showToast(ativo ? 'Aluno desativado' : 'Aluno ativado');
    carregarAlunos();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

async function deletarAluno(id) {
  const aluno = alunos.find(a => a.id === id);
  if (!confirm(`Deseja excluir "${aluno?.nome}"? Esta ação é irreversível.`)) return;
  try {
    await apiFetch(`/alunos/${id}`, { method: 'DELETE' });
    showToast('Aluno excluído');
    carregarAlunos();
  } catch (err) {
    showToast('Erro: ' + err.message, 'error');
  }
}

// Eventos de busca
document.addEventListener('DOMContentLoaded', () => {
  carregarAlunos();

  let timer;
  document.getElementById('input-busca').addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => filtrar(), 300);
  });
  document.getElementById('filtro-status').addEventListener('change', filtrar);
});

function filtrar() {
  const busca = document.getElementById('input-busca').value.toLowerCase();
  const status = document.getElementById('filtro-status').value;
  let lista = alunos.filter(a => {
    const matchNome = a.nome.toLowerCase().includes(busca) || a.matricula.toLowerCase().includes(busca);
    const matchStatus = !status || (status === 'ativo' ? a.ativo : !a.ativo);
    return matchNome && matchStatus;
  });
  renderTabela(lista);
}

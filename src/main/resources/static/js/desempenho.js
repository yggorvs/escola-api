let todasTurmas = [], turmasMateriais = [], todosAlunos2 = [];
let notas = [];

async function init() {
  document.getElementById('nota-data').value = new Date().toISOString().split('T')[0];
  try {
    [todasTurmas, todosAlunos2] = await Promise.all([apiFetch('/turmas'), apiFetch('/alunos')]);

    // Preencher selects dos filtros e modal
    const opts = '<option value="">Todas as turmas</option>' +
      todasTurmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
    document.getElementById('filtro-turma').innerHTML = opts;

    const modalOpts = '<option value="">Selecionar turma...</option>' +
      todasTurmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
    document.getElementById('nota-turma').innerHTML = modalOpts;

    carregarNotas();
  } catch (err) { showToast(err.message, 'error'); }
}

async function onFiltroTurmaChange() {
  const turmaId = document.getElementById('filtro-turma').value;
  const selMat = document.getElementById('filtro-materia');
  selMat.innerHTML = '<option value="">Todas as matérias</option>';

  if (turmaId) {
    const mats = await apiFetch(`/turmas/${turmaId}/materias`);
    mats.forEach(tm => {
      selMat.innerHTML += `<option value="${tm.id}">${tm.materia?.nome}</option>`;
    });
  }
  carregarNotas();
}

async function onModalTurmaChange() {
  const turmaId = document.getElementById('nota-turma').value;
  const selMat = document.getElementById('nota-turmamateriaId');
  const selAluno = document.getElementById('nota-aluno');
  selMat.innerHTML = '<option value="">Selecionar matéria...</option>';
  selAluno.innerHTML = '<option value="">Selecionar aluno...</option>';

  if (!turmaId) return;
  try {
    const [mats, alunos] = await Promise.all([
      apiFetch(`/turmas/${turmaId}/materias`),
      apiFetch(`/turmas/${turmaId}/alunos`)
    ]);
    mats.forEach(tm => selMat.innerHTML += `<option value="${tm.id}">${tm.materia?.nome}</option>`);
    alunos.forEach(a => selAluno.innerHTML += `<option value="${a.id}">${a.nome}</option>`);
  } catch (err) { showToast(err.message, 'error'); }
}

async function carregarNotas() {
  showLoading('tabela-notas');
  try {
    const turmaMateriaId = document.getElementById('filtro-materia').value;
    const url = turmaMateriaId ? `/desempenhos?turmaMateriaId=${turmaMateriaId}` : '/desempenhos';
    notas = await apiFetch(url);
    renderTabela(notas);
  } catch (err) { showToast(err.message, 'error'); }
}

function renderTabela(lista) {
  const c = document.getElementById('tabela-notas');
  if (!lista.length) { showEmpty('tabela-notas', 'Nenhuma nota lançada'); return; }

  c.innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr>
          <th>Aluno</th><th>Matéria</th><th>Turma</th><th>Tipo</th><th>Nota</th><th>Data</th><th>Situação</th><th>Ações</th>
        </tr></thead>
        <tbody>
          ${lista.map(n => `
            <tr>
              <td><div class="flex items-center gap-1">
                <div class="avatar" style="width:28px;height:28px;font-size:11px">${getInitials(n.aluno?.nome)}</div>
                ${n.aluno?.nome}
              </div></td>
              <td>${n.turmaMateria?.materia?.nome || '—'}</td>
              <td><span class="badge badge-gray">${n.turmaMateria?.turma?.nome || '—'}</span></td>
              <td>${n.tipo ? `<span class="badge badge-purple">${n.tipo}</span>` : '—'}</td>
              <td>${notaBadge(n.nota)}</td>
              <td>${formatDate(n.data)}</td>
              <td>${situacaoBadge(n.nota >= 5 ? 'APROVADO' : 'REPROVADO')}</td>
              <td><div class="flex gap-1">
                <button class="btn btn-outline btn-sm" onclick="editarNota(${n.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deletarNota(${n.id})">🗑️</button>
              </div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    <div style="padding:12px 16px;color:var(--text-muted);font-size:12px">
      ${lista.length} nota(s) ·
      Média geral: ${(lista.reduce((s, n) => s + n.nota, 0) / lista.length).toFixed(1)}
    </div>
  `;
}

async function editarNota(id) {
  const n = notas.find(x => x.id === id);
  if (!n) return;
  document.getElementById('nota-titulo').textContent = 'Editar Nota';
  document.getElementById('nota-id').value = n.id;

  // Selecionar turma e carregar dependentes
  document.getElementById('nota-turma').value = n.turmaMateria?.turma?.id || '';
  await onModalTurmaChange();
  document.getElementById('nota-turmamateriaId').value = n.turmaMateria?.id || '';
  document.getElementById('nota-aluno').value = n.aluno?.id || '';
  document.getElementById('nota-valor').value = n.nota;
  document.getElementById('nota-tipo').value = n.tipo || '';
  document.getElementById('nota-data').value = n.data || '';
  document.getElementById('nota-descricao').value = n.descricao || '';
  openModal('modal-nota');
}

async function salvarNota() {
  const id = document.getElementById('nota-id').value;
  const alunoId = document.getElementById('nota-aluno').value;
  const turmaMateriaId = document.getElementById('nota-turmamateriaId').value;
  const nota = parseFloat(document.getElementById('nota-valor').value);

  if (!alunoId || !turmaMateriaId || isNaN(nota)) {
    showToast('Aluno, matéria e nota são obrigatórios', 'error'); return;
  }
  if (nota < 0 || nota > 10) { showToast('Nota deve ser entre 0 e 10', 'error'); return; }

  const payload = {
    aluno: { id: parseInt(alunoId) },
    turmaMateria: { id: parseInt(turmaMateriaId) },
    nota,
    tipo: document.getElementById('nota-tipo').value || null,
    data: document.getElementById('nota-data').value || null,
    descricao: document.getElementById('nota-descricao').value || null,
  };

  const btn = document.getElementById('btn-salvar-nota');
  btn.disabled = true;
  try {
    if (id) await apiFetch(`/desempenhos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await apiFetch('/desempenhos', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Nota salva!');
    closeModal('modal-nota');
    document.getElementById('nota-id').value = '';
    document.getElementById('nota-titulo').textContent = 'Lançar Nota';
    carregarNotas();
  } catch (err) { showToast(err.message, 'error'); }
  finally { btn.disabled = false; }
}

async function deletarNota(id) {
  if (!confirm('Excluir esta nota?')) return;
  try {
    await apiFetch(`/desempenhos/${id}`, { method: 'DELETE' });
    showToast('Nota excluída');
    carregarNotas();
  } catch (err) { showToast(err.message, 'error'); }
}

document.addEventListener('DOMContentLoaded', init);

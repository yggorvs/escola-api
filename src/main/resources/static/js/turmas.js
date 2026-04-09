let turmas = [], todosAlunos = [], todosProfessores = [], todasMaterias = [], todosCursos = [];
let turmaAtualId = null;

async function carregar() {
  try {
    [turmas, todosAlunos, todosProfessores, todasMaterias, todosCursos] = await Promise.all([
      apiFetch('/turmas'), apiFetch('/alunos'),
      apiFetch('/professores'), apiFetch('/materias'),
      apiFetch('/cursos')
    ]);

    // Preencher select de cursos no modal
    const selCurso = document.getElementById('turma-curso');
    selCurso.innerHTML = '<option value="">Sem curso vinculado</option>' +
      todosCursos.filter(c => c.ativo).map(c =>
        `<option value="${c.id}">${c.nome}${c.duracao ? ' (' + c.duracao + ' sem.)' : ''}</option>`
      ).join('');

    renderTurmas();
  } catch (err) { showToast(err.message, 'error'); }
}

function renderTurmas() {
  const c = document.getElementById('lista-turmas');
  if (!turmas.length) { showEmpty('lista-turmas', 'Nenhuma turma cadastrada'); return; }

  c.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px">
      ${turmas.map(t => {
        const curso = t.curso ? `<span class="badge badge-purple">🎯 ${t.curso.nome}</span>` : '';
        return `
        <div class="card" style="padding:20px">
          <div class="flex justify-between items-center mb-2">
            <div style="font-size:18px;font-weight:700">🏫 ${t.nome}</div>
            <div class="flex gap-1">
              <button class="btn btn-outline btn-sm" onclick="editarTurma(${t.id})">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="deletarTurma(${t.id})">🗑️</button>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
            ${curso}
            ${t.ano ? `<span class="badge badge-info">${t.ano}</span>` : ''}
            ${t.semestre ? `<span class="badge badge-gray">${t.semestre}</span>` : ''}
            ${t.periodo ? `<span class="badge badge-gray">${t.periodo}</span>` : ''}
          </div>
          <div style="color:var(--text-muted);font-size:13px;margin-bottom:12px">
            👥 ${(t.alunos || []).length} aluno(s)
          </div>
          <button class="btn btn-outline" style="width:100%" onclick="gerenciar(${t.id})">⚙️ Gerenciar</button>
        </div>`;
      }).join('')}
    </div>
  `;
}

function abrirModalNova() {
  document.getElementById('modal-titulo').textContent = 'Nova Turma';
  document.getElementById('turma-id').value = '';
  document.getElementById('turma-nome').value = '';
  document.getElementById('turma-curso').value = '';
  document.getElementById('turma-ano').value = new Date().getFullYear();
  document.getElementById('turma-semestre').value = '';
  document.getElementById('turma-periodo').value = '';
  openModal('modal-turma');
}

function editarTurma(id) {
  const t = turmas.find(x => x.id === id);
  if (!t) return;
  document.getElementById('modal-titulo').textContent = 'Editar Turma';
  document.getElementById('turma-id').value = t.id;
  document.getElementById('turma-nome').value = t.nome;
  document.getElementById('turma-curso').value = t.curso?.id || '';
  document.getElementById('turma-ano').value = t.ano || '';
  document.getElementById('turma-semestre').value = t.semestre || '';
  document.getElementById('turma-periodo').value = t.periodo || '';
  openModal('modal-turma');
}

async function salvarTurma() {
  const id = document.getElementById('turma-id').value;
  const nome = document.getElementById('turma-nome').value.trim();
  if (!nome) { showToast('Nome é obrigatório', 'error'); return; }

  const cursoId = document.getElementById('turma-curso').value;
  const payload = {
    nome,
    cursoId: cursoId ? parseInt(cursoId) : null,
    ano: parseInt(document.getElementById('turma-ano').value) || null,
    semestre: document.getElementById('turma-semestre').value || null,
    periodo: document.getElementById('turma-periodo').value || null,
  };

  const btn = document.getElementById('btn-salvar');
  btn.disabled = true;
  try {
    if (id) await apiFetch(`/turmas/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await apiFetch('/turmas', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Turma salva!');
    closeModal('modal-turma');
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
  finally { btn.disabled = false; }
}

async function deletarTurma(id) {
  const t = turmas.find(x => x.id === id);
  if (!confirm(`Excluir turma "${t?.nome}"?`)) return;
  try {
    await apiFetch(`/turmas/${id}`, { method: 'DELETE' });
    showToast('Turma excluída');
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
}

async function gerenciar(id) {
  turmaAtualId = id;
  const t = turmas.find(x => x.id === id);
  document.getElementById('gerenciar-titulo').textContent = `⚙️ ${t?.nome}`;

  // Preencher selects
  const selectAluno = document.getElementById('select-aluno-add');
  selectAluno.innerHTML = '<option value="">Selecionar aluno...</option>' +
    todosAlunos.filter(a => a.ativo).map(a => `<option value="${a.id}">${a.nome} (${a.matricula})</option>`).join('');

  const selectMat = document.getElementById('select-materia-add');
  selectMat.innerHTML = '<option value="">Selecionar matéria...</option>' +
    todasMaterias.map(m => `<option value="${m.id}">${m.nome}</option>`).join('');

  const selectProf = document.getElementById('select-prof-add');
  selectProf.innerHTML = '<option value="">Professor (opcional)...</option>' +
    todosProfessores.filter(p => p.ativo).map(p => `<option value="${p.id}">${p.nome}</option>`).join('');

  openModal('modal-gerenciar');
  mostrarTab('alunos');
  await carregarAlunosTurma();
  await carregarMateriasTurma();
}

function mostrarTab(tab) {
  document.getElementById('tab-alunos').classList.toggle('hidden', tab !== 'alunos');
  document.getElementById('tab-materias').classList.toggle('hidden', tab !== 'materias');
  document.getElementById('tab-alunos-btn').className = `btn btn-sm ${tab === 'alunos' ? 'btn-primary' : 'btn-outline'}`;
  document.getElementById('tab-materias-btn').className = `btn btn-sm ${tab === 'materias' ? 'btn-primary' : 'btn-outline'}`;
}

async function carregarAlunosTurma() {
  try {
    const alunos = await apiFetch(`/turmas/${turmaAtualId}/alunos`);
    const container = document.getElementById('lista-alunos-turma');
    if (!alunos.length) {
      container.innerHTML = '<div class="empty-state" style="padding:20px"><p>Nenhum aluno na turma</p></div>';
      return;
    }
    container.innerHTML = alunos.map(a => `
      <div class="attendance-item">
        <div class="avatar">${getInitials(a.nome)}</div>
        <div class="flex-1"><div style="font-weight:600">${a.nome}</div>
          <div style="font-size:12px;color:var(--text-muted)">${a.matricula}</div></div>
        <button class="btn btn-danger btn-sm" onclick="removerAluno(${a.id})">Remover</button>
      </div>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function carregarMateriasTurma() {
  try {
    const mats = await apiFetch(`/turmas/${turmaAtualId}/materias`);
    const container = document.getElementById('lista-materias-turma');
    if (!mats.length) {
      container.innerHTML = '<div class="empty-state" style="padding:20px"><p>Nenhuma matéria na turma</p></div>';
      return;
    }
    container.innerHTML = mats.map(tm => `
      <div class="attendance-item">
        <span style="font-size:18px">📚</span>
        <div class="flex-1">
          <div style="font-weight:600">${tm.materia?.nome}</div>
          <div style="font-size:12px;color:var(--text-muted)">${tm.professor ? '👨‍🏫 ' + tm.professor.nome : 'Sem professor'}</div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="removerMateria(${tm.id})">Remover</button>
      </div>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function adicionarAluno() {
  const alunoId = document.getElementById('select-aluno-add').value;
  if (!alunoId) { showToast('Selecione um aluno', 'error'); return; }
  try {
    await apiFetch(`/turmas/${turmaAtualId}/alunos/${alunoId}`, { method: 'POST' });
    showToast('Aluno adicionado!');
    await carregarAlunosTurma();
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
}

async function removerAluno(alunoId) {
  try {
    await apiFetch(`/turmas/${turmaAtualId}/alunos/${alunoId}`, { method: 'DELETE' });
    showToast('Aluno removido');
    await carregarAlunosTurma();
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
}

async function adicionarMateria() {
  const materiaId = document.getElementById('select-materia-add').value;
  const professorId = document.getElementById('select-prof-add').value;
  if (!materiaId) { showToast('Selecione uma matéria', 'error'); return; }
  try {
    await apiFetch(`/turmas/${turmaAtualId}/materias`, {
      method: 'POST',
      body: JSON.stringify({ materiaId: parseInt(materiaId), professorId: professorId ? parseInt(professorId) : null })
    });
    showToast('Matéria adicionada!');
    await carregarMateriasTurma();
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
}

async function removerMateria(turmaMateriaId) {
  try {
    await apiFetch(`/turmas/${turmaAtualId}/materias/${turmaMateriaId}`, { method: 'DELETE' });
    showToast('Matéria removida');
    await carregarMateriasTurma();
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
}

document.addEventListener('DOMContentLoaded', carregar);

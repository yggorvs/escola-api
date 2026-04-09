let cursos = [], todasMaterias = [];
let cursoAtualId = null;

async function carregar() {
  try {
    [cursos, todasMaterias] = await Promise.all([
      apiFetch('/cursos'),
      apiFetch('/materias')
    ]);
    renderCursos(cursos);
    // Preencher select de matérias do modal
    const sel = document.getElementById('grade-materia-select');
    sel.innerHTML = '<option value="">Selecionar matéria...</option>' +
      todasMaterias.map(m => `<option value="${m.id}">${m.nome}${m.codigo ? ' (' + m.codigo + ')' : ''}</option>`).join('');
  } catch (err) { showToast('Erro ao carregar cursos: ' + err.message, 'error'); }
}

function renderCursos(lista) {
  const c = document.getElementById('lista-cursos');
  if (!lista.length) { showEmpty('lista-cursos', 'Nenhum curso cadastrado'); return; }

  c.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">` +
    lista.map(curso => {
      const semestreLabel = curso.duracao
        ? `${curso.duracao} semestre${curso.duracao > 1 ? 's' : ''}`
        : 'Duração não definida';
      return `
        <div class="card" style="padding:20px;${!curso.ativo ? 'opacity:.65' : ''}">
          <div class="flex justify-between items-center mb-2">
            <div style="font-size:17px;font-weight:700">🎯 ${curso.nome}</div>
            <div class="flex gap-1">
              <button class="btn btn-outline btn-sm" onclick="editarCurso(${curso.id})">✏️</button>
              <button class="btn btn-outline btn-sm" onclick="toggleAtivo(${curso.id}, ${curso.ativo})"
                title="${curso.ativo ? 'Desativar' : 'Ativar'}">${curso.ativo ? '🚫' : '✅'}</button>
              <button class="btn btn-danger btn-sm" onclick="deletar(${curso.id})">🗑️</button>
            </div>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
            <span class="badge badge-info">⏱ ${semestreLabel}</span>
            ${curso.ativo
              ? '<span class="badge badge-success">● Ativo</span>'
              : '<span class="badge badge-gray">● Inativo</span>'}
          </div>
          ${curso.descricao
            ? `<div style="font-size:13px;color:var(--text-muted);margin-bottom:12px">${curso.descricao}</div>`
            : ''}
          <button class="btn btn-outline" style="width:100%" onclick="abrirGrade(${curso.id}, '${curso.nome.replace(/'/g,"\\'")}')">
            📋 Ver Grade Curricular
          </button>
        </div>`;
    }).join('') + '</div>';
}

function abrirModalNovo() {
  document.getElementById('modal-titulo').textContent = 'Novo Curso';
  document.getElementById('curso-id').value = '';
  document.getElementById('curso-nome').value = '';
  document.getElementById('curso-descricao').value = '';
  document.getElementById('curso-duracao').value = '';
  openModal('modal-curso');
  document.getElementById('curso-nome').focus();
}

function editarCurso(id) {
  const c = cursos.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-titulo').textContent = 'Editar Curso';
  document.getElementById('curso-id').value = c.id;
  document.getElementById('curso-nome').value = c.nome;
  document.getElementById('curso-descricao').value = c.descricao || '';
  document.getElementById('curso-duracao').value = c.duracao || '';
  openModal('modal-curso');
}

async function salvarCurso() {
  const id = document.getElementById('curso-id').value;
  const nome = document.getElementById('curso-nome').value.trim();
  if (!nome) { showToast('Nome é obrigatório', 'error'); return; }

  const payload = {
    nome,
    descricao: document.getElementById('curso-descricao').value || null,
    duracao: parseInt(document.getElementById('curso-duracao').value) || null,
  };

  const btn = document.getElementById('btn-salvar');
  btn.disabled = true;
  try {
    if (id) await apiFetch(`/cursos/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    else await apiFetch('/cursos', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Curso salvo com sucesso!');
    closeModal('modal-curso');
    carregar();
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
  finally { btn.disabled = false; }
}

async function toggleAtivo(id, ativo) {
  try {
    await apiFetch(`/cursos/${id}/toggle-ativo`, { method: 'PATCH' });
    showToast(ativo ? 'Curso desativado' : 'Curso ativado');
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
}

async function deletar(id) {
  const c = cursos.find(x => x.id === id);
  if (!confirm(`Excluir o curso "${c?.nome}"? As turmas vinculadas perderão a referência ao curso.`)) return;
  try {
    await apiFetch(`/cursos/${id}`, { method: 'DELETE' });
    showToast('Curso excluído');
    carregar();
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Grade Curricular ──────────────────────────────────────────────────
async function abrirGrade(id, nome) {
  cursoAtualId = id;
  const curso = cursos.find(c => c.id === id);
  document.getElementById('grade-titulo').textContent = `📋 ${nome}`;
  // Prefill semestre máximo baseado na duração
  document.getElementById('grade-semestre').max = curso?.duracao || 20;
  openModal('modal-grade');
  mostrarTabGrade('grade');
  await carregarGrade();
}

function mostrarTabGrade(tab) {
  document.getElementById('tab-grade').classList.toggle('hidden', tab !== 'grade');
  document.getElementById('tab-turmas').classList.toggle('hidden', tab !== 'turmas');
  document.getElementById('tab-grade-btn').className = `btn btn-sm ${tab === 'grade' ? 'btn-primary' : 'btn-outline'}`;
  document.getElementById('tab-turmas-btn').className = `btn btn-sm ${tab === 'turmas' ? 'btn-primary' : 'btn-outline'}`;
  if (tab === 'turmas') carregarTurmasCurso();
}

async function carregarGrade() {
  const container = document.getElementById('lista-grade-materias');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const grade = await apiFetch(`/cursos/${cursoAtualId}/materias`);
    if (!grade.length) {
      container.innerHTML = '<div class="empty-state" style="padding:24px"><div class="empty-state-icon">📭</div><p>Nenhuma matéria na grade. Adicione acima.</p></div>';
      return;
    }

    // Agrupar por semestre
    const porSemestre = {};
    grade.forEach(item => {
      const sem = item.semestre || 0;
      if (!porSemestre[sem]) porSemestre[sem] = [];
      porSemestre[sem].push(item);
    });

    container.innerHTML = Object.keys(porSemestre).sort((a, b) => a - b).map(sem => `
      <div style="margin-bottom:16px">
        <div style="font-weight:700;font-size:13px;color:var(--primary);margin-bottom:8px;padding:6px 12px;
                    background:rgba(99,102,241,.12);border-radius:6px;border-left:3px solid var(--primary)">
          ${parseInt(sem) === 0 ? '📌 Sem semestre definido' : `📅 ${sem}º Semestre`}
        </div>
        ${porSemestre[sem].map(item => `
          <div class="attendance-item" style="margin-bottom:6px">
            <span style="font-size:18px">📚</span>
            <div class="flex-1">
              <div style="font-weight:600">${item.materia?.nome}</div>
              <div style="font-size:12px;color:var(--text-muted)">
                ${item.materia?.codigo ? item.materia.codigo + ' · ' : ''}
                ${item.materia?.cargaHoraria ? item.materia.cargaHoraria + 'h · ' : ''}
                ${item.obrigatoria ? '<span style="color:#10b981">Obrigatória</span>' : '<span style="color:#f59e0b">Eletiva</span>'}
              </div>
            </div>
            <button class="btn btn-danger btn-sm" onclick="removerDaGrade(${item.id})">Remover</button>
          </div>
        `).join('')}
      </div>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function adicionarMateriaGrade() {
  const materiaId = document.getElementById('grade-materia-select').value;
  const semestre = parseInt(document.getElementById('grade-semestre').value) || 1;
  const obrigatoria = document.getElementById('grade-obrigatoria').value === 'true';

  if (!materiaId) { showToast('Selecione uma matéria', 'error'); return; }

  try {
    await apiFetch(`/cursos/${cursoAtualId}/materias`, {
      method: 'POST',
      body: JSON.stringify({ materiaId: parseInt(materiaId), semestre, obrigatoria })
    });
    showToast('Matéria adicionada à grade!');
    await carregarGrade();
  } catch (err) { showToast(err.message, 'error'); }
}

async function removerDaGrade(cmId) {
  if (!confirm('Remover esta matéria da grade?')) return;
  try {
    await apiFetch(`/cursos/${cursoAtualId}/materias/${cmId}`, { method: 'DELETE' });
    showToast('Matéria removida da grade');
    await carregarGrade();
  } catch (err) { showToast(err.message, 'error'); }
}

async function carregarTurmasCurso() {
  const container = document.getElementById('lista-turmas-curso');
  container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const turmas = await apiFetch(`/cursos/${cursoAtualId}/turmas`);
    if (!turmas.length) {
      container.innerHTML = '<div class="empty-state" style="padding:24px"><p>Nenhuma turma vinculada a este curso.</p><a href="turmas.html" class="btn btn-outline" style="margin-top:12px">Ir para Turmas</a></div>';
      return;
    }
    container.innerHTML = turmas.map(t => `
      <div class="attendance-item" style="margin-bottom:6px">
        <span style="font-size:18px">🏫</span>
        <div class="flex-1">
          <div style="font-weight:600">${t.nome}</div>
          <div style="font-size:12px;color:var(--text-muted)">
            ${[t.ano, t.semestre, t.periodo].filter(Boolean).join(' · ')}
            · 👥 ${t.totalAlunos} aluno(s)
          </div>
        </div>
        <a href="turmas.html" class="btn btn-outline btn-sm">Ver</a>
      </div>
    `).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

// Filtros
document.addEventListener('DOMContentLoaded', () => {
  carregar();
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
  renderCursos(cursos.filter(c => {
    const matchNome = c.nome.toLowerCase().includes(busca);
    const matchStatus = !status || (status === 'ativo' ? c.ativo : !c.ativo);
    return matchNome && matchStatus;
  }));
}

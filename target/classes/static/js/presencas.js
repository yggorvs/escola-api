let turmasMaterias = [];
let alunosDaTurma = [];
let presencasExistentes = [];
let estadoPresenca = {}; // { alunoId: boolean }

async function init() {
  // Definir data como hoje
  document.getElementById('sel-data').value = new Date().toISOString().split('T')[0];

  // Carregar turmas
  try {
    const turmas = await apiFetch('/turmas');
    const sel = document.getElementById('sel-turma');
    sel.innerHTML = '<option value="">Selecionar turma...</option>' +
      turmas.map(t => `<option value="${t.id}">${t.nome}</option>`).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function onTurmaChange() {
  const turmaId = document.getElementById('sel-turma').value;
  const selMateria = document.getElementById('sel-materia');
  selMateria.innerHTML = '<option value="">Selecionar matéria...</option>';
  document.getElementById('card-presenca').style.display = 'none';

  if (!turmaId) return;

  try {
    const [materias, alunos] = await Promise.all([
      apiFetch(`/turmas/${turmaId}/materias`),
      apiFetch(`/turmas/${turmaId}/alunos`)
    ]);
    turmasMaterias = materias;
    alunosDaTurma = alunos;

    selMateria.innerHTML = '<option value="">Selecionar matéria...</option>' +
      materias.map(tm => `<option value="${tm.id}">${tm.materia?.nome}${tm.professor ? ' — ' + tm.professor.nome : ''}</option>`).join('');
  } catch (err) { showToast(err.message, 'error'); }
}

async function carregarListaPresenca() {
  const turmaMateriaId = document.getElementById('sel-materia').value;
  const data = document.getElementById('sel-data').value;

  if (!turmaMateriaId || !data) return;

  const tm = turmasMaterias.find(x => x.id == turmaMateriaId);
  document.getElementById('card-presenca').style.display = 'block';
  document.getElementById('presenca-titulo').textContent = `📋 ${tm?.materia?.nome || 'Lista de Presença'}`;
  document.getElementById('presenca-subtitulo').textContent = `Data: ${formatDate(data)} · ${alunosDaTurma.length} alunos`;

  // Carregar presenças existentes
  try {
    presencasExistentes = await apiFetch(`/presencas?turmaMateriaId=${turmaMateriaId}&data=${data}`);
  } catch { presencasExistentes = []; }

  // Iniciar estado
  estadoPresenca = {};
  alunosDaTurma.forEach(a => {
    const pExistente = presencasExistentes.find(p => p.aluno?.id === a.id);
    estadoPresenca[a.id] = pExistente ? pExistente.presente : false;
  });

  renderListaPresenca();
}

function renderListaPresenca() {
  const container = document.getElementById('lista-presenca');
  if (!alunosDaTurma.length) {
    container.innerHTML = `<div class="empty-state" style="padding:24px"><p>Nenhum aluno nesta turma</p></div>`;
    atualizarResumo();
    return;
  }

  container.innerHTML = `<div style="padding:16px">` +
    alunosDaTurma.map(a => `
      <div class="attendance-item ${estadoPresenca[a.id] ? 'presente' : 'ausente'}" id="item-${a.id}" onclick="togglePresenca(${a.id})">
        <div class="checkbox-custom ${estadoPresenca[a.id] ? 'checked' : ''}" id="chk-${a.id}">
          ${estadoPresenca[a.id] ? '✓' : ''}
        </div>
        <div class="avatar">${getInitials(a.nome)}</div>
        <div class="flex-1">
          <div style="font-weight:600">${a.nome}</div>
          <div style="font-size:12px;color:var(--text-muted)">${a.matricula}</div>
        </div>
        <span class="badge ${estadoPresenca[a.id] ? 'badge-success' : 'badge-danger'}">
          ${estadoPresenca[a.id] ? '✓ Presente' : '✗ Ausente'}
        </span>
      </div>
    `).join('') + '</div>';

  atualizarResumo();
}

function togglePresenca(alunoId) {
  estadoPresenca[alunoId] = !estadoPresenca[alunoId];
  renderListaPresenca();
}

function marcarTodos(valor) {
  alunosDaTurma.forEach(a => estadoPresenca[a.id] = valor);
  renderListaPresenca();
}

function atualizarResumo() {
  const total = alunosDaTurma.length;
  const presentes = Object.values(estadoPresenca).filter(Boolean).length;
  const ausentes = total - presentes;
  const pct = total > 0 ? Math.round(presentes * 100 / total) : 0;

  document.getElementById('resumo-presenca').innerHTML = `
    <span class="badge badge-success">✅ Presentes: ${presentes}</span>
    <span class="badge badge-danger">❌ Ausentes: ${ausentes}</span>
    <span class="badge badge-info">📊 Frequência: ${pct}%</span>
    <span style="color:var(--text-muted)">Total: ${total} alunos</span>
  `;
}

async function salvarPresencas() {
  const turmaMateriaId = parseInt(document.getElementById('sel-materia').value);
  const data = document.getElementById('sel-data').value;

  if (!turmaMateriaId || !data || !alunosDaTurma.length) {
    showToast('Selecione turma, matéria e data', 'error'); return;
  }

  const btn = document.getElementById('btn-salvar-presenca');
  btn.disabled = true; btn.textContent = 'Salvando...';

  try {
    // Deletar presenças existentes e criar novas
    for (const p of presencasExistentes) {
      await apiFetch(`/presencas/${p.id}`, { method: 'DELETE' });
    }

    const payload = alunosDaTurma.map(a => ({
      aluno: { id: a.id },
      turmaMateria: { id: turmaMateriaId },
      data,
      presente: estadoPresenca[a.id] || false
    }));

    await apiFetch('/presencas/lote', { method: 'POST', body: JSON.stringify(payload) });
    showToast(`Presenças salvas! ${Object.values(estadoPresenca).filter(Boolean).length} presente(s)`);
    await carregarListaPresenca();
  } catch (err) { showToast('Erro: ' + err.message, 'error'); }
  finally { btn.disabled = false; btn.innerHTML = '💾 Salvar'; }
}

document.addEventListener('DOMContentLoaded', init);

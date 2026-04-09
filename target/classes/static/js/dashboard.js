// ── Estado dos filtros ────────────────────────────────────────────────
const filtros = { periodo: 'all', dataInicio: null, dataFim: null, turmaId: null, materiaId: null };
let chartFreq = null, chartDesemp = null;

// ── Monta query string a partir dos filtros ativos ───────────────────
function buildQS(extra = {}) {
  const p = { ...extra };
  if (filtros.dataInicio) p.dataInicio = filtros.dataInicio;
  if (filtros.dataFim)    p.dataFim    = filtros.dataFim;
  if (filtros.turmaId)    p.turmaId    = filtros.turmaId;
  if (filtros.materiaId)  p.materiaId  = filtros.materiaId;
  const qs = new URLSearchParams(p).toString();
  return qs ? '?' + qs : '';
}

// ── Controles de Período ──────────────────────────────────────────────
function setPeriodo(tipo) {
  filtros.periodo = tipo;
  const hoje = new Date();
  const Y = hoje.getFullYear(), M = hoje.getMonth(); // 0-indexed
  const pad = n => String(n).padStart(2, '0');
  const iso = d => d.toISOString().split('T')[0];

  document.getElementById('custom-dates').classList.toggle('hidden', tipo !== 'custom');

  switch (tipo) {
    case 'all':
      filtros.dataInicio = null; filtros.dataFim = null; break;
    case 'month':
      filtros.dataInicio = `${Y}-${pad(M + 1)}-01`;
      filtros.dataFim    = iso(hoje); break;
    case 'semester':
      filtros.dataInicio = M < 6 ? `${Y}-01-01` : `${Y}-07-01`;
      filtros.dataFim    = iso(hoje); break;
    case 'year':
      filtros.dataInicio = `${Y}-01-01`;
      filtros.dataFim    = iso(hoje); break;
    case 'custom':
      // datas definidas pelo usuário via input
      return; // sem reload automático, aguardar inputs
  }

  document.querySelectorAll('.btn-period').forEach(b =>
    b.classList.toggle('active', b.dataset.periodo === tipo));

  loadDashboard();
}

function aplicarCustom() {
  filtros.dataInicio = document.getElementById('data-inicio').value || null;
  filtros.dataFim    = document.getElementById('data-fim').value   || null;
  if (filtros.dataInicio && filtros.dataFim) loadDashboard();
}

// ── Controles de Turma / Matéria ──────────────────────────────────────
function setFiltroTurma(valor) {
  filtros.turmaId = valor || null;
  const secao = document.getElementById('secao-turma');
  if (filtros.turmaId) {
    secao.classList.remove('hidden');
    carregarTurmaDetalhes();
  } else {
    secao.classList.add('hidden');
  }
  loadDashboard();
}

function setFiltroMateria(valor) {
  filtros.materiaId = valor || null;
  const secao = document.getElementById('secao-materia');
  if (filtros.materiaId) {
    secao.classList.remove('hidden');
    carregarMateriaDetalhes();
  } else {
    secao.classList.add('hidden');
  }
  loadDashboard();
}

function limparFiltros() {
  filtros.periodo = 'all'; filtros.dataInicio = null; filtros.dataFim = null;
  filtros.turmaId = null;  filtros.materiaId  = null;
  document.getElementById('filtro-turma').value   = '';
  document.getElementById('filtro-materia').value = '';
  document.getElementById('custom-dates').classList.add('hidden');
  document.querySelectorAll('.btn-period').forEach(b =>
    b.classList.toggle('active', b.dataset.periodo === 'all'));
  document.getElementById('secao-turma').classList.add('hidden');
  document.getElementById('secao-materia').classList.add('hidden');
  loadDashboard();
}

// ── Carregamento principal ────────────────────────────────────────────
async function loadDashboard() {
  try {
    const qs = buildQS();
    const [stats, frequencia, desempenho, baixaFreq] = await Promise.all([
      apiFetch('/dashboard/estatisticas'),
      apiFetch('/dashboard/frequencia-turmas' + buildQS()),
      apiFetch('/dashboard/desempenho-materias' + buildQS()),
      apiFetch('/dashboard/alunos-baixa-frequencia' + buildQS()),
    ]);
    renderStats(stats);
    renderChartFrequencia(frequencia);
    renderChartDesempenho(desempenho);
    renderBaixaFrequencia(baixaFreq);

    // Atualizar subtítulos dos gráficos de acordo com filtros
    const periodoLabel = filtros.dataInicio
      ? `${filtros.dataInicio} → ${filtros.dataFim}`
      : 'Todo o período';
    document.getElementById('sub-freq').textContent   = periodoLabel;
    document.getElementById('sub-desemp').textContent = periodoLabel;

  } catch (err) { showToast('Erro ao carregar dashboard: ' + err.message, 'error'); }
}

// ── Análise por Turma ─────────────────────────────────────────────────
async function carregarTurmaDetalhes() {
  const wrapper = document.getElementById('tabela-turma-wrapper');
  wrapper.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    // Só turmaId como query param (não materiaId); dataInicio/dataFim incluídos
    const params = new URLSearchParams({ turmaId: filtros.turmaId });
    if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
    if (filtros.dataFim)    params.set('dataFim',    filtros.dataFim);

    const data = await apiFetch('/dashboard/turma-detalhes?' + params.toString());

    document.getElementById('turma-titulo').textContent = data.turmaNome;

    if (!data.alunos?.length) {
      wrapper.innerHTML = '<div class="empty-state" style="padding:24px"><p>Nenhum aluno nesta turma com dados disponíveis.</p></div>';
      return;
    }

    wrapper.innerHTML = `
      <div style="overflow-x:auto">
        <table class="analysis-table">
          <thead><tr>
            <th></th>
            <th>Aluno</th>
            <th>Matrícula</th>
            <th>Frequência</th>
            <th>Faltas</th>
            <th>Situação</th>
          </tr></thead>
          <tbody>
            ${data.alunos.map((a, i) => {
              const pct = a.percentualFrequencia ?? 0;
              const cor = pct >= 75 ? 'green' : pct >= 50 ? 'yellow' : 'red';
              const sit = { EM_DIA: ['badge-success','✅ Em dia'],
                            EM_RISCO: ['badge-warning','⚠️ Em risco'],
                            CRITICO: ['badge-danger','🔴 Crítico'],
                            SEM_DADOS: ['badge-gray','— Sem dados'] }[a.situacao] || ['badge-gray','—'];
              const hasDetails = a.materias?.length > 0;
              return `
                <tr id="row-${i}">
                  <td style="width:32px">
                    ${hasDetails ? `<button class="expand-btn" onclick="toggleSub(${i})" title="Ver por matéria">▶</button>` : ''}
                  </td>
                  <td><div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar" style="width:30px;height:30px;font-size:12px">${getInitials(a.alunoNome)}</div>
                    <strong>${a.alunoNome}</strong>
                  </div></td>
                  <td><span class="badge badge-gray">${a.matricula || '—'}</span></td>
                  <td>
                    <div style="display:flex;align-items:center;gap:8px">
                      <div class="mini-prog"><div class="mini-prog-fill ${cor}" style="width:${pct}%"></div></div>
                      <span style="font-size:13px;font-weight:700">${a.percentualFrequencia ?? '—'}%</span>
                    </div>
                  </td>
                  <td><span class="badge badge-danger">${a.faltas} falta(s)</span></td>
                  <td><span class="badge ${sit[0]}">${sit[1]}</span></td>
                </tr>
                <tr class="sub-row" id="sub-${i}">
                  <td colspan="6" style="padding:0 12px 12px 44px">
                    <table class="sub-table">
                      <thead><tr>
                        <th>Matéria</th><th>Aulas</th><th>Presenças</th><th>Freq.</th><th>Média</th>
                      </tr></thead>
                      <tbody>
                        ${(a.materias || []).map(m => {
                          const mPct = m.percentualFreq ?? 0;
                          const mCor = mPct >= 75 ? '#10b981' : mPct >= 50 ? '#f59e0b' : '#ef4444';
                          const notaCor = m.mediaNota == null ? 'badge-gray' : m.mediaNota >= 5 ? 'badge-success' : 'badge-danger';
                          return `<tr>
                            <td><strong>${m.materiaNome}</strong></td>
                            <td>${m.totalAulas}</td>
                            <td>${m.presencas}</td>
                            <td style="color:${mCor};font-weight:700">${m.percentualFreq != null ? m.percentualFreq + '%' : '—'}</td>
                            <td>${m.mediaNota != null ? `<span class="badge ${notaCor}">${m.mediaNota}</span>` : '<span style="color:var(--text-muted)">—</span>'}</td>
                          </tr>`;
                        }).join('')}
                      </tbody>
                    </table>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { wrapper.innerHTML = `<div class="empty-state" style="padding:24px"><p>Erro: ${err.message}</p></div>`; }
}

function toggleSub(i) {
  const sub = document.getElementById('sub-' + i);
  const btn = document.querySelector(`#row-${i} .expand-btn`);
  if (!sub) return;
  const open = sub.classList.toggle('open');
  if (btn) btn.textContent = open ? '▼' : '▶';
}

// ── Análise por Matéria ───────────────────────────────────────────────
async function carregarMateriaDetalhes() {
  const wrapper = document.getElementById('tabela-materia-wrapper');
  wrapper.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    const params = new URLSearchParams({ materiaId: filtros.materiaId });
    if (filtros.turmaId)    params.set('turmaId',    filtros.turmaId);
    if (filtros.dataInicio) params.set('dataInicio', filtros.dataInicio);
    if (filtros.dataFim)    params.set('dataFim',    filtros.dataFim);

    const data = await apiFetch('/dashboard/materia-detalhes?' + params.toString());
    document.getElementById('materia-titulo').textContent = data.materiaNome + (data.codigo ? ` (${data.codigo})` : '');

    if (!data.alunos?.length) {
      wrapper.innerHTML = '<div class="empty-state" style="padding:24px"><p>Nenhuma avaliação lançada para esta matéria no período selecionado.</p></div>';
      return;
    }

    wrapper.innerHTML = `
      <div style="overflow-x:auto">
        <table class="analysis-table">
          <thead><tr>
            <th>Aluno</th>
            <th>Turma</th>
            <th>Avaliações</th>
            <th>Média</th>
            <th>Situação</th>
          </tr></thead>
          <tbody>
            ${data.alunos.map(a => {
              const notaCor = a.media >= 7 ? 'badge-success' : a.media >= 5 ? 'badge-warning' : 'badge-danger';
              const sitCor  = a.situacao === 'APROVADO' ? 'badge-success' : 'badge-danger';
              const sitLabel = a.situacao === 'APROVADO' ? '✅ Aprovado' : '❌ Reprovado';
              return `
                <tr>
                  <td><div style="display:flex;align-items:center;gap:8px">
                    <div class="avatar" style="width:30px;height:30px;font-size:12px">${getInitials(a.alunoNome)}</div>
                    <div>
                      <div style="font-weight:600">${a.alunoNome}</div>
                      <div style="font-size:11px;color:var(--text-muted)">${a.matricula || ''}</div>
                    </div>
                  </div></td>
                  <td><span class="badge badge-gray">${a.turma || '—'}</span></td>
                  <td>
                    <div class="notas-list">
                      ${(a.notas || []).map(n => {
                        const nc = n.nota >= 7 ? 'ok' : n.nota >= 5 ? 'warn' : 'bad';
                        return `<span class="nota-chip ${nc}" title="${n.tipo || ''}${n.descricao ? ' – ' + n.descricao : ''}${n.data ? ' (' + n.data + ')' : ''}">${n.nota}</span>`;
                      }).join('')}
                    </div>
                  </td>
                  <td><span class="badge ${notaCor}" style="font-size:14px;font-weight:800">${a.media}</span></td>
                  <td><span class="badge ${sitCor}">${sitLabel}</span></td>
                </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) { wrapper.innerHTML = `<div class="empty-state" style="padding:24px"><p>Erro: ${err.message}</p></div>`; }
}

// ── Render Stats ──────────────────────────────────────────────────────
function renderStats(s) {
  document.getElementById('stats-grid').innerHTML = `
    <div class="stat-card">
      <div class="stat-icon blue">🎒</div>
      <div class="stat-info"><div class="stat-value">${s.totalAlunos}</div><div class="stat-label">Total de Alunos</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon green">✅</div>
      <div class="stat-info"><div class="stat-value">${s.alunosAtivos}</div><div class="stat-label">Alunos Ativos</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon purple">👨‍🏫</div>
      <div class="stat-info"><div class="stat-value">${s.totalProfessores}</div><div class="stat-label">Professores</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon orange">🎯</div>
      <div class="stat-info"><div class="stat-value">${s.totalCursos}</div><div class="stat-label">Cursos</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon indigo">🏫</div>
      <div class="stat-info"><div class="stat-value">${s.totalTurmas}</div><div class="stat-label">Turmas</div></div>
    </div>
    <div class="stat-card">
      <div class="stat-icon red">📋</div>
      <div class="stat-info"><div class="stat-value">${s.totalPresencasRegistradas}</div><div class="stat-label">Presenças Registradas</div></div>
    </div>
  `;
}

// ── Charts ────────────────────────────────────────────────────────────
function renderChartFrequencia(data) {
  const ctx    = document.getElementById('chartFrequencia').getContext('2d');
  const canvas = ctx.canvas;
  const emptyId = 'freq-empty-state';
  const oldEmpty = document.getElementById(emptyId);
  if (oldEmpty) oldEmpty.remove();
  if (chartFreq) { chartFreq.destroy(); chartFreq = null; }

  if (!data.length) {
    canvas.style.display = 'none';
    const div = document.createElement('div');
    div.id = emptyId; div.className = 'empty-state';
    div.innerHTML = '<p>Nenhum dado de frequência disponível</p>';
    canvas.parentNode.appendChild(div);
    return;
  }
  canvas.style.display = '';

  chartFreq = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.turmaNome),
      datasets: [{
        label: 'Frequência (%)',
        data: data.map(d => d.percentualFrequencia),
        backgroundColor: data.map(d =>
          d.percentualFrequencia >= 75 ? 'rgba(16,185,129,0.7)' :
          d.percentualFrequencia >= 50 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)'),
        borderRadius: 6, borderSkipped: false,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { min: 0, max: 100, ticks: { color: '#94a3b8', callback: v => v + '%' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
      }
    }
  });
}

function renderChartDesempenho(data) {
  const ctx    = document.getElementById('chartDesempenho').getContext('2d');
  const canvas = ctx.canvas;
  const emptyId = 'desemp-empty-state';
  const oldEmpty = document.getElementById(emptyId);
  if (oldEmpty) oldEmpty.remove();
  if (chartDesemp) { chartDesemp.destroy(); chartDesemp = null; }

  if (!data.length) {
    canvas.style.display = 'none';
    const div = document.createElement('div');
    div.id = emptyId; div.className = 'empty-state';
    div.innerHTML = '<p>Nenhum dado de desempenho disponível</p>';
    canvas.parentNode.appendChild(div);
    return;
  }
  canvas.style.display = '';

  chartDesemp = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: data.map(d => d.materiaNome),
      datasets: [{
        label: 'Média',
        data: data.map(d => d.mediaNota),
        backgroundColor: 'rgba(99,102,241,0.2)',
        borderColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointRadius: 4,
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#94a3b8' } } },
      scales: {
        r: {
          min: 0, max: 10,
          ticks: { color: '#64748b', stepSize: 2, backdropColor: 'transparent' },
          grid: { color: 'rgba(255,255,255,0.08)' },
          pointLabels: { color: '#94a3b8', font: { size: 11 } }
        }
      }
    }
  });
}

// ── Alunos Baixa Frequência ───────────────────────────────────────────
function renderBaixaFrequencia(data) {
  const container = document.getElementById('tabela-baixa-freq');
  if (!data.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎉</div>
        <h3>Nenhum aluno em risco</h3>
        <p>${filtros.turmaId ? 'Todos os alunos desta turma estão com frequência acima de 75%' : 'Todos os alunos estão com frequência acima de 75%'}</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="table-container">
      <table>
        <thead><tr>
          <th>Aluno</th><th>Matrícula</th><th>Frequência</th><th>Faltas</th><th>Situação</th><th>Ação</th>
        </tr></thead>
        <tbody>
          ${data.map(a => `
            <tr>
              <td><div class="flex items-center gap-1">
                <div class="avatar">${getInitials(a.alunoNome)}</div>
                <strong>${a.alunoNome}</strong>
              </div></td>
              <td><span class="badge badge-gray">${a.matricula}</span></td>
              <td>
                <div style="min-width:120px">
                  <div class="flex justify-between mb-1">
                    <span style="font-size:12px">${a.percentualFrequencia}%</span>
                    <span style="font-size:12px;color:var(--text-muted)">${a.totalAulas} aulas</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill ${a.percentualFrequencia >= 75 ? 'green' : a.percentualFrequencia >= 50 ? 'yellow' : 'red'}"
                         style="width:${a.percentualFrequencia}%"></div>
                  </div>
                </div>
              </td>
              <td><span class="badge badge-danger">${a.faltas} faltas</span></td>
              <td><span class="badge badge-warning">⚠️ Irregular</span></td>
              <td><a href="presencas.html" class="btn btn-outline btn-sm">Ver</a></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Init ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('pt-BR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  // Carregar turmas e matérias para os selects de filtro
  try {
    const [turmas, materias] = await Promise.all([apiFetch('/turmas'), apiFetch('/materias')]);

    const selT = document.getElementById('filtro-turma');
    turmas.forEach(t => {
      const o = document.createElement('option');
      o.value = t.id; o.textContent = t.nome + (t.ano ? ` (${t.ano})` : '');
      selT.appendChild(o);
    });

    const selM = document.getElementById('filtro-materia');
    materias.forEach(m => {
      const o = document.createElement('option');
      o.value = m.id; o.textContent = m.nome + (m.codigo ? ` (${m.codigo})` : '');
      selM.appendChild(o);
    });
  } catch (e) { /* non-critical */ }

  loadDashboard();
});

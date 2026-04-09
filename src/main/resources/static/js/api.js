/* ===== API BASE ===== */
const API = 'http://localhost:8080/api';

async function apiFetch(url, options = {}) {
  try {
    const response = await fetch(API + url, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Erro ${response.status}`);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (err) {
    throw err;
  }
}

/* ===== TOAST NOTIFICATIONS ===== */
function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3100);
}

function createToastContainer() {
  const c = document.createElement('div');
  c.id = 'toast-container';
  document.body.appendChild(c);
  return c;
}

/* ===== MODAL HELPERS ===== */
function openModal(id) {
  document.getElementById(id)?.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
  document.body.style.overflow = '';
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
});

/* ===== LOADING HELPERS ===== */
function showLoading(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `<div class="loading"><div class="spinner"></div><span>Carregando...</span></div>`;
}

function showEmpty(containerId, message = 'Nenhum registro encontrado') {
  const el = document.getElementById(containerId);
  if (el) el.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">📭</div>
      <h3>${message}</h3>
      <p>Adicione um novo registro para começar.</p>
    </div>
  `;
}

/* ===== FORMAT HELPERS ===== */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

function formatDatetime(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('pt-BR');
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

function frequenciaBadge(pct) {
  if (pct >= 75) return `<span class="badge badge-success">✓ ${pct}%</span>`;
  if (pct >= 50) return `<span class="badge badge-warning">⚠ ${pct}%</span>`;
  return `<span class="badge badge-danger">✗ ${pct}%</span>`;
}

function notaBadge(nota) {
  if (nota === null || nota === undefined) return '<span class="badge badge-gray">—</span>';
  if (nota >= 7) return `<span class="badge badge-success">${nota}</span>`;
  if (nota >= 5) return `<span class="badge badge-warning">${nota}</span>`;
  return `<span class="badge badge-danger">${nota}</span>`;
}

function situacaoBadge(situacao) {
  if (situacao === 'APROVADO' || situacao === 'REGULAR') return `<span class="badge badge-success">${situacao}</span>`;
  if (situacao === 'IRREGULAR') return `<span class="badge badge-warning">${situacao}</span>`;
  return `<span class="badge badge-danger">${situacao}</span>`;
}

/* ===== SIDEBAR ACTIVE LINK ===== */
function setActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(link => {
    const href = link.getAttribute('href') || '';
    link.classList.toggle('active', href === page || href.endsWith(page));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setActiveNav();
  createToastContainer();
});

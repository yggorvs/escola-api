# Sistema de Gestão Escolar — Plano de Implementação

Desenvolvimento de um sistema completo de gestão escolar com backend em **Java + Spring Boot + SQLite** e frontend em **HTML/CSS/JS puro**, servido pelo próprio Spring Boot (sem framework JS externo).

---

## User Review Required

> [!IMPORTANT]
> O frontend (HTML/CSS/JS) será servido diretamente pelo Spring Boot como arquivos estáticos (`/resources/static`). Não será necessário um servidor separado.

> [!IMPORTANT]
> O projeto foi criado originalmente em `C:\Users\Admin\Documents\programas\escola-api`.

> [!WARNING]
> SQLite não suporta bem concorrência pesada. Este sistema é ideal para uso local / rede interna (escola pequena/média). Para produção em larga escala, recomendaria PostgreSQL.

---

## Arquitetura

```
escola-api/
├── src/
│   ├── main/
│   │   ├── java/com/escola/
│   │   │   ├── controller/       ← REST Controllers (API)
│   │   │   ├── model/            ← Entidades JPA
│   │   │   ├── repository/       ← Spring Data JPA Repositories
│   │   │   ├── service/          ← Regras de negócio
│   │   │   └── EscolaApplication.java
│   │   └── resources/
│   │       ├── static/           ← Frontend (HTML/CSS/JS)
│   │       │   ├── index.html    ← Dashboard principal
│   │       │   ├── alunos.html
│   │       │   ├── turmas.html
│   │       │   ├── materias.html
│   │       │   ├── professores.html
│   │       │   ├── presencas.html
│   │       │   ├── desempenho.html
│   │       │   ├── css/style.css
│   │       │   └── js/app.js
│   │       └── application.properties
├── pom.xml
└── escola.db  ← Banco SQLite gerado automaticamente
```

---

## Banco de Dados — Modelagem

### Entidades e Relacionamentos

```
Materia (1) ←→ (N) TurmaMateria (N) ←→ (1) Turma
Turma (1) ←→ (N) TurmaMateria (N) ←→ (1) Professor
Aluno (N) ←→ (N) Turma  [via AlunoTurma]
Presenca → Aluno + TurmaMateria + Data
Desempenho → Aluno + TurmaMateria + Nota
```

### Tabelas

| Tabela | Campos principais |
|--------|-----------------|
| `alunos` | id, nome, matricula, data_nascimento, email, telefone, ativo |
| `professores` | id, nome, cpf, email, telefone, especialidade, ativo |
| `materias` | id, nome, codigo, carga_horaria |
| `turmas` | id, nome, ano, semestre, periodo (manhã/tarde/noite) |
| `turma_materias` | id, turma_id, materia_id, professor_id |
| `aluno_turmas` | id, aluno_id, turma_id |
| `presencas` | id, aluno_id, turma_materia_id, data, presente |
| `desempenhos` | id, aluno_id, turma_materia_id, nota, tipo (prova/trabalho/etc), descricao |


---

### Frontend — HTML/CSS/JS

#### [NEW] index.html — Dashboard Principal
- Cards com estatísticas gerais (total alunos, turmas, professores)
- Gráfico de frequência geral (usando Chart.js via CDN)
- Gráfico de desempenho médio por matéria
- Alunos com baixa frequência (alerta < 75%)
- Top performers da semana

#### [NEW] alunos.html — Gestão de Alunos
- Tabela com busca e filtros
- Modal de cadastro/edição
- Botão para ver detalhes do aluno (frequência + notas)

#### [NEW] turmas.html — Gestão de Turmas
- Listagem de turmas
- Associação de alunos à turma
- Associação de matérias + professor à turma

#### [NEW] materias.html — Gestão de Matérias
- CRUD simples de matérias

#### [NEW] professores.html — Gestão de Professores
- Tabela com CRUD
- Visualização das turmas/matérias que leciona

#### [NEW] presencas.html — Lançamento de Presenças
- Filtro por turma + matéria + data
- Lista de alunos da turma com checkbox de presença
- Botão de salvar em lote

#### [NEW] desempenho.html — Lançamento de Notas
- Filtro por turma + matéria
- Lista de alunos com campos de nota por tipo de avaliação
- Histórico de lançamentos

#### [NEW] css/style.css
- Design moderno dark/light mode
- Sidebar de navegação lateral
- Cards, tabelas estilizadas, modais
- Paleta de cores profissional (tons de azul/roxo)
- Responsivo (mobile-friendly)

#### [NEW] js/app.js + js/[page].js
- Fetch API para comunicar com o backend REST
- Renderização dinâmica das tabelas
- Lógica dos modais de CRUD
- Integração com Chart.js para gráficos

---

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET/POST | `/api/alunos` | Listar / Criar aluno |
| GET/PUT/DELETE | `/api/alunos/{id}` | Detalhar / Editar / Excluir |
| GET/POST | `/api/professores` | Listar / Criar professor |
| GET/PUT/DELETE | `/api/professores/{id}` | Detalhar / Editar / Excluir |
| GET/POST | `/api/materias` | Listar / Criar matéria |
| GET/POST | `/api/turmas` | Listar / Criar turma |
| GET | `/api/turmas/{id}/alunos` | Alunos de uma turma |
| POST | `/api/turmas/{id}/alunos` | Adicionar aluno à turma |
| GET/POST | `/api/presencas` | Listar / Lançar presenças |
| GET/POST | `/api/desempenhos` | Listar / Lançar notas |
| GET | `/api/dashboard/estatisticas` | Dados gerais do dashboard |
| GET | `/api/dashboard/frequencia` | Frequência por turma/matéria |
| GET | `/api/dashboard/desempenho` | Desempenho médio por matéria |

---

## Open Questions

> [!IMPORTANT]
> **Você tem o Java (JDK 17+) e o Maven instalados?** Se não tiver, precisamos instalar antes de começar.

> [!IMPORTANT]
> **Confirme o diretório da API?** 
`C:\Users\Admin\Documents\programas\escola-api`.

---

## Verification Plan

### Testes Automatizados
- Spring Boot sobe corretamente na porta 8080
- Endpoints REST retornam status 200 / 201 / 204
- Banco SQLite é criado automaticamente em `escola.db`

### Verificação Manual
- Acessar `http://localhost:8080` → Dashboard carrega
- Criar um aluno e verificar na listagem
- Lançar presenças e verificar no dashboard
- Gráficos renderizando corretamente com dados reais

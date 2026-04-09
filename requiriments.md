# ✅ EduSystem — Sistema de Gestão Escolar

## O que foi construído

Sistema completo de gestão escolar com **backend Java Spring Boot + SQLite** e **frontend HTML/CSS/JS**, rodando na porta `8080`.

---

## Stack Técnica

| Camada | Tecnologia |
|--------|-----------|
| Backend | Java 21 + Spring Boot 3.2.3 |
| Banco de Dados | SQLite (arquivo `escola.db`) |
| ORM | Spring Data JPA + Hibernate |
| Frontend | HTML5 + CSS3 Vanilla + JavaScript |
| Gráficos | Chart.js (CDN) |
| Build | Maven 3.9.14 |

---

## Estrutura do Projeto

```
escola-api/
├── src/main/
│   ├── java/com/escola/
│   │   ├── EscolaApplication.java       ← Ponto de entrada
│   │   ├── config/CorsConfig.java       ← CORS
│   │   ├── model/                       ← 7 entidades JPA
│   │   ├── repository/                  ← 7 repositories
│   │   └── controller/                  ← 7 controllers REST
│   └── resources/
│       ├── application.properties       ← Configuração SQLite
│       └── static/                      ← Frontend
│           ├── index.html               ← Dashboard
│           ├── alunos.html
│           ├── professores.html
│           ├── materias.html
│           ├── turmas.html
│           ├── presencas.html
│           ├── desempenho.html
│           ├── css/style.css
│           └── js/
├── target/escola-api-1.0.0.jar         ← JAR executável
├── escola.db                            ← Banco SQLite (auto-criado)
└── pom.xml
```

---

## Como Iniciar o Sistema

### Opção 1 — Executar o JAR (mais fácil)
```powershell
cd C:\Users\Admin\Documents\programas\escola-api
java -jar target\escola-api-1.0.0.jar
```

### Opção 2 — Executar via Maven
```powershell
$env:PATH += ";$env:USERPROFILE\maven\apache-maven-3.9.14\bin"
mvn spring-boot:run
```

Acesse: **http://localhost:8080**

---

## Módulos Disponíveis

| Módulo | URL | Funcionalidade |
|--------|-----|---------------|
| Dashboard | `/index.html` | Estatísticas gerais + gráficos |
| Alunos | `/alunos.html` | CRUD completo de alunos |
| Professores | `/professores.html` | CRUD de professores |
| Matérias | `/materias.html` | CRUD de matérias |
| Turmas | `/turmas.html` | Turmas + alunos + matérias |
| Presenças | `/presencas.html` | Lançamento em lote |
| Desempenho | `/desempenho.html` | Lançamento de notas |

---

## API REST Disponível

| Endpoint | Métodos |
|---------|---------|
| `/api/alunos` | GET, POST, PUT, DELETE, PATCH |
| `/api/professores` | GET, POST, PUT, DELETE, PATCH |
| `/api/materias` | GET, POST, PUT, DELETE |
| `/api/turmas` | GET, POST, PUT, DELETE |
| `/api/turmas/{id}/alunos` | GET, POST, DELETE |
| `/api/turmas/{id}/materias` | GET, POST, DELETE |
| `/api/presencas` | GET, POST (lote), PUT, DELETE |
| `/api/desempenhos` | GET, POST, PUT, DELETE |
| `/api/dashboard/estatisticas` | GET |
| `/api/dashboard/frequencia-turmas` | GET |
| `/api/dashboard/desempenho-materias` | GET |
| `/api/dashboard/alunos-baixa-frequencia` | GET |

---

## Fluxo Recomendado de Uso

```
1. Cadastrar Matérias → /materias.html
2. Cadastrar Professores → /professores.html
3. Criar Turmas → /turmas.html
4. Atribuir Matérias + Professores às Turmas → Turmas > Gerenciar
5. Cadastrar Alunos → /alunos.html
6. Adicionar Alunos nas Turmas → Turmas > Gerenciar > Alunos
7. Lançar Presenças → /presencas.html (selecionar turma + matéria + data)
8. Lançar Notas → /desempenho.html
9. Monitorar Dashboard → /index.html
```

---

## Rebuild (se necessário)

```powershell
cd C:\Users\Admin\Documents\programas\escola-api
$env:PATH += ";$env:USERPROFILE\maven\apache-maven-3.9.14\bin"
mvn clean package -DskipTests
java -jar target\escola-api-1.0.0.jar
```

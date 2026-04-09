package com.escola.controller;

import com.escola.model.*;
import com.escola.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired private AlunoRepository alunoRepository;
    @Autowired private ProfessorRepository professorRepository;
    @Autowired private TurmaRepository turmaRepository;
    @Autowired private MateriaRepository materiaRepository;
    @Autowired private PresencaRepository presencaRepository;
    @Autowired private DesempenhoRepository desempenhoRepository;
    @Autowired private TurmaMateriaRepository turmaMateriaRepository;
    @Autowired private CursoRepository cursoRepository;

    // ── Helper: parse date strings into a range ────────────────────────
    private LocalDate[] resolveRange(String dataInicio, String dataFim) {
        if (dataInicio == null || dataFim == null) return null;
        try {
            return new LocalDate[]{LocalDate.parse(dataInicio), LocalDate.parse(dataFim)};
        } catch (Exception e) { return null; }
    }

    // ── Helper: count aulas/presencas com ou sem filtro de data ────────
    private long[] countFreq(Long alunoId, Long turmaMateriaId, LocalDate[] range) {
        long aulas, presencas;
        if (range != null) {
            aulas     = presencaRepository.countByAlunoAndTurmaMateriaAndDateRange(alunoId, turmaMateriaId, range[0], range[1]);
            presencas = presencaRepository.countPresencasByAlunoAndTurmaMateriaAndDateRange(alunoId, turmaMateriaId, range[0], range[1]);
        } else {
            aulas     = presencaRepository.countByAlunoAndTurmaMateria(alunoId, turmaMateriaId);
            presencas = presencaRepository.countPresencasByAlunoAndTurmaMateria(alunoId, turmaMateriaId);
        }
        return new long[]{aulas, presencas};
    }

    // ── Helper: média nota com ou sem filtro de data ───────────────────
    private Double calcMedia(Long alunoId, Long turmaMateriaId, LocalDate[] range) {
        if (range != null)
            return desempenhoRepository.mediaNotasByAlunoAndTurmaMateriaAndDateRange(alunoId, turmaMateriaId, range[0], range[1]);
        return desempenhoRepository.mediaNotasByAlunoAndTurmaMateria(alunoId, turmaMateriaId);
    }

    // ── Estatísticas gerais ────────────────────────────────────────────
    @GetMapping("/estatisticas")
    public Map<String, Object> estatisticas() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalAlunos", alunoRepository.count());
        stats.put("alunosAtivos", alunoRepository.findByAtivoTrue().size());
        stats.put("totalProfessores", professorRepository.count());
        stats.put("professoresAtivos", professorRepository.findByAtivoTrue().size());
        stats.put("totalCursos", cursoRepository.count());
        stats.put("cursosAtivos", cursoRepository.countByAtivoTrue());
        stats.put("totalTurmas", turmaRepository.count());
        stats.put("totalMaterias", materiaRepository.count());
        stats.put("totalPresencasRegistradas", presencaRepository.count());
        stats.put("totalNotasRegistradas", desempenhoRepository.count());
        return stats;
    }

    // ── Frequência por Turma (com filtros) ────────────────────────────
    @GetMapping("/frequencia-turmas")
    public List<Map<String, Object>> frequenciaPorTurma(
            @RequestParam(required = false) Long turmaId,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim) {

        List<Turma> turmas = (turmaId != null)
                ? turmaRepository.findById(turmaId).map(List::of).orElse(List.of())
                : turmaRepository.findAll();

        LocalDate[] range = resolveRange(dataInicio, dataFim);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Turma turma : turmas) {
            List<TurmaMateria> materias = turmaMateriaRepository.findByTurmaId(turma.getId());
            long totalAulas = 0, totalPresencas = 0;

            for (TurmaMateria tm : materias) {
                for (Aluno aluno : turma.getAlunos()) {
                    long[] freq = countFreq(aluno.getId(), tm.getId(), range);
                    totalAulas     += freq[0];
                    totalPresencas += freq[1];
                }
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("turmaId", turma.getId());
            item.put("turmaNome", turma.getNome());
            item.put("totalAlunos", turma.getAlunos().size());
            item.put("totalAulas", totalAulas);
            item.put("totalPresencas", totalPresencas);
            double pct = totalAulas > 0 ? totalPresencas * 100.0 / totalAulas : 0;
            item.put("percentualFrequencia", Math.round(pct * 10.0) / 10.0);
            resultado.add(item);
        }
        return resultado;
    }

    // ── Desempenho por Matéria (com filtros) ──────────────────────────
    @GetMapping("/desempenho-materias")
    public List<Map<String, Object>> desempenhoPorMateria(
            @RequestParam(required = false) Long materiaId,
            @RequestParam(required = false) Long turmaId,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim) {

        List<Materia> materias = (materiaId != null)
                ? materiaRepository.findById(materiaId).map(List::of).orElse(List.of())
                : materiaRepository.findAll();

        LocalDate[] range = resolveRange(dataInicio, dataFim);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Materia materia : materias) {
            Double media;
            if (range != null)
                media = desempenhoRepository.mediaNotasByMateriaAndDateRange(materia.getId(), range[0], range[1]);
            else
                media = desempenhoRepository.mediaNotasByMateria(materia.getId());

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("materiaId", materia.getId());
            item.put("materiaNome", materia.getNome());
            item.put("mediaNota", media != null ? Math.round(media * 10.0) / 10.0 : 0);
            resultado.add(item);
        }
        return resultado;
    }

    // ── Alunos com baixa frequência (com filtros) ─────────────────────
    @GetMapping("/alunos-baixa-frequencia")
    public List<Map<String, Object>> alunosBaixaFrequencia(
            @RequestParam(required = false) Long turmaId,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim) {

        LocalDate[] range = resolveRange(dataInicio, dataFim);
        List<Aluno> alunos;

        if (turmaId != null) {
            alunos = turmaRepository.findById(turmaId)
                    .map(Turma::getAlunos)
                    .orElse(List.of());
        } else {
            alunos = alunoRepository.findByAtivoTrue();
        }

        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Aluno aluno : alunos) {
            long totalAulas = 0, totalPresencas = 0;

            List<Turma> turmas = turmaId != null
                    ? turmaRepository.findById(turmaId).map(List::of).orElse(List.of())
                    : aluno.getTurmas();

            for (Turma turma : turmas) {
                for (TurmaMateria tm : turmaMateriaRepository.findByTurmaId(turma.getId())) {
                    long[] freq = countFreq(aluno.getId(), tm.getId(), range);
                    totalAulas     += freq[0];
                    totalPresencas += freq[1];
                }
            }

            if (totalAulas > 0) {
                double pct = totalPresencas * 100.0 / totalAulas;
                if (pct < 75.0) {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("alunoId", aluno.getId());
                    item.put("alunoNome", aluno.getNome());
                    item.put("matricula", aluno.getMatricula());
                    item.put("percentualFrequencia", Math.round(pct * 10.0) / 10.0);
                    item.put("totalAulas", totalAulas);
                    item.put("faltas", totalAulas - totalPresencas);
                    resultado.add(item);
                }
            }
        }

        resultado.sort((a, b) -> Double.compare(
                (Double) a.get("percentualFrequencia"),
                (Double) b.get("percentualFrequencia")));
        return resultado;
    }

    // ── NOVO: Turma Detalhes – todos os alunos com freq + notas ───────
    @GetMapping("/turma-detalhes")
    public ResponseEntity<?> turmaDetalhes(
            @RequestParam Long turmaId,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim) {

        Turma turma = turmaRepository.findById(turmaId).orElse(null);
        if (turma == null) return ResponseEntity.notFound().build();

        LocalDate[] range = resolveRange(dataInicio, dataFim);
        List<TurmaMateria> materias = turmaMateriaRepository.findByTurmaId(turmaId);
        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Aluno aluno : turma.getAlunos()) {
            long totalAulas = 0, totalPresencas = 0;
            List<Map<String, Object>> materiaStats = new ArrayList<>();

            for (TurmaMateria tm : materias) {
                long[] freq = countFreq(aluno.getId(), tm.getId(), range);
                Double media = calcMedia(aluno.getId(), tm.getId(), range);

                totalAulas     += freq[0];
                totalPresencas += freq[1];

                Map<String, Object> ms = new LinkedHashMap<>();
                ms.put("materiaId",   tm.getMateria() != null ? tm.getMateria().getId()   : null);
                ms.put("materiaNome", tm.getMateria() != null ? tm.getMateria().getNome() : "—");
                ms.put("totalAulas",  freq[0]);
                ms.put("presencas",   freq[1]);
                ms.put("percentualFreq", freq[0] > 0 ? Math.round(freq[1] * 100.0 / freq[0] * 10) / 10.0 : null);
                ms.put("mediaNota",   media != null ? Math.round(media * 10.0) / 10.0 : null);
                materiaStats.add(ms);
            }

            double percFreq = totalAulas > 0 ? totalPresencas * 100.0 / totalAulas : -1;
            String situacao = percFreq < 0    ? "SEM_DADOS"
                            : percFreq >= 75  ? "EM_DIA"
                            : percFreq >= 50  ? "EM_RISCO"
                            :                   "CRITICO";

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("alunoId",              aluno.getId());
            item.put("alunoNome",            aluno.getNome());
            item.put("matricula",            aluno.getMatricula());
            item.put("totalAulas",           totalAulas);
            item.put("presencas",            totalPresencas);
            item.put("faltas",               totalAulas - totalPresencas);
            item.put("percentualFrequencia", totalAulas > 0 ? Math.round(percFreq * 10.0) / 10.0 : null);
            item.put("situacao",             situacao);
            item.put("materias",             materiaStats);
            resultado.add(item);
        }

        resultado.sort((a, b) -> {
            Double pa = (Double) a.get("percentualFrequencia");
            Double pb = (Double) b.get("percentualFrequencia");
            if (pa == null && pb == null) return 0;
            if (pa == null) return 1;
            if (pb == null) return -1;
            return Double.compare(pa, pb);
        });

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("turmaId",   turma.getId());
        resp.put("turmaNome", turma.getNome());
        resp.put("alunos",    resultado);
        return ResponseEntity.ok(resp);
    }

    // ── NOVO: Matéria Detalhes – notas individuais por aluno ──────────
    @GetMapping("/materia-detalhes")
    public ResponseEntity<?> materiaDetalhes(
            @RequestParam Long materiaId,
            @RequestParam(required = false) Long turmaId,
            @RequestParam(required = false) String dataInicio,
            @RequestParam(required = false) String dataFim) {

        Materia materia = materiaRepository.findById(materiaId).orElse(null);
        if (materia == null) return ResponseEntity.notFound().build();

        LocalDate[] range = resolveRange(dataInicio, dataFim);

        List<Desempenho> desempenhos;
        if (turmaId != null && range != null)
            desempenhos = desempenhoRepository.findByMateriaIdAndTurmaIdAndDateRange(materiaId, turmaId, range[0], range[1]);
        else if (turmaId != null)
            desempenhos = desempenhoRepository.findByMateriaIdAndTurmaId(materiaId, turmaId);
        else if (range != null)
            desempenhos = desempenhoRepository.findByMateriaIdAndDateRange(materiaId, range[0], range[1]);
        else
            desempenhos = desempenhoRepository.findByMateriaId(materiaId);

        // Agrupar por aluno
        Map<Long, Map<String, Object>> byAluno = new LinkedHashMap<>();
        for (Desempenho d : desempenhos) {
            Aluno aluno = d.getAluno();
            byAluno.computeIfAbsent(aluno.getId(), k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("alunoId",   aluno.getId());
                m.put("alunoNome", aluno.getNome());
                m.put("matricula", aluno.getMatricula());
                String turmaNome = (d.getTurmaMateria() != null && d.getTurmaMateria().getTurma() != null)
                        ? d.getTurmaMateria().getTurma().getNome() : "—";
                m.put("turma",  turmaNome);
                m.put("notas",  new ArrayList<Map<String, Object>>());
                return m;
            });

            Map<String, Object> nota = new LinkedHashMap<>();
            nota.put("id",        d.getId());
            nota.put("nota",      d.getNota());
            nota.put("tipo",      d.getTipo());
            nota.put("descricao", d.getDescricao());
            nota.put("data",      d.getData() != null ? d.getData().toString() : null);
            //noinspection unchecked
            ((List<Map<String, Object>>) byAluno.get(aluno.getId()).get("notas")).add(nota);
        }

        // Calcular médias por aluno
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Map<String, Object> alunoMap : byAluno.values()) {
            //noinspection unchecked
            List<Map<String, Object>> notas = (List<Map<String, Object>>) alunoMap.get("notas");
            double avg = notas.stream().mapToDouble(n -> (Double) n.get("nota")).average().orElse(0);
            alunoMap.put("media",           Math.round(avg * 10.0) / 10.0);
            alunoMap.put("totalAvaliacoes", notas.size());
            alunoMap.put("situacao",        avg >= 5.0 ? "APROVADO" : "REPROVADO");
            resultado.add(alunoMap);
        }

        resultado.sort(Comparator.comparing(a -> (String) a.get("alunoNome")));

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("materiaId",   materia.getId());
        resp.put("materiaNome", materia.getNome());
        resp.put("codigo",      materia.getCodigo());
        resp.put("alunos",      resultado);
        return ResponseEntity.ok(resp);
    }

    // ── Desempenho geral dos alunos ───────────────────────────────────
    @GetMapping("/desempenho-alunos")
    public List<Map<String, Object>> desempenhoAlunos() {
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Aluno aluno : alunoRepository.findByAtivoTrue()) {
            for (Turma turma : aluno.getTurmas()) {
                for (TurmaMateria tm : turmaMateriaRepository.findByTurmaId(turma.getId())) {
                    Double media = desempenhoRepository.mediaNotasByAlunoAndTurmaMateria(aluno.getId(), tm.getId());
                    if (media != null) {
                        Map<String, Object> item = new LinkedHashMap<>();
                        item.put("alunoId",    aluno.getId());
                        item.put("alunoNome",  aluno.getNome());
                        item.put("turmaNome",  turma.getNome());
                        item.put("materiaNome",tm.getMateria() != null ? tm.getMateria().getNome() : "—");
                        item.put("media",      Math.round(media * 10.0) / 10.0);
                        item.put("situacao",   media >= 5.0 ? "APROVADO" : "REPROVADO");
                        resultado.add(item);
                    }
                }
            }
        }
        return resultado;
    }
}

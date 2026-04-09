package com.escola.controller;

import com.escola.model.*;
import com.escola.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/cursos")
public class CursoController {

    @Autowired private CursoRepository cursoRepository;
    @Autowired private CursomateriaRepository cursomateriaRepository;
    @Autowired private MateriaRepository materiaRepository;
    @Autowired private TurmaRepository turmaRepository;

    @GetMapping
    public List<Curso> listar(@RequestParam(required = false) String nome) {
        if (nome != null && !nome.isEmpty()) {
            return cursoRepository.findByNomeContainingIgnoreCase(nome);
        }
        return cursoRepository.findAll();
    }

    @GetMapping("/ativos")
    public List<Curso> listarAtivos() {
        return cursoRepository.findByAtivoTrue();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Curso> buscarPorId(@PathVariable Long id) {
        return cursoRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Curso> criar(@RequestBody Curso curso) {
        curso.setId(null);
        curso.setAtivo(true);
        return ResponseEntity.ok(cursoRepository.save(curso));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Curso> atualizar(@PathVariable Long id, @RequestBody Curso dados) {
        return cursoRepository.findById(id).map(curso -> {
            curso.setNome(dados.getNome());
            curso.setDescricao(dados.getDescricao());
            curso.setDuracao(dados.getDuracao());
            return ResponseEntity.ok(cursoRepository.save(curso));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle-ativo")
    public ResponseEntity<Curso> toggleAtivo(@PathVariable Long id) {
        return cursoRepository.findById(id).map(curso -> {
            curso.setAtivo(!curso.getAtivo());
            return ResponseEntity.ok(cursoRepository.save(curso));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!cursoRepository.existsById(id)) return ResponseEntity.notFound().build();
        cursoRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Grade curricular (CursoMateria) ──────────────────────────────
    @GetMapping("/{id}/materias")
    public List<Map<String, Object>> listarMaterias(@PathVariable Long id) {
        List<CursoMateria> lista = cursomateriaRepository.findByCursoIdOrderBySemestreAsc(id);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (CursoMateria cm : lista) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", cm.getId());
            item.put("semestre", cm.getSemestre());
            item.put("obrigatoria", cm.getObrigatoria());
            if (cm.getMateria() != null) {
                Map<String, Object> mat = new LinkedHashMap<>();
                mat.put("id", cm.getMateria().getId());
                mat.put("nome", cm.getMateria().getNome());
                mat.put("codigo", cm.getMateria().getCodigo());
                mat.put("cargaHoraria", cm.getMateria().getCargaHoraria());
                item.put("materia", mat);
            }
            resultado.add(item);
        }
        return resultado;
    }

    @PostMapping("/{id}/materias")
    public ResponseEntity<?> adicionarMateria(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Curso curso = cursoRepository.findById(id).orElse(null);
        if (curso == null) return ResponseEntity.notFound().build();

        Long materiaId = Long.valueOf(body.get("materiaId").toString());
        Materia materia = materiaRepository.findById(materiaId).orElse(null);
        if (materia == null) return ResponseEntity.badRequest().body("Matéria não encontrada");

        Integer semestre = body.containsKey("semestre") && body.get("semestre") != null
                ? Integer.valueOf(body.get("semestre").toString()) : 1;
        Boolean obrigatoria = body.containsKey("obrigatoria")
                ? Boolean.valueOf(body.get("obrigatoria").toString()) : true;

        if (cursomateriaRepository.existsByCursoIdAndMateriaIdAndSemestre(id, materiaId, semestre)) {
            return ResponseEntity.badRequest().body("Matéria já cadastrada nesse semestre do curso");
        }

        CursoMateria cm = new CursoMateria();
        cm.setCurso(curso);
        cm.setMateria(materia);
        cm.setSemestre(semestre);
        cm.setObrigatoria(obrigatoria);
        cursomateriaRepository.save(cm);

        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("id", cm.getId());
        resp.put("semestre", cm.getSemestre());
        resp.put("obrigatoria", cm.getObrigatoria());
        Map<String, Object> mat = new LinkedHashMap<>();
        mat.put("id", materia.getId());
        mat.put("nome", materia.getNome());
        mat.put("codigo", materia.getCodigo());
        resp.put("materia", mat);
        return ResponseEntity.ok(resp);
    }

    @DeleteMapping("/{id}/materias/{cmId}")
    public ResponseEntity<Void> removerMateria(@PathVariable Long id, @PathVariable Long cmId) {
        if (!cursomateriaRepository.existsById(cmId)) return ResponseEntity.notFound().build();
        cursomateriaRepository.deleteById(cmId);
        return ResponseEntity.noContent().build();
    }

    // ── Turmas do Curso ──────────────────────────────────────────────
    @GetMapping("/{id}/turmas")
    public List<Map<String, Object>> listarTurmas(@PathVariable Long id) {
        List<Turma> turmas = turmaRepository.findByCursoId(id);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (Turma t : turmas) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", t.getId());
            item.put("nome", t.getNome());
            item.put("ano", t.getAno());
            item.put("semestre", t.getSemestre());
            item.put("periodo", t.getPeriodo());
            item.put("totalAlunos", t.getAlunos() != null ? t.getAlunos().size() : 0);
            resultado.add(item);
        }
        return resultado;
    }
}

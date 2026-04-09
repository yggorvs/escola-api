package com.escola.controller;

import com.escola.model.*;
import com.escola.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/turmas")
public class TurmaController {

    @Autowired private TurmaRepository turmaRepository;
    @Autowired private AlunoRepository alunoRepository;
    @Autowired private MateriaRepository materiaRepository;
    @Autowired private ProfessorRepository professorRepository;
    @Autowired private TurmaMateriaRepository turmaMateriaRepository;
    @Autowired private CursoRepository cursoRepository;

    @GetMapping
    public List<Turma> listar(@RequestParam(required = false) String nome) {
        if (nome != null && !nome.isEmpty()) {
            return turmaRepository.findByNomeContainingIgnoreCase(nome);
        }
        return turmaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Turma> buscarPorId(@PathVariable Long id) {
        return turmaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Turma> criar(@RequestBody Map<String, Object> dados) {
        Turma turma = new Turma();
        turma.setNome(dados.get("nome").toString());
        turma.setAlunos(new ArrayList<>());
        turma.setTurmasMaterias(new ArrayList<>());
        if (dados.containsKey("ano") && dados.get("ano") != null)
            turma.setAno(Integer.valueOf(dados.get("ano").toString()));
        if (dados.containsKey("semestre") && dados.get("semestre") != null)
            turma.setSemestre(dados.get("semestre").toString());
        if (dados.containsKey("periodo") && dados.get("periodo") != null)
            turma.setPeriodo(dados.get("periodo").toString());
        if (dados.containsKey("cursoId") && dados.get("cursoId") != null)
            cursoRepository.findById(Long.valueOf(dados.get("cursoId").toString())).ifPresent(turma::setCurso);
        return ResponseEntity.ok(turmaRepository.save(turma));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Turma> atualizar(@PathVariable Long id, @RequestBody Map<String, Object> dados) {
        return turmaRepository.findById(id).map(turma -> {
            turma.setNome(dados.get("nome").toString());
            if (dados.containsKey("ano")) turma.setAno(
                    dados.get("ano") != null ? Integer.valueOf(dados.get("ano").toString()) : null);
            if (dados.containsKey("semestre")) turma.setSemestre(
                    dados.get("semestre") != null ? dados.get("semestre").toString() : null);
            if (dados.containsKey("periodo")) turma.setPeriodo(
                    dados.get("periodo") != null ? dados.get("periodo").toString() : null);
            if (dados.containsKey("cursoId")) {
                if (dados.get("cursoId") != null)
                    cursoRepository.findById(Long.valueOf(dados.get("cursoId").toString())).ifPresent(turma::setCurso);
                else
                    turma.setCurso(null);
            }
            return ResponseEntity.ok(turmaRepository.save(turma));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!turmaRepository.existsById(id)) return ResponseEntity.notFound().build();
        turmaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Gerenciamento de Alunos na Turma
    @GetMapping("/{id}/alunos")
    public ResponseEntity<List<Aluno>> listarAlunos(@PathVariable Long id) {
        return turmaRepository.findById(id)
                .map(t -> ResponseEntity.ok(t.getAlunos()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/alunos/{alunoId}")
    public ResponseEntity<?> adicionarAluno(@PathVariable Long id, @PathVariable Long alunoId) {
        Turma turma = turmaRepository.findById(id).orElse(null);
        Aluno aluno = alunoRepository.findById(alunoId).orElse(null);
        if (turma == null || aluno == null) return ResponseEntity.notFound().build();
        if (!turma.getAlunos().contains(aluno)) {
            turma.getAlunos().add(aluno);
            turmaRepository.save(turma);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/alunos/{alunoId}")
    public ResponseEntity<?> removerAluno(@PathVariable Long id, @PathVariable Long alunoId) {
        Turma turma = turmaRepository.findById(id).orElse(null);
        Aluno aluno = alunoRepository.findById(alunoId).orElse(null);
        if (turma == null || aluno == null) return ResponseEntity.notFound().build();
        turma.getAlunos().removeIf(a -> a.getId().equals(alunoId));
        turmaRepository.save(turma);
        return ResponseEntity.ok().build();
    }

    // Gerenciamento de Matérias na Turma
    @GetMapping("/{id}/materias")
    public List<Map<String, Object>> listarMaterias(@PathVariable Long id) {
        List<TurmaMateria> lista = turmaMateriaRepository.findByTurmaId(id);
        List<Map<String, Object>> resultado = new ArrayList<>();
        for (TurmaMateria tm : lista) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", tm.getId());
            item.put("turmaId", id);

            if (tm.getMateria() != null) {
                Map<String, Object> materia = new LinkedHashMap<>();
                materia.put("id", tm.getMateria().getId());
                materia.put("nome", tm.getMateria().getNome());
                materia.put("codigo", tm.getMateria().getCodigo());
                item.put("materia", materia);
            }

            if (tm.getProfessor() != null) {
                Map<String, Object> professor = new LinkedHashMap<>();
                professor.put("id", tm.getProfessor().getId());
                professor.put("nome", tm.getProfessor().getNome());
                professor.put("especialidade", tm.getProfessor().getEspecialidade());
                item.put("professor", professor);
            } else {
                item.put("professor", null);
            }

            resultado.add(item);
        }
        return resultado;
    }

    @PostMapping("/{id}/materias")
    public ResponseEntity<?> adicionarMateria(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Turma turma = turmaRepository.findById(id).orElse(null);
        Materia materia = materiaRepository.findById(body.get("materiaId")).orElse(null);
        if (turma == null || materia == null) return ResponseEntity.notFound().build();

        TurmaMateria tm = new TurmaMateria();
        tm.setTurma(turma);
        tm.setMateria(materia);

        if (body.containsKey("professorId") && body.get("professorId") != null) {
            professorRepository.findById(body.get("professorId")).ifPresent(tm::setProfessor);
        }
        return ResponseEntity.ok(turmaMateriaRepository.save(tm));
    }

    @DeleteMapping("/{id}/materias/{turmaMateriaId}")
    public ResponseEntity<Void> removerMateria(@PathVariable Long id, @PathVariable Long turmaMateriaId) {
        if (!turmaMateriaRepository.existsById(turmaMateriaId)) return ResponseEntity.notFound().build();
        turmaMateriaRepository.deleteById(turmaMateriaId);
        return ResponseEntity.noContent().build();
    }
}

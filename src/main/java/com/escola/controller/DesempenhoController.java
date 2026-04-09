package com.escola.controller;

import com.escola.model.Desempenho;
import com.escola.repository.DesempenhoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/desempenhos")
public class DesempenhoController {

    @Autowired
    private DesempenhoRepository repository;

    @GetMapping
    public List<Desempenho> listar(
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) Long turmaMateriaId) {
        if (alunoId != null && turmaMateriaId != null) {
            return repository.findByAlunoIdAndTurmaMateriaId(alunoId, turmaMateriaId);
        }
        if (alunoId != null) return repository.findByAlunoId(alunoId);
        if (turmaMateriaId != null) return repository.findByTurmaMateriaId(turmaMateriaId);
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Desempenho> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Desempenho> registrar(@RequestBody Desempenho desempenho) {
        if (desempenho.getData() == null) desempenho.setData(LocalDate.now());
        return ResponseEntity.ok(repository.save(desempenho));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Desempenho> atualizar(@PathVariable Long id, @RequestBody Desempenho dados) {
        return repository.findById(id).map(d -> {
            d.setNota(dados.getNota());
            d.setTipo(dados.getTipo());
            d.setDescricao(dados.getDescricao());
            d.setData(dados.getData() != null ? dados.getData() : d.getData());
            return ResponseEntity.ok(repository.save(d));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/media")
    public ResponseEntity<Map<String, Object>> calcularMedia(
            @RequestParam Long alunoId,
            @RequestParam Long turmaMateriaId) {
        Double media = repository.mediaNotasByAlunoAndTurmaMateria(alunoId, turmaMateriaId);
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("media", media != null ? Math.round(media * 10.0) / 10.0 : 0);
        resultado.put("situacao", media != null && media >= 5.0 ? "APROVADO" : "REPROVADO");
        return ResponseEntity.ok(resultado);
    }
}

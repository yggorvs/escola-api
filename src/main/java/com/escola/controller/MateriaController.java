package com.escola.controller;

import com.escola.model.Materia;
import com.escola.repository.MateriaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/materias")
public class MateriaController {

    @Autowired
    private MateriaRepository repository;

    @GetMapping
    public List<Materia> listar(@RequestParam(required = false) String nome) {
        if (nome != null && !nome.isEmpty()) {
            return repository.findByNomeContainingIgnoreCase(nome);
        }
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Materia> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Materia materia) {
        if (materia.getCodigo() != null && repository.existsByCodigo(materia.getCodigo())) {
            return ResponseEntity.badRequest().body("Código de matéria já existe: " + materia.getCodigo());
        }
        return ResponseEntity.ok(repository.save(materia));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Materia dados) {
        return repository.findById(id).map(materia -> {
            materia.setNome(dados.getNome());
            materia.setCodigo(dados.getCodigo());
            materia.setCargaHoraria(dados.getCargaHoraria());
            materia.setDescricao(dados.getDescricao());
            return ResponseEntity.ok(repository.save(materia));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}

package com.escola.controller;

import com.escola.model.Professor;
import com.escola.repository.ProfessorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/professores")
public class ProfessorController {

    @Autowired
    private ProfessorRepository repository;

    @GetMapping
    public List<Professor> listar(@RequestParam(required = false) String nome) {
        if (nome != null && !nome.isEmpty()) {
            return repository.findByNomeContainingIgnoreCase(nome);
        }
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Professor> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Professor professor) {
        if (professor.getCpf() != null && repository.existsByCpf(professor.getCpf())) {
            return ResponseEntity.badRequest().body("CPF já cadastrado: " + professor.getCpf());
        }
        professor.setAtivo(true);
        return ResponseEntity.ok(repository.save(professor));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Professor dados) {
        return repository.findById(id).map(professor -> {
            professor.setNome(dados.getNome());
            professor.setCpf(dados.getCpf());
            professor.setEmail(dados.getEmail());
            professor.setTelefone(dados.getTelefone());
            professor.setEspecialidade(dados.getEspecialidade());
            if (dados.getAtivo() != null) professor.setAtivo(dados.getAtivo());
            return ResponseEntity.ok(repository.save(professor));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-ativo")
    public ResponseEntity<Professor> toggleAtivo(@PathVariable Long id) {
        return repository.findById(id).map(professor -> {
            professor.setAtivo(!professor.getAtivo());
            return ResponseEntity.ok(repository.save(professor));
        }).orElse(ResponseEntity.notFound().build());
    }
}

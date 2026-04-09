package com.escola.controller;

import com.escola.model.Aluno;
import com.escola.repository.AlunoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/alunos")
public class AlunoController {

    @Autowired
    private AlunoRepository repository;

    @GetMapping
    public List<Aluno> listar(@RequestParam(required = false) String nome) {
        if (nome != null && !nome.isEmpty()) {
            return repository.findByNomeContainingIgnoreCase(nome);
        }
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Aluno> buscarPorId(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody Aluno aluno) {
        if (aluno.getMatricula() != null && repository.existsByMatricula(aluno.getMatricula())) {
            return ResponseEntity.badRequest().body("Matricula já cadastrada: " + aluno.getMatricula());
        }
        aluno.setAtivo(true);
        return ResponseEntity.ok(repository.save(aluno));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizar(@PathVariable Long id, @RequestBody Aluno dadosAluno) {
        return repository.findById(id).map(aluno -> {
            aluno.setNome(dadosAluno.getNome());
            aluno.setMatricula(dadosAluno.getMatricula());
            aluno.setDataNascimento(dadosAluno.getDataNascimento());
            aluno.setEmail(dadosAluno.getEmail());
            aluno.setTelefone(dadosAluno.getTelefone());
            aluno.setEndereco(dadosAluno.getEndereco());
            if (dadosAluno.getAtivo() != null) aluno.setAtivo(dadosAluno.getAtivo());
            return ResponseEntity.ok(repository.save(aluno));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle-ativo")
    public ResponseEntity<Aluno> toggleAtivo(@PathVariable Long id) {
        return repository.findById(id).map(aluno -> {
            aluno.setAtivo(!aluno.getAtivo());
            return ResponseEntity.ok(repository.save(aluno));
        }).orElse(ResponseEntity.notFound().build());
    }
}

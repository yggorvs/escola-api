package com.escola.controller;

import com.escola.model.*;
import com.escola.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/presencas")
public class PresencaController {

    @Autowired private PresencaRepository presencaRepository;
    @Autowired private AlunoRepository alunoRepository;
    @Autowired private TurmaMateriaRepository turmaMateriaRepository;

    @GetMapping
    public List<Presenca> listar(
            @RequestParam(required = false) Long turmaMateriaId,
            @RequestParam(required = false) Long alunoId,
            @RequestParam(required = false) String data) {
        if (turmaMateriaId != null && data != null) {
            return presencaRepository.findByTurmaMateriaIdAndData(turmaMateriaId, LocalDate.parse(data));
        }
        if (turmaMateriaId != null) return presencaRepository.findByTurmaMateriaId(turmaMateriaId);
        if (alunoId != null) return presencaRepository.findByAlunoId(alunoId);
        return presencaRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Presenca> registrar(@RequestBody Presenca presenca) {
        if (presenca.getData() == null) presenca.setData(LocalDate.now());
        return ResponseEntity.ok(presencaRepository.save(presenca));
    }

    @PostMapping("/lote")
    public ResponseEntity<List<Presenca>> registrarLote(@RequestBody List<Presenca> presencas) {
        List<Presenca> salvas = new ArrayList<>();
        for (Presenca p : presencas) {
            if (p.getData() == null) p.setData(LocalDate.now());
            salvas.add(presencaRepository.save(p));
        }
        return ResponseEntity.ok(salvas);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Presenca> atualizar(@PathVariable Long id, @RequestBody Presenca dados) {
        return presencaRepository.findById(id).map(p -> {
            p.setPresente(dados.getPresente());
            p.setObservacao(dados.getObservacao());
            return ResponseEntity.ok(presencaRepository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        if (!presencaRepository.existsById(id)) return ResponseEntity.notFound().build();
        presencaRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/frequencia")
    public ResponseEntity<Map<String, Object>> calcularFrequencia(
            @RequestParam Long alunoId,
            @RequestParam Long turmaMateriaId) {
        long total = presencaRepository.countByAlunoAndTurmaMateria(alunoId, turmaMateriaId);
        long presentes = presencaRepository.countPresencasByAlunoAndTurmaMateria(alunoId, turmaMateriaId);
        double percentual = total > 0 ? (presentes * 100.0 / total) : 0;

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("totalAulas", total);
        resultado.put("presencas", presentes);
        resultado.put("faltas", total - presentes);
        resultado.put("percentual", Math.round(percentual * 10.0) / 10.0);
        resultado.put("situacao", percentual >= 75 ? "REGULAR" : "IRREGULAR");

        return ResponseEntity.ok(resultado);
    }
}

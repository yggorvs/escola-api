package com.escola.repository;

import com.escola.model.Turma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TurmaRepository extends JpaRepository<Turma, Long> {
    List<Turma> findByAno(Integer ano);
    List<Turma> findByNomeContainingIgnoreCase(String nome);
    List<Turma> findByCursoId(Long cursoId);
    List<Turma> findByCursoIdIsNull();
}

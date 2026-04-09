package com.escola.repository;

import com.escola.model.Curso;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CursoRepository extends JpaRepository<Curso, Long> {
    List<Curso> findByAtivoTrue();
    List<Curso> findByNomeContainingIgnoreCase(String nome);
    long countByAtivoTrue();
}

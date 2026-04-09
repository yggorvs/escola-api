package com.escola.repository;

import com.escola.model.CursoMateria;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CursomateriaRepository extends JpaRepository<CursoMateria, Long> {
    List<CursoMateria> findByCursoId(Long cursoId);
    List<CursoMateria> findByCursoIdOrderBySemestreAsc(Long cursoId);
    boolean existsByCursoIdAndMateriaIdAndSemestre(Long cursoId, Long materiaId, Integer semestre);
}

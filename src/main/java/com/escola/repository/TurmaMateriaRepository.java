package com.escola.repository;

import com.escola.model.TurmaMateria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TurmaMateriaRepository extends JpaRepository<TurmaMateria, Long> {
    List<TurmaMateria> findByTurmaId(Long turmaId);
    List<TurmaMateria> findByProfessorId(Long professorId);
    List<TurmaMateria> findByMateriaId(Long materiaId);
}

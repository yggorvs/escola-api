package com.escola.repository;

import com.escola.model.Materia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MateriaRepository extends JpaRepository<Materia, Long> {
    List<Materia> findByNomeContainingIgnoreCase(String nome);
    boolean existsByCodigo(String codigo);
}

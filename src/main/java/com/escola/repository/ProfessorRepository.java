package com.escola.repository;

import com.escola.model.Professor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ProfessorRepository extends JpaRepository<Professor, Long> {
    List<Professor> findByAtivoTrue();
    List<Professor> findByNomeContainingIgnoreCase(String nome);
    boolean existsByCpf(String cpf);
}

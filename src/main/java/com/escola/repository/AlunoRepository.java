package com.escola.repository;

import com.escola.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    List<Aluno> findByAtivoTrue();
    List<Aluno> findByNomeContainingIgnoreCase(String nome);
    Optional<Aluno> findByMatricula(String matricula);
    boolean existsByMatricula(String matricula);
}

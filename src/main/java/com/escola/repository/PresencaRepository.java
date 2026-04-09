package com.escola.repository;

import com.escola.model.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface PresencaRepository extends JpaRepository<Presenca, Long> {
    List<Presenca> findByAlunoId(Long alunoId);
    List<Presenca> findByTurmaMateriaId(Long turmaMateriaId);
    List<Presenca> findByTurmaMateriaIdAndData(Long turmaMateriaId, LocalDate data);

    @Query("SELECT COUNT(p) FROM Presenca p WHERE p.aluno.id = :alunoId AND p.turmaMateria.id = :turmaMateriaId")
    long countByAlunoAndTurmaMateria(@Param("alunoId") Long alunoId, @Param("turmaMateriaId") Long turmaMateriaId);

    @Query("SELECT COUNT(p) FROM Presenca p WHERE p.aluno.id = :alunoId AND p.turmaMateria.id = :turmaMateriaId AND p.presente = true")
    long countPresencasByAlunoAndTurmaMateria(@Param("alunoId") Long alunoId, @Param("turmaMateriaId") Long turmaMateriaId);

    @Query("SELECT p FROM Presenca p WHERE p.turmaMateria.turma.id = :turmaId AND p.data = :data")
    List<Presenca> findByTurmaIdAndData(@Param("turmaId") Long turmaId, @Param("data") LocalDate data);

    // ── Queries com filtro de intervalo de datas ───────────────────────
    @Query("SELECT COUNT(p) FROM Presenca p WHERE p.aluno.id = :alunoId AND p.turmaMateria.id = :turmaMateriaId AND p.data BETWEEN :inicio AND :fim")
    long countByAlunoAndTurmaMateriaAndDateRange(
            @Param("alunoId") Long alunoId,
            @Param("turmaMateriaId") Long turmaMateriaId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim);

    @Query("SELECT COUNT(p) FROM Presenca p WHERE p.aluno.id = :alunoId AND p.turmaMateria.id = :turmaMateriaId AND p.presente = true AND p.data BETWEEN :inicio AND :fim")
    long countPresencasByAlunoAndTurmaMateriaAndDateRange(
            @Param("alunoId") Long alunoId,
            @Param("turmaMateriaId") Long turmaMateriaId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim);
}

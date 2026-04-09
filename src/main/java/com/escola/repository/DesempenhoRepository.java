package com.escola.repository;

import com.escola.model.Desempenho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface DesempenhoRepository extends JpaRepository<Desempenho, Long> {
    List<Desempenho> findByAlunoId(Long alunoId);
    List<Desempenho> findByTurmaMateriaId(Long turmaMateriaId);
    List<Desempenho> findByAlunoIdAndTurmaMateriaId(Long alunoId, Long turmaMateriaId);

    @Query("SELECT AVG(d.nota) FROM Desempenho d WHERE d.aluno.id = :alunoId AND d.turmaMateria.id = :turmaMateriaId")
    Double mediaNotasByAlunoAndTurmaMateria(@Param("alunoId") Long alunoId, @Param("turmaMateriaId") Long turmaMateriaId);

    @Query("SELECT AVG(d.nota) FROM Desempenho d WHERE d.turmaMateria.materia.id = :materiaId")
    Double mediaNotasByMateria(@Param("materiaId") Long materiaId);

    @Query("SELECT AVG(d.nota) FROM Desempenho d WHERE d.turmaMateria.turma.id = :turmaId")
    Double mediaNotasByTurma(@Param("turmaId") Long turmaId);

    // ── Queries com filtro de data ─────────────────────────────────────
    @Query("SELECT AVG(d.nota) FROM Desempenho d WHERE d.turmaMateria.materia.id = :materiaId AND d.data BETWEEN :inicio AND :fim")
    Double mediaNotasByMateriaAndDateRange(
            @Param("materiaId") Long materiaId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim);

    @Query("SELECT AVG(d.nota) FROM Desempenho d WHERE d.aluno.id = :alunoId AND d.turmaMateria.id = :turmaMateriaId AND d.data BETWEEN :inicio AND :fim")
    Double mediaNotasByAlunoAndTurmaMateriaAndDateRange(
            @Param("alunoId") Long alunoId,
            @Param("turmaMateriaId") Long turmaMateriaId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim);

    // ── Queries para análise por Matéria ──────────────────────────────
    @Query("SELECT d FROM Desempenho d WHERE d.turmaMateria.materia.id = :materiaId ORDER BY d.aluno.nome, d.data")
    List<Desempenho> findByMateriaId(@Param("materiaId") Long materiaId);

    @Query("SELECT d FROM Desempenho d WHERE d.turmaMateria.materia.id = :materiaId AND d.data BETWEEN :inicio AND :fim ORDER BY d.aluno.nome, d.data")
    List<Desempenho> findByMateriaIdAndDateRange(
            @Param("materiaId") Long materiaId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim);

    @Query("SELECT d FROM Desempenho d WHERE d.turmaMateria.materia.id = :materiaId AND d.turmaMateria.turma.id = :turmaId ORDER BY d.aluno.nome, d.data")
    List<Desempenho> findByMateriaIdAndTurmaId(
            @Param("materiaId") Long materiaId,
            @Param("turmaId") Long turmaId);

    @Query("SELECT d FROM Desempenho d WHERE d.turmaMateria.materia.id = :materiaId AND d.turmaMateria.turma.id = :turmaId AND d.data BETWEEN :inicio AND :fim ORDER BY d.aluno.nome, d.data")
    List<Desempenho> findByMateriaIdAndTurmaIdAndDateRange(
            @Param("materiaId") Long materiaId,
            @Param("turmaId") Long turmaId,
            @Param("inicio") LocalDate inicio,
            @Param("fim") LocalDate fim);
}

package com.escola.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "desempenhos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Desempenho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "aluno_id", nullable = false)
    private Aluno aluno;

    @ManyToOne
    @JoinColumn(name = "turma_materia_id", nullable = false)
    private TurmaMateria turmaMateria;

    @Column(nullable = false)
    private Double nota;

    private String tipo; // prova, trabalho, participacao, etc.

    private String descricao;

    private LocalDate data;
}

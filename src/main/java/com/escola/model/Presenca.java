package com.escola.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "presencas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Presenca {

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
    private LocalDate data;

    @Column(nullable = false)
    private Boolean presente = false;

    private String observacao;
}

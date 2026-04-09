package com.escola.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "curso_materias",
       uniqueConstraints = @UniqueConstraint(columnNames = {"curso_id", "materia_id", "semestre"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CursoMateria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne
    @JoinColumn(name = "curso_id", nullable = false)
    private Curso curso;

    @ManyToOne
    @JoinColumn(name = "materia_id", nullable = false)
    private Materia materia;

    private Integer semestre; // semestre do curso em que a matéria é ministrada

    private Boolean obrigatoria = true;
}

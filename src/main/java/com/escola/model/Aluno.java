package com.escola.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "alunos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nome;

    @Column(unique = true, nullable = false)
    private String matricula;

    private LocalDate dataNascimento;

    private String email;

    private String telefone;

    private String endereco;

    @Column(nullable = false)
    private Boolean ativo = true;

    @JsonIgnore
    @ManyToMany(mappedBy = "alunos")
    private List<Turma> turmas;
}

package com.example.ems.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "employees")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "First name is required")
    @Size(max = 50, message = "First name must be at most 50 characters")
    @Column(nullable = false, length = 50)
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 50, message = "Last name must be at most 50 characters")
    @Column(nullable = false, length = 50)
    private String lastName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Pattern(regexp = "^[0-9+\\-\\s()]{6,20}$", message = "Phone number is invalid")
    @Column(length = 20)
    private String phoneNumber;

    @NotBlank(message = "Department is required")
    @Column(nullable = false, length = 50)
    private String department;

    @NotBlank(message = "Job title is required")
    @Column(nullable = false, length = 80)
    private String jobTitle;

    @NotNull(message = "Salary is required")
    @Positive(message = "Salary must be greater than zero")
    @Column(nullable = false)
    private Double salary;

    @NotNull(message = "Date of joining is required")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @Column(nullable = false)
    private LocalDate dateOfJoining;
}

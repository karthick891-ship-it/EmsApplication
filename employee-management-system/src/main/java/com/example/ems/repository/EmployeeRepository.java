package com.example.ems.repository;

import com.example.ems.model.Employee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    boolean existsByEmailIgnoreCase(String email);

    Optional<Employee> findByEmailIgnoreCase(String email);

    List<Employee> findByDepartmentIgnoreCase(String department);

    List<Employee> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCaseOrJobTitleContainingIgnoreCase(
            String firstName, String lastName, String email, String department, String jobTitle);
}

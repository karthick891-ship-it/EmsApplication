package com.example.ems.controller;

import com.example.ems.dto.EmployeeStats;
import com.example.ems.model.Employee;
import com.example.ems.service.EmployeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EmployeeController {

    private final EmployeeService employeeService;

    // GET /api/employees                -> all employees
    // GET /api/employees?keyword=...    -> search by name/email/department/job title
    // GET /api/employees?department=... -> filter by exact department
    @GetMapping
    public ResponseEntity<List<Employee>> getEmployees(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String department) {

        if (keyword != null && !keyword.isBlank()) {
            return ResponseEntity.ok(employeeService.searchEmployees(keyword));
        }
        if (department != null && !department.isBlank()) {
            return ResponseEntity.ok(employeeService.getEmployeesByDepartment(department));
        }
        return ResponseEntity.ok(employeeService.getAllEmployees());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> getEmployeeById(@PathVariable Long id) {
        return ResponseEntity.ok(employeeService.getEmployeeById(id));
    }

    @PostMapping
    public ResponseEntity<Employee> createEmployee(@Valid @RequestBody Employee employee) {
        Employee created = employeeService.createEmployee(employee);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> updateEmployee(@PathVariable Long id, @Valid @RequestBody Employee employee) {
        return ResponseEntity.ok(employeeService.updateEmployee(id, employee));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteEmployee(@PathVariable Long id) {
        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/departments")
    public ResponseEntity<List<String>> getDepartments() {
        return ResponseEntity.ok(employeeService.getAllDepartments());
    }

    @GetMapping("/stats")
    public ResponseEntity<EmployeeStats> getStats() {
        return ResponseEntity.ok(employeeService.getStats());
    }
}

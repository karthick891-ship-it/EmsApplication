package com.example.ems.service;

import com.example.ems.dto.EmployeeStats;
import com.example.ems.exception.DuplicateEmailException;
import com.example.ems.exception.ResourceNotFoundException;
import com.example.ems.model.Employee;
import com.example.ems.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Employee> getAllEmployees() {
        return employeeRepository.findAll(org.springframework.data.domain.Sort.by("id").descending());
    }

    @Override
    @Transactional(readOnly = true)
    public Employee getEmployeeById(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));
    }

    @Override
    public Employee createEmployee(Employee employee) {
        if (employeeRepository.existsByEmailIgnoreCase(employee.getEmail())) {
            throw new DuplicateEmailException("An employee with email '" + employee.getEmail() + "' already exists");
        }
        employee.setId(null);
        return employeeRepository.save(employee);
    }

    @Override
    public Employee updateEmployee(Long id, Employee updated) {
        Employee existing = getEmployeeById(id);

        // If the email changed, make sure it's not already used by another employee
        if (!existing.getEmail().equalsIgnoreCase(updated.getEmail())
                && employeeRepository.existsByEmailIgnoreCase(updated.getEmail())) {
            throw new DuplicateEmailException("An employee with email '" + updated.getEmail() + "' already exists");
        }

        existing.setFirstName(updated.getFirstName());
        existing.setLastName(updated.getLastName());
        existing.setEmail(updated.getEmail());
        existing.setPhoneNumber(updated.getPhoneNumber());
        existing.setDepartment(updated.getDepartment());
        existing.setJobTitle(updated.getJobTitle());
        existing.setSalary(updated.getSalary());
        existing.setDateOfJoining(updated.getDateOfJoining());

        return employeeRepository.save(existing);
    }

    @Override
    public void deleteEmployee(Long id) {
        Employee existing = getEmployeeById(id);
        employeeRepository.delete(existing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Employee> searchEmployees(String keyword) {
        if (keyword == null || keyword.isBlank()) {
            return getAllEmployees();
        }
        return employeeRepository
                .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrDepartmentContainingIgnoreCaseOrJobTitleContainingIgnoreCase(
                        keyword, keyword, keyword, keyword, keyword);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Employee> getEmployeesByDepartment(String department) {
        return employeeRepository.findByDepartmentIgnoreCase(department);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> getAllDepartments() {
        return employeeRepository.findAll().stream()
                .map(Employee::getDepartment)
                .filter(d -> d != null && !d.isBlank())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeStats getStats() {
        List<Employee> all = employeeRepository.findAll();

        long total = all.size();

        double avgSalary = all.stream()
                .mapToDouble(Employee::getSalary)
                .average()
                .orElse(0.0);

        LocalDate startOfMonth = LocalDate.now().withDayOfMonth(1);
        long newHires = all.stream()
                .filter(e -> e.getDateOfJoining() != null && !e.getDateOfJoining().isBefore(startOfMonth))
                .count();

        var perDept = all.stream()
                .collect(Collectors.groupingBy(Employee::getDepartment, Collectors.counting()))
                .entrySet().stream()
                .sorted(Comparator.comparing(e -> e.getKey()))
                .collect(Collectors.toMap(
                        java.util.Map.Entry::getKey,
                        java.util.Map.Entry::getValue,
                        (a, b) -> a,
                        java.util.LinkedHashMap::new));

        return new EmployeeStats(total, perDept.size(), avgSalary, newHires, perDept);
    }
}

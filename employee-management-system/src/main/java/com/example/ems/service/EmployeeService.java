package com.example.ems.service;

import com.example.ems.dto.EmployeeStats;
import com.example.ems.model.Employee;

import java.util.List;

public interface EmployeeService {

    List<Employee> getAllEmployees();

    Employee getEmployeeById(Long id);

    Employee createEmployee(Employee employee);

    Employee updateEmployee(Long id, Employee employee);

    void deleteEmployee(Long id);

    List<Employee> searchEmployees(String keyword);

    List<Employee> getEmployeesByDepartment(String department);

    List<String> getAllDepartments();

    EmployeeStats getStats();
}

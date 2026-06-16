package com.example.ems.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeStats {

    private long totalEmployees;
    private long totalDepartments;
    private double averageSalary;
    private long newHiresThisMonth;
    private Map<String, Long> employeesPerDepartment;
}

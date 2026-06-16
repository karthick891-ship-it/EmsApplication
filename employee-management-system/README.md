# Employee Management System

A full-stack Employee Management System built with **Spring Boot 3 (Java 17)** on the
backend and a lightweight **HTML / CSS / vanilla JavaScript** frontend, served directly
by Spring Boot as static resources — no separate frontend server required.

It supports full CRUD on employee records, live search, department filtering, and a
dashboard overview with workforce statistics.

---

## ✨ Features

- **Dashboard / Overview** — total employees, number of departments, average salary,
  new hires this month, and a department headcount breakdown.
- **Employee Directory** — searchable, filterable table of all employees.
- **Add / Edit / Delete employees** via a modal form with client-side and server-side
  validation.
- **REST API** backed by Spring Data JPA and an in-memory H2 database (zero setup —
  comes preloaded with sample data).
- Clean error handling with meaningful JSON error responses (404, 409 duplicate
  email, 400 validation errors).

---

## 🧱 Tech Stack

| Layer    | Technology                                              |
|----------|----------------------------------------------------------|
| Backend  | Java 17, Spring Boot 3.3, Spring Web, Spring Data JPA   |
| Database | H2 (in-memory)                                          |
| Frontend | HTML5, CSS3, vanilla JavaScript (no build step)         |
| Build    | Maven                                                    |

---

## 📁 Project Structure

```
employee-management-system/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/example/ems/
│   │   │   ├── EmsApplication.java          # Spring Boot entry point
│   │   │   ├── model/Employee.java          # JPA entity
│   │   │   ├── repository/EmployeeRepository.java
│   │   │   ├── service/EmployeeService.java
│   │   │   ├── service/EmployeeServiceImpl.java
│   │   │   ├── controller/EmployeeController.java
│   │   │   ├── dto/EmployeeStats.java
│   │   │   └── exception/
│   │   │       ├── ResourceNotFoundException.java
│   │   │       ├── DuplicateEmailException.java
│   │   │       └── GlobalExceptionHandler.java
│   │   └── resources/
│   │       ├── application.properties       # H2 + JPA config
│   │       ├── data.sql                      # Sample employee data
│   │       └── static/
│   │           ├── index.html
│   │           ├── css/style.css
│   │           └── js/script.js
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Java 17 or later
- Maven 3.6+

### Run the application

```bash
cd employee-management-system
mvn spring-boot:run
```

Or build a jar and run it:

```bash
mvn clean package
java -jar target/employee-management-system.jar
```

The application starts on **http://localhost:8080**.

Open **http://localhost:8080** in your browser to use the web UI. The app comes
preloaded with 10 sample employees so the dashboard is populated immediately.

### H2 Database Console (optional)

Visit `http://localhost:8080/h2-console` and connect with:

- **JDBC URL:** `jdbc:h2:mem:emsdb`
- **Username:** `sa`
- **Password:** *(leave blank)*

---

## 🔌 REST API Reference

Base URL: `/api/employees`

| Method | Endpoint                          | Description                                  |
|--------|-----------------------------------|-----------------------------------------------|
| GET    | `/api/employees`                  | List all employees                            |
| GET    | `/api/employees?keyword=...`      | Search by name, email, department, job title  |
| GET    | `/api/employees?department=...`   | Filter by exact department                    |
| GET    | `/api/employees/{id}`             | Get a single employee                         |
| POST   | `/api/employees`                  | Create a new employee                         |
| PUT    | `/api/employees/{id}`             | Update an existing employee                   |
| DELETE | `/api/employees/{id}`             | Delete an employee                            |
| GET    | `/api/employees/departments`      | List distinct department names                |
| GET    | `/api/employees/stats`            | Dashboard summary statistics                  |

### Sample request body (POST / PUT)

```json
{
  "firstName": "Asha",
  "lastName": "Kapoor",
  "email": "asha.kapoor@example.com",
  "phoneNumber": "+91 90000 00000",
  "department": "Engineering",
  "jobTitle": "Backend Developer",
  "salary": 75000,
  "dateOfJoining": "2024-05-12"
}
```

### Validation rules

- `firstName`, `lastName`, `department`, `jobTitle` — required
- `email` — required, must be a valid email, must be unique
- `phoneNumber` — optional, but if provided must match `^[0-9+\-\s()]{6,20}$`
- `salary` — required, must be greater than 0
- `dateOfJoining` — required, format `yyyy-MM-dd`

### Error responses

```json
{
  "timestamp": "2026-06-15T10:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "An employee with email 'asha.kapoor@example.com' already exists"
}
```

---

## 🎨 Frontend

The frontend is plain HTML/CSS/JS served from `src/main/resources/static`, so it's
automatically available at the root of the application — no separate dev server or
build tooling needed. It communicates with the backend purely through the REST API
listed above using `fetch`.

- **Overview** tab — summary stat cards and a department mix chart
- **Directory** tab — searchable/filterable employee table with add, edit, and delete

---

## 🛠️ Customization Ideas

- Add authentication (Spring Security) for HR-only access
- Add pagination/sorting to the employee table for larger datasets
- Swap H2 for PostgreSQL/MySQL by updating `application.properties` and the JDBC
  driver dependency in `pom.xml`
- Add a "department" management screen instead of free-text department entry

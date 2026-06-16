/* ==========================================================================
   Employee Management System — frontend logic
   Talks to the Spring Boot REST API at /api/employees
   ========================================================================== */

const API_BASE = "/api/employees";

const state = {
  employees: [],
  departments: [],
  view: "overview",
  editingId: null,
  pendingDeleteId: null,
};

/* ----------------------------------------------------------------------
   DOM references
   ---------------------------------------------------------------------- */
const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: {
    overview: document.getElementById("view-overview"),
    directory: document.getElementById("view-directory"),
  },
  pageTitle: document.getElementById("page-title"),
  pageSubtitle: document.getElementById("page-subtitle"),

  // Overview
  statTotal: document.getElementById("stat-total"),
  statDepartments: document.getElementById("stat-departments"),
  statAvgSalary: document.getElementById("stat-avg-salary"),
  statNewHires: document.getElementById("stat-new-hires"),
  deptBar: document.getElementById("dept-bar"),
  deptLegend: document.getElementById("dept-legend"),

  // Directory
  searchInput: document.getElementById("search-input"),
  departmentFilter: document.getElementById("department-filter"),
  tbody: document.getElementById("employee-tbody"),
  emptyState: document.getElementById("empty-state"),
  emptyStateText: document.getElementById("empty-state-text"),

  // Modal: add/edit
  openAddModalBtn: document.getElementById("open-add-modal"),
  employeeModal: document.getElementById("employee-modal"),
  modalTitle: document.getElementById("modal-title"),
  closeModalBtn: document.getElementById("close-modal"),
  cancelModalBtn: document.getElementById("cancel-modal"),
  employeeForm: document.getElementById("employee-form"),
  employeeIdField: document.getElementById("employee-id"),
  formError: document.getElementById("form-error"),
  saveButton: document.getElementById("save-button"),
  departmentOptions: document.getElementById("department-options"),

  // Modal: confirm delete
  confirmModal: document.getElementById("confirm-modal"),
  confirmText: document.getElementById("confirm-text"),
  confirmCancelBtn: document.getElementById("confirm-cancel"),
  confirmDeleteBtn: document.getElementById("confirm-delete"),

  toastContainer: document.getElementById("toast-container"),
};

const PAGE_COPY = {
  overview: {
    title: "Overview",
    subtitle: "A snapshot of your workforce, updated in real time.",
  },
  directory: {
    title: "Directory",
    subtitle: "Browse, search and manage employee records.",
  },
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const DATE_FORMATTER = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/* ----------------------------------------------------------------------
   Helpers
   ---------------------------------------------------------------------- */
function getInitials(firstName, lastName) {
  const a = (firstName || "").trim().charAt(0);
  const b = (lastName || "").trim().charAt(0);
  return (a + b).toUpperCase() || "?";
}

// Deterministic category (1-6) from a string, used to color-code avatars/tags by department
function categoryFor(text) {
  const str = (text || "").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return (hash % 6) + 1;
}

function formatCurrency(value) {
  if (value === null || value === undefined) return "—";
  return CURRENCY_FORMATTER.format(value);
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (Number.isNaN(d.getTime())) return dateStr;
  return DATE_FORMATTER.format(d);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/* ----------------------------------------------------------------------
   Toasts
   ---------------------------------------------------------------------- */
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-dot"></span><span>${escapeHtml(message)}</span>`;
  els.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.2s ease";
    setTimeout(() => toast.remove(), 220);
  }, 3200);
}

/* ----------------------------------------------------------------------
   API
   ---------------------------------------------------------------------- */
async function apiRequest(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let payload = null;
    try {
      payload = await res.json();
      if (payload.message) message = payload.message;
      else if (payload.error) message = payload.error;
    } catch (_) {
      /* response had no JSON body */
    }
    const error = new Error(message);
    error.status = res.status;
    error.payload = payload;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json();
}

const api = {
  list: () => apiRequest(API_BASE),
  stats: () => apiRequest(`${API_BASE}/stats`),
  departments: () => apiRequest(`${API_BASE}/departments`),
  create: (data) => apiRequest(API_BASE, { method: "POST", body: JSON.stringify(data) }),
  update: (id, data) => apiRequest(`${API_BASE}/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`${API_BASE}/${id}`, { method: "DELETE" }),
};

/* ----------------------------------------------------------------------
   View switching
   ---------------------------------------------------------------------- */
function switchView(viewName) {
  state.view = viewName;

  els.navItems.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  Object.entries(els.views).forEach(([name, section]) => {
    section.classList.toggle("active", name === viewName);
  });

  const copy = PAGE_COPY[viewName];
  els.pageTitle.textContent = copy.title;
  els.pageSubtitle.textContent = copy.subtitle;
}

els.navItems.forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

/* ----------------------------------------------------------------------
   Overview rendering
   ---------------------------------------------------------------------- */
async function loadOverview() {
  try {
    const stats = await api.stats();

    els.statTotal.textContent = stats.totalEmployees;
    els.statDepartments.textContent = stats.totalDepartments;
    els.statAvgSalary.textContent = stats.totalEmployees ? formatCurrency(stats.averageSalary) : "—";
    els.statNewHires.textContent = stats.newHiresThisMonth;

    renderDepartmentMix(stats.employeesPerDepartment || {}, stats.totalEmployees || 0);
  } catch (err) {
    showToast(`Couldn't load overview: ${err.message}`, "error");
  }
}

function renderDepartmentMix(perDepartment, total) {
  els.deptBar.innerHTML = "";
  els.deptLegend.innerHTML = "";

  const entries = Object.entries(perDepartment);

  if (!entries.length || !total) {
    els.deptBar.innerHTML = `<div class="dept-bar-segment" style="flex-basis: 100%; background: var(--border);"></div>`;
    els.deptLegend.innerHTML = `<li>No employees yet — add your first one to see the breakdown.</li>`;
    return;
  }

  entries.forEach(([dept, count]) => {
    const pct = (count / total) * 100;
    const cat = categoryFor(dept);

    const segment = document.createElement("div");
    segment.className = "dept-bar-segment";
    segment.style.flexBasis = `${pct}%`;
    segment.style.background = `rgb(var(--c${cat}-rgb))`;
    segment.title = `${dept}: ${count}`;
    els.deptBar.appendChild(segment);

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="swatch" style="background: rgb(var(--c${cat}-rgb));"></span>
      <span>${escapeHtml(dept)}</span>
      <span class="count">${count}</span>
    `;
    els.deptLegend.appendChild(li);
  });
}

/* ----------------------------------------------------------------------
   Directory rendering
   ---------------------------------------------------------------------- */
async function loadDirectory() {
  try {
    state.employees = await api.list();
    renderDirectory();
  } catch (err) {
    showToast(`Couldn't load employees: ${err.message}`, "error");
  }
}

async function loadDepartmentOptions() {
  try {
    state.departments = await api.departments();

    // Filter dropdown
    els.departmentFilter.innerHTML = '<option value="">All departments</option>';
    state.departments.forEach((dept) => {
      const opt = document.createElement("option");
      opt.value = dept;
      opt.textContent = dept;
      els.departmentFilter.appendChild(opt);
    });

    // Datalist for the add/edit form
    els.departmentOptions.innerHTML = "";
    state.departments.forEach((dept) => {
      const opt = document.createElement("option");
      opt.value = dept;
      els.departmentOptions.appendChild(opt);
    });
  } catch (err) {
    showToast(`Couldn't load departments: ${err.message}`, "error");
  }
}

function getFilteredEmployees() {
  const keyword = els.searchInput.value.trim().toLowerCase();
  const department = els.departmentFilter.value;

  return state.employees.filter((emp) => {
    const matchesDept = !department || emp.department === department;
    if (!matchesDept) return false;

    if (!keyword) return true;

    const haystack = [
      emp.firstName,
      emp.lastName,
      emp.email,
      emp.department,
      emp.jobTitle,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(keyword);
  });
}

function renderDirectory() {
  const filtered = getFilteredEmployees();

  els.tbody.innerHTML = "";

  if (!filtered.length) {
    els.emptyState.classList.remove("hidden");
    els.emptyStateText.textContent = state.employees.length
      ? "Try a different search term or department filter."
      : "Add your first employee to get started.";
    return;
  }

  els.emptyState.classList.add("hidden");

  filtered.forEach((emp) => {
    const cat = categoryFor(emp.department);
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <div class="employee-cell">
          <div class="avatar cat-${cat}">${escapeHtml(getInitials(emp.firstName, emp.lastName))}</div>
          <div class="employee-name">
            <strong>${escapeHtml(emp.firstName)} ${escapeHtml(emp.lastName)}</strong>
            <span>${escapeHtml(emp.phoneNumber || "No phone on file")}</span>
          </div>
        </div>
      </td>
      <td>${escapeHtml(emp.email)}</td>
      <td><span class="tag cat-${cat}">${escapeHtml(emp.department)}</span></td>
      <td>${escapeHtml(emp.jobTitle)}</td>
      <td class="salary-cell">${formatCurrency(emp.salary)}</td>
      <td>${formatDate(emp.dateOfJoining)}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" data-action="edit" data-id="${emp.id}" aria-label="Edit ${escapeHtml(emp.firstName)} ${escapeHtml(emp.lastName)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="icon-btn danger" data-action="delete" data-id="${emp.id}" aria-label="Remove ${escapeHtml(emp.firstName)} ${escapeHtml(emp.lastName)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </td>
    `;

    els.tbody.appendChild(tr);
  });
}

let searchDebounce;
els.searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(renderDirectory, 150);
});

els.departmentFilter.addEventListener("change", renderDirectory);

/* ----------------------------------------------------------------------
   Add / Edit modal
   ---------------------------------------------------------------------- */
const FORM_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "phoneNumber",
  "department",
  "jobTitle",
  "salary",
  "dateOfJoining",
];

function clearFormErrors() {
  els.formError.classList.add("hidden");
  els.formError.textContent = "";
  FORM_FIELDS.forEach((name) => {
    const input = document.getElementById(name);
    const errorEl = document.querySelector(`.field-error[data-for="${name}"]`);
    input.classList.remove("invalid");
    if (errorEl) errorEl.textContent = "";
  });
}

function openModal(employee = null) {
  clearFormErrors();
  els.employeeForm.reset();

  if (employee) {
    state.editingId = employee.id;
    els.modalTitle.textContent = "Edit employee";
    els.saveButton.textContent = "Save changes";
    els.employeeIdField.value = employee.id;

    FORM_FIELDS.forEach((name) => {
      const input = document.getElementById(name);
      input.value = employee[name] ?? "";
    });
  } else {
    state.editingId = null;
    els.modalTitle.textContent = "Add employee";
    els.saveButton.textContent = "Save employee";
    els.employeeIdField.value = "";
  }

  els.employeeModal.classList.add("show");
  document.getElementById("firstName").focus();
}

function closeModal() {
  els.employeeModal.classList.remove("show");
  state.editingId = null;
}

els.openAddModalBtn.addEventListener("click", () => openModal());
els.closeModalBtn.addEventListener("click", closeModal);
els.cancelModalBtn.addEventListener("click", closeModal);
els.employeeModal.addEventListener("click", (e) => {
  if (e.target === els.employeeModal) closeModal();
});

function validateForm(payload) {
  const errors = {};

  if (!payload.firstName.trim()) errors.firstName = "First name is required.";
  if (!payload.lastName.trim()) errors.lastName = "Last name is required.";

  if (!payload.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    errors.email = "Enter a valid email address.";
  }

  if (payload.phoneNumber && !/^[0-9+\-\s()]{6,20}$/.test(payload.phoneNumber)) {
    errors.phoneNumber = "Enter a valid phone number.";
  }

  if (!payload.department.trim()) errors.department = "Department is required.";
  if (!payload.jobTitle.trim()) errors.jobTitle = "Job title is required.";

  if (payload.salary === "" || Number.isNaN(Number(payload.salary))) {
    errors.salary = "Enter a valid salary.";
  } else if (Number(payload.salary) <= 0) {
    errors.salary = "Salary must be greater than zero.";
  }

  if (!payload.dateOfJoining) errors.dateOfJoining = "Date of joining is required.";

  return errors;
}

function applyFieldErrors(errors) {
  Object.entries(errors).forEach(([field, message]) => {
    const input = document.getElementById(field);
    const errorEl = document.querySelector(`.field-error[data-for="${field}"]`);
    if (input) input.classList.add("invalid");
    if (errorEl) errorEl.textContent = message;
  });
}

els.employeeForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFormErrors();

  const payload = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    email: document.getElementById("email").value.trim(),
    phoneNumber: document.getElementById("phoneNumber").value.trim(),
    department: document.getElementById("department").value.trim(),
    jobTitle: document.getElementById("jobTitle").value.trim(),
    salary: document.getElementById("salary").value,
    dateOfJoining: document.getElementById("dateOfJoining").value,
  };

  const errors = validateForm(payload);
  if (Object.keys(errors).length) {
    applyFieldErrors(errors);
    return;
  }

  payload.salary = Number(payload.salary);
  if (!payload.phoneNumber) delete payload.phoneNumber;

  els.saveButton.disabled = true;
  els.saveButton.textContent = "Saving…";

  try {
    if (state.editingId) {
      await api.update(state.editingId, payload);
      showToast("Employee updated.", "success");
    } else {
      await api.create(payload);
      showToast("Employee added.", "success");
    }

    closeModal();
    await Promise.all([loadDirectory(), loadOverview(), loadDepartmentOptions()]);
  } catch (err) {
    if (err.status === 400 && err.payload?.fieldErrors) {
      applyFieldErrors(err.payload.fieldErrors);
    } else {
      els.formError.textContent = err.message;
      els.formError.classList.remove("hidden");
    }
  } finally {
    els.saveButton.disabled = false;
    els.saveButton.textContent = state.editingId ? "Save changes" : "Save employee";
  }
});

/* ----------------------------------------------------------------------
   Delete confirmation modal
   ---------------------------------------------------------------------- */
function openConfirm(employee) {
  state.pendingDeleteId = employee.id;
  els.confirmText.textContent = `This will permanently remove ${employee.firstName} ${employee.lastName} from the directory.`;
  els.confirmModal.classList.add("show");
}

function closeConfirm() {
  els.confirmModal.classList.remove("show");
  state.pendingDeleteId = null;
}

els.confirmCancelBtn.addEventListener("click", closeConfirm);
els.confirmModal.addEventListener("click", (e) => {
  if (e.target === els.confirmModal) closeConfirm();
});

els.confirmDeleteBtn.addEventListener("click", async () => {
  if (!state.pendingDeleteId) return;

  els.confirmDeleteBtn.disabled = true;
  els.confirmDeleteBtn.textContent = "Removing…";

  try {
    await api.remove(state.pendingDeleteId);
    showToast("Employee removed.", "success");
    closeConfirm();
    await Promise.all([loadDirectory(), loadOverview(), loadDepartmentOptions()]);
  } catch (err) {
    showToast(`Couldn't remove employee: ${err.message}`, "error");
  } finally {
    els.confirmDeleteBtn.disabled = false;
    els.confirmDeleteBtn.textContent = "Remove";
  }
});

/* ----------------------------------------------------------------------
   Table action delegation (edit / delete buttons)
   ---------------------------------------------------------------------- */
els.tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const employee = state.employees.find((emp) => emp.id === id);
  if (!employee) return;

  if (btn.dataset.action === "edit") {
    openModal(employee);
  } else if (btn.dataset.action === "delete") {
    openConfirm(employee);
  }
});

/* ----------------------------------------------------------------------
   Global keyboard shortcuts (Escape closes modals)
   ---------------------------------------------------------------------- */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (els.employeeModal.classList.contains("show")) closeModal();
  if (els.confirmModal.classList.contains("show")) closeConfirm();
});

/* ----------------------------------------------------------------------
   Init
   ---------------------------------------------------------------------- */
(async function init() {
  await Promise.all([loadOverview(), loadDirectory(), loadDepartmentOptions()]);
})();

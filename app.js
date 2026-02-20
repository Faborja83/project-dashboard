// Application State
const AppState = {
    projects: [],
    currentEditingId: null,
    filteredProjects: []
};

const today = new Date();
const API_URL = 'https://api.github.com';

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    loadProjects();
});

function initializeApp() {
    // Set active page
    showPage('dashboard');
}

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showPage(btn.dataset.page);
        });
    });

    // Dashboard
    document.getElementById('refreshBtn').addEventListener('click', loadProjects);
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('searchInput').addEventListener('input', filterProjects);
    document.getElementById('statusFilter').addEventListener('change', filterProjects);

    // Admin Panel
    document.getElementById('addProjectBtn').addEventListener('click', openAddProjectModal);
    document.getElementById('saveAllBtn').addEventListener('click', saveAllProjects);
    document.getElementById('projectForm').addEventListener('submit', saveProject);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('deleteBtn').addEventListener('click', deleteProject);
    document.querySelector('.close-btn').addEventListener('click', closeModal);

    // Progress input sync
    document.getElementById('progress').addEventListener('input', (e) => {
        document.getElementById('progressValue').value = e.target.value;
    });
    document.getElementById('progressValue').addEventListener('input', (e) => {
        document.getElementById('progress').value = e.target.value;
    });

    // Import/Export
    document.getElementById('importBtn').addEventListener('click', importCSV);
    document.getElementById('exportCsvBtn').addEventListener('click', exportToCSV);
    document.getElementById('exportJsonBtn').addEventListener('click', exportToJSON);
    document.getElementById('syncBtn').addEventListener('click', syncToGitHub);

    // File upload drag and drop
    const fileUpload = document.querySelector('.file-upload');
    fileUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUpload.style.borderColor = 'var(--primary)';
        fileUpload.style.background = 'rgba(102, 126, 234, 0.1)';
    });
    fileUpload.addEventListener('dragleave', () => {
        fileUpload.style.borderColor = '';
        fileUpload.style.background = '';
    });
    fileUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUpload.style.borderColor = '';
        fileUpload.style.background = '';
        document.getElementById('csvFile').files = e.dataTransfer.files;
    });
}

// Page Management
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`${page}-page`).classList.add('active');

    if (page === 'dashboard') {
        renderDashboard();
    } else if (page === 'admin') {
        renderAdminPanel();
    }
}

// Load Projects
function loadProjects() {
    // Try to load from localStorage first
    const stored = localStorage.getItem('projects');
    if (stored) {
        AppState.projects = JSON.parse(stored);
        updateLastSync();
        renderDashboard();
        showToast('Projects loaded from local storage', 'success');
    } else {
        // Load default projects
        AppState.projects = getDefaultProjects();
        saveToLocalStorage();
    }
}

function getDefaultProjects() {
    return [
        {
            id: 1,
            name: "Project Alpha",
            description: "Main product development",
            startDate: "2026-01-15",
            endDate: "2026-04-30",
            progress: 45,
            status: "in-progress",
            link: ""
        },
        {
            id: 2,
            name: "Project Beta",
            description: "Infrastructure upgrade",
            startDate: "2026-02-01",
            endDate: "2026-05-15",
            progress: 20,
            status: "in-progress",
            link: ""
        },
        {
            id: 3,
            name: "Project Gamma",
            description: "User research initiative",
            startDate: "2025-11-01",
            endDate: "2026-03-31",
            progress: 85,
            status: "at-risk",
            link: ""
        },
        {
            id: 4,
            name: "Project Delta",
            description: "Documentation",
            startDate: "2026-03-01",
            endDate: "2026-06-30",
            progress: 0,
            status: "in-progress",
            link: ""
        }
    ];
}

// Save to Local Storage
function saveToLocalStorage() {
    localStorage.setItem('projects', JSON.stringify(AppState.projects));
    updateLastSync();
}

function updateLastSync() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('lastSync').textContent = `Last sync: ${timeStr}`;
}

// Dashboard Rendering
function renderDashboard() {
    renderStats();
    renderGanttChart();
    filterProjects();
}

function renderStats() {
    const container = document.getElementById('stats');
    container.innerHTML = '';

    const total = AppState.projects.length;
    const published = AppState.projects.filter(p => p.status === 'published').length;
const accepted = AppState.projects.filter(p => p.status === 'accepted').length;
const underReview = AppState.projects.filter(p =>
    ['submitted','under-review','revision'].includes(p.status)
).length;

const writing = AppState.projects.filter(p =>
    ['idea','research','writing','internal-review','ready-to-submit'].includes(p.status)
).length;

    const avgProgress = total > 0 ? Math.round(AppState.projects.reduce((sum, p) => sum + p.progress, 0) / total) : 0;

    const stats = [
    { label: 'Total Projects', value: total },
    { label: 'Writing Phase', value: writing },
    { label: 'Under Review', value: underReview },
    { label: 'Accepted', value: accepted },
    { label: 'Published', value: published }
];


    stats.forEach(stat => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
            <div class="stat-number">${stat.value}</div>
            <div class="stat-label">${stat.label}</div>
        `;
        container.appendChild(card);
    });
}

function renderGanttChart() {
    const months = generateMonths();
    const header = document.getElementById('header');
    const labels = document.getElementById('labels');
    const chart = document.getElementById('chart');

    header.innerHTML = '';
    labels.innerHTML = '';
    chart.innerHTML = '';

    // Render header
    months.forEach(month => {
        const div = document.createElement('div');
        div.className = 'month-label';
        div.textContent = `${month.name} '${month.year.toString().slice(-2)}`;
        header.appendChild(div);
    });

    // Render rows
    AppState.projects.forEach(project => {
        // Label
        const label = document.createElement('div');
        label.className = 'gantt-row';
        label.innerHTML = `<div class="project-name" title="${project.name}">${project.name}</div>`;
        labels.appendChild(label);

        // Bar
        const row = document.createElement('div');
        row.className = `gantt-row ${project.status}`;

        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';

        months.forEach(month => {
            const cell = document.createElement('div');
            cell.className = 'bar-cell';

            const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
            const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);
            const projectStart = new Date(project.startDate);
            const projectEnd = new Date(project.endDate);

            if (projectStart <= monthEnd && projectEnd >= monthStart) {
                const bar = document.createElement('div');
                bar.className = 'progress-bar';
                bar.textContent = `${project.progress}%`;

                const monthDuration = monthEnd - monthStart;
                const projectMonthDuration = Math.min(monthEnd, projectEnd) - Math.max(monthStart, projectStart);
                const percentage = (projectMonthDuration / monthDuration) * 100;

                bar.style.width = `${Math.min(100, percentage)}%`;

                if (today > projectEnd && project.status !== 'completed') {
                    bar.style.opacity = '0.7';
                }

                cell.appendChild(bar);
            }

            barContainer.appendChild(cell);
        });

        row.appendChild(barContainer);
        chart.appendChild(row);
    });
}

function generateMonths(monthsCount = 12) {
    const months = [];
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);

    for (let i = 0; i < monthsCount; i++) {
        const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        months.push({
            name: date.toLocaleString('default', { month: 'short' }),
            year: date.getFullYear(),
            date: date
        });
    }

    return months;
}

function filterProjects() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;

    AppState.filteredProjects = AppState.projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(search) ||
                            project.description.toLowerCase().includes(search);
        const matchesStatus = !status || project.status === status;
        return matchesSearch && matchesStatus;
    });

    // Re-render only the chart part with filtered data
    const chart = document.getElementById('chart');
    const labels = document.getElementById('labels');
    chart.innerHTML = '';
    labels.innerHTML = '';

    const months = generateMonths();

    AppState.filteredProjects.forEach(project => {
        // Label
        const label = document.createElement('div');
        label.className = 'gantt-row';
        label.innerHTML = `<div class="project-name" title="${project.name}">${project.name}</div>`;
        labels.appendChild(label);

        // Bar
        const row = document.createElement('div');
        row.className = `gantt-row ${project.status}`;

        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';

        months.forEach(month => {
            const cell = document.createElement('div');
            cell.className = 'bar-cell';

            const monthStart = new Date(month.date.getFullYear(), month.date.getMonth(), 1);
            const monthEnd = new Date(month.date.getFullYear(), month.date.getMonth() + 1, 0);
            const projectStart = new Date(project.startDate);
            const projectEnd = new Date(project.endDate);

            if (projectStart <= monthEnd && projectEnd >= monthStart) {
                const bar = document.createElement('div');
                bar.className = 'progress-bar';
                bar.textContent = `${project.progress}%`;

                const monthDuration = monthEnd - monthStart;
                const projectMonthDuration = Math.min(monthEnd, projectEnd) - Math.max(monthStart, projectStart);
                const percentage = (projectMonthDuration / monthDuration) * 100;

                bar.style.width = `${Math.min(100, percentage)}%`;

                cell.appendChild(bar);
            }

            barContainer.appendChild(cell);
        });

        row.appendChild(barContainer);
        chart.appendChild(row);
    });
}

// Admin Panel
function renderAdminPanel() {
    const container = document.getElementById('projectsList');
    container.innerHTML = '';

    AppState.projects.forEach(project => {
        const card = document.createElement('div');
        card.className = `project-card ${project.status}`;
        card.innerHTML = `
            <div class="project-card-header">
                <div>
                    <div class="project-card-title">${project.name}</div>
                    <p style="color: var(--text-secondary); font-size: 12px; margin-top: 5px;">${project.description}</p>
                </div>
                <span class="project-card-status">${project.status}</span>
            </div>
            <div class="project-card-info">
                <div class="info-item">
                    <span class="info-label">Start Date</span>
                    <span class="info-value">${formatDate(project.startDate)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">End Date</span>
                    <span class="info-value">${formatDate(project.endDate)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Progress</span>
                    <span class="info-value">${project.progress}%</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Status</span>
                    <span class="info-value" style="text-transform: capitalize;">${project.status}</span>
                </div>
            </div>
            <div class="project-card-actions">
                <button class="btn btn-secondary" onclick="openEditProjectModal(${project.id})">✏️ Edit</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function openAddProjectModal() {
    AppState.currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Add New Project';
    document.getElementById('deleteBtn').style.display = 'none';
    document.getElementById('projectForm').reset();
    document.getElementById('progress').value = 0;
    document.getElementById('progressValue').value = 0;
    document.getElementById('projectModal').classList.add('active');
}

function openEditProjectModal(id) {
    const project = AppState.projects.find(p => p.id === id);
    if (!project) return;

    AppState.currentEditingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Project';
    document.getElementById('deleteBtn').style.display = 'grid';

    document.getElementById('projectName').value = project.name;
    document.getElementById('projectDescription').value = project.description;
    document.getElementById('startDate').value = project.startDate;
    document.getElementById('endDate').value = project.endDate;
    document.getElementById('progress').value = project.progress;
    document.getElementById('progressValue').value = project.progress;
    document.getElementById('status').value = project.status;
    document.getElementById('projectLink').value = project.link;

    document.getElementById('projectModal').classList.add('active');
}

function closeModal() {
    document.getElementById('projectModal').classList.remove('active');
}

function saveProject(e) {
    e.preventDefault();

    const projectData = {
        name: document.getElementById('projectName').value,
        description: document.getElementById('projectDescription').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        progress: parseInt(document.getElementById('progress').value),
        status: document.getElementById('status').value,
        link: document.getElementById('projectLink').value
    };

    if (AppState.currentEditingId) {
        const index = AppState.projects.findIndex(p => p.id === AppState.currentEditingId);
        AppState.projects[index] = { ...AppState.projects[index], ...projectData };
        showToast('Project updated successfully', 'success');
    } else {
        const newProject = {
            id: Math.max(...AppState.projects.map(p => p.id), 0) + 1,
            ...projectData
        };
        AppState.projects.push(newProject);
        showToast('Project added successfully', 'success');
    }

    saveToLocalStorage();
    closeModal();
    renderAdminPanel();
    renderDashboard();
}

function deleteProject() {
    if (confirm('Are you sure you want to delete this project?')) {
        AppState.projects = AppState.projects.filter(p => p.id !== AppState.currentEditingId);
        saveToLocalStorage();
        closeModal();
        renderAdminPanel();
        renderDashboard();
        showToast('Project deleted successfully', 'success');
    }
}

function saveAllProjects() {
    saveToLocalStorage();
    showToast('All changes saved', 'success');
}

// Import/Export
function exportToCSV() {
    let csv = 'Project Name,Description,Start Date,End Date,Progress,Status,GitHub Link\n';

    AppState.projects.forEach(project => {
        csv += `"${project.name}","${project.description}","${project.startDate}","${project.endDate}",${project.progress},"${project.status}","${project.link}"\n`;
    });

    downloadFile(csv, 'projects.csv', 'text/csv');
    showToast('Projects exported as CSV', 'success');
}

function exportToJSON() {
    const json = JSON.stringify(AppState.projects, null, 2);
    downloadFile(json, 'projects.json', 'application/json');
    showToast('Projects exported as JSON', 'success');
}

function importCSV() {
    const file = document.getElementById('csvFile').files[0];
    if (!file) {
        showToast('Please select a file', 'error');
        return;
    }

    Papa.parse(file, {
        header: true,
        complete: (results) => {
            try {
                AppState.projects = results.data
                    .filter(row => row['Project Name']) // Filter empty rows
                    .map((row, index) => ({
                        id: Math.max(...AppState.projects.map(p => p.id), 0) + index + 1,
                        name: row['Project Name'] || '',
                        description: row['Description'] || '',
                        startDate: row['Start Date'] || '',
                        endDate: row['End Date'] || '',
                        progress: parseInt(row['Progress']) || 0,
                        status: row['Status'] || 'in-progress',
                        link: row['GitHub Link'] || ''
                    }));

                saveToLocalStorage();
                document.getElementById('csvFile').value = '';
                renderDashboard();
                renderAdminPanel();
                showToast('Projects imported successfully', 'success');
            } catch (error) {
                showToast('Error importing CSV: ' + error.message, 'error');
            }
        },
        error: (error) => {
            showToast('Error parsing CSV: ' + error.message, 'error');
        }
    });
}

function syncToGitHub() {
    const repoUrl = document.getElementById('githubRepo').value;
    if (!repoUrl) {
        showToast('Please enter a repository URL', 'error');
        return;
    }

    // Parse GitHub URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
        showToast('Invalid GitHub URL', 'error');
        return;
    }

    const [, owner, repo] = match;
    showToast('GitHub sync feature requires authentication. Save your data locally or export as CSV/JSON', 'info');
}

// Utility Functions
function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===============================
// PROFESSOR RESEARCH OS — ELITE
// ===============================

async function loadData() {
  const response = await fetch("data/projects.json");
  const data = await response.json();

  const papers = data.projects.flatMap(p =>
    p.papers.map(x => ({ project: p.name, ...x }))
  );

  renderPlanner(papers);
  renderStats(papers);
  renderPipeline(papers);
  renderTimeline(data.projects);
  renderProjects(data.projects);
}


// ===============================
// 🔥 WORK-ON-NEXT PLANNER
// ===============================

function renderPlanner(papers) {
  const container = document.getElementById("planner");
  if (!container) return;

  const now = new Date();

  const withDeadlines = papers
    .filter(p => p.deadline)
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  if (withDeadlines.length === 0) {
    container.innerHTML =
      `<div class="card">No upcoming deadlines.</div>`;
    return;
  }

  const top = withDeadlines[0];

  const overdue =
    new Date(top.deadline) < now ? "overdue" : "";

  container.innerHTML = `
    <div class="card ${overdue}">
      <h2>🔥 Work on THIS Next</h2>
      <strong>${top.title}</strong><br>
      Project: ${top.project}<br>
      Status: ${top.status}<br>
      Deadline: ${top.deadline}
    </div>
  `;
}


// ===============================
// 📊 PORTFOLIO STATS
// ===============================

function renderStats(papers) {
  const container = document.getElementById("stats");
  if (!container) return;

  const underReview = papers.filter(p =>
    p.submissions?.some(s => s.decision === "Under Review")
  ).length;

  const accepted = papers.filter(p =>
    p.submissions?.some(s => s.decision === "Accepted")
  ).length;

  const completed = papers.filter(p =>
    p.progress === 100
  ).length;

  container.innerHTML = `
    <span class="stat">Total Items: ${papers.length}</span>
    <span class="stat">Under Review: ${underReview}</span>
    <span class="stat">Accepted: ${accepted}</span>
    <span class="stat">Completed: ${completed}</span>
  `;
}


// ===============================
// 📤 SUBMISSION PIPELINE
// ===============================

function renderPipeline(papers) {
  const container = document.getElementById("pipeline");
  if (!container) return;

  container.innerHTML = "";

  papers.forEach(p => {
    (p.submissions || []).forEach(s => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <strong>${p.title}</strong><br>
        Journal: ${s.journal || "—"}<br>
        Submitted: ${s.submitted || "—"}<br>
        Decision: ${s.decision || "—"}
      `;

      container.appendChild(div);
    });
  });
}


// ===============================
// 📅 TIMELINE (GANTT-STYLE)
// ===============================

function renderTimeline(projects) {
  const container = document.getElementById("timeline");
  if (!container) return;

  container.innerHTML = "";

  const items = projects.flatMap(p =>
    p.papers.map(x => ({ project: p.name, ...x }))
  );

  // Convert deadlines to timeline points
  const valid = items
    .map(i => {
      if (i.start && i.end) return i;

      if (i.deadline) {
        return {
          ...i,
          start: i.deadline,
          end: i.deadline
        };
      }

      return null;
    })
    .filter(Boolean);

  if (valid.length === 0) {
    container.innerHTML = "<p>No valid timeline data.</p>";
    return;
  }

  const minDate = new Date(
    Math.min(...valid.map(i => new Date(i.start)))
  );

  const maxDate = new Date(
    Math.max(...valid.map(i => new Date(i.end)))
  );

  const totalDuration = maxDate - minDate || 1;

  valid.forEach(item => {
    const startOffset =
      (new Date(item.start) - minDate) /
      totalDuration * 100;

    const duration =
      Math.max(
        (new Date(item.end) - new Date(item.start)) /
        totalDuration * 100,
        1
      );

    const row = document.createElement("div");
    row.className = "timeline-row";

    row.innerHTML = `
      <div class="timeline-label">
        ${item.title} (${item.project})
      </div>
      <div class="timeline-bar">
        <div class="timeline-fill"
             style="margin-left:${startOffset}%;
                    width:${duration}%;">
        </div>
      </div>
    `;

    container.appendChild(row);
  });
}


// ===============================
// 📚 PROJECT LIST
// ===============================

function renderProjects(projects) {
  const container = document.getElementById("projects");
  if (!container) return;

  container.innerHTML = "";

  projects.forEach(project => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `<h3>${project.name}</h3>`;

    project.papers.forEach(p => {
      div.innerHTML += `
        <div class="submission ${(p.priority || "low").toLowerCase()}">
          <strong>${p.title}</strong><br>
          Status: ${p.status}<br>
          Priority: ${p.priority || "—"}<br>
          Deadline: ${p.deadline || "—"}<br>
          Progress: ${p.progress || 0}%
        </div>
      `;
    });

    container.appendChild(div);
  });
}


// ===============================
// 🚀 START APP
// ===============================

loadData();

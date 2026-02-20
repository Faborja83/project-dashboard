async function loadData() {
  const response = await fetch("data/projects.json");
  const data = await response.json();

  const papers = data.projects.flatMap(p =>
    p.papers.map(x => ({ project: p.name, ...x }))
  );

  renderPlanner(papers);
  renderStats(papers);
  renderPipeline(papers);
  renderProjects(data.projects);
}

function renderPlanner(papers) {
  const now = new Date();

  const sorted = papers
    .filter(p => p.deadline)
    .sort((a,b) => new Date(a.deadline) - new Date(b.deadline));

  const top = sorted[0];

  const overdue =
    new Date(top.deadline) < now ? "overdue" : "";

  document.getElementById("planner").innerHTML = `
    <div class="card ${overdue}">
      <h2>🔥 Work on THIS Next</h2>
      <strong>${top.title}</strong><br>
      Project: ${top.project}<br>
      Status: ${top.status}<br>
      Deadline: ${top.deadline}
    </div>
  `;
}

function renderStats(papers) {
  const underReview = papers.filter(p =>
    p.submissions.some(s => s.decision === "Under Review")
  ).length;

  const accepted = papers.filter(p =>
    p.submissions.some(s => s.decision === "Accepted")
  ).length;

  document.getElementById("stats").innerHTML = `
    <span class="stat">Total Papers: ${papers.length}</span>
    <span class="stat">Under Review: ${underReview}</span>
    <span class="stat">Accepted: ${accepted}</span>
  `;
}

function renderPipeline(papers) {
  const container = document.getElementById("pipeline");
  container.innerHTML = "";

  papers.forEach(p => {
    p.submissions.forEach(s => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <strong>${p.title}</strong><br>
        Journal: ${s.journal}<br>
        Submitted: ${s.submitted}<br>
        Decision: ${s.decision}
      `;

      container.appendChild(div);
    });
  });
}

function renderProjects(projects) {
  const container = document.getElementById("projects");
  container.innerHTML = "";

  projects.forEach(project => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `<h3>${project.name}</h3>`;

    project.papers.forEach(p => {
      div.innerHTML += `
        <div class="submission ${p.priority.toLowerCase()}">
          <strong>${p.title}</strong><br>
          Status: ${p.status}<br>
          Priority: ${p.priority}<br>
          Deadline: ${p.deadline}<br>
          Progress: ${p.progress}%
        </div>
      `;
    });

    container.appendChild(div);
  });
}

loadData();

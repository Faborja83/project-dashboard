async function loadData() {
  const response = await fetch("data/projects.json");
  const data = await response.json();

  renderStats(data.projects);
  renderProjects(data.projects);
  renderTimeline(data.projects);
}

function renderStats(projects) {
  const papers = projects.flatMap(p => p.papers);

  const total = papers.length;
  const completed = papers.filter(p => p.progress === 100).length;
  const writing = papers.filter(p =>
    ["Writing","Research","Literature Review","Modeling"].includes(p.status)
  ).length;
  const review = papers.filter(p =>
    ["Under Review","Internal Review"].includes(p.status)
  ).length;

  document.getElementById("stats").innerHTML = `
    <div class="stat">Total Items: ${total}</div>
    <div class="stat">Writing Phase: ${writing}</div>
    <div class="stat">Under Review: ${review}</div>
    <div class="stat">Completed: ${completed}</div>
  `;
}

function renderProjects(projects) {
  const container = document.getElementById("projects");
  container.innerHTML = "";

  projects.forEach(project => {
    const div = document.createElement("div");
    div.className = "project";

    div.innerHTML = `<h3>${project.name}</h3>`;

    project.papers.forEach(p => {
      div.innerHTML += `
        <div class="paper">
          <strong>${p.title}</strong><br>
          Status: ${p.status}<br>
          Target: ${p.end}<br>

          <div class="bar">
            <div class="fill" style="width:${p.progress}%"></div>
          </div>
        </div>
      `;
    });

    container.appendChild(div);
  });
}

function renderTimeline(projects) {
  const container = document.getElementById("timeline");
  container.innerHTML = "";

  const items = projects.flatMap(p =>
    p.papers.map(x => ({ project: p.name, ...x }))
  );

  const minDate = new Date(Math.min(...items.map(i => new Date(i.start))));
  const maxDate = new Date(Math.max(...items.map(i => new Date(i.end))));
  const totalDuration = maxDate - minDate;

  items.forEach(item => {
    const startOffset =
      (new Date(item.start) - minDate) / totalDuration * 100;

    const duration =
      (new Date(item.end) - new Date(item.start)) /
      totalDuration * 100;

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

loadData();

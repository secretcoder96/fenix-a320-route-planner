import { SOP_PHASES } from "./src/data/a320ChecklistData.js";

const STORAGE_KEYS = {
  phase: "a320Checklist.phase",
  progress: "a320Checklist.progress"
};

const root = document.getElementById("checklist-app");

const state = {
  selectedPhaseId: localStorage.getItem(STORAGE_KEYS.phase) || SOP_PHASES[0].id,
  progress: loadProgress()
};

ensureProgressShape();
render();

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.progress);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function ensureProgressShape() {
  for (const phase of SOP_PHASES) {
    if (!state.progress[phase.id]) {
      state.progress[phase.id] = {
        flowPf: {},
        flowPm: {},
        checklist: {}
      };
    }
  }
  persistProgress();
}

function persistProgress() {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(state.progress));
}

function persistSelectedPhase() {
  localStorage.setItem(STORAGE_KEYS.phase, state.selectedPhaseId);
}

function getPhase() {
  return SOP_PHASES.find((phase) => phase.id === state.selectedPhaseId) || SOP_PHASES[0];
}

function getPhaseState(phaseId = state.selectedPhaseId) {
  return state.progress[phaseId];
}

function getCompletion(phase) {
  const phaseState = getPhaseState(phase.id);
  const total =
    phase.flows.pf.length +
    phase.flows.pm.length +
    phase.checklist.length;
  const completed =
    Object.keys(phaseState.flowPf).filter((key) => phaseState.flowPf[key]).length +
    Object.keys(phaseState.flowPm).filter((key) => phaseState.flowPm[key]).length +
    Object.keys(phaseState.checklist).filter((key) => phaseState.checklist[key]).length;

  return {
    total,
    completed,
    percent: total ? Math.round((completed / total) * 100) : 100
  };
}

function toggleProgress(section, index) {
  const phaseState = getPhaseState();
  phaseState[section][index] = !phaseState[section][index];
  persistProgress();
  render();
}

function resetPhase() {
  state.progress[state.selectedPhaseId] = {
    flowPf: {},
    flowPm: {},
    checklist: {}
  };
  persistProgress();
  render();
}

function resetAll() {
  for (const phase of SOP_PHASES) {
    state.progress[phase.id] = {
      flowPf: {},
      flowPm: {},
      checklist: {}
    };
  }
  persistProgress();
  render();
}

function markPhaseComplete() {
  const phase = getPhase();
  const phaseState = getPhaseState();
  phase.flows.pf.forEach((_, index) => {
    phaseState.flowPf[index] = true;
  });
  phase.flows.pm.forEach((_, index) => {
    phaseState.flowPm[index] = true;
  });
  phase.checklist.forEach((_, index) => {
    phaseState.checklist[index] = true;
  });
  persistProgress();
  render();
}

function selectPhase(id) {
  state.selectedPhaseId = id;
  persistSelectedPhase();
  render();
}

function renderCheckboxList(items, sectionKey, stateKey) {
  return items.map((item, index) => `
    <label class="check-card">
      <div class="check-row">
        <input type="checkbox" data-section="${sectionKey}" data-index="${index}" ${stateKey[index] ? "checked" : ""}>
        <div>
          <div class="check-title">${typeof item === "string" ? item : item.title}</div>
          ${typeof item === "string" ? "" : `<div class="check-response">${item.owner} · ${item.response}</div>`}
          ${typeof item === "string" ? "" : (item.note ? `<div class="check-note">${item.note}</div>` : "")}
        </div>
      </div>
    </label>
  `).join("");
}

function render() {
  const phase = getPhase();
  const phaseState = getPhaseState();
  const completion = getCompletion(phase);

  root.innerHTML = `
    <div class="check-shell">
      <header class="panel header">
        <div>
          <p class="eyebrow">A320 SOP Checklist</p>
          <h1>Fenix A320 Serious Checklist</h1>
          <p class="lede">Non-verbal simulator checklist with PF flow, PM flow, and checkbox-based challenge-response sections organized around A320 normal procedures.</p>
        </div>
        <div class="header-badges">
          <span class="badge">${phase.category}</span>
          <span class="badge">${completion.percent}% complete</span>
          <span class="badge">Next: ${phase.nextPhase}</span>
        </div>
      </header>

      <main class="layout">
        <aside class="panel sidebar">
          <div class="section-header">
            <div>
              <h2>Phases</h2>
              <p class="phase-meta">${SOP_PHASES.length} SOP phases</p>
            </div>
          </div>
          <div class="phase-list">
            ${SOP_PHASES.map((item) => `
              <button class="phase-button ${item.id === phase.id ? "active" : ""}" data-phase="${item.id}">
                <strong>${item.phase}</strong>
                <span>${item.category}</span>
              </button>
            `).join("")}
          </div>
        </aside>

        <section class="panel main">
          <section class="subpanel">
            <div class="section-header">
              <div>
                <p class="eyebrow">${phase.category}</p>
                <h2>${phase.phase}</h2>
                <p>${phase.nextPhase} follows this phase.</p>
              </div>
              <div class="phase-actions">
                <span class="phase-tag">Checklist phase</span>
              </div>
            </div>
            <div class="progress-bar"><span style="width:${completion.percent}%"></span></div>
            <p class="progress-note">${completion.completed} of ${completion.total} items complete.</p>
            <div class="toolbar">
              <button class="primary" data-action="complete-phase">Mark Phase Complete</button>
              <button class="secondary" data-action="reset-phase">Reset Phase</button>
              <button class="secondary" data-action="reset-all">Reset All</button>
            </div>
          </section>

          <section class="subpanel">
            <div class="section-header">
              <div>
                <h3>Flows</h3>
                <p>Complete the flows before or alongside the checklist as appropriate.</p>
              </div>
            </div>
            <div class="flow-columns">
              <div class="flow-card">
                <h4><span class="owner-tag">PF Flow</span></h4>
                <div class="flow-grid">${renderCheckboxList(phase.flows.pf, "flowPf", phaseState.flowPf)}</div>
              </div>
              <div class="flow-card">
                <h4><span class="owner-tag">PM Flow</span></h4>
                <div class="flow-grid">${renderCheckboxList(phase.flows.pm, "flowPm", phaseState.flowPm)}</div>
              </div>
            </div>
          </section>

          <section class="subpanel">
            <div class="section-header">
              <div>
                <h3>Checklist</h3>
                <p>Serious non-verbal checkbox checklist with expected response references.</p>
              </div>
            </div>
            <div class="checklist-grid">${renderCheckboxList(phase.checklist, "checklist", phaseState.checklist)}</div>
          </section>

          <section class="subpanel">
            <div class="section-header">
              <div>
                <h3>Notes</h3>
                <p>Simulator-focused realism notes and SOP intent.</p>
              </div>
            </div>
            <ul class="note-list">
              ${phase.notes.map((note) => `<li>${note}</li>`).join("")}
            </ul>
          </section>
        </section>

        <aside class="panel status">
          <div class="status-stack">
            <div class="stat-card">
              <span>Current phase</span>
              <strong>${phase.phase}</strong>
            </div>
            <div class="stat-card">
              <span>Next phase</span>
              <strong>${phase.nextPhase}</strong>
            </div>
            <div class="stat-card">
              <span>PF flow items</span>
              <strong>${Object.values(phaseState.flowPf).filter(Boolean).length}/${phase.flows.pf.length}</strong>
            </div>
            <div class="stat-card">
              <span>PM flow items</span>
              <strong>${Object.values(phaseState.flowPm).filter(Boolean).length}/${phase.flows.pm.length}</strong>
            </div>
            <div class="stat-card">
              <span>Checklist items</span>
              <strong>${Object.values(phaseState.checklist).filter(Boolean).length}/${phase.checklist.length}</strong>
            </div>
            <div class="stat-card">
              <span>Checklist type</span>
              <strong>Silent checkbox SOP</strong>
            </div>
          </div>
        </aside>
      </main>

      <footer class="panel footer">
        <p>This is a simulator training aid for the Fenix A320 and is not official Airbus, Fenix, airline, or training documentation.</p>
        <p>It is intentionally separate from the route generator and organized as a standalone SOP checklist application with PF and PM flow sections.</p>
      </footer>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  root.querySelectorAll("[data-phase]").forEach((button) => {
    button.addEventListener("click", () => selectPhase(button.dataset.phase));
  });

  root.querySelectorAll("input[type='checkbox'][data-section]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      toggleProgress(checkbox.dataset.section, checkbox.dataset.index);
    });
  });

  root.querySelector("[data-action='reset-phase']").addEventListener("click", resetPhase);
  root.querySelector("[data-action='reset-all']").addEventListener("click", resetAll);
  root.querySelector("[data-action='complete-phase']").addEventListener("click", markPhaseComplete);
}

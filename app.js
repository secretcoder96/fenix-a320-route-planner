import { MODES, PROCEDURE_MAP, PROCEDURES } from "./src/data/a320Procedures.js";

const STORAGE_KEYS = {
  phaseId: "a320VirtualPm.phaseId",
  mode: "a320VirtualPm.mode",
  voiceEnabled: "a320VirtualPm.voiceEnabled",
  autoSubmitVoice: "a320VirtualPm.autoSubmitVoice",
  progress: "a320VirtualPm.progress",
  log: "a320VirtualPm.log"
};

const ROOT = document.getElementById("app");
const recognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;

const state = {
  selectedPhaseId: localStorage.getItem(STORAGE_KEYS.phaseId) || PROCEDURES[0].id,
  mode: localStorage.getItem(STORAGE_KEYS.mode) || "normal",
  voiceEnabled: localStorage.getItem(STORAGE_KEYS.voiceEnabled) !== "false",
  autoSubmitVoice: localStorage.getItem(STORAGE_KEYS.autoSubmitVoice) === "true",
  isListening: false,
  interimTranscript: "",
  responseText: "",
  recognitionSupported: Boolean(recognitionApi),
  progress: loadProgress(),
  log: loadLog(),
  complete: false,
  lastFeedback: "",
  recognition: null
};

function init() {
  ensureProgressShape();
  registerServiceWorker();
  render();
  setupSpeechRecognition();
  syncProcedureCompletion();
}

function ensureProgressShape() {
  for (const procedure of PROCEDURES) {
    if (!state.progress[procedure.id]) {
      state.progress[procedure.id] = { itemIndex: 0, complete: false };
    }
  }
  persistProgress();
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.progress);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function loadLog() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.log);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistPreferences() {
  localStorage.setItem(STORAGE_KEYS.phaseId, state.selectedPhaseId);
  localStorage.setItem(STORAGE_KEYS.mode, state.mode);
  localStorage.setItem(STORAGE_KEYS.voiceEnabled, String(state.voiceEnabled));
  localStorage.setItem(STORAGE_KEYS.autoSubmitVoice, String(state.autoSubmitVoice));
}

function persistProgress() {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(state.progress));
}

function persistLog() {
  localStorage.setItem(STORAGE_KEYS.log, JSON.stringify(state.log.slice(-120)));
}

function getProcedure() {
  return PROCEDURE_MAP.get(state.selectedPhaseId) || PROCEDURES[0];
}

function getProgress(procedureId = state.selectedPhaseId) {
  return state.progress[procedureId] || { itemIndex: 0, complete: false };
}

function getCurrentItem() {
  const procedure = getProcedure();
  const progress = getProgress();
  return procedure.items[progress.itemIndex] || null;
}

function getCompletionPercent() {
  const procedure = getProcedure();
  const progress = getProgress();
  if (!procedure.items.length) {
    return 100;
  }
  if (progress.complete) {
    return 100;
  }
  return Math.round((progress.itemIndex / procedure.items.length) * 100);
}

function syncProcedureCompletion() {
  state.complete = Boolean(getProgress().complete);
  render();
}

function addLog(source, message, tone = "neutral") {
  state.log.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    source,
    message,
    tone,
    timestamp: new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    })
  });
  persistLog();
  render();
}

function normalizeText(value) {
  return value
    .toUpperCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildAcceptedForms(item) {
  const forms = new Set([...(item.expected || []), ...(item.accepted || [])].map(normalizeText));

  if (state.mode !== "strict") {
    const current = Array.from(forms);
    for (const form of current) {
      if (form === "COMPLETE") forms.add("COMPLETED");
      if (form === "COMPLETED") forms.add("COMPLETE");
      if (form === "CHECKED") forms.add("CHECK");
      if (form === "CHECK") forms.add("CHECKED");
      if (form === "SET") forms.add("SELECTED");
      if (form === "SELECTED") forms.add("SET");
      if (form === "UP") forms.add("RETRACTED");
      if (form === "RETRACTED") forms.add("UP");
      if (form === "OFF") forms.add("SHUTDOWN");
    }
  }

  return forms;
}

function evaluateResponse(item, rawResponse) {
  const response = normalizeText(rawResponse);
  if (!response) {
    return { accepted: false, reason: "Enter or speak a response first." };
  }

  const acceptedForms = buildAcceptedForms(item);
  const strictForms = new Set((item.expected || []).map(normalizeText));
  const validForms = state.mode === "strict" ? strictForms : acceptedForms;

  if (validForms.has(response)) {
    return { accepted: true };
  }

  const challengeText = normalizeText(item.challenge);
  if (response.startsWith(challengeText)) {
    const trimmed = response.slice(challengeText.length).trim();
    if (trimmed && validForms.has(trimmed)) {
      return { accepted: true };
    }
  }

  return {
    accepted: false,
    reason: `Expected ${Array.from(strictForms).join(" or ")}.`,
  };
}

function speak(text) {
  if (!state.voiceEnabled || !("speechSynthesis" in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.97;
  utterance.pitch = 0.95;
  window.speechSynthesis.speak(utterance);
}

function selectPhase(phaseId) {
  state.selectedPhaseId = phaseId;
  state.responseText = "";
  state.interimTranscript = "";
  state.lastFeedback = "";
  persistPreferences();
  syncProcedureCompletion();
}

function startChecklist() {
  const procedure = getProcedure();
  const progress = getProgress();

  if (progress.complete) {
    state.progress[procedure.id] = { itemIndex: 0, complete: false };
    persistProgress();
  }

  state.lastFeedback = "";
  const current = getCurrentItem();
  addLog("PM", procedure.title.toUpperCase(), "info");
  speak(procedure.title);
  if (current) {
    addLog("PM", current.challenge, "info");
    speak(current.challenge);
  }
  syncProcedureCompletion();
}

function submitResponse(forcedResponse = null) {
  const procedure = getProcedure();
  const item = getCurrentItem();

  if (!item) {
    return;
  }

  const response = forcedResponse ?? state.responseText;
  const result = evaluateResponse(item, response);
  addLog("PF", normalizeText(response) || "(NO RESPONSE)", result.accepted ? "success" : "warn");

  if (!result.accepted) {
    state.lastFeedback = result.reason;
    addLog("PM", state.mode === "training" ? `${result.reason} ${item.hint}` : result.reason, "warn");
    speak("Not accepted");
    render();
    return;
  }

  state.lastFeedback = "Accepted.";
  addLog("PM", "ACCEPTED", "success");
  speak("Accepted");

  const progress = getProgress();
  const nextIndex = progress.itemIndex + 1;
  const isComplete = nextIndex >= procedure.items.length;
  state.progress[procedure.id] = {
    itemIndex: isComplete ? procedure.items.length : nextIndex,
    complete: isComplete
  };
  persistProgress();
  state.responseText = "";

  if (isComplete) {
    state.complete = true;
    addLog("PM", `${procedure.title.toUpperCase()} COMPLETE`, "success");
    speak(`${procedure.title} complete`);
  } else {
    const nextItem = procedure.items[nextIndex];
    addLog("PM", nextItem.challenge, "info");
    speak(nextItem.challenge);
  }

  render();
}

function previousItem() {
  const procedure = getProcedure();
  const progress = getProgress();
  const itemIndex = Math.max(0, Math.min(progress.itemIndex - 1, procedure.items.length - 1));
  state.progress[procedure.id] = { itemIndex, complete: false };
  persistProgress();
  state.lastFeedback = "";
  const item = getCurrentItem();
  if (item) {
    addLog("PM", `PREVIOUS: ${item.challenge}`, "info");
    speak(item.challenge);
  }
  syncProcedureCompletion();
}

function skipItem() {
  const procedure = getProcedure();
  const item = getCurrentItem();
  if (!item) {
    return;
  }
  addLog("PM", `SKIPPED: ${item.challenge}`, "warn");
  const progress = getProgress();
  const nextIndex = progress.itemIndex + 1;
  const isComplete = nextIndex >= procedure.items.length;
  state.progress[procedure.id] = {
    itemIndex: isComplete ? procedure.items.length : nextIndex,
    complete: isComplete
  };
  persistProgress();

  if (isComplete) {
    addLog("PM", `${procedure.title.toUpperCase()} COMPLETE`, "success");
    speak(`${procedure.title} complete`);
  } else {
    const nextItem = procedure.items[nextIndex];
    addLog("PM", nextItem.challenge, "info");
    speak(nextItem.challenge);
  }

  syncProcedureCompletion();
}

function resetChecklist() {
  const procedure = getProcedure();
  state.progress[procedure.id] = { itemIndex: 0, complete: false };
  persistProgress();
  state.responseText = "";
  state.lastFeedback = "";
  addLog("PM", `RESET ${procedure.title.toUpperCase()}`, "warn");
  speak("Checklist reset");
  syncProcedureCompletion();
}

function repeatItem() {
  const procedure = getProcedure();
  const item = getCurrentItem();
  if (!item) {
    speak(`${procedure.title} complete`);
    return;
  }
  addLog("PM", `REPEAT: ${item.challenge}`, "info");
  speak(item.challenge);
}

function clearLog() {
  state.log = [];
  persistLog();
  render();
}

function changeMode(modeId) {
  state.mode = modeId;
  state.lastFeedback = "";
  persistPreferences();
  addLog("PM", `${modeId.toUpperCase()} MODE`, "info");
  speak(modeId.replace(/^\w/, (char) => char.toUpperCase()) + " mode");
  render();
}

function toggleVoiceEnabled() {
  state.voiceEnabled = !state.voiceEnabled;
  persistPreferences();
  render();
}

function toggleAutoSubmit() {
  state.autoSubmitVoice = !state.autoSubmitVoice;
  persistPreferences();
  render();
}

function stopListening() {
  if (state.recognition) {
    state.recognition.stop();
  }
  state.isListening = false;
  render();
}

function handleCommand(command) {
  const normalized = normalizeText(command).toLowerCase();
  const commandMap = {
    "start checklist": startChecklist,
    "repeat item": repeatItem,
    "next item": skipItem,
    "previous item": previousItem,
    "skip item": skipItem,
    "reset checklist": resetChecklist,
    "stop listening": stopListening,
    "normal mode": () => changeMode("normal"),
    "training mode": () => changeMode("training"),
    "strict mode": () => changeMode("strict"),
    "clear log": clearLog
  };
  const action = commandMap[normalized];
  if (!action) {
    return false;
  }
  addLog("VOICE", normalized.toUpperCase(), "info");
  action();
  return true;
}

function startListening() {
  if (!state.recognition) {
    return;
  }
  state.interimTranscript = "";
  state.recognition.start();
}

function setupSpeechRecognition() {
  if (!state.recognitionSupported) {
    return;
  }

  const recognition = new recognitionApi();
  recognition.lang = "en-US";
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    state.isListening = true;
    render();
  };

  recognition.onend = () => {
    state.isListening = false;
    render();
  };

  recognition.onerror = (event) => {
    state.isListening = false;
    addLog("VOICE", `RECOGNITION ERROR: ${event.error.toUpperCase()}`, "warn");
    render();
  };

  recognition.onresult = (event) => {
    let finalTranscript = "";
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = event.results[i][0].transcript.trim();
      if (event.results[i].isFinal) {
        finalTranscript += `${transcript} `;
      } else {
        interimTranscript += `${transcript} `;
      }
    }

    state.interimTranscript = interimTranscript.trim();

    const finalText = finalTranscript.trim();
    if (!finalText) {
      render();
      return;
    }

    if (handleCommand(finalText)) {
      state.responseText = "";
      state.interimTranscript = "";
      render();
      return;
    }

    state.responseText = finalText;
    addLog("VOICE", `HEARD: ${normalizeText(finalText)}`, "info");
    render();

    if (state.autoSubmitVoice) {
      submitResponse(finalText);
    }
  };

  state.recognition = recognition;
}

function getModeMeta() {
  return MODES.find((mode) => mode.id === state.mode) || MODES[0];
}

function render() {
  const procedure = getProcedure();
  const progress = getProgress();
  const currentItem = getCurrentItem();
  const currentIndex = progress.complete ? procedure.items.length : Math.min(progress.itemIndex + 1, procedure.items.length);
  const modeMeta = getModeMeta();
  const percent = getCompletionPercent();

  ROOT.innerHTML = `
    <div class="app-shell">
      <header class="topbar panel">
        <div>
          <p class="eyebrow">A320 Virtual PM</p>
          <h1>Fenix A320 Pilot Monitoring Assistant</h1>
          <p class="lede">Simulator-focused Airbus-style flows, challenge-response checklists, PM callouts, and voice support for single-pilot operations.</p>
        </div>
        <div class="hero-status">
          <div class="hero-pill ${state.isListening ? "live" : ""}">${state.isListening ? "Listening..." : "Mic Standby"}</div>
          <div class="hero-pill ${state.voiceEnabled ? "on" : ""}">${state.voiceEnabled ? "PM Voice On" : "PM Voice Off"}</div>
          <div class="hero-pill">${modeMeta.label}</div>
        </div>
      </header>

      <section class="control-strip panel">
        <div class="mode-group">
          ${MODES.map((mode) => `
            <button class="chip-button ${state.mode === mode.id ? "active" : ""}" data-action="mode" data-mode="${mode.id}">
              ${mode.label}
            </button>
          `).join("")}
        </div>
        <div class="toggle-row">
          <label class="toggle">
            <input type="checkbox" data-action="toggle-voice" ${state.voiceEnabled ? "checked" : ""}>
            <span>PM voice readout</span>
          </label>
          <label class="toggle">
            <input type="checkbox" data-action="toggle-auto-submit" ${state.autoSubmitVoice ? "checked" : ""}>
            <span>Auto-submit voice responses</span>
          </label>
        </div>
      </section>

      <main class="layout">
        <aside class="panel phase-panel">
          <div class="panel-head">
            <h2>Phases</h2>
            <p>${PROCEDURES.length} simulator-ready phases</p>
          </div>
          <div class="phase-list">
            ${PROCEDURES.map((item) => `
              <button class="phase-card ${item.id === procedure.id ? "active" : ""}" data-action="select-phase" data-phase="${item.id}">
                <span class="phase-name">${item.phase}</span>
                <span class="phase-meta">${item.category}</span>
              </button>
            `).join("")}
          </div>
        </aside>

        <section class="panel runner-panel">
          <div class="runner-header">
            <div>
              <p class="eyebrow">${procedure.category}</p>
              <h2>${procedure.title}</h2>
              <p class="muted">${procedure.phase} to ${procedure.nextPhase}</p>
            </div>
            <button class="primary-button" data-action="start-checklist">Start Checklist</button>
          </div>

          <div class="progress-wrap" aria-label="Checklist completion">
            <div class="progress-bar"><span style="width: ${percent}%"></span></div>
            <strong>${percent}% complete</strong>
          </div>

          <section class="subpanel">
            <div class="subpanel-head">
              <h3>Flow Guide</h3>
              <p>Do these actions before calling the checklist.</p>
            </div>
            <ol class="flow-list">
              ${procedure.flow.map((step) => `<li>${step}</li>`).join("")}
            </ol>
          </section>

          <section class="subpanel active-item-panel">
            <div class="subpanel-head">
              <h3>Current Challenge</h3>
              <p>Item ${currentIndex} of ${procedure.items.length}</p>
            </div>
            ${
              currentItem
                ? `
                  <div class="challenge-card">
                    <span class="challenge-label">PM challenge</span>
                    <strong>${currentItem.challenge}</strong>
                    <p>${state.mode === "training" ? currentItem.hint : "Respond by typing or speaking."}</p>
                  </div>
                `
                : `
                  <div class="challenge-card complete">
                    <span class="challenge-label">Checklist status</span>
                    <strong>${procedure.title} complete</strong>
                    <p>Select the next phase or reset this checklist to run it again.</p>
                  </div>
                `
            }

            <div class="response-row">
              <input id="response-input" type="text" placeholder="Type PF response" value="${escapeHtml(state.responseText)}">
              <button class="primary-button" data-action="submit-response">Submit</button>
            </div>
            ${state.interimTranscript ? `<p class="interim">Interim voice text: ${escapeHtml(state.interimTranscript)}</p>` : ""}
            ${state.lastFeedback ? `<p class="feedback ${state.lastFeedback === "Accepted." ? "success" : "warn"}">${escapeHtml(state.lastFeedback)}</p>` : ""}

            <div class="runner-actions">
              <button class="secondary-button" data-action="previous-item">Previous Item</button>
              <button class="secondary-button" data-action="repeat-item">Repeat Item</button>
              <button class="secondary-button" data-action="skip-item">Skip Item</button>
              <button class="secondary-button" data-action="reset-checklist">Reset Checklist</button>
            </div>
          </section>

          <section class="subpanel">
            <div class="subpanel-head">
              <h3>Procedure Notes</h3>
              <p>${modeMeta.description}</p>
            </div>
            <ul class="notes-list">
              ${procedure.notes.map((note) => `<li>${note}</li>`).join("")}
            </ul>
            ${procedure.variants ? `
              <div class="variant-block">
                <h4>Variants</h4>
                ${procedure.variants.map((variant) => `<p><strong>${variant.title}:</strong> ${variant.notes.join(" ")}</p>`).join("")}
              </div>
            ` : ""}
            <div class="simplification-box">
              <h4>Sim Mode Simplifications</h4>
              <p>Company paperwork, cabin admin, maintenance/legal details, and non-modeled tasks are reduced or moved into notes so the app stays usable during an actual sim flight.</p>
            </div>
          </section>
        </section>

        <aside class="panel status-panel">
          <section class="subpanel">
            <div class="subpanel-head">
              <h3>Status Panel</h3>
              <p>Live PM state</p>
            </div>
            <dl class="status-grid">
              <div><dt>Current phase</dt><dd>${procedure.phase}</dd></div>
              <div><dt>Checklist</dt><dd>${procedure.title}</dd></div>
              <div><dt>Item</dt><dd>${currentIndex}/${procedure.items.length}</dd></div>
              <div><dt>Completion</dt><dd>${percent}%</dd></div>
              <div><dt>Mode</dt><dd>${modeMeta.label}</dd></div>
              <div><dt>Listening</dt><dd>${state.isListening ? "Active" : "Off"}</dd></div>
              <div><dt>PM voice</dt><dd>${state.voiceEnabled ? "Enabled" : "Disabled"}</dd></div>
              <div><dt>Auto-submit</dt><dd>${state.autoSubmitVoice ? "Enabled" : "Disabled"}</dd></div>
              <div><dt>Checklist state</dt><dd>${progress.complete ? "Complete" : "Running"}</dd></div>
              <div><dt>Next phase</dt><dd>${procedure.nextPhase}</dd></div>
            </dl>
          </section>

          <section class="subpanel voice-panel">
            <div class="subpanel-head">
              <h3>Voice Controls</h3>
              <p>Use Chrome or Edge for the best recognition support.</p>
            </div>
            <div class="voice-actions">
              <button class="primary-button large" data-action="start-listening" ${state.recognitionSupported ? "" : "disabled"}>Start Listening</button>
              <button class="secondary-button large" data-action="stop-listening" ${state.recognitionSupported ? "" : "disabled"}>Stop Listening</button>
            </div>
            <p class="voice-state ${state.isListening ? "live" : ""}">${state.isListening ? "Listening for responses and voice commands..." : "Voice recognition idle."}</p>
            ${state.recognitionSupported ? `
              <ul class="command-list">
                <li>Voice commands: start checklist, repeat item, next item, previous item, skip item, reset checklist, stop listening, normal mode, training mode, strict mode, clear log.</li>
              </ul>
            ` : `
              <p class="unsupported">Voice recognition is not supported in this browser. Use Chrome or Edge, or type your response.</p>
            `}
          </section>

          <section class="subpanel log-panel">
            <div class="subpanel-head">
              <h3>Callout Log</h3>
              <button class="text-button" data-action="clear-log">Clear Log</button>
            </div>
            <div class="log-list">
              ${
                state.log.length
                  ? state.log.map((entry) => `
                    <article class="log-entry ${entry.tone}">
                      <span>${entry.timestamp}</span>
                      <strong>${entry.source}</strong>
                      <p>${entry.message}</p>
                    </article>
                  `).join("")
                  : `<p class="empty-log">No callouts yet. Start a checklist to begin the PM log.</p>`
              }
            </div>
          </section>
        </aside>
      </main>

      <footer class="panel footer-note">
        <p>This is a simulator training aid for the Fenix A320 and is not official Airbus, Fenix, airline, or training documentation.</p>
        <p class="muted">Future hooks: SimBrief import, VATSIM data, SimConnect state, Fenix state detection, takeoff and landing performance, abnormal procedures, route-specific briefing generation, and gate/taxi briefing.</p>
      </footer>
    </div>
  `;

  bindUI();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bindUI() {
  ROOT.querySelectorAll("[data-action='select-phase']").forEach((button) => {
    button.addEventListener("click", () => selectPhase(button.dataset.phase));
  });

  ROOT.querySelectorAll("[data-action='mode']").forEach((button) => {
    button.addEventListener("click", () => changeMode(button.dataset.mode));
  });

  const input = ROOT.querySelector("#response-input");
  if (input) {
    input.addEventListener("input", (event) => {
      state.responseText = event.target.value;
    });
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitResponse();
      }
    });
  }

  const actionMap = {
    "start-checklist": startChecklist,
    "submit-response": () => submitResponse(),
    "previous-item": previousItem,
    "repeat-item": repeatItem,
    "skip-item": skipItem,
    "reset-checklist": resetChecklist,
    "start-listening": startListening,
    "stop-listening": stopListening,
    "clear-log": clearLog,
    "toggle-voice": toggleVoiceEnabled,
    "toggle-auto-submit": toggleAutoSubmit
  };

  ROOT.querySelectorAll("[data-action]").forEach((element) => {
    const action = element.dataset.action;
    if (!actionMap[action] || action === "mode" || action === "select-phase") {
      return;
    }

    const eventName = element.matches("input[type='checkbox']") ? "change" : "click";
    element.addEventListener(eventName, actionMap[action]);
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.register("./sw.js").catch(() => {
    addLog("PM", "SERVICE WORKER REGISTRATION FAILED", "warn");
  });
}

// Future integration hook: procedure state can later be driven by live aircraft data.
// Future integration hook: SimBrief and VATSIM imports can pre-brief departure and arrival phases.
// Future integration hook: Fenix-specific aircraft variables can auto-validate checklist items.

init();

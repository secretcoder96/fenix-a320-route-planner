import { MODES, PROCEDURE_MAP, PROCEDURES } from "./src/data/a320Procedures.js";

const STORAGE_KEYS = {
  phaseId: "a320VirtualPm.phaseId",
  mode: "a320VirtualPm.mode",
  voiceEnabled: "a320VirtualPm.voiceEnabled",
  autoSubmitVoice: "a320VirtualPm.autoSubmitVoice",
  progress: "a320VirtualPm.progress",
  log: "a320VirtualPm.log",
  voiceUri: "a320VirtualPm.voiceUri",
  speechRate: "a320VirtualPm.speechRate"
};

const ROOT = document.getElementById("app");
const recognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
const DEFAULT_SPEECH_RATE = clamp(Number(localStorage.getItem(STORAGE_KEYS.speechRate) || "0.9"), 0.8, 1.05);
const ACCEPTED_PHRASE = "CHECKED";

const state = {
  selectedPhaseId: localStorage.getItem(STORAGE_KEYS.phaseId) || "before-start",
  mode: localStorage.getItem(STORAGE_KEYS.mode) || "normal",
  voiceEnabled: localStorage.getItem(STORAGE_KEYS.voiceEnabled) !== "false",
  autoSubmitVoice: localStorage.getItem(STORAGE_KEYS.autoSubmitVoice) !== "false",
  selectedVoiceUri: localStorage.getItem(STORAGE_KEYS.voiceUri) || "",
  speechRate: DEFAULT_SPEECH_RATE,
  isListening: false,
  listeningDesired: false,
  interimTranscript: "",
  responseText: "",
  recognitionSupported: Boolean(recognitionApi),
  progress: loadProgress(),
  log: loadLog(),
  complete: false,
  lastFeedback: "",
  recognition: null,
  voices: [],
  speechToken: 0,
  speechTimerIds: [],
  lastVoiceTranscript: "",
  lastVoiceTranscriptAt: 0,
  lastSubmittedKey: "",
  lastSubmittedAt: 0
};

function init() {
  ensureProgressShape();
  registerServiceWorker();
  setupVoices();
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
  localStorage.setItem(STORAGE_KEYS.voiceUri, state.selectedVoiceUri);
  localStorage.setItem(STORAGE_KEYS.speechRate, String(state.speechRate));
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

function getCurrentItem(procedure = getProcedure(), progress = getProgress(procedure.id)) {
  return procedure.items[progress.itemIndex] || null;
}

function getCompletionPercent() {
  const procedure = getProcedure();
  const progress = getProgress();
  if (!procedure.items.length || progress.complete) {
    return 100;
  }
  return Math.round((progress.itemIndex / procedure.items.length) * 100);
}

function syncProcedureCompletion() {
  state.complete = Boolean(getProgress().complete);
  render();
}

function addLog(source, message, tone = "neutral", shouldRender = true) {
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
  if (shouldRender) {
    render();
  }
}

function normalizeText(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[.,#!$%^&*;:{}=\-_`~()?"']/g, " ")
    .replace(/\//g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
      if (form === "CLOSED") forms.add("CLOSE");
      if (form === "OPEN") forms.add("OPENED");
    }
  }

  return forms;
}

function evaluateResponse(item, rawResponse) {
  const response = normalizeText(rawResponse);
  if (!response) {
    return { accepted: false, reason: "Enter or speak a response first." };
  }

  const strictForms = new Set((item.expected || []).map(normalizeText));
  const validForms = state.mode === "strict" ? strictForms : buildAcceptedForms(item);

  if (validForms.has(response)) {
    return { accepted: true };
  }

  const challengeText = normalizeText(item.challenge);
  if (response.startsWith(`${challengeText} `)) {
    const trimmed = response.slice(challengeText.length).trim();
    if (trimmed && validForms.has(trimmed)) {
      return { accepted: true };
    }
  }

  return {
    accepted: false,
    reason: `Expected ${Array.from(strictForms).join(" or ")}.`
  };
}

function formatForSpeech(text, options = {}) {
  if (!text) {
    return "";
  }

  let spoken = String(text).trim();
  const replacements = [
    [/A\/THR/gi, "Auto thrust"],
    [/EXT PWR/gi, "External power"],
    [/\bQNH\b/gi, "Q N H"],
    [/\bADIRS\b/gi, "A D I R S"],
    [/\bTCAS\b/gi, "T C A S"],
    [/\bMCDU\b/gi, "M C D U"],
    [/\bFMGS\b/gi, "F M G S"],
    [/\bECAM\b/gi, "E C A M"],
    [/\bILS\b/gi, "I L S"],
    [/\bRNAV\b/gi, "R N A V"],
    [/\bAPU\b/gi, "A P U"],
    [/\bVATSIM\b/gi, "Vat sim"]
  ];

  for (const [pattern, replacement] of replacements) {
    spoken = spoken.replace(pattern, replacement);
  }

  spoken = spoken.replace(/\//g, " ");
  spoken = spoken.replace(/\s+/g, " ").trim();

  if (options.kind === "challenge") {
    spoken = spoken.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    if (!/[?.!]$/.test(spoken)) {
      spoken += "?";
    }
    return spoken;
  }

  if (options.kind === "title") {
    spoken = spoken.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    return spoken;
  }

  return spoken;
}

function clearSpeechQueue() {
  state.speechToken += 1;
  for (const timerId of state.speechTimerIds) {
    window.clearTimeout(timerId);
  }
  state.speechTimerIds = [];
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function getSelectedVoice() {
  return state.voices.find((voice) => voice.voiceURI === state.selectedVoiceUri) || null;
}

function speakNow(text, options = {}) {
  if (!state.voiceEnabled || !("speechSynthesis" in window)) {
    return;
  }

  if (options.cancelFirst !== false) {
    window.speechSynthesis.cancel();
  }
  const utterance = new SpeechSynthesisUtterance(formatForSpeech(text, options));
  const selectedVoice = getSelectedVoice();
  utterance.lang = selectedVoice?.lang || "en-US";
  utterance.voice = selectedVoice;
  utterance.rate = state.speechRate;
  utterance.pitch = 0.96;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function queuePmSpeech(steps) {
  if (!state.voiceEnabled || !("speechSynthesis" in window) || !steps.length) {
    return;
  }

  clearSpeechQueue();
  const token = state.speechToken;
  let elapsed = 0;

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    elapsed += step.delayBefore ?? 0;
    const timerId = window.setTimeout(() => {
      if (token !== state.speechToken) {
        return;
      }
      speakNow(step.text, { ...(step.options || {}), cancelFirst: index === 0 });
    }, elapsed);
    state.speechTimerIds.push(timerId);
  }
}

function setResponseText(value, shouldRender = true) {
  state.responseText = value;
  if (shouldRender) {
    render();
  }
}

function selectPhase(phaseId) {
  clearSpeechQueue();
  state.selectedPhaseId = phaseId;
  state.responseText = "";
  state.interimTranscript = "";
  state.lastFeedback = "";
  persistPreferences();
  syncProcedureCompletion();
}

function startChecklist() {
  clearSpeechQueue();
  const procedure = getProcedure();
  const progress = getProgress(procedure.id);
  const resetProgress = progress.complete ? { itemIndex: 0, complete: false } : progress;

  state.progress[procedure.id] = resetProgress;
  state.complete = false;
  state.responseText = "";
  state.interimTranscript = "";
  state.lastFeedback = "";
  state.lastSubmittedKey = "";
  state.lastSubmittedAt = 0;
  persistProgress();

  const firstItem = getCurrentItem(procedure, resetProgress);
  addLog("PM", procedure.title.toUpperCase(), "info", false);
  if (firstItem) {
    addLog("PM", firstItem.challenge, "info", false);
  }
  render();

  if (firstItem) {
    queuePmSpeech([
      { text: procedure.title, options: { kind: "title" }, delayBefore: 0 },
      { text: firstItem.challenge, options: { kind: "challenge" }, delayBefore: 450 }
    ]);
  } else {
    queuePmSpeech([{ text: `${procedure.title} complete`, options: { kind: "title" }, delayBefore: 0 }]);
  }
}

function advanceToNextItem(procedure, currentIndex) {
  const nextIndex = currentIndex + 1;
  const isComplete = nextIndex >= procedure.items.length;

  state.progress[procedure.id] = {
    itemIndex: isComplete ? procedure.items.length : nextIndex,
    complete: isComplete
  };
  state.complete = isComplete;
  state.responseText = "";
  state.interimTranscript = "";
  state.lastFeedback = "Accepted.";
  persistProgress();

  addLog("PM", ACCEPTED_PHRASE, "success", false);

  if (isComplete) {
    addLog("PM", `${procedure.title.toUpperCase()} COMPLETE`, "success", false);
    render();
    queuePmSpeech([
      { text: ACCEPTED_PHRASE, delayBefore: 0 },
      { text: `${procedure.title} complete`, options: { kind: "title" }, delayBefore: 450 }
    ]);
    return;
  }

  const nextItem = procedure.items[nextIndex];
  addLog("PM", nextItem.challenge, "info", false);
  render();
  queuePmSpeech([
    { text: ACCEPTED_PHRASE, delayBefore: 0 },
    { text: nextItem.challenge, options: { kind: "challenge" }, delayBefore: 450 }
  ]);
}

function submitResponse(forcedResponse = null, source = "typed") {
  const procedure = getProcedure();
  const progress = getProgress(procedure.id);
  const item = getCurrentItem(procedure, progress);

  if (!item) {
    return;
  }

  const response = String(forcedResponse ?? state.responseText ?? "").trim();
  const normalizedResponse = normalizeText(response);
  const submissionKey = `${procedure.id}:${progress.itemIndex}:${normalizedResponse}`;

  if (!normalizedResponse) {
    state.lastFeedback = "Enter or speak a response first.";
    render();
    return;
  }

  if (source === "voice" && submissionKey === state.lastSubmittedKey && Date.now() - state.lastSubmittedAt < 1500) {
    return;
  }

  const result = evaluateResponse(item, response);
  state.lastSubmittedKey = submissionKey;
  state.lastSubmittedAt = Date.now();
  addLog("PF", normalizedResponse, result.accepted ? "success" : "warn", false);

  if (!result.accepted) {
    state.lastFeedback = result.reason;
    addLog("PM", state.mode === "training" ? `${result.reason} ${item.hint}` : result.reason, "warn", false);
    render();
    queuePmSpeech([{ text: "Not accepted", delayBefore: 0 }]);
    return;
  }

  advanceToNextItem(procedure, progress.itemIndex);
}

function previousItem() {
  clearSpeechQueue();
  const procedure = getProcedure();
  const progress = getProgress(procedure.id);
  const maxIndex = Math.max(0, procedure.items.length - 1);
  const itemIndex = Math.max(0, Math.min(progress.itemIndex - 1, maxIndex));
  state.progress[procedure.id] = { itemIndex, complete: false };
  state.complete = false;
  state.lastFeedback = "";
  state.responseText = "";
  state.interimTranscript = "";
  persistProgress();

  const item = getCurrentItem();
  if (item) {
    addLog("PM", `PREVIOUS: ${item.challenge}`, "info", false);
  }
  render();

  if (item) {
    queuePmSpeech([{ text: item.challenge, options: { kind: "challenge" }, delayBefore: 0 }]);
  }
}

function skipItem() {
  clearSpeechQueue();
  const procedure = getProcedure();
  const progress = getProgress(procedure.id);
  const item = getCurrentItem(procedure, progress);
  if (!item) {
    return;
  }

  addLog("PM", `SKIPPED: ${item.challenge}`, "warn", false);
  const nextIndex = progress.itemIndex + 1;
  const isComplete = nextIndex >= procedure.items.length;
  state.progress[procedure.id] = {
    itemIndex: isComplete ? procedure.items.length : nextIndex,
    complete: isComplete
  };
  state.complete = isComplete;
  state.responseText = "";
  state.interimTranscript = "";
  state.lastFeedback = "";
  persistProgress();

  if (isComplete) {
    addLog("PM", `${procedure.title.toUpperCase()} COMPLETE`, "success", false);
    render();
    queuePmSpeech([{ text: `${procedure.title} complete`, options: { kind: "title" }, delayBefore: 0 }]);
    return;
  }

  const nextItem = procedure.items[nextIndex];
  addLog("PM", nextItem.challenge, "info", false);
  render();
  queuePmSpeech([{ text: nextItem.challenge, options: { kind: "challenge" }, delayBefore: 350 }]);
}

function resetChecklist() {
  clearSpeechQueue();
  const procedure = getProcedure();
  state.progress[procedure.id] = { itemIndex: 0, complete: false };
  state.complete = false;
  state.responseText = "";
  state.interimTranscript = "";
  state.lastFeedback = "";
  state.lastSubmittedKey = "";
  state.lastSubmittedAt = 0;
  persistProgress();
  addLog("PM", `RESET ${procedure.title.toUpperCase()}`, "warn", false);
  render();
  queuePmSpeech([{ text: "Checklist reset", delayBefore: 0 }]);
}

function repeatItem() {
  const procedure = getProcedure();
  const item = getCurrentItem();
  if (!item) {
    queuePmSpeech([{ text: `${procedure.title} complete`, options: { kind: "title" }, delayBefore: 0 }]);
    return;
  }
  addLog("PM", `REPEAT: ${item.challenge}`, "info", false);
  render();
  queuePmSpeech([{ text: item.challenge, options: { kind: "challenge" }, delayBefore: 0 }]);
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
  addLog("PM", `${modeId.toUpperCase()} MODE`, "info", false);
  render();
  queuePmSpeech([{ text: `${modeId} mode`, delayBefore: 0 }]);
}

function toggleVoiceEnabled() {
  state.voiceEnabled = !state.voiceEnabled;
  persistPreferences();
  if (!state.voiceEnabled) {
    clearSpeechQueue();
  }
  render();
}

function toggleAutoSubmit() {
  state.autoSubmitVoice = !state.autoSubmitVoice;
  persistPreferences();
  render();
}

function updateSelectedVoice(voiceUri) {
  state.selectedVoiceUri = voiceUri;
  persistPreferences();
  render();
}

function updateSpeechRate(value) {
  state.speechRate = clamp(Number(value), 0.8, 1.05);
  persistPreferences();
  render();
}

function stopListening() {
  state.listeningDesired = false;
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

  addLog("VOICE", normalized.toUpperCase(), "info", false);
  render();
  action();
  return true;
}

function startListening() {
  if (!state.recognition) {
    return;
  }

  state.listeningDesired = true;
  state.interimTranscript = "";
  try {
    state.recognition.start();
  } catch {
    // Recognition can throw if already active. Keep desired state true.
  }
}

function processFinalTranscript(finalText) {
  const normalizedFinal = normalizeText(finalText);
  const now = Date.now();

  if (!normalizedFinal) {
    return;
  }

  if (normalizedFinal === state.lastVoiceTranscript && now - state.lastVoiceTranscriptAt < 1400) {
    return;
  }

  state.lastVoiceTranscript = normalizedFinal;
  state.lastVoiceTranscriptAt = now;

  if (handleCommand(finalText)) {
    state.responseText = "";
    state.interimTranscript = "";
    render();
    return;
  }

  setResponseText(finalText, false);
  state.interimTranscript = "";
  addLog("VOICE", `HEARD: ${normalizedFinal}`, "info", false);
  render();

  if (state.autoSubmitVoice) {
    window.setTimeout(() => {
      submitResponse(finalText, "voice");
    }, 120);
  }
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

    if (!state.listeningDesired) {
      return;
    }

    window.setTimeout(() => {
      if (!state.listeningDesired) {
        return;
      }
      try {
        recognition.start();
      } catch {
        // Allow the active session to continue if the browser restarted automatically.
      }
    }, 250);
  };

  recognition.onerror = (event) => {
    state.isListening = false;
    addLog("VOICE", `RECOGNITION ERROR: ${String(event.error || "unknown").toUpperCase()}`, "warn");

    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      state.listeningDesired = false;
    }
  };

  recognition.onresult = (event) => {
    const finalPhrases = [];
    let interimTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const transcript = String(event.results[i][0].transcript || "").trim();
      if (!transcript) {
        continue;
      }

      if (event.results[i].isFinal) {
        finalPhrases.push(transcript);
      } else {
        interimTranscript += `${transcript} `;
      }
    }

    state.interimTranscript = interimTranscript.trim();
    render();

    for (const phrase of finalPhrases) {
      processFinalTranscript(phrase);
    }
  };

  state.recognition = recognition;
}

function pickPreferredVoice(voices) {
  if (!voices.length) {
    return "";
  }

  const scoreVoice = (voice) => {
    let score = 0;
    const text = `${voice.name} ${voice.voiceURI}`.toLowerCase();
    if (voice.lang?.toLowerCase().startsWith("en-us")) score += 6;
    else if (voice.lang?.toLowerCase().startsWith("en-gb")) score += 5;
    else if (voice.lang?.toLowerCase().startsWith("en")) score += 4;
    if (text.includes("natural")) score += 8;
    if (text.includes("aria")) score += 7;
    if (text.includes("jenny")) score += 7;
    if (text.includes("guy")) score += 5;
    if (text.includes("samantha")) score += 6;
    if (text.includes("google")) score += 4;
    if (text.includes("microsoft")) score += 4;
    if (voice.default) score += 3;
    return score;
  };

  return [...voices].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0]?.voiceURI || voices[0].voiceURI;
}

function setupVoices() {
  if (!("speechSynthesis" in window)) {
    render();
    return;
  }

  const loadVoices = () => {
    const voices = window.speechSynthesis.getVoices().filter((voice) => /^en/i.test(voice.lang));
    state.voices = voices;

    if (!voices.some((voice) => voice.voiceURI === state.selectedVoiceUri)) {
      state.selectedVoiceUri = pickPreferredVoice(voices);
      persistPreferences();
    }

    render();
  };

  loadVoices();
  if (typeof window.speechSynthesis.addEventListener === "function") {
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
  } else {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
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
  const selectedVoice = getSelectedVoice();

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
            <div class="voice-config">
              <label>
                <span>PM voice</span>
                <select id="voice-select" data-action="voice-select">
                  ${state.voices.length ? state.voices.map((voice) => `
                    <option value="${escapeHtml(voice.voiceURI)}" ${voice.voiceURI === selectedVoice?.voiceURI ? "selected" : ""}>
                      ${escapeHtml(`${voice.name} (${voice.lang})`)}
                    </option>
                  `).join("") : `<option value="">Loading voices...</option>`}
                </select>
              </label>
              <label>
                <span>Speech rate</span>
                <input id="speech-rate" data-action="speech-rate" type="range" min="0.8" max="1.05" step="0.01" value="${state.speechRate}">
                <small>${state.speechRate.toFixed(2)}x</small>
              </label>
            </div>
            <p class="voice-state ${state.isListening ? "live" : ""}">${state.isListening ? "Listening for responses and voice commands..." : "Voice recognition idle."}</p>
            ${state.recognitionSupported ? `
              <ul class="command-list">
                <li>Voice commands: start checklist, repeat item, next item, previous item, skip item, reset checklist, stop listening, normal mode, training mode, strict mode, clear log.</li>
                <li>Quick test: use the Before Start checklist to verify cockpit preparation, doors, and beacon progression.</li>
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

  const voiceSelect = ROOT.querySelector("#voice-select");
  if (voiceSelect) {
    voiceSelect.addEventListener("change", (event) => {
      updateSelectedVoice(event.target.value);
    });
  }

  const speechRate = ROOT.querySelector("#speech-rate");
  if (speechRate) {
    speechRate.addEventListener("input", (event) => {
      updateSpeechRate(event.target.value);
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
    if (!actionMap[action] || action === "mode" || action === "select-phase" || action === "voice-select" || action === "speech-rate") {
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

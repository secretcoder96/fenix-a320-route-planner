const DATA_SOURCES = {
  vatsim: "https://data.vatsim.net/v3/vatsim-data.json",
  airports: "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports-extended.dat",
  airlines: "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat",
  routes: "https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat",
};

const AIRBUS_EQUIPMENT_CODES = new Set([
  "318", "319", "320", "321", "32A", "32B", "32N", "32Q", "32S", "319 320 321",
]);

const TERMINAL_GATE_DATABASE = {
  KSAN: {
    ASA: "Terminal 2, commonly west side gates around 20-31; public-terminal estimate.",
    AAL: "Terminal 2 East, often around gates 46-50 or nearby; public-terminal estimate.",
    DAL: "Terminal 2 West, often low-40s gate area; public-terminal estimate.",
    JBU: "Terminal 2, mid-20s to low-30s gate area is a reasonable estimate.",
    UAL: "Terminal 2, high-30s to low-40s area is a reasonable estimate.",
    SWA: "Terminal 1 West or Terminal 2 depending on operation; gate range estimate only.",
  },
  KLAX: {
    AAL: "Terminal 4/5 area is the strongest estimate for American mainline narrowbody ops.",
    DAL: "Terminal 3 is the most likely Delta estimate.",
    UAL: "Terminal 7/8 is the most likely United estimate.",
    JBU: "Terminal 5 is the best estimate for JetBlue.",
    ASA: "Terminal 6 is the best estimate for Alaska.",
    SWA: "Terminal 1 is the most likely Southwest estimate.",
  },
  KSFO: {
    UAL: "Terminal 3 is the strongest estimate for United domestic A320-family service.",
    DAL: "Terminal 1 is the most likely Delta estimate.",
    AAL: "Terminal 1 or 2 is the most likely estimate.",
    ASA: "Terminal 1, Boarding Area B/C is a reasonable estimate.",
    JBU: "Terminal 1 is the best estimate.",
  },
  KSEA: {
    ASA: "N Concourse is the most likely Alaska estimate.",
    DAL: "A Concourse is the most likely Delta estimate.",
    UAL: "A or B gates are the best broad estimate for United.",
    AAL: "D gates are a reasonable estimate for American.",
  },
  KPHX: {
    AAL: "Terminal 4 is the strongest estimate for American.",
    DAL: "Terminal 3 is the best Delta estimate.",
    UAL: "Terminal 3 is the best United estimate.",
    SWA: "Terminal 4 is the strongest Southwest estimate.",
  },
  KDEN: {
    UAL: "Concourse B is the strongest estimate for United.",
    DAL: "Concourse A is the best Delta estimate.",
    AAL: "Concourse A is the best American estimate.",
    SWA: "Concourse C is the strongest Southwest estimate.",
  },
  CYVR: {
    ACA: "Domestic gates at C gates are the best Air Canada estimate.",
    WJA: "Domestic concourse, often C or B gates, is the best estimate.",
  },
  EGLL: {
    BAW: "Terminal 5 is the strongest British Airways estimate.",
  },
  EHAM: {
    KLM: "Schengen piers at D or C are the best KLM estimate.",
    TRA: "Departures 3 with Schengen gates is a reasonable estimate for Transavia.",
    EZY: "Departures 3 with Schengen gates is a reasonable estimate for easyJet.",
  },
  EIDW: {
    EIN: "Terminal 1 is the strongest Aer Lingus estimate.",
    RYR: "Terminal 1 is the strongest Ryanair estimate.",
  },
  LEBL: {
    VLG: "Terminal 1 is the strongest Vueling estimate.",
    IBE: "Terminal 1 is the strongest Iberia estimate.",
  },
  LPPT: {
    TAP: "Terminal 1 is the strongest TAP short-haul estimate.",
    EZY: "Terminal 1 is a reasonable easyJet estimate.",
  },
  EDDF: {
    DLH: "Terminal 1, concourses A/B is the strongest Lufthansa estimate.",
  },
  LFPG: {
    AFR: "Terminal 2F is the strongest Air France short-haul estimate.",
    EZY: "Terminal 2D is a reasonable easyJet estimate.",
  },
};

const PREFERRED_A320_AIRLINES = new Set([
  "AAL", "DAL", "UAL", "ASA", "JBU", "ACA", "WJA", "BAW", "EZY", "IBE", "VLG", "AFR", "KLM", "DLH", "EIN", "TAP", "SAS", "CFG", "BTI", "SWR",
]);

const form = document.getElementById("planner-form");
const resultsEl = document.getElementById("results");
const favoritesEl = document.getElementById("favorites");
const timeSummaryEl = document.getElementById("time-summary");
const networkStatusEl = document.getElementById("network-status");
const resultMetaEl = document.getElementById("result-meta");
const favoritesMetaEl = document.getElementById("favorites-meta");
const planButton = document.getElementById("plan-button");
const refreshButton = document.getElementById("refresh-button");
const template = document.getElementById("result-card-template");

const state = {
  airports: [],
  airportMap: new Map(),
  airportCodeMap: new Map(),
  airlines: new Map(),
  routes: [],
  network: null,
  lastSnapshot: null,
};

init();

async function init() {
  setDefaultDateAndTimes();
  hydratePreferences();
  bindEvents();
  updateTimeSummary();
  renderFavorites();
  registerServiceWorker();
  await loadReferenceData();
  await refreshNetwork();
}

function bindEvents() {
  form.addEventListener("submit", onSubmit);
  refreshButton.addEventListener("click", refreshNetwork);
  ["departure-date", "departure-time", "arrival-time"].forEach((id) => {
    document.getElementById(id).addEventListener("input", updateTimeSummary);
  });

  document.querySelectorAll("[data-region-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const regionSelect = document.getElementById("regions");
      const preset = button.dataset.regionPreset;
      const selections = preset === "NA" ? ["NA"] : preset === "EU" ? ["EU"] : ["NA", "EU", "MIXED"];
      Array.from(regionSelect.options).forEach((option) => {
        option.selected = selections.includes(option.value);
      });
      persistPreferences();
    });
  });

  ["regions", "daylight-preference", "coverage-priority", "result-count", "home-airport"].forEach((id) => {
    document.getElementById(id).addEventListener("change", persistPreferences);
  });
}

function setDefaultDateAndTimes() {
  const now = new Date();
  const pacificNow = formatDateInZone(now, "America/Los_Angeles");
  document.getElementById("departure-date").value = pacificNow.date;
  document.getElementById("departure-time").value = pacificNow.time.slice(0, 5);

  const onBlock = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const pacificLater = formatDateInZone(onBlock, "America/Los_Angeles");
  document.getElementById("arrival-time").value = pacificLater.time.slice(0, 5);
}

function hydratePreferences() {
  const raw = localStorage.getItem("fenixA320PlannerPrefs");
  if (!raw) {
    return;
  }

  try {
    const prefs = JSON.parse(raw);
    if (prefs.homeAirport) {
      document.getElementById("home-airport").value = prefs.homeAirport;
    }
    if (prefs.daylightPreference) {
      document.getElementById("daylight-preference").value = prefs.daylightPreference;
    }
    if (prefs.coveragePriority) {
      document.getElementById("coverage-priority").value = prefs.coveragePriority;
    }
    if (prefs.resultCount) {
      document.getElementById("result-count").value = prefs.resultCount;
    }
    if (Array.isArray(prefs.regions)) {
      const select = document.getElementById("regions");
      Array.from(select.options).forEach((option) => {
        option.selected = prefs.regions.includes(option.value);
      });
    }
  } catch (error) {
    console.warn("Could not load saved preferences.", error);
  }
}

function persistPreferences() {
  const regionSelect = document.getElementById("regions");
  const prefs = {
    homeAirport: document.getElementById("home-airport").value.toUpperCase(),
    daylightPreference: document.getElementById("daylight-preference").value,
    coveragePriority: document.getElementById("coverage-priority").value,
    resultCount: document.getElementById("result-count").value,
    regions: getSelectedValues(regionSelect),
  };
  localStorage.setItem("fenixA320PlannerPrefs", JSON.stringify(prefs));
}

async function loadReferenceData() {
  resultMetaEl.textContent = "Loading route datasets";
  const [airportsText, airlinesText, routesText] = await Promise.all([
    fetchText(DATA_SOURCES.airports),
    fetchText(DATA_SOURCES.airlines),
    fetchText(DATA_SOURCES.routes),
  ]);

  state.airports = parseAirports(airportsText);
  state.airportMap = new Map(state.airports.map((airport) => [airport.icao, airport]));
  state.airportCodeMap = new Map();
  state.airports.forEach((airport) => {
    state.airportCodeMap.set(airport.icao, airport.icao);
    if (airport.iata && airport.iata !== "\\N") {
      state.airportCodeMap.set(airport.iata, airport.icao);
    }
  });
  state.airlines = parseAirlines(airlinesText);
  state.routes = parseRoutes(routesText).filter((route) => {
    if (!state.airportMap.has(route.from) || !state.airportMap.has(route.to)) {
      return false;
    }
    if (route.stops !== 0) {
      return false;
    }
    if (!route.equipment.length) {
      return false;
    }
    return route.equipment.some((eq) => AIRBUS_EQUIPMENT_CODES.has(eq) || ["319", "320", "321", "32N", "32A", "32Q", "32S"].includes(eq));
  });
}

async function refreshNetwork() {
  networkStatusEl.innerHTML = "<p>Refreshing live VATSIM snapshot...</p>";
  try {
    state.network = await fetchJson(DATA_SOURCES.vatsim);
    state.lastSnapshot = new Date();
    const controllers = state.network.controllers ?? [];
    const pilots = state.network.pilots ?? [];
    networkStatusEl.innerHTML = `
      <p><strong>Snapshot time:</strong> ${state.network.general?.update_timestamp ?? "Unknown"}</p>
      <p><strong>Controllers online:</strong> ${controllers.length}</p>
      <p><strong>Pilots online:</strong> ${pilots.length}</p>
      <p><strong>Connected clients:</strong> ${state.network.general?.connected_clients ?? "Unknown"}</p>
    `;
  } catch (error) {
    console.error(error);
    networkStatusEl.innerHTML = `
      <p><strong>Live snapshot failed.</strong></p>
      <p>${error.message}</p>
      <p>If this persists on GitHub Pages, the likely next step is a tiny serverless proxy.</p>
    `;
  }
}

async function onSubmit(event) {
  event.preventDefault();
  planButton.disabled = true;
  planButton.textContent = "Planning...";
  persistPreferences();

  try {
    if (!state.network) {
      await refreshNetwork();
    }

    const input = collectInput();
    updateTimeSummary(input);
    const rankedRoutes = rankRoutes(input);
    renderResults(rankedRoutes, input);
  } catch (error) {
    console.error(error);
    resultsEl.innerHTML = `
      <article class="empty-state">
        <h3>Could not build route suggestions</h3>
        <p>${error.message}</p>
      </article>
    `;
  } finally {
    planButton.disabled = false;
    planButton.textContent = "Find Routes";
  }
}

function collectInput() {
  const departureDate = document.getElementById("departure-date").value;
  const departureTime = document.getElementById("departure-time").value;
  const arrivalTime = document.getElementById("arrival-time").value;
  const homeAirport = document.getElementById("home-airport").value.toUpperCase();
  const regions = getSelectedValues(document.getElementById("regions"));
  const daylightPreference = document.getElementById("daylight-preference").value;
  const coveragePriority = document.getElementById("coverage-priority").value;
  const resultCount = Number(document.getElementById("result-count").value);

  const depUtc = pacificLocalToUtc(departureDate, departureTime);
  let arrUtc = pacificLocalToUtc(departureDate, arrivalTime);
  if (arrUtc <= depUtc) {
    arrUtc = new Date(arrUtc.getTime() + 24 * 60 * 60 * 1000);
  }

  return {
    departureDate,
    departureTime,
    arrivalTime,
    depUtc,
    arrUtc,
    blockMinutes: Math.round((arrUtc.getTime() - depUtc.getTime()) / 60000),
    homeAirport,
    regions,
    daylightPreference,
    coveragePriority,
    resultCount,
  };
}

function updateTimeSummary(input = null) {
  try {
    const currentInput = input ?? collectInput();
    const depZulu = formatZulu(currentInput.depUtc);
    const arrZulu = formatZulu(currentInput.arrUtc);
    const block = formatMinutes(currentInput.blockMinutes);
    timeSummaryEl.innerHTML = `
      <p><strong>Pacific off-block:</strong> ${currentInput.departureDate} ${currentInput.departureTime}</p>
      <p><strong>Pacific on-block:</strong> ${currentInput.arrUtc.getTime() > currentInput.depUtc.getTime() && currentInput.arrUtc.toISOString().slice(0, 10) !== currentInput.depUtc.toISOString().slice(0, 10) ? `${currentInput.arrUtc.toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" })} ${currentInput.arrivalTime}` : `${currentInput.departureDate} ${currentInput.arrivalTime}`}</p>
      <p><strong>Zulu window:</strong> ${depZulu} to ${arrZulu}</p>
      <p><strong>Target block time:</strong> ${block}</p>
    `;
  } catch {
    timeSummaryEl.innerHTML = "<p>Enter a full Pacific local flight window to compute your Zulu times.</p>";
  }
}

function rankRoutes(input) {
  const viableRegions = new Set(input.regions.includes("MIXED") ? ["NA", "EU"] : input.regions);
  const candidates = [];

  for (const route of state.routes) {
    const from = state.airportMap.get(route.from);
    const to = state.airportMap.get(route.to);
    if (!from || !to) {
      continue;
    }

    if (!viableRegions.has(from.region) || !viableRegions.has(to.region)) {
      continue;
    }

    const airline = state.airlines.get(route.airlineCode) ?? {
      code: route.airlineCode,
      name: route.airlineCode,
    };

    const distanceNm = greatCircleNm(from.lat, from.lon, to.lat, to.lon);
    const estimatedBlockMinutes = estimateBlockMinutes(distanceNm);
    const blockDelta = Math.abs(estimatedBlockMinutes - input.blockMinutes);
    if (blockDelta > 35) {
      continue;
    }

    const depLocal = new Intl.DateTimeFormat("en-US", {
      timeZone: from.tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(input.depUtc);
    const arrEstimateUtc = new Date(input.depUtc.getTime() + estimatedBlockMinutes * 60000);
    const arrLocal = new Intl.DateTimeFormat("en-US", {
      timeZone: to.tz,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(arrEstimateUtc);

    const daylightScore = computeDaylightScore(input.daylightPreference, input.depUtc, arrEstimateUtc, from.tz, to.tz);
    const coverage = scoreCoverage(route.from, route.to);
    const realismBias = realismScore(input.homeAirport, route, airline.code);
    const coverageWeight = input.coveragePriority === "high" ? 1.5 : input.coveragePriority === "balanced" ? 1.2 : 0.9;

    const score = (120 - blockDelta * 2.1) + (coverage.score * coverageWeight) + daylightScore + realismBias;
    candidates.push({
      route,
      from,
      to,
      airline,
      distanceNm,
      estimatedBlockMinutes,
      depLocal,
      arrLocal,
      coverage,
      score,
      arrEstimateUtc,
      flightNumber: suggestFlightNumber(airline.code, route.from, route.to),
      gateInfo: buildGateInfo(route.from, route.to, airline.code),
      whyFit: buildWhyFit(route, airline, estimatedBlockMinutes, coverage, blockDelta, daylightScore),
    });
  }

  return candidates
    .sort((a, b) => b.score - a.score)
    .slice(0, input.resultCount);
}

function renderResults(routes, input) {
  if (!routes.length) {
    resultMetaEl.textContent = "No strong matches";
    resultsEl.innerHTML = `
      <article class="empty-state">
        <h3>No close route match found</h3>
        <p>
          Try widening the block window, changing regions, or selecting “Night is okay.” The current live ATC snapshot
          may also be thin for the requested timing.
        </p>
      </article>
    `;
    return;
  }

  resultMetaEl.textContent = `${routes.length} ranked route${routes.length === 1 ? "" : "s"}`;
  resultsEl.innerHTML = "";

  for (const candidate of routes) {
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".eyebrow").textContent = `${candidate.airline.code} • ${candidate.airline.name}`;
    fragment.querySelector(".route-title").textContent = `${candidate.route.from} → ${candidate.route.to}`;
    fragment.querySelector(".score-badge").textContent = candidate.coverage.label;

    const details = [
      ["Estimated block", formatMinutes(candidate.estimatedBlockMinutes)],
      ["Airline ICAO", candidate.airline.code],
      ["Airline name", candidate.airline.name],
      ["Suggested flight number", candidate.flightNumber],
      ["SimBrief origin / destination", `${candidate.route.from} / ${candidate.route.to}`],
      ["Departure local", `${candidate.route.from} ${candidate.depLocal}`],
      ["Arrival local", `${candidate.route.to} ${candidate.arrLocal}`],
      ["Zulu timing", `${formatZulu(input.depUtc)} to ${formatZulu(candidate.arrEstimateUtc)}`],
      ["Departure ATC online", candidate.coverage.depPositions.summary],
      ["Arrival ATC online", candidate.coverage.arrPositions.summary],
      ["Likely gate / terminal", candidate.gateInfo],
      ["Coverage outlook", candidate.coverage.description],
      ["Why it fits", `${Math.round(candidate.distanceNm)} nm stage length, realistic for an A320-family rotation.`],
    ];

    const detailGrid = fragment.querySelector(".detail-grid");
    details.forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "detail-item";
      item.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
      detailGrid.appendChild(item);
    });

    const strip = fragment.querySelector(".coverage-strip");
    candidate.coverage.chips.forEach((chip) => {
      const node = document.createElement("span");
      node.className = `coverage-chip ${chip.tone}`;
      node.textContent = chip.text;
      strip.appendChild(node);
    });

    const exportBlock = fragment.querySelector(".export-block");
    exportBlock.value = buildSimbriefBlock(candidate, input);
    fragment.querySelector(".copy-export-button").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(exportBlock.value);
        fragment.querySelector(".copy-export-button").textContent = "Copied";
        setTimeout(() => {
          fragment.querySelector(".copy-export-button").textContent = "Copy SimBrief Block";
        }, 1500);
      } catch {
        exportBlock.select();
      }
    });

    const saveButton = fragment.querySelector(".save-route-button");
    const favoriteKey = `${candidate.route.from}-${candidate.route.to}-${candidate.airline.code}`;
    if (isFavorite(favoriteKey)) {
      saveButton.textContent = "Saved";
    }
    saveButton.addEventListener("click", () => {
      toggleFavorite(candidate, input);
      const nowSaved = isFavorite(favoriteKey);
      saveButton.textContent = nowSaved ? "Saved" : "Save Route";
      renderFavorites();
    });

    fragment.querySelector(".why-fit").textContent = candidate.whyFit;
    resultsEl.appendChild(fragment);
  }
}

function scoreCoverage(depIcao, arrIcao) {
  const controllers = state.network?.controllers ?? [];
  const depMatches = controllers.filter((controller) => (controller.callsign ?? "").startsWith(`${depIcao}_`));
  const arrMatches = controllers.filter((controller) => (controller.callsign ?? "").startsWith(`${arrIcao}_`));
  const centerMatches = controllers.filter((controller) => /_(CTR|APP|DEP)$/.test(controller.callsign ?? ""));

  const depHasTower = depMatches.some((c) => /_(DEL|GND|TWR|APP|DEP)$/.test(c.callsign));
  const arrHasTower = arrMatches.some((c) => /_(DEL|GND|TWR|APP|DEP)$/.test(c.callsign));
  const enrouteBonus = Math.min(centerMatches.length, 12);
  const depPositions = summarizeAirportPositions(depMatches);
  const arrPositions = summarizeAirportPositions(arrMatches);

  let score = (depMatches.length * 10) + (arrMatches.length * 10) + enrouteBonus;
  let label = "Light coverage";
  let description = "Some controllers are online, but this route would likely have gaps.";

  if (depHasTower && arrHasTower && score >= 35) {
    label = "Strong partial-to-full coverage";
    description = "Both ends show live local ATC, with a decent chance of meaningful coverage through most of the flight.";
    score += 30;
  } else if ((depHasTower || arrHasTower) && score >= 18) {
    label = "Partial coverage likely";
    description = "One or both ends have useful live ATC, with at least some realistic controller interaction likely.";
    score += 14;
  }

  const chips = [
    { text: `${depIcao}: ${depMatches.length} local positions`, tone: depMatches.length >= 2 ? "good" : depMatches.length >= 1 ? "warn" : "low" },
    { text: `${arrIcao}: ${arrMatches.length} local positions`, tone: arrMatches.length >= 2 ? "good" : arrMatches.length >= 1 ? "warn" : "low" },
    { text: `${centerMatches.length} wider enroute APP/CTR positions online`, tone: centerMatches.length >= 8 ? "good" : centerMatches.length >= 3 ? "warn" : "low" },
  ];

  return { score, label, description, chips, depPositions, arrPositions };
}

function computeDaylightScore(preference, depUtc, arrUtc, depTz, arrTz) {
  if (preference === "night-ok") {
    return 0;
  }

  const depHour = zonedHour(depUtc, depTz);
  const arrHour = zonedHour(arrUtc, arrTz);
  const depDay = depHour >= 6 && depHour <= 20;
  const arrDay = arrHour >= 6 && arrHour <= 22;

  if (depDay && arrDay) {
    return preference === "prefer-daylight" ? 24 : 12;
  }
  if (depDay || arrDay) {
    return preference === "prefer-daylight" ? 8 : 4;
  }
  return preference === "prefer-daylight" ? -20 : -8;
}

function realismScore(homeAirport, route, airlineCode) {
  let score = 0;
  if (route.from === homeAirport || route.to === homeAirport) {
    score += 18;
  }
  if (PREFERRED_A320_AIRLINES.has(airlineCode)) {
    score += 10;
  }
  return score;
}

function buildWhyFit(route, airline, estimatedBlockMinutes, coverage, blockDelta, daylightScore) {
  const pieces = [
    `${airline.name} is a believable A320-family operator for this city pair.`,
    `The estimated block of ${formatMinutes(estimatedBlockMinutes)} is within ${blockDelta} minutes of your requested gate-to-gate window.`,
    coverage.description,
  ];

  if (daylightScore > 0) {
    pieces.push("The timing also leans toward a better daylight experience.");
  } else if (daylightScore < 0) {
    pieces.push("This one is workable, but the timing skews darker than your stated preference.");
  }

  return pieces.join(" ");
}

function buildSimbriefBlock(candidate, input) {
  return [
    `Airline ICAO: ${candidate.airline.code}`,
    `Airline Name: ${candidate.airline.name}`,
    `Flight Number: ${candidate.flightNumber.replace(candidate.airline.code, "")}`,
    `Callsign / Flight: ${candidate.flightNumber}`,
    `Aircraft: Fenix A320`,
    `Origin ICAO: ${candidate.route.from}`,
    `Destination ICAO: ${candidate.route.to}`,
    `Off-block Pacific: ${input.departureDate} ${input.departureTime}`,
    `On-block Pacific: ${input.arrivalTime}`,
    `Planned Zulu Off-block: ${formatZulu(input.depUtc)}`,
    `Estimated Zulu On-block: ${formatZulu(candidate.arrEstimateUtc)}`,
    `Estimated Block Time: ${formatMinutes(candidate.estimatedBlockMinutes)}`,
    `Departure ATC Online: ${candidate.coverage.depPositions.summary}`,
    `Arrival ATC Online: ${candidate.coverage.arrPositions.summary}`,
    `Estimated Terminal/Gate: ${candidate.gateInfo}`,
  ].join("\n");
}

function toggleFavorite(candidate, input) {
  const favorites = loadFavorites();
  const key = `${candidate.route.from}-${candidate.route.to}-${candidate.airline.code}`;
  const existingIndex = favorites.findIndex((item) => item.key === key);

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
  } else {
    favorites.unshift({
      key,
      route: `${candidate.route.from} → ${candidate.route.to}`,
      airlineCode: candidate.airline.code,
      airlineName: candidate.airline.name,
      flightNumber: candidate.flightNumber,
      block: formatMinutes(candidate.estimatedBlockMinutes),
      gateInfo: candidate.gateInfo,
      savedAt: new Date().toISOString(),
      exportBlock: buildSimbriefBlock(candidate, input),
    });
  }

  localStorage.setItem("fenixA320PlannerFavorites", JSON.stringify(favorites.slice(0, 12)));
}

function loadFavorites() {
  const raw = localStorage.getItem("fenixA320PlannerFavorites");
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isFavorite(key) {
  return loadFavorites().some((item) => item.key === key);
}

function renderFavorites() {
  const favorites = loadFavorites();
  favoritesMetaEl.textContent = `${favorites.length} saved`;

  if (!favorites.length) {
    favoritesEl.innerHTML = `
      <article class="empty-state">
        <h3>No favorites yet</h3>
        <p>Use the save button on any suggested route to keep it handy for later.</p>
      </article>
    `;
    return;
  }

  favoritesEl.innerHTML = "";
  favorites.forEach((favorite) => {
    const card = document.createElement("article");
    card.className = "favorite-card";
    card.innerHTML = `
      <h3>${favorite.route}</h3>
      <p><strong>${favorite.airlineCode}</strong> • ${favorite.airlineName} • ${favorite.flightNumber}</p>
      <p><strong>Estimated block:</strong> ${favorite.block}</p>
      <p><strong>Terminal / gate:</strong> ${favorite.gateInfo}</p>
      <div class="card-actions">
        <button type="button" class="secondary copy-favorite-export">Copy SimBrief Block</button>
        <button type="button" class="secondary remove-favorite">Remove</button>
      </div>
    `;

    card.querySelector(".copy-favorite-export").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(favorite.exportBlock);
      } catch {
        console.warn("Clipboard copy failed for favorite.");
      }
    });

    card.querySelector(".remove-favorite").addEventListener("click", () => {
      const filtered = loadFavorites().filter((item) => item.key !== favorite.key);
      localStorage.setItem("fenixA320PlannerFavorites", JSON.stringify(filtered));
      renderFavorites();
    });

    favoritesEl.appendChild(card);
  });
}

function summarizeAirportPositions(controllers) {
  const order = ["DEL", "GND", "TWR", "APP", "DEP", "CTR", "ATIS", "FSS"];
  const labels = {
    DEL: "Clearance / Delivery",
    GND: "Ground",
    TWR: "Tower",
    APP: "Approach",
    DEP: "Departure",
    CTR: "Center",
    ATIS: "ATIS",
    FSS: "FSS",
  };

  const present = new Set();
  controllers.forEach((controller) => {
    const match = (controller.callsign ?? "").match(/_([A-Z]+)$/);
    if (match) {
      present.add(match[1]);
    }
  });

  const ordered = order.filter((code) => present.has(code));
  if (!ordered.length) {
    return {
      codes: [],
      summary: "No local ATC positions online in the current VATSIM snapshot.",
    };
  }

  const formatted = ordered.map((code) => labels[code] ?? code);
  let summary = formatted.join(", ");

  if ((present.has("APP") || present.has("DEP")) && !present.has("TWR")) {
    summary += ". APP/DEP would typically provide top-down coverage for tower and ground as needed on VATSIM.";
  } else if (present.has("CTR") && !present.has("APP") && !present.has("DEP") && !present.has("TWR")) {
    summary += ". CTR may be providing limited top-down coverage depending on local procedures.";
  }

  return {
    codes: ordered,
    summary,
  };
}

function buildGateInfo(depIcao, arrIcao, airlineCode) {
  const depHint = TERMINAL_GATE_DATABASE[depIcao]?.[airlineCode] ?? "Likely a mainline narrowbody terminal or domestic/Schengen pier estimate only.";
  const arrHint = TERMINAL_GATE_DATABASE[arrIcao]?.[airlineCode] ?? "Likely a mainline narrowbody terminal or domestic/Schengen pier estimate only.";
  return `Dep: ${depHint} Arr: ${arrHint}`;
}

function suggestFlightNumber(airlineCode, from, to) {
  const numericSeed = Array.from(`${from}${to}`)
    .map((char) => char.charCodeAt(0))
    .reduce((sum, code) => sum + code, 0);
  const number = 100 + (numericSeed % 1800);
  return `${airlineCode}${number}`;
}

function parseAirports(text) {
  return text.split(/\r?\n/).map(parseDatLine).filter(Boolean).map((row) => ({
    icao: row[5],
    iata: row[4],
    name: row[1],
    city: row[2],
    country: row[3],
    lat: Number(row[6]),
    lon: Number(row[7]),
    tz: row[11],
    region: inferRegion(row[3], row[11]),
  })).filter((airport) => airport.icao && airport.tz && (airport.region === "NA" || airport.region === "EU"));
}

function parseAirlines(text) {
  return new Map(text.split(/\r?\n/).map(parseDatLine).filter(Boolean).map((row) => {
    const icao = row[4];
    return [icao, { code: icao, name: row[1] }];
  }).filter(([code]) => code && code !== "\\N"));
}

function parseRoutes(text) {
  return text.split(/\r?\n/).map(parseDatLine).filter(Boolean).map((row) => ({
    airlineCode: row[0],
    from: normalizeAirportCode(row[2]),
    to: normalizeAirportCode(row[4]),
    stops: Number(row[7] || 0),
    equipment: (row[8] || "").split(/\s+/).filter(Boolean),
  })).filter((route) => route.from && route.to && route.airlineCode);
}

function parseDatLine(line) {
  if (!line) {
    return null;
  }

  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function normalizeAirportCode(code) {
  if (!code || code === "\\N") {
    return null;
  }
  return state.airportCodeMap.get(code) ?? null;
}

function inferRegion(country, tz) {
  if (tz.startsWith("Europe/") || ["Ireland", "United Kingdom", "Spain", "France", "Germany", "Netherlands", "Portugal", "Denmark", "Sweden", "Norway", "Italy", "Belgium", "Switzerland", "Austria"].includes(country)) {
    return "EU";
  }
  if (tz.startsWith("America/") || ["United States", "Canada", "Mexico"].includes(country)) {
    return "NA";
  }
  return "OTHER";
}

function estimateBlockMinutes(distanceNm) {
  if (distanceNm < 220) {
    return Math.round(42 + distanceNm / 5.2);
  }
  if (distanceNm < 700) {
    return Math.round(34 + distanceNm / 6.7);
  }
  return Math.round(30 + distanceNm / 7.1);
}

function greatCircleNm(lat1, lon1, lat2, lon2) {
  const r = 3440.065;
  const toRad = (degrees) => degrees * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function pacificLocalToUtc(dateString, timeString) {
  const [year, month, day] = dateString.split("-").map(Number);
  const [hour, minute] = timeString.split(":").map(Number);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const pacificOffsetMinutes = getOffsetMinutes(utcGuess, "America/Los_Angeles");
  return new Date(utcGuess.getTime() - pacificOffsetMinutes * 60000);
}

function getOffsetMinutes(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return Math.round((asUtc - date.getTime()) / 60000);
}

function zonedHour(date, timeZone) {
  return Number(new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    hour12: false,
  }).format(date));
}

function formatZulu(date) {
  return `${date.toISOString().slice(0, 16).replace("T", " ")}Z`;
}

function formatMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${String(minutes).padStart(2, "0")}`;
}

function formatDateInZone(date, timeZone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

function getSelectedValues(select) {
  return Array.from(select.selectedOptions).map((option) => option.value);
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed for ${url} (${response.status}).`);
  }
  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Request failed for ${url} (${response.status}).`);
  }
  return response.text();
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed.", error);
    });
  }
}

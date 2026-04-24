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
  "AAL", "DAL", "UAL", "ASA", "JBU", "ACA", "WJA", "AMX", "BAW", "EZY", "IBE", "VLG", "AFR", "KLM", "DLH", "EIN", "TAP", "SAS", "CFG", "BTI", "SWR", "WZZ",
]);

const MANUAL_AIRLINE_NAMES = {
  AAL: "American Airlines",
  ACA: "Air Canada",
  AFR: "Air France",
  AMX: "Aeromexico",
  ASA: "Alaska Airlines",
  BAW: "British Airways",
  BTI: "airBaltic",
  CFG: "Condor",
  DAL: "Delta Air Lines",
  DLH: "Lufthansa",
  EIN: "Aer Lingus",
  EZY: "easyJet",
  IBE: "Iberia",
  JBU: "JetBlue",
  KLM: "KLM Royal Dutch Airlines",
  SAS: "Scandinavian Airlines",
  SWA: "Southwest Airlines",
  SWR: "Swiss International Air Lines",
  TAP: "TAP Air Portugal",
  TRA: "Transavia",
  UAL: "United Airlines",
  VLG: "Vueling",
  WJA: "WestJet",
  WZZ: "Wizz Air",
  RYR: "Ryanair",
};

const FAVORITES_STORAGE_KEY = "fenixA320PlannerFavorites";
const FAVORITES_STORAGE_VERSION_KEY = "fenixA320PlannerFavoritesVersion";
const FAVORITES_STORAGE_VERSION = "2";
const RECENT_ROUTES_STORAGE_KEY = "fenixA320PlannerRecentRoutes";
const RECENT_ROUTES_LIMIT = 18;

const SOCAL_AIRPORTS = new Set(["KSAN", "KLAX", "KSNA", "KONT", "KBUR", "KLGB", "KPSP", "MMTJ"]);

const MANUAL_ROUTES = [
  ...buildManualRoutes("NA", "ASA", [
    ["KSAN", "KLAX", "socal short"], ["KSAN", "KSFO", "socal west"], ["KSAN", "KOAK", "socal west"],
    ["KSAN", "KSJC", "socal west"], ["KSAN", "KSMF", "socal west"], ["KSAN", "KSEA", "socal pnw"],
    ["KSAN", "KPDX", "socal pnw"], ["KLAX", "KSEA", "west pnw"], ["KLAX", "KPDX", "west pnw"],
    ["KSFO", "KSEA", "west pnw"], ["KSFO", "KPDX", "west pnw"], ["KLAS", "KSEA", "southwest pnw"],
    ["KSEA", "KLAX", "pnw west"], ["KSEA", "KSFO", "pnw west"], ["KPDX", "KLAX", "pnw west"],
  ]),
  ...buildManualRoutes("NA", "SWA", [
    ["KSAN", "KLAS", "socal southwest"], ["KSAN", "KPHX", "socal southwest"], ["KSAN", "KABQ", "socal southwest"],
    ["KSAN", "KELP", "socal southwest"], ["KSAN", "KAUS", "socal texas"], ["KSAN", "KDAL", "socal texas"],
    ["KLAX", "KLAS", "west southwest"], ["KLAX", "KPHX", "west southwest"], ["KSNA", "KLAS", "socal southwest"],
    ["KSNA", "KPHX", "socal southwest"], ["KLGB", "KLAS", "socal southwest"], ["KPHX", "KSAN", "return-socal"],
    ["KLAS", "KSAN", "return-socal"], ["KABQ", "KSAN", "return-socal"], ["KELP", "KSAN", "return-socal"],
    ["KDAL", "KSAN", "return-socal"], ["KDAL", "KHOU", "texas"], ["KAUS", "KDEN", "texas mountain"],
    ["KHOU", "KMSY", "texas southeast"], ["KMDW", "KLGA", "midwest east"],
  ]),
  ...buildManualRoutes("NA", "AAL", [
    ["KSAN", "KDFW", "socal texas"], ["KLAX", "KDFW", "west texas"], ["KLAX", "KORD", "west midwest"],
    ["KDFW", "KJFK", "texas east"], ["KDFW", "KMIA", "texas florida"], ["KDFW", "MMUN", "texas mexico international"],
    ["KDFW", "MMMX", "texas mexico international"], ["KORD", "KBOS", "midwest east"], ["KORD", "KLGA", "midwest east"],
    ["KORD", "CYYZ", "midwest canada international"], ["KPHX", "KORD", "southwest midwest"], ["KPHX", "KCLT", "southwest east"],
    ["KCLT", "KBOS", "southeast east"], ["KCLT", "KMCO", "southeast florida"], ["KCLT", "KRDU", "southeast"],
  ]),
  ...buildManualRoutes("NA", "DAL", [
    ["KLAX", "KATL", "west southeast"], ["KLAX", "KBOS", "west east"], ["KLAX", "KMIA", "west florida"],
    ["KSEA", "KORD", "pnw midwest"], ["KSEA", "KDEN", "pnw mountain"], ["KDEN", "KATL", "mountain southeast"],
    ["KATL", "KJFK", "southeast east"], ["KATL", "KMCO", "southeast florida"], ["KATL", "MMUN", "southeast mexico international"],
    ["KMSP", "KDTW", "midwest"], ["KMSP", "KSEA", "midwest pnw"], ["KDTW", "KLGA", "midwest east"],
    ["KBOS", "KATL", "east southeast"], ["KMCO", "KATL", "florida southeast"],
  ]),
  ...buildManualRoutes("NA", "UAL", [
    ["KSAN", "KDEN", "socal mountain"], ["KSAN", "KSLC", "socal mountain"], ["KLAX", "KDEN", "west mountain"],
    ["KLAX", "KSLC", "west mountain"], ["KLAX", "KEWR", "west east"], ["KLAX", "KIAD", "west east"],
    ["KSFO", "KDEN", "west mountain"], ["KSFO", "KSLC", "west mountain"], ["KSFO", "KJFK", "west east"],
    ["KSFO", "KBOS", "west east"], ["KDEN", "KCLT", "mountain southeast"], ["KDEN", "CYYZ", "mountain canada international"],
    ["KDEN", "KORD", "mountain midwest"], ["KIAD", "KBOS", "east"], ["KEWR", "KMCO", "east florida"],
  ]),
  ...buildManualRoutes("NA", "JBU", [
    ["KLAX", "KJFK", "west east"], ["KJFK", "KLAX", "east west"], ["KBOS", "KFLL", "east florida"],
    ["KJFK", "KFLL", "east florida"], ["KLGA", "KMCO", "east florida"], ["KRDU", "KBOS", "southeast east"],
  ]),
  ...buildManualRoutes("NA", "ACA", [
    ["KSAN", "CYVR", "socal canada international"], ["KLAX", "CYVR", "west canada international"],
    ["KLAX", "CYYC", "west canada international"], ["KSFO", "CYVR", "west canada international"],
    ["KSEA", "CYVR", "pnw canada international"], ["KJFK", "CYUL", "east canada international"],
    ["CYYZ", "KORD", "canada midwest international"], ["CYUL", "KJFK", "canada east international"],
  ]),
  ...buildManualRoutes("NA", "AMX", [
    ["KLAX", "MMUN", "west mexico international"], ["KMIA", "MMUN", "florida mexico international"],
    ["KLAX", "MMMX", "west mexico international"], ["KLAX", "MMGL", "west mexico international"],
    ["KSFO", "MMPR", "west mexico international"], ["KLAX", "MMSD", "west mexico international"],
    ["KSAN", "MMSD", "socal mexico international"], ["MMMX", "KDFW", "mexico texas international"],
  ]),
  ...buildManualRoutes("EU", "BAW", [
    ["EGLL", "EHAM", "uk west-europe"], ["EGLL", "EDDF", "uk central-europe"], ["EGLL", "LFPG", "uk west-europe"],
    ["EGLL", "LSZH", "uk central-europe"], ["EGLL", "LEMD", "uk southern-europe"], ["EGLL", "LOWW", "uk central-europe"],
    ["ENGM", "EGLL", "northern-europe uk"], ["LSZH", "EGLL", "central-europe uk"], ["LOWW", "EGLL", "central-europe uk"],
  ]),
  ...buildManualRoutes("EU", "KLM", [
    ["EHAM", "LOWW", "west central-europe"], ["EHAM", "LEMD", "west southern-europe"], ["EHAM", "LIMC", "west southern-europe"],
    ["LOWW", "EHAM", "central west-europe"], ["LEMD", "EHAM", "southern west-europe"], ["EKCH", "EHAM", "northern west-europe"],
    ["EPWA", "EHAM", "eastern west-europe"], ["EIDW", "EHAM", "ireland west-europe"], ["EHAM", "LPPT", "west southern-europe"],
  ]),
  ...buildManualRoutes("EU", "DLH", [
    ["EDDF", "LIRF", "central southern-europe"], ["EDDF", "LEBL", "central southern-europe"], ["EDDM", "LGAV", "central southern-europe"],
    ["ESSA", "EDDF", "northern central-europe"], ["LHBP", "EDDF", "eastern central-europe"], ["EDDF", "EGCC", "central uk"],
    ["EDDM", "EIDW", "central ireland"], ["EDDH", "LSZH", "central-europe"], ["EDDL", "LEBL", "central southern-europe"],
  ]),
  ...buildManualRoutes("EU", "AFR", [
    ["LFPG", "LOWW", "west central-europe"], ["LFPG", "LIRF", "west southern-europe"], ["LFPG", "EKCH", "west northern-europe"],
    ["LFPO", "LEBL", "west southern-europe"], ["LFPG", "EPWA", "west eastern-europe"], ["LFPG", "EGKK", "west uk"],
  ]),
  ...buildManualRoutes("EU", "IBE", [
    ["LEMD", "EGLL", "southern uk"], ["LEMD", "EHAM", "southern west-europe"], ["LEMD", "LIRF", "southern-europe"],
    ["LEBL", "EGKK", "southern uk"], ["LEBL", "EDDF", "southern central-europe"], ["LEMD", "LPPT", "iberia"],
  ]),
  ...buildManualRoutes("EU", "VLG", [
    ["LEBL", "EGKK", "southern uk"], ["LEBL", "LFPG", "southern west-europe"], ["LEBL", "LIMC", "southern-europe"],
    ["LIRF", "LEBL", "southern-europe"], ["LIMC", "EHAM", "southern west-europe"], ["LIML", "LFPG", "southern west-europe"],
  ]),
  ...buildManualRoutes("EU", "SAS", [
    ["EKCH", "EHAM", "northern west-europe"], ["ESSA", "EDDF", "northern central-europe"], ["ENGM", "EGLL", "northern uk"],
    ["EFHK", "EDDF", "northern central-europe"], ["EKCH", "LSZH", "northern central-europe"], ["ESSA", "LFPG", "northern west-europe"],
  ]),
  ...buildManualRoutes("EU", "WZZ", [
    ["LROP", "LOWW", "eastern central-europe"], ["LYBE", "EDDF", "southeast central-europe"], ["LDZA", "EDDM", "southeast central-europe"],
    ["LKPR", "EGSS", "central uk"], ["LHBP", "EGKK", "eastern uk"], ["EPWA", "LIRF", "eastern southern-europe"],
  ]),
];

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
  airlines: {
    byId: new Map(),
    byIata: new Map(),
    byIcao: new Map(),
    byAnyCode: new Map(),
  },
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
      updateRegionOptionVisibility();
      persistPreferences();
    });
  });

  [
    "regions",
    "daylight-preference",
    "coverage-priority",
    "result-count",
    "home-airport",
    "prefer-socal",
    "more-variety",
    "avoid-recent",
    "include-na-international",
  ].forEach((id) => {
    document.getElementById(id).addEventListener("change", persistPreferences);
  });
  document.getElementById("regions").addEventListener("change", updateRegionOptionVisibility);
  document.getElementById("clear-history-button").addEventListener("click", clearRecentRouteHistory);
  document.getElementById("surprise-button").addEventListener("click", () => {
    document.getElementById("more-variety").checked = true;
    document.getElementById("avoid-recent").checked = true;
    document.getElementById("include-na-international").checked = true;
    persistPreferences();
    form.requestSubmit();
  });
  updateRegionOptionVisibility();
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
    setCheckedPreference("prefer-socal", prefs.preferSocal, true);
    setCheckedPreference("more-variety", prefs.moreVariety, false);
    setCheckedPreference("avoid-recent", prefs.avoidRecent, true);
    setCheckedPreference("include-na-international", prefs.includeNaInternational, true);
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
    preferSocal: document.getElementById("prefer-socal").checked,
    moreVariety: document.getElementById("more-variety").checked,
    avoidRecent: document.getElementById("avoid-recent").checked,
    includeNaInternational: document.getElementById("include-na-international").checked,
  };
  localStorage.setItem("fenixA320PlannerPrefs", JSON.stringify(prefs));
}

function setCheckedPreference(id, value, fallback) {
  document.getElementById(id).checked = typeof value === "boolean" ? value : fallback;
}

function updateRegionOptionVisibility() {
  const selected = getSelectedValues(document.getElementById("regions"));
  const naSelected = selected.includes("NA") || selected.includes("MIXED");
  document.querySelectorAll("[data-na-only]").forEach((node) => {
    node.hidden = !naSelected;
  });
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
  const publicRoutes = parseRoutes(routesText).filter((route) => {
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
  state.routes = mergeRoutePools(publicRoutes, MANUAL_ROUTES);
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
  const preferSocal = document.getElementById("prefer-socal").checked;
  const moreVariety = document.getElementById("more-variety").checked;
  const avoidRecent = document.getElementById("avoid-recent").checked;
  const includeNaInternational = document.getElementById("include-na-international").checked;

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
    preferSocal,
    moreVariety,
    avoidRecent,
    includeNaInternational,
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
  const recentRoutes = loadRecentRoutes(getRecentRegionKey(input));
  let candidates = buildRouteCandidates(input, viableRegions, recentRoutes, 40);
  if (candidates.length < input.resultCount * 3) {
    candidates = buildRouteCandidates(input, viableRegions, recentRoutes, 70);
  }

  const selected = selectDiverseRoutes(candidates, input);
  saveRecentRoutes(getRecentRegionKey(input), selected);
  return selected;
}

function buildRouteCandidates(input, viableRegions, recentRoutes, blockWindowMinutes) {
  const candidates = [];
  const recentKeys = new Set(recentRoutes.map((item) => item.key));

  for (const route of state.routes) {
    const from = state.airportMap.get(route.from);
    const to = state.airportMap.get(route.to);
    if (!from || !to) {
      continue;
    }

    if (!viableRegions.has(from.region) || !viableRegions.has(to.region)) {
      continue;
    }
    if (!input.includeNaInternational && from.region === "NA" && to.region === "NA" && from.country !== to.country) {
      continue;
    }

    const airline = resolveAirline(route);

    const distanceNm = greatCircleNm(from.lat, from.lon, to.lat, to.lon);
    const estimatedBlockMinutes = estimateBlockMinutes(distanceNm);
    const blockDelta = Math.abs(estimatedBlockMinutes - input.blockMinutes);
    if (blockDelta > blockWindowMinutes) {
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
    const traits = getRouteTraits(route, from, to);
    const routeKey = getRouteKey(route);
    const isRecent = recentKeys.has(routeKey);
    const realismBias = realismScore(input, route, airline.icao, traits);
    const coverageWeight = input.coveragePriority === "high" ? 1.15 : input.coveragePriority === "balanced" ? 1 : 0.75;
    const recentPenalty = input.avoidRecent && isRecent ? (input.moreVariety ? 50 : 32) : 0;
    const curatedBonus = route.source === "manual" ? 14 : 0;
    const randomness = (input.moreVariety ? 16 : 8) * Math.random();

    const score = (130 - blockDelta * 2.4) + (Math.min(coverage.score, 55) * coverageWeight) + daylightScore + realismBias + curatedBonus + randomness - recentPenalty;
    candidates.push({
      route,
      from,
      to,
      airline,
      routeKey,
      distanceNm,
      estimatedBlockMinutes,
      blockDelta,
      depLocal,
      arrLocal,
      coverage,
      traits,
      isRecent,
      score,
      arrEstimateUtc,
      flightNumber: suggestFlightNumber(airline, route.from, route.to),
      gateInfo: buildGateInfo(route.from, route.to, airline.icao),
      whyFit: "",
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function selectDiverseRoutes(candidates, input) {
  const selected = [];
  const depCounts = new Map();
  const arrCounts = new Map();
  const corridorCounts = new Map();
  const pool = candidates.slice(0, Math.max(80, input.resultCount * 18));
  const varietyWeight = input.moreVariety ? 24 : 14;

  while (selected.length < input.resultCount && pool.length) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    pool.forEach((candidate, index) => {
      const depCount = depCounts.get(candidate.route.from) ?? 0;
      const arrCount = arrCounts.get(candidate.route.to) ?? 0;
      const corridorCount = corridorCounts.get(candidate.traits.corridor) ?? 0;
      const diversityAdjustment =
        (depCount === 0 ? varietyWeight : -22 * depCount)
        + (arrCount === 0 ? varietyWeight : -22 * arrCount)
        + (corridorCount === 0 ? varietyWeight / 2 : -10 * corridorCount);
      const score = candidate.score + diversityAdjustment;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    const [picked] = pool.splice(bestIndex, 1);
    picked.whyFit = buildWhyFit(picked, input, selected);
    selected.push(picked);
    depCounts.set(picked.route.from, (depCounts.get(picked.route.from) ?? 0) + 1);
    arrCounts.set(picked.route.to, (arrCounts.get(picked.route.to) ?? 0) + 1);
    corridorCounts.set(picked.traits.corridor, (corridorCounts.get(picked.traits.corridor) ?? 0) + 1);
  }

  return selected;
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
    const airlineDisplayName = getAirlineDisplayName(candidate.airline);
    const fragment = template.content.cloneNode(true);
    fragment.querySelector(".eyebrow").textContent = `${candidate.airline.icao} • ${airlineDisplayName}`;
    fragment.querySelector(".route-title").textContent = `${candidate.route.from} → ${candidate.route.to}`;
    fragment.querySelector(".score-badge").textContent = candidate.coverage.label;

    const details = [
      ["Estimated block", formatMinutes(candidate.estimatedBlockMinutes)],
      ["Airline ICAO", candidate.airline.icao],
      ["Airline name", airlineDisplayName],
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
    fragment.querySelector(".simbrief-link").href = buildSimbriefDispatchUrl(candidate, input);

    const saveButton = fragment.querySelector(".save-route-button");
    const favoriteKey = `${candidate.route.from}-${candidate.route.to}-${candidate.airline.icao}`;
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

function realismScore(input, route, airlineCode, traits) {
  let score = 0;
  if (route.from === input.homeAirport || route.to === input.homeAirport) {
    score += input.preferSocal && route.from.startsWith("K") ? 14 : 18;
  }
  if (input.preferSocal && traits.isSocal && traits.region === "NA") {
    score += 12;
  }
  if (traits.isReturnToSocal && traits.region === "NA") {
    score += 8;
  }
  if (PREFERRED_A320_AIRLINES.has(airlineCode)) {
    score += 10;
  }
  return score;
}

function buildWhyFit(candidate, input, alreadySelected) {
  const { route, airline, estimatedBlockMinutes, coverage, blockDelta, daylightScore, traits } = candidate;
  const airlineDisplayName = getAirlineDisplayName(airline);
  const pieces = [
    `${airlineDisplayName} is a believable A320-family operator for this city pair.`,
    `The estimated block of ${formatMinutes(estimatedBlockMinutes)} is within ${blockDelta} minutes of your requested gate-to-gate window.`,
    coverage.description,
  ];

  if (daylightScore > 0) {
    pieces.push("The timing also leans toward a better daylight experience.");
  } else if (daylightScore < 0) {
    pieces.push("This one is workable, but the timing skews darker than your stated preference.");
  }

  const reasons = [];
  if (blockDelta <= 12) {
    reasons.push("Good block time match");
  }
  if (coverage.depPositions.codes.length) {
    reasons.push("Departure ATC online");
  }
  if (coverage.arrPositions.codes.length) {
    reasons.push("Arrival ATC online");
  }
  if ((coverage.chips[2]?.tone ?? "") !== "low") {
    reasons.push("Enroute/center ATC online");
  }
  if (traits.isSocal && traits.region === "NA") {
    reasons.push("SoCal-focused route");
  }
  if (traits.isReturnToSocal) {
    reasons.push("Return-to-SoCal route");
  }
  if (traits.isInternational) {
    reasons.push("International route");
  }
  if (!candidate.isRecent) {
    reasons.push("Not recently suggested");
  }
  if (!alreadySelected.some((picked) => picked.route.from === route.from || picked.route.to === route.to)) {
    reasons.push(traits.region === "EU" ? "Europe variety pick" : "North America variety pick");
  }

  pieces.push(`Selected because: ${reasons.slice(0, 5).join(", ")}.`);
  return pieces.join(" ");
}

function getRouteTraits(route, from, to) {
  const metadata = route.tags ?? [];
  const isSocal = SOCAL_AIRPORTS.has(route.from) || SOCAL_AIRPORTS.has(route.to);
  const isReturnToSocal = SOCAL_AIRPORTS.has(route.to) && !SOCAL_AIRPORTS.has(route.from);
  const isInternational = from.country !== to.country;
  const corridor = metadata.find((tag) => !["socal", "international", "return-socal"].includes(tag))
    ?? `${from.country}-${to.country}`;

  return {
    region: route.regionHint || from.region,
    isSocal,
    isReturnToSocal,
    isInternational,
    corridor,
  };
}

function getRouteKey(route) {
  return `${route.from}-${route.to}`;
}

function getRecentRegionKey(input) {
  const regions = input.regions.includes("MIXED") ? ["NA", "EU"] : input.regions;
  if (regions.length === 1) {
    return regions[0];
  }
  return "MIXED";
}

function loadRecentRouteStore() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_ROUTES_STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function loadRecentRoutes(regionKey) {
  const store = loadRecentRouteStore();
  return Array.isArray(store[regionKey]) ? store[regionKey] : [];
}

function saveRecentRoutes(regionKey, routes) {
  if (!routes.length) {
    return;
  }
  const store = loadRecentRouteStore();
  const current = Array.isArray(store[regionKey]) ? store[regionKey] : [];
  const incoming = routes.map((candidate) => ({
    key: candidate.routeKey,
    from: candidate.route.from,
    to: candidate.route.to,
    at: new Date().toISOString(),
  }));
  const seen = new Set();
  store[regionKey] = [...incoming, ...current]
    .filter((item) => {
      if (!item?.key || seen.has(item.key)) {
        return false;
      }
      seen.add(item.key);
      return true;
    })
    .slice(0, RECENT_ROUTES_LIMIT);
  localStorage.setItem(RECENT_ROUTES_STORAGE_KEY, JSON.stringify(store));
}

function clearRecentRouteHistory() {
  localStorage.removeItem(RECENT_ROUTES_STORAGE_KEY);
  resultMetaEl.textContent = "Recent route history cleared";
}

function buildSimbriefBlock(candidate, input) {
  const airlineDisplayName = getAirlineDisplayName(candidate.airline);
  return [
    `Airline ICAO: ${candidate.airline.icao}`,
    `Airline Name: ${airlineDisplayName}`,
    `Flight Number: ${candidate.flightNumber.replace(candidate.airline.icao, "")}`,
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

function buildSimbriefDispatchUrl(candidate, input) {
  const url = new URL("https://dispatch.simbrief.com/options/custom");
  const departureHour = String(input.depUtc.getUTCHours()).padStart(2, "0");
  const departureMinute = String(input.depUtc.getUTCMinutes()).padStart(2, "0");
  const flightNumberOnly = candidate.flightNumber.replace(candidate.airline.icao, "");

  url.searchParams.set("airline", candidate.airline.icao);
  url.searchParams.set("fltnum", flightNumberOnly);
  url.searchParams.set("type", "A320");
  url.searchParams.set("orig", candidate.route.from);
  url.searchParams.set("dest", candidate.route.to);
  url.searchParams.set("deph", departureHour);
  url.searchParams.set("depm", departureMinute);
  url.searchParams.set("steh", String(Math.floor(candidate.estimatedBlockMinutes / 60)));
  url.searchParams.set("stem", String(candidate.estimatedBlockMinutes % 60).padStart(2, "0"));
  url.searchParams.set("callsign", candidate.flightNumber);

  return url.toString();
}

function toggleFavorite(candidate, input) {
  const favorites = loadFavorites();
  const key = `${candidate.route.from}-${candidate.route.to}-${candidate.airline.icao}`;
  const airlineDisplayName = getAirlineDisplayName(candidate.airline);
  const existingIndex = favorites.findIndex((item) => item.key === key);

  if (existingIndex >= 0) {
    favorites.splice(existingIndex, 1);
  } else {
    favorites.unshift({
      key,
      route: `${candidate.route.from} → ${candidate.route.to}`,
      airlineCode: candidate.airline.icao,
      airlineName: airlineDisplayName,
      flightNumber: candidate.flightNumber,
      block: formatMinutes(candidate.estimatedBlockMinutes),
      gateInfo: candidate.gateInfo,
      savedAt: new Date().toISOString(),
      exportBlock: buildSimbriefBlock(candidate, input),
      simbriefUrl: buildSimbriefDispatchUrl(candidate, input),
    });
  }

  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites.slice(0, 12)));
  localStorage.setItem(FAVORITES_STORAGE_VERSION_KEY, FAVORITES_STORAGE_VERSION);
}

function loadFavorites() {
  const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.removeItem(FAVORITES_STORAGE_KEY);
      return [];
    }

    const sanitized = parsed.filter((favorite) => !isStaleFavorite(favorite)).slice(0, 12);
    const needsRewrite = sanitized.length !== parsed.length
      || localStorage.getItem(FAVORITES_STORAGE_VERSION_KEY) !== FAVORITES_STORAGE_VERSION;

    if (needsRewrite) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(sanitized));
      localStorage.setItem(FAVORITES_STORAGE_VERSION_KEY, FAVORITES_STORAGE_VERSION);
    }

    return sanitized;
  } catch {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
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
    const airlineDisplayName = lookupAirlineName(favorite.airlineCode) || favorite.airlineName || `Operator ${favorite.airlineCode}`;
    const card = document.createElement("article");
    card.className = "favorite-card";
    card.innerHTML = `
      <h3>${favorite.route}</h3>
      <p><strong>${favorite.airlineCode}</strong> • ${airlineDisplayName} • ${favorite.flightNumber}</p>
      <p><strong>Estimated block:</strong> ${favorite.block}</p>
      <p><strong>Terminal / gate:</strong> ${favorite.gateInfo}</p>
      <div class="card-actions">
        <a class="secondary simbrief-link favorite-simbrief-link" target="_blank" rel="noopener noreferrer">Open in SimBrief</a>
        <button type="button" class="secondary remove-favorite">Remove</button>
      </div>
    `;

    card.querySelector(".favorite-simbrief-link").href = favorite.simbriefUrl;

    card.querySelector(".remove-favorite").addEventListener("click", () => {
      const filtered = loadFavorites().filter((item) => item.key !== favorite.key);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(filtered));
      localStorage.setItem(FAVORITES_STORAGE_VERSION_KEY, FAVORITES_STORAGE_VERSION);
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

function suggestFlightNumber(airline, from, to) {
  const numericSeed = Array.from(`${from}${to}`)
    .map((char) => char.charCodeAt(0))
    .reduce((sum, code) => sum + code, 0);
  const number = 100 + (numericSeed % 8900);
  const operatorCode = isValidIcaoAirlineCode(airline.icao)
    ? airline.icao
    : isValidIataAirlineCode(airline.iata)
      ? airline.iata
      : "A32";
  return `${operatorCode}${number}`;
}

function parseAirports(text) {
  return parseCsvRows(text).map((row) => ({
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
  const byId = new Map();
  const byIata = new Map();
  const byIcao = new Map();
  const byAnyCode = new Map();

  parseCsvRows(text).forEach((row) => {
    const airline = {
      id: row[0],
      name: row[1],
      iata: row[3] && row[3] !== "\\N" ? row[3] : "",
      icao: row[4] && row[4] !== "\\N" ? row[4] : "",
    };

    if (airline.id && airline.id !== "\\N") {
      byId.set(airline.id, airline);
    }
    if (airline.iata) {
      byIata.set(airline.iata, airline);
      byAnyCode.set(airline.iata, airline);
    }
    if (airline.icao) {
      byIcao.set(airline.icao, airline);
      byAnyCode.set(airline.icao, airline);
    }
  });

  return { byId, byIata, byIcao, byAnyCode };
}

function parseRoutes(text) {
  return parseCsvRows(text).map((row) => ({
    airlineCode: row[0],
    airlineId: row[1],
    from: normalizeAirportCode(row[2]),
    to: normalizeAirportCode(row[4]),
    stops: Number(row[7] || 0),
    equipment: (row[8] || "").split(/\s+/).filter(Boolean),
  })).filter((route) => route.from && route.to && (route.airlineCode || route.airlineId));
}

function buildManualRoutes(regionHint, airlineCode, routes) {
  return routes.map(([from, to, tagText]) => ({
    airlineCode,
    airlineId: "",
    from,
    to,
    stops: 0,
    equipment: ["320"],
    source: "manual",
    regionHint,
    tags: String(tagText || "").split(/\s+/).filter(Boolean),
  }));
}

function mergeRoutePools(publicRoutes, manualRoutes) {
  const merged = [];
  const seen = new Set();

  [...manualRoutes, ...publicRoutes].forEach((route) => {
    if (!state.airportMap.has(route.from) || !state.airportMap.has(route.to)) {
      return;
    }
    const key = `${route.from}-${route.to}-${route.airlineCode || route.airlineId || "UNK"}`;
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    merged.push(route);
  });

  return merged;
}

function resolveAirline(route) {
  const byId = state.airlines.byId;
  const byAnyCode = state.airlines.byAnyCode;
  const found =
    (route.airlineId ? byId.get(route.airlineId) : null)
    || (route.airlineCode ? byAnyCode.get(route.airlineCode) : null);

  if (found) {
    const resolvedIcao = isValidIcaoAirlineCode(found.icao)
      ? found.icao
      : isValidIcaoAirlineCode(route.airlineCode)
        ? route.airlineCode
        : "";

    if (resolvedIcao) {
      const resolvedName = lookupAirlineName(resolvedIcao, found);
      return {
        ...found,
        routeCode: route.airlineCode || "",
        icao: resolvedIcao,
        iata: isValidIataAirlineCode(found.iata) ? found.iata : "",
        name: resolvedName || resolvedIcao,
      };
    }
  }

  const suggested = suggestFallbackAirline(route);
  if (suggested) {
    return {
      ...suggested,
      routeCode: route.airlineCode || suggested.routeCode || "",
    };
  }

  const fallbackCode = isValidIcaoAirlineCode(route.airlineCode) ? route.airlineCode : "UNK";
  return {
    id: route.airlineId || "",
    iata: "",
    icao: fallbackCode,
    routeCode: fallbackCode,
    name: lookupAirlineName(fallbackCode) || (fallbackCode === "UNK" ? "Suggested A320 operator" : `Operator ${fallbackCode}`),
  };
}

function suggestFallbackAirline(route) {
  const depCodes = Object.keys(TERMINAL_GATE_DATABASE[route.from] ?? {});
  const arrCodes = Object.keys(TERMINAL_GATE_DATABASE[route.to] ?? {});
  const sharedPreferred = depCodes.filter((code) => arrCodes.includes(code) && PREFERRED_A320_AIRLINES.has(code));
  const localPreferred = [...new Set([...depCodes, ...arrCodes])].filter((code) => PREFERRED_A320_AIRLINES.has(code));
  const selectedCode = sharedPreferred[0] || localPreferred[0] || "";

  if (!selectedCode) {
    return null;
  }

  const knownAirline = state.airlines.byIcao.get(selectedCode) || state.airlines.byIata.get(selectedCode);
  return {
    id: knownAirline?.id || "",
    iata: isValidIataAirlineCode(knownAirline?.iata || "") ? knownAirline.iata : "",
    icao: selectedCode,
    routeCode: selectedCode,
    name: lookupAirlineName(selectedCode, knownAirline) || `Suggested operator ${selectedCode}`,
  };
}

function lookupAirlineName(code, fallbackAirline = null) {
  const normalizedCode = String(code || "").trim().toUpperCase();
  if (!normalizedCode) {
    return "";
  }

  const directMatch = state.airlines.byIcao.get(normalizedCode)
    || state.airlines.byAnyCode.get(normalizedCode)
    || fallbackAirline;

  return directMatch?.name || MANUAL_AIRLINE_NAMES[normalizedCode] || "";
}

function getAirlineDisplayName(airline) {
  if (!airline) {
    return "Operator unavailable";
  }

  return lookupAirlineName(airline.icao, airline)
    || lookupAirlineName(airline.routeCode, airline)
    || airline.name
    || `Operator ${airline.icao || airline.routeCode || "UNK"}`;
}

function isValidIcaoAirlineCode(code) {
  return /^[A-Z]{3}$/.test((code || "").toUpperCase());
}

function isValidIataAirlineCode(code) {
  return /^[A-Z0-9]{2}$/.test((code || "").toUpperCase()) && !/^\d+$/.test((code || "").toUpperCase());
}

function isStaleFavorite(favorite) {
  if (!favorite || typeof favorite !== "object") {
    return true;
  }

  const airlineCode = String(favorite.airlineCode || "").trim().toUpperCase();
  const airlineName = String(favorite.airlineName || "").trim();
  const flightNumber = String(favorite.flightNumber || "").trim().toUpperCase();

  if (!favorite.key || !favorite.route) {
    return true;
  }

  if (!airlineCode || /^\d+$/.test(airlineCode)) {
    return true;
  }

  if (airlineName && airlineName === airlineCode) {
    return true;
  }

  if (/suggested a320 operator unavailable/i.test(airlineName)) {
    return true;
  }

  if (/^\d+$/.test(airlineCode) && flightNumber.startsWith(airlineCode)) {
    return true;
  }

  return false;
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

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
      row.push(current.trim());
      current = "";
      continue;
    }

    if (char === "\n" && !inQuotes) {
      row.push(current.trim());
      if (row.some((value) => value !== "")) {
        rows.push(row);
      }
      row = [];
      current = "";
      continue;
    }

    if (char === "\r" && !inQuotes) {
      continue;
    }

    current += char;
  }

  if (current.length || row.length) {
    row.push(current.trim());
    if (row.some((value) => value !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

function normalizeAirportCode(code) {
  if (!code || code === "\\N") {
    return null;
  }
  return state.airportCodeMap.get(code) ?? null;
}

function inferRegion(country, tz) {
  if (tz.startsWith("Europe/") || ["Ireland", "United Kingdom", "Spain", "France", "Germany", "Netherlands", "Portugal", "Denmark", "Sweden", "Norway", "Italy", "Belgium", "Switzerland", "Austria", "Poland", "Hungary", "Romania", "Serbia", "Croatia", "Czech Republic", "Finland", "Greece"].includes(country)) {
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

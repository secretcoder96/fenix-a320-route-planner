// TODO: If a local copy of the reference PDF is added later, refine wording and phase notes against it without copying long passages into the UI.
export const PROCEDURES = [
  {
    id: "safety-exterior",
    phase: "Safety / Exterior",
    title: "Safety and Exterior Review",
    category: "Ground",
    nextPhase: "Preliminary Cockpit Preparation",
    flow: [
      "Set external power or battery power as needed for a stable cockpit setup.",
      "Review aircraft condition, fueling, payload, and major dispatch assumptions for the sim session.",
      "Walk the exterior in a simulator-friendly way and note obvious configuration issues only.",
      "Confirm chocks, cones, doors, and service state make sense for the planned departure."
    ],
    items: [
      { challenge: "AIRCRAFT STATUS", expected: ["CHECKED"], accepted: ["CHECK"], hint: "Confirm the aircraft is suitable for dispatch in the sim." },
      { challenge: "FUEL AND PAYLOAD", expected: ["CHECKED"], accepted: ["SET", "CHECK"], hint: "Verify basic fueling and loading assumptions." },
      { challenge: "EXTERIOR", expected: ["CHECKED"], accepted: ["COMPLETE"], hint: "Use a short virtual walkaround standard." }
    ],
    notes: [
      "Real-world paperwork, maintenance records, and cabin administration are intentionally reduced for simulator use.",
      "PDF-specific refinement can be expanded here later if you add a local copy of the source document."
    ]
  },
  {
    id: "preliminary-cockpit-preparation",
    phase: "Preliminary Cockpit Preparation",
    title: "Preliminary Cockpit Preparation",
    category: "Ground",
    nextPhase: "Cockpit Preparation",
    flow: [
      "Establish electrical power and basic cockpit lighting.",
      "Set parking brake, check gear lever down, and stabilize the overhead panel.",
      "Initialize radios, baro reference concept, and basic EFIS display setup.",
      "Prepare the FMGS for route entry, weights, and performance work."
    ],
    items: [
      { challenge: "PARKING BRAKE", expected: ["SET"], accepted: ["ON"], hint: "Brake set before cockpit setup continues." },
      { challenge: "ELECTRICAL POWER", expected: ["ESTABLISHED"], accepted: ["ON", "SET"], hint: "Confirm the cockpit has stable electrical power." },
      { challenge: "COCKPIT SAFETY", expected: ["CHECKED"], accepted: ["CHECK"], hint: "Confirm gear, brake, and panel condition are sane." }
    ],
    notes: [
      "This phase is a setup gate before detailed FMS and performance preparation.",
      "Use it to slow down and prevent starting the main cockpit flow half-configured."
    ]
  },
  {
    id: "cockpit-preparation",
    phase: "Cockpit Preparation",
    title: "Cockpit Preparation Checklist",
    category: "Departure",
    nextPhase: "Before Start",
    flow: [
      "Complete MCDU INIT, F-PLN, PERF, and RAD NAV setup as needed.",
      "Set FCU initial targets, altitude, and departure constraints.",
      "Review takeoff data, trim, flaps plan, anti-ice need, and runway strategy.",
      "Confirm departure charts, taxi expectations, and navigation displays are ready."
    ],
    items: [
      { challenge: "FMGS SETUP", expected: ["COMPLETE"], accepted: ["COMPLETED", "SET"], hint: "Route, performance, and takeoff data should be ready." },
      { challenge: "TAKEOFF DATA", expected: ["SET"], accepted: ["INSERTED", "CHECKED"], hint: "Flex or TOGA plan, speeds, and config should be confirmed." },
      { challenge: "FLIGHT INSTRUMENTS", expected: ["CHECKED"], accepted: ["SET", "CHECK"], hint: "Cross-check PFD, ND, FCU, and baro references." }
    ],
    notes: [
      "Simulator phrasing is kept compact so the checklist stays usable while flying online.",
      "Cabin and company-specific items from real-world SOPs are intentionally trimmed."
    ]
  },
  {
    id: "before-start",
    phase: "Before Start",
    title: "Before Start Checklist",
    category: "Departure",
    nextPhase: "Engine Start",
    flow: [
      "Complete cockpit preparation and departure briefing.",
      "Confirm pushback expectations, tug direction, and online clearance status.",
      "Verify doors closed, beacon on, and the aircraft ready for engine start.",
      "Arm the flow mentally for a clean start sequence."
    ],
    items: [
      { challenge: "COCKPIT PREPARATION", expected: ["COMPLETE"], accepted: ["COMPLETED"], hint: "Confirm the cockpit flow is complete." },
      { challenge: "DOORS", expected: ["CLOSED"], accepted: ["CLOSED AND ARMED"], hint: "Confirm doors are closed before push and start." },
      { challenge: "BEACON", expected: ["ON"], accepted: [], hint: "Beacon should be on before engine start." }
    ],
    notes: [
      "This phase mirrors the classic PM challenge-response rhythm for a single-pilot sim setup."
    ]
  },
  {
    id: "engine-start",
    phase: "Engine Start",
    title: "Engine Start Checklist",
    category: "Departure",
    nextPhase: "After Start",
    flow: [
      "Configure packs, APU bleed, and engine mode selector per your chosen start technique.",
      "Start engines in the planned order and monitor N2, fuel flow, EGT, and stable idle.",
      "Confirm pushback clearance, ground path, and tug disconnect are complete before taxi."
    ],
    items: [
      { challenge: "ENGINE MODE SELECTOR", expected: ["IGN START"], accepted: ["IGN/START", "START"], hint: "Selector should be in IGN/START during automatic start." },
      { challenge: "ENGINES", expected: ["STABLE"], accepted: ["STARTED", "NORMAL"], hint: "Confirm both engines are stabilized after start." },
      { challenge: "ECAM", expected: ["CHECKED"], accepted: ["CLEAR"], hint: "Review the ECAM and confirm no unexpected alerts remain." }
    ],
    variants: [
      { id: "automatic", title: "Automatic Start", notes: ["Default sim-friendly option for standard Fenix operation."] },
      { id: "manual", title: "Manual Start", notes: ["Use when practicing abnormal or trainer-style start sequencing."] }
    ],
    notes: [
      "Use engine-start variants as training options rather than separate main phases."
    ]
  },
  {
    id: "after-start",
    phase: "After Start",
    title: "After Start Checklist",
    category: "Departure",
    nextPhase: "Taxi",
    flow: [
      "Set engine mode selector to normal and complete after-start flows.",
      "Configure flaps, trim, spoilers, rudder trim, and flight controls.",
      "Check brake temperatures, anti-ice status, and taxi clearance readiness."
    ],
    items: [
      { challenge: "ANTI ICE", expected: ["AS REQUIRED"], accepted: ["OFF", "ON"], hint: "Respond with the actual required anti-ice state." },
      { challenge: "ECAM STATUS", expected: ["CHECKED"], accepted: ["CHECK"], hint: "Confirm the after-start ECAM review is complete." },
      { challenge: "FLAPS", expected: ["SET"], accepted: ["CONFIGURED"], hint: "Flaps should match the planned takeoff configuration." },
      { challenge: "PITCH TRIM", expected: ["SET"], accepted: ["CONFIGURED"], hint: "Use the takeoff trim setting from performance data." }
    ],
    variants: [
      { id: "all-engine-taxi", title: "All Engine Taxi", notes: ["Default for most sim flights."] },
      { id: "single-engine-taxi", title: "Single Engine Taxi", notes: ["Use when practicing reduced-taxi procedures."] }
    ],
    notes: [
      "The anti-ice challenge is intentionally flexible because the correct answer depends on conditions."
    ]
  },
  {
    id: "taxi",
    phase: "Taxi",
    title: "Taxi Checklist",
    category: "Departure",
    nextPhase: "Before Takeoff",
    flow: [
      "Obtain taxi clearance or self-brief the taxi route.",
      "Perform flight control checks during taxi when workload permits.",
      "Monitor brake feel, steering response, and runway crossing discipline."
    ],
    items: [
      { challenge: "FLIGHT CONTROLS", expected: ["CHECKED"], accepted: ["CHECK"], hint: "Confirm the full control check is complete." },
      { challenge: "BRAKES", expected: ["CHECKED"], accepted: ["CHECK"], hint: "Verify brake response during initial taxi." },
      { challenge: "TAXI BRIEF", expected: ["COMPLETE"], accepted: ["COMPLETED"], hint: "Confirm you are comfortable with the taxi route and hotspots." }
    ],
    notes: [
      "This is a simulator-friendly consolidation of taxi awareness rather than a heavy procedural phase."
    ]
  },
  {
    id: "before-takeoff",
    phase: "Before Takeoff",
    title: "Before Takeoff Checklist",
    category: "Departure",
    nextPhase: "Takeoff",
    flow: [
      "Review runway, SID, initial altitude, first heading, and any special threats.",
      "Verify transponder, exterior lights, weather radar concept, and takeoff config.",
      "Pause long enough to confirm the aircraft is actually ready to roll."
    ],
    items: [
      { challenge: "CABIN", expected: ["READY"], accepted: ["ADVISED"], hint: "In sim use this as a readiness gate rather than a cabin-crew call." },
      { challenge: "FLIGHT CONTROLS", expected: ["CHECKED"], accepted: ["CHECK"], hint: "Final confirmation before lineup." },
      { challenge: "TAKEOFF CONFIG", expected: ["TESTED"], accepted: ["CHECKED"], hint: "Takeoff config check should be complete." },
      { challenge: "EXTERIOR LIGHTS", expected: ["SET"], accepted: ["ON"], hint: "Use your normal runway-entry light configuration." }
    ],
    notes: [
      "Cabin-related responses are repurposed as a single-pilot readiness cue."
    ]
  },
  {
    id: "takeoff",
    phase: "Takeoff",
    title: "Takeoff Callouts",
    category: "Departure",
    nextPhase: "After Takeoff",
    flow: [
      "Line up, stabilize, and apply the planned takeoff thrust technique.",
      "Monitor thrust set, airspeed alive, and crosswind control.",
      "Use the app for PM-style confirmation and discipline, not aircraft control."
    ],
    items: [
      { challenge: "MAN FLEX OR TOGA", expected: ["SET"], accepted: ["THRUST SET"], hint: "Confirm takeoff thrust is set." },
      { challenge: "AIRSPEED", expected: ["ALIVE"], accepted: [], hint: "Airspeed indications should be increasing normally." },
      { challenge: "CLIMB", expected: ["POSITIVE"], accepted: ["POSITIVE CLIMB"], hint: "Use this as the landing gear retraction gate." }
    ],
    notes: [
      "High-speed callouts such as V1 and Rotate are better handled as awareness notes than forced responses in a single-pilot sim."
    ]
  },
  {
    id: "after-takeoff",
    phase: "After Takeoff",
    title: "After Takeoff Checklist",
    category: "Climb",
    nextPhase: "Climb",
    flow: [
      "Retract gear and flaps on schedule and manage climb thrust.",
      "Engage automation as desired and confirm navigation is tracking correctly.",
      "Transition to the climb profile without rushing the cleanup."
    ],
    items: [
      { challenge: "LANDING GEAR", expected: ["UP"], accepted: [], hint: "Confirm the gear is retracted." },
      { challenge: "FLAPS", expected: ["UP"], accepted: ["RETRACTED"], hint: "Flaps and slats should be retracted when appropriate." },
      { challenge: "PACKS", expected: ["ON"], accepted: [], hint: "Normal packs-on state after takeoff." }
    ],
    notes: [
      "If you use nonstandard packs-off takeoffs in training, adjust this item later via variants."
    ]
  },
  {
    id: "climb",
    phase: "Climb",
    title: "Climb Review",
    category: "Climb",
    nextPhase: "Cruise",
    flow: [
      "Monitor managed climb, constraints, and weather or anti-ice requirements.",
      "Cross-check pressurization, engine trends, and route tracking.",
      "Prepare the aircraft for a calm transition into cruise."
    ],
    items: [
      { challenge: "CLIMB MODE", expected: ["CHECKED"], accepted: ["NORMAL"], hint: "Confirm the aircraft is climbing as intended." },
      { challenge: "ANTI ICE", expected: ["AS REQUIRED"], accepted: ["OFF", "ON"], hint: "Respond with the actual condition-driven state." },
      { challenge: "PRESSURIZATION", expected: ["CHECKED"], accepted: ["NORMAL"], hint: "Quick scan only; do not overload the climb." }
    ],
    notes: [
      "This is intentionally short because climb is workload-sensitive in the sim."
    ]
  },
  {
    id: "cruise",
    phase: "Cruise",
    title: "Cruise Review",
    category: "Cruise",
    nextPhase: "Descent Preparation",
    flow: [
      "Confirm cruise navigation, fuel state, and weather picture.",
      "Review destination NOTAMs, runway plan, and top-of-descent strategy.",
      "Stabilize the cockpit for the next high-workload phase."
    ],
    items: [
      { challenge: "CRUISE SYSTEMS", expected: ["CHECKED"], accepted: ["NORMAL"], hint: "Confirm a normal stable cruise state." },
      { challenge: "FUEL", expected: ["CHECKED"], accepted: ["SUFFICIENT"], hint: "Quick reasonableness check for arrival planning." },
      { challenge: "DESTINATION DATA", expected: ["REVIEWED"], accepted: ["CHECKED"], hint: "Weather and arrival concept should be reviewed." }
    ],
    notes: [
      "Top of climb and cruise are merged into a practical in-sim cruise review phase."
    ]
  },
  {
    id: "descent-preparation",
    phase: "Descent Preparation",
    title: "Descent Preparation Checklist",
    category: "Arrival",
    nextPhase: "Approach",
    flow: [
      "Review ATIS, STAR, expected approach, minima, missed approach, and landing data.",
      "Set arrival performance, approach speeds, and braking strategy.",
      "Brief the vertical profile and energy management plan."
    ],
    items: [
      { challenge: "ARRIVAL", expected: ["BRIEFED"], accepted: ["REVIEWED"], hint: "STAR, runway, and missed approach should be covered." },
      { challenge: "MINIMA", expected: ["SET"], accepted: ["CHECKED"], hint: "Confirm minima are entered or mentally set." },
      { challenge: "AUTOBRAKE", expected: ["SET"], accepted: ["SELECTED"], hint: "Choose the planned landing autobrake setting." }
    ],
    notes: [
      "This phase absorbs descent briefing and arrival discussion into one usable block."
    ]
  },
  {
    id: "approach",
    phase: "Approach",
    title: "Approach Checklist",
    category: "Arrival",
    nextPhase: "Landing",
    flow: [
      "Confirm active approach type, nav source logic, and vertical guidance plan.",
      "Manage speed, configuration timing, and stabilization targets.",
      "Use subtypes below when practicing an ILS, RNAV, or visual arrival."
    ],
    items: [
      { challenge: "BARO REFERENCE", expected: ["SET"], accepted: ["CHECKED"], hint: "Set QNH/QFE according to your procedure." },
      { challenge: "SEAT BELTS", expected: ["ON"], accepted: [], hint: "Use as an arrival readiness item in the sim." },
      { challenge: "APPROACH MODE", expected: ["ARMED"], accepted: ["SET"], hint: "If applicable, confirm the planned guidance mode." }
    ],
    notes: [
      "The generic approach phase stays light so subtype phases can add the right focus."
    ]
  },
  {
    id: "ils-approach",
    phase: "ILS Approach",
    title: "ILS Approach Review",
    category: "Arrival",
    nextPhase: "Landing",
    flow: [
      "Confirm localizer and glideslope tuning, approach mode, and minima.",
      "Verify missed approach altitude and runway environment expectations.",
      "Stabilize early and avoid last-second FCU changes."
    ],
    items: [
      { challenge: "ILS", expected: ["CHECKED"], accepted: ["TUNED", "IDENTIFIED"], hint: "Localizer and glideslope source should be confirmed." },
      { challenge: "MINIMA", expected: ["SET"], accepted: ["CHECKED"], hint: "Cross-check minima before intercept." },
      { challenge: "MISSED APPROACH", expected: ["BRIEFED"], accepted: ["REVIEWED"], hint: "Have the go-around plan in mind before final." }
    ],
    notes: [
      "Use this when you want extra discipline for a precision approach."
    ]
  },
  {
    id: "rnav-approach",
    phase: "RNAV Approach",
    title: "RNAV Approach Review",
    category: "Arrival",
    nextPhase: "Landing",
    flow: [
      "Confirm the correct FMS approach and lateral/vertical path logic.",
      "Review minima type, waypoint constraints, and go-around routing.",
      "Verify that automation choices match the published procedure."
    ],
    items: [
      { challenge: "FMS APPROACH", expected: ["CHECKED"], accepted: ["VERIFIED"], hint: "Confirm the loaded RNAV approach." },
      { challenge: "CONSTRAINTS", expected: ["CHECKED"], accepted: ["REVIEWED"], hint: "Altitude and speed constraints should make sense." },
      { challenge: "MINIMA", expected: ["SET"], accepted: ["CHECKED"], hint: "Use the correct minima for the RNAV type flown." }
    ],
    notes: [
      "A useful hook for future vertical-path and managed-descent assistance."
    ]
  },
  {
    id: "visual-approach",
    phase: "Visual Approach",
    title: "Visual Approach Review",
    category: "Arrival",
    nextPhase: "Landing",
    flow: [
      "Confirm runway environment, lateral plan, and a stable visual path.",
      "Review terrain, traffic, circling risks, and missed approach escape.",
      "Keep the aircraft energy-managed and fully stabilized."
    ],
    items: [
      { challenge: "RUNWAY", expected: ["IN SIGHT"], accepted: ["VISUAL"], hint: "Confirm a stable visual reference to the runway." },
      { challenge: "MISSED APPROACH", expected: ["BRIEFED"], accepted: ["REVIEWED"], hint: "Even on a visual, keep the escape plan ready." },
      { challenge: "STABILIZED", expected: ["CHECKED"], accepted: ["STABLE"], hint: "Confirm you are on a stable visual approach." }
    ],
    notes: [
      "Use this instead of the ILS or RNAV subtype when hand-flying a visual arrival."
    ]
  },
  {
    id: "go-around",
    phase: "Go Around",
    title: "Go Around Review",
    category: "Arrival",
    nextPhase: "Approach",
    flow: [
      "Apply TOGA, pitch appropriately, and follow the missed approach path.",
      "Clean up on schedule, confirm positive climb, and re-brief the next plan.",
      "Use the PM for structure, not automation management."
    ],
    items: [
      { challenge: "GO AROUND THRUST", expected: ["SET"], accepted: ["TOGA"], hint: "Confirm go-around thrust is applied." },
      { challenge: "CLIMB", expected: ["POSITIVE"], accepted: ["POSITIVE CLIMB"], hint: "Use this as the gear-up gate." },
      { challenge: "MISSED APPROACH", expected: ["NAVIGATING"], accepted: ["TRACKING"], hint: "Confirm the aircraft is following the missed approach." }
    ],
    notes: [
      "Useful as a quick recovery checklist after an unstable or discontinued approach."
    ]
  },
  {
    id: "landing",
    phase: "Landing",
    title: "Landing Review",
    category: "Arrival",
    nextPhase: "After Landing",
    flow: [
      "Confirm landing clearance or self-brief the touchdown and rollout plan.",
      "Verify landing configuration, autobrake logic, and rollout expectations.",
      "Keep the PM role focused on final confirmation and discipline."
    ],
    items: [
      { challenge: "LANDING GEAR", expected: ["DOWN"], accepted: ["DOWN THREE GREEN"], hint: "Gear should be down for landing." },
      { challenge: "FLAPS", expected: ["FULL"], accepted: ["CONF FULL"], hint: "Use the planned landing configuration." },
      { challenge: "CABIN", expected: ["READY"], accepted: ["SECURED"], hint: "Single-pilot readiness cue for landing." }
    ],
    notes: [
      "This phase intentionally avoids excessive short-final callout clutter."
    ]
  },
  {
    id: "after-landing",
    phase: "After Landing",
    title: "After Landing Checklist",
    category: "Arrival",
    nextPhase: "Taxi In",
    flow: [
      "Clear the runway fully before changing configuration.",
      "Retract flaps, disarm spoilers, and transition exterior lights for taxi.",
      "Bring the aircraft into a normal taxi-in state."
    ],
    items: [
      { challenge: "GROUND SPOILERS", expected: ["DISARMED"], accepted: ["DOWN"], hint: "Spoilers should be disarmed after landing." },
      { challenge: "FLAPS", expected: ["UP"], accepted: ["RETRACTED"], hint: "Retract flaps after runway vacation." },
      { challenge: "APU", expected: ["AS REQUIRED"], accepted: ["STARTED", "ON"], hint: "Respond with the actual turnaround plan." }
    ],
    notes: [
      "This stays short to avoid overloading rollout and runway exit."
    ]
  },
  {
    id: "taxi-in",
    phase: "Taxi In",
    title: "Taxi In Review",
    category: "Arrival",
    nextPhase: "Parking",
    flow: [
      "Brief the stand or gate, shutdown plan, and ground routing.",
      "Monitor brake temperatures, traffic, and marshaller or stand alignment.",
      "Prepare for a clean parking flow without rushing the shutdown."
    ],
    items: [
      { challenge: "TAXI IN", expected: ["CHECKED"], accepted: ["NORMAL"], hint: "Confirm a safe taxi-in state." },
      { challenge: "BRAKE TEMPERATURE", expected: ["CHECKED"], accepted: ["MONITORED"], hint: "Quick scan only." },
      { challenge: "PARKING STAND", expected: ["IDENTIFIED"], accepted: ["IN SIGHT"], hint: "Confirm the stand or parking target." }
    ],
    notes: [
      "A practical stand-arrival discipline phase for single-pilot use."
    ]
  },
  {
    id: "parking",
    phase: "Parking",
    title: "Parking Checklist",
    category: "Shutdown",
    nextPhase: "Securing the Aircraft",
    flow: [
      "Set parking brake, establish APU or external power, and complete engine shutdown.",
      "Open the door to a calm turnaround or shutdown sequence.",
      "Use this phase to transition from flight deck mode to post-flight mode."
    ],
    items: [
      { challenge: "PARKING BRAKE", expected: ["SET"], accepted: ["ON"], hint: "Set the brake at the stand." },
      { challenge: "ENGINES", expected: ["OFF"], accepted: ["SHUTDOWN"], hint: "Confirm both engines are shut down." },
      { challenge: "SEAT BELTS", expected: ["OFF"], accepted: [], hint: "Switch seat belt signs off at the stand." }
    ],
    notes: [
      "Ground-service details can be layered in later if you want deeper turnaround simulation."
    ]
  },
  {
    id: "securing-aircraft",
    phase: "Securing the Aircraft",
    title: "Securing the Aircraft",
    category: "Shutdown",
    nextPhase: "Safety / Exterior",
    flow: [
      "Complete final electrical, fuel pump, and lighting shutdown as appropriate.",
      "Review post-flight state, save the aircraft if desired, and secure the cockpit.",
      "Leave the jet in a consistent simulator-ready parked condition."
    ],
    items: [
      { challenge: "FUEL PUMPS", expected: ["OFF"], accepted: [], hint: "Use your shutdown standard for the parked aircraft." },
      { challenge: "BATTERIES", expected: ["AS REQUIRED"], accepted: ["OFF", "ON"], hint: "Respond with the intended final power state." },
      { challenge: "AIRCRAFT", expected: ["SECURED"], accepted: ["SHUTDOWN COMPLETE"], hint: "Final confirmation that the aircraft is secured." }
    ],
    notes: [
      "This is the last phase and loops back to exterior for the next session."
    ]
  }
];

export const PROCEDURE_MAP = new Map(PROCEDURES.map((procedure) => [procedure.id, procedure]));

export const MODES = [
  {
    id: "normal",
    label: "Normal Mode",
    description: "Accepts common checklist phrasing and practical sim equivalents."
  },
  {
    id: "training",
    label: "Training Mode",
    description: "Shows hints and keeps the PM a little more coach-like."
  },
  {
    id: "strict",
    label: "Strict Mode",
    description: "Requires closer phrasing to the expected checklist response."
  }
];

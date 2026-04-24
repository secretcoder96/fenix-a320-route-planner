export const SOP_PHASES = [
  {
    id: "safety-exterior",
    phase: "Safety / Exterior",
    category: "Ground",
    nextPhase: "Preliminary Cockpit Preparation",
    flows: {
      pf: [
        "Review dispatch concept, fuel, payload, MEL-equivalent sim assumptions, and expected weather threats.",
        "Carry out a disciplined exterior inspection focused on configuration, obvious damage, doors, pins, covers, gear, and engine intakes."
      ],
      pm: [
        "Confirm stand condition, service status, fueling assumptions, and simulator setup before cockpit entry.",
        "Back up the PF on obvious external discrepancies and note any item that would affect the departure plan."
      ]
    },
    checklist: [
      { title: "Aircraft documents / dispatch concept", response: "Reviewed", owner: "PF/PM", note: "Simulator adaptation of real-world dispatch paperwork." },
      { title: "Fuel and load state", response: "Checked", owner: "PF" },
      { title: "Exterior inspection", response: "Complete", owner: "PF" }
    ],
    notes: [
      "Real-world company paperwork and maintenance control items are reduced for simulator use.",
      "This checklist is adapted from A320 normal-procedure structure and rewritten for flight simulation."
    ]
  },
  {
    id: "preliminary-cockpit-preparation",
    phase: "Preliminary Cockpit Preparation",
    category: "Ground",
    nextPhase: "Cockpit Preparation",
    flows: {
      pf: [
        "Establish electrical power, set parking brake, confirm gear lever down, and stabilize the overhead.",
        "Set cockpit lighting, oxygen, and panel basics for a clean setup state."
      ],
      pm: [
        "Cross-check electrical source, parking brake, and aircraft safety condition.",
        "Prepare radios, charts, and initial display setup for the main cockpit flow."
      ]
    },
    checklist: [
      { title: "Parking brake", response: "Set", owner: "PF" },
      { title: "Electrical power", response: "Established", owner: "PM" },
      { title: "Aircraft safety state", response: "Checked", owner: "PF/PM" }
    ],
    notes: [
      "This phase is a gate before detailed FMGS and performance setup begins."
    ]
  },
  {
    id: "cockpit-preparation",
    phase: "Cockpit Preparation",
    category: "Departure",
    nextPhase: "Departure Discussion",
    flows: {
      pf: [
        "Complete FMGS setup including INIT, F-PLN, PERF, RAD NAV as needed, and departure runway data.",
        "Set FCU altitude and initial constraints, review weather, runway, SID, anti-ice, and performance assumptions."
      ],
      pm: [
        "Cross-check FMGS entries, route continuity, navigation references, and takeoff data logic.",
        "Verify flight instruments, baro references, and chart readiness."
      ]
    },
    checklist: [
      { title: "FMGS setup", response: "Complete", owner: "PF" },
      { title: "Takeoff data", response: "Set", owner: "PF/PM" },
      { title: "Flight instruments", response: "Checked", owner: "PM" },
      { title: "ECAM memo / status", response: "Checked", owner: "PM" }
    ],
    notes: [
      "In a simulator, company or cabin administration items should not clutter the active flow."
    ]
  },
  {
    id: "departure-discussion",
    phase: "Departure Discussion",
    category: "Departure",
    nextPhase: "Emergency Briefing",
    flows: {
      pf: [
        "Brief runway, SID, initial altitude, first heading or nav path, noise or terrain concerns, and expected automation use.",
        "Cover rejected takeoff and post-liftoff plan appropriate to simulator training."
      ],
      pm: [
        "Challenge unclear terrain, weather, or route assumptions and verify both pilots share the same departure plan.",
        "Confirm special threats, runway changes, and likely taxi hotspots."
      ]
    },
    checklist: [
      { title: "Departure briefing", response: "Complete", owner: "PF" },
      { title: "Threats reviewed", response: "Checked", owner: "PM" }
    ],
    notes: [
      "This phase is intentionally briefing-heavy and checkbox-light."
    ]
  },
  {
    id: "emergency-briefing",
    phase: "Emergency Briefing",
    category: "Departure",
    nextPhase: "Before Start",
    flows: {
      pf: [
        "State low-speed and high-speed reject mindset and the post-liftoff engine failure concept for the departure.",
        "Confirm terrain, weather, and return or diversion logic."
      ],
      pm: [
        "Cross-check the reject and after-liftoff plan against runway length, weather, and aircraft state."
      ]
    },
    checklist: [
      { title: "Rejected takeoff plan", response: "Reviewed", owner: "PF/PM" },
      { title: "Engine failure after V1 concept", response: "Reviewed", owner: "PF/PM" }
    ],
    notes: [
      "This is simulator training structure, not airline-specific legal wording."
    ]
  },
  {
    id: "before-start",
    phase: "Before Start",
    category: "Departure",
    nextPhase: "Engine Start",
    flows: {
      pf: [
        "Complete cockpit prep, departure briefing, and push/start readiness.",
        "Confirm doors closed, beacon on, and clearance status if online."
      ],
      pm: [
        "Cross-check push direction, tug expectations, stand hazards, and aircraft readiness for engine start."
      ]
    },
    checklist: [
      { title: "Cockpit preparation", response: "Complete", owner: "PF" },
      { title: "Doors", response: "Closed", owner: "PM" },
      { title: "Beacon", response: "On", owner: "PF" }
    ],
    notes: [
      "This is the best quick functional test phase if you want to verify checklist persistence."
    ]
  },
  {
    id: "engine-start",
    phase: "Engine Start",
    category: "Departure",
    nextPhase: "After Start",
    flows: {
      pf: [
        "Configure packs, APU bleed, and engine mode selector for the planned start technique.",
        "Start engines in sequence and monitor N2, fuel flow, EGT, oil pressure, and stable idle."
      ],
      pm: [
        "Monitor engine indications, start sequence timing, ECAM, and abnormal start cues.",
        "Confirm tug disconnect and taxi readiness after start."
      ]
    },
    checklist: [
      { title: "Engine mode selector", response: "Ignition / Start", owner: "PF" },
      { title: "Engines", response: "Stable", owner: "PF/PM" },
      { title: "ECAM", response: "Checked", owner: "PM" }
    ],
    notes: [
      "Use automatic-start technique by default unless deliberately training manual-start procedures."
    ]
  },
  {
    id: "after-start",
    phase: "After Start",
    category: "Departure",
    nextPhase: "Taxi",
    flows: {
      pf: [
        "Select engine mode normal, configure flaps, trim, spoilers, rudder trim, and taxi setup.",
        "Set anti-ice as required and ensure takeoff configuration is built."
      ],
      pm: [
        "Cross-check flight controls, brake temperatures, ECAM status, and takeoff config logic."
      ]
    },
    checklist: [
      { title: "Anti-ice", response: "As required", owner: "PF/PM" },
      { title: "Flaps", response: "Set", owner: "PF" },
      { title: "Pitch trim", response: "Set", owner: "PF" },
      { title: "Flight controls", response: "Checked", owner: "PM" }
    ],
    notes: [
      "Single-engine taxi variations can be added later if you want a more specialized SOP version."
    ]
  },
  {
    id: "taxi",
    phase: "Taxi",
    category: "Departure",
    nextPhase: "Before Takeoff",
    flows: {
      pf: [
        "Taxi with disciplined centerline tracking, speed control, and runway crossing awareness.",
        "Use taxi time to settle scan, braking feel, and turn anticipation."
      ],
      pm: [
        "Monitor taxi route, hotspots, crossing clearances, and aircraft control checks.",
        "Call out route deviations, hold short points, and runway proximity concerns."
      ]
    },
    checklist: [
      { title: "Brakes", response: "Checked", owner: "PF" },
      { title: "Taxi route", response: "Reviewed", owner: "PF/PM" },
      { title: "Flight controls", response: "Checked", owner: "PF/PM" }
    ],
    notes: [
      "This is a deliberate taxi discipline phase, not a large challenge-response block."
    ]
  },
  {
    id: "before-takeoff",
    phase: "Before Takeoff",
    category: "Departure",
    nextPhase: "Takeoff",
    flows: {
      pf: [
        "Review runway, lateral path, initial altitude, and any departure changes.",
        "Confirm exterior lights, transponder, and takeoff config before entering the runway."
      ],
      pm: [
        "Cross-check runway entry, transponder, weather radar concept, and final takeoff configuration."
      ]
    },
    checklist: [
      { title: "Cabin / departure readiness", response: "Ready", owner: "PF/PM", note: "Simulator adaptation of real-world cabin-ready items." },
      { title: "Takeoff configuration", response: "Tested", owner: "PF/PM" },
      { title: "Exterior lights", response: "Set", owner: "PF" },
      { title: "Transponder", response: "On / TA RA", owner: "PF" }
    ],
    notes: [
      "This phase should remain compact enough to use on VATSIM while taxiing into position."
    ]
  },
  {
    id: "takeoff",
    phase: "Takeoff",
    category: "Departure",
    nextPhase: "After Takeoff",
    flows: {
      pf: [
        "Line up, stabilize, and apply planned takeoff thrust.",
        "Maintain centerline, monitor crosswind, and fly the planned rotation and initial climb."
      ],
      pm: [
        "Monitor thrust set, airspeed trend, engine instruments, and aircraft tracking.",
        "Call positive climb and monitor for abnormal cues."
      ]
    },
    checklist: [
      { title: "Takeoff thrust", response: "Set", owner: "PF/PM" },
      { title: "Airspeed", response: "Alive", owner: "PM" },
      { title: "Positive climb", response: "Confirmed", owner: "PM" }
    ],
    notes: [
      "High-speed callouts are kept as operational references rather than extra checkbox clutter."
    ]
  },
  {
    id: "after-takeoff",
    phase: "After Takeoff",
    category: "Climb",
    nextPhase: "Climb",
    flows: {
      pf: [
        "Retract gear and flaps on schedule, establish climb thrust, and manage automation.",
        "Stabilize the aircraft into a normal climb profile."
      ],
      pm: [
        "Cross-check gear, flap cleanup, packs, route tracking, and pressurization."
      ]
    },
    checklist: [
      { title: "Landing gear", response: "Up", owner: "PF" },
      { title: "Flaps", response: "Up", owner: "PF" },
      { title: "Packs", response: "On", owner: "PM" }
    ],
    notes: [
      "If you practice packs-off or nonstandard takeoffs, use notes rather than rewriting the core checklist."
    ]
  },
  {
    id: "climb",
    phase: "Climb",
    category: "Enroute",
    nextPhase: "Cruise",
    flows: {
      pf: [
        "Monitor climb mode, constraints, weather, anti-ice need, and energy management."
      ],
      pm: [
        "Cross-check pressurization, engine parameters, route compliance, and evolving threats."
      ]
    },
    checklist: [
      { title: "Climb profile", response: "Checked", owner: "PF/PM" },
      { title: "Pressurization", response: "Checked", owner: "PM" },
      { title: "Anti-ice", response: "As required", owner: "PF/PM" }
    ],
    notes: [
      "The climb phase remains concise to reduce workload."
    ]
  },
  {
    id: "cruise",
    phase: "Cruise",
    category: "Enroute",
    nextPhase: "Descent Preparation",
    flows: {
      pf: [
        "Review fuel, weather, destination changes, and top-of-descent strategy."
      ],
      pm: [
        "Cross-check fuel state, destination data, and system stability."
      ]
    },
    checklist: [
      { title: "Cruise systems", response: "Checked", owner: "PF/PM" },
      { title: "Fuel state", response: "Checked", owner: "PM" },
      { title: "Destination data", response: "Reviewed", owner: "PF" }
    ],
    notes: [
      "Top of climb and cruise are merged into one practical in-sim phase."
    ]
  },
  {
    id: "descent-preparation",
    phase: "Descent Preparation",
    category: "Arrival",
    nextPhase: "Arrival Discussion",
    flows: {
      pf: [
        "Review ATIS, STAR, runway, minima, missed approach, and landing performance.",
        "Set landing data and energy management plan."
      ],
      pm: [
        "Cross-check minima, arrival path, runway threats, and braking strategy."
      ]
    },
    checklist: [
      { title: "Arrival briefing", response: "Complete", owner: "PF" },
      { title: "Minima", response: "Set", owner: "PF/PM" },
      { title: "Autobrake", response: "Set", owner: "PF" }
    ],
    notes: [
      "This phase is built to support serious arrival discipline without becoming too airline-specific."
    ]
  },
  {
    id: "arrival-discussion",
    phase: "Arrival Discussion",
    category: "Arrival",
    nextPhase: "Approach",
    flows: {
      pf: [
        "Discuss likely runway, nav type, missed approach, and stabilization gates."
      ],
      pm: [
        "Challenge unstable assumptions, runway changes, and weather or terrain threats."
      ]
    },
    checklist: [
      { title: "Arrival threats", response: "Reviewed", owner: "PF/PM" },
      { title: "Missed approach", response: "Reviewed", owner: "PF/PM" }
    ],
    notes: [
      "This is a tactical arrival cross-check phase between descent prep and final approach."
    ]
  },
  {
    id: "approach",
    phase: "Approach",
    category: "Arrival",
    nextPhase: "Landing",
    flows: {
      pf: [
        "Configure approach type, guidance mode, baro, and stabilization targets.",
        "Maintain disciplined speed and configuration schedule."
      ],
      pm: [
        "Cross-check baro, nav source logic, seat belts, and stabilization progress."
      ]
    },
    checklist: [
      { title: "Baro reference", response: "Set", owner: "PF/PM" },
      { title: "Seat belts", response: "On", owner: "PF" },
      { title: "Approach mode / guidance", response: "Set", owner: "PF/PM" }
    ],
    notes: [
      "Use notes to distinguish ILS, RNAV, or visual specifics while keeping the base checklist stable."
    ]
  },
  {
    id: "landing",
    phase: "Landing",
    category: "Arrival",
    nextPhase: "After Landing",
    flows: {
      pf: [
        "Confirm landing configuration, aim point, wind correction, and rollout plan.",
        "Fly a stable final and execute the planned landing technique."
      ],
      pm: [
        "Cross-check gear, flap config, landing clearance, and stabilization criteria."
      ]
    },
    checklist: [
      { title: "Landing gear", response: "Down", owner: "PF/PM" },
      { title: "Flaps", response: "Set for landing", owner: "PF" },
      { title: "Landing clearance / runway plan", response: "Confirmed", owner: "PF/PM" }
    ],
    notes: [
      "This remains a short final-configuration checklist rather than a callout script."
    ]
  },
  {
    id: "after-landing",
    phase: "After Landing",
    category: "Arrival",
    nextPhase: "Taxi In",
    flows: {
      pf: [
        "Clear the runway fully before reconfiguring the aircraft.",
        "Retract flaps, disarm spoilers, and transition to taxi state."
      ],
      pm: [
        "Monitor runway exit discipline, external lights, APU plan, and taxi-in readiness."
      ]
    },
    checklist: [
      { title: "Spoilers", response: "Disarmed", owner: "PF" },
      { title: "Flaps", response: "Up", owner: "PF" },
      { title: "APU", response: "As required", owner: "PF/PM" }
    ],
    notes: [
      "Keep runway exit discipline ahead of checklist speed."
    ]
  },
  {
    id: "taxi-in",
    phase: "Taxi In",
    category: "Arrival",
    nextPhase: "Parking",
    flows: {
      pf: [
        "Taxi to stand with brake temperature and stand alignment awareness."
      ],
      pm: [
        "Confirm stand identification, taxi routing, and parking expectations."
      ]
    },
    checklist: [
      { title: "Taxi-in route", response: "Reviewed", owner: "PF/PM" },
      { title: "Brake temperatures", response: "Checked", owner: "PM" },
      { title: "Stand", response: "Identified", owner: "PF/PM" }
    ],
    notes: [
      "This is the arrival counterpart to the outbound taxi discipline phase."
    ]
  },
  {
    id: "parking",
    phase: "Parking",
    category: "Shutdown",
    nextPhase: "Securing the Aircraft",
    flows: {
      pf: [
        "Set parking brake, establish APU or external power, and shut the engines down.",
        "Transition the aircraft from taxi state to stand state."
      ],
      pm: [
        "Cross-check power source, engine shutdown, seat belt sign, and stand safety condition."
      ]
    },
    checklist: [
      { title: "Parking brake", response: "Set", owner: "PF" },
      { title: "Engines", response: "Off", owner: "PF/PM" },
      { title: "Seat belts", response: "Off", owner: "PF" }
    ],
    notes: [
      "Ground-service items can be expanded later if you want deeper turnaround realism."
    ]
  },
  {
    id: "securing-aircraft",
    phase: "Securing the Aircraft",
    category: "Shutdown",
    nextPhase: "Safety / Exterior",
    flows: {
      pf: [
        "Complete final fuel pump, light, and electrical shutdown as planned.",
        "Leave the aircraft in a stable parked state consistent with your simulator session."
      ],
      pm: [
        "Cross-check final aircraft condition and note anything for the next turnaround."
      ]
    },
    checklist: [
      { title: "Fuel pumps", response: "Off", owner: "PF" },
      { title: "Batteries / final power state", response: "As required", owner: "PF/PM" },
      { title: "Aircraft", response: "Secured", owner: "PF/PM" }
    ],
    notes: [
      "This is the final shutdown phase and closes the SOP loop."
    ]
  }
];

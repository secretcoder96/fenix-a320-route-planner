# A320 Virtual PM

Standalone web app for Microsoft Flight Simulator that acts as a virtual Pilot Monitoring assistant for the Fenix A320.

## What it does

- Provides simulator-friendly A320 normal-procedure phases
- Separates flows, challenge-response checklist items, and notes
- Runs one PM challenge at a time with typed or spoken PF responses
- Supports browser speech recognition and PM text-to-speech
- Stores selected phase, mode, voice settings, progress, and callout log in local storage
- Uses a dark Airbus-style utility layout suitable for a second monitor or tablet

## Procedure source

The app structure is organized from the A320 normal procedures PDF referenced in the project brief, but the UI wording is rewritten for practical single-pilot simulator use rather than copied from the source.

## Modes

- Normal Mode: accepts practical response variations
- Training Mode: shows hints during checklist work
- Strict Mode: requires closer phrase matches

## Voice support

- Voice recognition uses the browser Web Speech API
- PM voice readout uses `window.speechSynthesis`
- Chrome or Edge is recommended for microphone support

## Disclaimer

This is a simulator training aid for the Fenix A320 and is not official Airbus, Fenix, airline, or training documentation.

## Future expansion hooks

- SimBrief import
- VATSIM controller data
- SimConnect aircraft state
- Fenix aircraft state detection
- Takeoff and landing performance
- Abnormal procedures
- Route-specific briefing generation
- Gate and taxi briefing

# Fenix A320 Route Planner

Static iPad-friendly web app for choosing realistic Fenix A320 routes using:

- live public VATSIM network data
- public airport and airline data
- public historical route data

## What it does

- Takes Pacific local off-block and on-block input and converts it to UTC/Zulu using the actual date
- Scores realistic A320-family routes in North America and Europe
- Uses the live public VATSIM snapshot to favor routes with stronger current ATC coverage
- Stores preferences in local browser storage
- Works well in Safari on iPad and can be added to the Home Screen

## Data sources

- VATSIM public network feed: `https://data.vatsim.net/v3/vatsim-data.json`
- OpenFlights public airport data: `airports-extended.dat`
- OpenFlights public airline data: `airlines.dat`
- OpenFlights public route data: `routes.dat`

## Deploy on GitHub Pages

1. Push these files to a GitHub repository.
2. In the repository settings, enable GitHub Pages from the default branch root.
3. Open the published URL in Safari on iPad.
4. Use Share -> Add to Home Screen.

## Notes

- Gate and terminal suggestions are estimates unless specifically verified elsewhere.
- Coverage is based on the current public VATSIM snapshot, so it is best for near-term planning.
- If browser CORS blocks any live feed on GitHub Pages, the next step would be adding a tiny serverless proxy.

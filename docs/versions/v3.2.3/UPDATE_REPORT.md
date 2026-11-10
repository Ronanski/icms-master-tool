# UPDATE REPORT — v3.2.3 (Beta)

- **beta.1** (2026-11-10, JENNIE): plant plan 4B: Turbine trip from the Instructor console or the Training dock pressed within 2 s of a state load (150 MW) did nothing: the first 2 s of a run skip trip detection while the values settle, and the 1.5 s push button ended inside them. A push button (Turbine trip, ATS shut-down) pressed in those 2 s is now kept and the trip takes effect at the end of the 2 s, first out MANUAL TRIP. Engine: src/analog/engine/tcs-trip.js tcsTripScan.

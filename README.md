# Flight In Front

Host-ready Meta Ray-Ban Display Web App test.

The app uses GPS plus device orientation to answer: "What flight is in front of me?" The result shown on screen is a plain-text answer sentence.

## Upload

Upload this whole folder if your hosting platform supports serverless functions.

For GitHub Pages, upload `index.html` to the Pages repo, then deploy a separate proxy because GitHub Pages cannot run `/api/aircraft`.

The hosted URL must be HTTPS for GPS and motion/orientation permissions on real devices.

## Important: ADS-B Proxy

ADSB.lol and adsb.fi are live, but they do not send browser CORS headers. If you host only `index.html` on a purely static host, the browser can show `Failed to fetch`.

This folder includes a same-origin proxy:

- Vercel: `api/aircraft.js`
- Netlify: `netlify/functions/aircraft.js` plus `netlify.toml`
- Cloudflare Worker: `cloudflare-worker/aircraft-proxy.js`

The app calls `/api/aircraft` first, then falls back to direct API fetch. Use Vercel, Netlify, or another host where you can run an equivalent serverless function.

## GitHub Pages Setup

Your Pages URL:

```text
https://viraj-dhuri.github.io/meta-display-compass/
```

GitHub Pages is static, so ADSB.lol and adsb.fi will show `Failed to fetch` unless you use an external proxy.

Recommended setup:

1. Deploy `cloudflare-worker/aircraft-proxy.js` as a Cloudflare Worker.
2. Copy the Worker URL, for example:

```text
https://flight-aircraft-proxy.yourname.workers.dev
```

3. Open your GitHub Pages app with:

```text
https://viraj-dhuri.github.io/meta-display-compass/?api_base=https://flight-aircraft-proxy.yourname.workers.dev
```

The app saves `api_base` in localStorage, so you only need to include it once unless you clear browser data.

## Detection Logic

The runtime function uses:

- GPS latitude and longitude for the ADS-B search point.
- IMU/compass bearing for the current viewing direction.
- Viewing half-angle from calibration, default `45` degrees.
- ADS-B search radius `80` nautical miles.
- Max visible aircraft distance `6` nautical miles.

It filters out aircraft on the ground, aircraft without lat/lon, aircraft without usable distance, aircraft farther than max visible distance, and aircraft outside the viewing cone. It ranks by closest distance, then smallest bearing error, then presence of callsign/details.

The plain-text answer is generated from the best match and enriched through ADSBdb when possible.

## Controls

- Enter: start sensors, then scan the flight in front.
- Right: run calibration.
- Left: switch provider: ADSB.lol, adsb.fi, Flightradar24.
- Up: reset calibration.
- Down: refresh aircraft data.

## Calibration

The calibration flow follows the StarlinkMetaGlasses style:

1. Level: look at the horizon, press Enter.
2. Heading: optional, face true north and press Enter, or press Down to skip.
3. Viewing cone: center a distant point, press Enter, turn to an edge, press Enter.
4. Vertical FOV: center again, press Enter, tilt to an edge, press Enter.

Calibration is saved in browser localStorage.

## Flight Providers

Aircraft position feed order:

1. ADSB.lol `https://api.adsb.lol/v2/point/{lat}/{lon}/{radius_nm}`
2. airplanes.live `https://api.airplanes.live/v2/point/{lat}/{lon}/{radius_nm}`
3. adsb.fi fallback

ADSBdb route enrichment:

1. `https://api.adsbdb.com/v0/aircraft/{hex_id}?callsign={callsign}`
2. `https://api.adsbdb.com/v0/callsign/{callsign}`

Successful route lookups are cached for 5 minutes. Failed route lookups are cached for 90 seconds.

Flightradar24 is implemented with the official live positions endpoint, but it requires an API token. For testing:

```text
https://your-host.example/?fr24_token=YOUR_TOKEN
```

The token is saved to localStorage by the app. Do not expose private production tokens in public client-side code.

## Local Test

```bash
npm run check
npm start
```

Then open:

```text
http://localhost:3000
```

Desktop browsers usually need Chrome DevTools Sensors to fake GPS and orientation.

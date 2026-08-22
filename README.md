# Flight In Front

Host-ready Meta Ray-Ban Display Web App test.

The app uses GPS plus device orientation to answer: "What flight is in front of me?"

## Upload

For a static hosting platform, upload this whole folder or just `index.html`.

The hosted URL must be HTTPS for GPS and motion/orientation permissions on real devices.

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
3. Horizontal FOV: center a distant point, press Enter, turn to an edge, press Enter.
4. Vertical FOV: center again, press Enter, tilt to an edge, press Enter.

Calibration is saved in browser localStorage.

## Flight Providers

ADSB.lol and adsb.fi are implemented as public ADS-B providers.

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

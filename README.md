# Facing Direction Compass

Host-ready Meta Ray-Ban Display Web App test.

## Upload

For a static hosting platform, upload this folder or just `index.html`.

The hosted URL must be HTTPS for sensor permission on real devices.

## Local Test

```bash
npm run check
npm start
```

Then open:

```text
http://localhost:3000
```

## Glasses Test

Open the HTTPS URL on the glasses, press Enter, allow motion/orientation permission if prompted, then turn to test the heading.

If the app stays on `STARTING` or `--`, the browser did not expose compass heading data through `DeviceOrientationEvent`.

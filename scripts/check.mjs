import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");

const checks = [
  ["MRBD meta tag", /name="mrbd-web-app-capable"\s+content="yes"/.test(html)],
  ["600x600 viewport meta", /width=600,\s*height=600/.test(html)],
  ["fixed 600px html/body", /html,\s*\n\s*body\s*{[\s\S]*?width:\s*600px;[\s\S]*?height:\s*600px;[\s\S]*?overflow:\s*hidden;/.test(html)],
  ["fixed 600px app root", /\.app\s*{[\s\S]*?width:\s*600px;[\s\S]*?height:\s*600px;/.test(html)],
  ["black additive canvas", /--black:\s*#000000;/.test(html)],
  ["single focusable app control", /class="main focusable"[\s\S]*?tabindex="0"/.test(html)],
  ["geolocation watcher", /navigator\.geolocation\.watchPosition/.test(html)],
  ["DeviceOrientationEvent used", /DeviceOrientationEvent/.test(html)],
  ["orientation permission requested", /requestPermission/.test(html)],
  ["Starlink-style FOV clamps", /FOV_MIN\s*=\s*5[\s\S]*FOV_MAX\s*=\s*30/.test(html)],
  ["adaptive smoothing", /SMOOTH_A[\s\S]*SMOOTH_FULL_DEG[\s\S]*smoothGain/.test(html)],
  ["calibration persistence", /flight_front_cal/.test(html) && /flight_front_fov/.test(html)],
  ["calibration wizard", /startCalibration/.test(html) && /captureCalibration/.test(html)],
  ["front flight scoring", /scoreAircraft/.test(html) && /inFov/.test(html)],
  ["ADSB.lol provider", /api\.adsb\.lol\/v2\/lat/.test(html)],
  ["adsb.fi provider", /opendata\.adsb\.fi\/api\/v3/.test(html)],
  ["Flightradar24 provider", /fr24api\.flightradar24\.com/.test(html)],
  ["FR24 token path", /fr24_token/.test(html)],
  ["Enter scans", /key === "Enter"[\s\S]*scanFront/.test(html)],
  ["D-pad calibration/provider/reset", /ArrowRight[\s\S]*startCalibration/.test(html) && /ArrowLeft[\s\S]*cycleProvider/.test(html) && /ArrowUp[\s\S]*resetCalibration/.test(html)],
  ["no pointer lock", !/requestPointerLock/.test(html)]
];

const failed = checks.filter(([, ok]) => !ok);

for (const [name, ok] of checks) {
  console.log(`${ok ? "ok" : "fail"} - ${name}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}

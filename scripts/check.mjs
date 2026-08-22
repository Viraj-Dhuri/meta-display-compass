import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const vercelApi = readFileSync("api/aircraft.js", "utf8");
const vercelRoute = readFileSync("api/route.js", "utf8");
const netlifyApi = readFileSync("netlify/functions/aircraft.js", "utf8");
const netlifyRoute = readFileSync("netlify/functions/route.js", "utf8");
const workerApi = readFileSync("cloudflare-worker/aircraft-proxy.js", "utf8");

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
  ["view cone clamps", /FOV_MIN\s*=\s*5[\s\S]*FOV_MAX\s*=\s*60/.test(html)],
  ["max visible distance", /MAX_VISIBLE_NM\s*=\s*6/.test(html)],
  ["adaptive smoothing", /SMOOTH_A[\s\S]*SMOOTH_FULL_DEG[\s\S]*smoothGain/.test(html)],
  ["calibration persistence", /flight_front_cal/.test(html) && /flight_front_fov/.test(html)],
  ["calibration wizard", /startCalibration/.test(html) && /captureCalibration/.test(html)],
  ["visible flight detector function", /detectVisibleFlight/.test(html) && /validateDetectionInputs/.test(html)],
  ["bearing cone scoring", /scoreAircraft/.test(html) && /bearingError > viewHalfAngle/.test(html)],
  ["plain text answer generation", /generateFlightAnswer/.test(html) && /setPlainAnswer/.test(html)],
  ["route cache", /ROUTE_CACHE_OK_MS/.test(html) && /ROUTE_CACHE_FAIL_MS/.test(html)],
  ["ADSB.lol provider", /api\.adsb\.lol\/v2\/point/.test(html)],
  ["airplanes.live fallback", /api\.airplanes\.live\/v2\/point/.test(html)],
  ["adsb.fi provider", /opendata\.adsb\.fi\/api\/v3/.test(html)],
  ["same-origin API proxy first", /\/api\/aircraft/.test(html) && /fetchViaProxy/.test(html)],
  ["GitHub Pages external API base", /api_base/.test(html) && /flight_front_api_base/.test(html)],
  ["Vercel API proxy", /api\.adsb\.lol\/v2\/point/.test(vercelApi) && /api\.airplanes\.live/.test(vercelApi) && /access-control-allow-origin/.test(vercelApi)],
  ["Vercel route proxy", /api\.adsbdb\.com\/v0\/aircraft/.test(vercelRoute) && /api\.adsbdb\.com\/v0\/callsign/.test(vercelRoute)],
  ["Netlify API proxy", /api\.adsb\.lol\/v2\/point/.test(netlifyApi) && /api\.airplanes\.live/.test(netlifyApi) && /export async function handler/.test(netlifyApi)],
  ["Netlify route proxy", /api\.adsbdb\.com\/v0\/aircraft/.test(netlifyRoute) && /export async function handler/.test(netlifyRoute)],
  ["Cloudflare Worker proxy", /export default/.test(workerApi) && /env\.FR24_TOKEN/.test(workerApi)],
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

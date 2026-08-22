import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");

const checks = [
  ["MRBD meta tag", /name="mrbd-web-app-capable"\s+content="yes"/.test(html)],
  ["600x600 viewport meta", /width=600,\s*height=600/.test(html)],
  ["fixed 600px html/body", /html,\s*\n\s*body\s*{[\s\S]*?width:\s*600px;[\s\S]*?height:\s*600px;[\s\S]*?overflow:\s*hidden;/.test(html)],
  ["fixed 600px app root", /\.app\s*{[\s\S]*?width:\s*600px;[\s\S]*?height:\s*600px;/.test(html)],
  ["black additive canvas", /--canvas:\s*#000000;/.test(html)],
  ["focusable sensor control", /class="panel focusable"[\s\S]*?tabindex="0"/.test(html)],
  ["DeviceOrientationEvent used", /DeviceOrientationEvent/.test(html)],
  ["permission requested from activation", /requestPermission/.test(html)],
  ["heading rendered to direction", /directionFromHeading/.test(html)],
  ["Enter starts sensors", /event\.key !== "Enter"[\s\S]*startCompass\(\)/.test(html)],
  ["desktop sensor test hint", /Chrome DevTools Sensors/.test(html)],
  ["no pointer lock", !/requestPointerLock/.test(html)]
];

const failed = checks.filter(([, ok]) => !ok);

for (const [name, ok] of checks) {
  console.log(`${ok ? "ok" : "fail"} - ${name}`);
}

if (failed.length > 0) {
  process.exitCode = 1;
}

import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve } from "node:path";

const root = resolve(".");
const port = Number(process.env.PORT || 3000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function bboxAround(lat, lon, radiusNm) {
  const d2r = Math.PI / 180;
  const dLat = radiusNm / 60;
  const dLon = radiusNm / (60 * Math.max(Math.cos(lat * d2r), 0.2));
  return {
    north: lat + dLat,
    south: lat - dLat,
    east: lon + dLon,
    west: lon - dLon
  };
}

async function proxyAircraft(url, res) {
  const provider = String(url.searchParams.get("provider") || "adsbfi").toLowerCase();
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  const radius = Math.min(250, Math.max(1, Number(url.searchParams.get("radius") || 80)));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "lat and lon are required" }));
    return;
  }

  let upstreamUrl = "";
  const headers = {};

  if (provider === "adsbfi") {
    upstreamUrl = `https://opendata.adsb.fi/api/v3/lat/${lat}/lon/${lon}/dist/${radius}`;
  } else if (provider === "adsblol") {
    upstreamUrl = `https://api.adsb.lol/v2/point/${lat}/${lon}/${radius}`;
    headers.accept = "application/json";
    headers["user-agent"] = "FlightInFront/1.0";
  } else if (provider === "airplanes") {
    upstreamUrl = `https://api.airplanes.live/v2/point/${lat}/${lon}/${radius}`;
    headers.accept = "application/json";
    headers["user-agent"] = "FlightInFront/1.0";
  } else if (provider === "fr24") {
    const token = process.env.FR24_TOKEN || url.searchParams.get("fr24_token") || "";
    if (!token) {
      res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ error: "FR24_TOKEN is required for Flightradar24" }));
      return;
    }
    const box = bboxAround(lat, lon, radius);
    const bounds = `${box.north.toFixed(3)},${box.south.toFixed(3)},${box.west.toFixed(3)},${box.east.toFixed(3)}`;
    upstreamUrl = `https://fr24api.flightradar24.com/api/live/flight-positions/light?bounds=${encodeURIComponent(bounds)}`;
    headers.accept = "application/json";
    headers["accept-version"] = "v1";
    headers.authorization = `Bearer ${token}`;
  } else {
    res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "unknown provider" }));
    return;
  }

  try {
    const upstream = await fetch(upstreamUrl, { headers });
    const body = await upstream.text();
    res.writeHead(upstream.status, {
      "content-type": upstream.headers.get("content-type") || "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "cache-control": "no-store"
    });
    res.end(body);
  } catch (error) {
    res.writeHead(502, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message || "upstream fetch failed" }));
  }
}

async function fetchAdsbdbJson(url) {
  const upstream = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "FlightInFront/1.0"
    }
  });
  if (!upstream.ok) {
    throw new Error(`HTTP ${upstream.status}`);
  }
  return upstream.json();
}

async function proxyRoute(url, res) {
  const hex = String(url.searchParams.get("hex") || "").trim();
  const callsign = String(url.searchParams.get("callsign") || "").trim();

  if (!hex && !callsign) {
    res.writeHead(400, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: "hex or callsign is required" }));
    return;
  }

  try {
    if (hex) {
      const qs = callsign ? `?callsign=${encodeURIComponent(callsign)}` : "";
      const data = await fetchAdsbdbJson(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(hex)}${qs}`);
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
        "cache-control": "no-store"
      });
      res.end(JSON.stringify(data));
      return;
    }
  } catch (error) {}

  try {
    if (callsign) {
      const data = await fetchAdsbdbJson(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(callsign)}`);
      res.writeHead(200, {
        "content-type": "application/json; charset=utf-8",
        "access-control-allow-origin": "*",
        "cache-control": "no-store"
      });
      res.end(JSON.stringify(data));
      return;
    }
  } catch (error) {}

  res.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({ error: "route not found" }));
}

createServer((req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${port}`);

  if (url.pathname === "/api/aircraft") {
    proxyAircraft(url, res);
    return;
  }

  if (url.pathname === "/api/route") {
    proxyRoute(url, res);
    return;
  }

  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = resolve(join(root, pathname));

  if (!file.startsWith(root) || !existsSync(file)) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }

  res.writeHead(200, {
    "content-type": types[extname(file)] || "application/octet-stream",
    "cache-control": "no-store"
  });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`Flight In Front running at http://localhost:${port}`);
});

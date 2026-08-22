const SOURCES = {
  adsbfi: ({ lat, lon, radius }) => ({
    url: `https://opendata.adsb.fi/api/v3/lat/${lat}/lon/${lon}/dist/${radius}`,
    headers: {}
  }),
  adsblol: ({ lat, lon, radius }) => ({
    url: `https://api.adsb.lol/v2/point/${lat}/${lon}/${radius}`,
    headers: {
      accept: "application/json",
      "user-agent": "FlightInFront/1.0"
    }
  }),
  airplanes: ({ lat, lon, radius }) => ({
    url: `https://api.airplanes.live/v2/point/${lat}/${lon}/${radius}`,
    headers: {
      accept: "application/json",
      "user-agent": "FlightInFront/1.0"
    }
  }),
  fr24: ({ lat, lon, radius, token }) => {
    const box = bboxAround(Number(lat), Number(lon), Number(radius));
    const bounds = `${box.north.toFixed(3)},${box.south.toFixed(3)},${box.west.toFixed(3)},${box.east.toFixed(3)}`;
    return {
      url: `https://fr24api.flightradar24.com/api/live/flight-positions/light?bounds=${encodeURIComponent(bounds)}`,
      headers: {
        accept: "application/json",
        "accept-version": "v1",
        authorization: `Bearer ${token}`
      }
    };
  }
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

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store"
  };
}

function send(res, status, body) {
  res.status(status);
  for (const [key, value] of Object.entries(corsHeaders())) {
    res.setHeader(key, value);
  }
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.send(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204);
    for (const [key, value] of Object.entries(corsHeaders())) {
      res.setHeader(key, value);
    }
    res.end();
    return;
  }

  const provider = String(req.query.provider || "adsbfi").toLowerCase();
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  const radius = Math.min(250, Math.max(1, Number(req.query.radius || 80)));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    send(res, 400, { error: "lat and lon are required" });
    return;
  }

  if (!SOURCES[provider]) {
    send(res, 400, { error: "unknown provider" });
    return;
  }

  const token = process.env.FR24_TOKEN || req.query.fr24_token || "";
  if (provider === "fr24" && !token) {
    send(res, 400, { error: "FR24_TOKEN is required for Flightradar24" });
    return;
  }

  try {
    const source = SOURCES[provider]({ lat, lon, radius, token });
    const upstream = await fetch(source.url, { headers: source.headers });
    const text = await upstream.text();

    res.status(upstream.status);
    for (const [key, value] of Object.entries(corsHeaders())) {
      res.setHeader(key, value);
    }
    res.setHeader("content-type", upstream.headers.get("content-type") || "application/json; charset=utf-8");
    res.send(text);
  } catch (error) {
    send(res, 502, { error: error.message || "upstream fetch failed" });
  }
}

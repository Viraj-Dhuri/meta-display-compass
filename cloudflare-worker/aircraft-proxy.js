const SOURCES = {
  adsbfi: ({ lat, lon, radius }) => ({
    url: `https://opendata.adsb.fi/api/v3/lat/${lat}/lon/${lon}/dist/${radius}`,
    headers: { accept: "application/json" }
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

function headers(contentType = "application/json; charset=utf-8") {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store",
    "content-type": contentType
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: headers()
  });
}

async function fetchAdsbdbJson(url) {
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      "user-agent": "FlightInFront/1.0"
    }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

async function handleRoute(url) {
  const hex = String(url.searchParams.get("hex") || "").trim();
  const callsign = String(url.searchParams.get("callsign") || "").trim();

  if (!hex && !callsign) {
    return json(400, { error: "hex or callsign is required" });
  }

  try {
    if (hex) {
      const qs = callsign ? `?callsign=${encodeURIComponent(callsign)}` : "";
      return json(200, await fetchAdsbdbJson(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(hex)}${qs}`));
    }
  } catch (error) {}

  try {
    if (callsign) {
      return json(200, await fetchAdsbdbJson(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(callsign)}`));
    }
  } catch (error) {}

  return json(404, { error: "route not found" });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response("", { status: 204, headers: headers() });
    }

    const url = new URL(request.url);
    if (url.pathname === "/api/route") {
      return handleRoute(url);
    }

    if (url.pathname !== "/" && url.pathname !== "/api/aircraft") {
      return json(404, { error: "not found" });
    }

    const provider = String(url.searchParams.get("provider") || "adsbfi").toLowerCase();
    const lat = Number(url.searchParams.get("lat"));
    const lon = Number(url.searchParams.get("lon"));
    const radius = Math.min(250, Math.max(1, Number(url.searchParams.get("radius") || 80)));

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return json(400, { error: "lat and lon are required" });
    }

    if (!SOURCES[provider]) {
      return json(400, { error: "unknown provider" });
    }

    const token = env.FR24_TOKEN || url.searchParams.get("fr24_token") || "";
    if (provider === "fr24" && !token) {
      return json(400, { error: "FR24_TOKEN is required for Flightradar24" });
    }

    try {
      const source = SOURCES[provider]({ lat, lon, radius, token });
      const upstream = await fetch(source.url, { headers: source.headers });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: headers(upstream.headers.get("content-type") || "application/json; charset=utf-8")
      });
    } catch (error) {
      return json(502, { error: error.message || "upstream fetch failed" });
    }
  }
};

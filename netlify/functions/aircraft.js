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

function headers() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "content-type",
    "cache-control": "no-store"
  };
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...headers(),
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: headers(), body: "" };
  }

  const query = event.queryStringParameters || {};
  const provider = String(query.provider || "adsbfi").toLowerCase();
  const lat = Number(query.lat);
  const lon = Number(query.lon);
  const radius = Math.min(250, Math.max(1, Number(query.radius || 80)));

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return json(400, { error: "lat and lon are required" });
  }

  if (!SOURCES[provider]) {
    return json(400, { error: "unknown provider" });
  }

  const token = process.env.FR24_TOKEN || query.fr24_token || "";
  if (provider === "fr24" && !token) {
    return json(400, { error: "FR24_TOKEN is required for Flightradar24" });
  }

  try {
    const source = SOURCES[provider]({ lat, lon, radius, token });
    const upstream = await fetch(source.url, { headers: source.headers });
    const body = await upstream.text();

    return {
      statusCode: upstream.status,
      headers: {
        ...headers(),
        "content-type": upstream.headers.get("content-type") || "application/json; charset=utf-8"
      },
      body
    };
  } catch (error) {
    return json(502, { error: error.message || "upstream fetch failed" });
  }
}

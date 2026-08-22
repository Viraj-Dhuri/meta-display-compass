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

async function fetchJson(url) {
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

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: headers(), body: "" };
  }

  const query = event.queryStringParameters || {};
  const hex = String(query.hex || "").trim();
  const callsign = String(query.callsign || "").trim();

  if (!hex && !callsign) {
    return json(400, { error: "hex or callsign is required" });
  }

  try {
    if (hex) {
      const qs = callsign ? `?callsign=${encodeURIComponent(callsign)}` : "";
      return json(200, await fetchJson(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(hex)}${qs}`));
    }
  } catch (error) {}

  try {
    if (callsign) {
      return json(200, await fetchJson(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(callsign)}`));
    }
  } catch (error) {}

  return json(404, { error: "route not found" });
}

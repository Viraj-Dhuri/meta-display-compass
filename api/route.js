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

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.status(204);
    for (const [key, value] of Object.entries(corsHeaders())) {
      res.setHeader(key, value);
    }
    res.end();
    return;
  }

  const hex = String(req.query.hex || "").trim();
  const callsign = String(req.query.callsign || "").trim();

  if (!hex && !callsign) {
    send(res, 400, { error: "hex or callsign is required" });
    return;
  }

  try {
    if (hex) {
      const qs = callsign ? `?callsign=${encodeURIComponent(callsign)}` : "";
      const data = await fetchJson(`https://api.adsbdb.com/v0/aircraft/${encodeURIComponent(hex)}${qs}`);
      send(res, 200, data);
      return;
    }
  } catch (error) {}

  try {
    if (callsign) {
      const data = await fetchJson(`https://api.adsbdb.com/v0/callsign/${encodeURIComponent(callsign)}`);
      send(res, 200, data);
      return;
    }
  } catch (error) {}

  send(res, 404, { error: "route not found" });
}

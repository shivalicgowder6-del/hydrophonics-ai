const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

let latestData = {
  temperature: 23.50,
  humidity: 50.00,
  ph: 5.80,
  light: 420,
  waterTemp: 21.00,
  motion: false,
  alerts: [],
  suggestions: [],
  activities: [
    `📊 [${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}] Initial sensor values: 23.50°C | 50.00% | pH 5.80 | 420 lux`
  ],
  updatedAt: new Date().toISOString()
};

// ---------- ALERTS ----------
function buildAlerts(data) {
  const alerts = [];

  if (data.temperature > 26) alerts.push("🌡️ High temperature detected");
  if (data.temperature < 20) alerts.push("🌡️ Low temperature detected");
  if (data.humidity < 40) alerts.push("💧 Low humidity detected");
  if (data.humidity > 60) alerts.push("💧 High humidity detected");
  if (data.ph < 5.7) alerts.push("⚗️ Low pH detected");
  if (data.ph > 5.9) alerts.push("⚗️ High pH detected");
  if (data.light < 300) alerts.push("🌞 Low light detected");
  if (data.light > 600) alerts.push("🌞 High light detected");
  if (data.motion) alerts.push("👤 Motion detected");

  return alerts;
}

// ---------- SUGGESTIONS ----------
function buildSuggestions(data, alerts) {
  const suggestions = [];

  if (alerts.includes("🌡️ High temperature detected")) {
    suggestions.push("Increase airflow and cooling to reduce temperature.");
  }
  if (alerts.includes("💧 High humidity detected")) {
    suggestions.push("Improve ventilation to lower humidity.");
  }
  if (alerts.includes("⚗️ Low pH detected")) {
    suggestions.push("Adjust pH to around 5.8 using buffer solution.");
  }
  if (alerts.includes("🌞 Low light detected")) {
    suggestions.push("Increase lighting or adjust lamp position.");
  }
  if (alerts.includes("👤 Motion detected")) {
    suggestions.push("Check grow area for unexpected activity.");
  }

  if (!alerts.length) {
    suggestions.push("All conditions are stable.");
  }

  return suggestions;
}

// ---------- TIME ----------
function getTime() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// ---------- CHANGE DETECTION ----------
function detectChanges(newData, oldData) {
  const changes = [];

  if (!oldData) return changes;

  if (newData.temperature !== oldData.temperature) {
    changes.push(`🌡️ Temp: ${oldData.temperature} → ${newData.temperature}`);
  }

  if (newData.humidity !== oldData.humidity) {
    changes.push(`💧 Humidity: ${oldData.humidity} → ${newData.humidity}`);
  }

  if (newData.ph !== oldData.ph) {
    changes.push(`⚗️ pH: ${oldData.ph} → ${newData.ph}`);
  }

  if (newData.light !== oldData.light) {
    changes.push(`🌞 Light: ${oldData.light} → ${newData.light}`);
  }

  if (newData.motion && !oldData.motion) {
    changes.push("👤 Motion detected");
  }

  return changes;
}

// ---------- ACTIVITY BUILDER ----------
function buildActivities(data, alerts, suggestions) {
  const activities = [...latestData.activities];
  const time = getTime();

  // ALWAYS log update (THIS FIXES YOUR ISSUE)
  activities.unshift(
    `📊 [${time}] Data updated: ${data.temperature}°C | ${data.humidity}% | pH ${data.ph} | ${data.light} lux`
  );

  // Detect changes
  const changes = detectChanges(data, latestData);

  changes.forEach(change => {
    activities.unshift(`🔄 [${time}] ${change}`);
  });

  // Add alerts
  alerts.forEach(alert => {
    activities.unshift(`⚠️ [${time}] ${alert}`);
  });

  // Add suggestion if no alerts
  if (!alerts.length && suggestions.length) {
    activities.unshift(`💡 [${time}] ${suggestions[0]}`);
  }

  return activities.slice(0, 20); // keep latest 20
}

// ---------- UPDATE ----------
function normalizeNumber(value, fallback = 0) {
  return typeof value === "number" ? value : Number(value) || fallback;
}

function updateLatestData(payload) {
  const data = {
    temperature: normalizeNumber(payload.temperature, latestData.temperature),
    humidity: normalizeNumber(payload.humidity, latestData.humidity),
    ph: normalizeNumber(payload.ph, latestData.ph),
    light: normalizeNumber(payload.light, latestData.light),
    waterTemp: normalizeNumber(payload.waterTemp, latestData.waterTemp),
    motion: Boolean(payload.motion)
  };

  const alerts = buildAlerts(data);
  const suggestions = buildSuggestions(data, alerts);
  const activities = buildActivities(data, alerts, suggestions);

  latestData = {
    ...data,
    alerts,
    suggestions,
    activities,
    updatedAt: new Date().toISOString()
  };
}

// ---------- ROUTES ----------
app.post("/sensor", (req, res) => {
  updateLatestData(req.body);
  res.json({ ok: true });
});

app.get("/latest", (req, res) => {
  res.json(latestData);
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
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
  activities: [],
  updatedAt: new Date().toISOString()
};

function buildAlerts(data) {
  const alerts = [];

  if (data.temperature > 26) alerts.push(`Temperature is high at ${data.temperature.toFixed(2)}°C (ideal 20–26°C).`);
  if (data.temperature < 20) alerts.push(`Temperature is low at ${data.temperature.toFixed(2)}°C (ideal 20–26°C).`);
  if (data.humidity < 40) alerts.push(`Humidity is low at ${data.humidity.toFixed(2)}% (ideal 40–60%).`);
  if (data.humidity > 60) alerts.push(`Humidity is high at ${data.humidity.toFixed(2)}% (ideal 40–60%).`);
  if (data.ph < 5.7) alerts.push(`pH is slightly low at ${data.ph.toFixed(2)}.`);
  if (data.ph > 5.9) alerts.push(`pH is slightly high at ${data.ph.toFixed(2)}.`);
  if (data.light < 300) alerts.push(`Light is low at ${data.light} lux (ideal 300–600 lux).`);
  if (data.light > 600) alerts.push(`Light is high at ${data.light} lux (ideal 300–600 lux).`);
  if (data.waterTemp < 19) alerts.push(`Water temperature is low at ${data.waterTemp.toFixed(2)}°C.`);
  if (data.waterTemp > 23) alerts.push(`Water temperature is high at ${data.waterTemp.toFixed(2)}°C.`);
  if (data.motion) alerts.push("Motion detected in the grow area.");

  return alerts;
}

function buildSuggestions(data, alerts) {
  const suggestions = [];

  if (alerts.some(a => a.includes("Temperature is high"))) {
    suggestions.push("Increase airflow and cooling to reduce temperature.");
  }
  if (alerts.some(a => a.includes("Temperature is low"))) {
    suggestions.push("Raise ambient air temperature or add a heater.");
  }
  if (alerts.some(a => a.includes("Humidity is low"))) {
    suggestions.push("Use a humidifier or mist the plants lightly.");
  }
  if (alerts.some(a => a.includes("Humidity is high"))) {
    suggestions.push("Improve ventilation to lower humidity.");
  }
  if (alerts.some(a => a.includes("pH is slightly low"))) {
    suggestions.push("Check nutrient solution pH; keep it stable at 5.8.");
  }
  if (alerts.some(a => a.includes("pH is slightly high"))) {
    suggestions.push("Adjust pH carefully; keep it constant around 5.8.");
  }
  if (alerts.some(a => a.includes("Light is low"))) {
    suggestions.push("Increase lighting or adjust fixture position.");
  }
  if (alerts.some(a => a.includes("Light is high"))) {
    suggestions.push("Reduce light intensity or move lamps slightly away.");
  }
  if (alerts.some(a => a.includes("Water temperature is low"))) {
    suggestions.push("Warm the reservoir to protect roots.");
  }
  if (alerts.some(a => a.includes("Water temperature is high"))) {
    suggestions.push("Cool the water gently to avoid stress.");
  }
  if (alerts.some(a => a.includes("Motion detected"))) {
    suggestions.push("Inspect the grow area for unexpected movement.");
  }
  if (!alerts.length) {
    suggestions.push("All readings are within normal room conditions.");
  }

  return suggestions;
}

function formatTimestamp(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function describeChanges(data, previous) {
  const changes = [];
  if (!previous) return changes;

  if (data.temperature !== previous.temperature) {
    changes.push(`Temperature changed from ${previous.temperature.toFixed(2)}°C to ${data.temperature.toFixed(2)}°C`);
  }
  if (data.humidity !== previous.humidity) {
    changes.push(`Humidity changed from ${previous.humidity.toFixed(2)}% to ${data.humidity.toFixed(2)}%`);
  }
  if (data.light !== previous.light) {
    changes.push(`Light changed from ${previous.light} lux to ${data.light} lux`);
  }
  if (data.waterTemp !== previous.waterTemp) {
    changes.push(`Water temperature changed from ${previous.waterTemp.toFixed(2)}°C to ${data.waterTemp.toFixed(2)}°C`);
  }
  if (data.ph !== previous.ph) {
    changes.push(`pH changed from ${previous.ph.toFixed(2)} to ${data.ph.toFixed(2)}`);
  }

  return changes;
}

function buildActivities(data, alerts, suggestions) {
  const activities = [...latestData.activities];
  const stamp = formatTimestamp(new Date());
  const changes = describeChanges(data, latestData);

  activities.unshift(`📈 [${stamp}] New update received: ${data.temperature.toFixed(2)}°C, ${data.humidity.toFixed(2)}%, pH ${data.ph.toFixed(2)}, ${data.light} lux`);

  if (changes.length) {
    changes.forEach(change => {
      activities.unshift(`   • ${change}`);
    });
  }

  if (alerts.length) {
    alerts.forEach(alert => {
      activities.unshift(`⚠️ [${stamp}] ${alert}`);
    });
  }

  if (suggestions.length && !alerts.length) {
    activities.unshift(`💡 [${stamp}] ${suggestions[0]}`);
  }

  if (!alerts.length && !suggestions.length && !changes.length) {
    activities.unshift(`✅ [${stamp}] All conditions are stable in the room.`);
  }

  return activities.slice(0, 10);
}

function normalizeNumber(value, fallback = 0) {
  return typeof value === "number" ? value : Number(value) || fallback;
}

function updateLatestData(payload) {
  const temperature = normalizeNumber(payload.temperature, latestData.temperature);
  const humidity = normalizeNumber(payload.humidity, latestData.humidity);
  const ph = normalizeNumber(payload.ph, latestData.ph);
  const light = normalizeNumber(payload.light, latestData.light);
  const waterTemp = normalizeNumber(payload.waterTemp, latestData.waterTemp);
  const motion = Boolean(payload.motion);

  const data = {
    temperature,
    humidity,
    ph,
    light,
    waterTemp,
    motion
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

app.post("/sensor", (req, res) => {
  updateLatestData(req.body);
  return res.json({ ok: true, latestData });
});

app.get("/latest", (req, res) => {
  return res.json(latestData);
});

app.post("/chat", (req, res) => {
  const message = String(req.body.message || "").trim().toLowerCase();
  let reply = "Ask for status, alerts, or suggestions.";

  if (message.includes("status")) {
    reply = `Current status: ${latestData.temperature.toFixed(2)}°C, ${latestData.humidity.toFixed(2)}% humidity, pH ${latestData.ph.toFixed(2)}, light ${latestData.light} lux, water ${latestData.waterTemp.toFixed(2)}°C.`;
  } else if (message.includes("alerts")) {
    reply = latestData.alerts.length ? latestData.alerts.join(" \n") : "No active alerts. System looks stable.";
  } else if (message.includes("suggest")) {
    reply = latestData.suggestions.length ? latestData.suggestions.join(" \n") : "No suggestions needed at this time.";
  }

  return res.json({ reply });
});

app.listen(port, () => {
  console.log(`Hydroponics dashboard backend running at http://localhost:${port}`);
  console.log("Open the dashboard in your browser and start the simulator.");
});

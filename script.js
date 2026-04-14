let lastAlertCount = 0;
let tempChart;
let healthChart;
let latestData = null;
let displayedValues = null;
let targetValues = null;
let transitionFromValues = null;
let transitionStart = 0;
let transitionEnd = 0;
let animationFrameId = null;
const transitionDuration = 1 * 60 * 1000; // 1 minute
const trendHistory = [];
let previousMetrics = {
  temperature: null,
  humidity: null,
  ph: null,
  light: null
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setDisplayedValues(values) {
  displayedValues = {
    temperature: Number(values.temperature) || 0,
    humidity: Number(values.humidity) || 0,
    ph: Number(values.ph) || 0,
    light: Number(values.light) || 0
  };
}

function formatMetric(value, type) {
  if (type === "temperature") return `${value.toFixed(2)}°C`;
  if (type === "humidity") return `${value.toFixed(2)}%`;
  if (type === "ph") return value.toFixed(2);
  if (type === "light") return `${Math.round(value)} lx`;
  return value.toFixed(2);
}

function updateDisplayedMetrics() {
  if (!displayedValues) return;
  document.getElementById("temperature").innerText = formatMetric(displayedValues.temperature, "temperature");
  document.getElementById("humidity").innerText = formatMetric(displayedValues.humidity, "humidity");
  document.getElementById("ph").innerText = formatMetric(displayedValues.ph, "ph");
  document.getElementById("light").innerText = formatMetric(displayedValues.light, "light");

  updateProgressBar("tempProgress", mapPercent(displayedValues.temperature, 18, 35));
  updateProgressBar("humidityProgress", mapPercent(displayedValues.humidity, 40, 80));
  updateProgressBar("phProgress", mapPercent(displayedValues.ph, 5.5, 6.5));
  updateProgressBar("lightProgress", mapPercent(displayedValues.light, 200, 800));
}

function animateDisplay() {
  const now = performance.now();
  const duration = transitionEnd - transitionStart;
  const progress = duration > 0 ? clamp((now - transitionStart) / duration, 0, 1) : 1;

  Object.keys(targetValues).forEach(key => {
    const from = transitionFromValues[key];
    const to = targetValues[key];
    displayedValues[key] = from + (to - from) * progress;
  });

  updateDisplayedMetrics();
  if (progress < 1) {
    animationFrameId = requestAnimationFrame(animateDisplay);
  } else {
    animationFrameId = null;
  }
}

function startTransitionTo(target) {
  if (!displayedValues) {
    setDisplayedValues(target);
    updateDisplayedMetrics();
  }

  transitionFromValues = { ...displayedValues };
  targetValues = {
    temperature: Number(target.temperature) || displayedValues.temperature,
    humidity: Number(target.humidity) || displayedValues.humidity,
    ph: Number(target.ph) || displayedValues.ph,
    light: Number(target.light) || displayedValues.light
  };

  transitionStart = performance.now();
  transitionEnd = transitionStart + transitionDuration;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  animationFrameId = requestAnimationFrame(animateDisplay);
}

function getTrend(value, previous) {
  if (previous === null || previous === 0) return 0;
  return ((value - previous) / previous) * 100;
}

function formatTrend(value) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

function mapPercent(value, min, max) {
  const percent = ((value - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, percent));
}

function evaluateHealth(data) {
  const score = clamp(100 - (
    (data.temperature < 20 ? 20 - data.temperature : data.temperature > 26 ? data.temperature - 26 : 0) / 10) * 20
    - (data.humidity < 40 ? 40 - data.humidity : data.humidity > 60 ? data.humidity - 60 : 0) / 20 * 20
    - (data.ph < 5.7 ? 5.7 - data.ph : data.ph > 5.9 ? data.ph - 5.9 : 0) / 0.4 * 20
    - (data.light < 300 ? 300 - data.light : data.light > 600 ? data.light - 600 : 0) / 300 * 20
    - (data.waterTemp < 19 ? 19 - data.waterTemp : data.waterTemp > 23 ? data.waterTemp - 23 : 0) / 4 * 20
  , 0, 100);

  let status = "Good";
  if (score < 55) status = "Critical";
  else if (score < 80) status = "Warning";

  return { score, status };
}

function updateMetricCard(cardId, value, labelId, trendId, previous) {
  const metricValue = Number(value);
  const trend = getTrend(metricValue, previous);
  const card = document.getElementById(cardId);
  const label = document.getElementById(labelId);
  const trendEl = document.getElementById(trendId);
  const highWarning = cardId === "temperatureCard" ? metricValue > 30 : cardId === "phCard" ? metricValue < 5.5 || metricValue > 6.5 : false;

  card.classList.toggle("red", highWarning);
  card.classList.toggle("green", !highWarning);
  label.innerText = highWarning ? "Attention" : "Optimal";
  trendEl.innerText = formatTrend(trend);
  trendEl.className = `trend ${trend >= 0 ? "up" : "down"}`;
}

function updateProgressBar(id, percent) {
  document.getElementById(id).style.width = `${percent}%`;
}

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light-mode");
  const themeBtn = document.getElementById("themeBtn");
  themeBtn.innerText = body.classList.contains("light-mode") ? "🌙" : "🌓";
}

function exportReport() {
  if (!latestData) {
    alert("No data available to export yet.");
    return;
  }

  const lines = [
    "Hydro AI Sensor Report",
    `Timestamp: ${new Date().toLocaleString()}`,
    "",
    `Temperature: ${latestData.temperature?.toFixed(2) ?? "--"} °C`,
    `Humidity: ${latestData.humidity?.toFixed(2) ?? "--"} %`,
    `pH: ${latestData.ph?.toFixed(2) ?? "--"}`,
    `Light: ${latestData.light ?? "--"} lx`,
    `Water Temp: ${latestData.waterTemp?.toFixed(2) ?? "--"} °C`,
    "",
    `Alerts: ${latestData.alerts?.length ?? 0}`,
    `Suggestions: ${latestData.suggestions?.length ?? 0}`
  ];

  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hydro-ai-report-${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadData() {
  if (!latestData) {
    alert("No data available to download yet.");
    return;
  }

  const blob = new Blob([JSON.stringify(latestData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hydro-ai-data-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function addMessage(sender, text) {
  const messages = document.getElementById("messages");
  const msg = document.createElement("p");
  msg.className = sender === "You" ? "user" : "bot";
  msg.innerText = `${sender}: ${text}`;
  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function toggleChat() {
  const popup = document.getElementById("chatPopup");
  popup.classList.toggle("visible");
}

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(520, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (error) {
    console.warn("Audio alert blocked:", error);
  }
}

function initChart() {
  const ctx = document.getElementById("tempChart").getContext("2d");
  tempChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Temperature",
        data: [],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34, 197, 94, 0.18)",
        tension: 0.35,
        pointRadius: 4,
        borderWidth: 2,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(148,163,184,0.12)" }, ticks: { color: "#cbd5e1" } },
        y: { grid: { color: "rgba(148,163,184,0.12)" }, ticks: { color: "#cbd5e1" } }
      }
    }
  });

  const healthCtx = document.getElementById("healthChart").getContext("2d");
  healthChart = new Chart(healthCtx, {
    type: "doughnut",
    data: {
      labels: ["Healthy", "Critical"],
      datasets: [{
        data: [1, 0],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: { legend: { display: false } }
    }
  });
}

async function fetchData() {
  try {
    const res = await fetch("/latest");
    const data = await res.json();
    latestData = data;

    if (!displayedValues) {
      setDisplayedValues(data);
      updateDisplayedMetrics();
    }
    startTransitionTo(data);

    updateMetricCard("temperatureCard", data.temperature, "temperatureLabel", "temperatureTrend", previousMetrics.temperature);
    updateMetricCard("humidityCard", data.humidity, "humidityLabel", "humidityTrend", previousMetrics.humidity);
    updateMetricCard("phCard", data.ph, "phLabel", "phTrend", previousMetrics.ph);
    updateMetricCard("lightCard", data.light, "lightLabel", "lightTrend", previousMetrics.light);

    previousMetrics = {
      temperature: data.temperature,
      humidity: data.humidity,
      ph: data.ph,
      light: data.light
    };

    const alertCount = data.alerts?.length ?? 0;
    const suggestionCount = data.suggestions?.length ?? 0;
    const health = evaluateHealth(data);

    document.getElementById("alertCount").innerText = alertCount;
    document.getElementById("healthStatus").innerText = alertCount > 0 ? "Critical" : health.status;
    document.getElementById("suggestionCount").innerText = suggestionCount;

    healthChart.data.datasets[0].data = [health.score, 100 - health.score];
    healthChart.update();

    const alertsContainer = document.getElementById("alerts");
    alertsContainer.innerHTML = "";
      if (alertCount) {
      data.alerts.forEach(alert => {
        const element = document.createElement("div");
        element.className = "alert-box";
        element.innerText = alert;
        alertsContainer.appendChild(element);
      });
    } else {
      const element = document.createElement("div");
      element.className = "alert-box";
      element.innerText = "No active alerts. Everything is running smoothly.";
      alertsContainer.appendChild(element);
    }

    const suggestionsContainer = document.getElementById("suggestions");
    suggestionsContainer.innerHTML = "";
    if (suggestionCount) {
      data.suggestions.forEach(suggestion => {
        const element = document.createElement("div");
        element.className = "suggestion";
        element.innerText = suggestion;
        suggestionsContainer.appendChild(element);
      });
    }

    renderActivityFeed(data.activities || []);
    if (data.alerts?.length && data.alerts.length !== lastAlertCount) {
      playAlertSound();
    }

    const tempPercent = mapPercent(data.temperature, 18, 35);
    const humidityPercent = mapPercent(data.humidity, 40, 80);
    const phPercent = mapPercent(data.ph, 5.5, 6.5);
    const lightPercent = mapPercent(data.light, 200, 800);
    updateProgressBar("tempProgress", tempPercent);
    updateProgressBar("humidityProgress", humidityPercent);
    updateProgressBar("phProgress", phPercent);
    updateProgressBar("lightProgress", lightPercent);

    const now = new Date();
    const label = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    trendHistory.push({ label, value: data.temperature });
    if (trendHistory.length > 12) trendHistory.shift();

    tempChart.data.labels = trendHistory.map(point => point.label);
    tempChart.data.datasets[0].data = trendHistory.map(point => point.value);
    tempChart.update();

    healthChart.data.datasets[0].data = [Math.max(0, 4 - alertCount), alertCount];
    healthChart.update();

    lastAlertCount = alertCount;
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

function renderActivityFeed(activities) {
  const feed = document.getElementById("activityFeed");
  feed.innerHTML = "";

  if (!activities || activities.length === 0) {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerText = "No activity recorded yet.";
    feed.appendChild(item);
    return;
  }

  activities.slice(0, 6).forEach(entry => {
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerText = entry;
    feed.appendChild(item);
  });
}

function addActivity(text) {
  const feed = document.getElementById("activityFeed");
  const item = document.createElement("div");
  item.className = "activity-item";
  item.innerText = text;
  feed.prepend(item);
  if (feed.childElementCount > 6) {
    feed.removeChild(feed.lastChild);
  }
}

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  addMessage("You", message);
  input.value = "";

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });
    const data = await res.json();
    addMessage("Bot", data.reply || "I couldn't understand that.");
  } catch (err) {
    addMessage("Bot", "Chat service unavailable.");
    console.error("Chat error:", err);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  initChart();
  fetchData();
  setInterval(fetchData, 1 * 60 * 1000); // refresh live data every 1 minute
});

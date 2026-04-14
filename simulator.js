const axios = require("axios");

let temp = 25;
let humidity = 60;
let ph = 5.8;
let light = 400;
let waterTemp = 21;

function randomDelta(value, drift = 0.5) {
  return value + (Math.random() - 0.5) * drift;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function generateData() {
  temp = clamp(randomDelta(temp, 0.7), 20, 27);
  humidity = clamp(randomDelta(humidity, 1.0), 42, 65);
  light = clamp(Math.round(randomDelta(light, 20)), 320, 560);
  waterTemp = clamp(randomDelta(waterTemp, 0.3), 20, 23);
  ph = 5.8; // Keep pH constant for a stable room-like hydroponic environment

  return {
    temperature: temp.toFixed(2),
    humidity: humidity.toFixed(2),
    ph: ph.toFixed(2),
    light: light,
    waterTemp: waterTemp.toFixed(2),
    motion: Math.random() > 0.85
  };
}

async function sendSensorUpdate() {
  const data = generateData();
  console.log("Sending:", data);

  try {
    await axios.post("http://localhost:5000/sensor", data);
    console.log("Sent successfully\n");
  } catch (err) {
    console.log("Error sending data:", err.message, "\n");
  }
}

sendSensorUpdate();
setInterval(sendSensorUpdate, 1 * 60 * 1000); // update every 1 minute to match gradual dashboard transitions

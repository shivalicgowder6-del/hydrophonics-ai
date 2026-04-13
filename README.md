# 🌱 AI Hydroponics Dashboard

An AI-powered hydroponics monitoring system that analyzes sensor data, detects issues, provides smart suggestions, and allows interaction through a chatbot interface.

---

# 🧠 FEATURES

* 📊 Real-time sensor monitoring
* ⚠️ Automatic alert detection
* 💡 Smart suggestion system
* 🤖 Interactive chatbot
* 💻 Modern dashboard UI

---

# 🏗️ PROJECT STRUCTURE

```
hydroponics-ai-demo/
│
├── backend/
│   ├── index.js
│   ├── alertLogic.js
│   ├── suggestionLogic.js
│
├── dashboard/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│
└── README.md
```

---

# ⚙️ BACKEND SETUP

## 📦 Install Dependencies

```
cd backend
npm init -y
npm install express cors
```

---

## ▶️ Run Backend Server

```
node index.js
```

Server runs at:

```
http://localhost:3000
```

---

# 🧪 TEST SENSOR API

Send sample sensor data using curl:

```
curl -X POST http://localhost:3000/sensor \
-H "Content-Type: application/json" \
-d '{"temperature":35,"humidity":40,"ph":5.0,"light":100,"waterTemp":22}'
```

---

# 🖥️ DASHBOARD SETUP

```
cd ../dashboard
xdg-open index.html
```

OR (recommended):

```
npm install -g live-server
live-server
```

---

# 🤖 CHATBOT USAGE

In the dashboard chatbot, type:

* `status` → Shows current system data
* `alerts` → Shows detected alerts
* `suggestions` → Shows recommendations

---

# 🔄 SYSTEM WORKFLOW

```
Sensor Data 
   ↓
Backend API (/sensor)
   ↓
Alert Logic + Suggestion Engine
   ↓
Stored as Latest Data
   ↓
Frontend Dashboard (/latest)
   ↓
User + Chatbot Interaction
```

---

# 🧠 ALERT CONDITIONS

| Parameter   | Condition    |
| ----------- | ------------ |
| Temperature | >30 or <20   |
| Humidity    | <50 or >70   |
| pH          | <5.5 or >6.5 |
| Light       | <200 or >800 |

---

# 💡 SUGGESTIONS MAPPING

| Problem              | Solution                |
| -------------------- | ----------------------- |
| Temperature too high | Increase ventilation    |
| Temperature too low  | Increase heating        |
| Humidity too low     | Add mist or water       |
| Humidity too high    | Improve airflow         |
| pH too low           | Add pH up solution      |
| pH too high          | Add pH down solution    |
| Light too low        | Increase light exposure |
| Light too high       | Reduce light intensity  |

---

# 🚀 GIT SETUP (FOR REPO)

```
git init
git add .
git commit -m "Initial commit - AI Hydroponics Dashboard"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

---

# 🎯 DEMO STEPS

1. Start backend server
2. Open dashboard
3. Send sensor data using curl
4. Observe alerts & suggestions
5. Use chatbot for interaction

---

# 🧑‍💻 AUTHOR

Your Name

---

# 💬 NOTE

This project is designed for demonstration purposes and can be extended with real IoT hardware like NodeMCU and sensors.

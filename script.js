async function fetchData() {
  try {
    const res = await fetch("http://localhost:3000/latest");
    const data = await res.json();

    document.getElementById("temperature").innerText = data.temperature || "--";
    document.getElementById("humidity").innerText = data.humidity || "--";
    document.getElementById("ph").innerText = data.ph || "--";
    document.getElementById("light").innerText = data.light || "--";
    document.getElementById("waterTemp").innerText = data.waterTemp || "--";

    const alertsList = document.getElementById("alerts");
    alertsList.innerHTML = "";
    data.alerts?.forEach(a => {
      alertsList.innerHTML += `<li>${a}</li>`;
    });

    const suggestionsList = document.getElementById("suggestions");
    suggestionsList.innerHTML = "";
    data.suggestions?.forEach(s => {
      suggestionsList.innerHTML += `<li>${s}</li>`;
    });

  } catch (err) {
    console.log(err);
  }
}

setInterval(fetchData, 2000);
async function sendMessage() {
  const input = document.getElementById("chatInput").value;

  const res = await fetch("http://localhost:3000/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message: input })
  });

  const data = await res.json();
  document.getElementById("chatResponse").innerText = data.reply;
}

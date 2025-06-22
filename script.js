// === clicker-simulator.js ===
const gameState = {
  clicks: 0,
  upgrades: [
    { id: 1, name: "Cursor", cps: 1, quantity: 0, baseCost: 10 },
    { id: 2, name: "Auto Clicker", cps: 5, quantity: 0, baseCost: 100 },
    { id: 3, name: "Mega Generator", cps: 20, quantity: 0, baseCost: 500 }
  ]
};

const $ = id => document.getElementById(id);

function formatNumber(n) {
  if (n < 1000) return n;
  const units = ["K", "M", "B"];
  let i = 0;
  while (n >= 1000 && i < units.length) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i - 1];
}

function getUpgradeCost(u) {
  return Math.floor(u.baseCost * Math.pow(1.15, u.quantity));
}

function calcCPS() {
  return gameState.upgrades.reduce((sum, u) => sum + u.cps * u.quantity, 0);
}

function buyUpgrade(id) {
  const u = gameState.upgrades.find(x => x.id === id);
  const cost = getUpgradeCost(u);
  if (gameState.clicks >= cost) {
    gameState.clicks -= cost;
    u.quantity++;
    showNotification(`Comprou ${u.name}!`);
    updateDisplay();
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("cpsDisplay").textContent = calcCPS().toFixed(1);

  const list = $("upgradesList");
  list.innerHTML = "";
  gameState.upgrades.forEach(u => {
    const cost = getUpgradeCost(u);
    const btn = document.createElement("button");
    btn.textContent = `Comprar (${formatNumber(cost)})`;
    btn.disabled = gameState.clicks < cost;
    btn.onclick = () => buyUpgrade(u.id);

    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `<strong>${u.name}</strong> x${u.quantity} — ${u.cps} CPS`;
    div.appendChild(btn);
    list.appendChild(div);
  });
}

function showNotification(msg, type = "info") {
  console.log(type.toUpperCase() + ": " + msg);
}

$("clickArea").onclick = () => {
  gameState.clicks++;
  updateDisplay();
};

setInterval(() => {
  gameState.clicks += calcCPS();
  updateDisplay();
}, 1000);

document.addEventListener("DOMContentLoaded", () => {
  updateDisplay();
});

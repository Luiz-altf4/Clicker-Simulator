// === clicker-simulator.js ===
const gameState = {
  clicks: 0,
  xp: 0,
  level: 1,
  rebirths: 0,
  activePet: null,
  upgrades: [
    { id: 1, name: "Cursor", cps: 1, quantity: 0, baseCost: 10 },
    { id: 2, name: "Auto Clicker", cps: 5, quantity: 0, baseCost: 100 },
    { id: 3, name: "Mega Generator", cps: 20, quantity: 0, baseCost: 500 }
  ],
  pets: [
    { id: 1, name: "Gato Pixelado", bonus: 0.05, owned: false },
    { id: 2, name: "Cachorro Robô", bonus: 0.10, owned: false }
  ]
};

const $ = id => document.getElementById(id);

function formatNumber(n) {
  if (n < 1000) return n;
  const units = ["K", "M", "B", "T", "Qa", "Qi"];
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
  let base = gameState.upgrades.reduce((sum, u) => sum + u.cps * u.quantity, 0);
  if (gameState.activePet) {
    const pet = gameState.pets.find(p => p.id === gameState.activePet);
    if (pet) base *= 1 + pet.bonus;
  }
  return base;
}

function buyUpgrade(id) {
  const u = gameState.upgrades.find(x => x.id === id);
  const cost = getUpgradeCost(u);
  if (gameState.clicks >= cost) {
    gameState.clicks -= cost;
    u.quantity++;
    gainXP(5);
    updateDisplay();
    showNotification(`Comprou ${u.name}!`);
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("cpsDisplay").textContent = calcCPS().toFixed(1);
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("levelDisplay").textContent = gameState.level;
  $("rebirthDisplay").textContent = gameState.rebirths;

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

  const petList = $("petsList");
  if (petList) {
    petList.innerHTML = "";
    gameState.pets.forEach(p => {
      const owned = p.owned ? "(Possuído)" : "(Não possuído)";
      const div = document.createElement("div");
      div.className = "pet";
      div.innerHTML = `<strong>${p.name}</strong> ${owned} — +${p.bonus * 100}% CPS`;
      const btn = document.createElement("button");
      btn.textContent = p.owned ? "Ativar" : `Comprar (500)`;
      btn.disabled = !p.owned && gameState.clicks < 500;
      btn.onclick = () => selectPet(p.id);
      div.appendChild(btn);
      petList.appendChild(div);
    });
  }
}

function gainXP(amount) {
  gameState.xp += amount;
  if (gameState.xp >= gameState.level * 100) {
    gameState.xp = 0;
    gameState.level++;
    showNotification(`Você subiu para o nível ${gameState.level}!`, "success");
  }
}

function selectPet(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet.owned && gameState.clicks >= 500) {
    gameState.clicks -= 500;
    pet.owned = true;
    showNotification(`Você comprou ${pet.name}!`);
  }
  if (pet.owned) {
    gameState.activePet = id;
    showNotification(`${pet.name} ativado!`);
  }
  updateDisplay();
}

function doRebirth() {
  if (gameState.clicks >= 100000) {
    gameState.rebirths++;
    gameState.clicks = 0;
    gameState.xp = 0;
    gameState.level = 1;
    gameState.upgrades.forEach(u => u.quantity = 0);
    showNotification("Rebirth realizado!", "success");
    updateDisplay();
  } else {
    showNotification("Você precisa de 100.000 clicks para fazer rebirth!", "error");
  }
}

function showNotification(msg, type = "info") {
  console.log(type.toUpperCase() + ": " + msg);
}

$("clickArea").onclick = () => {
  gameState.clicks++;
  gainXP(1);
  updateDisplay();
};

$("rebirthBtn").onclick = doRebirth;

setInterval(() => {
  gameState.clicks += calcCPS();
  updateDisplay();
}, 1000);

document.addEventListener("DOMContentLoaded", updateDisplay);

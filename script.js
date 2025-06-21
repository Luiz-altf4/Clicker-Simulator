let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplier = 1;
let multiplierCount = 0;
let cps = 0;
let level = 1;
let xp = 0;
let gems = 0;

let speedBoostActive = false;
let multiplierBoostActive = false;

const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

const scoreDisplay = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");
const clickPowerSpan = document.getElementById("clickPower");
const upgradeClickPowerBtn = document.getElementById("upgradeClickPowerBtn");
const upgradeClickPowerCostSpan = document.getElementById("upgradeClickPowerCost");

const autoClickersSpan = document.getElementById("autoClickers");
const autoClickerCostSpan = document.getElementById("autoClickerCost");
const buyAutoClickerBtn = document.getElementById("buyAutoClickerBtn");

const multiplierCostSpan = document.getElementById("multiplierCost");
const multiplierCountSpan = document.getElementById("multiplierCount");
const buyMultiplierBtn = document.getElementById("buyMultiplierBtn");

const cpsDisplay = document.getElementById("cps");
const xpBar = document.getElementById("xpBar");
const levelDisplay = document.getElementById("levelDisplay");
const gemsDisplay = document.getElementById("gemsCount");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

const speedBoostActiveDiv = document.getElementById("speedBoostActive");
const multiplierBoostActiveDiv = document.getElementById("multiplierBoostActive");

// --- CLICKER ---
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  atualizar();
});

// --- UPGRADE: CLICK POWER ---
upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    buySound.play();
    atualizar();
  }
});

// --- UPGRADE: AUTOCLICKER ---
buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    buySound.play();
    atualizar();
  }
});

// --- UPGRADE: MULTIPLICADOR ---
buyMultiplierBtn.addEventListener("click", () => {
  const cost = 100 * (multiplierCount + 1);
  if (score >= cost) {
    score -= cost;
    multiplier *= 2;
    multiplierCount++;
    buySound.play();
    atualizar();
  }
});

// --- BOOST: VELOCIDADE ---
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20 && !speedBoostActive) {
    gems -= 20;
    buySound.play();
    speedBoostActive = true;
    speedBoostActiveDiv.hidden = false;
    boostSound.play();

    let boostInterval = setInterval(() => {
      score += clickPower * multiplier;
      atualizar();
    }, 100);

    setTimeout(() => {
      clearInterval(boostInterval);
      speedBoostActive = false;
      speedBoostActiveDiv.hidden = true;
    }, 30000);

    atualizar();
  }
});

// --- BOOST: MULTIPLICADOR x5 ---
multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50 && !multiplierBoostActive) {
    gems -= 50;
    buySound.play();
    multiplierBoostActive = true;
    multiplierBoostActiveDiv.hidden = false;
    multiplier *= 5;
    boostSound.play();

    setTimeout(() => {
      multiplier /= 5;
      multiplierBoostActive = false;
      multiplierBoostActiveDiv.hidden = true;
      atualizar();
    }, 30000);

    atualizar();
  }
});

// --- LOJA ---
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// --- AUTOCLICK ---
setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
}, 1000);

// --- LEVEL UP ---
function verificarLevelUp() {
  if (xp >= level * 100) {
    xp = 0;
    level++;
    gems += 10;
    buySound.play();
    animarLevelUp();
  }
}

// --- ANIMAÇÃO LEVEL UP ---
function animarLevelUp() {
  levelDisplay.classList.add("level-up");
  setTimeout(() => {
    levelDisplay.classList.remove("level-up");
  }, 1500);
}

// --- ATUALIZA INTERFACE ---
function atualizar() {
  verificarLevelUp();

  scoreDisplay.textContent = Math.floor(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = Math.floor(10 * Math.pow(1.5, clickPower - 1));

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = 50 * (autoClickers + 1

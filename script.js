let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplier = 1;
let multiplierCount = 0;
let cps = 0;
let gems = 0;
let level = 1;
let xp = 0;

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
const gemsDisplay = document.getElementById("gemsCount");

const buyGemsBtn = document.getElementById("buyGemsBtn");

const levelDisplay = document.getElementById("levelDisplay");
const xpBar = document.getElementById("xpBar");

// CLICK
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  atualizar();
});

// UPGRADE CLICK POWER
upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    atualizar();
  }
});

// UPGRADE AUTOCLICKER
buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    atualizar();
  }
});

// UPGRADE MULTIPLICADOR
buyMultiplierBtn.addEventListener("click", () => {
  const cost = 100 * (multiplierCount + 1);
  if (score >= cost) {
    score -= cost;
    multiplier *= 2;
    multiplierCount++;
    atualizar();
  }
});

// COMPRA GEMAS SIMULADO
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  atualizar();
});

// AUTO CLICKER FUNCIONANDO
setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  xp += autoClickers * multiplier;
  atualizar();
}, 1000);

// LEVEL UP
function verificarLevelUp() {
  if (xp >= level * 100) {
    xp = 0;
    level++;
    gems += 10;
  }
}

// ATUALIZA TELA
function atualizar() {
  verificarLevelUp();

  scoreDisplay.textContent = Math.floor(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = Math.floor(10 * Math.pow(1.5, clickPower - 1));

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = 50 * (autoClickers + 1);

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = 100 * (multiplierCount + 1);

  cpsDisplay.textContent = `Clicks por segundo: ${cps}`;
  gemsDisplay.textContent = gems;

  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;
}

// TOGGLE DARK MODE
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// INICIALIZA TELA
window.addEventListener("load", () => {
  atualizar();
});

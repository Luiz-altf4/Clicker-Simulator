let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplier = 1;
let multiplierCount = 0;
let cps = 0;
let gems = 0;
let level = 1;
let xp = 0;

// Elements
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

const levelDisplay = document.getElementById("levelDisplay");
const xpBar = document.getElementById("xpBar");

const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");

// Função para atualizar a interface
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

  salvarProgresso();
}

// Salvar progresso no localStorage automaticamente
function salvarProgresso() {
  const saveData = {
    score,
    clickPower,
    autoClickers,
    multiplier,
    multiplierCount,
    cps,
    gems,
    level,
    xp,
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

// Carregar progresso do localStorage
function carregarProgresso() {
  const saveData = JSON.parse(localStorage.getItem("clickerSave"));
  if (saveData) {
    score = saveData.score;
    clickPower = saveData.clickPower;
    autoClickers = saveData.autoClickers;
    multiplier = saveData.multiplier;
    multiplierCount = saveData.multiplierCount;
    cps = saveData.cps;
    gems = saveData.gems;
    level = saveData.level;
    xp = saveData.xp;
  }
}

// Verificar level up
function verificarLevelUp() {
  if (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

// Eventos
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  atualizar();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    buySound.play();
    atualizar();
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    buySound.play();
    atualizar();
  }
});

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

document.getElementById("buyGemsBtn").addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// Auto clicker
setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  xp += autoClickers * multiplier;
  atualizar();
}, 1000);

// Tema escuro
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Ao carregar a página, carregar progresso salvo e atualizar tela
window.addEventListener("load", () => {
  carregarProgresso();
  atualizar();
});

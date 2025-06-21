// script.js
let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplier = 1;
let multiplierCount = 0;
let cps = 0;
let level = 1;
let xp = 0;
let gems = 0;
let rebirths = 0;

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
const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthCountSpan = document.getElementById("rebirthCount");
const resetBtn = document.getElementById("resetBtn");
const toggleThemeBtn = document.getElementById("toggleThemeBtn");
const shop = document.getElementById("shop");
const toggleShopBtn = document.getElementById("toggleShopBtn");

clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier * (rebirths + 1);
  xp++;
  atualizar();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = 10 * Math.pow(1.5, clickPower);
  if (score >= cost) {
    score -= cost;
    clickPower++;
    atualizar();
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    atualizar();
  }
});

buyMultiplierBtn.addEventListener("click", () => {
  const cost = 100 * Math.pow(2, multiplierCount + 1);
  if (score >= cost) {
    score -= cost;
    multiplier *= 2;
    multiplierCount++;
    atualizar();
  }
});

speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    let interval = setInterval(() => {
      score += clickPower * multiplier * (rebirths + 1);
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(interval), 30000);
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    multiplier *= 5;
    setTimeout(() => {
      multiplier /= 5;
    }, 30000);
  }
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  atualizar();
});

rebirthBtn.addEventListener("click", () => {
  const cost = Math.pow(10, rebirths + 2);
  if (score >= cost) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplier = 1;
    multiplierCount = 0;
    cps = 0;
    level = 1;
    xp = 0;
    rebirths++;
    atualizar();
  }
});

resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza?")) {
    localStorage.clear();
    location.reload();
  }
});

toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

toggleShopBtn.addEventListener("click", () => {
  shop.classList.toggle("hidden");
});

function atualizar() {
  scoreDisplay.textContent = Math.floor(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = Math.floor(10 * Math.pow(1.5, clickPower));
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = 50 * (autoClickers + 1);
  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = Math.floor(100 * Math.pow(2, multiplierCount + 1));
  cps = autoClickers * multiplier * (rebirths + 1);
  cpsDisplay.textContent = `Clicks por segundo: ${cps}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;
  verificarLevelUp();
  salvar();
}

function verificarLevelUp() {
  if (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
  }
}

function salvar() {
  const estado = { score, clickPower, autoClickers, multiplier, multiplierCount, level, xp, gems, rebirths };
  localStorage.setItem("clickerSave", JSON.stringify(estado));
}

function carregar() {
  const estado = JSON.parse(localStorage.getItem("clickerSave"));
  if (estado) {
    Object.assign(window, estado);
  }
}

function comprarItem(item) {
  switch (item) {
    case 'boostCPS': if (gems >= 20) { gems -= 20; let i = setInterval(() => { score += cps }, 100); setTimeout(() => clearInterval(i), 30000); } break;
    case 'boostMultiplicador': if (gems >= 50) { gems -= 50; multiplier *= 5; setTimeout(() => multiplier /= 5, 30000); } break;
    case 'skin1': if (gems >= 100) { gems -= 100; document.body.style.background = "#4b0082"; } break;
    case 'skin2': if (gems >= 100) { gems -= 100; document.body.style.background = "#003300"; } break;
    case 'xpBoost': if (gems >= 30) { gems -= 30; xp += 500; } break;
    case 'rebirthBonus': if (gems >= 200) { gems -= 200; rebirths += 1; } break;
    case 'buyGems100': gems += 100; break;
    case 'buyGems500': gems += 500; break;
  }
  atualizar();
}

setInterval(() => {
  score += cps;
  atualizar();
}, 1000);

window.onload = () => {
  carregar();
  atualizar();
};

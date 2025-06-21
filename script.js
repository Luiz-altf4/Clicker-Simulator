let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplier = 1;
let multiplierCount = 0;
let cps = 0;
let level = 1;
let xp = 0;
let gems = 0;

// Sons
const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

// Elementos
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

const toggleThemeBtn = document.getElementById("toggleThemeBtn");

// --- Função para formatar números grandes (k, M, B, etc) ---
function formatNumber(num) {
  if (num < 1000) return num.toString();
  const units = ["k", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "Dc", "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd", "Nd", "Vg", "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg", "NVg", "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg", "NTg", "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg", "NQg", "Qq", "UQq"];
  let unitIndex = -1;
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  return num.toFixed(2).replace(/\.?0+$/, '') + units[unitIndex];
}

// --- CLICKER ---
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  verificarLevelUp();
  atualizar();
  salvarJogo();
});

// --- UPGRADE: CLICK POWER ---
upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    buySound.play();
    atualizar();
    salvarJogo();
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
    salvarJogo();
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
    salvarJogo();
  }
});

// --- BOOST: VELOCIDADE ---
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    buySound.play();
    const boost = setInterval(() => {
      score += clickPower * multiplier;
      verificarLevelUp();
      atualizar();
      salvarJogo();
    }, 100);
    setTimeout(() => clearInterval(boost), 30000);
  }
});

// --- BOOST: MULTIPLICADOR x5 ---
multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    buySound.play();
    multiplier *= 5;
    atualizar();
    salvarJogo();
    setTimeout(() => {
      multiplier /= 5;
      atualizar();
      salvarJogo();
    }, 30000);
  }
});

// --- LOJA ---
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
  salvarJogo();
});

// --- AUTOCLICK ---
setInterval(() => {
  if (autoClickers > 0) {
    score += autoClickers * multiplier;
    cps = autoClickers * multiplier;
    verificarLevelUp();
    atualizar();
    salvarJogo();
  }
}, 1000);

// --- LEVEL UP ---
function verificarLevelUp() {
  if (xp >= level * 100) {
    xp = 0;
    level++;
    gems += 10;
    buySound.play();
  }
}

// --- ATUALIZA INTERFACE ---
function atualizar() {
  scoreDisplay.textContent = formatNumber(Math.floor(score));
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = formatNumber(Math.floor(10 * Math.pow(1.5, clickPower - 1)));

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatNumber(50 * (autoClickers + 1));

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatNumber(100 * (multiplierCount + 1));

  cpsDisplay.textContent = `Clicks por segundo: ${formatNumber(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;

  gemsDisplay.textContent = formatNumber(gems);
}

// --- TEMA ---
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});

// --- SALVAR JOGO ---
function salvarJogo() {
  const estado = {
    score,
    clickPower,
    autoClickers,
    multiplier,
    multiplierCount,
    cps,
    level,
    xp,
    gems,
    theme: document.body.classList.contains("dark") ? "dark" : "light"
  };
  localStorage.setItem("clickerSave", JSON.stringify(estado));
}

// --- CARREGAR JOGO ---
function carregarJogo() {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    try {
      const estado = JSON.parse(save);
      score = estado.score || 0;
      clickPower = estado.clickPower || 1;
      autoClickers = estado.autoClickers || 0;
      multiplier = estado.multiplier || 1;
      multiplierCount = estado.multiplierCount || 0;
      cps = estado.cps || 0;
      level = estado.level || 1;
      xp = estado.xp || 0;
      gems = estado.gems || 0;
      if (estado.theme === "dark") {
        document.body.classList.add("dark");
      } else {
        document.body.classList.remove("dark");
      }
    } catch {
      // Se o JSON estiver corrompido, ignora.
    }
  }
  atualizar();
}

// --- INICIALIZAÇÃO ---
window.addEventListener("load", () => {
  carregarJogo();
});


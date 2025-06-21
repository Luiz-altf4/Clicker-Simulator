// Variáveis principais
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
let batchAmount = 1; // Para botões 1x, 10x, 100x

// Sons
const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

// Elementos DOM
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
const rebirthInfo = document.getElementById("rebirthInfo");

const resetBtn = document.getElementById("resetBtn");

const batchButtons = document.querySelectorAll(".batch-btn");

// Formatação números grande escala
function formatNumber(num) {
  if (num < 1000) return num.toFixed(0);
  const units = [
    "", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "Dc",
    "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd", "Nd", "Vg",
    "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg", "NVg",
    "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg", "NTg",
    "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg", "NQg",
    "Qq", "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq", "NQq",
    "Sg", "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg", "NSg",
    "Sgnt", "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt", "SSgnt", "SpSgnt", "OSgnt", "NSgnt"
  ];
  const tier = Math.floor(Math.log10(num) / 3);
  if (tier >= units.length) return num.toExponential(2);
  const scale = Math.pow(10, tier * 3);
  const scaled = num / scale;
  return scaled.toFixed(2) + units[tier];
}

// Salvar no localStorage
function saveGame() {
  const data = {
    score, clickPower, autoClickers, multiplier, multiplierCount,
    cps, level, xp, gems, rebirths
  };
  localStorage.setItem("clickerSave", JSON.stringify(data));
}

// Carregar do localStorage
function loadGame() {
  const saved = localStorage.getItem("clickerSave");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      score = data.score || 0;
      clickPower = data.clickPower || 1;
      autoClickers = data.autoClickers || 0;
      multiplier = data.multiplier || 1;
      multiplierCount = data.multiplierCount || 0;
      cps = data.cps || 0;
      level = data.level || 1;
      xp = data.xp || 0;
      gems = data.gems || 0;
      rebirths = data.rebirths || 0;
    } catch {
      resetGame();
    }
  }
}

// Resetar jogo
function resetGame() {
  if (!confirm("Tem certeza que quer resetar o jogo? Isso apagará todo progresso!")) return;
  score = 0;
  clickPower = 1;
  autoClickers = 0;
  multiplier = 1;
  multiplierCount = 0;
  cps = 0;
  level = 1;
  xp = 0;
  gems = 0;
  rebirths = 0;
  saveGame();
  atualizar();
}

// Rebirth - renascimento
function canRebirth() {
  return score >= 1e12; // 1 Trilhão pontos para rebirth
}

function doRebirth() {
  if (!canRebirth()) {
    alert("Você precisa de pelo menos 1 Trilhão de pontos para renascer!");
    return;
  }
  if (!confirm("Tem certeza que quer renascer? Isso resetará progresso mas dará bônus!")) return;

  rebirths++;
  // Resetar quase tudo, mas mantendo rebirths e talvez bônus
  score = 0;
  clickPower = 1;
  autoClickers = 0;
  multiplier = 1;
  multiplierCount = 0;
  cps = 0;
  level = 1;
  xp = 0;
  gems = 0;

  alert(`Você renasceu! Total de renascimentos: ${rebirths}`);

  saveGame();
  atualizar();
}

// Atualizar UI
function atualizar() {
  verificarLevelUp();

  scoreDisplay.textContent = formatNumber(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = formatNumber(calcUpgradeClickPowerCost() * batchAmount);

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatNumber(calcAutoClickerCost() * batchAmount);

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatNumber(calcMultiplierCost() * batchAmount);

  cpsDisplay.textContent = `Clicks por segundo: ${formatNumber(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;

  gemsDisplay.textContent = formatNumber(gems);

  // Atualizar botão rebirth
  rebirthBtn.disabled = !canRebirth();
  rebirthInfo.textContent = `Você precisa de 1T pontos para renascer. Renascimentos: ${rebirths}`;

  saveGame();
}

// Cálculo de custos levando em conta batch e quantidade
function calcUpgradeClickPowerCost() {
  let cost = 0;
  for (let i = 0; i < batchAmount; i++) {
    cost += Math.floor(10 * Math.pow(1.5, (clickPower - 1) + i));
  }
  return cost;
}

function calcAutoClickerCost() {
  let cost = 0;
  for (let i = 0; i < batchAmount; i++) {
    cost += 50 * (autoClickers + 1 + i);
  }
  return cost;
}

function calcMultiplierCost() {
  let cost = 0;
  for (let i = 0; i < batchAmount; i++) {
    cost += 100 * (multiplierCount + 1 + i);
  }
  return cost;
}

// Level up
function verificarLevelUp() {
  if (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

// Eventos

// Clique manual
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier * batchAmount;
  xp += batchAmount;
  clickSound.play();
  atualizar();
});

// Upgrades

upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = calcUpgradeClickPowerCost();
  if (score >= cost) {
    score -= cost;
    clickPower += batchAmount;
    buySound.play();
    atualizar();
  } else {
    alert("Você não tem pontos suficientes para comprar essa melhoria!");
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const cost = calcAutoClickerCost();
  if (score >= cost) {
    score -= cost;
    autoClickers += batchAmount;
    buySound.play();
    atualizar();
  } else {
    alert("Você não tem pontos suficientes para comprar esse Auto Clicker!");
  }
});

buyMultiplierBtn.addEventListener("click", () => {
  const cost = calcMultiplierCost();
  if (score >= cost) {
    score -= cost;
    for (let i = 0; i < batchAmount; i++) multiplier *= 2;
    multiplierCount += batchAmount;
    buySound.play();
    atualizar();
  } else {
    alert("Você não tem pontos suficientes para comprar esse multiplicador!");
  }
});

// Boosts

speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    buySound.play();
    let boost = setInterval(() => {
      score += clickPower * multiplier;
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(boost), 30000);
  } else {
    alert("Você não tem gemas suficientes para o boost de velocidade.");
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    buySound.play();
    multiplier *= 5;
    atualizar();
    setTimeout(() => {
      multiplier /= 5;
      atualizar();
    }, 30000);
  } else {
    alert("Você não tem gemas suficientes para o boost multiplicador.");
  }
});

// Comprar gemas (simulado)
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// Auto clickers (1 vez por segundo)
setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
}, 1000);

// Batch buttons seleção

batchButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    batchButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    batchAmount = parseInt(btn.dataset.batch);
    atualizar();
  });
});

// Rebirth

rebirthBtn.addEventListener("click", () => {
  doRebirth();
});

// Reset

resetBtn.addEventListener("click", () => {
  resetGame();
});

// Tema toggle

document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Ao carregar página
window.addEventListener("load", () => {
  loadGame();
  atualizar();
});

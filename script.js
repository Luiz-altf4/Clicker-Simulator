// === VARIÁVEIS DO JOGO ===
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
let world = 1;

const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

let upgradeAmount = 1;

// === FORMATAÇÃO DE NÚMEROS ===
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "Dc"];
  let ordem = Math.floor(Math.log10(num) / 3);
  ordem = Math.min(ordem, unidades.length - 1);
  return (num / Math.pow(1000, ordem)).toFixed(2) + unidades[ordem];
}

// === ELEMENTOS DOM ===
const scoreDisplay = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");
const clickPowerSpan = document.getElementById("clickPower");

const upgradeClickPowerBtn = document.getElementById("upgradeClickPowerBtn");
const upgradeClickPowerCostSpan = document.getElementById("upgradeClickPowerCost");

const autoClickersSpan = document.getElementById("autoClickers");
const autoClickerCostSpan = document.getElementById("autoClickerCost");
const buyAutoClickerBtn = document.getElementById("buyAutoClickerBtn");

const multiplierCountSpan = document.getElementById("multiplierCount");
const multiplierCostSpan = document.getElementById("multiplierCost");
const buyMultiplierBtn = document.getElementById("buyMultiplierBtn");

const cpsDisplay = document.getElementById("cps");
const levelDisplay = document.getElementById("levelDisplay");
const xpBar = document.getElementById("xpBar");
const gemsDisplay = document.getElementById("gemsCount");
const rebirthCountSpan = document.getElementById("rebirthCount");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

const rebirthBtn = document.getElementById("rebirthBtn");
const resetBtn = document.getElementById("resetBtn");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");

const worldDisplay = document.getElementById("currentWorld");
const changeWorldBtn = document.getElementById("changeWorldBtn");

// === FUNÇÕES DE CUSTO ===
function custoUpgradeClickPower() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
}

function custoAutoClicker() {
  return 50 * (autoClickers + 1) * upgradeAmount;
}

function custoMultiplicador() {
  let total = 0;
  for (let i = 0; i < upgradeAmount; i++) {
    total += 100 * (multiplierCount + i + 1);
  }
  return total;
}

function custoRebirth() {
  return Math.pow(10, rebirths + 3);
}

// === ATUALIZAR INTERFACE ===
function atualizar() {
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  upgradeClickPowerCostSpan.textContent = formatarNumero(custoUpgradeClickPower());
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(custoAutoClicker());
  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatarNumero(custoMultiplicador());
  cpsDisplay.textContent = `CPS: ${formatarNumero(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${Math.min((xp / (level * 100)) * 100, 100)}%`;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;
  worldDisplay.textContent = `Mundo: ${world}`;

  salvarEstado();
}

// === LEVEL UP ===
function verificarLevelUp() {
  while (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

// === ESTADO (SALVAR/CARREGAR) ===
function salvarEstado() {
  const estado = { score, clickPower, autoClickers, multiplier, multiplierCount, cps, level, xp, gems, rebirths, world };
  localStorage.setItem("clickerSave", JSON.stringify(estado));
}

function carregarEstado() {
  const estado = JSON.parse(localStorage.getItem("clickerSave"));
  if (estado) {
    score = estado.score ?? 0;
    clickPower = estado.clickPower ?? 1;
    autoClickers = estado.autoClickers ?? 0;
    multiplierCount = estado.multiplierCount ?? 0;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    cps = estado.cps ?? 0;
    level = estado.level ?? 1;
    xp = estado.xp ?? 0;
    gems = estado.gems ?? 0;
    rebirths = estado.rebirths ?? 0;
    world = estado.world ?? 1;
  }
}

// === BOTÕES DE UPGRADE ===
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp++;
  clickSound.play();
  verificarLevelUp();
  atualizar();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  const custo = custoUpgradeClickPower();
  if (score >= custo) {
    score -= custo;
    clickPower += upgradeAmount;
    buySound.play();
    atualizar();
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const custo = custoAutoClicker();
  if (score >= custo) {
    score -= custo;
    autoClickers += upgradeAmount;
    buySound.play();
    atualizar();
  }
});

buyMultiplierBtn.addEventListener("click", () => {
  const custo = custoMultiplicador();
  if (score >= custo) {
    score -= custo;
    multiplierCount += upgradeAmount;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.play();
    atualizar();
  }
});

// BOOSTS
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    boostSound.play();
    const interval = setInterval(() => {
      score += clickPower * multiplier;
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(interval), 30000);
    atualizar();
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    multiplier *= 5;
    boostSound.play();
    setTimeout(() => {
      multiplier /= 5;
      atualizar();
    }, 30000);
    atualizar();
  }
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// REBIRTH
rebirthBtn.addEventListener("click", () => {
  const custo = custoRebirth();
  if (score >= custo) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplier = 1;
    multiplierCount = 0;
    level = 1;
    xp = 0;
    rebirths++;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.play();
    atualizar();
  }
});

// RESET
resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja resetar o jogo?")) {
    localStorage.clear();
    location.reload();
  }
});

// TROCA DE MUNDO
changeWorldBtn?.addEventListener("click", () => {
  world++;
  score = 0;
  autoClickers = 0;
  clickPower = 1;
  multiplier = 1;
  multiplierCount = 0;
  level = 1;
  xp = 0;
  gems = 0;
  atualizar();
});

// QUANTIDADE DE UPGRADE
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmount = btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// AUTOCLICKER AUTOMÁTICO
setInterval(() => {
  const ganho = autoClickers * multiplier;
  score += ganho;
  cps = ganho;
  atualizar();
}, 1000);

// === INICIALIZAÇÃO ===
window.addEventListener("load", () => {
  carregarEstado();
  atualizar();
});

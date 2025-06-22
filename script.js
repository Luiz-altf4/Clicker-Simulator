// --- Variáveis do jogo ---
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
let upgradeAmount = 1;

const mundos = ["Terra", "Lua", "Marte", "Júpiter", "Saturno", "Netuno", "Plutão", "Sun"];
let mundoIndex = 0;

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
const rebirthCountSpan = document.getElementById("rebirthCount");
const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");
const rebirthBtn = document.getElementById("rebirthBtn");
const resetBtn = document.getElementById("resetBtn");
const nextWorldBtn = document.getElementById("nextWorldBtn");
const worldName = document.getElementById("worldName");
const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");

// Custo rebirth exponencial
const rebirthCostsPowers = Array.from({ length: 100 }, (_, i) => 3 * (i + 1));
function custoRebirth(rebirthCount) {
  return Math.pow(10, rebirthCostsPowers[Math.min(rebirthCount, rebirthCostsPowers.length - 1)]);
}

// Formatação de número grande
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  let ordem = Math.floor(Math.log10(num) / 3);
  ordem = Math.min(ordem, unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

// Custos
function custoUpgradeClickPower() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
}
function custoAutoClicker() {
  return 50 * (autoClickers + 1) * upgradeAmount;
}
function custoMultiplicador() {
  let custo = 0;
  for (let i = 0; i < upgradeAmount; i++) {
    custo += 100 * (multiplierCount + i + 1);
  }
  return custo;
}

// Salvar e carregar
function salvarEstado() {
  const estado = {
    score, clickPower, autoClickers, multiplier, multiplierCount,
    cps, level, xp, gems, rebirths, mundoIndex
  };
  localStorage.setItem("clickerSimEstado", JSON.stringify(estado));
}
function carregarEstado() {
  const estado = localStorage.getItem("clickerSimEstado");
  if (estado) {
    const obj = JSON.parse(estado);
    score = obj.score ?? 0;
    clickPower = obj.clickPower ?? 1;
    autoClickers = obj.autoClickers ?? 0;
    multiplierCount = obj.multiplierCount ?? 0;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    cps = obj.cps ?? 0;
    level = obj.level ?? 1;
    xp = obj.xp ?? 0;
    gems = obj.gems ?? 0;
    rebirths = obj.rebirths ?? 0;
    mundoIndex = obj.mundoIndex ?? 0;
  }
}

// Atualização geral
function atualizar() {
  verificarLevelUp();
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  upgradeClickPowerCostSpan.textContent = formatarNumero(custoUpgradeClickPower());
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(custoAutoClicker());
  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatarNumero(custoMultiplicador());
  cpsDisplay.textContent = `CPS: ${formatarNumero(cps)}`;
  levelDisplay.textContent = level;
  xpBar.style.width = `${Math.min((xp / (level * 100)) * 100, 100)}%`;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;
  worldName.textContent = mundos[mundoIndex] ?? "???";
  salvarEstado();
}

function verificarLevelUp() {
  while (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

// Eventos principais
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp++;
  clickSound.play();
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
    atualizar();
    setTimeout(() => {
      multiplier /= 5;
      atualizar();
    }, 30000);
  }
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

rebirthBtn.addEventListener("click", () => {
  const custo = custoRebirth(rebirths);
  if (score >= custo) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1;
    cps = 0;
    level = 1;
    xp = 0;
    rebirths++;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.play();
    atualizar();
  }
});

nextWorldBtn.addEventListener("click", () => {
  if (rebirths >= 1 && mundoIndex < mundos.length - 1) {
    mundoIndex++;
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1;
    level = 1;
    xp = 0;
    gems = 0;
    cps = 0;
    buySound.play();
    alert("Novo mundo desbloqueado: " + mundos[mundoIndex]);
    atualizar();
  } else {
    alert("Você precisa de pelo menos 1 Rebirth para mudar de mundo ou já está no último.");
  }
});

resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja resetar o jogo?")) {
    localStorage.clear();
    location.reload();
  }
});

upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const val = btn.dataset.amount;
    if (val === "max") {
      const custoUnit = 10 * Math.pow(1.5, clickPower - 1);
      upgradeAmount = Math.floor(score / custoUnit);
    } else {
      upgradeAmount = parseInt(val);
    }
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Auto Click
setInterval(() => {
  const ganho = autoClickers * multiplier;
  score += ganho;
  cps = ganho;
  atualizar();
}, 1000);

// Tema
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// Inicializa o jogo
window.addEventListener("load", () => {
  carregarEstado();
  atualizar();
});

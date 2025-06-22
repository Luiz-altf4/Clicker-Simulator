// --- Variáveis do jogo ---
let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplierCount = 0;
let multiplier = 1;
let cps = 0;
let level = 1;
let xp = 0;
let gems = 0;
let rebirths = 0;
let currentWorld = "Terra";

const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

// DOM Elements
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
const currentWorldSpan = document.getElementById("currentWorld");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

const rebirthBtn = document.getElementById("rebirthBtn");
const resetBtn = document.getElementById("resetBtn");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
let upgradeAmount = 1;

// Função para formatar números grandes
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc",
    "N", "Dc", "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd",
    "Nd", "Vg", "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg",
    "NVg", "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg",
    "NTg", "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg",
    "NQg", "Qq", "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq",
    "NQq", "Sg", "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg",
    "NSg", "Sgnt", "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt", "SSgnt", "SpSgnt", "OSgnt", "NSgnt",
    "Ogt", "UOgt", "DOgt", "TOgt", "QOgt", "QnOgt", "SOgt", "SpOgt", "OOgt", "NOgt",
    "Ng", "UNg", "DNn", "TNn", "QNn", "QnNn", "SNn", "SpNn", "ONn", "NNn",
    "OLPWO", "NdOs", "NSposk", "Ldm", "Huoop", "Nowid", "Infernal", "Nallk", "Alsk",
    "SEoiUd", "A", "B", "C", "D", "E",
    "AB", "AC", "AD", "AE", "Comdwi", "CMD", "Gfsppdo", "osiwop", "OOOOOOOgtu",
    "DQtgSqSp", "omhfooe", "AqTpzRf", "mNsEjkD", "BdLuwXo", "zXnsjk", "EqPOXW", "VCSOK",
  ];

  let unidadeIndex = 0;
  let n = num;
  while (n >= 1000 && unidadeIndex < unidades.length - 1) {
    n /= 1000;
    unidadeIndex++;
  }
  return n.toFixed(2) + unidades[unidadeIndex];
}

// Função para salvar no localStorage
function salvar() {
  const saveData = {
    score,
    clickPower,
    autoClickers,
    multiplierCount,
    multiplier,
    cps,
    level,
    xp,
    gems,
    rebirths,
    currentWorld,
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

// Função para carregar do localStorage
function carregar() {
  const saveData = JSON.parse(localStorage.getItem("clickerSave"));
  if (saveData) {
    score = saveData.score || 0;
    clickPower = saveData.clickPower || 1;
    autoClickers = saveData.autoClickers || 0;
    multiplierCount = saveData.multiplierCount || 0;
    multiplier = saveData.multiplier || 1;
    cps = saveData.cps || 0;
    level = saveData.level || 1;
    xp = saveData.xp || 0;
    gems = saveData.gems || 0;
    rebirths = saveData.rebirths || 0;
    currentWorld = saveData.currentWorld || "Terra";
  }
}

// Atualiza a UI
function atualizarUI() {
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  autoClickersSpan.textContent = autoClickers;
  multiplierCountSpan.textContent = multiplierCount;
  upgradeClickPowerCostSpan.textContent = formatarNumero(getUpgradeClickPowerCost());
  autoClickerCostSpan.textContent = formatarNumero(getAutoClickerCost());
  multiplierCostSpan.textContent = formatarNumero(getMultiplierCost());
  cpsDisplay.textContent = "Clicks por segundo: " + formatarNumero(cps);
  levelDisplay.textContent = "Nível: " + level;
  gemsDisplay.textContent = formatarNumero(gems);
  rebirthCountSpan.textContent = rebirths;
  currentWorldSpan.textContent = currentWorld;

  // Atualiza barra de XP
  const xpNeeded = level * 100;
  const xpPercent = Math.min((xp / xpNeeded) * 100, 100);
  xpBar.style.width = xpPercent + "%";
}

// Custos crescentes
function getUpgradeClickPowerCost() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1));
}

function getAutoClickerCost() {
  return Math.floor(50 * Math.pow(1.6, autoClickers));
}

function getMultiplierCost() {
  return Math.floor(100 * Math.pow(2, multiplierCount));
}

// Lógica de clique
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += clickPower * multiplier;
  clickSound.currentTime = 0;
  clickSound.play();
  verificarLevelUp();
  atualizarUI();
  salvar();
});

// Compra upgrades
function comprarUpgrade(qtd) {
  let amount = qtd;

  if (qtd === "max") {
    amount = calcularMaximoUpgrade();
  }

  // Upgrade Click Power
  let custoTotal = 0;
  let custo = 0;
  for (let i = 0; i < amount; i++) {
    custo = getUpgradeClickPowerCost() * Math.pow(1.5, i);
    custoTotal += custo;
  }

  if (score >= custoTotal) {
    score -= custoTotal;
    clickPower += amount;
    buySound.currentTime = 0;
    buySound.play();
    atualizarUI();
    salvar();
  }
}

// Calcula máximo possível para comprar upgrades baseado no score
function calcularMaximoUpgrade() {
  let max = 0;
  let tempScore = score;
  while (tempScore >= getUpgradeClickPowerCost() * Math.pow(1.5, max)) {
    tempScore -= getUpgradeClickPowerCost() * Math.pow(1.5, max);
    max++;
  }
  return max;
}

// Botão upgrade click power
upgradeClickPowerBtn.addEventListener("click", () => {
  comprarUpgrade(upgradeAmount);
});

// AutoClicker
buyAutoClickerBtn.addEventListener("click", () => {
  let cost = getAutoClickerCost() * upgradeAmount;
  if (upgradeAmount === "max") {
    // calcular máximo para autoclickers
    let maxBuy = 0;
    let tempScore = score;
    let costForOne = getAutoClickerCost();
    while (tempScore >= costForOne) {
      tempScore -= costForOne;
      maxBuy++;
      costForOne = getAutoClickerCost() * Math.pow(1.6, maxBuy);
    }
    if (maxBuy > 0) {
      autoClickers += maxBuy;
      score -= score - tempScore;
      buySound.currentTime = 0;
      buySound.play();
      atualizarUI();
      salvar();
    }
    return;
  }
  if (score >= cost) {
    autoClickers += upgradeAmount;
    score -= cost;
    buySound.currentTime = 0;
    buySound.play();
    atualizarUI();
    salvar();
  }
});

// Multiplicador
buyMultiplierBtn.addEventListener("click", () => {
  let cost = getMultiplierCost() * upgradeAmount;
  if (upgradeAmount === "max") {
    // calcular máximo para multipliers
    let maxBuy = 0;
    let tempScore = score;
    let costForOne = getMultiplierCost();
    while (tempScore >= costForOne) {
      tempScore -= costForOne;
      maxBuy++;
      costForOne = getMultiplierCost() * Math.pow(2, maxBuy);
    }
    if (maxBuy > 0) {
      multiplierCount += maxBuy;
      multiplier = Math.pow(2, multiplierCount);
      score -= score - tempScore;
      buySound.currentTime = 0;
      buySound.play();
      atualizarUI();
      salvar();
    }
    return;
  }
  if (score >= cost) {
    multiplierCount += upgradeAmount;
    multiplier = Math.pow(2, multiplierCount);
    score -= cost;
    buySound.currentTime = 0;
    buySound.play();
    atualizarUI();
    salvar();
  }
});

// Atualiza o upgradeAmount quando clicar nos botões 1, 10, 100, 1000, max
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const val = btn.dataset.amount;
    upgradeAmount = val === "max" ? "max" : parseInt(val);
  });
});

// AutoClickers geram clicks automaticamente
setInterval(() => {
  if (autoClickers > 0) {
    const clicks = autoClickers * clickPower * multiplier;
    score += clicks;
    xp += clicks;
    verificarLevelUp();
    atualizarUI();
    salvar();
  }
}, 1000);

// Calcula CPS para mostrar na tela
function calcularCPS() {
  cps = autoClickers * clickPower * multiplier;
  atualizarUI();
}
setInterval(calcularCPS, 1000);

// Verifica se subiu de nível
function verificarLevelUp() {
  const xpNeeded = level * 100;
  if (xp >= xpNeeded) {
    xp -= xpNeeded;
    level++;
    buySound.currentTime = 0;
    buySound.play();
  }
}

// Boosts (exemplo)
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    // Aumenta a velocidade dos autoclickers temporariamente
    boostSound.currentTime = 0;
    boostSound.play();
    alert("Boost de Velocidade ativado por 30 segundos!");
    // Implementar boost real no código se quiser
    atualizarUI();
    salvar();
  } else alert("Você não tem gemas suficientes!");
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    multiplier *= 2;
    boostSound.currentTime = 0;
    boostSound.play();
    alert("Boost de Multiplicador ativado por 30 segundos!");
    atualizarUI();
    salvar();
  } else alert("Você não tem gemas suficientes!");
});

buyGemsBtn.addEventListener("click", () => {
  score += 1000; // só para teste, substitua por sistema real de compra
  alert("Você comprou 100 gemas!");
  atualizarUI();
  salvar();
});

// Rebirth
rebirthBtn.addEventListener("click", () => {
  if (score >= 100000) {
    rebirths++;
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1;
    level = 1;
    xp = 0;
    gems += 10 * rebirths;
    alert("Você fez Rebirth! Agora seu multiplicador é maior!");
    atualizarUI();
    salvar();
  } else {
    alert("Você precisa de 100.000 clicks para fazer Rebirth!");
  }
});

// Resetar jogo
resetBtn.addEventListener("click", () => {
  if (confirm("Quer mesmo resetar o jogo?")) {
    localStorage.clear();
    location.reload();
  }
});

// Loja - exemplo simples
document.querySelectorAll(".shop-buy").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.dataset.item;
    const cost = parseInt(btn.dataset.cost);
    if (score >= cost) {
      score -= cost;
      alert(`Você comprou: ${item}!`);
      buySound.currentTime = 0;
      buySound.play();
      atualizarUI();
      salvar();
    } else {
      alert("Clicks insuficientes para comprar este item!");
    }
  });
});

// Tema escuro/claro
const toggleThemeBtn = document.getElementById("toggleThemeBtn");
toggleThemeBtn.addEventListener("click", () => {
  if (document.documentElement.getAttribute("data-theme") === "dark") {
    document.documentElement.removeAttribute("data-theme");
    toggleThemeBtn.textContent = "🌙";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    toggleThemeBtn.textContent = "☀️";
  }
});

// Salvar e carregar ao iniciar
window.addEventListener("load", () => {
  carregar();
  atualizarUI();
});

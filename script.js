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

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
let upgradeAmount = 1; // Pode ser 1,10,100,1000 ou 'max'

// --- Constantes para custo (usando BigInt) ---
const baseClickPowerCost = 10n;
const clickPowerGrowthNum = 15n;  // representa 1.5 * 10
const clickPowerGrowthDen = 10n;

const baseAutoClickerCost = 50n;
const autoClickerGrowth = 1n;

const baseMultiplierCost = 100n;

// --- Funções auxiliares ---

// Potência para BigInt decimal (ex: 1.5^n)
function powBigInt(baseNum, exponent, baseDen) {
  let result = baseDen;
  let b = baseNum;
  let e = BigInt(exponent);

  while (e > 0) {
    if (e % 2n === 1n) {
      result = (result * b) / baseDen;
    }
    b = (b * b) / baseDen;
    e /= 2n;
  }
  return result;
}

// Formatar números com unidades gigantes
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc",
  "N", "Dc", "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd",
  "Nd", "Vg", "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg",
  "NVg", "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg",
  "NTg", "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg",
  "NQg", "Qq", "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq",
  "NQq", "Sg", "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg",
  "NSg", "Sgnt", "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt", "SSgnt", "SpSgnt", "OSgnt",
  "NSgnt"];
  let e = Math.floor(Math.log10(num) / 3);
  let val = num / Math.pow(1000, e);
  return val.toFixed(2) + unidades[e] || "";
}

// --- Funções de custo ---

function custoClickPowerItem(n) {
  // custo base * 1.5^(n-1)
  return baseClickPowerCost * powBigInt(clickPowerGrowthNum, BigInt(n - 1), clickPowerGrowthDen);
}

function custoTotalClickPower(qtd, atual) {
  if (qtd <= 0) return 0n;
  const r = powBigInt(clickPowerGrowthNum, 1n, clickPowerGrowthDen);
  const first = custoClickPowerItem(atual);
  let rn = powBigInt(clickPowerGrowthNum, BigInt(qtd), clickPowerGrowthDen);
  let numerator = (first * rn) - first;
  let denominator = r - 1n;
  return numerator / denominator;
}

function custoTotalAutoClicker(qtd, atual) {
  if (qtd <= 0) return 0n;
  let n = BigInt(qtd);
  let a1 = baseAutoClickerCost * (BigInt(atual) + 1n);
  let d = autoClickerGrowth;
  return (n * (2n * a1 + (n - 1n) * d)) / 2n;
}

function custoTotalMultiplier(qtd, atual) {
  if (qtd <= 0) return 0n;
  let n = BigInt(qtd);
  let a1 = baseMultiplierCost * (BigInt(atual) + 1n);
  let d = baseMultiplierCost;
  return (n * (2n * a1 + (n - 1n) * d)) / 2n;
}

// --- Busca binária para calcular máximo ---

function calcularMaxClickPower(scoreAtual, atual) {
  let left = 0;
  let right = 1000000;
  let max = 0;
  let scoreBig = BigInt(scoreAtual);

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    let custo = custoTotalClickPower(mid, atual);
    if (custo <= scoreBig) {
      max = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return max;
}

function calcularMaxAutoClicker(scoreAtual, atual) {
  let left = 0;
  let right = 1000000;
  let max = 0;
  let scoreBig = BigInt(scoreAtual);

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    let custo = custoTotalAutoClicker(mid, atual);
    if (custo <= scoreBig) {
      max = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return max;
}

function calcularMaxMultiplier(scoreAtual, atual) {
  let left = 0;
  let right = 1000000;
  let max = 0;
  let scoreBig = BigInt(scoreAtual);

  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    let custo = custoTotalMultiplier(mid, atual);
    if (custo <= scoreBig) {
      max = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return max;
}

// --- Atualizar valores na tela ---
function atualizar() {
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  autoClickersSpan.textContent = autoClickers;
  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatarNumero(Number(custoTotalMultiplier(1, multiplierCount)));
  upgradeClickPowerCostSpan.textContent = formatarNumero(Number(custoTotalClickPower(1, clickPower)));
  autoClickerCostSpan.textContent = formatarNumero(Number(custoTotalAutoClicker(1, autoClickers)));
  cps = clickPower * multiplier * autoClickers;
  cpsDisplay.textContent = `Clicks por segundo: ${formatarNumero(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  gemsDisplay.textContent = formatarNumero(gems);
  rebirthCountSpan.textContent = rebirths;

  // Atualizar barra de XP (supondo xp max 100 para demo)
  let xpPercent = Math.min(100, (xp / 100) * 100);
  xpBar.style.width = `${xpPercent}%`;
}

// --- Eventos dos botões ---

// Seleção do upgradeAmount
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    upgradeAmountBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.amount === "max") {
      upgradeAmount = "max";
    } else {
      upgradeAmount = Number(btn.dataset.amount);
    }
  });
});

// Click principal
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  clickSound.currentTime = 0;
  clickSound.play();
  atualizar();
});

// Comprar Click Power
upgradeClickPowerBtn.addEventListener("click", () => {
  if (upgradeAmount === "max") {
    let maxComprar = calcularMaxClickPower(score, clickPower);
    if (maxComprar > 0) comprarClickPower(maxComprar);
  } else {
    comprarClickPower(upgradeAmount);
  }
});

// Comprar AutoClicker
buyAutoClickerBtn.addEventListener("click", () => {
  if (upgradeAmount === "max") {
    let maxComprar = calcularMaxAutoClicker(score, autoClickers);
    if (maxComprar > 0) comprarAutoClicker(maxComprar);
  } else {
    comprarAutoClicker(upgradeAmount);
  }
});

// Comprar Multiplicador
buyMultiplierBtn.addEventListener("click", () => {
  if (upgradeAmount === "max") {
    let maxComprar = calcularMaxMultiplier(score, multiplierCount);
    if (maxComprar > 0) comprarMultiplier(maxComprar);
  } else {
    comprarMultiplier(upgradeAmount);
  }
});

// Comprar funções

function comprarClickPower(qtd) {
  let custo = custoTotalClickPower(qtd, clickPower);
  if (BigInt(score) >= custo) {
    score -= Number(custo);
    clickPower += qtd;
    buySound.currentTime = 0;
    buySound.play();
    atualizar();
  } else {
    alert("Clicks insuficientes!");
  }
}

function comprarAutoClicker(qtd) {
  let custo = custoTotalAutoClicker(qtd, autoClickers);
  if (BigInt(score) >= custo) {
    score -= Number(custo);
    autoClickers += qtd;
    buySound.currentTime = 0;
    buySound.play();
    atualizar();
  } else {
    alert("Clicks insuficientes!");
  }
}

function comprarMultiplier(qtd) {
  let custo = custoTotalMultiplier(qtd, multiplierCount);
  if (BigInt(score) >= custo) {
    score -= Number(custo);
    multiplierCount += qtd;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.currentTime = 0;
    buySound.play();
    atualizar();
  } else {
    alert("Clicks insuficientes!");
  }
}

// --- AutoClicker automático ---
setInterval(() => {
  score += autoClickers * clickPower * multiplier;
  atualizar();
}, 1000);

// --- Salvar e carregar (localStorage) ---

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
    upgradeAmount,
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

function carregar() {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    const data = JSON.parse(save);
    score = data.score || 0;
    clickPower = data.clickPower || 1;
    autoClickers = data.autoClickers || 0;
    multiplierCount = data.multiplierCount || 0;
    multiplier = data.multiplier || 1;
    cps = data.cps || 0;
    level = data.level || 1;
    xp = data.xp || 0;
    gems = data.gems || 0;
    rebirths = data.rebirths || 0;
    upgradeAmount = data.upgradeAmount || 1;

    // Atualizar UI
    atualizar();

    // Ajustar botão ativo
    upgradeAmountBtns.forEach(b => {
      b.classList.remove('active');
      if ((b.dataset.amount === "max" && upgradeAmount === "max") ||
          Number(b.dataset.amount) === upgradeAmount) {
        b.classList.add('active');
      }
    });
  }
}

setInterval(salvar, 5000);
window.addEventListener('load', carregar);

// --- Tema escuro/gamer ---
const toggleThemeBtn = document.getElementById('toggleThemeBtn');
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  if (document.body.classList.contains('dark')) {
    toggleThemeBtn.textContent = "☀️";
  } else {
    toggleThemeBtn.textContent = "🌙";
  }
});

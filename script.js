// Variáveis
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

// Elementos DOM
const scoreDisplay = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");
const clickPowerSpan = document.getElementById("clickPower");
const multiplierSpan = document.getElementById("multiplier");
const upgradeClickPowerCostSpan = document.getElementById("upgradeClickPowerCost");
const autoClickersSpan = document.getElementById("autoClickers");
const autoClickerCostSpan = document.getElementById("autoClickerCost");
const multiplierCountSpan = document.getElementById("multiplierCount");
const multiplierCostSpan = document.getElementById("multiplierCost");
const cpsDisplay = document.getElementById("cps");
const levelDisplay = document.getElementById("levelDisplay");
const xpBar = document.getElementById("xpBar");
const gemsDisplay = document.getElementById("gemsCount");
const rebirthCountSpan = document.getElementById("rebirthCount");

const upgradeClickPowerBtn = document.getElementById("upgradeClickPowerBtn");
const buyAutoClickerBtn = document.getElementById("buyAutoClickerBtn");
const buyMultiplierBtn = document.getElementById("buyMultiplierBtn");
const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");
const rebirthBtn = document.getElementById("rebirthBtn");
const resetBtn = document.getElementById("resetBtn");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
let upgradeAmount = 1;

// Sons
const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

// Formatação número (versão robusta)
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = [
    "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
    "Dc", "UDc", "DDc", "TDc", "QaDc", "QiDc", "SxDc", "SpDc", "OcDc", "NoDc",
    "Vg", "UVg", "DVg", "TVg", "QaVg", "QiVg", "SxVg", "SpVg", "OcVg", "NoVg",
    "Tg", "UTg", "DTg", "TTg", "QaTg", "QiTg", "SxTg", "SpTg", "OcTg", "NoTg",
    "Qg", "UQg", "DQg", "TQg", "QaQg", "QiQg", "SxQg", "SpQg", "OcQg", "NoQg",
    "Qq", "UQq", "DQq", "TQq", "QaQq", "QiQq", "SxQq", "SpQq", "OcQq", "NoQq",
    "Sg", "USg", "DSg", "TSg", "QaSg", "QiSg", "SxSg", "SpSg", "OcSg", "NoSg"
  ];
  const ordem = Math.min(Math.floor(Math.log10(num) / 3) - 1, unidades.length -1);
  const valor = num / Math.pow(1000, ordem + 1);
  return valor.toFixed(2) + unidades[ordem];
}

// Custos básicos
function custoUpgradeClickPower() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1));
}
function custoAutoClicker() {
  return 50 * (autoClickers + 1);
}
function custoMultiplicador() {
  return 100 * (multiplierCount + 1);
}

// Funções custo total para compras múltiplas
function custoTotalUpgradeClickPower(qtd) {
  let custoTotal = 0;
  for(let i=0; i < qtd; i++) {
    custoTotal += Math.floor(10 * Math.pow(1.5, clickPower + i - 1));
  }
  return custoTotal;
}
function custoTotalAutoClicker(qtd) {
  let custoTotal = 0;
  for(let i=0; i < qtd; i++) {
    custoTotal += 50 * (autoClickers + i + 1);
  }
  return custoTotal;
}
function custoTotalMultiplicador(qtd) {
  let custoTotal = 0;
  for(let i=0; i < qtd; i++) {
    custoTotal += 100 * (multiplierCount + i + 1);
  }
  return custoTotal;
}

// Salvar e carregar estado
function salvarEstado() {
  const estado = {score, clickPower, autoClickers, multiplierCount, multiplier, cps, level, xp, gems, rebirths};
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
    multiplier = (multiplierCount + 1) * (obj.rebirths * 2 || 1);
    cps = obj.cps ?? 0;
    level = obj.level ?? 1;
    xp = obj.xp ?? 0;
    gems = obj.gems ?? 0;
    rebirths = obj.rebirths ?? 0;
  }
}

// Atualizar UI
function atualizar() {
  verificarLevelUp();

  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  multiplierCountSpan.textContent = multiplierCount;
  multiplierSpan.textContent = multiplier;
  upgradeClickPowerCostSpan.textContent = formatarNumero(custoUpgradeClickPower());
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(custoAutoClicker());
  multiplierCostSpan.textContent = formatarNumero(custoMultiplicador());
  cpsDisplay.textContent = formatarNumero(cps);
  levelDisplay.textContent = level;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;

  // XP Bar
  xpBar.style.width = `${Math.min((xp / (level * 100)) * 100, 100)}%`;

  salvarEstado();
}

// Subir nível
function verificarLevelUp() {
  while (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

// Click
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp++;
  clickSound.play();
  atualizar();
});

// Compra upgrade Click Power
upgradeClickPowerBtn.addEventListener("click", () => {
  let amountToBuy = upgradeAmount === "max" ? calcularMaxClickPower() : upgradeAmount;
  const custo = custoTotalUpgradeClickPower(amountToBuy);
  if(score >= custo && amountToBuy > 0){
    score -= custo;
    clickPower += amountToBuy;
    buySound.play();
    atualizar();
  } else {
    alert("Score insuficiente para comprar essa quantidade!");
  }
});

// Compra Auto Clicker
buyAutoClickerBtn.addEventListener("click", () => {
  let amountToBuy = upgradeAmount === "max" ? calcularMaxAutoClicker() : upgradeAmount;
  const custo = custoTotalAutoClicker(amountToBuy);
  if(score >= custo && amountToBuy > 0){
    score -= custo;
    autoClickers += amountToBuy;
    buySound.play();
    atualizar();
  } else {
    alert("Score insuficiente para comprar essa quantidade!");
  }
});

// Compra Multiplicador
buyMultiplierBtn.addEventListener("click", () => {
  let amountToBuy = upgradeAmount === "max" ? calcularMaxMultiplicador() : upgradeAmount;
  const custo = custoTotalMultiplicador(amountToBuy);
  if(score >= custo && amountToBuy > 0){
    score -= custo;
    multiplierCount += amountToBuy;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.play();
    atualizar();
  } else {
    alert("Score insuficiente para comprar essa quantidade!");
  }
});

// Boosts
speedBoostBtn.addEventListener("click", () => {
  if(gems >= 20){
    gems -= 20;
    // Aumenta CPS temporariamente 2x por 30 segundos
    cps *= 2;
    boostSound.play();
    atualizar();
    setTimeout(() => {
      cps /= 2;
      atualizar();
    }, 30000);
  } else {
    alert("Gemas insuficientes!");
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if(gems >= 50){
    gems -= 50;
    multiplier *= 2;
    boostSound.play();
    atualizar();
    setTimeout(() => {
      multiplier /= 2;
      atualizar();
    }, 30000);
  } else {
    alert("Gemas insuficientes!");
  }
});

buyGemsBtn.addEventListener("click", () => {
  // Comprar 100 gemas custa 10000 score (exemplo)
  if(score >= 10000){
    score -= 10000;
    gems += 100;
    buySound.play();
    atualizar();
  } else {
    alert("Score insuficiente para comprar gemas!");
  }
});

// Rebirth
rebirthBtn.addEventListener("click", () => {
  if(level >= 10){
    rebirths++;
    // Reset tudo mas mantem gems e rebirth count
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1 * (rebirths * 2);
    cps = 0;
    level = 1;
    xp = 0;
    buySound.play();
    atualizar();
  } else {
    alert("Você precisa estar no nível 10 para fazer rebirth!");
  }
});

// Resetar jogo
resetBtn.addEventListener("click", () => {
  if(confirm("Quer mesmo resetar o jogo? Você perderá todo o progresso!")){
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1;
    cps = 0;
    level = 1;
    xp = 0;
    gems = 0;
    rebirths = 0;
    buySound.play();
    atualizar();
  }
});

// Botões quantidade compra (1,10,100,1000,max)
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const val = btn.getAttribute("data-amount");
    upgradeAmount = val === "max" ? "max" : Number(val);
  });
});

// Funções para calcular máximo possível a comprar
function calcularMaxClickPower() {
  let max = 0;
  while (custoTotalUpgradeClickPower(max + 1) <= score) {
    max++;
  }
  return max;
}
function calcularMaxAutoClicker() {
  let max = 0;
  while (custoTotalAutoClicker(max + 1) <= score) {
    max++;
  }
  return max;
}
function calcularMaxMultiplicador() {
  let max = 0;
  while (custoTotalMultiplicador(max + 1) <= score) {
    max++;
  }
  return max;
}

// Auto clickers atualizam o score automaticamente
setInterval(() => {
  score += autoClickers * clickPower * multiplier;
  xp += autoClickers;
  atualizar();
}, 1000);

// Carrega estado inicial
carregarEstado();
atualizar();

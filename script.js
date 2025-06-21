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
const multiplierValueSpan = document.getElementById("multiplierValue");
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

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
let upgradeAmount = 1;

// Rebirth custos em potências, até 100 níveis
const rebirthCostsPowers = Array.from({ length: 100 }, (_, i) => 3 * (i + 1));

function custoRebirth(rebirthCount) {
  if (rebirthCount < rebirthCostsPowers.length) {
    return Math.pow(10, rebirthCostsPowers[rebirthCount]);
  } else {
    return Math.pow(10, rebirthCostsPowers.at(-1)) + (rebirthCount - rebirthCostsPowers.length + 1) * 1e300;
  }
}

// Formatar números grandes
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = [
    "", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc",
    "N", "Dc", "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd",
    "Nd", "Vg", "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg",
    "NVg", "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg",
    "NTg", "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg",
    "NQg", "Qq", "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq",
    "NQq", "Sg", "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg"
  ];
  let ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

function salvarEstado() {
  const estado = { score, clickPower, autoClickers, multiplier, multiplierCount, cps, level, xp, gems, rebirths };
  localStorage.setItem("clickerSimEstado", JSON.stringify(estado));
}

function carregarEstado() {
  const estado = localStorage.getItem("clickerSimEstado");
  if (estado) {
    const obj = JSON.parse(estado);
    score = obj.score || 0;
    clickPower = obj.clickPower || 1;
    autoClickers = obj.autoClickers || 0;
    multiplier = obj.multiplier || 1;
    multiplierCount = obj.multiplierCount || 0;
    cps = obj.cps || 0;
    level = obj.level || 1;
    xp = obj.xp || 0;
    gems = obj.gems || 0;
    rebirths = obj.rebirths || 0;
  }
}

function atualizar() {
  verificarLevelUp();
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = formatarNumero(Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount);
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(50 * (autoClickers + upgradeAmount));
  multiplierCountSpan.textContent = multiplierCount;
  multiplierValueSpan.textContent = multiplier.toFixed(2);
  multiplierCostSpan.textContent = formatarNumero(100 * (multiplierCount + upgradeAmount));
  cpsDisplay.textContent = `Clicks por segundo: ${formatarNumero(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;
  salvarEstado();
}

function verificarLevelUp() {
  if (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp++;
  clickSound.currentTime = 0;
  clickSound.play();
  atualizar();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  const costTotal = Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
  if (score >= costTotal) {
    score -= costTotal;
    clickPower += upgradeAmount;
    buySound.currentTime = 0;
    buySound.play();
    atualizar();
  } else {
    alert("Clique não suficiente para comprar Click Power!");
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers += 1;
    buySound.currentTime = 0;
    buySound.play();
    atualizar();
  } else {
    alert("Clique não suficiente para comprar Auto Clicker!");
  }
});

buyMultiplierBtn.addEventListener("click", () => {
  const cost = 100 * (multiplierCount + 1);
  if (score >= cost) {
    score -= cost;
    multiplierCount++;
    multiplier = 1 + multiplierCount * 0.5;
    buySound.currentTime = 0;
    buySound.play();
    atualizar();
  } else {
    alert("Clique não suficiente para comprar Multiplicador!");
  }
});

// Auto Clickers funcionam adicionando clicks por segundo
setInterval(() => {
  if (autoClickers > 0) {
    score += autoClickers * clickPower * multiplier;
    xp += autoClickers;
    atualizar();
  }
}, 1000);

// Atualizar CPS (clicks por segundo)
setInterval(() => {
  cps = autoClickers * clickPower * multiplier;
  atualizar();
}, 500);

// Boosts
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    autoClickers *= 2;
    boostSound.currentTime = 0;
    boostSound.play();
    atualizar();
  } else alert("Gemas insuficientes para Boost de Velocidade!");
});
multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    multiplier *= 2;
    boostSound.currentTime = 0;
    boostSound.play();
    atualizar();
  } else alert("Gemas insuficientes para Boost de Multiplicador!");
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.currentTime = 0;
  buySound.play();
  atualizar();
});

// Rebirth
rebirthBtn.addEventListener("click", () => {
  const custo = custoRebirth(rebirths);
  if (score >= custo) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplier = 1;
    multiplierCount = 0;
    cps = 0;
    level = 1;
    xp = 0;
    gems += 100 * (rebirths + 1);
    rebirths++;
    buySound.currentTime = 0;
    buySound.play();
    atualizar();
  } else {
    alert(`Precisa de ${formatarNumero(custo)} clicks para Rebirth!`);
  }
});

// Resetar
resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja resetar o jogo?")) {
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
    atualizar();
  }
});

// Selecionar quantidade para upgrades
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    upgradeAmount = Number(btn.dataset.amount);
    atualizar();
  });
});

// Tema claro/escuro
const toggleThemeBtn = document.getElementById("toggleThemeBtn");
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});
  
// Estado inicial
carregarEstado();
atualizar();

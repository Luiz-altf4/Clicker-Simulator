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
const clickPowerQtySelect = document.getElementById("clickPowerQty");

const autoClickersSpan = document.getElementById("autoClickers");
const autoClickerCostSpan = document.getElementById("autoClickerCost");
const buyAutoClickerBtn = document.getElementById("buyAutoClickerBtn");
const autoClickerQtySelect = document.getElementById("autoClickerQty");

const multiplierCostSpan = document.getElementById("multiplierCost");
const multiplierCountSpan = document.getElementById("multiplierCount");
const buyMultiplierBtn = document.getElementById("buyMultiplierBtn");
const multiplierQtySelect = document.getElementById("multiplierQty");

const cpsDisplay = document.getElementById("cps");
const xpBar = document.getElementById("xpBar");
const levelDisplay = document.getElementById("levelDisplay");
const gemsDisplay = document.getElementById("gemsCount");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

// Função para formatar números grandes (sem decimais)
function formatarNumero(num) {
  const unidades = [
    "",
    "k",
    "M",
    "B",
    "T",
    "Q",
    "Qi",
    "Sx",
    "Sp",
    "Oc",
    "N",
    "Dc",
    "Ud",
    "Dd",
    "Td",
    "Qd",
    "Qn",
    "Sxd",
    "Spd",
    "Ocd",
    "Nd",
    "Vg",
    "UVg",
    "DVg",
    "TVg",
    "QVg",
    "QnVg",
    "SVg",
    "SpVg",
    "OVg",
    "NVg",
    "Tg",
    "UTg",
    "DTg",
    "TTg",
    "QTg",
    "QnTg",
    "STg",
    "SpTg",
    "OTg",
    "NTg",
    "Qg",
    "UQg",
    "DQg",
    "TQg",
    "QQg",
    "QnQg",
    "SQg",
    "SpQg",
    "OQg",
    "NQg",
    "Qq",
    "UQq",
    "DQq",
    "TQq",
    "QQq",
    "QnQq",
    "SQq",
    "SpQq",
    "OQq",
    "NQq",
    "Sg",
    "USg",
    "DSg",
    "TSg",
    "QSg",
    "QnSg",
    "SSg",
    "SpSg",
    "OSg",
    "NSg",
    "Sgnt",
    "USgnt",
    "DSgnt",
    "TSgnt",
    "QSgnt",
    "QnSgnt",
    "SSgnt",
    "SpSgnt",
    "OSgnt",
    "NSgnt",
    "Ogt",
    "UOgt",
    "DOgt",
    "TOgt",
    "QOgt",
    "QnOgt",
    "SOgt",
    "SpOgt",
    "OOgt",
    "NOgt",
    "Ng",
    "UNg",
    "DNn",
    "TNn",
    "QNn",
    "QnNn",
    "SNn",
    "SpNn",
    "ONn",
    "NNn"
  ];

  let i = 0;
  while (num >= 1000 && i < unidades.length - 1) {
    num /= 1000;
    i++;
  }
  return num.toFixed(2).replace(/\.00$/, "") + unidades[i];
}

// --- CLICKER ---
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  atualizar();
});

// --- UPGRADE: CLICK POWER ---
upgradeClickPowerBtn.addEventListener("click", () => {
  let qty = parseInt(clickPowerQtySelect.value);
  let totalCost = 0;
  for (let i = 0; i < qty; i++) {
    totalCost += Math.floor(10 * Math.pow(1.5, (clickPower - 1) + i));
  }

  if (score >= totalCost) {
    score -= totalCost;
    clickPower += qty;
    buySound.play();
    atualizar();
  } else {
    alert("Você não tem pontos suficientes para comprar essa quantidade!");
  }
});

// --- UPGRADE: AUTOCLICKER ---
buyAutoClickerBtn.addEventListener("click", () => {
  let qty = parseInt(autoClickerQtySelect.value);
  let totalCost = 0;
  for (let i = 0; i < qty; i++) {
    totalCost += 50 * (autoClickers + 1 + i);
  }

  if (score >= totalCost) {
    score -= totalCost;
    autoClickers += qty;
    buySound.play();
    atualizar();
  } else {
    alert("Você não tem pontos suficientes para comprar essa quantidade!");
  }
});

// --- UPGRADE: MULTIPLICADOR ---
buyMultiplierBtn.addEventListener("click", () => {
  let qty = parseInt(multiplierQtySelect.value);
  let totalCost = 0;
  for (let i = 0; i < qty; i++) {
    totalCost += 100 * (multiplierCount + 1 + i);
  }

  if (score >= totalCost) {
    score -= totalCost;
    for(let i = 0; i < qty; i++) {
      multiplier *= 2;
    }
    multiplierCount += qty;
    buySound.play();
    atualizar();
  } else {
    alert("Você não tem pontos suficientes para comprar essa quantidade!");
  }
});

// --- BOOST: VELOCIDADE ---
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    buySound.play();
    let boost = setInterval(() => {
      score += clickPower * multiplier;
      atualizar();
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
    setTimeout(() => {
      multiplier /= 5;
    }, 30000);
  }
});

// --- LOJA ---
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// --- AUTOCLICK ---
setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
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
  verificarLevelUp();

  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  upgradeClickPowerCostSpan.textContent = formatarNumero(Math.floor(10 * Math.pow(1.5, clickPower - 1)));

  autoClickersSpan.textContent = formatarNumero(autoClickers);
  autoClickerCostSpan.textContent = formatarNumero(50 * (autoClickers + 1));

  multiplierCountSpan.textContent = formatarNumero(multiplierCount);
  multiplierCostSpan.textContent = formatarNumero(100 * (multiplierCount + 1));

  cpsDisplay.textContent = `Clicks por segundo: ${formatarNumero(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;

  gemsDisplay.textContent = formatarNumero(gems);
}

// --- TEMA ---
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Inicializa tudo
window.addEventListener("load", () => {
  atualizar();
});

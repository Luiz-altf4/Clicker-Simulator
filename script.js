const unidades = [
  "", "k", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "Dc", "Ud", "Dd", "Td",
  "Qd", "Qn", "Sxd", "Spd", "Ocd", "Nd", "Vg",
  "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg", "NVg",
  "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg", "NTg",
  "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg", "NQg",
  "Qq", "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq", "NQq",
  "Sg", "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg", "NSg",
  "Sgnt", "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt", "SSgnt", "SpSgnt", "OSgnt", "NSgnt",
  "Ogt", "UOgt", "DOgt", "TOgt", "QOgt", "QnOgt", "SOgt", "SpOgt", "OOgt", "NOgt",
  "Ng", "UNg", "DNn", "TNn", "QNn", "QnNn", "SNn", "SpNn", "ONn", "NNn"
];

function formatarNumero(num) {
  if (num < 1000) return num.toString();
  let unidadeIndex = 0;
  let valor = num;
  while (valor >= 1000 && unidadeIndex < unidades.length - 1) {
    valor /= 1000;
    unidadeIndex++;
  }
  return valor.toFixed(2).replace(/\.00$/, '') + unidades[unidadeIndex];
}

// --- VARIÁVEIS ---
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

// Elementos da UI
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

// --- SALVAR E CARREGAR ---

function salvarProgresso() {
  const estado = {
    score, clickPower, autoClickers, multiplier, multiplierCount,
    cps, level, xp, gems
  };
  localStorage.setItem("clickerSave", JSON.stringify(estado));
}

function carregarProgresso() {
  const salvo = localStorage.getItem("clickerSave");
  if (salvo) {
    const estado = JSON.parse(salvo);
    score = estado.score || 0;
    clickPower = estado.clickPower || 1;
    autoClickers = estado.autoClickers || 0;
    multiplier = estado.multiplier || 1;
    multiplierCount = estado.multiplierCount || 0;
    cps = estado.cps || 0;
    level = estado.level || 1;
    xp = estado.xp || 0;
    gems = estado.gems || 0;
  }
}

// --- LÓGICA DO JOGO ---

clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  atualizar();
  salvarProgresso();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    buySound.play();
    atualizar();
    salvarProgresso();
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    buySound.play();
    atualizar();
    salvarProgresso();
  }
});

buyMultiplierBtn.addEventListener("click", () => {
  const cost = 100 * (multiplierCount + 1);
  if (score >= cost) {
    score -= cost;
    multiplier *= 2;
    multiplierCount++;
    buySound.play();
    atualizar();
    salvarProgresso();
  }
});

speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    buySound.play();
    let boost = setInterval(() => {
      score += clickPower * multiplier;
      atualizar();
      salvarProgresso();
    }, 100);
    setTimeout(() => clearInterval(boost), 30000);
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    buySound.play();
    multiplier *= 5;
    atualizar();
    salvarProgresso();
    setTimeout(() => {
      multiplier /= 5;
      atualizar();
      salvarProgresso();
    }, 30000);
  }
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
  salvarProgresso();
});

setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
  salvarProgresso();
}, 1000);

function verificarLevelUp() {
  if (xp >= level * 100) {
    xp = 0;
    level++;
    gems += 10;
    buySound.play();
  }
}

function atualizar() {
  verificarLevelUp();

  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = formatarNumero(Math.floor(10 * Math.pow(1.5, clickPower - 1)));

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(50 * (autoClickers + 1));

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatarNumero(100 * (multiplierCount + 1));

  cpsDisplay.textContent = `Clicks por segundo: ${formatarNumero(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;

  gemsDisplay.textContent = formatarNumero(gems);
}

document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// --- INICIALIZA ---
window.addEventListener("load", () => {
  carregarProgresso();
  atualizar();
});

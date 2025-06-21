// --- SCRIPT DO JOGO CLICKER SIMULATOR COMPLETO COM RESET CORRIGIDO ---

// Variáveis do jogo
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

const rebirthCostsPowers = Array.from({ length: 100 }, (_, i) => 3 * (i + 1));

function custoRebirth(rebirthCount) {
  if (rebirthCount < rebirthCostsPowers.length) {
    return Math.pow(10, rebirthCostsPowers[rebirthCount]);
  } else {
    return Math.pow(10, rebirthCostsPowers.at(-1)) + (rebirthCount - rebirthCostsPowers.length + 1) * 1e300;
  }
}

function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = [
    "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc",
    "N", "Dc", "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd",
    "Nod", "Vg", "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg",
    "NVg", "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg",
    "NTg", "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg",
    "NQg", "Qq", "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq",
    "NQq", "Sg", "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg",
    "NSg", "Sgnt", "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt", "SSgnt", "SpSgnt", "OSgnt",
    "NSgnt", "Ogt", "UOgt", "DOgt", "TOgt", "QOgt", "QnOgt", "SOgt", "SpOgt", "OOgt",
    "NOgt", "Ng", "UNg", "DNn", "TNn", "QNn", "QnNn", "SNn", "SpNn", "ONn",
    "NNn", "OLPWO", "NdOs", "NSposk", "Ldm", "Huoop", "Nowid", "Infernal", "Nallk", "Alsk",
    "SEoiUd", "A", "B", "C", "D", "E", "AB", "AC", "AD", "AE"
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
  upgradeClickPowerCostSpan.textContent = formatarNumero(Math.floor(10 * Math.pow(1.5, clickPower - 1)));
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(50 * (autoClickers + 1));
  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatarNumero(Math.floor(100 * Math.pow(2, multiplierCount + 1)));
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
  score += clickPower * (multiplier + rebirths);
  xp++;
  clickSound.play();
  atualizar();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  const costTotal = Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
  if (score >= costTotal) {
    score -= costTotal;
    clickPower += upgradeAmount;
    buySound.play();
    atualizar();
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const costTotal = 50 * (autoClickers + 1) * upgradeAmount;
  if (score >= costTotal) {
    score -= costTotal;
    autoClickers += upgradeAmount;
    buySound.play();
    atualizar();
  }
});

buyMultiplierBtn.addEventListener("click", () => {
  let costTotal = 0;
  let increase = 0;
  for (let i = 0; i < upgradeAmount; i++) {
    costTotal += Math.floor(100 * Math.pow(2, multiplierCount + i + 1));
    increase++;
  }
  if (score >= costTotal) {
    score -= costTotal;
    multiplierCount += increase;
    buySound.play();
    atualizar();
  }
});

speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    buySound.play();
    let boost = setInterval(() => {
      score += clickPower * (multiplier + rebirths);
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(boost), 30000);
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    buySound.play();
    multiplier += 5;
    setTimeout(() => {
      multiplier -= 5;
      atualizar();
    }, 30000);
  }
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

setInterval(() => {
  score += autoClickers * (multiplier + rebirths);
  cps = autoClickers * (multiplier + rebirths);
  atualizar();
}, 1000);

upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmount = parseInt(btn.dataset.amount);
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

rebirthBtn.addEventListener("click", () => {
  const cost = custoRebirth(rebirths);
  if (score >= cost) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplier = 1;
    multiplierCount = 0;
    cps = 0;
    level = 1;
    xp = 0;
    rebirths++;
    buySound.play();
    atualizar();
  } else {
    alert(`Rebirth custa ${formatarNumero(cost)} clicks!`);
  }
});

resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que quer resetar o jogo? Isso apagará todo seu progresso!")) {
    localStorage.clear();
    location.reload();
  }
});

document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

window.addEventListener("load", () => {
  carregarEstado();
  atualizar();
});

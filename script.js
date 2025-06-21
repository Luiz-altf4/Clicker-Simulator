// --- script.js ---

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

// Array com potências para custo rebirth até 100 níveis
const rebirthCostsPowers = Array.from({ length: 100 }, (_, i) => 3 * (i + 1));

function custoRebirth(rebirthCount) {
  if (rebirthCount < rebirthCostsPowers.length) {
    return Math.pow(10, rebirthCostsPowers[rebirthCount]);
  } else {
    return Math.pow(10, rebirthCostsPowers.at(-1)) + (rebirthCount - rebirthCostsPowers.length + 1) * 1e300;
  }
}

const unidades = [
  "", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No",
  "Dc", "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd", "Ncd",
  "Vg", "Uvg", "Dvg", "Tvg", "Qvg", "Qnvg", "Sxvg", "Spvg", "Ocvg", "Nvg",
  "Tg", "Utg", "Dtg", "Ttg", "Qtg", "Qntg", "Sxtg", "Sptg", "Octg", "Ntg",
  "Qag", "Uqag", "Dqag", "Tqag", "Qqag", "Qnqag", "Sxqag", "Spqag", "Ocqag", "Nqag",
  "Qig", "Uqig", "Dqig", "Tqig", "Qqig", "Qnqig", "Sxqig", "Spqig", "Ocqig", "Nqig",
  "Sxg", "Usxg", "Dsxg", "Tsxg", "Qsxg", "Qnsxg", "Sxsxg", "Spsxg", "Ocsxg", "Nsxg",
  "Spg", "Uspg", "Dspg", "Tspg", "Qspg", "Qnspg", "Sxspg", "Spspg", "Ocspg", "Nspg",
  "Ocg", "Uocg", "Docg", "Tocg", "Qocg", "Qnocg", "Sxocg", "Spocg", "Ococg", "Nocg",
  "Nog", "Unog", "Dnog", "Tnog", "Qnog", "Qnnog", "Sxnog", "Spnog", "Ocnog", "Nnog"
];

function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  const valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

function salvarEstado() {
  const estado = {
    score,
    clickPower,
    autoClickers,
    multiplier,
    multiplierCount,
    cps,
    level,
    xp,
    gems,
    rebirths
  };
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
  multiplierCostSpan.textContent = formatarNumero(calcularCustoMultiplicador());

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
  score += clickPower * multiplier * (1 + rebirths);
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

function calcularCustoMultiplicador() {
  // Custo base multiplicador = 100 * (multiplierCount + 1)
  // Aumenta 50% a cada rebirth para ficar mais caro
  let custoBase = 100 * (multiplierCount + 1);
  custoBase *= (1 + 0.5 * rebirths);
  return custoBase;
}

buyMultiplierBtn.addEventListener("click", () => {
  let costTotal = 0;
  let increase = 0;
  for (let i = 0; i < upgradeAmount; i++) {
    costTotal += calcularCustoMultiplicador() * (multiplierCount + i + 1) / (multiplierCount + 1);
    increase++;
  }
  if (score >= costTotal) {
    score -= costTotal;
    multiplier += 2 * upgradeAmount * rebirths; // Cada rebirth aumenta 2x o multiplicador comprado
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
      score += clickPower * multiplier * (1 + rebirths);
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(boost), 30000);
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    buySound.play();
    multiplier *= 5;
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

setInterval(() => {
  score += autoClickers * multiplier * (1 + rebirths);
  cps = autoClickers * multiplier * (1 + rebirths);
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

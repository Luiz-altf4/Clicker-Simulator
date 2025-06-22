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
let prestige = 0;

const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

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
const prestigeBtn = document.getElementById("prestigeBtn");
const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
const shopButtons = document.querySelectorAll(".shop-buy");
let upgradeAmount = 1;

const rebirthCostsPowers = Array.from({ length: 100 }, (_, i) => 3 * (i + 1));

function custoRebirth(count) {
  if (count < rebirthCostsPowers.length) {
    return Math.pow(10, rebirthCostsPowers[count]);
  } else {
    return Math.pow(10, rebirthCostsPowers.at(-1)) + (count - rebirthCostsPowers.length + 1) * 1e300;
  }
}

function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Tre", "Dre", "OpOs", "TdRe", "SpDg", "A", "B"];
  let ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

function salvarEstado() {
  const estado = { score, clickPower, autoClickers, multiplierCount, level, xp, gems, rebirths, prestige };
  localStorage.setItem("clickerSimEstado", JSON.stringify(estado));
}

function carregarEstado() {
  const estado = JSON.parse(localStorage.getItem("clickerSimEstado"));
  if (!estado) return;
  score = estado.score;
  clickPower = estado.clickPower;
  autoClickers = estado.autoClickers;
  multiplierCount = estado.multiplierCount;
  multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
  level = estado.level;
  xp = estado.xp;
  gems = estado.gems;
  rebirths = estado.rebirths;
  prestige = estado.prestige || 0;
}

function atualizar() {
  verificarLevelUp();
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  upgradeClickPowerCostSpan.textContent = formatarNumero(custoClickPower());
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(custoAutoClicker());
  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatarNumero(custoMultiplicador());
  cpsDisplay.textContent = `Clicks por segundo: ${formatarNumero(cps)}`;
  levelDisplay.textContent = level;
  xpBar.style.width = `${Math.min((xp / (level * 100)) * 100, 100)}%`;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;
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

function custoClickPower() {
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

clickBtn.onclick = () => {
  score += clickPower * multiplier;
  xp++;
  clickSound.play();
  atualizar();
};

upgradeClickPowerBtn.onclick = () => {
  const custo = custoClickPower();
  if (score >= custo) {
    score -= custo;
    clickPower += upgradeAmount;
    buySound.play();
    atualizar();
  }
};

buyAutoClickerBtn.onclick = () => {
  const custo = custoAutoClicker();
  if (score >= custo) {
    score -= custo;
    autoClickers += upgradeAmount;
    buySound.play();
    atualizar();
  }
};

buyMultiplierBtn.onclick = () => {
  const custo = custoMultiplicador();
  if (score >= custo) {
    score -= custo;
    multiplierCount += upgradeAmount;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.play();
    atualizar();
  }
};

upgradeAmountBtns.forEach(btn => {
  btn.onclick = () => {
    upgradeAmount = parseInt(btn.dataset.amount);
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  };
});

setInterval(() => {
  let ganho = autoClickers * multiplier;
  score += ganho;
  cps = ganho;
  atualizar();
}, 1000);

speedBoostBtn.onclick = () => {
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
};

multiplierBoostBtn.onclick = () => {
  if (gems >= 50) {
    gems -= 50;
    boostSound.play();
    multiplier *= 5;
    atualizar();
    setTimeout(() => {
      multiplier /= 5;
      atualizar();
    }, 30000);
  }
};

buyGemsBtn.onclick = () => {
  gems += 100;
  buySound.play();
  atualizar();
};

rebirthBtn.onclick = () => {
  const custo = custoRebirth(rebirths);
  if (score >= custo) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    level = 1;
    xp = 0;
    rebirths++;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.play();
    atualizar();
  }
};

prestigeBtn.onclick = () => {
  if (rebirths >= 5) {
    prestige++;
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1;
    level = 1;
    xp = 0;
    rebirths = 0;
    gems = 0;
    buySound.play();
    atualizar();
    alert("Você ativou o Prestígio! Parabéns!");
  } else {
    alert("É necessário pelo menos 5 Rebirths para prestigiar!");
  }
};

resetBtn.onclick = () => {
  if (confirm("Deseja realmente resetar o jogo?")) {
    localStorage.clear();
    location.reload();
  }
};

shopButtons.forEach(btn => {
  btn.onclick = () => {
    const custo = parseInt(btn.dataset.cost);
    if (score >= custo) {
      score -= custo;
      const item = btn.dataset.item;
      switch (item) {
        case "clickPowerBoost": clickPower += 5; break;
        case "autoClickerBoost": autoClickers += 5; break;
        case "multiplierBoost": multiplierCount += 1; multiplier = (multiplierCount + 1) * (rebirths * 2 || 1); break;
      }
      buySound.play();
      atualizar();
    } else {
      alert("Você não tem clicks suficientes!");
    }
  };
});

document.getElementById("toggleThemeBtn").onclick = () => {
  document.body.classList.toggle("light");
};

window.onload = () => {
  carregarEstado();
  atualizar();
};

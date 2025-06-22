// Elementos DOM
const clickBtn = document.getElementById("clickBtn");
const scoreDisplay = document.getElementById("score");
const clickPowerSpan = document.getElementById("clickPower");
const autoClickersSpan = document.getElementById("autoClickers");
const multiplierCountSpan = document.getElementById("multiplierCount");
const upgradeClickPowerBtn = document.getElementById("upgradeClickPowerBtn");
const autoClickerCostSpan = document.getElementById("autoClickerCost");
const buyAutoClickerBtn = document.getElementById("buyAutoClickerBtn");
const multiplierCostSpan = document.getElementById("multiplierCost");
const buyMultiplierBtn = document.getElementById("buyMultiplierBtn");
const cpsDisplay = document.getElementById("cps");
const levelDisplay = document.getElementById("levelDisplay");
const xpBar = document.getElementById("xpBar");
const gemsDisplay = document.getElementById("gemsCount");
const rebirthCountSpan = document.getElementById("rebirthCount");
const rebirthBtn = document.getElementById("rebirthBtn");
const resetBtn = document.getElementById("resetBtn");
const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
const currentWorldSpan = document.getElementById("currentWorld");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

const toggleThemeBtn = document.getElementById("toggleThemeBtn");

// Variáveis do jogo
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

let upgradeAmount = 1;

let speedBoostActive = false;
let multiplierBoostActive = false;

// Mundos disponíveis
const worlds = ["Terra", "Sun", "Moon", "Cyber", "Galaxy", "Void"];

// Função para formatar números grandes com unidades customizadas
function formatarNumero(num) {
  const unidades = [
    "", "k", "M", "B", "T", "q", "Qn", "Sx", "Sp", "Oc", "No", "Dc",
    "Ud", "Dd", "Td", "Qd", "Qnd", "Sd", "Spd", "Ocd", "Nod", "Vg",
    "Uv", "Dv", "Tv", "qv", "Qnv", "Sv", "Spv", "OcV", "NoV", "Tr",
    "Qi", "Se", "Ot", "Ne", "P", "Pe", "He", "Hp", "E", "Ea", "Za",
    "Zp", "Y", "Yn", "X", "Xp", "Wp", "W", "Vp", "V", "Up", "U", "Tp",
    "Tq", "Tp", "Tn", "Ts", "Tsp", "Qo", "Qp", "Qn", "Qs", "Qsp", "Se",
    "Sp", "Sn", "Ss", "Ssp", "Ocq", "Ocp", "Ocn", "Ocs", "Ocsp"
  ];

  let unidadeIndex = 0;
  let n = num;
  while (n >= 1000 && unidadeIndex < unidades.length - 1) {
    n /= 1000;
    unidadeIndex++;
  }
  return n.toFixed(2) + unidades[unidadeIndex];
}

// Salvar no localStorage
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
    speedBoostActive,
    multiplierBoostActive,
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

// Carregar do localStorage
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
    speedBoostActive = saveData.speedBoostActive || false;
    multiplierBoostActive = saveData.multiplierBoostActive || false;
  }
}

// Atualiza UI
function atualizarUI() {
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  autoClickersSpan.textContent = autoClickers;
  multiplierCountSpan.textContent = multiplierCount;
  upgradeClickPowerBtn.nextElementSibling.querySelector("span").textContent = formatarNumero(getUpgradeClickPowerCost());
  autoClickerCostSpan.textContent = formatarNumero(getAutoClickerCost());
  multiplierCostSpan.textContent = formatarNumero(getMultiplierCost());
  cpsDisplay.textContent = "Clicks por segundo: " + formatarNumero(cps);
  levelDisplay.textContent = "Nível: " + level;
  gemsDisplay.textContent = formatarNumero(gems);
  rebirthCountSpan.textContent = rebirths;
  currentWorldSpan.textContent = currentWorld;

  // XP Bar
  const xpNeeded = level * 100;
  const xpPercent = Math.min((xp / xpNeeded) * 100, 100);
  xpBar.style.width = xpPercent + "%";

  // Botões de compra múltipla ativa
  upgradeAmountBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.amount == upgradeAmount);
  });
}

// Custos
function getUpgradeClickPowerCost() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1));
}
function getAutoClickerCost() {
  return Math.floor(50 * Math.pow(1.6, autoClickers));
}
function getMultiplierCost() {
  return Math.floor(100 * Math.pow(2, multiplierCount));
}

// Click
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += clickPower * multiplier;
  playSound(clickSound);
  verificarLevelUp();
  atualizarUI();
  salvar();
});

// Função para tocar som
function playSound(sound) {
  if (!sound) return;
  sound.currentTime = 0;
  sound.play();
}

// Comprar upgrade
function comprarUpgrade(type, amount) {
  if (amount === "max") amount = calcularMaximoUpgrade(type);

  if (type === "clickPower") {
    let custoTotal = 0;
    for (let i = 0; i < amount; i++) {
      custoTotal += getUpgradeClickPowerCost() * Math.pow(1.5, i);
    }
    if (score >= custoTotal) {
      score -= custoTotal;
      clickPower += amount;
      playSound(buySound);
    }
  } else if (type === "autoClicker") {
    let custoTotal = 0;
    for (let i = 0; i < amount; i++) {
      custoTotal += getAutoClickerCost() * Math.pow(1.6, i);
    }
    if (score >= custoTotal) {
      score -= custoTotal;
      autoClickers += amount;
      playSound(buySound);
    }
  } else if (type === "multiplier") {
    let custoTotal = 0;
    for (let i = 0; i < amount; i++) {
      custoTotal += getMultiplierCost() * Math.pow(2, i);
    }
    if (score >= custoTotal) {
      score -= custoTotal;
      multiplierCount += amount;
      multiplier = Math.pow(2, multiplierCount);
      playSound(buySound);
    }
  }

  atualizarUI();
  salvar();
}

// Calcula máximo que pode comprar
function calcularMaximoUpgrade(type) {
  let max = 0;
  let tempScore = score;
  let custo;
  while (true) {
    if (type === "clickPower") custo = getUpgradeClickPowerCost() * Math.pow(1.5, max);
    else if (type === "autoClicker") custo = getAutoClickerCost() * Math.pow(1.6, max);
    else if (type === "multiplier") custo = getMultiplierCost() * Math.pow(2, max);
    else break;

    if (tempScore >= custo) {
      tempScore -= custo;
      max++;
    } else {
      break;
    }
  }
  return max;
}

// Eventos dos botões upgrades múltiplos
upgradeClickPowerBtn.addEventListener("click", () => comprarUpgrade("clickPower", upgradeAmount));
buyAutoClickerBtn.addEventListener("click", () => comprarUpgrade("autoClicker", upgradeAmount));
buyMultiplierBtn.addEventListener("click", () => comprarUpgrade("multiplier", upgradeAmount));

// Botões para selecionar quantidade a comprar
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmount = btn.dataset.amount === "max" ? "max" : Number(btn.dataset.amount);
    atualizarUI();
  });
});

// AutoClickers clicam automaticamente
setInterval(() => {
  if (autoClickers > 0) {
    let clicks = autoClickers * clickPower * multiplier;
    if (speedBoostActive) clicks *= 2;
    score += clicks;
    xp += clicks;
    verificarLevelUp();
    atualizarUI();
    salvar();
  }
}, 1000);

// Atualiza CPS
function calcularCPS() {
  cps = autoClickers * clickPower * multiplier;
  if (speedBoostActive) cps *= 2;
  atualizarUI();
}
setInterval(calcularCPS, 1000);

// Verifica nível up
function verificarLevelUp() {
  const xpNeeded = level * 100;
  if (xp >= xpNeeded) {
    xp -= xpNeeded;
    level++;
    playSound(buySound);
    // Ao subir nível, pode dar uma recompensa ou efeito visual
  }
}

// Boosts
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20 && !speedBoostActive) {
    gems -= 20;
    speedBoostActive = true;
    playSound(boostSound);
    alert("Boost de Velocidade ativado por 30 segundos!");
    atualizarUI();
    salvar();
    setTimeout(() => {
      speedBoostActive = false;
      atualizarUI();
      alert("Boost de Velocidade terminou!");
      salvar();
    }, 30000);
  } else if (speedBoostActive) {
    alert("Boost de Velocidade já está ativo!");
  } else {
    alert("Gemas insuficientes!");
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50 && !multiplierBoostActive) {
    gems -= 50;
    multiplierBoostActive = true;
    multiplier *= 2;
    playSound(boostSound);
    alert("Boost de Multiplicador ativado por 30 segundos!");
    atualizarUI();
    salvar();
    setTimeout(() => {
      multiplier /= 2;
      multiplierBoostActive = false;
      atualizarUI();
      alert("Boost de Multiplicador terminou!");
      salvar();
    }, 30000);
  } else if (multiplierBoostActive) {
    alert("Boost de Multiplicador já está ativo!");
  } else {
    alert("Gemas insuficientes!");
  }
});

// Comprar gemas (teste)
buyGemsBtn.addEventListener("click", () => {
  score += 1000;
  gems += 100;
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
    alert(`Rebirth feito! Agora você tem ${rebirths} rebirth(s) e ganhou gemas!`);
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

// Loja simples
document.querySelectorAll(".shop-buy").forEach(btn => {
  btn.addEventListener("click", () => {
    const item = btn.dataset.item;
    const cost = parseInt(btn.dataset.cost);
    if (score >= cost) {
      score -= cost;
      alert(`Você comprou: ${item}!`);
      playSound(buySound);
      atualizarUI();
      salvar();
    } else {
      alert("Clicks insuficientes para comprar este item!");
    }
  });
});

// Tema dark/light
toggleThemeBtn.addEventListener("click", () => {
  if (document.documentElement.getAttribute("data-theme") === "dark") {
    document.documentElement.removeAttribute("data-theme");
    toggleThemeBtn.textContent = "🌙";
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    toggleThemeBtn.textContent = "☀️";
  }
});

// Salvar e carregar
window.addEventListener("load", () => {
  carregar();
  atualizarUI();
});

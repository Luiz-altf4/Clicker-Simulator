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
const rebirthInfo = document.getElementById("rebirthInfo");
const resetBtn = document.getElementById("resetBtn");

let clickBatch = 1; // 1, 10, 100 melhorias por vez

// --- CLICKER ---
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  atualizar();
});

// --- UPGRADE: CLICK POWER ---
upgradeClickPowerBtn.addEventListener("click", () => {
  let cost = 0;
  for(let i=0; i < clickBatch; i++){
    cost += Math.floor(10 * Math.pow(1.5, clickPower - 1 + i));
  }
  if (score >= cost) {
    score -= cost;
    clickPower += clickBatch;
    buySound.play();
    atualizar();
  } else {
    alert("Dinheiro insuficiente para comprar " + clickBatch + " melhorias.");
  }
});

// --- UPGRADE: AUTOCLICKER ---
buyAutoClickerBtn.addEventListener("click", () => {
  let cost = 0;
  for(let i=0; i < clickBatch; i++){
    cost += 50 * (autoClickers + 1 + i);
  }
  if (score >= cost) {
    score -= cost;
    autoClickers += clickBatch;
    buySound.play();
    atualizar();
  } else {
    alert("Dinheiro insuficiente para comprar " + clickBatch + " auto clickers.");
  }
});

// --- UPGRADE: MULTIPLICADOR ---
buyMultiplierBtn.addEventListener("click", () => {
  let cost = 0;
  for(let i=0; i < clickBatch; i++){
    cost += 100 * (multiplierCount + 1 + i);
  }
  if (score >= cost) {
    score -= cost;
    for(let i=0; i < clickBatch; i++){
      multiplier *= 2;
      multiplierCount++;
    }
    buySound.play();
    atualizar();
  } else {
    alert("Dinheiro insuficiente para comprar " + clickBatch + " multiplicadores.");
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
  } else {
    alert("Gemas insuficientes para boost de velocidade.");
  }
});

// --- BOOST: MULTIPLICADOR x5 ---
multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    buySound.play();
    multiplier *= 5;
    atualizar();
    setTimeout(() => {
      multiplier /= 5;
      atualizar();
    }, 30000);
  } else {
    alert("Gemas insuficientes para boost multiplicador.");
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

  scoreDisplay.textContent = formatNumber(score);
  clickPowerSpan.textContent = clickPower;
  
  // Mostrar o custo do próximo lote de melhorias clickPower
  let costClickPower = 0;
  for(let i=0; i < clickBatch; i++){
    costClickPower += Math.floor(10 * Math.pow(1.5, clickPower - 1 + i));
  }
  upgradeClickPowerCostSpan.textContent = formatNumber(costClickPower);

  autoClickersSpan.textContent = autoClickers;
  let costAutoClickers = 0;
  for(let i=0; i < clickBatch; i++){
    costAutoClickers += 50 * (autoClickers + 1 + i);
  }
  autoClickerCostSpan.textContent = formatNumber(costAutoClickers);

  multiplierCountSpan.textContent = multiplierCount;
  let costMultiplier = 0;
  for(let i=0; i < clickBatch; i++){
    costMultiplier += 100 * (multiplierCount + 1 + i);
  }
  multiplierCostSpan.textContent = formatNumber(costMultiplier);

  cpsDisplay.textContent = `Clicks por segundo: ${formatNumber(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;

  gemsDisplay.textContent = formatNumber(gems);

  // Atualiza botões de rebirth
  if(score >= 1_000_000_000_000) { // 1T para rebirth
    rebirthBtn.disabled = false;
    rebirthInfo.textContent = "Você pode renascer! Clique em Rebirth para ganhar gemas.";
  } else {
    rebirthBtn.disabled = true;
    rebirthInfo.textContent = "Você precisa de 1T pontos para renascer.";
  }
}

// --- FORMATAÇÃO DE NÚMEROS (1k, 1M, 1B...) ---
const units = [
  {value: 1e93, symbol: "NNn"},
  {value: 1e90, symbol: "ONn"},
  {value: 1e87, symbol: "SpNn"},
  {value: 1e84, symbol: "SNn"},
  {value: 1e81, symbol: "QnNn"},
  {value: 1e78, symbol: "QNn"},
  {value: 1e75, symbol: "TNn"},
  {value: 1e72, symbol: "DNn"},
  {value: 1e69, symbol: "UNn"},
  {value: 1e66, symbol: "Ng"},
  {value: 1e63, symbol: "NOgt"},
  {value: 1e60, symbol: "OOgt"},
  {value: 1e57, symbol: "SpOgt"},
  {value: 1e54, symbol: "SOgt"},
  {value: 1e51, symbol: "QnOgt"},
  {value: 1e48, symbol: "QTg"},
  {value: 1e45, symbol: "Tg"},
  {value: 1e42, symbol: "NVg"},
  {value: 1e39, symbol: "OVg"},
  {value: 1e36, symbol: "SpVg"},
  {value: 1e33, symbol: "SVg"},
  {value: 1e30, symbol: "QnVg"},
  {value: 1e27, symbol: "Vg"},
  {value: 1e24, symbol: "Nd"},
  {value: 1e21, symbol: "Ocd"},
  {value: 1e18, symbol: "Spd"},
  {value: 1e15, symbol: "Sxd"},
  {value: 1e12, symbol: "Qn"},
  {value: 1e9, symbol: "T"},
  {value: 1e6, symbol: "B"},
  {value: 1e3, symbol: "M"},
  {value: 1, symbol: "" }
];

function formatNumber(num) {
  for (let i = 0; i < units.length; i++) {
    if (num >= units[i].value) {
      return (num / units[i].value).toFixed(2).replace(/\.00$/, '') + units[i].symbol;
    }
  }
  return num.toString();
}

// --- REBIRTH (Renascimento) ---
rebirthBtn.addEventListener("click", () => {
  if (score >= 1_000_000_000_000) { // 1T
    const earnedGems = Math.floor(score / 1_000_000_000_000);
    gems += earnedGems;
    alert(`Você renasceu e ganhou ${earnedGems} gemas!`);
    // Resetar quase tudo, exceto gemas
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplier = 1;
    multiplierCount = 0;
    cps = 0;
    level = 1;
    xp = 0;

    salvarProgresso();
    atualizar();
  }
});

// --- RESETAR JOGO ---
resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que quer resetar TODO o jogo? Você perderá todo progresso, incluindo gemas.")) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplier = 1;
    multiplierCount = 0;
    cps = 0;
    level = 1;
    xp = 0;
    gems = 0;

    salvarProgresso();
    atualizar();

    alert("Jogo resetado com sucesso! Comece do zero.");
  }
});

// --- BATCH DE MELHORIAS (1, 10, 100) ---
const batchButtons = document.querySelectorAll(".batch-btn");
batchButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    clickBatch = parseInt(btn.dataset.batch);
    batchButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    atualizar();
  });
});

// --- SALVAR PROGRESSO ---
function salvarProgresso() {
  const saveData = {
    score,
    clickPower,
    autoClickers,
    multiplier,
    multiplierCount,
    cps,
    level,
    xp,
    gems
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

// --- CARREGAR PROGRESSO ---
function carregarProgresso() {
  const saved = localStorage.getItem("clickerSave");
  if (saved) {
    const data = JSON.parse(saved);
    score = data.score || 0;
    clickPower = data.clickPower || 1;
    autoClickers = data.autoClickers || 0;
    multiplier = data.multiplier || 1;
    multiplierCount = data.multiplierCount || 0;
    cps = data.cps || 0;
    level = data.level || 1;
    xp = data.xp || 0;
    gems = data.gems || 0;
  }
}

// --- INICIALIZAÇÃO ---
window.addEventListener("load", () => {
  carregarProgresso();
  atualizar();
  // Atualizar cada segundo (para autos)
  setInterval(() => {
    score += autoClickers * multiplier;
    cps = autoClickers * multiplier;
    atualizar();
    salvarProgresso();
  }, 1000);
});

// --- Estado do jogo ---
let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplier = 1;
let multiplierCount = 0;
let cps = 0;
let level = 1;
let xp = 0;
let gems = 0;

// Quantidade selecionada para compra
let selectedQty = 1;

const MAX_VALUE = 1e1000; // Limite máximo seguro para evitar NaN

// --- Sons ---
const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

// --- Elementos DOM ---
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

const qtyButtons = document.querySelectorAll(".qty-btn");

// Criar botão rebirth e inserir no DOM (logo após loja)
const rebirthSection = document.createElement('section');
rebirthSection.innerHTML = `
  <h2>Rebirth (Renascimento)</h2>
  <button id="rebirthBtn" disabled title="Alcance 1T para renascer e ganhar gemas">Rebirth - Reseta tudo e ganha gemas</button>
  <p id="rebirthInfo">Você precisa de 1T pontos para renascer.</p>
`;
document.querySelector(".container").appendChild(rebirthSection);

const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthInfo = document.getElementById("rebirthInfo");

// --- Função para formatar números ---
function formatNumber(num) {
  if (typeof num !== "number" || isNaN(num)) return "0";
  if (num >= MAX_VALUE) return "∞";
  const units = [
    "", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "Dc",
    "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd", "Nd", "Vg",
    "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg", "NVg", "Tg",
    "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg", "NTg", "Qg",
    "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg", "NQg", "Qq",
    "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq", "NQq", "Sg",
    "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg", "NSg", "Sgnt",
    "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt", "SSgnt", "SpSgnt", "OSgnt", "NSgnt", "Ogt",
    "UOgt", "DOgt", "TOgt", "QOgt", "QnOgt", "SOgt", "SpOgt", "OOgt", "NOgt", "Ng",
    "UNg", "DNn", "TNn", "QNn", "QnNn", "SNn", "SpNn", "ONn", "NNn"
  ];
  if (num < 1000) return num.toString();
  let unitIndex = 0;
  let reduced = num;
  while (reduced >= 1000 && unitIndex < units.length - 1) {
    reduced /= 1000;
    unitIndex++;
  }
  return reduced.toFixed(2).replace(/\.?0+$/, '') + units[unitIndex];
}

// --- Atualiza UI ---
function atualizar() {
  verificarLevelUp();

  // Limitar score e xp para evitar NaN
  if (!isFinite(score) || score > MAX_VALUE) score = MAX_VALUE;
  if (!isFinite(xp) || xp > MAX_VALUE) xp = MAX_VALUE;

  scoreDisplay.textContent = formatNumber(score);
  clickPowerSpan.textContent = formatNumber(clickPower);
  upgradeClickPowerCostSpan.textContent = formatNumber(Math.floor(10 * Math.pow(1.5, clickPower - 1)));

  autoClickersSpan.textContent = formatNumber(autoClickers);
  autoClickerCostSpan.textContent = formatNumber(50 * (autoClickers + 1));

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatNumber(100 * (multiplierCount + 1));

  cpsDisplay.textContent = `Clicks por segundo: ${formatNumber(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${Math.min((xp / (level * 100)) * 100, 100)}%`;

  gemsDisplay.textContent = formatNumber(gems);

  // Ativa/desativa botões baseado na grana e quantidade selecionada
  verificarBotoes();

  // Rebirth
  if (score >= 1e12) {
    rebirthBtn.disabled = false;
    rebirthInfo.textContent = `Você pode renascer e ganhar gemas!`;
  } else {
    rebirthBtn.disabled = true;
    rebirthInfo.textContent = `Você precisa de ${formatNumber(1e12)} pontos para renascer.`;
  }
}

// --- Verifica se houve level up ---
function verificarLevelUp() {
  if (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10; // recompensa por level
    buySound.play();
  }
}

// --- Verifica se os botões podem ser clicados ---
function verificarBotoes() {
  const cpCost = 10 * Math.pow(1.5, clickPower - 1);
  upgradeClickPowerBtn.disabled = score < cpCost * selectedQty;

  const acCost = 50 * (autoClickers + 1);
  buyAutoClickerBtn.disabled = score < acCost * selectedQty;

  const mCost = 100 * (multiplierCount + 1);
  buyMultiplierBtn.disabled = score < mCost * selectedQty;

  speedBoostBtn.disabled = gems < 20;
  multiplierBoostBtn.disabled = gems < 50;
}

// --- Comprar upgrades ---
function comprarUpgrade(tipo) {
  if (tipo === "clickPower") {
    const baseCost = 10;
    let upgradesBought = 0;
    for (let i = 0; i < selectedQty; i++) {
      const cost = Math.floor(baseCost * Math.pow(1.5, clickPower - 1));
      if (score >= cost) {
        score -= cost;
        clickPower++;
        upgradesBought++;
      } else break;
    }
    if (upgradesBought > 0) buySound.play();
  } else if (tipo === "autoClicker") {
    const baseCost = 50;
    let upgradesBought = 0;
    for (let i = 0; i < selectedQty; i++) {
      const cost = baseCost * (autoClickers + 1);
      if (score >= cost) {
        score -= cost;
        autoClickers++;
        upgradesBought++;
      } else break;
    }
    if (upgradesBought > 0) buySound.play();
  } else if (tipo === "multiplier") {
    const baseCost = 100;
    let upgradesBought = 0;
    for (let i = 0; i < selectedQty; i++) {
      const cost = baseCost * (multiplierCount + 1);
      if (score >= cost) {
        score -= cost;
        multiplier *= 2;
        multiplierCount++;
        upgradesBought++;
      } else break;
    }
    if (upgradesBought > 0) buySound.play();
  }
  atualizar();
}

upgradeClickPowerBtn.addEventListener("click", () => comprarUpgrade("clickPower"));
buyAutoClickerBtn.addEventListener("click", () => comprarUpgrade("autoClicker"));
buyMultiplierBtn.addEventListener("click", () => comprarUpgrade("multiplier"));

// Boosts temporários
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    boostSound.play();
    let boost = setInterval(() => {
      score += clickPower * multiplier;
      xp++;
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(boost), 30000);
    atualizar();
  }
});

multiplierBoostBtn.addEventListener("click", () => {
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
});

// Comprar gemas simulado
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// Auto clicker automático a cada segundo
setInterval(() => {
  score += autoClickers * multiplier;
  xp++;
  cps = autoClickers * multiplier;
  atualizar();
}, 1000);

// Seleção da quantidade para comprar upgrades
qtyButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    qtyButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    selectedQty = parseInt(btn.dataset.qty);
    atualizar();
  });
});

// --- Rebirth ---
rebirthBtn.addEventListener("click", () => {
  if (score >= 1e12) {
    // Calcular gemas ganhos
    const gemsGained = Math.floor(score / 1e12);
    gems += gemsGained;

    // Resetar tudo menos gems
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplier = 1;
    multiplierCount = 0;
    cps = 0;
    level = 1;
    xp = 0;

    alert(`Você renasceu e ganhou ${gemsGained} gemas!`);
    buySound.play();
    atualizar();
  }
});

// --- Salvar e carregar progresso ---
function salvarProgresso() {
  const data = {
    score, clickPower, autoClickers, multiplier,
    multiplierCount, cps, level, xp, gems
  };
  localStorage.setItem("clickerSimData", JSON.stringify(data));
}

function carregarProgresso() {
  const data = JSON.parse(localStorage.getItem("clickerSimData"));
  if (data) {
    score = data.score ?? 0;
    clickPower = data.clickPower ?? 1;
    autoClickers = data.autoClickers ?? 0;
    multiplier = data.multiplier ?? 1;
    multiplierCount = data.multiplierCount ?? 0;
    cps = data.cps ?? 0;
    level = data.level ?? 1;
    xp = data.xp ?? 0;
    gems = data.gems ?? 0;
  }
}

// Atualiza e salva periodicamente
function loopAtualizacao() {
  atualizar();
  salvarProgresso();
  requestAnimationFrame(loopAtualizacao);
}

// Inicialização
window.addEventListener("load", () => {
  carregarProgresso();
  atualizar();
  loopAtualizacao();
});

// Tema claro/escuro
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// --- Variáveis do jogo ---
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

let currentWorld = "Sun";

let upgradeAmount = 1; // Pode ser 1, 10, 100, 1000 ou 'max'

// Sons
const clickSound = new Audio("click.mp3");
const buySound = new Audio("buy.mp3");
const boostSound = new Audio("boost.mp3");

// DOM Elements
const clickBtn = document.getElementById("clickBtn");
const cpsCount = document.getElementById("cpsCount");
const xpBar = document.getElementById("xpBar");
const levelSpan = document.getElementById("level");
const gemsCount = document.getElementById("gemsCount");
const rebirthCount = document.getElementById("rebirthCount");
const upgradeAmountsBtns = document.querySelectorAll(".upgradeAmountBtn");
const upgradesList = document.getElementById("upgradesList");
const worldNameSpan = document.getElementById("worldName");
const currentWorldSpan = document.getElementById("currentWorld");
const toggleThemeBtn = document.getElementById("toggleTheme");

// Config Upgrades (exemplo, pode expandir)
const upgradesConfig = [
  {
    id: "clickPower",
    name: "Melhorar Click Power",
    baseCost: 10,
    level: 0,
    getCost(level, amount) {
      // custo aumenta exponencialmente, multiplicado pela quantidade
      let total = 0;
      for (let i = 0; i < amount; i++) {
        total += Math.floor(this.baseCost * Math.pow(1.5, level + i));
      }
      return total;
    },
    onBuy(amount) {
      this.level += amount;
      clickPower += amount;
    },
    getLevel() {
      return this.level;
    }
  },
  {
    id: "autoClicker",
    name: "Comprar AutoClicker",
    baseCost: 50,
    level: 0,
    getCost(level, amount) {
      let total = 0;
      for (let i = 0; i < amount; i++) {
        total += this.baseCost * (level + i + 1);
      }
      return total;
    },
    onBuy(amount) {
      this.level += amount;
      autoClickers += amount;
    },
    getLevel() {
      return this.level;
    }
  },
  {
    id: "multiplier",
    name: "Comprar Multiplicador",
    baseCost: 100,
    level: 0,
    getCost(level, amount) {
      let total = 0;
      for (let i = 0; i < amount; i++) {
        total += this.baseCost * (level + i + 1);
      }
      return total;
    },
    onBuy(amount) {
      this.level += amount;
      multiplierCount += amount;
      recalcularMultiplicador();
    },
    getLevel() {
      return this.level;
    }
  }
];

// Função pra recalcular o multiplicador com rebirths
function recalcularMultiplicador() {
  multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
}

// Formatador de números grandes (mais completo)
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc",
    "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd", "Nd", "Vg", "UVg", "DVg", "TVg", "QVg",
    "QnVg", "SVg", "SpVg", "OVg", "NVg", "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg",
    "OTg", "NTg", "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg", "NQg", "Qq",
    "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq", "NQq", "Sg", "USg", "DSg", "TSg", "QSg",
    "QnSg", "SSg", "SpSg", "OSg", "NSg", "Sgnt", "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt",
    "SSgnt", "SpSgnt", "OSgnt", "NSgnt", "Ogt", "UOgt", "DOgt", "TOgt", "QOgt", "QnOgt", "SOgt",
    "SpOgt", "OOgt", "NOgt", "Ng", "UNg", "DNn", "TNn", "QNn", "QnNn", "SNn", "SpNn", "ONn", "NNn"
  ];
  let ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

// Salvar e carregar estado
function salvarEstado() {
  const estado = {
    score, clickPower, autoClickers, multiplierCount, multiplier,
    cps, level, xp, gems, rebirths, currentWorld,
    upgradesLevels: upgradesConfig.map(u => u.level)
  };
  localStorage.setItem("clickerSimEstado", JSON.stringify(estado));
}

function carregarEstado() {
  const estadoRaw = localStorage.getItem("clickerSimEstado");
  if (!estadoRaw) return;

  const estado = JSON.parse(estadoRaw);
  score = estado.score || 0;
  clickPower = estado.clickPower || 1;
  autoClickers = estado.autoClickers || 0;
  multiplierCount = estado.multiplierCount || 0;
  multiplier = estado.multiplier || 1;
  cps = estado.cps || 0;
  level = estado.level || 1;
  xp = estado.xp || 0;
  gems = estado.gems || 0;
  rebirths = estado.rebirths || 0;
  currentWorld = estado.currentWorld || "Sun";

  if (estado.upgradesLevels && estado.upgradesLevels.length === upgradesConfig.length) {
    estado.upgradesLevels.forEach((lvl, i) => upgradesConfig[i].level = lvl);
  }

  recalcularMultiplicador();
}

// Atualizar a interface
function atualizarInterface() {
  document.getElementById("scoreDisplay")?.remove(); // remove se existir
  // Atualizar info principais
  document.getElementById("score")?.remove();

  // Cria ou atualiza score na tela principal
  let scoreEl = document.getElementById("score");
  if (!scoreEl) {
    const clickPanel = document.getElementById("clickPanel");
    scoreEl = document.createElement("p");
    scoreEl.id = "score";
    clickPanel.appendChild(scoreEl);
  }
  scoreEl.textContent = `Clicks: ${formatarNumero(score)}`;

  cpsCount.textContent = formatarNumero(cps);
  xpBar.style.width = `${Math.min((xp / (level * 100)) * 100, 100)}%`;
  levelSpan.textContent = level;
  gemsCount.textContent = gems;
  rebirthCount.textContent = rebirths;
  worldNameSpan.textContent = currentWorld;
  currentWorldSpan.textContent = currentWorld;

  // Atualiza upgrades
  upgradesList.innerHTML = "";
  for (let upgrade of upgradesConfig) {
    const upgradeRow = document.createElement("div");
    upgradeRow.classList.add("upgrade-row");

    const btn = document.createElement("button");
    btn.classList.add("btn", "upgrade-btn");
    btn.textContent = `${upgrade.name} (Nível: ${upgrade.getLevel()})`;
    btn.disabled = upgrade.getCost(upgrade.level, upgradeAmount) > score;
    btn.title = `Custo: ${formatarNumero(upgrade.getCost(upgrade.level, upgradeAmount))}`;
    btn.addEventListener("click", () => comprarUpgrade(upgrade));

    const costSpan = document.createElement("span");
    costSpan.textContent = `Custo: ${formatarNumero(upgrade.getCost(upgrade.level, upgradeAmount))}`;

    upgradeRow.appendChild(btn);
    upgradeRow.appendChild(costSpan);
    upgradesList.appendChild(upgradeRow);
  }
}

// Comprar upgrade
function comprarUpgrade(upgrade) {
  let amountToBuy = upgradeAmount;
  if (upgradeAmount === "max") {
    amountToBuy = calcularMaximoCompra(upgrade);
  }

  const custo = upgrade.getCost(upgrade.level, amountToBuy);
  if (score >= custo) {
    score -= custo;
    upgrade.onBuy(amountToBuy);
    buySound.play();
    recalcularMultiplicador();
    atualizarInterface();
    salvarEstado();
  } else {
    alert(`Você precisa de ${formatarNumero(custo)} clicks para comprar!`);
  }
}

// Calcula máximo que pode comprar baseado no score atual
function calcularMaximoCompra(upgrade) {
  let max = 0;
  let totalCost = 0;
  while (true) {
    const cost = upgrade.getCost(upgrade.level + max, 1);
    if (totalCost + cost > score) break;
    totalCost += cost;
    max++;
  }
  return max || 1;
}

// Evento dos botões de quantidade
upgradeAmountsBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountsBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    upgradeAmount = btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
  });
});

// Clique no botão principal
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp++;
  clickSound.play();
  atualizarInterface();
  salvarEstado();
});

// AutoClicker rodando a cada segundo
setInterval(() => {
  const clicksPorSegundo = autoClickers * clickPower * multiplier;
  score += clicksPorSegundo;
  cps = clicksPorSegundo;
  xp += Math.floor(clicksPorSegundo / 2);
  atualizarInterface();
  salvarEstado();
}, 1000);

// Level Up
function verificarLevelUp() {
  while (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

// Boosts (exemplo simples)
function aplicarBoost(tipo) {
  if (tipo === "speed") {
    if (gems >= 20) {
      gems -= 20;
      boostSound.play();
      let boostInterval = setInterval(() => {
        score += clickPower * multiplier;
        atualizarInterface();
      }, 100);
      setTimeout(() => clearInterval(boostInterval), 30000);
    } else alert("Você precisa de 20 gemas para o boost de velocidade!");
  } else if (tipo === "multiplier") {
    if (gems >= 50) {
      gems -= 50;
      boostSound.play();
      multiplier *= 5;
      atualizarInterface();
      setTimeout(() => {
        multiplier /= 5;
        atualizarInterface();
      }, 30000);
    } else alert("Você precisa de 50 gemas para o boost multiplicador!");
  }
}

// Rebirth
function custoRebirth() {
  // Crescimento exponencial do custo
  return Math.pow(10, 3 * (rebirths + 1));
}

function fazerRebirth() {
  const custo = custoRebirth();
  if (score >= custo) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1;
    cps = 0;
    level = 1;
    xp = 0;
    rebirths++;
    gems += 50; // recompensa extra por rebirth
    upgradesConfig.forEach(u => u.level = 0);
    recalcularMultiplicador();
    buySound.play();
    atualizarInterface();
    salvarEstado();
  } else alert(`Rebirth custa ${formatarNumero(custo)} clicks!`);
}

// Resetar jogo
function resetarJogo() {
  if (confirm("Tem certeza que deseja resetar o jogo? Perderá todo progresso!")) {
    localStorage.clear();
    location.reload();
  }
}

// Alternar tema claro/escuro
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// Inicia o jogo
window.addEventListener("load", () => {
  carregarEstado();
  atualizarInterface();

  // Atualiza levelup em loop
  setInterval(() => {
    verificarLevelUp();
    salvarEstado();
  }, 1000);
});

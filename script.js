// --- VARIÁVEIS GLOBAIS ---
let score = 0, clickPower = 1, autoClickers = 0, multiplier = 1, multiplierCount = 0;
let cps = 0, level = 1, xp = 0, gems = 0, rebirths = 0;
let currentWorld = "Earth";

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
const worldNameSpan = document.getElementById("worldName");
const currentWorldSpan = document.getElementById("currentWorld");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

const rebirthBtn = document.getElementById("rebirthBtn");
const resetBtn = document.getElementById("resetBtn");
const nextWorldBtn = document.getElementById("nextWorldBtn");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
let upgradeAmount = 1;

// --- FORMATAR NÚMEROS GRANDES ---
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  let ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

// --- SALVAR & CARREGAR ESTADO ---
function salvarEstado() {
  const estado = { score, clickPower, autoClickers, multiplier, multiplierCount, cps, level, xp, gems, rebirths, currentWorld };
  localStorage.setItem("clickerSave", JSON.stringify(estado));
}

function carregarEstado() {
  const estado = JSON.parse(localStorage.getItem("clickerSave"));
  if (estado) {
    Object.assign(window, estado);
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
  }
}

// --- FUNÇÕES DE CUSTO ---
function custoUpgradeClickPower() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1)) * (upgradeAmount === 'max' ? 1 : upgradeAmount);
}
function custoAutoClicker() {
  return 50 * (autoClickers + 1) * (upgradeAmount === 'max' ? 1 : upgradeAmount);
}
function custoMultiplicador() {
  let total = 0;
  for (let i = 0; i < (upgradeAmount === 'max' ? 1 : upgradeAmount); i++) {
    total += 100 * (multiplierCount + i + 1);
  }
  return total;
}

// --- FUNÇÃO PARA CALCULAR MÁXIMO QUE PODE COMPRAR ---
function calcularMaximo(custoFunc, currentCount = 0) {
  let maxCompra = 0;
  let custoTotal = 0;
  while (true) {
    let proximoCusto = custoFunc(maxCompra + 1, currentCount);
    if (score >= custoTotal + proximoCusto) {
      custoTotal += proximoCusto;
      maxCompra++;
    } else {
      break;
    }
  }
  return maxCompra;
}

// Ajustar custo com quantidade para upgrades que aumentam incrementalmente (ex: multiplicador)
function custoUpgradeIncremental(base, currentCount, quantidade) {
  let total = 0;
  for (let i = 0; i < quantidade; i++) {
    total += base * (currentCount + i + 1);
  }
  return total;
}

// --- EVENTOS DOS BOTÕES ---

clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp++;
  clickSound.play();
  atualizar();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  let quantidade = upgradeAmount === 'max' ? calcularMaximo((i) => Math.floor(10 * Math.pow(1.5, clickPower - 1 + i))) : upgradeAmount;
  let custo = 0;
  for (let i = 0; i < quantidade; i++) {
    custo += Math.floor(10 * Math.pow(1.5, clickPower - 1 + i));
  }
  if (score >= custo && quantidade > 0) {
    score -= custo;
    clickPower += quantidade;
    buySound.play();
    atualizar();
  } else if (quantidade > 0) {
    alert(`Você precisa de ${formatarNumero(custo)} clicks para comprar!`);
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  let quantidade = upgradeAmount === 'max' ? calcularMaximo((i, current) => 50 * (current + i), autoClickers) : upgradeAmount;
  let custo = 0;
  for (let i = 0; i < quantidade; i++) {
    custo += 50 * (autoClickers + i + 1);
  }
  if (score >= custo && quantidade > 0) {
    score -= custo;
    autoClickers += quantidade;
    buySound.play();
    atualizar();
  } else if (quantidade > 0) {
    alert(`Você precisa de ${formatarNumero(custo)} clicks para comprar!`);
  }
});

buyMultiplierBtn.addEventListener("click", () => {
  let quantidade = upgradeAmount === 'max' ? calcularMaximo((i, current) => 100 * (current + i), multiplierCount) : upgradeAmount;
  let custo = custoUpgradeIncremental(100, multiplierCount, quantidade);
  if (score >= custo && quantidade > 0) {
    score -= custo;
    multiplierCount += quantidade;
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.play();
    atualizar();
  } else if (quantidade > 0) {
    alert(`Você precisa de ${formatarNumero(custo)} clicks para comprar!`);
  }
});

speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    boostSound.play();
    const interval = setInterval(() => {
      score += clickPower * multiplier;
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(interval), 30000);
    atualizar();
  } else {
    alert("Você precisa de 20 gemas para comprar este boost!");
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
  } else {
    alert("Você precisa de 50 gemas para comprar este boost!");
  }
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

rebirthBtn.addEventListener("click", () => {
  const custo = Math.pow(10, 3 * (rebirths + 1)); // Exponencial
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
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
    buySound.play();
    atualizar();
  } else {
    alert(`Rebirth custa ${formatarNumero(custo)} clicks!`);
  }
});

resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja resetar o jogo? Todo o progresso será perdido.")) {
    localStorage.clear();
    location.reload();
  }
});

upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    let val = btn.dataset.amount;
    upgradeAmount = val === "max" ? "max" : parseInt(val);
  });
});

// --- AUTOS CLICKS POR SEGUNDO ---
setInterval(() => {
  const clicksPorSegundo = autoClickers * multiplier;
  score += clicksPorSegundo;
  cps = clicksPorSegundo;
  atualizar();
}, 1000);

// --- MUNDOS ---
const worlds = ["Earth", "Sun", "Moon", "Mars", "Jupiter"];
let worldIndex = worlds.indexOf(currentWorld);

nextWorldBtn.addEventListener("click", () => {
  worldIndex = (worldIndex + 1) % worlds.length;
  currentWorld = worlds[worldIndex];
  worldNameSpan.textContent = currentWorld;
  currentWorldSpan.textContent = currentWorld;
  alert(`Você mudou para o mundo: ${currentWorld}`);
  salvarEstado();
});

// --- VERIFICAÇÃO DE LEVEL UP ---
function verificarLevelUp() {
  while (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

// --- ATUALIZAR INTERFACE ---
function atualizar() {
  verificarLevelUp();

  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  upgradeClickPowerCostSpan.textContent = formatarNumero(custoUpgradeClickPower());
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(custoAutoClicker());
  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatarNumero(custoMultiplicador());
  cpsDisplay.textContent = `Clicks por segundo: ${formatarNumero(cps)}`;
  levelDisplay.textContent = level;
  xpBar.style.width = `${Math.min((xp / (level * 100)) * 100, 100)}%`;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;
  worldNameSpan.textContent = currentWorld;
  currentWorldSpan.textContent = currentWorld;

  salvarEstado();
}

// --- TROCAR TEMA ---
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("light");
});

// --- INICIALIZAÇÃO ---
window.addEventListener("load", () => {
  carregarEstado();
  atualizar();
});

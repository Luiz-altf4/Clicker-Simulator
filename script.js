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
let upgradeAmount = 1; // Default comprar 1 upgrade por vez

// Array com as potências para as unidades do rebirth, até 100 níveis
const rebirthCostsPowers = [
  3, 6, 9, 12, 15, 18, 21, 24, 27, 30,
  33, 36, 39, 42, 45, 48, 51, 54, 57, 60,
  63, 66, 69, 72, 75, 78, 81, 84, 87, 90,
  93, 96, 99, 102, 105, 108, 111, 114, 117, 120,
  123, 126, 129, 132, 135, 138, 141, 144, 147, 150,
  153, 156, 159, 162, 165, 168, 171, 174, 177, 180,
  183, 186, 189, 192, 195, 198, 201, 204, 207, 210,
  213, 216, 219, 222, 225, 228, 231, 234, 237, 240,
  243, 246, 249, 252, 255, 258, 261, 264, 267, 270,
  273, 276, 279, 282, 285, 288, 291, 294, 297, 300
];

// Função para calcular custo do rebirth com base na quantidade de rebirths já feitas
function custoRebirth(rebirthCount) {
  if (rebirthCount < rebirthCostsPowers.length) {
    return Math.pow(10, rebirthCostsPowers[rebirthCount]);
  } else {
    // Crescimento infinito após 100 níveis (linear + potência máxima)
    return Math.pow(10, rebirthCostsPowers[rebirthCostsPowers.length - 1]) + (rebirthCount - rebirthCostsPowers.length + 1) * 1e300;
  }
}

// Função para formatar números grandes com unidades tipo 1k, 1M, 1B, 1T, etc até infinito
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = [
    "", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc",
    "N", "Dc", "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd",
    "Nd", "Vg", "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg",
    "NVg", "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg",
    "NTg", "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg",
    "NQg", "Qq", "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq",
    "NQq", "Sg", "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg",
    "NSg", "Sgnt", "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt", "SSgnt", "SpSgnt", "OSgnt", "NSgnt",
    "Ogt", "UOgt", "DOgt", "TOgt", "QOgt", "QnOgt", "SOgt", "SpOgt", "OOgt", "NOgt",
    "Ng", "UNg", "DNn", "TNn", "QNn", "QnNn", "SNn", "SpNn", "ONn", "NNn", "OLPWO", "NdOs", "NSposk",
    "Ldm", "Huoop", "Nowid", "Infernal", "Nallk", "Alsk", "SEoiUd", "A", "B", "C", "D", "E",
    "AB", "AC", "AD", "AE", "Comdwi", "CMD", "Gfsppdo", "osiwop", "OOOOOOOgtu", "DQtgSqSp", "omhfooe",
    "AqTpzRf", "mNsEjkD", "BdLuwXo", "zVtErPc", "yHqLmXa", "rTgPovB", "JtMwuZs", "EqYdrAf", "cLgUpMk", "NvYtlQz",
"WbmUjfE", "uSkzOcb", "fDwHryQ", "ZxgLMtA", "KoWvnJP", "VsLMdhr", "iPfEoqL", "jYHRxVc", "GblTMaX", "tRkXeNj",
"XoLqvRy", "YJmgtsd", "dRyxPlW", "FJvLzCn", "msOQaWv", "vLNBfTg", "CtmrYUJ", "GnQHrpl", "hXJKYzb", "VbzMWCs",
"ejrQphM", "LQNjmpB", "uyXhZWr", "SpMJrqT", "rTwPLmC", "DwZlVoj", "NpFYrEd", "xvRpjKn", "MJYtcqo", "ZPLxkqg",
"qlKNJus", "wMaRjZv", "epZOUyk", "oLYfJrT", "rLMQkhd", "SKprlTV", "zXDrYMj", "YoRLfnz", "qVWlHkJ", "vRpWZoq",
"KwLXtYh", "TGmzyPo", "fWLoUjB", "uOMqLrz", "JDmxRlN", "hbRzkLm", "VxLMRTu", "xWAqKLj", "PFvQzoM", "cWkYXJr",
"tLpVNHb", "UBNkyXc", "zJWxTup", "LsXQnzm", "HFzOrpL", "azqLxWP", "xoLMJRV", "kTYaRbL", "XvLKoPf", "LtZRPoj",
"dPqrYML", "mWXLKob", "QVpWrlo", "GZxpKYR", "uJvQLxm", "zKHrOYT", "OtwXJlz", "qzYPLkW", "tRLPJxv", "rKOYwZT",
"EFJrmqY", "MvXULrj", "XJrYtWk", "pTzWRmQ", "bqYoRPx", "yWXTLMk", "LOMxpqY", "JXovTYr", "WqRpXLY", "vnRMxjt",
"ZPWRyox", "XtqkJLM", "KLYzopM", "mTzYwXp", "pYVoXrm", "LqWRmjt", "xkLYvRp", "rXJPqwt", "JvXoPLY", "TZpqrmY"

  ];
  let ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

// --- Função para salvar o estado no localStorage ---
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

// --- Função para carregar estado do localStorage ---
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

// --- Função que atualiza a interface ---
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

  gemsDisplay.textContent = gems;

  rebirthCountSpan.textContent = rebirths;

  salvarEstado();
}

// --- Função para checar level up ---
function verificarLevelUp() {
  if (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

// --- Eventos dos botões ---

// Clique principal
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  atualizar();
});

// Upgrade click power
upgradeClickPowerBtn.addEventListener("click", () => {
  const costTotal = Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
  if (score >= costTotal) {
    score -= costTotal;
    clickPower += upgradeAmount;
    buySound.play();
    atualizar();
  }
});

// Comprar auto clicker
buyAutoClickerBtn.addEventListener("click", () => {
  const costTotal = 50 * (autoClickers + 1) * upgradeAmount;
  if (score >= costTotal) {
    score -= costTotal;
    autoClickers += upgradeAmount;
    buySound.play();
    atualizar();
  }
});

// Comprar multiplicador
buyMultiplierBtn.addEventListener("click", () => {
  let costTotal = 0;
  let multiplierIncrease = 0;
  for (let i = 0; i < upgradeAmount; i++) {
    costTotal += 100 * (multiplierCount + i + 1);
    multiplierIncrease++;
  }
  if (score >= costTotal) {
    score -= costTotal;
    multiplier *= Math.pow(2, multiplierIncrease);
    multiplierCount += multiplierIncrease;
    buySound.play();
    atualizar();
  }
});

// Boosts
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

// Comprar gemas (simulado)
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// Auto clickers automáticos a cada segundo
setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
}, 1000);

// Botões para alterar quantidade de upgrades comprados
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmount = parseInt(btn.dataset.amount);
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Rebirth
rebirthBtn.addEventListener("click", () => {
  const cost = custoRebirth(rebirths);
  if (score >= cost) {
    score -= cost;
    rebirths++;
    // Resetar upgrades básicos, mas mantém gems, level e xp (ou pode ajustar)
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplier = 1;
    multiplierCount = 0;
    cps = 0;
    level = 1;
    xp = 0;
    buySound.play();
    atualizar();
  } else {
    alert(`Rebirth custa ${formatarNumero(cost)} clicks!`);
  }
});

// Resetar jogo
resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que quer resetar o jogo? Isso apagará todo seu progresso!")) {
    localStorage.removeItem("clickerSimEstado");
    location.reload();
  }
});

// Tema (claro/escuro)
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// --- Inicialização ---
window.addEventListener("load", () => {
  carregarEstado();
  atualizar();
});


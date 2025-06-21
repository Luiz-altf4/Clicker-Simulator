// --- SCRIPT DO JOGO COMPLETO E SEPARADO ---

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
const multiplierDisplay = document.getElementById("multiplier");

const cpsDisplay = document.getElementById("cps");
const xpBar = document.getElementById("xpBar");
const levelDisplay = document.getElementById("levelDisplay");
const gemsDisplay = document.getElementById("gemsCount");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthCountSpan = document.getElementById("rebirthCount");
const rebirthCostDisplay = document.getElementById("rebirthCostDisplay");

const resetBtn = document.getElementById("resetBtn");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
let upgradeAmount = 1;

// Rebirth custo potências de 10 com array até 100 níveis
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
    "", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc",
    "N", "Dc", "Ud", "Dd", "Td", "Qd", "Qn", "Sxd", "Spd", "Ocd",
    "Nd", "Vg", "UVg", "DVg", "TVg", "QVg", "QnVg", "SVg", "SpVg", "OVg",
    "NVg", "Tg", "UTg", "DTg", "TTg", "QTg", "QnTg", "STg", "SpTg", "OTg",
    "NTg", "Qg", "UQg", "DQg", "TQg", "QQg", "QnQg", "SQg", "SpQg", "OQg",
    "NQg", "Qq", "UQq", "DQq", "TQq", "QQq", "QnQq", "SQq", "SpQq", "OQq",
    "NQq", "Sg", "USg", "DSg", "TSg", "QSg", "QnSg", "SSg", "SpSg", "OSg",
    "NSg", "Sgnt", "USgnt", "DSgnt", "TSgnt", "QSgnt", "QnSgnt", "SSgnt", "SpSgnt", "OSgnt", "NSgnt",
    "Ogt", "UOgt", "DOgt", "TOgt", "QOgt", "QnOgt", "SOgt", "SpOgt", "OOgt", "NOgt",
    "Ng", "UNg", "DNn", "TNn", "QNn", "QnNn", "SNn", "SpNn", "ONn", "NNn",
    "OLPWO", "NdOs", "NSposk", "Ldm", "Huoop", "Nowid", "Infernal", "Nallk", "Alsk",
    "SEoiUd", "A", "B", "C", "D", "E", "AB", "AC", "AD", "AE", "Comdwi",
    "CMD", "Gfsppdo", "osiwop", "OOOOOOOgtu", "DQtgSqSp", "omhfooe", "AqTpzRf",
    "mNsEjkD", "BdLuwXo", "zVtErPc", "yHqLmXa", "rTgPovB", "JtMwuZs", "EqYdrAf",
    "cLgUpMk", "NvYtlQz", "WbmUjfE", "uSkzOcb", "fDwHryQ", "ZxgLMtA", "KoWvnJP",
    "VsLMdhr", "iPfEoqL", "jYHRxVc", "GblTMaX", "tRkXeNj", "XoLqvRy", "YJmgtsd",
    "dRyxPlW", "FJvLzCn", "msOQaWv", "vLNBfTg", "CtmrYUJ", "GnQHrpl", "hXJKYzb",
    "VbzMWCs", "ejrQphM", "LQNjmpB", "uyXhZWr", "SpMJrqT", "rTwPLmC", "DwZlVoj",
    "NpFYrEd", "xvRpjKn", "MJYtcqo", "ZPLxkqg", "qlKNJus", "wMaRjZv", "epZOUyk",
    "oLYfJrT", "rLMQkhd", "SKprlTV", "zXDrYMj", "YoRLfnz", "qVWlHkJ", "vRpWZoq",
    "KwLXtYh", "TGmzyPo", "fWLoUjB", "uOMqLrz", "JDmxRlN", "hbRzkLm", "VxLMRTu",
    "xWAqKLj", "PFvQzoM", "cWkYXJr", "tLpVNHb", "UBNkyXc", "zJWxTup", "LsXQnzm",
    "HFzOrpL", "azqLxWP", "xoLMJRV", "kTYaRbL", "XvLKoPf", "LtZRPoj", "dPqrYML",
    "mWXLKob", "QVpWrlo", "GZxpKYR", "uJvQLxm", "zKHrOYT", "OtwXJlz", "qzYPLkW",
    "tRLPJxv", "rKOYwZT", "EFJrmqY", "MvXULrj", "XJrYtWk", "pTzWRmQ", "bqYoRPx",
    "yWXTLMk", "LOMxpqY", "JXovTYr", "WqRpXLY", "vnRMxjt", "ZPWRyox", "XtqkJLM",
    "KLYzopM", "mTzYwXp", "pYVoXrm", "LqWRmjt", "xkLYvRp", "rXJPqwt", "JvXoPLY",
    "TZpqrmY"
  ];
  const ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  const valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

// Salvamento e carregamento do estado
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

// Atualiza tudo na tela
function atualizar() {
  verificarLevelUp();
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = formatarNumero(Math.floor(10 * Math.pow(1.5, clickPower - 1)));
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(50 * (autoClickers + 1));
  multiplierCountSpan.textContent = multiplierCount;
  multiplierDisplay.textContent = multiplier.toFixed(2);
  multiplierCostSpan.textContent = formatarNumero(100 * (multiplierCount + 1) * 1.5);
  cpsDisplay.textContent = formatarNumero(cps);
  levelDisplay.textContent = level;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;
  rebirthCostDisplay.textContent = formatarNumero(custoRebirth(rebirths));
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

// Clique principal
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier * (1 + rebirths);
  xp++;
  clickSound.play();
  atualizar();
});

// Upgrade Click Power
upgradeClickPowerBtn.addEventListener("click", () => {
  const costTotal = Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
  if (score >= costTotal) {
    score -= costTotal;
    clickPower += upgradeAmount;
    buySound.play();
    atualizar();
  }
});

// Comprar Auto Clicker
buyAutoClickerBtn.addEventListener("click", () => {
  const costTotal = 50 * (autoClickers + 1) * upgradeAmount;
  if (score >= costTotal) {
    score -= costTotal;
    autoClickers += upgradeAmount;
    buySound.play();
    atualizar();
  }
});

// Comprar Multiplicador (preço aumenta mais rápido, e multiplicador aumenta +2x por rebirth)
buyMultiplierBtn.addEventListener("click", () => {
  let costTotal = 0;
  let increase = 0;
  for (let i = 0; i < upgradeAmount; i++) {
    costTotal += Math.floor(100 * (multiplierCount + i + 1) * 1.5);
    increase++;
  }
  if (score >= costTotal) {
    score -= costTotal;
    multiplierCount += increase;
    multiplier = 1 + multiplierCount * 2 * (rebirths + 1); // Cada rebirth aumenta +2x por multiplicador comprado
    buySound.play();
    atualizar();
  }
});

// Boost de velocidade (custa gemas)
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    buySound.play();
    const boostInterval = setInterval(() => {
      score += clickPower * multiplier * (1 + rebirths);
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(boostInterval), 30000);
  } else {
    alert("Você não tem gemas suficientes!");
  }
});

// Boost de multiplicador (custa gemas)
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
    alert("Você não tem gemas suficientes!");
  }
});

// Comprar gemas simulado
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// Atualização automática pelo auto clicker a cada 1s
setInterval(() => {
  score += autoClickers * multiplier * (1 + rebirths);
  cps = autoClickers * multiplier * (1 + rebirths);
  atualizar();
}, 1000);

// Seleção de quantidade para upgrades
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
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1;
    cps = 0;
    level = 1;
    xp = 0;
    rebirths++;
    gems += 50; // Bônus ao fazer rebirth
    buySound.play();
    atualizar();
  } else {
    alert(`Rebirth custa ${formatarNumero(cost)} clicks!`);
  }
});

// Resetar jogo (limpar localStorage e reload)
resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que quer resetar o jogo? Isso apagará todo seu progresso!")) {
    localStorage.clear();
    location.reload();
  }
});

// Toggle tema dark/light
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Carregar estado no load
window.addEventListener("load", () => {
  carregarEstado();
  atualizar();
});

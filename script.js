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
  const unidades = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "N", "Dc"
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
"EFJrmqY", "MvXoLPj", "zUxOJRb", "qLWTYvz", "JXLMpTR", "abWLkPx", "dJTvQzL", "YOwrLKP", "kLXzJPq", "MrVXLpu",
"ZoYLPJq", "TWXzLPq", "VYPJqLX", "GJrLKPV", "PxVJqLK", "LoYVJKP", "WPLJkXY", "vJKLPQO", "HLPJKQY", "tXPQJLK"];
  let ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

// Salvar estado no localStorage
function salvarEstado() {
  const estado = {
    score, clickPower, autoClickers, multiplier, multiplierCount,
    cps, level, xp, gems, rebirths
  };
  localStorage.setItem("clickerSimEstado", JSON.stringify(estado));
}

// Carregar estado do localStorage
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

// Atualizar tela
function atualizar() {
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = formatarNumero(clickPower);
  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(custoAutoClicker());
  multiplierCostSpan.textContent = formatarNumero(custoMultiplier());
  multiplierCountSpan.textContent = multiplierCount;
  cpsDisplay.textContent = formatarNumero(cps);
  levelDisplay.textContent = level;
  gemsDisplay.textContent = gems;
  rebirthCountSpan.textContent = rebirths;

  upgradeClickPowerCostSpan.textContent = formatarNumero(custoUpgradeClickPower());
  xpBar.style.width = Math.min((xp / xpParaProximoNivel()) * 100, 100) + "%";

  salvarEstado();
}

// Custo do upgrade do clique
function custoUpgradeClickPower() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
}

// Custo Auto Clicker
function custoAutoClicker() {
  return Math.floor(50 * Math.pow(1.7, autoClickers));
}

// Custo Multiplier
function custoMultiplier() {
  return Math.floor(100 * Math.pow(2, multiplierCount));
}

// XP para próximo nível
function xpParaProximoNivel() {
  return Math.floor(100 * Math.pow(1.3, level - 1));
}

// Nível Up
function levelUp() {
  while (xp >= xpParaProximoNivel()) {
    xp -= xpParaProximoNivel();
    level++;
    if (buySound) buySound.play();
  }
}

// Clicar manualmente
clickBtn.addEventListener("click", () => {
  let ganho = clickPower * multiplier * upgradeAmount;
  score += ganho;
  xp += ganho / 2;
  if (clickSound) clickSound.play();
  levelUp();
  atualizar();
});

// Comprar upgrade clique
upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = custoUpgradeClickPower();
  if (score >= cost) {
    score -= cost;
    clickPower += upgradeAmount;
    if (buySound) buySound.play();
    atualizar();
  } else {
    alert("Pontos insuficientes para comprar!");
  }
});

// Comprar Auto Clicker
buyAutoClickerBtn.addEventListener("click", () => {
  const cost = custoAutoClicker();
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    if (buySound) buySound.play();
    atualizar();
  } else {
    alert("Pontos insuficientes para Auto Clicker!");
  }
});

// Comprar Multiplicador
buyMultiplierBtn.addEventListener("click", () => {
  const cost = custoMultiplier();
  if (score >= cost) {
    score -= cost;
    multiplierCount++;
    multiplier = 1 + multiplierCount * 0.2;
    if (buySound) buySound.play();
    atualizar();
  } else {
    alert("Pontos insuficientes para Multiplicador!");
  }
});

// Comprar gemas (simples, só aumenta)
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  if (buySound) buySound.play();
  atualizar();
});

// Boosts (exemplo: gastam gems)
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    // Aumenta CPS artificialmente por 10 segundos
    cps += 5;
    if (boostSound) boostSound.play();
    atualizar();
    setTimeout(() => {
      cps -= 5;
      atualizar();
    }, 10000);
  } else {
    alert("Gemas insuficientes para boost de velocidade!");
  }
});

multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    multiplier += 0.5;
    if (boostSound) boostSound.play();
    atualizar();
    setTimeout(() => {
      multiplier -= 0.5;
      atualizar();
    }, 10000);
  } else {
    alert("Gemas insuficientes para boost de multiplicador!");
  }
});

// Upgrade quantidade para comprar
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmount = parseInt(btn.dataset.amount);
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    atualizar();
  });
});

// Rebirth
rebirthBtn.addEventListener("click", () => {
  // custo exemplo: 1e12 para 1º rebirth, 1e15 para 2º e assim por diante, adaptável
  const custo = Math.pow(10, 12 + rebirths * 3);
  if (score >= custo) {
    score = 0;
    clickPower = 1;
    autoClickers = 0;
    multiplierCount = 0;
    multiplier = 1;
    level = 1;
    xp = 0;
    gems = 0;
    rebirths++;
    if (buySound) buySound.play();
    atualizar();
  } else {
    alert(`Rebirth custa ${formatarNumero(custo)} pontos!`);
  }
});

// Resetar jogo
resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que quer resetar o jogo?")) {
    localStorage.clear();
    location.reload();
  }
});

// Tema escuro / claro
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Auto clickers automáticos a cada segundo
setInterval(() => {
  let ganho = autoClickers * clickPower * multiplier;
  score += ganho;
  xp += ganho / 2;
  cps = ganho;
  levelUp();
  atualizar();
}, 1000);

// Inicialização
window.onload = () => {
  carregarEstado();
  atualizar();
};

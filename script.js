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

// --- CLICKER ---
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  atualizar();
});

// --- UPGRADE: CLICK POWER ---
upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    buySound.play();
    atualizar();
  }
});

// --- UPGRADE: AUTOCLICKER ---
buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    buySound.play();
    atualizar();
  }
});

// --- UPGRADE: MULTIPLICADOR ---
buyMultiplierBtn.addEventListener("click", () => {
  const cost = 100 * (multiplierCount + 1);
  if (score >= cost) {
    score -= cost;
    multiplier *= 2;
    multiplierCount++;
    buySound.play();
    atualizar();
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
  }
});

// --- BOOST: MULTIPLICADOR x5 ---
multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    buySound.play();
    multiplier *= 5;
    setTimeout(() => {
      multiplier /= 5;
    }, 30000);
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

  scoreDisplay.textContent = Math.floor(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = Math.floor(10 * Math.pow(1.5, clickPower - 1));

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = 50 * (autoClickers + 1);

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = 100 * (multiplierCount + 1);

  cpsDisplay.textContent = `Clicks por segundo: ${cps}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;

  gemsDisplay.textContent = gems;
}

// --- TEMA ---
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// === 🏆 RANKING FIREBASE ===

// Salvar score no Firebase
async function salvarScore(nome, score) {
  if (!nome) return;
  try {
    await db.collection("ranking").doc(nome).set({
      score: score,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Pontuação salva no ranking!");
  } catch (error) {
    console.error("Erro ao salvar:", error);
  }
}

// Pegar ranking do Firebase
async function pegarRanking() {
  try {
    const snapshot = await db.collection("ranking")
      .orderBy("score", "desc")
      .limit(10)
      .get();

    const ranking = [];
    snapshot.forEach(doc => {
      ranking.push({ nome: doc.id, score: doc.data().score });
    });
    return ranking;
  } catch (error) {
    console.error("Erro ao pegar ranking:", error);
    return [];
  }
}

// Atualizar lista do ranking na tela
async function atualizarRanking() {
  const ranking = await pegarRanking();
  const rankingList = document.getElementById('rankingList');
  if (!rankingList) return;
  rankingList.innerHTML = "";
  ranking.forEach((jogador, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${jogador.nome} - ${Math.floor(jogador.score)}`;
    rankingList.appendChild(li);
  });
}

// Função global pra botão salvar no ranking
window.pedirNomeESalvarScore = function () {
  const nome = prompt("Digite seu nome para o ranking:");
  if (nome && score > 0) {
    salvarScore(nome, score).then(() => {
      atualizarRanking();
    });
  }
};

// Inicializa ao carregar a página
window.addEventListener("load", () => {
  atualizarRanking();
  atualizar();
});

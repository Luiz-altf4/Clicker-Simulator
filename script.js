// === Config Firebase - coloque os seus dados abaixo ===
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// === Variáveis do jogo ===
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

const saveScoreBtn = document.getElementById("saveScoreBtn");
const rankingList = document.getElementById("rankingList");

// === Funções do jogo ===

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

function verificarLevelUp() {
  if (xp >= level * 100) {
    xp -= level * 100;
    level++;
    gems += 10;
    buySound.play();
  }
}

clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp++;
  clickSound.play();
  atualizar();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    buySound.play();
    atualizar();
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    buySound.play();
    atualizar();
  }
});

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
    atualizar();
    setTimeout(() => {
      multiplier /= 5;
      atualizar();
    }, 30000);
  }
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
}, 1000);

// === Ranking sem login, só prompt ===
async function salvarScore() {
  const nome = prompt("Digite seu nome para salvar no ranking:");
  if (!nome) {
    alert("Nome obrigatório para salvar no ranking!");
    return;
  }
  try {
    await db.collection("ranking").doc(nome).set({
      score,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
    alert("Pontuação salva no ranking!");
    atualizarRanking();
  } catch (e) {
    console.error("Erro ao salvar ranking:", e);
  }
}

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
  } catch (e) {
    console.error("Erro ao pegar ranking:", e);
    return [];
  }
}

async function atualizarRanking() {
  const ranking = await pegarRanking();
  rankingList.innerHTML = "";
  ranking.forEach((jogador, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${jogador.nome} - ${Math.floor(jogador.score)}`;
    rankingList.appendChild(li);
  });
}

saveScoreBtn.addEventListener("click", salvarScore);

document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Inicia tudo
window.addEventListener("load", () => {
  atualizar();
  atualizarRanking();
});

// === MISSÕES e CONQUISTAS Simples para adicionar depois ===
// Pode expandir a parte de missões e conquistas aqui, se quiser!

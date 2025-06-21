let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplier = 1;
let multiplierCount = 0;
let cps = 0;
let gems = 0;

// Elements
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
const gemsDisplay = document.getElementById("gemsCount");

const buyGemsBtn = document.getElementById("buyGemsBtn");
const toggleThemeBtn = document.getElementById("toggleThemeBtn");

const saveScoreBtn = document.getElementById("saveScoreBtn");
const rankingList = document.getElementById("rankingList");

// --- Funções do jogo ---

clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  atualizar();
});

upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    atualizar();
  }
});

buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    atualizar();
  }
});

buyMultiplierBtn.addEventListener("click", () => {
  const cost = 100 * (multiplierCount + 1);
  if (score >= cost) {
    score -= cost;
    multiplier *= 2;
    multiplierCount++;
    atualizar();
  }
});

buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  atualizar();
});

setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
}, 1000);

function atualizar() {
  scoreDisplay.textContent = Math.floor(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = Math.floor(10 * Math.pow(1.5, clickPower - 1));

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = 50 * (autoClickers + 1);

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = 100 * (multiplierCount + 1);

  cpsDisplay.textContent = `Clicks por segundo: ${cps}`;
  gemsDisplay.textContent = gems;
}

// Tema dark toggle simples
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Firebase setup (lembre de configurar o Firebase e adicionar o SDK no html se ainda não fez)

const firebaseConfig = {
  apiKey: "AIzaSyAT4F4_k9zmi9PtqUST8oiOHw5k7f1uPfg",
  authDomain: "clicker-ranking.firebaseapp.com",
  projectId: "clicker-ranking",
  storageBucket: "clicker-ranking.firebasestorage.app",
  messagingSenderId: "72533988657",
  appId: "1:72533988657:web:b3afb73f21926b0a1ccc10",
  measurementId: "G-JPPX1JJ5VC"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Ranking firebase

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

async function atualizarRanking() {
  const ranking = await pegarRanking();
  rankingList.innerHTML = "";
  ranking.forEach((jogador, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${jogador.nome} - ${Math.floor(jogador.score)}`;
    rankingList.appendChild(li);
  });
}

// Salvar score com prompt
saveScoreBtn.addEventListener("click", () => {
  const nome = prompt("Digite seu nome para o ranking:");
  if (nome && score > 0) {
    salvarScore(nome, score).then(() => {
      atualizarRanking();
    });
  }
});

window.addEventListener("load", () => {
  atualizarRanking();
  atualizar();
});


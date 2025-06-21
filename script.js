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

// Sons
const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

// Elementos HTML
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

// Boosts
const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

// Firebase config - você já deve ter configurado isso no seu código
const firebaseConfig = {
  apiKey: "AIzaSyAT4F4_k9zmi9PtqUST8oiOHw5k7f1uPfg",
  authDomain: "clicker-ranking.firebaseapp.com",
  projectId: "clicker-ranking",
  storageBucket: "clicker-ranking.firebasestorage.app",
  messagingSenderId: "72533988657",
  appId: "1:72533988657:web:b3afb73f21926b0a1ccc10",
  measurementId: "G-JPPX1JJ5VC"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- Função para formatar números grandes com unidades infinitas ---
function formatarNumero(num) {
  const unidadesBase = ['', 'k', 'm', 'b', 't'];
  const letras = 'abcdefghijklmnopqrstuvwxyz';

  let unidadeIndex = 0;
  let valor = num;

  while (valor >= 1000) {
    valor /= 1000;
    unidadeIndex++;
  }

  if (unidadeIndex < unidadesBase.length) {
    return valor.toFixed(1).replace(/\.0$/, '') + unidadesBase[unidadeIndex];
  }

  // Gera sufixo com letras (a, b, c, ..., aa, ab, ac, ...)
  let index = unidadeIndex - unidadesBase.length;
  let sufixo = '';

  while (index >= 0) {
    sufixo = letras[index % 26] + sufixo;
    index = Math.floor(index / 26) - 1;
  }

  return valor.toFixed(1).replace(/\.0$/, '') + sufixo;
}

// --- SALVAR PROGRESSO ---
function salvarProgresso() {
  const saveData = {
    score,
    clickPower,
    autoClickers,
    multiplier,
    multiplierCount,
    level,
    xp,
    gems,
  };
  localStorage.setItem('clickerSave', JSON.stringify(saveData));
}

// --- CARREGAR PROGRESSO ---
function carregarProgresso() {
  const saveData = JSON.parse(localStorage.getItem('clickerSave'));
  if (saveData) {
    score = saveData.score || 0;
    clickPower = saveData.clickPower || 1;
    autoClickers = saveData.autoClickers || 0;
    multiplier = saveData.multiplier || 1;
    multiplierCount = saveData.multiplierCount || 0;
    level = saveData.level || 1;
    xp = saveData.xp || 0;
    gems = saveData.gems || 0;
  }
}

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
  } else {
    alert("Você não tem score suficiente para comprar esse upgrade!");
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
  } else {
    alert("Você não tem score suficiente para comprar auto clicker!");
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
  } else {
    alert("Você não tem score suficiente para comprar multiplicador!");
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
    alert("Você não tem gemas suficientes para o boost de velocidade!");
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
    alert("Você não tem gemas suficientes para o boost multiplicador!");
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

  scoreDisplay.textContent = formatarNumero(Math.floor(score));
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = formatarNumero(Math.floor(10 * Math.pow(1.5, clickPower - 1)));

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = formatarNumero(50 * (autoClickers + 1));

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = formatarNumero(100 * (multiplierCount + 1));

  cpsDisplay.textContent = `Clicks por segundo: ${formatarNumero(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;

  gemsDisplay.textContent = formatarNumero(gems);

  salvarProgresso(); // Salva sempre que atualizar a UI
}

// --- TEMA ---
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// === 🏆 RANKING FIREBASE ===
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
  const rankingList = document.getElementById('rankingList');
  if (!rankingList) return;
  rankingList.innerHTML = "";
  ranking.forEach((jogador, i) => {
    const li = document.createElement('li');
    li.textContent = `${i + 1}. ${jogador.nome} - ${formatarNumero(jogador.score)}`;
    rankingList.appendChild(li);
  });
}

// Pergunta nome e salva score
function pedirNomeESalvarScore() {
  const nome = prompt("Digite seu nome para o ranking:");
  if (nome && score > 0) {
    salvarScore(nome, score).then(() => {
      atualizarRanking();
    });
  }
}

// Inicializa ranking e carrega progresso ao carregar a página
window.addEventListener("load", () => {
  carregarProgresso();
  atualizar();
  atualizarRanking();
});

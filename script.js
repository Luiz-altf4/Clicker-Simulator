// Firebase config e inicialização
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
  measurementId: "G-ZXXWCDTY9D"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Variáveis do jogo (simplificado, ajuste conforme seu código)
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let rebirths = 0;
let currentWorld = 1;

let buyAmount = 1;

// Pegando elementos DOM
const clicksDisplay = document.getElementById("clicksDisplay");
const cpsDisplay = document.getElementById("cpsDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const xpDisplay = document.getElementById("xpDisplay");
const xpToNextLevelDisplay = document.getElementById("xpToNextLevel");
const rebirthCountDisplay = document.getElementById("rebirthCount");
const currentWorldDisplay = document.getElementById("currentWorld");

const clickBtn = document.getElementById("clickBtn");
const upgradesList = document.getElementById("upgradesList");
const shopItemsList = document.getElementById("shopItemsList");
const petsList = document.getElementById("petsList");
const activePetDisplay = document.getElementById("activePet");
const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthInfo = document.getElementById("rebirthInfo");
const worldsList = document.getElementById("worldsList");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");

const toggleThemeBtn = document.getElementById("toggleTheme");

// Ranking elements
const rankingList = document.getElementById("rankingList");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const playerNameInput = document.getElementById("playerNameInput");

// Função para formatar números com abreviação
function formatNumber(num) {
  if (num < 1000) return num.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let unitIndex = -1;
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  return num.toFixed(2) + units[unitIndex];
}

// Atualiza a exibição dos dados
function updateDisplay() {
  clicksDisplay.textContent = formatNumber(clicks);
  cpsDisplay.textContent = formatNumber(calculateCPS());
  levelDisplay.textContent = level;
  xpDisplay.textContent = formatNumber(xp);
  xpToNextLevelDisplay.textContent = formatNumber(xpToNextLevel);
  rebirthCountDisplay.textContent = rebirths;
  currentWorldDisplay.textContent = `${currentWorld} - Jardim Inicial`;

  // Aqui atualize suas listas, pets, etc. conforme seu código
}

// Cálculo do CPS (exemplo simples)
function calculateCPS() {
  // Ajuste para seu cálculo real
  return cps;
}

// Clique manual
clickBtn.addEventListener("click", () => {
  clicks++;
  updateDisplay();
});

// Botões de quantidade para compra
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    buyAmount = btn.getAttribute("data-amount") === "max" ? "max" : parseInt(btn.getAttribute("data-amount"));
  });
});

// Sistema de rebirth básico
rebirthBtn.addEventListener("click", () => {
  if (clicks >= 100000) {
    rebirths++;
    clicks = 0;
    level = 1;
    xp = 0;
    xpToNextLevel = 100;
    rebirthInfo.textContent = `Rebirth feito! Total: ${rebirths}`;
    updateDisplay();
  } else {
    rebirthInfo.textContent = "Você precisa de 100.000 clicks para fazer Rebirth.";
  }
});

// Tema claro / escuro
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  toggleThemeBtn.textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
});

// --------- RANKING ONLINE ---------

// Atualiza a lista do ranking na interface
function updateRankingUI(players) {
  rankingList.innerHTML = "";
  players.forEach((player, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${player.name}: ${formatNumber(player.score)} clicks`;
    rankingList.appendChild(li);
  });
}

// Busca o ranking no Firebase e atualiza a lista
function fetchRanking() {
  db.collection("rankings")
    .orderBy("score", "desc")
    .limit(10)
    .get()
    .then(snapshot => {
      const players = [];
      snapshot.forEach(doc => players.push(doc.data()));
      updateRankingUI(players);
    })
    .catch(err => {
      console.error("Erro ao buscar ranking:", err);
    });
}

// Salva a pontuação do jogador no Firebase
saveScoreBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Digite seu nome para salvar a pontuação.");
    return;
  }
  const score = clicks;

  db.collection("rankings").doc(name).set({
    name: name,
    score: score,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Pontuação salva!");
    playerNameInput.value = "";
    fetchRanking();
  }).catch(err => {
    console.error("Erro ao salvar pontuação:", err);
  });
});

// Atualiza o ranking a cada 30 segundos
setInterval(fetchRanking, 30000);

// Busca ranking ao iniciar
fetchRanking();

// Inicializa display
updateDisplay();

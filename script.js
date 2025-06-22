// === Importações Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Config Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com/",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
  measurementId: "G-ZXXWCDTY9D"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Utilitários ===
const $ = id => document.getElementById(id);
const createEl = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const k in attrs) {
    if (k === "className") el.className = attrs[k];
    else if (k.startsWith("aria")) el.setAttribute(k, attrs[k]);
    else if (k === "dataset") {
      for (const d in attrs[k]) el.dataset[d] = attrs[k][d];
    } else el.setAttribute(k, attrs[k]);
  }
  children.forEach(c => {
    if (typeof c === "string") el.appendChild(document.createTextNode(c));
    else if (c) el.appendChild(c);
  });
  return el;
};

function formatNumber(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  if (n < 1000) return n.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

// === Estado do jogo ===
const gameState = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,
  currentWorld: 1,
  buyAmount: 1,
  upgrades: [],
  shopItems: [],
  pets: [],
  achievements: [],
  missions: [],
  activePetId: null,
  theme: "dark",
  lastChatTimestamp: 0,
  audio: { musicVolume: 0.5, effectsVolume: 0.7, musicPlaying: false },
  tutorialShown: false,
};

function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
    { id: 4, name: "Gerador de Clicks", description: "Mais clicks por segundo", cps: 150, quantity: 0, basePrice: 1500 },
    { id: 5, name: "Clicker Quântico", description: "Clicks quase infinitos", cps: 500, quantity: 0, basePrice: 10000 },
    { id: 6, name: "Mega Clicker", description: "Clicks em grande escala", cps: 2000, quantity: 0, basePrice: 40000 },
    { id: 7, name: "Clicker Supremo", description: "Clicks divinos", cps: 10000, quantity: 0, basePrice: 150000 },
    { id: 8, name: "Deus do Click", description: "Clicks que mudam o universo", cps: 50000, quantity: 0, basePrice: 800000 }
  ];

  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra produção por 5 min", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla produção por 2 min", owned: false, price: 5000, effectDuration: 120000 },
  ];

  gameState.pets = [
    { id: 1, name: "Gato Clicker", bonusPercent: 5, owned: false },
    { id: 2, name: "Cachorro Robótico", bonusPercent: 15, owned: false },
    { id: 3, name: "Dragão Cibernético", bonusPercent: 30, owned: false },
  ];

  gameState.missions = [
    { id: 1, description: "Clique 100 vezes", goal: 100, progress: 0, rewardXP: 50, completed: false },
    { id: 2, description: "Compre 5 upgrades", goal: 5, progress: 0, rewardXP: 100, completed: false },
    { id: 3, description: "Faça 1 rebirth", goal: 1, progress: 0, rewardXP: 500, completed: false },
  ];

  gameState.achievements = [
    { id: 1, name: "Primeiro Click", description: "Realize seu primeiro click", achieved: false },
    { id: 2, name: "Novato", description: "Alcance nível 10", achieved: false },
    { id: 3, name: "Profissional", description: "Alcance 1000 clicks", achieved: false },
    { id: 4, name: "Veterano", description: "Realize 10 rebirths", achieved: false },
  ];
}

// === Salvar e carregar jogo automaticamente ===
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
  } catch (err) {
    console.error("Erro ao salvar:", err);
    showNotification("Falha ao salvar progresso!", "error");
  }
}

function loadGame() {
  const saveData = localStorage.getItem("clickerSave");
  if (saveData) {
    try {
      const parsed = JSON.parse(saveData);
      // Para evitar sobrescrever funções e objetos, faça merge profundo se necessário.
      Object.assign(gameState, parsed);
      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
    }
  } else {
    initGameData();
  }
}

// === Função para exibir notificações ===
const notificationEl = $("notification");
let notificationTimeout = null;
function showNotification(text, type = "info") {
  notificationEl.textContent = text;
  notificationEl.style.backgroundColor = type === "error" ? "#e74c3c" : type === "success" ? "#27ae60" : "#0f62fe";
  notificationEl.style.display = "block";
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notificationEl.style.display = "none";
  }, 3500);
}

// === Atualizar todos os displays ===
function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS() * currentMultiplier);
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;
}

// === Calcular CPS total incluindo upgrades e pets e multiplicadores ===
function calcCPS() {
  let baseCPS = gameState.upgrades.reduce((sum, u) => sum + u.cps * u.quantity, 0);

  // bônus de pets (somente se algum ativo)
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) {
      baseCPS *= (1 + pet.bonusPercent / 100);
    }
  }
  return baseCPS;
}

// === Função para clicar manualmente ===
function gainClicks(amount = 1) {
  gameState.clicks += amount;
  gameState.totalClicks += amount;

  // dar XP ao clicar
  addXP(amount * 0.5);

  updateDisplay();
  updateShopDisplay();
  updateUpgradesDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();

  saveGame();
  checkMissionProgress();
}

// === Adiciona XP e trata level up ===
function addXP(amount) {
  gameState.xp += amount;
  while (game






O ChatGPT disse:
State.xp >= gameState.xpToNext) {
gameState.xp -= gameState.xpToNext;
gameState.level++;
gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
showNotification(Nível ${gameState.level} alcançado!, "success");
}
}

// === Loop de produção automática (CPS) ===
setInterval(() => {
const cps = calcCPS();
gainClicks(cps / 10); // 10x por segundo
}, 100);

// === Autosave ===
setInterval(saveGame, 30000);

// === Inicialização ===
window.addEventListener("DOMContentLoaded", () => {
loadGame();
updateDisplay();
updateUpgradesDisplay();
updateShopDisplay();
updatePetsDisplay();
updateMissions();
updateAchievements();
applyTheme(gameState.theme);
});

// === Função de Rebirth ===
function doRebirth() {
  const cost = 100000;
  if (gameState.clicks < cost) {
    showNotification(`Você precisa de ${formatNumber(cost)} clicks para renascer.`, "error");
    return;
  }
  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.upgrades.forEach(up => up.quantity = 0);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  gameState.shopItems.forEach(s => s.owned = false);
  gameState.missions.forEach(m => { m.progress = 0; m.completed = false; });

  showNotification("Rebirth realizado com sucesso!", "success");
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  saveGame();
}

// === Ranking (Firebase) ===
function saveScoreToFirebase() {
  const name = $("playerNameInput").value.trim();
  if (!name) return showNotification("Insira um nome para enviar ao ranking.", "error");

  const scoreRef = push(ref(db, "ranking"));
  set(scoreRef, {
    name: name,
    clicks: gameState.totalClicks,
    timestamp: Date.now()
  }).then(() => {
    showNotification("Score enviado ao ranking!", "success");
    $("playerNameInput").value = "";
    loadRanking();
  }).catch(() => {
    showNotification("Erro ao salvar no ranking.", "error");
  });
}

function loadRanking() {
  const rankBox = $("rankingList");
  rankBox.innerHTML = "Carregando...";

  const rankQuery = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(rankQuery, snapshot => {
    const data = snapshot.val();
    if (!data) return (rankBox.innerHTML = "Sem dados de ranking.");

    const sorted = Object.values(data).sort((a, b) => b.clicks - a.clicks);
    rankBox.innerHTML = "";
    sorted.forEach((player, i) => {
      const item = createEl("div", { className: "ranking-item" },
        `${i + 1}. ${player.name} — ${formatNumber(player.clicks)} clicks`
      );
      rankBox.appendChild(item);
    });
  });
}

// === Chat Global ===
function sendChatMessage() {
  const now = Date.now();
  if (now - gameState.lastChatTimestamp < 3000)
    return showNotification("Espere 3s para enviar outra mensagem.", "error");

  const msg = $("chatInput").value.trim();
  const name = $("playerNameInput").value.trim();
  if (!msg || !name) return showNotification("Nome e mensagem são obrigatórios.", "error");

  const chatRef = ref(db, "chat");
  const newMsg = push(chatRef);
  set(newMsg, {
    name: name,
    message: msg,
    timestamp: now
  }).then(() => {
    $("chatInput").value = "";
    gameState.lastChatTimestamp = now;
    showNotification("Mensagem enviada!", "success");
  });
}

function initChat() {
  const chatRef = ref(db, "chat");
  onValue(chatRef, snapshot => {
    const chatBox = $("chatMessages");
    chatBox.innerHTML = "";
    const messages = Object.values(snapshot.val() || {}).sort((a, b) => a.timestamp - b.timestamp);
    messages.forEach(m => {
      const msg = createEl("p", {}, `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.name}: ${m.message}`);
      chatBox.appendChild(msg);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// === Tema Claro/Escuro ===
function toggleTheme() {
  if (gameState.theme === "dark") {
    document.body.classList.add("light-theme");
    gameState.theme = "light";
    $("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    gameState.theme = "dark";
    $("toggleTheme").textContent = "☀️";
  }
  saveGame();
}

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light-theme");
    $("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    $("toggleTheme").textContent = "☀️";
  }
}

// === Eventos DOM ===
function setupEvents() {
  $("clickBtn").onclick = () => {
    gainClicks(1);
    checkMissionProgress();
  };
  $("rebirthBtn").onclick = doRebirth;
  $("saveBtn").onclick = () => {
    saveGame();
    showNotification("Salvo manualmente!", "success");
  };
  $("clearSaveBtn").onclick = () => {
    if (confirm("Apagar progresso?")) {
      localStorage.removeItem("clickerSave");
      location.reload();
    }
  };
  $("saveScoreBtn").onclick = saveScoreToFirebase;
  $("chatSendBtn").onclick = sendChatMessage;
  $("toggleTheme").onclick = toggleTheme;
}

// === Finalização ===
window.addEventListener("DOMContentLoaded", () => {
  initGameData();
  loadGame();
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  applyTheme(gameState.theme);
  loadRanking();
  initChat();
  setupEvents();
});

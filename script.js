// ======================= Importações Firebase =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// ======================= Config Firebase ===========================
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

// ======================= Estado do jogo =============================
let gameState = {
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
  audio: {
    musicVolume: 0.5,
    effectsVolume: 0.7,
    musicPlaying: false
  },
  tutorialShown: false,
  lastChatTimestamp: 0,
};

// ======================= DOM utils ================================
const $ = id => document.getElementById(id);

function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const key in attrs) {
    if (key === "className") el.className = attrs[key];
    else if (key.startsWith("aria")) el.setAttribute(key, attrs[key]);
    else if (key === "dataset") {
      for (const dataKey in attrs[key]) {
        el.dataset[dataKey] = attrs[key][dataKey];
      }
    } else {
      el.setAttribute(key, attrs[key]);
    }
  }
  children.forEach(child => {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
}

// ======================= Formatação de números ======================
function formatNumber(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

// ======================= Funções utilitárias ========================

function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

function sanitizeInput(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ======================= Inicialização dos dados =====================
function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
  ];

  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra sua produção por 5 minutos", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla sua produção por 2 minutos", owned: false, price: 5000, effectDuration: 120000 },
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

// ======================= Salvamento e carregamento ===================
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
    showNotification("Progresso salvo com sucesso!", "success");
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
      // Atualiza apenas as chaves existentes para evitar sobrescrever funções
      Object.keys(parsed).forEach(key => {
        gameState[key] = parsed[key];
      });
      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
    }
  }
}

// ======================= Atualização visual ===========================
function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS());
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;

  const activePet = gameState.pets.find(p => p.id === gameState.activePetId);
  $("activePetsStat").textContent = activePet ? activePet.name : "Nenhum";

  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateAchievementsDisplay();
  updateMissionsDisplay();
  updateRankingDisplay();
}

// ======================= Cálculo CPS =================================
function calcCPS() {
  let baseCPS = 0;
  gameState.upgrades.forEach(upg => {
    baseCPS += upg.cps * upg.quantity;
  });

  let multiplier = 1;
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) multiplier += pet.bonusPercent / 100;
  }

  gameState.shopItems.forEach(item => {
    if (item.owned && item.name.toLowerCase().includes("x5")) multiplier *= 5;
    else if (item.owned && item.name.toLowerCase().includes("x2")) multiplier *= 2;
  });

  return baseCPS * multiplier;
}

// ======================= Ganhar XP ===================================
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Parabéns! Você chegou ao nível ${gameState.level}!`, "info");
  }
}

// ======================= Ganhar clicks ===============================
function gainClicks(amount) {
  let gain = amount;
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  gain = Math.floor(gain);
  gameState.clicks += gain;
  gameState.totalClicks += gain;
  gainXP(gain * 2);
  updateMissionsProgress("clicks", gain);
  updateDisplay();
}

// ======================= Missões ======================================
function updateMissionsProgress(type, amount) {
  gameState.missions.forEach(mission => {
    if (!mission.completed) {
      if (type === "clicks" && mission.id === 1) {
        mission.progress += amount;
        if (mission.progress >= mission.goal) {
          mission.completed = true;
          gainXP(mission.rewardXP);
          showNotification(`Missão completada: ${mission.description}`, "success");
        }
      } else if (type === "upgrades" && mission.id === 2) {
        const totalUpgrades = gameState.upgrades.reduce((sum, u) => sum + u.quantity, 0);
        if (totalUpgrades >= mission.goal) {
          mission.completed = true;
          gainXP(mission.rewardXP);
          showNotification(`Missão completada: ${mission.description}`, "success");
        }
      } else if (type === "rebirths" && mission.id === 3) {
        if (gameState.rebirths >= mission.goal) {
          mission.completed = true;
          gainXP(mission.rewardXP);
          showNotification(`Missão completada: ${mission.description}`, "success");
        }
      }
    }
  });
}

function updateMissionsDisplay() {
  const missionsList = $("missions");
  missionsList.innerHTML = "";
  gameState.missions.forEach(mission => {
    const li = createElement("li", {
      className: `mission-item ${mission.completed ? "completed" : ""}`,
      tabindex: 0,
      "aria-label": `${mission.description} - Progresso: ${Math.min(mission.progress, mission.goal)} de ${mission.goal}`
    }, `${mission.description} (${Math.min(mission.progress, mission.goal)} / ${mission.goal})`);
    missionsList.appendChild(li);
  });
}

// ======================= Conquistas ===================================
function checkAchievementCriteria(achievement) {
  switch (achievement.id) {
    case 1: return gameState.totalClicks > 0;
    case 2: return gameState.level >= 10;
    case 3: return gameState.totalClicks >= 1000;
    case 4: return gameState.rebirths >= 10;
    default: return false;
  }
}

function updateAchievementsDisplay() {
  const achievementsList = $("achievementsList");
  achievementsList.innerHTML = "";
  gameState.achievements.forEach(ach => {
    if (!ach.achieved && checkAchievementCriteria(ach)) {
      ach.achieved = true;
      showNotification(`Conquista desbloqueada: ${ach.name}`, "success");
    }
    const li = createElement("li", {
      className: `achievement-item ${ach.achieved ? "achieved" : ""}`,
      tabindex: 0,
      "aria-label": `${ach.name} - ${ach.description}`
    }, ach.name + (ach.achieved ? " ✔" : ""));
    achievementsList.appendChild(li);
  });
}

// ======================= Upgrades ====================================
function updateUpgradesDisplay() {
  const container = $("upgrades");
  container.innerHTML = "";

  gameState.upgrades.forEach(upg => {
    const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    const div = createElement("div", { className: "upgrade-item" });
    const nameEl = createElement("h4", {}, upg.name);
    const descEl = createElement("p", {}, upg.description);
    const qtyEl = createElement("p", {}, `Quantidade: ${upg.quantity}`);
    const priceEl = createElement("p", {}, `Preço: ${formatNumber(price)}`);
    const btn = createElement("button", { className: "buy-btn", "aria-label": `Comprar upgrade ${upg.name}` }, "Comprar");

    btn.disabled = gameState.clicks < price;

    btn.addEventListener("click", () => {
      if (gameState.clicks >= price) {
        gameState.clicks -= price;
        upg.quantity++;
        updateMissionsProgress("upgrades");
        updateDisplay();
        saveGame();
      }
    });

    div.append(nameEl, descEl, qtyEl, priceEl, btn);
    container.appendChild(div);
  });
}

// ======================= Loja ========================================
function updateShopDisplay() {
  const container = $("shopList");
  container.innerHTML = "";

  gameState.shopItems.forEach(item => {
    const div = createElement("div", { className: "shop-item" });
    const nameEl = createElement("h4", {}, item.name);
    const descEl = createElement("p", {}, item.description);
    const priceEl = createElement("p", {}, `Preço: ${formatNumber(item.price)}`);
    const btn = createElement("button", { className: "buy-btn", "aria-label": `Comprar item ${item.name}` }, item.owned ? "Ativo" : "Comprar");

    btn.disabled = item.owned || gameState.clicks < item.price;

    btn.addEventListener("click", () => {
      if (!item.owned && gameState.clicks >= item.price) {
        gameState.clicks -= item.price;
        item.owned = true;
        updateDisplay();
        saveGame();
        showNotification(`Item ${item.name} ativado!`, "success");

        // Desativa outros multiplicadores da loja se houver (só um ativo)
        gameState.shopItems.forEach(i => {
          if (i.id !== item.id) i.owned = false;
        });
      }
    });

    div.append(nameEl, descEl, priceEl, btn);
    container.appendChild(div);
  });
}

// ======================= Pets ========================================
function updatePetsDisplay() {
  const container = $("pets");
  container.innerHTML = "";

  gameState.pets.forEach(pet => {
    const div = createElement("div", { className: "pet-item" });
    const nameEl = createElement("h4", {}, pet.name);
    const bonusEl = createElement("p", {}, `Bônus: ${pet.bonusPercent}% clicks`);
    const statusEl = createElement("p", {}, pet.owned ? "Obtido" : "Não obtido");
    const btn = createElement("button", {
      className: "buy-btn",
      "aria-label": pet.owned ? `Ativar pet ${pet.name}` : `Comprar pet ${pet.name}`
    }, pet.owned ? (gameState.activePetId === pet.id ? "Ativo" : "Ativar") : "Comprar");

    const price = 500 * pet.id;
    btn.disabled = !pet.owned && gameState.clicks < price;

    btn.addEventListener("click", () => {
      if (!pet.owned && gameState.clicks >= price) {
        gameState.clicks -= price;
        pet.owned = true;
        gameState.activePetId = pet.id;
        updateDisplay();
        saveGame();
        showNotification(`Pet ${pet.name} comprado e ativado!`, "success");
      } else if (pet.owned) {
        gameState.activePetId = pet.id;
        updateDisplay();
        saveGame();
        showNotification(`Pet ${pet.name} ativado!`, "info");
      }
    });

    div.append(nameEl, bonusEl, statusEl, btn);
    container.appendChild(div);
  });
}

// ======================= Ranking Firebase ===========================
const rankingRef = ref(db, "ranking");
const rankingLimit = 10;

function saveScoreToFirebase(name, clicks) {
  if (!name || name.length < 3) {
    showNotification("Nome inválido para salvar ranking", "error");
    return;
  }
  const scoreData = {
    name: sanitizeInput(name),
    clicks,
    timestamp: Date.now(),
  };
  push(rankingRef, scoreData)
    .then(() => {
      showNotification("Pontuação salva no ranking!", "success");
      loadRanking();
    })
    .catch(() => {
      showNotification("Falha ao salvar pontuação!", "error");
    });
}

function loadRanking() {
  const rankListEl = $("detailedRankingList");
  rankListEl.innerHTML = "Carregando ranking...";
  const q = query(rankingRef, orderByChild("clicks"), limitToLast(rankingLimit));
  get(q).then(snapshot => {
    if (!snapshot.exists()) {
      rankListEl.innerHTML = "Nenhum dado no ranking.";
      return;
    }
    const data = [];
    snapshot.forEach(childSnap => {
      data.push(childSnap.val());
    });
    data.sort((a,b) => b.clicks - a.clicks);
    rankListEl.innerHTML = "";
    data.forEach((entry, i) => {
      const div = createElement("div", { className: "rank-item", tabindex: 0 },
        `${i+1}. ${sanitizeInput(entry.name)} - ${formatNumber(entry.clicks)} clicks`
      );
      rankListEl.appendChild(div);
    });
  }).catch(() => {
    rankListEl.innerHTML = "Erro ao carregar ranking.";
  });
}

// ======================= Chat Global Firebase ========================
const chatRef = ref(db, "chatMessages");
const maxChatMessages = 50;

function sendChatMessage(name, message) {
  if (!message.trim()) return;
  const now = Date.now();
  if (now - gameState.lastChatTimestamp < 3000) {
    showNotification("Aguarde antes de enviar outra mensagem.", "warning");
    return;
  }
  const chatData = {
    name: sanitizeInput(name),
    message: sanitizeInput(message),
    timestamp: now,
  };
  push(chatRef, chatData)
    .then(() => {
      gameState.lastChatTimestamp = now;
    })
    .catch(() => {
      showNotification("Falha ao enviar mensagem.", "error");
    });
}

function loadChatMessages() {
  const chatMessagesEl = $("chatMessages");
  chatMessagesEl.innerHTML = "Carregando chat...";
  const q = query(chatRef, orderByChild("timestamp"), limitToLast(maxChatMessages));
  onValue(q, snapshot => {
    chatMessagesEl.innerHTML = "";
    const messages = [];
    snapshot.forEach(childSnap => {
      messages.push(childSnap.val());
    });
    messages.sort((a,b) => a.timestamp - b.timestamp);
    messages.forEach(msg => {
      const msgDiv = createElement("div", { className: "chat-message" }, `[${new Date(msg.timestamp).toLocaleTimeString()}] `, 
        createElement("strong", {}, msg.name + ": "), msg.message
      );
      chatMessagesEl.appendChild(msgDiv);
    });
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  });
}

// ======================= Feedback visual =============================
const notificationContainer = createElement("div", { id: "notificationContainer", "aria-live": "assertive" });
document.body.appendChild(notificationContainer);

function showNotification(text, type = "info") {
  const notif = createElement("div", { className: `notification ${type}`, role: "alert", tabindex: 0 }, text);
  notificationContainer.appendChild(notif);
  setTimeout(() => {
    notif.remove();
  }, 4000);
  notif.focus();
}

// ======================= Eventos ================================

$("clickButton").addEventListener("click", () => {
  gainClicks(gameState.buyAmount);
  updateDisplay();
  saveGame();
});

$("saveScoreForm").addEventListener("submit", e => {
  e.preventDefault();
  const nameInput = $("playerNameInput");
  saveScoreToFirebase(nameInput.value.trim(), gameState.totalClicks);
  nameInput.value = "";
});

$("chatForm").addEventListener("submit", e => {
  e.preventDefault();
  const chatInput = $("chatInput");
  sendChatMessage("Jogador", chatInput.value.trim());
  chatInput.value = "";
});

// ======================= Auto CPS ================================
setInterval(() => {
  const cps = calcCPS();
  if (cps > 0) gainClicks(cps);
  updateDisplay();
  saveGame();
}, 1000);

// ======================= Init ================================
function init() {
  initGameData();
  loadGame();
  updateDisplay();
  loadRanking();
  loadChatMessages();
}

init();

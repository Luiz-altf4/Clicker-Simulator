// script.js - módulo ES6

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// --- Estado global ---
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

let currentMultiplier = 1;
let multiplierTimeout = null;

// --- Inicialização dos dados do jogo ---
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
    { id: 3, description: "Alcance nível 5", goal: 5, progress: 0, rewardXP: 150, completed: false },
  ];

  gameState.achievements = [
    { id: 1, name: "Primeiros Cliques", description: "Faça 50 clicks", completed: false },
    { id: 2, name: "Comprador", description: "Compre 10 upgrades", completed: false },
    { id: 3, name: "Veterano", description: "Alcance nível 10", completed: false },
  ];
}

// --- Salvamento ---
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
    showNotification("Progresso salvo!");
  } catch {
    showNotification("Erro ao salvar progresso!", true);
  }
}

function loadGame() {
  const saved = localStorage.getItem("clickerSave");
  if (saved) {
    try {
      const data = JSON.parse(saved);
      Object.assign(gameState, data);
      showNotification("Progresso carregado!");
    } catch {
      showNotification("Erro ao carregar progresso!", true);
    }
  } else {
    initGameData();
  }
}

// --- Notificações ---
function showNotification(msg, isError = false) {
  const notif = $("notification");
  notif.textContent = msg;
  notif.style.backgroundColor = isError ? "var(--color-error)" : "var(--color-notification-bg)";
  notif.style.display = "block";
  clearTimeout(notif.timeoutId);
  notif.timeoutId = setTimeout(() => {
    notif.style.display = "none";
  }, 3000);
}

// --- Atualização da interface ---
function updateDisplays() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(gameState.cps);
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;

  renderUpgrades();
  renderShop();
  renderPets();
  renderMissions();
  renderAchievements();
  renderRanking();
  renderChat();
  applyTheme();
}

// --- Renderização Upgrades ---
function renderUpgrades() {
  const container = $("upgrades");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const price = calculatePrice(upg.basePrice, upg.quantity);
    const canBuy = gameState.clicks >= price;
    const div = createEl("div", { className: "upgrade-item" },
      createEl("h4", {}, upg.name),
      createEl("p", {}, upg.description),
      createEl("p", {}, `Quantidade: ${upg.quantity}`),
      createEl("p", {}, `CPS: ${formatNumber(upg.cps)}`),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("button", { disabled: !canBuy, dataset: { id: upg.id } }, "Comprar")
    );
    div.querySelector("button").onclick = () => buyUpgrade(upg.id);
    container.appendChild(div);
  });
}

// --- Renderização Loja ---
function renderShop() {
  const container = $("shopList");
  container.innerHTML = "";
  gameState.shopItems.forEach(item => {
    const canBuy = gameState.clicks >= item.price && !item.owned;
    const div = createEl("div", { className: "shop-item" },
      createEl("h4", {}, item.name),
      createEl("p", {}, item.description),
      createEl("p", {}, `Preço: ${formatNumber(item.price)}`),
      createEl("button", { disabled: !canBuy, dataset: { id: item.id } }, item.owned ? "Comprado" : "Comprar")
    );
    if (!item.owned) {
      div.querySelector("button").onclick = () => buyShopItem(item.id);
    }
    container.appendChild(div);
  });
}

// --- Renderização Pets ---
function renderPets() {
  const container = $("pets");
  container.innerHTML = "";
  gameState.pets.forEach(pet => {
    const isOwned = pet.owned;
    const buttonText = isOwned ? (gameState.activePetId === pet.id ? "Ativo" : "Ativar") : "Comprar";
    const canBuy = !isOwned && gameState.clicks >= 5000;
    const div = createEl("div", { className: "pet-item" },
      createEl("h4", {}, pet.name),
      createEl("p", {}, `Bônus CPS: ${pet.bonusPercent}%`),
      createEl("button", { disabled: !canBuy && !isOwned, dataset: { id: pet.id } }, buttonText)
    );
    const btn = div.querySelector("button");
    btn.onclick = () => {
      if (!isOwned) buyPet(pet.id);
      else activatePet(pet.id);
    };
    container.appendChild(div);
  });
}

// --- Renderização Missões ---
function renderMissions() {
  const container = $("missions");
  container.innerHTML = "";
  gameState.missions.forEach(mission => {
    const li = createEl("li", { className: "mission-item" },
      `${mission.description} - ${formatNumber(mission.progress)} / ${formatNumber(mission.goal)}`
    );
    if (mission.completed) li.style.fontWeight = "700";
    container.appendChild(li);
  });
}

// --- Renderização Conquistas ---
function renderAchievements() {
  const container = $("achievementsList");
  container.innerHTML = "";
  gameState.achievements.forEach(ach => {
    const li = createEl("li", { className: "achievement-item" + (ach.completed ? " completed" : "") },
      `${ach.name} - ${ach.description}`
    );
    container.appendChild(li);
  });
}

// --- Render Ranking Online ---
async function renderRanking() {
  const rankingDiv = $("detailedRankingList");
  try {
    const topQuery = query(ref(db, "ranking"), orderByChild("score"), limitToLast(10));
    const snapshot = await get(topQuery);
    if (!snapshot.exists()) {
      rankingDiv.textContent = "Nenhum dado no ranking ainda.";
      return;
    }
    const rankingArray = [];
    snapshot.forEach(child => {
      rankingArray.push(child.val());
    });
    rankingArray.sort((a, b) => b.score - a.score);
    rankingDiv.innerHTML = "";
    rankingArray.forEach((entry, i) => {
      const entryDiv = createEl("div", {}, `${i + 1}. ${entry.name}: ${formatNumber(entry.score)}`);
      rankingDiv.appendChild(entryDiv);
    });
  } catch (err) {
    rankingDiv.textContent = "Erro ao carregar ranking.";
  }
}

// --- Renderização Chat ---
function renderChat() {
  // Chat será gerenciado por onValue Firebase listener
}

// --- Comprar upgrade ---
function buyUpgrade(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return;
  const price = calculatePrice(upg.basePrice, upg.quantity);
  if (gameState.clicks < price) {
    showNotification("Você não tem clicks suficientes!");
    return;
  }
  gameState.clicks -= price;
  upg.quantity++;
  recalcCPS();
  updateMissionsProgress("buyUpgrades", 1);
  saveGame();
  updateDisplays();
}

// --- Comprar item da loja ---
function buyShopItem(id) {
  const item = gameState.shopItems.find(i => i.id === id);
  if (!item || item.owned) return;
  if (gameState.clicks < item.price) {
    showNotification("Você não tem clicks suficientes!");
    return;
  }
  gameState.clicks -= item.price;
  item.owned = true;
  activateShopItemEffect(item);
  saveGame();
  updateDisplays();
  showNotification(`${item.name} ativado!`);
}

function activateShopItemEffect(item) {
  if (item.name.includes("x2")) {
    applyMultiplier(2, item.effectDuration);
  } else if (item.name.includes("x5")) {
    applyMultiplier(5, item.effectDuration);
  }
}

function applyMultiplier(multiplier, duration) {
  currentMultiplier = multiplier;
  recalcCPS();
  if (multiplierTimeout) clearTimeout(multiplierTimeout);
  multiplierTimeout = setTimeout(() => {
    currentMultiplier = 1;
    recalcCPS();
    updateDisplays();
    showNotification("Multiplicador terminou!");
  }, duration);
  updateDisplays();
}

// --- Comprar pet ---
function buyPet(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet || pet.owned) return;
  const petPrice = 5000; // preço fixo para pets
  if (gameState.clicks < petPrice) {
    showNotification("Você não tem clicks suficientes para comprar o pet!");
    return;
  }
  gameState.clicks -= petPrice;
  pet.owned = true;
  gameState.activePetId = pet.id;
  recalcCPS();
  saveGame();
  updateDisplays();
  showNotification(`${pet.name} comprado e ativado!`);
}

function activatePet(id) {
  if (gameState.activePetId === id) return;
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet || !pet.owned) return;
  gameState.activePetId = id;
  recalcCPS();
  saveGame();
  updateDisplays();
  showNotification(`${pet.name} ativado!`);
}

// --- Rebirth ---
function doRebirth() {
  if (gameState.level < 10) {
    showNotification("Você precisa estar no nível 10 para rebirth!");
    return;
  }
  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.cps = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.currentWorld = 1;
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.shopItems.forEach(i => i.owned = false);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  recalcCPS();
  saveGame();
  updateDisplays();
  showNotification("Rebirth realizado! Você começou de novo com bônus.");
}

// --- Cálculo do preço de upgrades ---
function calculatePrice(basePrice, quantity) {
  // Preço cresce 15% a cada unidade comprada
  return Math.floor(basePrice * Math.pow(1.15, quantity));
}

// --- Recalcular CPS ---
function recalcCPS() {
  let baseCPS = 0;
  gameState.upgrades.forEach(u => {
    baseCPS += u.cps * u.quantity;
  });
  // Aplicar bônus pet
  let petBonus = 0;
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) petBonus = pet.bonusPercent;
  }
  const petMultiplier = 1 + petBonus / 100;
  gameState.cps = baseCPS * petMultiplier * currentMultiplier;
}

// --- Ganhando XP e Level ---
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.5);
    showNotification(`Você subiu para o nível ${gameState.level}!`);
    updateMissionsProgress("reachLevel", gameState.level);
  }
}

// --- Atualizar progresso das missões ---
function updateMissionsProgress(type, value) {
  let changed = false;
  gameState.missions.forEach(m => {
    if (m.completed) return;
    if (type === "click" && m.id === 1) {
      m.progress += value;
      if (m.progress >= m.goal) {
        m.completed = true;
        gainXP(m.rewardXP);
        showNotification(`Missão "${m.description}" completa! +${m.rewardXP} XP`);
        changed = true;
      }
    } else if (type === "buyUpgrades" && m.id === 2) {
      m.progress += value;
      if (m.progress >= m.goal) {
        m.completed = true;
        gainXP(m.rewardXP);
        showNotification(`Missão "${m.description}" completa! +${m.rewardXP} XP`);
        changed = true;
      }
    } else if (type === "reachLevel" && m.id === 3) {
      if (value >= m.goal && !m.completed) {
        m.completed = true;
        gainXP(m.rewardXP);
        showNotification(`Missão "${m.description}" completa! +${m.rewardXP} XP`);
        changed = true;
      }
    }
  });
  if (changed) saveGame();
}

// --- Clique manual ---
function handleClick() {
  gameState.clicks += 1 * currentMultiplier;
  gameState.totalClicks++;
  gainXP(1);
  updateMissionsProgress("click", 1);
  updateDisplays();
  saveGame();
}

// --- CPS automático ---
function cpsTick() {
  if (gameState.cps > 0) {
    gameState.clicks += gameState.cps / 10; // dividindo para tick 100ms
    gainXP(gameState.cps / 20);
    updateDisplays();
    saveGame();
  }
}

// --- Salvamento manual ---
function setupSaveButtons() {
  $("saveBtn").onclick = saveGame;
  $("clearSaveBtn").onclick = () => {
    if (confirm("Deseja realmente apagar seu progresso?")) {
      localStorage.removeItem("clickerSave");
      initGameData();
      recalcCPS();
      updateDisplays();
      showNotification("Progresso apagado.");
    }
  };
}

// --- Tema ---
function applyTheme() {
  if (gameState.theme === "light") {
    document.body.classList.add("light-theme");
    $("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    $("toggleTheme").textContent = "☀️";
  }
}

function toggleTheme() {
  gameState.theme = gameState.theme === "dark" ? "light" : "dark";
  applyTheme();
  saveGame();
}

// --- Ranking Online ---
function setupRanking() {
  $("saveScoreBtn").onclick = async () => {
    const name = $("playerNameInput").value.trim();
    if (!name) {
      showNotification("Digite um nome para salvar a pontuação!", true);
      return;
    }
    const score = Math.floor(gameState.totalClicks);
    if (score <= 0) {
      showNotification("Você ainda não tem pontos para salvar!", true);
      return;
    }
    try {
      await push(ref(db, "ranking"), { name, score });
      showNotification("Pontuação salva no ranking!");
      renderRanking();
    } catch {
      showNotification("Erro ao salvar pontuação!", true);
    }
  };
}

// --- Chat Firebase ---
function setupChat() {
  const messagesRef = ref(db, "chat");
  const chatMessagesDiv = $("chatMessages");
  onValue(messagesRef, (snapshot) => {
    chatMessagesDiv.innerHTML = "";
    if (!snapshot.exists()) return;
    const data = snapshot.val();
    const messages = Object.values(data);
    messages.sort((a,b) => a.timestamp - b.timestamp);
    messages.forEach(m => {
      const msgEl = createEl("div", {}, `[${new Date(m.timestamp).toLocaleTimeString()}] ${m.name}: ${m.message}`);
      chatMessagesDiv.appendChild(msgEl);
    });
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
  });

  $("chatSendBtn").onclick = () => {
    const input = $("chatInput");
    const message = input.value.trim();
    if (!message) return;
    if (message.length > 200) {
      showNotification("Mensagem muito longa!", true);
      return;
    }
    const name = $("playerNameInput").value.trim() || "Anônimo";
    const timestamp = Date.now();
    const newMsgRef = push(messagesRef);
    set(newMsgRef, { name, message, timestamp });
    input.value = "";
  };
}

// --- Inicialização ---
function init() {
  loadGame();
  recalcCPS();
  updateDisplays();

  $("clickBtn").onclick = handleClick;
  $("rebirthBtn").onclick = doRebirth;
  $("toggleTheme").onclick = toggleTheme;
  setupSaveButtons();
  setupRanking();
  setupChat();

  // Tick CPS a cada 100ms (10x por segundo)
  setInterval(cpsTick, 100);

  // Salvar a cada 15 segundos automático
  setInterval(saveGame, 15000);
}

window.onload = init;

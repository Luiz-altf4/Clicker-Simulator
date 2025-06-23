// script.js - Clicker Simulator dos Deuses

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Firebase Config ===
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

let gameState = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  multiplier: 1,
  rebirths: 0,
  prestige: 1,
  upgrades: [],
  pets: [],
  achievements: [],
  playerName: '',
  lastChatTimestamp: 0
};

const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonusClick: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonusClick: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonusClick: 0, cps: 3, price: 300 },
  { id: 4, name: "🏢 Prédio de Click", bonusClick: 0, cps: 10, price: 1000 },
  { id: 5, name: "🧪 Laboratório de Click", bonusClick: 0, cps: 25, price: 2500 },
  { id: 6, name: "🏭 Fábrica de Click", bonusClick: 0, cps: 100, price: 5000 },
  { id: 7, name: "🌆 Cidade de Click", bonusClick: 0, cps: 500, price: 15000 },
  { id: 8, name: "🌍 País de Click", bonusClick: 0, cps: 10000, price: 50000 }
];

const petsData = [
  { id: 1, name: "🐶 Cachorrinho", multiplierBonus: 0.05, price: 1000 },
  { id: 2, name: "🐱 Gatinho", multiplierBonus: 0.1, price: 2500 },
  { id: 3, name: "🐦 Pássaro", multiplierBonus: 0.15, price: 5000 },
  { id: 4, name: "🐉 Dragão", multiplierBonus: 0.3, price: 15000 }
];

const achievementsData = [
  {
    id: 1,
    name: "Primeiro Clique",
    description: "Dê seu primeiro clique",
    condition: () => gameState.totalClicks >= 1,
    reward: () => { gameState.multiplier += 0.5; }
  },
  {
    id: 2,
    name: "Mil Cliques",
    description: "Dê 1.000 cliques",
    condition: () => gameState.totalClicks >= 1000,
    reward: () => { gameState.multiplier += 1; }
  },
  {
    id: 3,
    name: "Nível 10",
    description: "Alcance o nível 10",
    condition: () => gameState.level >= 10,
    reward: () => { gameState.cps += 5; }
  },
  {
    id: 4,
    name: "Rebirth 1x",
    description: "Faça seu primeiro Rebirth",
    condition: () => gameState.rebirths >= 1,
    reward: () => { gameState.multiplier += 2; }
  }
];

// Helper: formata números grandes (ex: 1.2M)
function formatNumber(n) {
  if (n < 1000) return n.toString();
  const units = ['K', 'M', 'B', 'T', 'Qd', 'Qi'];
  let unitIndex = -1;
  do {
    n /= 1000;
    unitIndex++;
  } while (n >= 1000 && unitIndex < units.length - 1);
  return n.toFixed(1) + units[unitIndex];
}

// Helper: escapa texto para evitar XSS
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- UI UPDATE FUNCTIONS ---

function updateDisplay() {
  $("clicksDisplay").textContent = `Cliques: ${formatNumber(gameState.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${formatNumber(gameState.cps)}`;
  $("levelDisplay").textContent = `Nível: ${gameState.level}`;
  $("xpText").textContent = `XP: ${formatNumber(gameState.xp)} / ${formatNumber(gameState.xpToNext)}`;
  $("rebirthDisplay").textContent = `Rebirths: ${gameState.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${gameState.prestige}x`;

  const xpPercent = Math.min(100, (gameState.xp / gameState.xpToNext) * 100);
  $("xpFill").style.width = xpPercent + "%";

  renderUpgrades();
  renderPets();
  renderAchievements();
}

function renderUpgrades() {
  const container = $("upgradesList");
  container.innerHTML = "";
  gameState.upgrades.forEach(u => {
    const data = upgradesData.find(d => d.id === u.id);
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${data.name}</h3>
      <p>Preço: ${formatNumber(u.price)}</p>
      <p>Possui: ${u.owned}</p>
      <button ${gameState.clicks < u.price ? "disabled" : ""} onclick="buyUpgrade(${u.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

function renderPets() {
  const container = $("petsList");
  container.innerHTML = "";
  gameState.pets.forEach(p => {
    const data = petsData.find(d => d.id === p.id);
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${data.name}</h3>
      <p>Preço: ${formatNumber(p.price)}</p>
      <p>Possui: ${p.owned}</p>
      <button ${gameState.clicks < p.price ? "disabled" : ""} onclick="buyPet(${p.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

function renderAchievements() {
  const container = $("achievementsList");
  container.innerHTML = "";
  achievementsData.forEach(ach => {
    const unlocked = gameState.achievements.find(a => a.id === ach.id)?.unlocked || false;
    const div = document.createElement("div");
    div.className = "item" + (unlocked ? " completed" : "");
    div.innerHTML = `
      <h3>${ach.name}</h3>
      <p>${ach.description}</p>
      <p>Status: ${unlocked ? "Concluído" : "Em progresso"}</p>
    `;
    container.appendChild(div);
  });
}

// --- GAMEPLAY FUNCTIONS ---

window.buyUpgrade = function (id) {
  const upgrade = gameState.upgrades.find(u => u.id === id);
  if (!upgrade) return;

  if (gameState.clicks >= upgrade.price) {
    gameState.clicks -= upgrade.price;
    upgrade.owned++;
    const data = upgradesData.find(d => d.id === id);

    gameState.cps += data.cps;
    gameState.multiplier += data.bonusClick;
    upgrade.price = Math.floor(upgrade.price * 1.4);

    updateDisplay();
    saveGame();
    showNotification(`Upgrade comprado: ${data.name}`);
  }
};

window.buyPet = function (id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet) return;

  if (gameState.clicks >= pet.price) {
    gameState.clicks -= pet.price;
    pet.owned++;
    const data = petsData.find(d => d.id === id);

    // Cada pet aumenta multiplicador em % (exemplo)
    gameState.multiplier += data.multiplierBonus;

    pet.price = Math.floor(pet.price * 1.5);

    updateDisplay();
    saveGame();
    showNotification(`Pet comprado: ${data.name}`);
  }
};

function gainClick() {
  gameState.clicks += gameState.multiplier;
  gameState.totalClicks += gameState.multiplier;
  gameState.xp += 1;
  checkLevelUp();
  updateDisplay();
  createParticle("+ " + gameState.multiplier, window.innerWidth / 2, window.innerHeight / 3);
}

$("clickBtn").addEventListener("click", gainClick);

function checkLevelUp() {
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`🎉 Parabéns! Você alcançou o nível ${gameState.level}!`);
  }
  saveGame();
}

// --- Auto CPS e XP ---
setInterval(() => {
  gameState.clicks += gameState.cps;
  gameState.totalClicks += gameState.cps;
  gameState.xp += Math.floor(gameState.cps / 2);
  checkLevelUp();
  updateDisplay();
  saveGame();
}, 1000);

// --- Rebirth ---
$("rebirthBtn").addEventListener("click", () => {
  if (gameState.level >= 50) {
    gameState.rebirths++;
    gameState.prestige *= 2;
    gameState.clicks = 0;
    gameState.cps = 0;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.xpToNext = 100;
    gameState.multiplier = 1 * gameState.prestige;
    // Resetar upgrades e pets
    gameState.upgrades.forEach(u => {
      u.owned = 0;
      u.price = upgradesData.find(d => d.id === u.id).price;
    });
    gameState.pets.forEach(p => {
      p.owned = 0;
      p.price = petsData.find(d => d.id === p.id).price;
    });
    updateDisplay();
    saveGame();
    showNotification("🎉 Você fez Rebirth! Prestígio aumentado.");
  } else {
    alert("Você precisa estar no nível 50 para fazer Rebirth.");
  }
});

// --- PARTICLES DE CLIQUE ---
const particlesContainer = $("particlesContainer");
function createParticle(text, x, y) {
  const particle = document.createElement("div");
  particle.className = "particle";
  particle.textContent = text;
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particlesContainer.appendChild(particle);
  setTimeout(() => particlesContainer.removeChild(particle), 1000);
}

// --- ACHIEVEMENTS CHECK ---
setInterval(() => {
  achievementsData.forEach(ach => {
    const unlocked = gameState.achievements.find(a => a.id === ach.id);
    if (!unlocked && ach.condition()) {
      gameState.achievements.push({ id: ach.id, unlocked: true });
      ach.reward();
      saveGame();
      updateDisplay();
      showNotification(`🏆 Conquista desbloqueada: ${ach.name}`);
    }
  });
}, 3000);

// --- NOTIFICAÇÕES ---
function showNotification(text) {
  const notif = document.createElement("div");
  notif.textContent = text;
  notif.style.position = "fixed";
  notif.style.bottom = "20px";
  notif.style.right = "20px";
  notif.style.background = "#00ffffcc";
  notif.style.color = "#000";
  notif.style.padding = "10px 20px";
  notif.style.borderRadius = "10px";
  notif.style.boxShadow = "0 0 12px #00ffffcc";
  notif.style.fontWeight = "700";
  notif.style.zIndex = "9999";
  document.body.appendChild(notif);
  setTimeout(() => document.body.removeChild(notif), 3000);
}

// --- SALVAR E CARREGAR ---
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);

    // Corrige casos que podem faltar propriedades
    gameState = {
      ...gameState,
      ...saved,
      upgrades: saved.upgrades || upgradesData.map(u => ({ id: u.id, owned: 0, price: u.price })),
      pets: saved.pets || petsData.map(p => ({ id: p.id, owned: 0, price: p.price })),
      achievements: saved.achievements || []
    };
  } else {
    // Inicializar upgrades e pets caso não tenha save
    gameState.upgrades = upgradesData.map(u => ({ id: u.id, owned: 0, price: u.price }));
    gameState.pets = petsData.map(p => ({ id: p.id, owned: 0, price: p.price }));
    gameState.achievements = [];
  }
}

// --- FIREBASE CHAT ---

const chatInput = $("chatInput");
const chatSendBtn = $("chatSendBtn");
const chatMessages = $("chatMessages");

if (!gameState.playerName) {
  gameState.playerName = prompt("Digite seu nome para o chat:") || "Jogador" + Math.floor(Math.random() * 1000);
  saveGame();
}

chatSendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendChatMessage();
});

function sendChatMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;

  const now = Date.now();

  // Anti-spam (3 segundos)
  if (now - gameState.lastChatTimestamp < 3000) {
    alert("Por favor, aguarde antes de enviar outra mensagem.");
    return;
  }
  gameState.lastChatTimestamp = now;

  const chatRef = ref(db, "chat");
  push(chatRef, {
    player: gameState.playerName,
    message: msg,
    timestamp: now
  });
  chatInput.value = "";
}

// Ouvir mensagens do chat
const chatQuery = query(ref(db, "chat"), orderByChild("timestamp"), limitToLast(50));
onValue(chatQuery, snapshot => {
  chatMessages.innerHTML = "";
  snapshot.forEach(childSnap => {
    const data = childSnap.val();
    const div = document.createElement("div");
    div.className = "chat-message";
    div.innerHTML = `<strong>${escapeHTML(data.player)}:</strong> ${escapeHTML(data.message)}`;
    chatMessages.appendChild(div);
  });
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

// --- FIREBASE RANKING ---

const rankingList = $("rankingList");

function updateRanking() {
  const rankQuery = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(rankQuery, snapshot => {
    rankingList.innerHTML = "";
    const playersArr = [];
    snapshot.forEach(childSnap => {
      playersArr.push(childSnap.val());
    });
    // Ordenar decrescente
    playersArr.sort((a, b) => b.clicks - a.clicks);
    playersArr.forEach((p, i) => {
      const div = document.createElement("div");
      div.className = "ranking-entry";
      div.innerHTML = `<span>#${i + 1}</span> <strong>${escapeHTML(p.playerName)}</strong> - ${formatNumber(p.clicks)} cliques`;
      rankingList.appendChild(div);
    });
  });
}

// Atualizar ranking no Firebase a cada 10s
setInterval(() => {
  if (!gameState.playerName) return;
  const rankRef = ref(db, "ranking/" + gameState.playerName);
  set(rankRef, {
    playerName: gameState.playerName,
    clicks: gameState.clicks,
    level: gameState.level,
    timestamp: Date.now()
  });
}, 10000);

updateRanking();

// --- TEMA CLARO/ESCURO ---

const themeToggle = $("themeToggle");
let darkMode = true;

function updateTheme() {
  if (darkMode) {
    document.body.style.backgroundColor = "#0f0f1f";
    document.body.style.color = "#c0c0c0";
    themeToggle.textContent = "🌙 Modo Escuro";
  } else {
    document.body.style.backgroundColor = "#f0f0f0";
    document.body.style.color = "#222";
    themeToggle.textContent = "☀️ Modo Claro";
  }
}

themeToggle.addEventListener("click", () => {
  darkMode = !darkMode;
  updateTheme();
});

updateTheme();

// --- INIT ---
window.onload = () => {
  loadGame();
  updateDisplay();
};

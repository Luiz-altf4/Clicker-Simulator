// script.js - Clicker Simulator dos Deuses

// === Firebase Imports ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const $ = id => document.getElementById(id);

// Game State
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
  shopItems: [],
  playerName: '',
  lastChatTimestamp: 0
};

// ----- DATA -----
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

const shopItemsData = [
  { id: 1, name: "🔮 Multiplicador x2 (1h)", effect: () => applyMultiplier(2, 3600), price: 10000 },
  { id: 2, name: "⚡ Boost de CPS +50 (1h)", effect: () => applyCpsBoost(50, 3600), price: 20000 }
];

// --- Achievements ---
const achievementsData = [
  { id: 1, name: "Primeiro Clique", condition: () => gameState.totalClicks >= 1, reward: () => alert("🏆 Conquista: Primeiro Clique!"), unlocked: false },
  { id: 2, name: "Clicador Mestre", condition: () => gameState.totalClicks >= 1000, reward: () => alert("🏆 Conquista: Clicador Mestre!"), unlocked: false },
  { id: 3, name: "Nível 10", condition: () => gameState.level >= 10, reward: () => alert("🏆 Conquista: Nível 10 alcançado!"), unlocked: false }
];

// ---- UTILS ----
function formatNumber(n) {
  if (n < 1000) return n.toString();
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  let unitIndex = 0;
  let num = n;
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  return num.toFixed(2) + units[unitIndex];
}

function createParticle(text, x, y) {
  const particle = document.createElement("span");
  particle.textContent = text;
  particle.className = "particle";
  particle.style.left = x + "px";
  particle.style.top = y + "px";
  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 1000);
}

// Apply multipliers temporários
let activeMultiplier = 1;
let multiplierTimeout = null;
function applyMultiplier(mult, seconds) {
  clearTimeout(multiplierTimeout);
  activeMultiplier = mult;
  setTimeout(() => {
    activeMultiplier = 1;
    updateDisplay();
  }, seconds * 1000);
  updateDisplay();
}

let activeCpsBoost = 0;
let cpsBoostTimeout = null;
function applyCpsBoost(boost, seconds) {
  clearTimeout(cpsBoostTimeout);
  activeCpsBoost = boost;
  setTimeout(() => {
    activeCpsBoost = 0;
  }, seconds * 1000);
}

// --- LOAD & SAVE ----
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

function loadGame() {
  const saved = localStorage.getItem("clickerSave");
  if (saved) {
    const data = JSON.parse(saved);
    Object.assign(gameState, data);
    // Reset upgrades and pets arrays to avoid reference errors
    if (!gameState.upgrades || gameState.upgrades.length === 0) {
      gameState.upgrades = upgradesData.map(u => ({ ...u, owned: 0, price: u.price }));
    }
    if (!gameState.pets || gameState.pets.length === 0) {
      gameState.pets = petsData.map(p => ({ ...p, owned: 0 }));
    }
    if (!gameState.achievements || gameState.achievements.length === 0) {
      gameState.achievements = achievementsData.map(a => ({ ...a, unlocked: false }));
    }
  } else {
    // First load defaults
    gameState.upgrades = upgradesData.map(u => ({ ...u, owned: 0, price: u.price }));
    gameState.pets = petsData.map(p => ({ ...p, owned: 0 }));
    gameState.achievements = achievementsData.map(a => ({ ...a, unlocked: false }));
  }
}

// --- DISPLAY UPDATES ---
function updateDisplay() {
  $("clicksDisplay").textContent = `Cliques: ${formatNumber(gameState.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${formatNumber(gameState.cps + activeCpsBoost)}`;
  $("levelDisplay").textContent = `Nível: ${gameState.level}`;
  $("rebirthDisplay").textContent = `Rebirths: ${gameState.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${gameState.prestige}x`;
  $("xpText").textContent = `XP: ${gameState.xp} / ${gameState.xpToNext}`;
  $("xpFill").style.width = `${(gameState.xp / gameState.xpToNext) * 100}%`;

  renderUpgrades();
  renderPets();
  renderShopItems();
  renderAchievements();
}

// --- RENDER FUNCS ---

function renderUpgrades() {
  const container = $("upgradesList");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "item" + (upg.owned > 0 ? " completed" : "");
    div.innerHTML = `
      <h3>${upg.name}</h3>
      <p>Preço: ${formatNumber(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      <button ${gameState.clicks < upg.price ? "disabled" : ""} onclick="buyUpgrade(${upg.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

function renderPets() {
  const container = $("petsList");
  container.innerHTML = "";
  gameState.pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "item" + (pet.owned > 0 ? " completed" : "");
    div.innerHTML = `
      <h3>${pet.name}</h3>
      <p>Preço: ${formatNumber(pet.price)}</p>
      <p>Multiplicador bônus: +${(pet.multiplierBonus * 100).toFixed(1)}%</p>
      <p>Possui: ${pet.owned}</p>
      <button ${gameState.clicks < pet.price ? "disabled" : ""} onclick="buyPet(${pet.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

function renderShopItems() {
  const container = $("shopItems");
  container.innerHTML = "";
  shopItemsData.forEach(item => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${item.name}</h3>
      <p>Preço: ${formatNumber(item.price)}</p>
      <button ${gameState.clicks < item.price ? "disabled" : ""} onclick="buyShopItem(${item.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

function renderAchievements() {
  const container = $("achievementsList");
  container.innerHTML = "";
  gameState.achievements.forEach(ach => {
    const div = document.createElement("div");
    div.className = "item" + (ach.unlocked ? " completed" : "");
    div.innerHTML = `
      <h3>${ach.name}</h3>
      <p>${ach.unlocked ? "Desbloqueado" : "Bloqueado"}</p>
    `;
    container.appendChild(div);
  });
}

// --- PURCHASES ---

window.buyUpgrade = function(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg || gameState.clicks < upg.price) return;
  gameState.clicks -= upg.price;
  upg.owned++;
  gameState.cps += upg.cps;
  gameState.multiplier += upg.bonusClick;
  upg.price = Math.floor(upg.price * 1.35);
  saveGame();
  updateDisplay();
  createParticle("+Upgrade!", window.innerWidth / 2, window.innerHeight / 2);
};

window.buyPet = function(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet || gameState.clicks < pet.price) return;
  gameState.clicks -= pet.price;
  pet.owned++;
  gameState.multiplier += pet.multiplierBonus;
  pet.price = Math.floor(pet.price * 1.4);
  saveGame();
  updateDisplay();
  createParticle("🐾 Pet comprado!", window.innerWidth / 2, window.innerHeight / 2);
};

window.buyShopItem = function(id) {
  const item = shopItemsData.find(i => i.id === id);
  if (!item || gameState.clicks < item.price) return;
  gameState.clicks -= item.price;
  item.effect();
  saveGame();
  updateDisplay();
  createParticle("🎁 Item ativado!", window.innerWidth / 2, window.innerHeight / 2);
};

// --- CLICK HANDLING ---
$("clickBtn").addEventListener("click", () => {
  gameState.clicks += gameState.multiplier;
  gameState.totalClicks += gameState.multiplier;
  gameState.xp += 1;
  checkLevelUp();
  saveGame();
  updateDisplay();
  createParticle("+ " + gameState.multiplier, event.clientX, event.clientY);
});

// --- LEVEL UP & XP ---
function checkLevelUp() {
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp -= gameState.xpToNext;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    createParticle("Nível UP!", window.innerWidth / 2, window.innerHeight / 3);
    saveGame();
  }
}

// --- AUTO CPS ---
setInterval(() => {
  gameState.clicks += gameState.cps + activeCpsBoost;
  gameState.totalClicks += gameState.cps + activeCpsBoost;
  gameState.xp += Math.floor((gameState.cps + activeCpsBoost) / 2);
  checkLevelUp();
  saveGame();
  updateDisplay();
}, 1000);

// --- ACHIEVEMENTS CHECK ---
setInterval(() => {
  gameState.achievements.forEach(ach => {
    if (!ach.unlocked && ach.condition()) {
      ach.unlocked = true;
      ach.reward();
      saveGame();
      updateDisplay();
    }
  });
}, 5000);

// --- REBIRTH & PRESTIGE ---
window.rebirth = function() {
  if (gameState.level >= 50) {
    gameState.rebirths++;
    gameState.prestige *= 2;
    gameState.clicks = 0;
    gameState.cps = 0;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.xpToNext = 100;
    gameState.multiplier = 1 * gameState.prestige;
    gameState.upgrades.forEach(u => { u.owned = 0; u.price = upgradesData.find(d => d.id === u.id).price; });
    gameState.pets.forEach(p => { p.owned = 0; p.price = petsData.find(d => d.id === p.id).price; });
    alert("🎉 Você fez Rebirth! Prestígio aumentado.");
    saveGame();
    updateDisplay();
  } else {
    alert("Você precisa estar no nível 50 para Rebirth.");
  }
};

// --- CHAT GLOBAL ---
// Chat elements
const chatInput = $("chatInput");
const chatSendBtn = $("chatSendBtn");
const chatMessages = $("chatMessages");

// Player must enter name before chatting
function promptPlayerName() {
  let name = prompt("Digite seu nome para o chat:");
  if (!name || name.trim() === "") name = "Jogador" + Math.floor(Math.random() * 1000);
  gameState.playerName = name;
  saveGame();
}
if (!gameState.playerName) promptPlayerName();

// Send message to Firebase
chatSendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter") sendChatMessage();
});

function sendChatMessage() {
  const msg = chatInput.value.trim();
  if (!msg) return;
  const now = Date.now();

  // Anti-spam: 3s delay between messages
  if (now - gameState.lastChatTimestamp < 3000) {
    alert("Por favor, espere antes de enviar outra mensagem.");
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

// Listen for chat updates
const chatRef = query(ref(db, "chat"), orderByChild("timestamp"), limitToLast(50));
onValue(chatRef, snapshot => {
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

// --- RANKING ---

const rankingList = $("rankingList");

function updateRanking() {
  const rankRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(rankRef, snapshot => {
    rankingList.innerHTML = "";
    const arr = [];
    snapshot.forEach(childSnap => {
      arr.push(childSnap.val());
    });
    // Order descending by clicks
    arr.sort((a, b) => b.clicks - a.clicks);
    arr.forEach((player, i) => {
      const div = document.createElement("div");
      div.className = "ranking-entry";
      div.innerHTML = `<span>#${i + 1}</span> <strong>${escapeHTML(player.playerName)}</strong> - ${formatNumber(player.clicks)} cliques`;
      rankingList.appendChild(div);
    });
  });
}

// Update Firebase ranking every 10s
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

// Inicialização ranking
updateRanking();

// --- Helpers ---
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// --- Init ---
function init() {
  loadGame();
  updateDisplay();
}
init();

// --- Autosave ---
setInterval(saveGame, 5000);


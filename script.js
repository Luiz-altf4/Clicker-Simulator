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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const $ = id => document.getElementById(id);

// === Game State ===
let gameState = {
  clicks: 0,
  cps: 0,
  totalClicks: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  multiplier: 1,
  rebirths: 0,
  prestige: 1,
  upgrades: [],
  pets: [],
  achievements: [],
  playerName: "",
  lastChatTimestamp: 0,
};

// === Upgrades Data (adicionado 9 novos upgrades) ===
const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonusClick: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonusClick: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonusClick: 0, cps: 2, price: 300 },
  { id: 4, name: "🏢 Prédio de Click", bonusClick: 0, cps: 10, price: 1000 },
  { id: 5, name: "🧪 Laboratório de Click", bonusClick: 0, cps: 20, price: 2500 },
  { id: 6, name: "🏭 Fábrica de Click", bonusClick: 0, cps: 100, price: 5000 },
  { id: 7, name: "🌆 Cidade de Click", bonusClick: 0, cps: 500, price: 15000 },
  { id: 8, name: "🌍 País de Click", bonusClick: 0, cps: 10000, price: 50000 },
  { id: 9, name: "🚀 Espaçonave", bonusClick: 0, cps: 25000, price: 150000 },
  { id: 10, name: "🛸 Nave Alienígena", bonusClick: 0, cps: 100000, price: 750000 },
  { id: 11, name: "🏰 Castelo Digital", bonusClick: 0, cps: 500000, price: 2000000 },
  { id: 12, name: "🌌 Buraco Negro", bonusClick: 0, cps: 2000000, price: 10000000 },
  { id: 13, name: "🪐 Anel de Saturno", bonusClick: 0, cps: 7500000, price: 35000000 },
  { id: 14, name: "⚡ Estação de Energia", bonusClick: 0, cps: 25000000, price: 100000000 },
  { id: 15, name: "🤖 Exército de Bots", bonusClick: 0, cps: 100000000, price: 500000000 },
  { id: 16, name: "🧠 Inteligência Artificial", bonusClick: 0, cps: 500000000, price: 2000000000 },
  { id: 17, name: "🌠 Estrela Supernova", bonusClick: 0, cps: 2500000000, price: 10000000000 },
];

// === Pets Data === (exemplo básico)
const petsData = [
  { id: 1, name: "🐶 Cãozinho", multiplierBonus: 0.1, price: 100 },
  { id: 2, name: "🐱 Gatinho", multiplierBonus: 0.2, price: 500 },
  { id: 3, name: "🐉 Dragãozinho", multiplierBonus: 0.5, price: 2000 },
];

// === Achievements Data ===
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

// === Helpers ===

function formatNumber(n) {
  if (n < 1000) return n.toString();
  const units = ['K', 'M', 'B', 'T', 'Qd', 'Qi', 'Sx', 'Sp', 'Oc', 'No'];
  let unitIndex = -1;
  while (n >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }
  return n.toFixed(2) + units[unitIndex];
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// === RENDER FUNCTIONS ===

function renderUpgrades() {
  const container = $("upgradesList");
  container.innerHTML = "";
  gameState.upgrades.forEach(u => {
    const data = upgradesData.find(d => d.id === u.id);
    if (!data) return;
    const div = document.createElement("div");
    div.className = "item upgrade-item";
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
    if (!data) return;
    const div = document.createElement("div");
    div.className = "item pet-item";
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
    div.className = "item achievement-item" + (unlocked ? " completed" : "");
    div.innerHTML = `
      <h3>${ach.name}</h3>
      <p>${ach.description}</p>
      <p>Status: ${unlocked ? "Concluído" : "Em progresso"}</p>
    `;
    container.appendChild(div);
  });
}

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

// === GAMEPLAY FUNCTIONS ===

window.buyUpgrade = function (id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return;
  if (gameState.clicks < upg.price) return;

  const data = upgradesData.find(d => d.id === id);
  if (!data) return;

  gameState.clicks -= upg.price;
  upg.owned++;
  gameState.cps += data.cps;
  gameState.multiplier += data.bonusClick;
  upg.price = Math.floor(upg.price * 1.35);

  saveGame();
  updateDisplay();
  showNotification(`Upgrade comprado: ${data.name}`);
};

window.buyPet = function (id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet) return;
  if (gameState.clicks < pet.price) return;

  const data = petsData.find(d => d.id === id);
  if (!data) return;

  gameState.clicks -= pet.price;
  pet.owned++;
  gameState.multiplier += data.multiplierBonus;
  pet.price = Math.floor(pet.price * 1.5);

  saveGame();
  updateDisplay();
  showNotification(`Pet comprado: ${data.name}`);
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
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
    showNotification(`🎉 Parabéns! Você alcançou o nível ${gameState.level}!`);
  }
  saveGame();
}

// === Auto CPS e XP ===
setInterval(() => {
  gameState.clicks += gameState.cps;
  gameState.totalClicks += gameState.cps;
  gameState.xp += Math.floor(gameState.cps / 2);
  checkLevelUp();
  updateDisplay();
  saveGame();
}, 1000);

// === Rebirth ===
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
    // Reset upgrades e pets
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

// === PARTICLES ===
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

// === ACHIEVEMENTS CHECK ===
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

// === NOTIFICAÇÕES ===
function showNotification(text) {
  const notif = document.createElement("div");
  notif.textContent = text;
  notif.style.position = "fixed";
  notif.style.bottom = "20px";
  notif.style.right = "20px";
  notif.style.background = "rgba(0, 255, 255, 0.8)";
  notif.style.color = "#000";
  notif.style.padding = "10px 20px";
  notif.style.borderRadius = "12px";
  notif.style.boxShadow = "0 0 12px #00ffffcc";
  notif.style.fontWeight = "700";
  notif.style.zIndex = "9999";
  document.body.appendChild(notif);
  setTimeout(() => document.body.removeChild(notif), 3000);
}

// === SALVAR E CARREGAR ===
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);
    gameState = {
      ...gameState,
      ...saved,
      upgrades: saved.upgrades || upgradesData.map(u => ({ id: u.id, owned: 0, price: u.price })),
      pets: saved.pets || petsData.map(p => ({ id: p.id, owned: 0, price: p.price })),
      achievements: saved.achievements || [],
    };
  } else {
    gameState.upgrades = upgradesData.map(u => ({ id: u.id, owned: 0, price: u.price }));
    gameState.pets = petsData.map(p => ({ id: p.id, owned: 0, price: p.price }));
    gameState.achievements = [];
  }
}

// === CHAT ===
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
  if (now - gameState.lastChatTimestamp < 3000) {
    alert("Por favor, aguarde 3 segundos entre mensagens.");
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

// === RANKING ===
const rankList = $("rankList");
const rankQuery = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(20));

onValue(rankQuery, snapshot => {
  rankList.innerHTML = "";
  const arr = [];
  snapshot.forEach(childSnap => {
    arr.push(childSnap.val());
  });
  // Ordena decrescente por clicks
  arr.sort((a, b) => b.clicks - a.clicks);
  arr.forEach(player => {
    const div = document.createElement("div");
    div.className = "rank-item";
    div.textContent = `${escapeHTML(player.name)} - ${formatNumber(player.clicks)} cliques`;
    rankList.appendChild(div);
  });
});

// Atualiza ranking no Firebase (exemplo simples, talvez melhorar com debounce)
function updateRanking() {
  if (!gameState.playerName) return;
  const rankRef = ref(db, `ranking/${gameState.playerName}`);
  set(rankRef, {
    name: gameState.playerName,
    clicks: gameState.clicks,
    timestamp: Date.now()
  });
}

// Atualiza ranking a cada 30s e ao fazer ações importantes
setInterval(updateRanking, 30000);
setInterval(saveGame, 10000);

window.onload = () => {
  loadGame();
  updateDisplay();
  updateRanking();
};

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

let gameState = {
  clicks: 0,
  cps: 0,
  totalClicks: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  upgrades: [],
  pets: [],
  achievements: [],
  playerName: '',
  multiplier: 1,
  rebirths: 0,
  prestigeMultiplier: 1,
  chatCooldown: false
};

const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonusClick: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonusClick: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonusClick: 0, cps: 2, price: 300 },
  { id: 4, name: "🏢 Prédio de Click", bonusClick: 0, cps: 10, price: 1000 },
  { id: 5, name: "🧪 Laboratório de Click", bonusClick: 0, cps: 20, price: 2500 },
  { id: 6, name: "🏭 Fábrica de Click", bonusClick: 0, cps: 100, price: 5000 },
  { id: 7, name: "🌆 Cidade de Click", bonusClick: 0, cps: 500, price: 15000 },
  { id: 8, name: "🌍 País de Click", bonusClick: 0, cps: 10000, price: 50000 },
  { id: 9, name: "🚀 Base Espacial", bonusClick: 0, cps: 50000, price: 200000 },
  { id: 10, name: "🤖 Exército de Robôs", bonusClick: 0, cps: 200000, price: 800000 },
  { id: 11, name: "🌌 Império Galáctico", bonusClick: 0, cps: 1000000, price: 3500000 },
  { id: 12, name: "⚡ Núcleo de Energia", bonusClick: 0, cps: 5000000, price: 12000000 },
  { id: 13, name: "🛸 Frota Alienígena", bonusClick: 0, cps: 25000000, price: 60000000 },
  { id: 14, name: "🕹️ Inteligência Artificial", bonusClick: 0, cps: 100000000, price: 300000000 },
  { id: 15, name: "🌠 Buraco Negro", bonusClick: 0, cps: 500000000, price: 1500000000 },
  { id: 16, name: "🌌 Universo Paralelo", bonusClick: 0, cps: 2000000000, price: 7000000000 },
  { id: 17, name: "👑 Deus dos Clicks", bonusClick: 0, cps: 10000000000, price: 30000000000 }
];

// Pets ex. simples
const petsData = [
  { id: 1, name: "🐶 Cachorro", bonusCPS: 1, price: 500 },
  { id: 2, name: "🐱 Gato", bonusCPS: 5, price: 2000 },
  { id: 3, name: "🦊 Raposa", bonusCPS: 20, price: 10000 },
];

// Achievements ex. simples
const achievementsData = [
  { id: 1, name: "Primeiro Clique", desc: "Faça seu primeiro clique", condition: gs => gs.totalClicks >= 1 },
  { id: 2, name: "100 Cliques", desc: "Alcance 100 cliques totais", condition: gs => gs.totalClicks >= 100 },
  { id: 3, name: "Nível 10", desc: "Chegue ao nível 10", condition: gs => gs.level >= 10 },
  { id: 4, name: "Rebirth!", desc: "Faça seu primeiro Rebirth", condition: gs => gs.rebirths >= 1 },
  { id: 5, name: "Colecionador de Pets", desc: "Adquira todos os pets", condition: gs => gs.pets.length >= petsData.length }
];

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[m]);
}

function formatNumber(num) {
  if (num < 1000) return num.toString();
  const suffixes = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  let e = Math.floor(Math.log10(num) / 3);
  let val = num / Math.pow(1000, e);
  return val.toFixed(2) + suffixes[e - 1];
}

function init() {
  if (!gameState.playerName) {
    let name = prompt("Digite seu nome de jogador:");
    if (!name || !name.trim()) name = "Player" + Math.floor(Math.random()*9999);
    gameState.playerName = name.trim().substring(0,20);
  }

  upgradesData.forEach(u => {
    const found = gameState.upgrades.find(upg => upg.id === u.id);
    if (!found) gameState.upgrades.push({...u, owned:0, price: u.price});
  });

  petsData.forEach(p => {
    const found = gameState.pets.find(pt => pt.id === p.id);
    if (!found) gameState.pets.push({...p, owned: false});
  });

  achievementsData.forEach(a => {
    const found = gameState.achievements.find(ac => ac.id === a.id);
    if (!found) gameState.achievements.push({...a, unlocked: false});
  });

  loadGame();
  updateAllDisplays();
  renderAll();
  startIntervals();
  setupChat();
  updateRanking();
}

function updateAllDisplays() {
  $("clicksDisplay").textContent = `Cliques: ${formatNumber(gameState.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${formatNumber(gameState.cps)}`;
  $("levelDisplay").textContent = `Nível: ${gameState.level}`;
  $("rebirthDisplay").textContent = `Rebirths: ${gameState.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${gameState.prestigeMultiplier}x`;
  $("xpText").textContent = `XP: ${formatNumber(gameState.xp)} / ${formatNumber(gameState.xpToNext)}`;
  const xpPercent = Math.min(100, (gameState.xp / gameState.xpToNext) * 100);
  $("xpFill").style.width = xpPercent + "%";
}

function renderAll() {
  renderUpgrades();
  renderPets();
  renderAchievements();
}

function renderUpgrades() {
  const container = $("upgradesList");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const canBuy = gameState.clicks >= upg.price;
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${escapeHTML(upg.name)}</h3>
      <p>Preço: ${formatNumber(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      <button ${canBuy ? '' : 'disabled'} onclick="buyUpgrade(${upg.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

function renderPets() {
  const container = $("petsList");
  container.innerHTML = "";
  gameState.pets.forEach(pet => {
    const canBuy = !pet.owned && gameState.clicks >= pet.price;
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${escapeHTML(pet.name)}</h3>
      <p>Preço: ${formatNumber(pet.price)}</p>
      <p>${pet.owned ? "Adotado" : "Disponível"}</p>
      <button ${canBuy ? '' : 'disabled'} onclick="buyPet(${pet.id})">${pet.owned ? "✔️" : "Comprar"}</button>
    `;
    container.appendChild(div);
  });
}

function renderAchievements() {
  const container = $("achievementsList");
  container.innerHTML = "";
  gameState.achievements.forEach(ac => {
    const unlocked = ac.unlocked;
    const div = document.createElement("div");
    div.className = "item";
    div.style.backgroundColor = unlocked ? "#004477cc" : "#002233cc";
    div.innerHTML = `
      <h3>${escapeHTML(ac.name)}</h3>
      <p>${escapeHTML(ac.desc)}</p>
      <p>Status: ${unlocked ? "Desbloqueado ✅" : "Bloqueado ❌"}</p>
    `;
    container.appendChild(div);
  });
}

window.buyUpgrade = function(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg || gameState.clicks < upg.price) return;
  gameState.clicks -= upg.price;
  upg.owned++;
  gameState.cps += upg.cps;
  gameState.multiplier += upg.bonusClick;
  upg.price = Math.floor(upg.price * 1.35);
  saveGame();
  updateAllDisplays();
  renderUpgrades();
  checkAchievements();
};

window.buyPet = function(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet || pet.owned || gameState.clicks < pet.price) return;
  gameState.clicks -= pet.price;
  pet.owned = true;
  gameState.cps += pet.bonusCPS;
  saveGame();
  updateAllDisplays();
  renderPets();
  checkAchievements();
};

function gainClick() {
  gameState.clicks += gameState.multiplier * gameState.prestigeMultiplier;
  gameState.totalClicks += gameState.multiplier * gameState.prestigeMultiplier;
  gameState.xp += 1 * gameState.prestigeMultiplier;
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp -= gameState.xpToNext;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
  }
  spawnParticle(`+${formatNumber(gameState.multiplier * gameState.prestigeMultiplier)}`, event.clientX, event.clientY);
  updateAllDisplays();
  checkAchievements();
}

$("clickArea").addEventListener("click", gainClick);
$("clickBtn").addEventListener("click", gainClick);

function startIntervals() {
  setInterval(() => {
    gameState.clicks += gameState.cps * gameState.prestigeMultiplier;
    gameState.totalClicks += gameState.cps * gameState.prestigeMultiplier;
    updateAllDisplays();
    checkAchievements();
  }, 1000);

  setInterval(() => {
    saveGame();
    updateRanking();
  }, 10000);
}

function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(gameState, saved);
  }
}

function checkAchievements() {
  let updated = false;
  gameState.achievements.forEach(ac => {
    if (!ac.unlocked && ac.condition(gameState)) {
      ac.unlocked = true;
      updated = true;
      notify(`Conquista desbloqueada: ${ac.name}`);
    }
  });
  if (updated) renderAchievements();
}

function notify(text) {
  const n = document.createElement("div");
  n.textContent = text;
  n.style.position = "fixed";
  n.style.top = "20px";
  n.style.left = "50%";
  n.style.transform = "translateX(-50%)";
  n.style.background = "#00ffffcc";
  n.style.color = "#001922";
  n.style.padding = "10px 25px";
  n.style.borderRadius = "15px";
  n.style.fontWeight = "900";
  n.style.fontFamily = "'Orbitron', monospace";
  n.style.zIndex = "999999";
  n.style.userSelect = "none";
  document.body.appendChild(n);
  setTimeout(() => {
    n.style.transition = "opacity 1s ease";
    n.style.opacity = "0";
    setTimeout(() => document.body.removeChild(n), 1000);
  }, 1500);
}

function spawnParticle(text, x, y) {
  const container = $("particlesContainer");
  if (!container) return;
  const p = document.createElement("div");
  p.className = "particle";
  p.textContent = text;
  p.style.left = x + "px";
  p.style.top = y + "px";
  container.appendChild(p);
  setTimeout(() => {
    if (p.parentNode) p.parentNode.removeChild(p);
  }, 1000);
}

// === CHAT ===
const chatMessages = $("chatMessages");
const chatInput = $("chatInput");
const chatSendBtn = $("chatSendBtn");

function setupChat() {
  chatSendBtn.addEventListener("click", sendMessage);
  chatInput.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });
  listenChat();
}

function listenChat() {
  const chatRef = ref(db, "chat");
  onValue(chatRef, snapshot => {
    chatMessages.innerHTML = "";
    snapshot.forEach(childSnap => {
      const msg = childSnap.val();
      if (msg && msg.name && msg.text) {
        const div = document.createElement("div");
        div.textContent = `${escapeHTML(msg.name)}: ${escapeHTML(msg.text)}`;
        chatMessages.appendChild(div);
      }
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

function sendMessage() {
  if (gameState.chatCooldown) return;
  let text = chatInput.value.trim();
  if (!text) return;
  if (text.length > 150) {
    notify("Mensagem muito longa!");
    return;
  }
  const chatRef = ref(db, "chat");
  push(chatRef, {
    name: gameState.playerName,
    text,
    timestamp: Date.now()
  });
  chatInput.value = "";
  gameState.chatCooldown = true;
  setTimeout(() => gameState.chatCooldown = false, 3000); // antispam 3s
}

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

// Atualiza ranking no Firebase (com debounce)
let rankingTimeout;
function updateRanking() {
  if (!gameState.playerName) return;
  if (rankingTimeout) clearTimeout(rankingTimeout);
  rankingTimeout = setTimeout(() => {
    const rankRef = ref(db, `ranking/${gameState.playerName}`);
    set(rankRef, {
      name: gameState.playerName,
      clicks: gameState.clicks,
      timestamp: Date.now()
    });
  }, 1000);
}

// === REBIRTH ===
const rebirthBtn = $("rebirthBtn");
rebirthBtn.addEventListener("click", () => {
  if (gameState.level < 50) {
    notify("Você precisa estar no nível 50 para fazer Rebirth!");
    return;
  }
  // Reseta progresso, aumenta rebirths e multiplica prestígio
  gameState.rebirths++;
  gameState.prestigeMultiplier *= 1.2;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.clicks = 0;
  gameState.cps = 0;
  gameState.multiplier = 1;
  gameState.upgrades.forEach(u => {
    u.owned = 0;
    u.price = upgradesData.find(ud => ud.id === u.id).price;
  });
  gameState.pets.forEach(p => p.owned = false);
  saveGame();
  updateAllDisplays();
  renderAll();
  notify("Rebirth realizado! Prestígio aumentado em 20%!");
  updateRanking();
});

window.addEventListener("beforeunload", saveGame);

init();

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

// === Atalhos ===
const $ = (id) => document.getElementById(id);

// === Game State ===
let gameState = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  multiplier: 1,
  upgrades: [],
  pets: [],
  rebirths: 0,
  achievements: [],
  missions: [],
  skins: [],
  currentSkin: "default",
  particlesEnabled: true,
  soundEnabled: true,
  theme: "dark",
  chatName: "",
  log: []
};

// === Upgrade Data ===
const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonus: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonus: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonus: 0, cps: 2, price: 300 },
  { id: 4, name: "🏢 Prédio de Click", bonus: 0, cps: 10, price: 1000 },
  { id: 5, name: "🧪 Laboratório", bonus: 0, cps: 20, price: 2500 },
  { id: 6, name: "🏭 Fábrica de Click", bonus: 0, cps: 100, price: 5000 },
  { id: 7, name: "🌆 Cidade de Click", bonus: 0, cps: 500, price: 15000 },
  { id: 8, name: "🌍 País de Click", bonus: 0, cps: 10000, price: 50000 },
  { id: 9, name: "🚀 Click Espacial", bonus: 0, cps: 50000, price: 150000 },
  { id: 10, name: "👾 Click Alienígena", bonus: 0, cps: 100000, price: 300000 },
  { id: 11, name: "🪐 Império Clicker", bonus: 0, cps: 200000, price: 800000 },
  { id: 12, name: "🧠 Click Neural", bonus: 0, cps: 500000, price: 1500000 },
  { id: 13, name: "🔮 Click Dimensional", bonus: 0, cps: 1e6, price: 5e6 },
  { id: 14, name: "🔥 Click de Fogo", bonus: 2, cps: 1e6, price: 1e7 },
  { id: 15, name: "❄️ Click de Gelo", bonus: 3, cps: 2e6, price: 2e7 },
  { id: 16, name: "⚡ Click Elétrico", bonus: 5, cps: 3e6, price: 3e7 },
  { id: 17, name: "☠️ Click Mortal", bonus: 10, cps: 5e6, price: 5e7 }
];

// === Pet Data ===
const petData = [
  { id: 1, name: "🐹 Hamster", bonus: 1.2, price: 1000 },
  { id: 2, name: "🐶 Cão Clicker", bonus: 1.5, price: 5000 },
  { id: 3, name: "🐱 Gato Lendário", bonus: 2.5, price: 20000 },
  { id: 4, name: "🐉 Dragão de Ouro", bonus: 5.0, price: 100000 }
];

// === Inicialização ===
function init() {
  if (gameState.upgrades.length === 0)
    gameState.upgrades = upgradesData.map(u => ({ ...u, owned: 0 }));

  if (gameState.pets.length === 0)
    gameState.pets = petData.map(p => ({ ...p, owned: false }));

  loadGame();
  updateDisplay();
  renderUpgrades();
  renderPets();
  setupTheme();
  setupChat();
  startIntervals();
  tutorial();
}

// === Formatador de números ===
function format(n) {
  if (n >= 1e72) return (n / 1e72).toFixed(2) + " Qn";
  if (n >= 1e69) return (n / 1e69).toFixed(2) + " Sp";
  if (n >= 1e66) return (n / 1e66).toFixed(2) + " Sx";
  if (n >= 1e63) return (n / 1e63).toFixed(2) + " Qi";
  if (n >= 1e60) return (n / 1e60).toFixed(2) + " Qd";
  if (n >= 1e57) return (n / 1e57).toFixed(2) + " No";
  if (n >= 1e54) return (n / 1e54).toFixed(2) + " Oc";
  if (n >= 1e51) return (n / 1e51).toFixed(2) + " Sp";
  if (n >= 1e48) return (n / 1e48).toFixed(2) + " Sx";
  if (n >= 1e45) return (n / 1e45).toFixed(2) + " Qi";
  if (n >= 1e42) return (n / 1e42).toFixed(2) + " Qd";
  if (n >= 1e39) return (n / 1e39).toFixed(2) + " No";
  if (n >= 1e36) return (n / 1e36).toFixed(2) + " Dc";
  if (n >= 1e33) return (n / 1e33).toFixed(2) + " Dc";
  if (n >= 1e30) return (n / 1e30).toFixed(2) + " N";
  if (n >= 1e27) return (n / 1e27).toFixed(2) + " Oc";
  if (n >= 1e24) return (n / 1e24).toFixed(2) + " Sp";
  if (n >= 1e21) return (n / 1e21).toFixed(2) + " Sx";
  if (n >= 1e18) return (n / 1e18).toFixed(2) + " Qi";
  if (n >= 1e15) return (n / 1e15).toFixed(2) + " Qd";
  if (n >= 1e12) return (n / 1e12).toFixed(2) + " T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + " B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + " M";
  if (n >= 1e3) return (n / 1e3).toFixed(2) + " K";
  return Math.floor(n);
}

// === Notificação / Log ===
function notify(msg) {
  const log = $("notification");
  if (!log) return;

  const div = document.createElement("div");
  div.className = "toast";
  div.textContent = msg;
  log.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

// === Partículas de Clique ===
function createParticle(x, y, txt) {
  const particle = document.createElement("div");
  particle.className = "particle";
  particle.textContent = txt || "+1";
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  document.body.appendChild(particle);

  setTimeout(() => {
    particle.style.opacity = "0";
    particle.style.transform = "translateY(-40px)";
  }, 50);
  setTimeout(() => particle.remove(), 1000);
}

// === Tema claro/escuro ===
function setupTheme() {
  const body = document.body;
  if (gameState.theme === "light") body.classList.add("light");
  else body.classList.remove("light");

  $("themeToggle").addEventListener("click", () => {
    gameState.theme = gameState.theme === "light" ? "dark" : "light";
    body.classList.toggle("light");
    saveGame();
  });
}

// === Tutorial inicial ===
function tutorial() {
  if (!localStorage.getItem("tutorialDone")) {
    notify("👋 Bem-vindo ao Clicker Simulator!");
    setTimeout(() => notify("🖱️ Clique no círculo central para ganhar cliques!"), 3000);
    setTimeout(() => notify("🛒 Use seus cliques para comprar upgrades."), 6000);
    setTimeout(() => notify("💬 Envie mensagens no chat global!"), 9000);
    localStorage.setItem("tutorialDone", "true");
  }
}

document.addEventListener("DOMContentLoaded", init);

// === Atualiza tela principal ===
function updateDisplay() {
  $("clicks").textContent = format(gameState.clicks);
  $("cps").textContent = format(gameState.cps);
  $("level").textContent = gameState.level;
  $("xpBar").style.width = `${(gameState.xp / gameState.xpToNext) * 100}%`;
  $("xpBar").textContent = `${gameState.xp}/${gameState.xpToNext}`;
}

// === Clique Manual ===
$("clickArea").addEventListener("click", (e) => {
  gameState.clicks += gameState.multiplier;
  gameState.totalClicks += gameState.multiplier;
  gameState.xp++;
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp = 0;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.5);
    notify(`🔼 Subiu para o nível ${gameState.level}!`);
  }
  updateDisplay();
  if (gameState.particlesEnabled) {
    createParticle(e.clientX, e.clientY, `+${gameState.multiplier}`);
  }
});

// === Ganhos por segundo ===
function startIntervals() {
  setInterval(() => {
    gameState.clicks += gameState.cps;
    gameState.totalClicks += gameState.cps;
    updateDisplay();
  }, 1000);

  setInterval(saveGame, 10000);
}

// === Upgrades ===
function renderUpgrades() {
  const container = $("upgradesList");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${upg.name}</h3>
      <p>Preço: ${format(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      <button onclick="buyUpgrade(${upg.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

window.buyUpgrade = function (id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg || gameState.clicks < upg.price) return;
  gameState.clicks -= upg.price;
  upg.owned++;
  gameState.cps += upg.cps;
  gameState.multiplier += upg.bonus;
  upg.price = Math.floor(upg.price * 1.45);
  updateDisplay();
  renderUpgrades();
  notify(`⬆️ Comprado: ${upg.name}`);
  saveGame();
};

// === Pets ===
function renderPets() {
  const container = $("petsList");
  if (!container) return;

  container.innerHTML = "";
  gameState.pets.forEach(p => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>Multiplicador: x${p.bonus}</p>
      <p>Preço: ${format(p.price)}</p>
      <button ${p.owned ? "disabled" : ""} onclick="buyPet(${p.id})">${p.owned ? "Possuído" : "Comprar"}</button>
    `;
    container.appendChild(div);
  });
}

window.buyPet = function (id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet || pet.owned || gameState.clicks < pet.price) return;
  gameState.clicks -= pet.price;
  pet.owned = true;
  gameState.multiplier *= pet.bonus;
  updateDisplay();
  renderPets();
  notify(`🐾 Novo pet: ${pet.name}`);
  saveGame();
};

// === Rebirth ===
$("rebirthBtn").addEventListener("click", () => {
  if (gameState.clicks >= 1e6) {
    gameState.rebirths++;
    gameState.clicks = 0;
    gameState.cps = 0;
    gameState.totalClicks = 0;
    gameState.multiplier = 1 + gameState.rebirths * 0.5;
    gameState.upgrades.forEach(u => u.owned = 0);
    notify(`♻️ Rebirth realizado! Bônus permanente aumentado.`);
    renderUpgrades();
    updateDisplay();
    saveGame();
  } else {
    notify("⚠️ Você precisa de 1.000.000 de cliques para fazer Rebirth!");
  }
});

// === Configurações de Som ===
$("soundToggle").addEventListener("click", () => {
  gameState.soundEnabled = !gameState.soundEnabled;
  notify(`🔊 Som ${gameState.soundEnabled ? "ativado" : "desativado"}`);
  saveGame();
});

// === Ranking Firebase ===
function updateRanking() {
  const userRef = ref(db, "ranking/" + gameState.chatName);
  set(userRef, {
    name: gameState.chatName,
    totalClicks: gameState.totalClicks
  });
}

setInterval(updateRanking, 10000);

function renderRanking() {
  const rankList = $("rankingList");
  if (!rankList) return;

  const q = query(ref(db, "ranking"), orderByChild("totalClicks"), limitToLast(10));
  onValue(q, (snapshot) => {
    const data = [];
    snapshot.forEach(child => {
      data.push(child.val());
    });

    rankList.innerHTML = data.reverse().map((r, i) =>
      `<div class="rank-item">#${i + 1} ${r.name} - ${format(r.totalClicks)}</div>`
    ).join("");
  });
}

// === Chat Global ===
function setupChat() {
  $("sendChatBtn").addEventListener("click", sendChat);
  $("chatInput").addEventListener("keypress", e => {
    if (e.key === "Enter") sendChat();
  });

  const chatRef = ref(db, "chat");
  onValue(chatRef, snapshot => {
    const messages = [];
    snapshot.forEach(child => messages.push(child.val()));
    $("chatMessages").innerHTML = messages.slice(-10).map(m =>
      `<div class="chat-msg"><b>${m.name}:</b> ${m.text}</div>`
    ).join("");
  });
}

function sendChat() {
  const input = $("chatInput");
  const text = input.value.trim();
  if (!text) return;

  const chatRef = ref(db, "chat");
  push(chatRef, {
    name: gameState.chatName || "Jogador",
    text: text
  });

  input.value = "";
}

// === Conquistas ===
const achievementsData = [
  { id: 1, name: "Primeiro Clique", condition: () => gameState.totalClicks >= 1 },
  { id: 2, name: "100 Cliques!", condition: () => gameState.totalClicks >= 100 },
  { id: 3, name: "1.000 Cliques!", condition: () => gameState.totalClicks >= 1000 },
  { id: 4, name: "10.000 Cliques!", condition: () => gameState.totalClicks >= 10000 },
  { id: 5, name: "Comprou 1 Upgrade", condition: () => gameState.upgrades.some(u => u.owned >= 1) },
  { id: 6, name: "Possui 5 Upgrades", condition: () => gameState.upgrades.filter(u => u.owned >= 1).length >= 5 },
  { id: 7, name: "Possui 3 Pets", condition: () => gameState.pets.filter(p => p.owned).length >= 3 },
  { id: 8, name: "Fez Rebirth", condition: () => gameState.rebirths >= 1 },
  { id: 9, name: "Level 10", condition: () => gameState.level >= 10 },
  { id: 10, name: "Level 50", condition: () => gameState.level >= 50 }
];

function checkAchievements() {
  achievementsData.forEach(ach => {
    if (!gameState.achievements.includes(ach.id) && ach.condition()) {
      gameState.achievements.push(ach.id);
      notify(`🏆 Conquista desbloqueada: ${ach.name}`);
    }
  });
}

// === Missões Diárias ===
const missionPool = [
  { id: 1, goal: 100, type: "clicks", reward: 100, desc: "Clique 100 vezes" },
  { id: 2, goal: 5, type: "upgrades", reward: 500, desc: "Compre 5 upgrades" },
  { id: 3, goal: 1, type: "rebirth", reward: 1000, desc: "Faça 1 Rebirth" },
  { id: 4, goal: 10, type: "level", reward: 250, desc: "Alcance o nível 10" }
];

function updateMissions() {
  if (!gameState.missions.length)
    gameState.missions = missionPool.map(m => ({ ...m, progress: 0, completed: false }));

  gameState.missions.forEach(m => {
    if (m.completed) return;

    if (m.type === "clicks") {
      m.progress = Math.min(gameState.totalClicks, m.goal);
    } else if (m.type === "upgrades") {
      const total = gameState.upgrades.reduce((acc, u) => acc + u.owned, 0);
      m.progress = Math.min(total, m.goal);
    } else if (m.type === "rebirth") {
      m.progress = Math.min(gameState.rebirths, m.goal);
    } else if (m.type === "level") {
      m.progress = Math.min(gameState.level, m.goal);
    }

    if (m.progress >= m.goal) {
      gameState.clicks += m.reward;
      m.completed = true;
      notify(`🎯 Missão completa: ${m.desc} (+${m.reward} cliques)`);
    }
  });
}

// === Loja de Skins e Efeitos ===
const skinData = [
  { id: 1, name: "Skin Neon", price: 10000, class: "neon" },
  { id: 2, name: "Skin Lava", price: 20000, class: "lava" },
  { id: 3, name: "Skin RGB", price: 50000, class: "rgb" }
];

function renderSkins() {
  const container = $("skinsList");
  if (!container) return;
  container.innerHTML = "";

  skinData.forEach(s => {
    const owned = gameState.skins.includes(s.id);
    const selected = gameState.currentSkin === s.class;
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${s.name}</h3>
      <p>Preço: ${format(s.price)}</p>
      <button onclick="buySkin(${s.id})" ${owned ? "disabled" : ""}>${owned ? "Comprado" : "Comprar"}</button>
      ${owned ? `<button onclick="equipSkin('${s.class}')">${selected ? "Equipado" : "Equipar"}</button>` : ""}
    `;
    container.appendChild(div);
  });
}

window.buySkin = function (id) {
  const skin = skinData.find(s => s.id === id);
  if (!skin || gameState.skins.includes(id) || gameState.clicks < skin.price) return;
  gameState.clicks -= skin.price;
  gameState.skins.push(id);
  notify(`🎨 Nova skin: ${skin.name}`);
  saveGame();
  renderSkins();
};

window.equipSkin = function (skinClass) {
  document.body.className = skinClass;
  gameState.currentSkin = skinClass;
  notify(`🎨 Skin ativada: ${skinClass}`);
  saveGame();
};

// === Render Missões (opcional - se quiser criar aba visual depois) ===
function renderMissions() {
  const missionsDiv = document.getElementById("missionsList");
  if (!missionsDiv) return;

  missionsDiv.innerHTML = "";
  gameState.missions.forEach(m => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${m.desc}</h3>
      <p>Progresso: ${m.progress} / ${m.goal}</p>
      <p>Status: ${m.completed ? "✅ Concluída" : "⏳ Em andamento"}</p>
    `;
    missionsDiv.appendChild(div);
  });
}

// === Salvamento ===
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(gameState, saved);
  }

  // Corrige referências que podem faltar
  if (!gameState.upgrades) gameState.upgrades = upgradesData.map(u => ({ ...u, owned: 0 }));
  if (!gameState.pets) gameState.pets = petData.map(p => ({ ...p, owned: false }));
  if (!gameState.achievements) gameState.achievements = [];
  if (!gameState.missions) gameState.missions = missionPool.map(m => ({ ...m, progress: 0, completed: false }));
  if (!gameState.skins) gameState.skins = [];
  if (!gameState.chatName) gameState.chatName = "Jogador" + Math.floor(Math.random() * 1000);
}

// === Atualização Cíclica ===
setInterval(() => {
  checkAchievements();
  updateMissions();
  renderMissions();
  renderRanking();
}, 3000);

// === Export para debug (opcional) ===
window.getState = () => JSON.stringify(gameState, null, 2);

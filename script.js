// ======== PARTE 1 - INICIALIZAÇÃO E ESTADOS ========

// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Firebase Config (use a sua, confere na console Firebase)
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

// Utilidades rápidas
const $ = id => document.getElementById(id);

// Estado global do jogo
let gameState = {
  playerName: '',
  clicks: 0,
  cps: 0,
  totalClicks: 0,
  multiplier: 1,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,

  upgrades: [],
  pets: [],
  shopItems: [],
  achievements: [],
  missions: [],

  theme: 'dark',

  chatMessages: [],
};

// Dados base para upgrades
const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonusClick: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonusClick: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonusClick: 0, cps: 2, price: 300 },
  { id: 4, name: "🏢 Prédio de Click", bonusClick: 0, cps: 10, price: 1000 },
  { id: 5, name: "🧪 Laboratório de Click", bonusClick: 0, cps: 20, price: 2500 },
  { id: 6, name: "🏭 Fábrica de Click", bonusClick: 0, cps: 100, price: 5000 },
  { id: 7, name: "🌆 Cidade de Click", bonusClick: 0, cps: 500, price: 15000 },
  { id: 8, name: "🌍 País de Click", bonusClick: 0, cps: 10000, price: 50000 },
  { id: 9, name: "🚀 Estação Espacial", bonusClick: 0, cps: 50000, price: 200000 },
];

// Dados para pets (exemplo simples)
const petsData = [
  { id: 1, name: "🐶 Cãozinho", bonusClick: 1, price: 100 },
  { id: 2, name: "🐱 Gato", bonusClick: 3, price: 500 },
  { id: 3, name: "🦄 Unicórnio", bonusClick: 10, price: 2000 },
];

// Dados base para missões
const missionPool = [
  { id: 1, goal: 100, type: "clicks", reward: 100, desc: "Clique 100 vezes" },
  { id: 2, goal: 5, type: "upgrades", reward: 500, desc: "Compre 5 upgrades" },
  { id: 3, goal: 1, type: "rebirth", reward: 1000, desc: "Faça 1 Rebirth" },
  { id: 4, goal: 10, type: "level", reward: 250, desc: "Alcance o nível 10" }
];

// Dados para conquistas
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

// === Funções principais ===

// Inicializa upgrades e pets no estado do jogo
function initGameState() {
  if (gameState.upgrades.length === 0) {
    upgradesData.forEach(u => {
      gameState.upgrades.push({ ...u, owned: 0, price: u.price });
    });
  }
  if (gameState.pets.length === 0) {
    petsData.forEach(p => {
      gameState.pets.push({ ...p, owned: false });
    });
  }
  if (gameState.missions.length === 0) {
    gameState.missions = missionPool.map(m => ({ ...m, progress: 0, completed: false }));
  }
  if (!gameState.achievements) {
    gameState.achievements = [];
  }
}

// Atualiza display dos principais valores no topo
function updateDisplay() {
  $("clicks").textContent = formatNumber(gameState.clicks);
  $("cps").textContent = formatNumber(gameState.cps);
  $("level").textContent = gameState.level;
  $("xp").textContent = formatNumber(gameState.xp);
  $("xpToNext").textContent = formatNumber(gameState.xpToNext);
  $("rebirths").textContent = gameState.rebirths;
  $("playerName").textContent = gameState.playerName || "Jogador Anônimo";
  updateXpBar();
}

// Atualiza barra de XP com animação suave
function updateXpBar() {
  const percent = Math.min((gameState.xp / gameState.xpToNext) * 100, 100);
  $("xpBar").style.width = percent + "%";
}

// Formata números grandes (K, M, B...)
function formatNumber(num) {
  if (num < 1000) return num.toString();
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  let unitIndex = -1;
  let scaled = num;
  while (scaled >= 1000 && unitIndex < units.length - 1) {
    scaled /= 1000;
    unitIndex++;
  }
  return scaled.toFixed(2) + units[unitIndex];
}

// Notificações temporárias no topo direito
function notify(msg) {
  const container = $("notifications");
  const div = document.createElement("div");
  div.className = "notification";
  div.textContent = msg;
  container.appendChild(div);
  setTimeout(() => div.remove(), 4000);
}

// Salva estado no localStorage
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
  } catch {
    notify("Erro ao salvar o jogo.");
  }
}

// Carrega estado do localStorage
function loadGame() {
  try {
    const data = localStorage.getItem("clickerSave");
    if (data) {
      const saved = JSON.parse(data);
      Object.assign(gameState, saved);
      initGameState(); // garantir estrutura
      notify("Jogo carregado!");
    } else {
      initGameState();
      notify("Novo jogo iniciado!");
    }
  } catch {
    initGameState();
    notify("Erro ao carregar o jogo, iniciando novo.");
  }
}

// Eventos para troca de tema
function toggleTheme() {
  if (gameState.theme === "dark") {
    gameState.theme = "light";
  } else {
    gameState.theme = "dark";
  }
  applyTheme();
  saveGame();
}

function applyTheme() {
  document.body.setAttribute("data-theme", gameState.theme);
  $("themeToggleBtn").textContent = gameState.theme === "dark" ? "Tema Claro" : "Tema Escuro";
}

// Adicionar evento de clique no botão de troca de tema
$("themeToggleBtn").addEventListener("click", toggleTheme);

// Definir nome do jogador
function setPlayerName(name) {
  if (name.trim().length < 2) {
    notify("Nome deve ter pelo menos 2 caracteres!");
    return false;
  }
  gameState.playerName = name.trim();
  updateDisplay();
  saveGame();
  notify(`Bem-vindo, ${gameState.playerName}!`);
  return true;
}

$("setNameBtn").addEventListener("click", () => {
  const input = $("playerNameInput");
  if (setPlayerName(input.value)) {
    input.value = "";
  }
});

// Função para iniciar o jogo
function init() {
  loadGame();
  applyTheme();
  updateDisplay();
  renderUpgrades();
  renderPets();
  renderMissions();
  renderAchievements();
  renderRanking();
  renderChatMessages();

  startIntervals();
  setupChat();
  setupRanking();

  // Config tabs
  setupTabs();

  // Config click no clickArea
  $("clickArea").addEventListener("click", gainClick);
}

// === Lógica do clique ===
function gainClick() {
  gameState.clicks += gameState.multiplier;
  gameState.totalClicks += gameState.multiplier;
  gameState.xp += 1;

  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp = 0;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
    notify(`Subiu para o nível ${gameState.level}!`);
  }
  updateCps();
  updateDisplay();
  saveGame();
}

// Atualiza CPS somando os upgrades e pets
function updateCps() {
  let totalCps = 0;
  gameState.upgrades.forEach(u => totalCps += u.cps * u.owned);
  gameState.pets.forEach(p => {
    if (p.owned) totalCps += p.bonusClick;
  });
  gameState.cps = totalCps;
}

// Inicia os intervalos do jogo (CPS, salvar, missões, conquistas)
function startIntervals() {
  setInterval(() => {
    gameState.clicks += gameState.cps;
    gameState.totalClicks += gameState.cps;
    gameState.xp += gameState.cps;

    if (gameState.xp >= gameState.xpToNext) {
      gameState.level++;
      gameState.xp = 0;
      gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
      notify(`Subiu para o nível ${gameState.level}!`);
    }

    updateDisplay();
    checkAchievements();
    updateMissions();
    saveGame();
  }, 1000);
}

// Configura abas do menu
function setupTabs() {
  const buttons = document.querySelectorAll("#mainNav .tab-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const tabName = btn.dataset.tab;
      document.querySelectorAll(".tab-content").forEach(tab => {
        tab.style.display = tab.id === tabName ? "block" : "none";
      });
    });
  });
  // Ativa primeira aba
  buttons[0].click();
}

// Renderização dos upgrades
function renderUpgrades() {
  const container = $("upgradesList");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <h3>${upg.name}</h3>
      <p>Preço: ${formatNumber(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      <button ${gameState.clicks < upg.price ? "disabled" : ""} onclick="buyUpgrade(${upg.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

// Compra de upgrades
window.buyUpgrade = function(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return;
  if (gameState.clicks < upg.price) {
    notify("Clique insuficiente para comprar!");
    return;
  }
  gameState.clicks -= upg.price;
  upg.owned++;
  gameState.multiplier += upg.bonusClick;
  upg.price = Math.floor(upg.price * 1.35);
  updateCps();
  renderUpgrades();
  updateDisplay();
  saveGame();
  notify(`Upgrade comprado: ${upg.name}`);
}

// Renderização dos pets
function renderPets() {
  const container = $("petsList");
  container.innerHTML = "";
  gameState.pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "pet";
    div.innerHTML = `
      <h3>${pet.name}</h3>
      <p>Preço: ${formatNumber(pet.price)}</p>
      <p>Possui: ${pet.owned ? "Sim" : "Não"}</p>
      <button ${pet.owned ? "disabled" : ""} onclick="buyPet(${pet.id})">${pet.owned ? "Comprado" : "Comprar"}</button>
    `;
    container.appendChild(div);
  });
}

// Compra de pets
window.buyPet = function(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet) return;
  if (pet.owned) {
    notify("Você já possui esse pet!");
    return;
  }
  if (gameState.clicks < pet.price) {
    notify("Clique insuficiente para comprar o pet!");
    return;
  }
  gameState.clicks -= pet.price;
  pet.owned = true;
  gameState.multiplier += pet.bonusClick;
  updateCps();
  renderPets();
  updateDisplay();
  saveGame();
  notify(`Pet comprado: ${pet.name}`);
}

// Verificação de conquistas desbloqueadas
function checkAchievements() {
  achievementsData.forEach(ach => {
    if (!gameState.achievements.includes(ach.id) && ach.condition()) {
      gameState.achievements.push(ach.id);
      notify(`🏆 Conquista desbloqueada: ${ach.name}`);
      renderAchievements();
    }
  });
}

// Renderização das conquistas
function renderAchievements() {
  const container = $("achievementsList");
  container.innerHTML = "";
  gameState.achievements.forEach(id => {
    const ach = achievementsData.find(a => a.id === id);
    if (!ach) return;
    const div = document.createElement("div");
    div.className = "item";
   





O ChatGPT disse:
div.textContent = 🏆 ${ach.name};
container.appendChild(div);
});
}

// ======== PARTE 2 - MISSÕES, RANKING, REBIRTH, CHAT, ETC ========

// === Missões Diárias ===
function updateMissions() {
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

function renderMissions() {
  const missionsDiv = $("missionsList");
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

// === Rebirth System ===
function canRebirth() {
  return gameState.level >= 50;
}

function doRebirth() {
  if (!canRebirth()) {
    notify("Você precisa alcançar o nível 50 para fazer Rebirth!");
    return;
  }

  gameState.rebirths++;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.multiplier = 1;
  gameState.cps = 0;
  gameState.upgrades.forEach(u => {
    u.owned = 0;
    u.price = upgradesData.find(upg => upg.id === u.id).price;
  });

  gameState.multiplier += gameState.rebirths * 2;

  notify(`🔥 Rebirth realizado! Multiplicador aumentado.`);
  renderUpgrades();
  updateDisplay();
  saveGame();
}

$("rebirthBtn").addEventListener("click", doRebirth);

// === Ranking Firebase ===
function setupRanking() {
  const rankRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(20));
  onValue(rankRef, snapshot => {
    const data = snapshot.val();
    const rankList = $("rankingList");
    rankList.innerHTML = "";

    if (data) {
      const entries = Object.entries(data)
        .map(([key, value]) => value)
        .sort((a, b) => b.clicks - a.clicks);

      entries.forEach((entry, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${entry.name} - ${formatNumber(entry.clicks)} cliques`;
        rankList.appendChild(li);
      });
    }
  });
}

function renderRanking() {
  // Chamada mantida na parte 1 para compatibilidade
  setupRanking();
}

function sendToRanking() {
  if (!gameState.playerName || gameState.playerName.length < 2) return;

  const userRef = push(ref(db, "ranking"));
  set(userRef, {
    name: gameState.playerName,
    clicks: gameState.totalClicks,
    level: gameState.level,
    time: Date.now()
  });
}

// === Chat Global ===
function setupChat() {
  const chatRef = ref(db, "chat");
  onValue(chatRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;
    const entries = Object.entries(data).slice(-30);
    const chatBox = $("chatBox");
    chatBox.innerHTML = "";
    entries.forEach(([id, msg]) => {
      const div = document.createElement("div");
      div.className = "chat-msg";
      div.textContent = `${msg.name}: ${msg.text}`;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

$("sendMsgBtn").addEventListener("click", () => {
  const input = $("chatInput");
  const text = input.value.trim();
  if (text.length === 0 || !gameState.playerName) return;

  const msgRef = push(ref(db, "chat"));
  set(msgRef, {
    name: gameState.playerName,
    text: text,
    time: Date.now()
  });
  input.value = "";
});

// === Efeitos Visuais Extras ===
function clickParticles() {
  const particle = document.createElement("div");
  particle.className = "click-particle";
  particle.textContent = "+1";
  particle.style.left = `${Math.random() * 80 + 10}%`;
  particle.style.top = "50%";
  document.body.appendChild(particle);
  setTimeout(() => particle.remove(), 1000);
}

$("clickArea").addEventListener("click", clickParticles);

// === Skins ou Temas visuais (exemplo simples) ===
function applySpecialTheme(theme) {
  if (theme === "rgb") {
    document.body.classList.add("rgb-theme");
  } else {
    document.body.classList.remove("rgb-theme");
  }
}

// Exemplo botão para alternar RGB
$("rgbBtn").addEventListener("click", () => {
  if (document.body.classList.contains("rgb-theme")) {
    applySpecialTheme("default");
  } else {
    applySpecialTheme("rgb");
  }
});

// === Enviar ranking automático a cada 15s
setInterval(() => {
  if (gameState.playerName) sendToRanking();
}, 15000);

// === Salvar backup local manualmente
$("saveBtn").addEventListener("click", () => {
  saveGame();
  notify("Jogo salvo manualmente!");
});

// === Reset do jogo (opcional)
$("resetBtn").addEventListener("click", () => {
  if (confirm("Tem certeza que deseja resetar todo o progresso?")) {
    localStorage.removeItem("clickerSave");
    location.reload();
  }
});

// ========== PARTE 3 – FINALIZAÇÃO DOS DEUSES ==========

// === Sistema de Sons ===
const sounds = {
  click: new Audio("sounds/click.mp3"),
  upgrade: new Audio("sounds/upgrade.mp3"),
  achievement: new Audio("sounds/achievement.mp3"),
  mission: new Audio("sounds/mission.mp3"),
  rebirth: new Audio("sounds/rebirth.mp3"),
  notify: new Audio("sounds/notify.mp3")
};

function playSound(name) {
  if (gameState.soundOn && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

// === Sistema de Notificações ===
function notify(msg) {
  const div = document.createElement("div");
  div.className = "notify";
  div.textContent = msg;
  $("notifications").appendChild(div);
  setTimeout(() => div.remove(), 4000);
  playSound("notify");
}

// === Tutorial Inicial ===
function showTutorial() {
  if (localStorage.getItem("sawTutorial")) return;

  const steps = [
    "👋 Bem-vindo ao Clicker Simulator!",
    "🖱️ Clique no botão para ganhar cliques.",
    "⚙️ Compre upgrades para aumentar seu poder.",
    "🔥 Faça Rebirth para multiplicar tudo!",
    "📊 Suba no ranking global!",
    "💬 Converse no chat global!",
    "🎮 E divirta-se ao máximo!"
  ];

  let index = 0;
  const div = document.createElement("div");
  div.className = "tutorial";
  const p = document.createElement("p");
  const btn = document.createElement("button");

  btn.textContent = "Próximo";
  div.appendChild(p);
  div.appendChild(btn);
  document.body.appendChild(div);

  function nextStep() {
    if (index >= steps.length) {
      div.remove();
      localStorage.setItem("sawTutorial", "true");
    } else {
      p.textContent = steps[index++];
    }
  }

  btn.addEventListener("click", nextStep);
  nextStep();
}

// === Preferências de Tema e Som ===
function loadSettings() {
  const saved = localStorage.getItem("clickerSettings");
  if (saved) {
    const conf = JSON.parse(saved);
    gameState.soundOn = conf.soundOn;
    gameState.theme = conf.theme || "default";
    applySpecialTheme(gameState.theme);
  } else {
    gameState.soundOn = true;
    gameState.theme = "default";
  }
}

function saveSettings() {
  localStorage.setItem("clickerSettings", JSON.stringify({
    soundOn: gameState.soundOn,
    theme: gameState.theme
  }));
}

$("soundToggle").addEventListener("click", () => {
  gameState.soundOn = !gameState.soundOn;
  notify("Som " + (gameState.soundOn ? "ativado" : "desativado"));
  saveSettings();
});

$("themeToggle").addEventListener("click", () => {
  if (gameState.theme === "default") {
    gameState.theme = "rgb";
    applySpecialTheme("rgb");
  } else {
    gameState.theme = "default";
    applySpecialTheme("default");
  }
  saveSettings();
});

// === Otimização de números grandes (K, M, B...) ===
function formatNumber(n) {
  if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toFixed(0);
}

// === Inicialização completa ===
function fullInit() {
  loadSettings();
  showTutorial();
  setupChat();
  setupRanking();
  init();
}

document.addEventListener("DOMContentLoaded", fullInit);

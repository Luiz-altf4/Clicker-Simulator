// === Parte 1 - Inicialização, utilitários, clicks, upgrades e pets ===

// Import Firebase (versão modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Configuração Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
  measurementId: "G-ZXXWCDTY9D",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com/"
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Estado do jogo ===
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNext = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;
let activePetId = null;

// Dados dinâmicos (serão preenchidos em objetos)
let upgrades = [
  { id: 1, name: "Mouse Turbinado", cps: 1, price: 10, quantity: 0 },
  { id: 2, name: "Clicker Automático", cps: 5, price: 50, quantity: 0 },
  { id: 3, name: "Robô Auxiliar", cps: 15, price: 200, quantity: 0 },
  { id: 4, name: "Intel i9", cps: 50, price: 1000, quantity: 0 },
  { id: 5, name: "Servidor Gamer", cps: 100, price: 5000, quantity: 0 }
];
let shopItems = [
  { id: 1, name: "x2 Booster", multiplier: 2, price: 1000, owned: false },
  { id: 2, name: "x5 Booster", multiplier: 5, price: 2500, owned: false }
];
let pets = [
  { id: 1, name: "Gato Astral", bonusPercent: 5, price: 500, owned: false },
  { id: 2, name: "Cachorro Turbo", bonusPercent: 10, price: 1500, owned: false },
  { id: 3, name: "Dragão de Pixel", bonusPercent: 25, price: 5000, owned: false }
];
let achievements = [];
let missions = [];

// === DOM Helper ===
const el = (id) => document.getElementById(id);

// === Função de formatação números grandes ===
function formatNumber(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

// === Pega nome do mundo pelo índice ===
function getWorldName() {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão"];
  return worlds[currentWorld - 1] || "???";
}

// === Atualiza exibição de stats ===
function updateDisplay() {
  el("clicksDisplay").textContent = formatNumber(clicks);
  el("cpsDisplay").textContent = formatNumber(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = formatNumber(xp);
  el("xpToNextLevel").textContent = formatNumber(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;
}

// === Calcula CPS baseado nos upgrades e pets ===
function calcCPS() {
  let base = 0;
  upgrades.forEach(u => {
    base += u.cps * u.quantity;
  });
  let multiplier = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) multiplier += pet.bonusPercent / 100;
  }
  if (shopItems.find(i => i.name.includes("x5") && i.owned)) multiplier *= 5;
  else if (shopItems.find(i => i.name.includes("x2") && i.owned)) multiplier *= 2;
  return base * multiplier;
}

// === Função para adicionar XP e lidar com level up ===
function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.3);
    showNotification(`Você subiu para o nível ${level}! 🎉`);
  }
}

// === Função para mostrar notificações simples ===
function showNotification(message, duration = 3000) {
  const notification = el("notification");
  notification.textContent = message;
  notification.style.display = "block";
  setTimeout(() => {
    notification.style.display = "none";
  }, duration);
}

// === Evento click no botão principal ===
el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  clicks += gain;
  gainXP(5);
  updateDisplay();
  updateShopAndUpgrades();
};

// === Intervalo para adicionar clicks automaticamente pelo CPS ===
setInterval(() => {
  const gain = calcCPS();
  clicks += gain;
  gainXP(gain);
  updateDisplay();
}, 1000);

// === Função para comprar upgrades ===
function buyUpgrade(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return;
  if (clicks >= upgrade.price) {
    clicks -= upgrade.price;
    upgrade.quantity++;
    upgrade.price = Math.floor(upgrade.price * 1.15);
    showNotification(`Você comprou 1 ${upgrade.name}!`);
    updateDisplay();
    updateShopAndUpgrades();
  } else {
    showNotification("Você não tem clicks suficientes!");
  }
}

// === Função para comprar itens da loja ===
function buyShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;
  if (item.owned) {
    showNotification("Você já possui esse item!");
    return;
  }
  if (clicks >= item.price) {
    clicks -= item.price;
    item.owned = true;
    showNotification(`Você comprou o ${item.name}!`);
    updateDisplay();
    updateShopAndUpgrades();
  } else {
    showNotification("Clicks insuficientes para comprar!");
  }
}

// === Função para comprar e ativar pets ===
function buyPet(id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return;
  if (pet.owned) {
    showNotification("Você já possui esse pet!");
    activePetId = pet.id;
    showNotification(`${pet.name} está agora ativo!`);
    updateDisplay();
    return;
  }
  if (clicks >= pet.price) {
    clicks -= pet.price;
    pet.owned = true;
    activePetId = pet.id;
    showNotification(`Você comprou e ativou o pet ${pet.name}!`);
    updateDisplay();
    updateShopAndUpgrades();
  } else {
    showNotification("Clicks insuficientes para comprar o pet!");
  }
}

// === Função para atualizar DOM dos upgrades, loja e pets ===
function updateShopAndUpgrades() {
  // Upgrades
  const upgradesDiv = el("upgrades").querySelector(".list-container");
  upgradesDiv.innerHTML = "";
  upgrades.forEach(u => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <span>${u.name} (x${u.quantity}) - CPS: ${u.cps} - Preço: ${formatNumber(u.price)}</span>
      <button aria-label="Comprar ${u.name}">Comprar</button>
    `;
    const btn = div.querySelector("button");
    btn.onclick = () => buyUpgrade(u.id);
    upgradesDiv.appendChild(div);
  });

  // Loja
  const shopDiv = el("shop").querySelector(".list-container");
  shopDiv.innerHTML = "";
  shopItems.forEach(i => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <span>${i.name} - Multiplicador: x${i.multiplier} - Preço: ${formatNumber(i.price)} - ${i.owned ? "Comprado" : "Disponível"}</span>
      <button ${i.owned ? "disabled" : ""} aria-label="Comprar ${i.name}">${i.owned ? "Comprado" : "Comprar"}</button>
    `;
    const btn = div.querySelector("button");
    btn.onclick = () => buyShopItem(i.id);
    shopDiv.appendChild(div);
  });

  // Pets
  const petsDiv = el("pets").querySelector(".list-container");
  petsDiv.innerHTML = "";
  pets.forEach(p => {
    const div = document.createElement("div");
    div.className = "list-item";
    div.innerHTML = `
      <span>${p.name} - Bônus: +${p.bonusPercent}% - Preço: ${formatNumber(p.price)} - ${p.owned ? (activePetId === p.id ? "Ativo" : "Comprado") : "Disponível"}</span>
      <button ${p.owned && activePetId === p.id ? "disabled" : ""} aria-label="Comprar ou ativar pet ${p.name}">${p.owned ? (activePetId === p.id ? "Ativo" : "Ativar") : "Comprar"}</button>
    `;
    const btn = div.querySelector("button");
    btn.onclick = () => buyPet(p.id);
    petsDiv.appendChild(div);
  });
}

// Inicializa DOM quando carregar a página
window.addEventListener("load", () => {
  loadSave();
  updateDisplay();
  updateShopAndUpgrades();
  loadRanking();
});

// === Parte 2 - Missões, conquistas, rebirth, salvar/carregar, tema ===

// === Missões (exemplo simples) ===
missions = [
  {
    id: 1,
    description: "Clique 100 vezes",
    completed: false,
    checkCondition: () => clicks >= 100,
    rewardClicks: 500
  },
  {
    id: 2,
    description: "Alcance nível 5",
    completed: false,
    checkCondition: () => level >= 5,
    rewardClicks: 1000
  },
  {
    id: 3,
    description: "Faça 10 rebirths",
    completed: false,
    checkCondition: () => rebirths >= 10,
    rewardClicks: 5000
  }
];

// === Conquistas (exemplo simples) ===
achievements = [
  {
    id: 1,
    name: "Iniciante",
    description: "Alcance o nível 3",
    unlocked: false,
    checkCondition: () => level >= 3
  },
  {
    id: 2,
    name: "Veterano",
    description: "Clique 10.000 vezes",
    unlocked: false,
    checkCondition: () => clicks >= 10000
  },
  {
    id: 3,
    name: "Reborn Master",
    description: "Faça 25 rebirths",
    unlocked: false,
    checkCondition: () => rebirths >= 25
  }
];

// === Atualiza missões na DOM ===
function updateMissions() {
  const missionsDiv = el("missions").querySelector(".list-container");
  missionsDiv.innerHTML = "";
  missions.forEach(m => {
    const div = document.createElement("div");
    div.className = "list-item";
    const status = m.completed ? "✅ Completo" : "❌ Pendente";
    div.textContent = `${m.description} - ${status}`;
    if (!m.completed && m.checkCondition()) {
      m.completed = true;
      clicks += m.rewardClicks || 0;
      showNotification(`Missão completa! Você ganhou ${formatNumber(m.rewardClicks)} clicks!`);
      updateDisplay();
    }
    missionsDiv.appendChild(div);
  });
}

// === Atualiza conquistas na DOM ===
function updateAchievements() {
  const achievementsDiv = el("achievements").querySelector(".list-container");
  achievementsDiv.innerHTML = "";
  achievements.forEach(a => {
    const div = document.createElement("div");
    div.className = "list-item";
    const status = a.unlocked ? "🏆 Desbloqueado" : "🔒 Bloqueado";
    div.textContent = `${a.name}: ${a.description} - ${status}`;
    if (!a.unlocked && a.checkCondition()) {
      a.unlocked = true;
      showNotification(`Conquista desbloqueada: ${a.name}!`);
    }
    achievementsDiv.appendChild(div);
  });
}

// === Sistema de Rebirth ===
function canRebirth() {
  return level >= 10 && clicks >= 10000; // Exemplo simples
}

function doRebirth() {
  if (!canRebirth()) {
    showNotification("Você não pode rebirthar ainda!");
    return;
  }
  rebirths++;
  clicks = 0;
  level = 1;
  xp = 0;
  xpToNext = 100;
  upgrades.forEach(u => u.quantity = 0);
  shopItems.forEach(i => i.owned = false);
  pets.forEach(p => { p.owned = false; });
  activePetId = null;
  showNotification(`Você fez um rebirth! Total: ${rebirths}`);
  updateDisplay();
  updateShopAndUpgrades();
  updateMissions();
  updateAchievements();
}

// === Salvar e carregar dados ===
function saveGame() {
  const saveData = {
    clicks,
    level,
    xp,
    xpToNext,
    rebirths,
    currentWorld,
    upgrades,
    shopItems,
    pets,
    activePetId
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
  showNotification("Jogo salvo!");
}

function loadSave() {
  const saveStr = localStorage.getItem("clickerSave");
  if (!saveStr) return;
  try {
    const data = JSON.parse(saveStr);
    clicks = data.clicks || 0;
    level = data.level || 1;
    xp = data.xp || 0;
    xpToNext = data.xpToNext || 100;
    rebirths = data.rebirths || 0;
    currentWorld = data.currentWorld || 1;
    upgrades = data.upgrades || upgrades;
    shopItems = data.shopItems || shopItems;
    pets = data.pets || pets;
    activePetId = data.activePetId || null;
  } catch (e) {
    console.error("Erro ao carregar save:", e);
  }
}

// === Auto salvar a cada 15 segundos ===
setInterval(saveGame, 15000);

// === Tema claro/escuro toggle ===
el("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  el("toggleTheme").textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
};

// Atualiza missões e conquistas periodicamente
setInterval(() => {
  updateMissions();
  updateAchievements();
}, 2000);

// === Parte 3 - Ranking Firebase, chat, notificações e integração final ===

// === Salvar score no Firebase ===
el("saveScoreBtn").onclick = () => {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) {
    alert("Nome inválido! Use pelo menos 3 caracteres.");
    return;
  }
  const userRef = push(ref(db, "ranking"));
  set(userRef, {
    name,
    score: Math.floor(clicks),
    timestamp: Date.now()
  });
  el("playerNameInput").value = "";
  showNotification("Pontuação salva no ranking!");
};

// === Carregar ranking do Firebase e atualizar DOM ===
function loadRanking() {
  const list = el("rankingList");
  onValue(ref(db, "ranking"), (snapshot) => {
    const data = [];
    snapshot.forEach(child => data.push(child.val()));
    // Ordenar do maior para menor
    const sorted = data.sort((a, b) => b.score - a.score).slice(0, 10);
    list.innerHTML = sorted.map((e, i) => `<div>#${i + 1} ${e.name}: ${formatNumber(e.score)}</div>`).join("");
  });
}

// === Sistema de chat simples via Firebase (can ser expandido) ===
const chatRef = ref(db, "chatMessages");
const chatMessagesDiv = el("chatMessages");
const chatForm = el("chatForm");
const chatInput = el("chatInput");

chatForm.addEventListener("submit", e => {
  e.preventDefault();
  const message = chatInput.value.trim();
  if (!message) return;
  const userName = el("playerNameInput").value.trim() || "Anônimo";
  const newMessageRef = push(chatRef);
  set(newMessageRef, {
    name: userName,
    message,
    timestamp: Date.now()
  });
  chatInput.value = "";
});

onValue(chatRef, snapshot => {
  const messages = [];
  snapshot.forEach(child => messages.push(child.val()));
  // Ordenar mensagens pelo timestamp
  messages.sort((a, b) => a.timestamp - b.timestamp);
  chatMessagesDiv.innerHTML = messages
    .map(m => `<div><strong>${m.name}:</strong> ${m.message}</div>`)
    .join("");
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
});

// === Modal reset progresso (básico) ===
const modalBg = el("modalBg");
const confirmResetBtn = el("confirmResetBtn");
const cancelResetBtn = el("cancelResetBtn");
const modalCloseBtn = el("modalCloseBtn");

function openModal() {
  modalBg.style.display = "flex";
}
function closeModal() {
  modalBg.style.display = "none";
}

el("resetProgressBtn")?.addEventListener("click", openModal);
confirmResetBtn?.addEventListener("click", () => {
  clicks = 0;
  level = 1;
  xp = 0;
  xpToNext = 100;
  rebirths = 0;
  upgrades.forEach(u => u.quantity = 0);
  shopItems.forEach(i => i.owned = false);
  pets.forEach(p => p.owned = false);
  activePetId = null;
  updateDisplay();
  updateShopAndUpgrades();
  updateMissions();
  updateAchievements();
  saveGame();
  closeModal();
  showNotification("Progresso resetado!");
});
cancelResetBtn?.addEventListener("click", closeModal);
modalCloseBtn?.addEventListener("click", closeModal);

// Fechar modal com ESC
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// === Sons e efeitos simples ===
function playSound(name) {
  // Exemplo simples - pode expandir
  const sounds = {
    click: new Audio("sounds/click.wav"),
    buy: new Audio("sounds/buy.wav"),
    levelup: new Audio("sounds/levelup.wav")
  };
  if (sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play();
  }
}

// === Botão salvar manual ===
el("saveGameBtn")?.addEventListener("click", saveGame);

// Atualização contínua das stats
setInterval(() => {
  updateDisplay();
  updateShopAndUpgrades();
  updateMissions();
  updateAchievements();
}, 1000);

// === Inicialização final ===
window.addEventListener("load", () => {
  updateDisplay();
  updateShopAndUpgrades();
  updateMissions();
  updateAchievements();
  loadRanking();
});


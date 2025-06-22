// script.js
// Importa Firebase (módulo)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Config Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ==========
// Estado do jogo
// ==========
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;
let activePetId = null;

// ========
// DOM Elements
// ========
const clicksDisplay = document.getElementById("clicksDisplay");
const cpsDisplay = document.getElementById("cpsDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const xpDisplay = document.getElementById("xpDisplay");
const xpToNextLevelDisplay = document.getElementById("xpToNextLevel");
const rebirthCountDisplay = document.getElementById("rebirthCount");
const currentWorldDisplay = document.getElementById("currentWorld");

const clickBtn = document.getElementById("clickBtn");
const upgradesList = document.getElementById("upgradesList");
const shopItemsList = document.getElementById("shopItemsList");
const petsList = document.getElementById("petsList");
const activePetDisplay = document.getElementById("activePet");
const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthInfo = document.getElementById("rebirthInfo");
const worldsList = document.getElementById("worldsList");
const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");

const missionsList = document.getElementById("missionsList");
const achievementsList = document.getElementById("achievementsList");

const rankingList = document.getElementById("rankingList");
const playerNameInput = document.getElementById("playerNameInput");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const rankMessage = document.getElementById("rankMessage");

// ==========
// Dados upgrades
// ==========
const upgrades = [
  { id: 1, name: "Cursor", basePrice: 15, price: 15, quantity: 0, cps: 0.1 },
  { id: 2, name: "Grandes Mãos", basePrice: 100, price: 100, quantity: 0, cps: 1 },
  { id: 3, name: "Robô Auxiliar", basePrice: 1100, price: 1100, quantity: 0, cps: 8 },
  { id: 4, name: "Fábrica", basePrice: 12000, price: 12000, quantity: 0, cps: 47 },
  { id: 5, name: "Laboratório", basePrice: 130000, price: 130000, quantity: 0, cps: 260 },
];

// Dados loja
const shopItems = [
  { id: 1, name: "Multiplicador x2", price: 1000000, description: "Dobra seus clicks e CPS", owned: false },
  { id: 2, name: "Multiplicador x5", price: 5000000, description: "Multiplica seus clicks e CPS por 5", owned: false },
];

// Dados pets
const pets = [
  { id: 1, name: "Robozinho", bonusPercent: 5, price: 5000, owned: false, emoji: "🤖" },
  { id: 2, name: "Gatinho", bonusPercent: 12, price: 15000, owned: false, emoji: "🐱" },
  { id: 3, name: "Dragão", bonusPercent: 30, price: 50000, owned: false, emoji: "🐉" },
];

// Dados mundos
const worlds = [
  { id: 1, name: "Jardim Inicial", unlockReq: 0 },
  { id: 2, name: "Cidade Neon", unlockReq: 100000 },
  { id: 3, name: "Espaço Sideral", unlockReq: 10000000 },
  { id: 4, name: "Dimensão Paralela", unlockReq: 1000000000 },
];

// Dados missões
const missions = [
  { id: 1, description: "Clique 100 vezes", target: 100, progress: 0, reward: 100 },
  { id: 2, description: "Compre 10 Upgrades Cursor", target: 10, progress: 0, reward: 500 },
  { id: 3, description: "Faça 1 Rebirth", target: 1, progress: 0, reward: 1000 },
];

// Dados conquistas
const achievements = [
  { id: 1, title: "Primeiros 100 clicks", description: "Alcance 100 clicks totais", achieved: false, condition: () => clicks >= 100 },
  { id: 2, title: "Suba para nível 5", description: "Chegue ao nível 5", achieved: false, condition: () => level >= 5 },
  { id: 3, title: "Compre 50 upgrades", description: "Compre um total de 50 upgrades", achieved: false, condition: () => upgrades.reduce((a,b) => a + b.quantity, 0) >= 50 },
];

// =======================
// Formatação números
// =======================
function formatNumber(num) {
  if (num < 1000) return num.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let unitIndex = -1;
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  return num.toFixed(2) + units[unitIndex];
}

// ==========
// Atualizar tela
// ==========
function updateDisplay() {
  clicksDisplay.textContent = formatNumber(clicks);
  cpsDisplay.textContent = formatNumber(cps);
  levelDisplay.textContent = level;
  xpDisplay.textContent = formatNumber(xp);
  xpToNextLevelDisplay.textContent = formatNumber(xpToNextLevel);
  rebirthCountDisplay.textContent = rebirths;
  currentWorldDisplay.textContent = `${currentWorld} - ${worlds.find(w => w.id === currentWorld)?.name || "Desconhecido"}`;
  activePetDisplay.textContent = `Pet ativo: ${activePetId ? pets.find(p => p.id === activePetId).name : "Nenhum"}`;
}

// ==========
// Calcula CPS total
// ==========
function calculateCPS() {
  let totalCPS = 0;
  for (const upgrade of upgrades) {
    totalCPS += upgrade.cps * upgrade.quantity;
  }
  // Bonus pets
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    totalCPS *= 1 + pet.bonusPercent / 100;
  }
  // Bonus shop
  for (const item of shopItems) {
    if (item.owned) {
      if (item.name === "Multiplicador x2") totalCPS *= 2;
      else if (item.name === "Multiplicador x5") totalCPS *= 5;
    }
  }
  cps = totalCPS;
}

// ==========
// Render upgrades
// ==========
function renderUpgrades() {
  upgradesList.innerHTML = "";
  for (const upgrade of upgrades) {
    const div = document.createElement("div");
    div.classList.add("upgrade-row");
    div.innerHTML = `
      <div>${upgrade.name} (x${upgrade.quantity})</div>
      <div>Preço: ${formatNumber(upgrade.price)}</div>
      <button class="btn upgrade-buy-btn" data-id="${upgrade.id}">Comprar</button>
    `;
    upgradesList.appendChild(div);
  }
}

// ==========
// Render shop items
// ==========
function renderShop() {
  shopItemsList.innerHTML = "";
  for (const item of shopItems) {
    const div = document.createElement("div");
    div.classList.add("shop-item");
    div.innerHTML = `
      <h3>${item.name}</h3>
      <div>${item.description}</div>
      <div>Preço: ${formatNumber(item.price)}</div>
      <button class="btn shop-buy-btn" data-id="${item.id}" ${item.owned ? "disabled" : ""}>${item.owned ? "Comprado" : "Comprar"}</button>
    `;
    shopItemsList.appendChild(div);
  }
}

// ==========
// Render pets
// ==========
function renderPets() {
  petsList.innerHTML = "";
  for (const pet of pets) {
    const div = document.createElement("div");
    div.classList.add("pet-card");
    if (!pet.owned) div.classList.add("disabled");
    if (pet.id === activePetId) div.classList.add("active");
    div.innerHTML = `
      <div class="pet-emoji">${pet.emoji}</div>
      <div class="pet-name">${pet.name}</div>
      <div class="pet-bonus">Bônus: +${pet.bonusPercent}% CPS</div>
      <div class="pet-price">Preço: ${formatNumber(pet.price)}</div>
    `;
    petsList.appendChild(div);

    div.addEventListener("click", () => {
      if (!pet.owned) {
        if (clicks >= pet.price) {
          clicks -= pet.price;
          pet.owned = true;
          activePetId = pet.id;
          updateGame();
        } else {
          alert("Você não tem clicks suficientes para comprar este pet.");
        }
      } else {
        activePetId = pet.id;
        updateGame();
      }
    });
  }
}

// ==========
// Render worlds
// ==========
function renderWorlds() {
  worldsList.innerHTML = "";
  for (const world of worlds) {
    const div = document.createElement("div");
    div.classList.add("world-card");
    if (clicks < world.unlockReq) div.classList.add("disabled");
    if (world.id === currentWorld) div.classList.add("active");
    div.textContent = `${world.id} - ${world.name}`;
    div.addEventListener("click", () => {
      if (clicks >= world.unlockReq) {
        currentWorld = world.id;
        updateGame();
      }
    });
    worldsList.appendChild(div);
  }
}

// ==========
// Render missions
// ==========
function renderMissions() {
  missionsList.innerHTML = "";
  for (const mission of missions) {
    const div = document.createElement("div");
    div.classList.add("mission-card");
    const progressPercent = Math.min(100, (mission.progress / mission.target) * 100);
    div.innerHTML = `
      <div class="mission-desc">${mission.description}</div>
      <div>Progresso: ${mission.progress} / ${mission.target}</div>
      <div style="width: 100%; background: #555; border-radius: 5px; margin-top: 5px;">
        <div style="width: ${progressPercent}%; background: #0a84ff; height: 10px; border-radius: 5px;"></div>
      </div>
    `;
    missionsList.appendChild(div);
  }
}

// ==========
// Render achievements
// ==========
function renderAchievements() {
  achievementsList.innerHTML = "";
  for (const achievement of achievements) {
    const div = document.createElement("div");
    div.classList.add("achievement-card");
    div.innerHTML = `
      <div><strong>${achievement.title}</strong></div>
      <div class="achievement-desc">${achievement.description}</div>
      <div>Status: ${achievement.achieved ? "Conquistado" : "Pendente"}</div>
    `;
    achievementsList.appendChild(div);
  }
}

// ==========
// Atualizar missões e conquistas
// ==========
function updateMissionsAndAchievements() {
  // Atualiza progresso missões
  missions.forEach(mission => {
    if (mission.id === 1) mission.progress = Math.min(mission.target, clicks);
    else if (mission.id === 2) {
      const cursorUpgrade = upgrades.find(u => u.name === "Cursor");
      mission.progress = cursorUpgrade ? cursorUpgrade.quantity : 0;
    }
    else if (mission.id === 3) mission.progress = rebirths;
  });

  // Verifica conquistas
  achievements.forEach(achievement => {
    if (!achievement.achieved && achievement.condition()) {
      achievement.achieved = true;
      alert(`Você conquistou: ${achievement.title}!`);
    }
  });
}

// ==========
// Atualizar tudo no jogo
// ==========
function updateGame() {
  calculateCPS();
  updateDisplay();
  renderUpgrades();
  renderShop();
  renderPets();
  renderWorlds();
  renderMissions();
  renderAchievements();
  updateMissionsAndAchievements();
}

// ==========
// Compra upgrade
// ==========
function buyUpgrade(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return;
  let amountToBuy = buyAmount === "max" ? Math.floor(clicks / upgrade.price) : buyAmount;
  if (amountToBuy <= 0) return alert("Você não tem clicks suficientes.");

  const totalCost = upgrade.price * amountToBuy;
  if (clicks >= totalCost) {
    clicks -= totalCost;
    upgrade.quantity += amountToBuy;
    // Atualiza preço
    upgrade.price = Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity));
    updateGame();
  } else {
    alert("Você não tem clicks suficientes para comprar essa quantidade.");
  }
}

// ==========
// Compra item da loja
// ==========
function buyShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item || item.owned) return;
  if (clicks >= item.price) {
    clicks -= item.price;
    item.owned = true;
    updateGame();
  } else {
    alert("Você não tem clicks suficientes para comprar este item.");
  }
}

// ==========
// Rebirth
// ==========
function doRebirth() {
  if (clicks < 100000) {
    rebirthInfo.textContent = "Você precisa de pelo menos 100.000 clicks para fazer rebirth.";
    return;
  }
  rebirths++;
  clicks = 0;
  level = 1;
  xp = 0;
  xpToNextLevel = 100;
  upgrades.forEach(u => {
    u.quantity = 0;
    u.price = u.basePrice;
  });
  shopItems.forEach(i => i.owned = false);
  activePetId = null;
  currentWorld = 1;
  rebirthInfo.textContent = `Rebirth realizado! Você tem ${rebirths} rebirth(s).`;
  updateGame();
}

// ==========
// Handle click no botão principal
// ==========
clickBtn.addEventListener("click", () => {
  clicks++;
  xp++;
  updateMissionsAndAchievements();
  updateGame();
});

// ==========
// Compra upgrades via botões
// ==========
upgradesList.addEventListener("click", e => {
  if (e.target.classList.contains("upgrade-buy-btn")) {
    const id = Number(e.target.dataset.id);
    buyUpgrade(id);
  }
});

// ==========
// Compra loja via botões
// ==========
shopItemsList.addEventListener("click", e => {
  if (e.target.classList.contains("shop-buy-btn")) {
    const id = Number(e.target.dataset.id);
    buyShopItem(id);
  }
});

// ==========
// Rebirth
// ==========
rebirthBtn.addEventListener("click", doRebirth);

// ==========
// Compra quantidade para upgrades
// ==========
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const val = btn.dataset.amount;
    buyAmount = val === "max" ? "max" : Number(val);
  });
});

// ==========
// Mudar tema
// ==========
const toggleThemeBtn = document.getElementById("toggleTheme");
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  toggleThemeBtn.textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
});

// ==========
// Auto CPS incrementa clicks
// ==========
setInterval(() => {
  clicks += cps / 10;
  xp += cps / 10;
  updateMissionsAndAchievements();
  updateGame();
}, 100);

// ==========
// Firebase ranking
// ==========

function renderRanking(entries) {
  rankingList.innerHTML = "";
  if (!entries || entries.length === 0) {
    rankingList.textContent = "Nenhum dado no ranking.";
    return;
  }
  // Ordena decrescente
  entries.sort((a,b) => b.score - a.score);
  for (let i = 0; i < Math.min(10, entries.length); i++) {
    const entry = entries[i];
    const div = document.createElement("div");
    div.classList.add("ranking-entry");
    div.textContent = `${i + 1}. ${entry.name} - ${formatNumber(entry.score)}`;
    rankingList.appendChild(div);
  }
}

// Pega ranking do Firebase
function fetchRanking() {
  const rankRef = query(ref(database, "ranking"), orderByChild("score"));
  onValue(rankRef, (snapshot) => {
    const data = snapshot.val();
    const entries = data ? Object.values(data) : [];
    renderRanking(entries);
  });
}

// Salvar pontuação no Firebase
saveScoreBtn.addEventListener("click", () => {
  const playerName = playerNameInput.value.trim();
  if (!playerName) {
    rankMessage.textContent = "Digite seu nome antes de salvar.";
    return;
  }
  rankMessage.textContent = "";

  // Checar se já existe nome igual no ranking e evitar duplicidade
  const rankRef = ref(database, "ranking");
  onValue(rankRef, (snapshot) => {
    const data = snapshot.val() || {};
    // Remove entradas antigas do mesmo nome
    for (const key in data) {
      if (data[key].name === playerName) {
        // Deleta o registro repetido (implementar se quiser)
        // Para simplicidade, vamos ignorar e permitir sobrescrever clicando várias vezes
      }
    }
  }, { onlyOnce: true });

  // Salvar novo score
  push(ref(database, "ranking"), {
    name: playerName,
    score: Math.floor(clicks)
  });

  rankMessage.textContent = "Pontuação salva! Atualize para ver no ranking.";
  playerNameInput.value = "";
});

// Inicialização do jogo
updateGame();
fetchRanking();

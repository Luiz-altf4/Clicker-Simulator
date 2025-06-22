// =======================
// Estado do jogo
// =======================
let clicks = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;
let activePetId = null;

// =======================
// Dados do jogo
// =======================
const upgrades = [
  { id: 1, name: "Cursor", basePrice: 15, price: 15, quantity: 0, cps: 0.1 },
  { id: 2, name: "Grandes Mãos", basePrice: 100, price: 100, quantity: 0, cps: 1 },
  { id: 3, name: "Robô Auxiliar", basePrice: 1100, price: 1100, quantity: 0, cps: 8 },
  { id: 4, name: "Fábrica", basePrice: 12000, price: 12000, quantity: 0, cps: 47 },
  { id: 5, name: "Laboratório", basePrice: 130000, price: 130000, quantity: 0, cps: 260 },
];

const shopItems = [
  { id: 1, name: "Multiplicador x2", price: 1000000, description: "Dobra seus clicks e CPS", owned: false },
  { id: 2, name: "Multiplicador x5", price: 5000000, description: "Multiplica seus clicks e CPS por 5", owned: false },
];

const pets = [
  { id: 1, name: "Robozinho", bonusPercent: 5, price: 5000, owned: false, emoji: "🤖" },
  { id: 2, name: "Gatinho", bonusPercent: 12, price: 15000, owned: false, emoji: "🐱" },
  { id: 3, name: "Dragão", bonusPercent: 30, price: 50000, owned: false, emoji: "🐉" },
];

const worlds = [
  { id: 1, name: "Jardim Inicial", unlockReq: 0 },
  { id: 2, name: "Cidade Neon", unlockReq: 100000 },
  { id: 3, name: "Espaço Sideral", unlockReq: 10000000 },
  { id: 4, name: "Dimensão Paralela", unlockReq: 1000000000 },
];

// Missões básicas para exemplo
const missions = [
  { id: 1, title: "Clique 100 vezes", goal: 100, progress: 0, completed: false },
  { id: 2, title: "Compre 10 Upgrades", goal: 10, progress: 0, completed: false },
  { id: 3, title: "Faça 1 Rebirth", goal: 1, progress: 0, completed: false },
];

// Conquistas básicas
const achievements = [
  { id: 1, title: "Primeiro Clique", description: "Dê seu primeiro clique.", achieved: false, condition: () => clicks >= 1 },
  { id: 2, title: "1000 Cliques", description: "Alcance 1000 cliques.", achieved: false, condition: () => clicks >= 1000 },
  { id: 3, title: "Rebirth Inicial", description: "Faça seu primeiro Rebirth.", achieved: false, condition: () => rebirths >= 1 },
];

// =======================
// DOM Elements
// =======================
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
const toggleThemeBtn = document.getElementById("toggleTheme");

const missionsList = document.getElementById("missionsList");
const achievementsList = document.getElementById("achievementsList");

// Ranking Elements
const rankingList = document.getElementById("rankingList");
const playerNameInput = document.getElementById("playerNameInput");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const rankMessage = document.getElementById("rankMessage");

// =======================
// Funções auxiliares
// =======================

// Formatar números com unidades abreviadas
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

// Atualiza os displays principais
function updateDisplay() {
  clicksDisplay.textContent = formatNumber(clicks);
  cpsDisplay.textContent = formatNumber(calculateCPS());
  levelDisplay.textContent = level;
  xpDisplay.textContent = formatNumber(xp);
  xpToNextLevelDisplay.textContent = formatNumber(xpToNextLevel);
  rebirthCountDisplay.textContent = rebirths;
  currentWorldDisplay.textContent = `${currentWorld} - ${worlds.find(w => w.id === currentWorld).name}`;

  updateUpgradesList();
  updateShopList();
  renderPets();
  renderWorlds();
  updateRebirthInfo();
  renderMissions();
  renderAchievements();
}

// Calcula o total de CPS considerando upgrades, pets e loja
function calculateCPS() {
  let baseCPS = 0;
  upgrades.forEach(upg => {
    baseCPS += upg.cps * upg.quantity;
  });

  const petBonus = activePetId ? pets.find(p => p.id === activePetId).bonusPercent : 0;
  let totalCPS = baseCPS * (1 + petBonus / 100);

  if (shopItems.find(item => item.name.includes("x5"))?.owned) totalCPS *= 5;
  else if (shopItems.find(item => item.name.includes("x2"))?.owned) totalCPS *= 2;

  // Rebirths podem dar bônus (exemplo: 10% por rebirth)
  totalCPS *= (1 + rebirths * 0.1);

  return totalCPS;
}

// Clique manual
clickBtn.addEventListener("click", () => {
  const petBonus = activePetId ? pets.find(p => p.id === activePetId).bonusPercent : 0;
  let clickGain = 1 * (1 + petBonus / 100);

  if (shopItems.find(item => item.name.includes("x5"))?.owned) clickGain *= 5;
  else if (shopItems.find(item => item.name.includes("x2"))?.owned) clickGain *= 2;

  clickGain *= (1 + rebirths * 0.1);

  clicks += clickGain;

  gainXP(5);
  updateMissionsOnClick(clickGain);
  checkAchievements();

  updateDisplay();
});

// Comprar upgrades
function buyUpgrade(id, amount) {
  const upg = upgrades.find(u => u.id === id);
  if (!upg) return;

  if (amount === "max") {
    let maxAffordable = 0;
    let price = upg.price;
    let tempClicks = clicks;
    while (tempClicks >= price) {
      tempClicks -= price;
      maxAffordable++;
      price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity + maxAffordable));
    }
    if (maxAffordable > 0) {
      clicks = tempClicks;
      upg.quantity += maxAffordable;
      upg.price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    }
  } else {
    for (let i = 0; i < amount; i++) {
      if (clicks >= upg.price) {
        clicks -= upg.price;
        upg.quantity++;
        upg.price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
      } else {
        break;
      }
    }
  }
  updateMissionsOnUpgrade();
  updateDisplay();
  checkAchievements();
}

// Atualiza lista de upgrades
function updateUpgradesList() {
  upgradesList.innerHTML = "";
  upgrades.forEach(upg => {
    const row = document.createElement("div");
    row.className = "upgrade-row";

    const name = document.createElement("div");
    name.textContent = `${upg.name} (Qtd: ${upg.quantity})`;
    name.style.fontWeight = "700";

    const price = document.createElement("div");
    price.textContent = `Preço: ${formatNumber(upg.price)}`;

    const buyBtn = document.createElement("button");
    buyBtn.className = "btn";
    buyBtn.textContent = "Comprar";
    buyBtn.disabled = clicks < upg.price;
    buyBtn.addEventListener("click", () => buyUpgrade(upg.id, buyAmount));

    row.appendChild(name);
    row.appendChild(price);
    row.appendChild(buyBtn);

    upgradesList.appendChild(row);
  });
}

// Atualiza lista da loja
function updateShopList() {
  shopItemsList.innerHTML = "";
  shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shop-item";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const desc = document.createElement("p");
    desc.textContent = item.description;

    const btn = document.createElement("button");
    btn.className = "shop-buy-btn";
    btn.textContent = item.owned ? "Comprado" : `Comprar (${formatNumber(item.price)})`;
    btn.disabled = item.owned || clicks < item.price;

    btn.addEventListener("click", () => {
      if (clicks >= item.price && !item.owned) {
        clicks -= item.price;
        item.owned = true;
        updateDisplay();
        checkAchievements();
      }
    });

    div.appendChild(title);
    div.appendChild(desc);
    div.appendChild(btn);

    shopItemsList.appendChild(div);
  });
}

// Render pets
function renderPets() {
  petsList.innerHTML = "";
  pets.forEach(pet => {
    const card = document.createElement("div");
    card.className = "pet-card";
    if (pet.id === activePetId) card.classList.add("active");
    if (!pet.owned && clicks < pet.price) card.classList.add("disabled");

    const emojiDiv = document.createElement("div");
    emojiDiv.className = "pet-emoji";
    emojiDiv.textContent = pet.emoji;

    const nameDiv = document.createElement("div");
    nameDiv.className = "pet-name";
    nameDiv.textContent = pet.name;

    const bonusDiv = document.createElement("div");
    bonusDiv.className = "pet-bonus";
    bonusDiv.textContent = `+${pet.bonusPercent}% clicks`;

    const priceDiv = document.createElement("div");
    priceDiv.className = "pet-price";
    priceDiv.textContent = `Preço: ${formatNumber(pet.price)}`;

    const btn = document.createElement("button");
    btn.className = "btn pet-btn";
    btn.textContent = pet.owned ? (pet.id === activePetId ? "Ativo" : "Ativar") : "Comprar";
    btn.disabled = (pet.id === activePetId) || (!pet.owned && clicks < pet.price);

    btn.addEventListener("click", () => {
      if (pet.owned) {
        activePetId = pet.id;
        updateDisplay();
      } else {
        buyPet(pet.id);
      }
    });

    card.appendChild(emojiDiv);
    card.appendChild(nameDiv);
    card.appendChild(bonusDiv);
    card.appendChild(priceDiv);
    card.appendChild(btn);

    petsList.appendChild(card);
  });

  activePetDisplay.textContent = activePetId
    ? `Pet ativo: ${pets.find(p => p.id === activePetId).name} ${pets.find(p => p.id === activePetId).emoji}`
    : "Pet ativo: Nenhum";
}

function buyPet(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;
  if (clicks >= pet.price) {
    clicks -= pet.price;
    pet.owned = true;
    activePetId = petId;
    updateDisplay();
  } else {
    alert("Você não tem cliques suficientes para comprar esse pet!");
  }
}

// Rebirth (Prestígio)
rebirthBtn.addEventListener("click", () => {
  if (clicks >= 1000000) {
    clicks = 0;
    level = 1;
    xp = 0;
    xpToNextLevel = 100;
    upgrades.forEach(u => { u.quantity = 0; u.price = u.basePrice; });
    shopItems.forEach(i => { i.owned = false; });
    pets.forEach(p => { p.owned = false; });
    activePetId = null;
    rebirths++;
    currentWorld = 1;
    missions.forEach(m => { m.progress = 0; m.completed = false; });
    updateDisplay();
    alert("Rebirth feito! Você ganhou bônus em CPS e clicks.");
  } else {
    alert("Você precisa de pelo menos 1.000.000 cliques para fazer Rebirth!");
  }
});

function updateRebirthInfo() {
  rebirthInfo.textContent = `Rebirths feitos: ${rebirths}. Rebirth reseta progresso, mas aumenta multiplicadores futuros em 10% por rebirth.`;
}

// Render mundos desbloqueáveis
function renderWorlds() {
  worldsList.innerHTML = "";
  worlds.forEach(world => {
    const card = document.createElement("div");
    card.className = "world-card";
    card.textContent = `${world.id} - ${world.name}`;

    if (currentWorld === world.id) card.classList.add("active");

    if (clicks < world.unlockReq) {
      card.classList.add("disabled");
      card.style.opacity = "0.4";
      card.title = `Desbloqueie com ${formatNumber(world.unlockReq)} cliques`;
      card.style.cursor = "not-allowed";
    } else {
      card.title = `Clique para ir para o mundo: ${world.name}`;
      card.addEventListener("click", () => {
        if (clicks >= world.unlockReq) {
          currentWorld = world.id;
          updateDisplay();
        }
      });
    }

    worldsList.appendChild(card);
  });
}

// Botões para escolher quantidade compra upgrades
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    buyAmount = btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
  });
});

// Tema claro / escuro
function toggleTheme() {
  document.body.classList.toggle("light-theme");
  if(document.body.classList.contains("light-theme")){
    toggleThemeBtn.textContent = "🌙";
  } else {
    toggleThemeBtn.textContent = "☀️";
  }
}
toggleThemeBtn.addEventListener("click", toggleTheme);

// =======================
// Missões
// =======================

function renderMissions() {
  missionsList.innerHTML = "";
  missions.forEach(m => {
    const card = document.createElement("div");
    card.className = "mission-card";
    if (m.completed) card.classList.add("completed");

    const title = document.createElement("div");
    title.className = "mission-title";
    title.textContent = m.title;

    const progress = document.createElement("div");
    progress.className = "mission-progress";
    progress.textContent = `Progresso: ${m.progress} / ${m.goal}`;

    card.appendChild(title);
    card.appendChild(progress);
    missionsList.appendChild(card);
  });
}

function updateMissionsOnClick(amount) {
  const mission = missions.find(m => m.id === 1);
  if (mission && !mission.completed) {
    mission.progress += amount;
    if (mission.progress >= mission.goal) {
      mission.progress = mission.goal;
      mission.completed = true;
      alert(`Missão concluída: ${mission.title}`);
    }
  }
}

function updateMissionsOnUpgrade() {
  const mission = missions.find(m => m.id === 2);
  if (mission && !mission.completed) {
    let totalUpgrades = upgrades.reduce((sum, u) => sum + u.quantity, 0);
    mission.progress = totalUpgrades;
    if (mission.progress >= mission.goal) {
      mission.progress = mission.goal;
      mission.completed = true;
      alert(`Missão concluída: ${mission.title}`);
    }
  }
}

function updateMissionsOnRebirth() {
  const mission = missions.find(m => m.id === 3);
  if (mission && !mission.completed && rebirths >= mission.goal) {
    mission.progress = mission.goal;
    mission.completed = true;
    alert(`Missão concluída: ${mission.title}`);
  }
}

// =======================
// Conquistas
// =======================
function renderAchievements() {
  achievementsList.innerHTML = "";
  achievements.forEach(a => {
    const card = document.createElement("div");
    card.className = "achievement-card";
    if (a.achieved) card.classList.add("completed");

    const title = document.createElement("div");
    title.className = "achievement-title";
    title.textContent = a.title;

    const desc = document.createElement("div");
    desc.className = "achievement-desc";
    desc.textContent = a.description;

    card.appendChild(title);
    card.appendChild(desc);

    achievementsList.appendChild(card);
  });
}

function checkAchievements() {
  achievements.forEach(a => {
    if (!a.achieved && a.condition()) {
      a.achieved = true;
      alert(`Conquista desbloqueada: ${a.title}`);
    }
  });
}

// =======================
// XP e Level
// =======================
function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.25);
    alert(`Você subiu para o nível ${level}!`);
  }
}

// =======================
// Loop de CPS
// =======================
setInterval(() => {
  clicks += calculateCPS();
  gainXP(calculateCPS() * 2);
  updateMissionsOnClick(calculateCPS());
  checkAchievements();
  updateDisplay();
}, 1000);

// =======================
// Firebase - Ranking
// =======================
// Inclua seu arquivo firebaseConfig.js para configurar o Firebase

// Importa Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, push, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

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

function saveScore() {
  const playerName = playerNameInput.value.trim();
  if (!playerName) {
    rankMessage.textContent = "Por favor, digite um nome válido.";
    return;
  }

  const newScoreRef = push(ref(database, 'scores'));
  newScoreRef.set({
    name: playerName,
    score: clicks,
    timestamp: Date.now()
  }).then(() => {
    rankMessage.textContent = "Pontuação salva com sucesso!";
    playerNameInput.value = "";
    loadRanking();
  }).catch(() => {
    rankMessage.textContent = "Erro ao salvar a pontuação.";
  });
}

function loadRanking() {
  rankingList.innerHTML = "<p>Carregando ranking...</p>";
  const scoresRef = query(ref(database, 'scores'), orderByChild('score'), limitToLast(10));

  onValue(scoresRef, (snapshot) => {
    rankingList.innerHTML = "";
    let scoresArray = [];
    snapshot.forEach(childSnapshot => {
      scoresArray.push(childSnapshot.val());
    });

    // Ordenar do maior para o menor
    scoresArray.sort((a, b) => b.score - a.score);

    if (scoresArray.length === 0) {
      rankingList.innerHTML = "<p>Nenhuma pontuação salva ainda.</p>";
      return;
    }

    scoresArray.forEach((entry, index) => {
      const div = document.createElement("div");
      div.className = "ranking-entry";
      div.innerHTML = `<span>${index + 1}. ${entry.name}</span><span>${formatNumber(entry.score)}</span>`;
      rankingList.appendChild(div);
    });
  });
}

// Botão salvar pontuação ranking
saveScoreBtn.addEventListener("click", saveScore);

// Inicialização
loadRanking();
updateDisplay();
renderMissions();
renderAchievements();

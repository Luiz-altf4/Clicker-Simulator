import { db, collection, query, orderBy, limit, getDocs, addDoc, doc, setDoc } from './firebase-config.js';

// Estado do jogo
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let rebirths = 0;
let currentWorld = 1;

let buyAmount = 1;

// Dados dos upgrades
const upgrades = [
  { id: 1, name: "Cursor", basePrice: 15, price: 15, quantity: 0, cps: 0.1 },
  { id: 2, name: "Grandes Mãos", basePrice: 100, price: 100, quantity: 0, cps: 1 },
  { id: 3, name: "Robô Auxiliar", basePrice: 1100, price: 1100, quantity: 0, cps: 8 },
  { id: 4, name: "Fábrica", basePrice: 12000, price: 12000, quantity: 0, cps: 47 },
  { id: 5, name: "Laboratório", basePrice: 130000, price: 130000, quantity: 0, cps: 260 },
];

// Dados da loja
const shopItems = [
  { id: 1, name: "Multiplicador x2", price: 1000000, description: "Dobra seus clicks e CPS", owned: false },
  { id: 2, name: "Multiplicador x5", price: 5000000, description: "Multiplica seus clicks e CPS por 5", owned: false },
];

// Pets
const pets = [
  { id: 1, name: "Robozinho", bonusPercent: 5, price: 5000, owned: false, emoji: "🤖" },
  { id: 2, name: "Gatinho", bonusPercent: 12, price: 15000, owned: false, emoji: "🐱" },
  { id: 3, name: "Dragão", bonusPercent: 30, price: 50000, owned: false, emoji: "🐉" },
];

let activePetId = null;

// Mundos
const worlds = [
  { id: 1, name: "Jardim Inicial", unlockReq: 0 },
  { id: 2, name: "Cidade Neon", unlockReq: 100000 },
  { id: 3, name: "Espaço Sideral", unlockReq: 10000000 },
  { id: 4, name: "Dimensão Paralela", unlockReq: 1000000000 },
];

// Missões
const missions = [
  { id: 1, name: "Clique 100 vezes", description: "Dê 100 cliques manuais", progress: 0, goal: 100, rewarded: false },
  { id: 2, name: "Alcance 1k de CPS", description: "Tenha 1000 CPS", progress: 0, goal: 1000, rewarded: false },
  { id: 3, name: "Faça 1 Rebirth", description: "Realize seu primeiro rebirth", progress: 0, goal: 1, rewarded: false },
];

// Conquistas
const achievements = [
  { id: 1, name: "Iniciante", description: "Comece a jogar", achieved: false },
  { id: 2, name: "Maratonista", description: "Dê 1000 cliques", achieved: false },
  { id: 3, name: "Profissional", description: "Alcance nível 10", achieved: false },
];

// DOM Elements
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
const missionsList = document.getElementById("missionsList");
const achievementsList = document.getElementById("achievementsList");
const rankingList = document.getElementById("rankingList");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
const toggleThemeBtn = document.getElementById("toggleTheme");

// Format number with suffixes
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

// Update UI
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

// Calculate CPS
function calculateCPS() {
  let baseCPS = 0;
  upgrades.forEach(upg => {
    baseCPS += upg.cps * upg.quantity;
  });

  const petBonus = activePetId ? pets.find(p => p.id === activePetId).bonusPercent : 0;
  let totalCPS = baseCPS * (1 + petBonus / 100);

  if (shopItems.find(item => item.name.includes("x5"))?.owned) totalCPS *= 5;
  else if (shopItems.find(item => item.name.includes("x2"))?.owned) totalCPS *= 2;

  return totalCPS;
}

// Click manual
clickBtn.addEventListener("click", () => {
  const petBonus = activePetId ? pets.find(p => p.id === activePetId).bonusPercent : 0;
  let clickGain = 1 * (1 + petBonus / 100);

  if (shopItems.find(item => item.name.includes("x5"))?.owned) clickGain *= 5;
  else if (shopItems.find(item => item.name.includes("x2"))?.owned) clickGain *= 2;

  clicks += clickGain;
  gainXP(5);
  checkMissionsOnClick(clickGain);
  updateDisplay();
});

// Buy upgrades
function buyUpgrade(id, amount) {
  const upg = upgrades.find(u => u.id === id);
  if (!upg) return;

  if (amount === "max") {
    let maxAffordable = 0;
    let price = upg.price;
    while (clicks >= price) {
      clicks -= price;
      maxAffordable++;
      price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity + maxAffordable));
    }
    if (maxAffordable > 0) {
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
  updateDisplay();
}

// Update Upgrades List
function updateUpgradesList() {
  upgradesList.innerHTML = "";
  upgrades.forEach(upg => {
    const row = document.createElement("div");
    row.className = "upgrade-row";

    const nameDiv = document.createElement("div");
    nameDiv.textContent = `${upg.name} (x${upg.quantity})`;
    row.appendChild(nameDiv);

    const priceDiv = document.createElement("div");
    priceDiv.textContent = `Preço: ${formatNumber(upg.price)}`;
    row.appendChild(priceDiv);

    const btn = document.createElement("button");
    btn.textContent = "Comprar";
    btn.className = "btn";
    btn.disabled = clicks < upg.price;
    btn.addEventListener("click", () => buyUpgrade(upg.id, buyAmount));
    row.appendChild(btn);

    upgradesList.appendChild(row);
  });
}

// Buy shop items
function buyShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;
  if (clicks >= item.price && !item.owned) {
    clicks -= item.price;
    item.owned = true;
    updateDisplay();
  }
}

// Update Shop List
function updateShopList() {
  shopItemsList.innerHTML = "";
  shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shop-item";

    const name = document.createElement("h3");
    name.textContent = item.name;
    div.appendChild(name);

    const desc = document.createElement("div");
    desc.textContent = item.description;
    div.appendChild(desc);

    const price = document.createElement("div");
    price.textContent = `Preço: ${formatNumber(item.price)}`;
    div.appendChild(price);

    const btn = document.createElement("button");
    btn.textContent = item.owned ? "Comprado" : "Comprar";
    btn.className = "btn shop-buy-btn";
    btn.disabled = item.owned || clicks < item.price;
    btn.addEventListener("click", () => buyShopItem(item.id));
    div.appendChild(btn);

    shopItemsList.appendChild(div);
  });
}

// Pets render
function renderPets() {
  petsList.innerHTML = "";
  pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "pet-card";
    if (!pet.owned) div.classList.add("disabled");
    if (activePetId === pet.id) div.classList.add("active");

    div.addEventListener("click", () => {
      if (!pet.owned) return;
      activePetId = pet.id;
      updateDisplay();
    });

    const emoji = document.createElement("div");
    emoji.className = "pet-emoji";
    emoji.textContent = pet.emoji;
    div.appendChild(emoji);

    const name = document.createElement("div");
    name.className = "pet-name";
    name.textContent = pet.name;
    div.appendChild(name);

    const bonus = document.createElement("div");
    bonus.className = "pet-bonus";
    bonus.textContent = `Bônus CPS: +${pet.bonusPercent}%`;
    div.appendChild(bonus);

    const price = document.createElement("div");
    price.className = "pet-price";
    price.textContent = `Preço: ${formatNumber(pet.price)}`;
    div.appendChild(price);

    petsList.appendChild(div);
  });
  activePetDisplay.textContent = activePetId ? `Pet ativo: ${pets.find(p => p.id === activePetId).name}` : "Pet ativo: Nenhum";
}

// Buy pet
function buyPet(id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return;
  if (clicks >= pet.price && !pet.owned) {
    clicks -= pet.price;
    pet.owned = true;
    updateDisplay();
  }
}

// Render worlds
function renderWorlds() {
  worldsList.innerHTML = "";
  worlds.forEach(world => {
    const div = document.createElement("div");
    div.className = "world-card";

    if (clicks < world.unlockReq) {
      div.classList.add("disabled");
    }
    if (currentWorld === world.id) {
      div.classList.add("active");
    }

    div.textContent = `${world.id} - ${world.name}`;
    div.addEventListener("click", () => {
      if (clicks >= world.unlockReq) {
        currentWorld = world.id;
        updateDisplay();
      }
    });
    worldsList.appendChild(div);
  });
}

// Rebirth
rebirthBtn.addEventListener("click", () => {
  if (clicks >= 1000000) { // exemplo requisito
    rebirths++;
    clicks = 0;
    level = 1;
    xp = 0;
    upgrades.forEach(u => { u.quantity = 0; u.price = u.basePrice; });
    shopItems.forEach(i => i.owned = false);
    activePetId = null;
    currentWorld = 1;
    updateDisplay();
  } else {
    rebirthInfo.textContent = "Você precisa de 1.000.000 de cliques para fazer rebirth.";
  }
});

// Update rebirth info
function updateRebirthInfo() {
  rebirthInfo.textContent = `Rebirths feitos: ${rebirths}`;
}

// Missions render
function renderMissions() {
  missionsList.innerHTML = "";
  missions.forEach(mission => {
    const div = document.createElement("div");
    div.className = "mission-card";
    if (mission.rewarded) div.classList.add("disabled");

    const name = document.createElement("div");
    name.className = "mission-name";
    name.textContent = mission.name;
    div.appendChild(name);

    const desc = document.createElement("div");
    desc.className = "mission-desc";
    desc.textContent = `${mission.description} (${mission.progress} / ${mission.goal})`;
    div.appendChild(desc);

    if (!mission.rewarded && mission.progress >= mission.goal) {
      const btn = document.createElement("button");
      btn.textContent = "Recompensar";
      btn.className = "btn";
      btn.addEventListener("click", () => {
        mission.rewarded = true;
        clicks += 1000; // exemplo recompensa
        updateDisplay();
      });
      div.appendChild(btn);
    }

    missionsList.appendChild(div);
  });
}

// Update missions on click
function checkMissionsOnClick(clickGain) {
  missions.forEach(mission => {
    if (!mission.rewarded) {
      if (mission.id === 1) mission.progress += clickGain;
      if (mission.id === 2) mission.progress = cps; // atualiza CPS
      if (mission.id === 3) mission.progress = rebirths;
    }
  });
}

// Achievements render
function renderAchievements() {
  achievementsList.innerHTML = "";
  achievements.forEach(ach => {
    const div = document.createElement("div");
    div.className = "achievement-card";
    if (ach.achieved) div.classList.add("active");

    const name = document.createElement("div");
    name.className = "achievement-name";
    name.textContent = ach.name;
    div.appendChild(name);

    const desc = document.createElement("div");
    desc.className = "achievement-desc";
    desc.textContent = ach.description;
    div.appendChild(desc);

    achievementsList.appendChild(div);
  });
}

// Save and load localStorage
function saveGame() {
  const saveData = {
    clicks, cps, level, xp, xpToNextLevel, rebirths, currentWorld,
    upgrades, shopItems, pets, activePetId,
    missions, achievements
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

function loadGame() {
  const saveData = JSON.parse(localStorage.getItem("clickerSave"));
  if (!saveData) return;

  clicks = saveData.clicks;
  cps = saveData.cps;
  level = saveData.level;
  xp = saveData.xp;
  xpToNextLevel = saveData.xpToNextLevel;
  rebirths = saveData.rebirths;
  currentWorld = saveData.currentWorld;

  // Para arrays e objetos, usa merge para não perder as referências
  upgrades.forEach(upg => {
    const savedUpg = saveData.upgrades.find(u => u.id === upg.id);
    if (savedUpg) {
      upg.quantity = savedUpg.quantity;
      upg.price = savedUpg.price;
    }
  });

  shopItems.forEach(item => {
    const savedItem = saveData.shopItems.find(i => i.id === item.id);
    if (savedItem) item.owned = savedItem.owned;
  });

  pets.forEach(pet => {
    const savedPet = saveData.pets.find(p => p.id === pet.id);
    if (savedPet) pet.owned = savedPet.owned;
  });

  activePetId = saveData.activePetId;

  missions.forEach(miss => {
    const savedMiss = saveData.missions.find(m => m.id === miss.id);
    if (savedMiss) {
      miss.progress = savedMiss.progress;
      miss.rewarded = savedMiss.rewarded;
    }
  });

  achievements.forEach(ach => {
    const savedAch = saveData.achievements.find(a => a.id === ach.id);
    if (savedAch) ach.achieved = savedAch.achieved;
  });
}

// Ranking com Firebase
async function fetchRanking() {
  const rankingsCol = collection(db, "rankings");
  const q = query(rankingsCol, orderBy("score", "desc"), limit(10));
  const querySnapshot = await getDocs(q);
  rankingList.innerHTML = "";

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${data.name} - ${formatNumber(data.score)}`;
    rankingList.appendChild(li);
  });
}

// Atualizar ranking no Firebase (exemplo, salvar no clique)
async function updateRanking(name, score) {
  const rankingsCol = collection(db, "rankings");

  // Aqui você poderia atualizar se já existe, mas pra simplicidade vamos adicionar
  await addDoc(rankingsCol, {
    name,
    score,
    timestamp: Date.now()
  });

  fetchRanking();
}

// Atualiza CPS a cada segundo e salva o jogo
setInterval(() => {
  clicks += calculateCPS();
  xp += calculateCPS() * 2;
  if (xp >= xpToNextLevel) {
    level++;
    xp -= xpToNextLevel;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
  }
  updateDisplay();
  saveGame();
  fetchRanking();
}, 1000);

// Trocar quantidade compra
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    if (btn.dataset.amount === "max") buyAmount = "max";
    else buyAmount = parseInt(btn.dataset.amount);
  });
});

// Tema claro/escuro
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
});

// Inicialização
loadGame();
updateDisplay();
fetchRanking();

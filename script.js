import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Estado do jogo
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let rebirths = 0;
let currentWorld = 1;

let buyAmount = 1;

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

let activePetId = null;

const worlds = [
  { id: 1, name: "Jardim Inicial", unlockReq: 0 },
  { id: 2, name: "Cidade Neon", unlockReq: 100000 },
  { id: 3, name: "Espaço Sideral", unlockReq: 10000000 },
  { id: 4, name: "Dimensão Paralela", unlockReq: 1000000000 },
];

const missions = [
  { id: 1, name: "Clique 100 vezes", description: "Clique no botão 100 vezes", goal: 100, progress: 0, rewarded: false },
  { id: 2, name: "Alcance 50 CPS", description: "Tenha 50 cliques por segundo", goal: 50, progress: 0, rewarded: false },
  { id: 3, name: "Faça 3 rebirths", description: "Realize 3 rebirths no jogo", goal: 3, progress: 0, rewarded: false },
];

const achievements = [
  { id: 1, name: "Iniciante", description: "Clique seu primeiro clique", achieved: false },
  { id: 2, name: "Aprendiz", description: "Alcance o nível 5", achieved: false },
  { id: 3, name: "Veterano", description: "Faça 5 rebirths", achieved: false },
];

// DOM Elements
const clicksDisplay = document.getElementById("clicksDisplay");
const cpsDisplay = document.getElementById("cpsDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const xpDisplay = document.getElementById("xpDisplay");
const xpToNextLevelDisplay = document.getElementById("xpToNextLevel");
const rebirthCountDisplay = document.getElementById("rebirthCount");
const currentWorldDisplay = document.getElementById("currentWorld");
const upgradesList = document.getElementById("upgradesList");
const shopItemsList = document.getElementById("shopItemsList");
const petsList = document.getElementById("petsList");
const activePetDisplay = document.getElementById("activePet");
const worldsList = document.getElementById("worldsList");
const missionsList = document.getElementById("missionsList");
const achievementsList = document.getElementById("achievementsList");
const buyAmountButtons = document.querySelectorAll(".upgradeAmountBtn");
const clickBtn = document.getElementById("clickBtn");
const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthInfo = document.getElementById("rebirthInfo");

// Ranking Elements
const rankingList = document.getElementById("rankingList");
const playerNameInput = document.getElementById("playerNameInput");
const saveRankBtn = document.getElementById("saveRankBtn");
const rankMessage = document.getElementById("rankMessage");

// Tema toggle
const toggleThemeBtn = document.getElementById("toggleTheme");

// Inicialização
function init() {
  loadGame();
  renderAll();
  setupEvents();
  startAutoClicker();
  fetchRanking();
  updateRankingList();
}

// Salvar e carregar
function saveGame() {
  const saveData = {
    clicks, cps, level, xp, xpToNextLevel, rebirths, currentWorld,
    upgrades, shopItems, pets, activePetId, missions, achievements,
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

function loadGame() {
  const saved = localStorage.getItem("clickerSave");
  if (saved) {
    const data = JSON.parse(saved);
    clicks = data.clicks || 0;
    cps = data.cps || 0;
    level = data.level || 1;
    xp = data.xp || 0;
    xpToNextLevel = data.xpToNextLevel || 100;
    rebirths = data.rebirths || 0;
    currentWorld = data.currentWorld || 1;

    // Atualiza arrays e objetos, preservando métodos (simples)
    if (data.upgrades) {
      upgrades.forEach(u => {
        const d = data.upgrades.find(x => x.id === u.id);
        if (d) {
          u.quantity = d.quantity || 0;
          u.price = d.price || u.basePrice * Math.pow(1.15, u.quantity);
        }
      });
    }

    if (data.shopItems) {
      shopItems.forEach(s => {
        const d = data.shopItems.find(x => x.id === s.id);
        if (d) s.owned = d.owned || false;
      });
    }

    if (data.pets) {
      pets.forEach(p => {
        const d = data.pets.find(x => x.id === p.id);
        if (d) p.owned = d.owned || false;
      });
    }

    activePetId = data.activePetId || null;

    if (data.missions) {
      missions.forEach(m => {
        const d = data.missions.find(x => x.id === m.id);
        if (d) {
          m.progress = d.progress || 0;
          m.rewarded = d.rewarded || false;
        }
      });
    }

    if (data.achievements) {
      achievements.forEach(a => {
        const d = data.achievements.find(x => x.id === a.id);
        if (d) a.achieved = d.achieved || false;
      });
    }
  }
}

// Renderização geral
function renderAll() {
  updateStats();
  renderUpgrades();
  renderShop();
  renderPets();
  renderWorlds();
  renderMissions();
  renderAchievements();
  updateActivePet();
  updateBuyAmountButtons();
}

function updateStats() {
  clicksDisplay.textContent = formatNumber(clicks);
  cpsDisplay.textContent = cps.toFixed(1);
  levelDisplay.textContent = level;
  xpDisplay.textContent = formatNumber(xp);
  xpToNextLevelDisplay.textContent = formatNumber(xpToNextLevel);
  rebirthCountDisplay.textContent = rebirths;
  currentWorldDisplay.textContent = `${currentWorld} - ${worlds.find(w => w.id === currentWorld).name}`;
}

function formatNumber(num) {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(0);
}

// Upgrades
function renderUpgrades() {
  upgradesList.innerHTML = "";
  upgrades.forEach(u => {
    const row = document.createElement("div");
    row.classList.add("upgrade-row");
    row.innerHTML = `
      <div>${u.name} (x${u.quantity})</div>
      <div>Preço: ${formatNumber(u.price)}</div>
      <button class="btn upgrade-buy-btn" data-id="${u.id}">Comprar</button>
    `;
    upgradesList.appendChild(row);
  });
}

// Loja
function renderShop() {
  shopItemsList.innerHTML = "";
  shopItems.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("shop-item");
    div.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <div>Preço: ${formatNumber(item.price)}</div>
      <button class="btn shop-buy-btn" data-id="${item.id}" ${item.owned ? "disabled" : ""}>${item.owned ? "Comprado" : "Comprar"}</button>
    `;
    shopItemsList.appendChild(div);
  });
}

// Pets
function renderPets() {
  petsList.innerHTML = "";
  pets.forEach(p => {
    const card = document.createElement("div");
    card.classList.add("pet-card");
    if (!p.owned) card.classList.add("disabled");
    if (p.id === activePetId) card.classList.add("active");
    card.innerHTML = `
      <div class="pet-emoji">${p.emoji}</div>
      <div class="pet-name">${p.name}</div>
      <div class="pet-bonus">Bônus: +${p.bonusPercent}% CPS</div>
      <div class="pet-price">Preço: ${formatNumber(p.price)}</div>
    `;
    petsList.appendChild(card);

    if (p.owned) {
      card.addEventListener("click", () => {
        activePetId = p.id === activePetId ? null : p.id;
        updateActivePet();
        saveGame();
      });
    } else {
      card.addEventListener("click", () => {
        buyPet(p.id);
      });
    }
  });
}

function buyPet(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet || pet.owned) return;
  if (clicks >= pet.price) {
    clicks -= pet.price;
    pet.owned = true;
    activePetId = pet.id;
    saveGame();
    renderPets();
    updateStats();
  }
}

// Mundos
function renderWorlds() {
  worldsList.innerHTML = "";
  worlds.forEach(w => {
    const card = document.createElement("div");
    card.classList.add("world-card");
    if (clicks < w.unlockReq) card.classList.add("disabled");
    if (w.id === currentWorld) card.classList.add("active");
    card.textContent = w.name;
    card.title = `Desbloqueia com ${formatNumber(w.unlockReq)} cliques`;
    card.addEventListener("click", () => {
      if (clicks >= w.unlockReq) {
        currentWorld = w.id;
        saveGame();
        renderAll();
      }
    });
    worldsList.appendChild(card);
  });
}

// Missões
function renderMissions() {
  missionsList.innerHTML = "";
  missions.forEach(m => {
    const card = document.createElement("div");
    card.classList.add("mission-card");
    const progressPercent = Math.min(100, (m.progress / m.goal) * 100);
    card.innerHTML = `
      <div>
        <strong>${m.name}</strong><br />
        ${m.description}<br />
        Progresso: ${formatNumber(m.progress)} / ${formatNumber(m.goal)}
      </div>
      <div>
        ${m.rewarded ? "<em>Recompensa recebida</em>" : `<button class="btn mission-claim-btn" data-id="${m.id}" ${m.progress >= m.goal ? "" : "disabled"}>Reivindicar</button>`}
      </div>
    `;
    missionsList.appendChild(card);
  });
}

// Conquistas
function renderAchievements() {
  achievementsList.innerHTML = "";
  achievements.forEach(a => {
    const card = document.createElement("div");
    card.classList.add("achievement-card");
    card.innerHTML = `
      <div>
        <strong>${a.name}</strong><br />
        ${a.description}<br />
        ${a.achieved ? "<em>Conquista alcançada</em>" : "<em>Não alcançada</em>"}
      </div>
    `;
    achievementsList.appendChild(card);
  });
}

// Atualiza pet ativo na UI
function updateActivePet() {
  if (activePetId === null) {
    activePetDisplay.textContent = "Pet ativo: Nenhum";
  } else {
    const pet = pets.find(p => p.id === activePetId);
    activePetDisplay.textContent = `Pet ativo: ${pet.name}`;
  }
}

// Atualiza botão quantidade compra
function updateBuyAmountButtons() {
  buyAmountButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.amount == buyAmount);
  });
}

// Eventos
function setupEvents() {
  clickBtn.addEventListener("click", () => {
    clicks += 1;
    xp += 1;
    checkLevelUp();
    updateStats();
    saveGame();
    checkMissions();
    checkAchievements();
  });

  buyAmountButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      buyAmount = btn.dataset.amount === "max" ? Infinity : parseInt(btn.dataset.amount);
      updateBuyAmountButtons();
    });
  });

  upgradesList.addEventListener("click", e => {
    if (e.target.classList.contains("upgrade-buy-btn")) {
      const id = parseInt(e.target.dataset.id);
      buyUpgrade(id);
    }
  });

  shopItemsList.addEventListener("click", e => {
    if (e.target.classList.contains("shop-buy-btn")) {
      const id = parseInt(e.target.dataset.id);
      buyShopItem(id);
    }
  });

  missionsList.addEventListener("click", e => {
    if (e.target.classList.contains("mission-claim-btn")) {
      const id = parseInt(e.target.dataset.id);
      claimMissionReward(id);
    }
  });

  rebirthBtn.addEventListener("click", () => {
    doRebirth();
  });

  toggleThemeBtn.addEventListener("click", toggleTheme);

  saveRankBtn.addEventListener("click", () => {
    const name = playerNameInput.value.trim();
    if (name.length < 3) {
      rankMessage.textContent = "Nome deve ter ao menos 3 caracteres.";
      return;
    }
    rankMessage.textContent = "";
    saveRank(name);
  });
}

// Comprar upgrade
function buyUpgrade(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return;

  let maxBuy = buyAmount === Infinity ? Math.floor(clicks / upgrade.price) : buyAmount;
  if (maxBuy <= 0) return;

  let totalPrice = 0;
  for (let i = 0; i < maxBuy; i++) {
    totalPrice += upgrade.price * Math.pow(1.15, upgrade.quantity + i);
  }

  if (totalPrice > clicks) {
    // Ajusta maxBuy para o que dá para comprar
    maxBuy = 0;
    for (let i = 0; i < buyAmount; i++) {
      let priceTry = 0;
      for (let j = 0; j <= i; j++) {
        priceTry += upgrade.price * Math.pow(1.15, upgrade.quantity + j);
      }
      if (priceTry > clicks) break;
      maxBuy = i + 1;
    }
    if (maxBuy === 0) return;
    totalPrice = 0;
    for (let i = 0; i < maxBuy; i++) {
      totalPrice += upgrade.price * Math.pow(1.15, upgrade.quantity + i);
    }
  }

  // Compra
  clicks -= totalPrice;
  upgrade.quantity += maxBuy;
  upgrade.price *= Math.pow(1.15, maxBuy);

  updateCPS();
  updateStats();
  renderUpgrades();
  saveGame();
  checkMissions();
  checkAchievements();
}

// Comprar item da loja
function buyShopItem(id) {
  const item = shopItems.find(s => s.id === id);
  if (!item || item.owned) return;
  if (clicks >= item.price) {
    clicks -= item.price;
    item.owned = true;

    // Aplica efeito do multiplicador
    if (item.name.includes("x2")) {
      cps *= 2;
    } else if (item.name.includes("x5")) {
      cps *= 5;
    }

    updateStats();
    renderShop();
    saveGame();
  }
}

// Atualiza CPS
function updateCPS() {
  let baseCPS = upgrades.reduce((sum, u) => sum + u.cps * u.quantity, 0);
  // Pet bonus
  if (activePetId !== null) {
    const pet = pets.find(p => p.id === activePetId);
    baseCPS *= 1 + pet.bonusPercent / 100;
  }
  // Shop items multiplicador
  const multipliers = shopItems.filter(i => i.owned);
  multipliers.forEach(i => {
    if (i.name.includes("x2")) baseCPS *= 2;
    if (i.name.includes("x5")) baseCPS *= 5;
  });
  cps = baseCPS;
}

// Nível e XP
function checkLevelUp() {
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.2);
  }
}

// Missões check
function checkMissions() {
  missions.forEach(m => {
    if (!m.rewarded) {
      if (m.id === 1) m.progress = Math.min(m.goal, m.progress + 1);
      else if (m.id === 2) m.progress = Math.min(m.goal, cps);
      else if (m.id === 3) m.progress = Math.min(m.goal, rebirths);
    }
  });
  renderMissions();
}

// Reivindicar recompensa missão
function claimMissionReward(id) {
  const mission = missions.find(m => m.id === id);
  if (!mission || mission.rewarded || mission.progress < mission.goal) return;
  // Recompensa: clique += goal * 10 (exemplo)
  clicks += mission.goal * 10;
  mission.rewarded = true;
  saveGame();
  updateStats();
  checkAchievements();
  renderMissions();
}

// Conquistas check
function checkAchievements() {
  achievements.forEach(a => {
    if (!a.achieved) {
      if (a.id === 1 && clicks >= 1) a.achieved = true;
      else if (a.id === 2 && level >= 5) a.achieved = true;
      else if (a.id === 3 && rebirths >= 5) a.achieved = true;
    }
  });
  renderAchievements();
}

// Rebirth
function doRebirth() {
  if (clicks < 1000000) {
    rebirthInfo.textContent = "Você precisa de pelo menos 1.000.000 de cliques para fazer Rebirth.";
    return;
  }
  rebirthInfo.textContent = "";
  rebirths++;
  clicks = 0;
  cps = 0;
  level = 1;
  xp = 0;
  xpToNextLevel = 100;
  currentWorld = 1;
  upgrades.forEach(u => {
    u.quantity = 0;
    u.price = u.basePrice;
  });
  shopItems.forEach(s => s.owned = false);
  pets.forEach(p => p.owned = false);
  activePetId = null;
  missions.forEach(m => {
    m.progress = 0;
    m.rewarded = false;
  });
  achievements.forEach(a => a.achieved = false);

  saveGame();
  renderAll();
}

// Auto clique a cada segundo pelo CPS
function startAutoClicker() {
  setInterval(() => {
    clicks += cps;
    xp += cps;
    checkLevelUp();
    updateStats();
    saveGame();
    checkMissions();
    checkAchievements();
  }, 1000);
}

// Tema claro/escuro
function toggleTheme() {
  document.body.classList.toggle("light-theme");
}

// ** RANKING FIRESTORE **

async function fetchRanking() {
  const q = query(collection(db, "ranking"), orderBy("score", "desc"), limit(10));
  const querySnapshot = await getDocs(q);

  const ranking = [];
  querySnapshot.forEach(docSnap => {
    ranking.push({ id: docSnap.id, ...docSnap.data() });
  });

  renderRanking(ranking);
}

function renderRanking(ranking) {
  rankingList.innerHTML = "";
  ranking.forEach((player, i) => {
    const li = document.createElement("li");
    li.textContent = `${i + 1}. ${player.name} - ${formatNumber(player.score)}`;
    rankingList.appendChild(li);
  });
}

async function saveRank(name) {
  // Não deixa salvar se nome menor que 3 chars
  if (name.length < 3) return;

  // Verifica se o nome já existe na coleção (busca por exato)
  const rankingRef = collection(db, "ranking");

  // Busca se já existe jogador com esse nome
  const q = query(rankingRef);
  const snapshot = await getDocs(q);

  let existingDocId = null;
  let existingScore = 0;

  snapshot.forEach(docSnap => {
    if (docSnap.data().name.toLowerCase() === name.toLowerCase()) {
      existingDocId = docSnap.id;
      existingScore = docSnap.data().score;
    }
  });

  // Só salva se pontuação maior que a existente
  if (existingDocId) {
    if (clicks > existingScore) {
      const docRef = doc(db, "ranking", existingDocId);
      await setDoc(docRef, { name, score: clicks });
      rankMessage.style.color = "green";
      rankMessage.textContent = "Pontuação atualizada!";
    } else {
      rankMessage.style.color = "orange";
      rankMessage.textContent = "Você já tem uma pontuação maior salva.";
      return;
    }
  } else {
    await addDoc(rankingRef, { name, score: clicks });
    rankMessage.style.color = "green";
    rankMessage.textContent = "Pontuação salva!";
  }

  fetchRanking();
}

function updateRankingList() {
  // Atualiza ranking a cada 15 segundos
  setInterval(fetchRanking, 15000);
}

init();

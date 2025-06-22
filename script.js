// script.js - Parte 1 - Clicker Simulator Supremo Lendário

// Import Firebase (moderno)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// --- CONFIGURAÇÃO FIREBASE ---
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

// --- ESTADO DO JOGO ---
let gameState = {
  clicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,
  currentWorld: 1,
  buyAmount: 1,
  upgrades: [],
  shopItems: [],
  pets: [],
  achievements: [],
  missions: [],
  activePetId: null,
  theme: "dark",
  isSaving: false,
  isLoading: false,
  autoClickInterval: null,
  notificationTimeouts: []
};

// --- ELEMENTOS DOM ---
const $ = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);
const qsa = sel => document.querySelectorAll(sel);

// --- FORMATADORES ---
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

// --- MUNDO ---
const worlds = [
  { id: 1, name: "Jardim Inicial", description: "O começo da sua jornada." },
  { id: 2, name: "Cidade Neon", description: "Luzes vibrantes e desafios novos." },
  { id: 3, name: "Espaço", description: "Explore o cosmos infinito." },
  { id: 4, name: "Dimensão", description: "Entre no desconhecido." }
];

// --- INICIALIZAÇÃO DOS ITENS (Exemplos) ---
function initGameData() {
  // Upgrades Exemplo
  gameState.upgrades = [
    { id: 1, name: "Clique Duplo", description: "Dobra o ganho de clicks por clique.", cps: 0, clickBonus: 1, cost: 100, quantity: 0, unlocked: true },
    { id: 2, name: "Mão Rápida", description: "Aumenta o CPS em 2.", cps: 2, clickBonus: 0, cost: 500, quantity: 0, unlocked: false },
    { id: 3, name: "Robô Autoclick", description: "Clique automático a cada segundo.", cps: 10, clickBonus: 0, cost: 5000, quantity: 0, unlocked: false },
    { id: 4, name: "Click Explosivo", description: "Aumenta o ganho de clicks por clique em 5.", cps: 0, clickBonus: 5, cost: 2000, quantity: 0, unlocked: false }
  ];

  // Loja Exemplo
  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra o CPS por 5 minutos.", effects: "Multiplicador 2x CPS", cost: 3000, owned: false, type: "boost", duration: 300 },
    { id: 2, name: "Multiplicador x5", description: "Multiplica o CPS por 5 durante 30 segundos.", effects: "Multiplicador 5x CPS", cost: 8000, owned: false, type: "boost", duration: 30 },
    { id: 3, name: "Skin Neon", description: "Uma skin especial para seu botão.", effects: "Visual único", cost: 10000, owned: false, type: "skin" }
  ];

  // Pets Exemplo
  gameState.pets = [
    { id: 1, name: "Cachorrinho", rarity: "Comum", bonusPercent: 5, image: "assets/pets/dog.png" },
    { id: 2, name: "Dragão", rarity: "Épico", bonusPercent: 20, image: "assets/pets/dragon.png" },
    { id: 3, name: "Robô", rarity: "Raro", bonusPercent: 15, image: "assets/pets/robot.png" }
  ];

  // Missões Exemplo
  gameState.missions = [
    { id: 1, title: "Clique 100 vezes", description: "Realize 100 clicks manuais.", goal: 100, progress: 0, reward: 500, completed: false, type: "daily" },
    { id: 2, title: "Compre 5 upgrades", description: "Adquira 5 upgrades diferentes.", goal: 5, progress: 0, reward: 1000, completed: false, type: "weekly" },
    { id: 3, title: "Alcance o nível 10", description: "Suba para o nível 10.", goal: 10, progress: 0, reward: 2000, completed: false, type: "special" }
  ];

  // Conquistas Exemplo
  gameState.achievements = [
    { id: 1, name: "Iniciante", description: "Complete seu primeiro click.", unlocked: false, progress: 0, goal: 1 },
    { id: 2, name: "Explorador", description: "Troque de mundo pela primeira vez.", unlocked: false, progress: 0, goal: 1 },
    { id: 3, name: "Rebirther", description: "Faça seu primeiro rebirth.", unlocked: false, progress: 0, goal: 1 }
  ];
}

// --- CÁLCULOS DE CPS ---
function calculateCPS() {
  let baseCPS = 0;
  gameState.upgrades.forEach(upg => {
    baseCPS += upg.cps * upg.quantity;
  });

  // Bônus pet
  let petBonus = 0;
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) petBonus = pet.bonusPercent;
  }

  // Bônus loja
  let shopMultiplier = 1;
  const hasX5 = gameState.shopItems.find(i => i.name.includes("x5") && i.owned);
  const hasX2 = gameState.shopItems.find(i => i.name.includes("x2") && i.owned);
  if (hasX5) shopMultiplier *= 5;
  else if (hasX2) shopMultiplier *= 2;

  const totalMultiplier = 1 + (petBonus / 100);
  return baseCPS * totalMultiplier * shopMultiplier;
}

// --- FUNÇÃO PARA FORMATAR CUSTOS ---
function formatCost(cost) {
  return formatNumber(cost);
}

// --- EXIBIÇÃO ---
function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("cpsDisplay").textContent = formatNumber(calculateCPS());
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${worlds.find(w => w.id === gameState.currentWorld)?.name || "???"}`;

  // Barra XP
  const xpPercent = Math.min(100, (gameState.xp / gameState.xpToNext) * 100);
  const xpBarFill = $("xpProgressFill");
  if (xpBarFill) {
    xpBarFill.style.width = `${xpPercent}%`;
    xpBarFill.setAttribute("aria-valuenow", xpPercent.toFixed(2));
    $("xpPercentLabel").textContent = `${xpPercent.toFixed(1)}% de XP para o próximo nível`;
  }
}

// --- GANHAR XP ---
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Você subiu para o nível ${gameState.level}! 🎉`);
  }
}

// --- GANHAR CLICKS ---
function gainClicks(amount) {
  const petBonusMultiplier = gameState.activePetId ? (1 + (gameState.pets.find(p => p.id === gameState.activePetId)?.bonusPercent || 0) / 100) : 1;
  gameState.clicks += amount * petBonusMultiplier;
  gainXP(amount * 5);
  updateDisplay();
  updateMissionsProgress("clicks", amount);
  updateAchievementsProgress("clicks", amount);
}

// --- EVENTO CLICK DO BOTÃO ---
$("clickBtn").onclick = () => {
  gainClicks(1);
  animateClickEffect();
  playSound("click");
};

// --- CPS AUTOMÁTICO ---
function startAutoClick() {
  if (gameState.autoClickInterval) clearInterval(gameState.autoClickInterval);
  gameState.autoClickInterval = setInterval(() => {
    const cps = calculateCPS();
    gainClicks(cps);
  }, 1000);
}

// --- FUNÇÃO PARA SALVAR ESTADO NO LOCALSTORAGE ---
function saveGame() {
  if (gameState.isSaving) return; // evita salvamentos paralelos
  gameState.isSaving = true;

  const saveData = {
    clicks: gameState.clicks,
    level: gameState.level,
    xp: gameState.xp,
    xpToNext: gameState.xpToNext,
    rebirths: gameState.rebirths,
    currentWorld: gameState.currentWorld,
    buyAmount: gameState.buyAmount,
    upgrades: gameState.upgrades,
    shopItems: gameState.shopItems,
    pets: gameState.pets,
    achievements: gameState.achievements,
    missions: gameState.missions,
    activePetId: gameState.activePetId,
    theme: gameState.theme
  };

  try {
    localStorage.setItem("clickerSave", JSON.stringify(saveData));
    showNotification("Jogo salvo com sucesso!");
  } catch (e) {
    console.error("Erro ao salvar:", e);
    showNotification("Erro ao salvar o jogo.", true);
  }
  gameState.isSaving = false;
}

// --- FUNÇÃO PARA CARREGAR ESTADO ---
function loadGame() {
  if (gameState.isLoading) return;
  gameState.isLoading = true;
  const saved = localStorage.getItem("clickerSave");
  if (!saved) {
    initGameData();
    updateDisplay();
    startAutoClick();
    gameState.isLoading = false;
    return;
  }

  try {
    const data = JSON.parse(saved);
    Object.assign(gameState, data);
  } catch (e) {
    console.warn("Erro ao carregar save:", e);
    initGameData();
  }
  updateDisplay();
  startAutoClick();
  gameState.isLoading = false;
}

// --- FUNÇÃO PARA RESETAR JOGO ---
function resetGame(confirmReset = true) {
  if (confirmReset) {
    if (!confirm("Tem certeza que deseja resetar o jogo? Isso apagará seu progresso.")) return;
  }
  localStorage.removeItem("clickerSave");
  gameState = {
    clicks: 0,
    cps: 0,
    level: 1,
    xp: 0,
    xpToNext: 100,
    rebirths: 0,
    currentWorld: 1,
    buyAmount: 1,
    upgrades: [],
    shopItems: [],
    pets: [],
    achievements: [],
    missions: [],
    activePetId: null,
    theme: "dark",
    isSaving: false,
    isLoading: false,
    autoClickInterval: null,
    notificationTimeouts: []
  };
  initGameData();
  updateDisplay();
  startAutoClick();
  showNotification("Jogo resetado com sucesso.");
}

// --- FUNÇÃO DE TROCAR DE MUNDO ---
function changeWorld() {
  gameState.currentWorld++;
  if (gameState.currentWorld > worlds.length) gameState.currentWorld = 1;
  updateDisplay();
  showNotification(`Você entrou no mundo: ${worlds[gameState.currentWorld - 1].name}`);
  updateMissionsProgress("worldChange", 1);
  updateAchievementsProgress("worldChange", 1);
}

// --- NOTIFICAÇÕES VISUAIS ---
function showNotification(message, isError = false, duration = 3500) {
  const area = $("notificationArea");
  if (!area) return;

  const notif = document.createElement("div");
  notif.className = "notification " + (isError ? "error" : "info");
  notif.textContent = message;
  area.appendChild(notif);

  setTimeout(() => {
    notif.classList.add("fade-out");
  }, duration - 500);

  setTimeout(() => {
    area.removeChild(notif);
  }, duration);
}

// --- SONS ---
const sounds = {};
function loadSounds() {
  sounds.click = new Audio("assets/sounds/click.mp3");
  sounds.purchase = new Audio("assets/sounds/purchase.mp3");
  sounds.levelUp = new Audio("assets/sounds/levelup.mp3");
  sounds.error = new Audio("assets/sounds/error.mp3");
}
function playSound(name) {
  if (!sounds[name]) return;
  sounds[name].currentTime = 0;
  sounds[name].play();
}

// --- ANIMAÇÕES DE CLIQUE ---
function animateClickEffect() {
  // Cria um círculo que desaparece no clique
  const btn = $("clickBtn");
  const circle = document.createElement("span");
  circle.className = "click-effect";
  btn.appendChild(circle);
  setTimeout(() => btn.removeChild(circle), 500);
}

// --- FILTRAGEM E BUSCA DE UPGRADES ---
function filterUpgrades(searchText = "", filterType = "all") {
  const container = $("upgradesList");
  container.innerHTML = "";
  const filtered = gameState.upgrades.filter(upg => {
    const matchSearch = upg.name.toLowerCase().includes(searchText.toLowerCase()) || upg.description.toLowerCase().includes(searchText.toLowerCase());
    const matchType = filterType === "all" || (filterType === "cps" && upg.cps > 0) || (filterType === "clicks" && upg.clickBonus > 0) || (filterType === "special" && upg.cps === 0 && upg.clickBonus === 0);
    return matchSearch && matchType;
  });

  filtered.forEach(upg => {
    const card = document.createElement("div");
    card.className = "upgrade-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("aria-label", `Upgrade: ${upg.name} custa ${formatCost(upg.cost)}`);
    card.innerHTML = `
      <div class="upgrade-info">
        <h3>${upg.name}</h3>
        <p>${upg.description}</p>
        <p>+${upg.cps} CPS | +${upg.clickBonus} clicks por clique</p>
        <p>Custo: <span class="cost-value">${formatCost(upg.cost)}</span></p>
      </div>
      <button class="btn-buy-upgrade" aria-label="Comprar upgrade ${upg.name}">Comprar</button>
    `;
    const btnBuy = card.querySelector(".btn-buy-upgrade");
    btnBuy.onclick = () => buyUpgrade(upg.id);
    container.appendChild(card);
  });
}

// --- COMPRAR UPGRADE ---
function buyUpgrade(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return showNotification("Upgrade não encontrado.", true);

  if (gameState.clicks < upg.cost) {
    showNotification("Clique insuficiente para comprar.", true);
    playSound("error");
    return;
  }
  gameState.clicks -= upg.cost;
  upg.quantity++;
  upg.cost = Math.floor(upg.cost * 1.4); // aumenta custo progressivamente
  showNotification(`Upgrade ${upg.name} comprado!`);
  playSound("purchase");
  updateDisplay();
  filterUpgrades();
  saveGame();
  startAutoClick();
  updateMissionsProgress("upgradesBought", 1);
}

// --- FILTRAGEM E BUSCA NA LOJA ---
function filterShopItems(category = "all") {
  const container = $("shopList");
  container.innerHTML = "";
  const filtered = gameState.shopItems.filter(item => category === "all" || item.type === category);

  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "shop-item-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", "false");
    card.setAttribute("aria-label", `Item: ${item.name} custa ${formatCost(item.cost)}`);
    card.innerHTML = `
      <div class="shop-item-info">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p>${item.effects || ""}</p>
        <p>Custo: <span class="cost-value">${formatCost(item.cost)}</span></p>
      </div>
      <button class="btn-buy-shop-item" aria-label="Comprar item ${item.name}">Comprar</button>
    `;
    const btnBuy = card.querySelector(".btn-buy-shop-item");
    btnBuy.onclick = () => buyShopItem(item.id);
    container.appendChild(card);
  });
}

// --- COMPRAR ITEM DA LOJA ---
function buyShopItem(id) {
  const item = gameState.shopItems.find(i => i.id === id);
  if (!item) return showNotification("Item não encontrado.", true);

  if (gameState.clicks < item.cost) {
    showNotification("Clique insuficiente para comprar item.", true);
    playSound("error");
    return;
  }
  if (item.owned) {
    showNotification("Você já possui este item.", true);
    return;
  }
  gameState.clicks -= item.cost;
  item.owned = true;

  // Aplica efeito imediato se for boost temporário
  if (item.type === "boost") applyBoost(item);

  showNotification(`Item ${item.name} comprado!`);
  playSound("purchase");
  updateDisplay();
  filterShopItems();
  saveGame();
  startAutoClick();
  updateMissionsProgress("shopItemsBought", 1);
}

// --- APLICAR BOOST DE ITENS DE LOJA ---
let activeBoosts = [];
function applyBoost(item) {
  if (!item.duration) return;

  // Se boost já ativo, reinicia tempo
  const existing = activeBoosts.find(b => b.id === item.id);
  if (existing) {
    clearTimeout(existing.timeout);
    existing.timeout = setTimeout(() => removeBoost(item.id), item.duration * 1000);
    showNotification(`Boost ${item.name} renovado por ${item.duration} segundos!`);
    return;
  }

  // Adiciona boost e ativa multiplicador no CPS
  activeBoosts.push({
    id: item.id,
    multiplier: item.name.includes("x5") ? 5 : item.name.includes("x2") ? 2 : 1,
    timeout: setTimeout(() => removeBoost(item.id), item.duration * 1000)
  });

  showNotification(`Boost ${item.name} ativado por ${item.duration} segundos!`);
}

// --- REMOVER BOOST ---
function removeBoost(id) {
  activeBoosts = activeBoosts.filter(b => b.id !== id);
  showNotification("Boost expirado.");
}

// --- CÁLCULO DE MULTIPLICADOR DO BOOST ---
function getBoostMultiplier() {
  let mult = 1;
  activeBoosts.forEach(b => {
    mult *= b.multiplier;
  });
  return mult;
}

// --- ATUALIZAR PETS ---
function updatePetsDisplay() {
  const container = $("petsList");
  container.innerHTML = "";
  gameState.pets.forEach(pet => {
    const card = document.createElement("div");
    card.className = "pet-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-pressed", gameState.activePetId === pet.id ? "true" : "false");
    card.setAttribute("aria-label", `Pet ${pet.name} com bônus ${pet.bonusPercent}%`);
    card.innerHTML = `
      <img src="${pet.image}" alt="Pet ${pet.name}" class="pet-image" />
      <div class="pet-info">
        <h3>${pet.name}</h3>
        <p>Raridade: ${pet.rarity}</p>
        <p>Bônus: +${pet.bonusPercent}% clicks por segundo</p>
      </div>
      <button class="btn-select-pet" aria-label="Selecionar pet ${pet.name}">${gameState.activePetId === pet.id ? "Selecionado" : "Selecionar"}</button>
    `;
    card.querySelector(".btn-select-pet").onclick = () => selectPet(pet.id);
    container.appendChild(card);
  });
}

// --- SELECIONAR PET ---
function selectPet(id) {
  if (gameState.activePetId === id) {
    gameState.activePetId = null;
    showNotification("Pet desativado.");
  } else {
    gameState.activePetId = id;
    showNotification(`Pet ${gameState.pets.find(p => p.id === id).name} ativado.`);
  }
  updatePetsDisplay();
  updateDisplay();
  saveGame();
}

// --- ATUALIZAR MISSÕES ---
function updateMissionsDisplay() {
  const container = $("missionsList");
  container.innerHTML = "";
  gameState.missions.forEach(mission => {
    const div = document.createElement("div");
    div.className = "mission-item";
    div.tabIndex = 0;
    div.setAttribute("aria-pressed", mission.completed ? "true" : "false");
    div.setAttribute("aria-label", `Missão ${mission.title} progresso ${mission.progress} de ${mission.goal}`);
    div.innerHTML = `
      <h3>${mission.title}</h3>
      <p>${mission.description}</p>
      <progress max="${mission.goal}" value="${mission.progress}"></progress>
      <button class="btn-claim-mission" ${mission.completed ? "disabled" : ""}>${mission.completed ? "Reclamado" : "Reclamar"}</button>
    `;
    const btn = div.querySelector(".btn-claim-mission");
    btn.onclick = () => claimMission(mission.id);
    container.appendChild(div);
  });
}

// --- ATUALIZAR PROGRESSO DAS MISSÕES ---
function updateMissionsProgress(type, amount = 1) {
  gameState.missions.forEach(mission => {
    if (mission.completed) return;
    switch (type) {
      case "clicks":
        if (mission.title.toLowerCase().includes("clique")) {
          mission.progress += amount;
          if (mission.progress >= mission.goal) {
            mission.progress = mission.goal;
            mission.completed = true;
            showNotification(`Missão "${mission.title}" concluída!`);
          }
        }
        break;
      case "upgradesBought":
        if (mission.title.toLowerCase().includes("upgrade")) {
          mission.progress += amount;
          if (mission.progress >= mission.goal) {
            mission.progress = mission.goal;
            mission.completed = true;
            showNotification(`Missão "${mission.title}" concluída!`);
          }
        }
        break;
      case "shopItemsBought":
        if (mission.title.toLowerCase().includes("loja")) {
          mission.progress += amount;
          if (mission.progress >= mission.goal) {
            mission.progress = mission.goal;
            mission.completed = true;
            showNotification(`Missão "${mission.title}" concluída!`);
          }
        }
        break;
      case "worldChange":
        if (mission.title.toLowerCase().includes("mundo")) {
          mission.progress += amount;
          if (mission.progress >= mission.goal) {
            mission.progress = mission.goal;
            mission.completed = true;
            showNotification(`Missão "${mission.title}" concluída!`);
          }
        }
        break;
      default:
        break;
    }
  });
  updateMissionsDisplay();
  saveGame();
}

// --- RECLAMAR RECOMPENSA MISSÃO ---
function claimMission(id) {
  const mission = gameState.missions.find(m => m.id === id);
  if (!mission) return;
  if (!mission.completed) {
    showNotification("Missão não concluída ainda.", true);
    return;
  }
  if (mission.rewardClaimed) {
    showNotification("Recompensa já foi reclamada.", true);
    return;
  }
  gameState.clicks += mission.reward;
  mission.rewardClaimed = true;
  showNotification(`Recompensa de ${formatNumber(mission.reward)} clicks recebida!`);
  updateDisplay();
  saveGame();
}

// --- ATUALIZAR CONQUISTAS ---
function updateAchievementsDisplay() {
  const container = $("achievementsList");
  container.innerHTML = "";
  gameState.achievements.forEach(ach => {
    const div = document.createElement("div");
    div.className = "achievement-item " + (ach.unlocked ? "unlocked" : "");
    div.tabIndex = 0;
    div.setAttribute("aria-label", `Conquista ${ach.name} - ${ach.unlocked ? "Desbloqueada" : "Bloqueada"}`);
    div.innerHTML = `
      <h3>${ach.name}</h3>
      <p>${ach.description}</p>
      <p>Status: ${ach.unlocked ? "Desbloqueada" : "Bloqueada"}</p>
    `;
    container.appendChild(div);
  });
}

// --- ATUALIZAR PROGRESSO DAS CONQUISTAS ---
function updateAchievementsProgress(type, amount = 1) {
  gameState.achievements.forEach(ach => {
    if (ach.unlocked) return;
    switch (type) {
      case "clicks":
        if (ach.name.toLowerCase().includes("inici")) {
          ach.progress += amount;
          if (ach.progress >= ach.goal) {
            ach.unlocked = true;
            showNotification(`Conquista "${ach.name}" desbloqueada!`);
          }
        }
        break;
      case "worldChange":
        if (ach.name.toLowerCase().includes("explorador")) {
          ach.progress += amount;
          if (ach.progress >= ach.goal) {
            ach.unlocked = true;
            showNotification(`Conquista "${ach.name}" desbloqueada!`);
          }
        }
        break;
      case "rebirth":
        if (ach.name.toLowerCase().includes("rebirth")) {
          ach.progress += amount;
          if (ach.progress >= ach.goal) {
            ach.unlocked = true;
            showNotification(`Conquista "${ach.name}" desbloqueada!`);
          }
        }
        break;
      default:
        break;
    }
  });
  updateAchievementsDisplay();
  saveGame();
}

// --- SALVAR RANKING NO FIREBASE ---
function saveRanking() {
  const nameInput = $("playerNameInput");
  const name = nameInput.value.trim();
  if (!name || name.length < 3) {
    showNotification("Digite um nome válido com pelo menos 3 caracteres.", true);
    return;
  }

  const rankRef = push(ref(db, "ranking"));
  set(rankRef, { name, score: Math.floor(gameState.clicks) })
    .then(() => {
      showNotification("Score salvo com sucesso!");
      nameInput.value = "";
    })
    .catch(() => showNotification("Erro ao salvar score.", true));
}

// --- CARREGAR RANKING DO FIREBASE ---
function loadRanking() {
  const list = $("rankingList");
  list.innerHTML = "<p>Carregando ranking...</p>";
  onValue(ref(db, "ranking"), snapshot => {
    const data = [];
    snapshot.forEach(child => {
      data.push(child.val());
    });
    const sorted = data.sort((a, b) => b.score - a.score).slice(0, 10);
    if (sorted.length === 0) {
      list.innerHTML = "<p>Nenhum dado encontrado.</p>";
      return;
    }
    list.innerHTML = sorted.map((e, i) =>
      `<div class="ranking-item" aria-label="#${i + 1} ${e.name}: ${formatNumber(e.score)} clicks">
      <span class="rank-position">#${i + 1}</span>
      <span class="rank-name">${e.name}</span>
      <span class="rank-score">${formatNumber(e.score)}</span>
    </div>`).join("");
  });
}

// --- TOGGLE TEMA CLARO/ESCURO ---
function toggleTheme() {
  if (gameState.theme === "dark") {
    document.body.classList.add("light-theme");
    gameState.theme = "light";
    $("toggleTheme").textContent = "☀️";
  } else {
    document.body.classList.remove("light-theme");
    gameState.theme = "dark";
    $("toggleTheme").textContent = "🌙";
  }
  saveGame();
}

// --- EVENTOS DE CONTROLE ---
function setupEvents() {
  $("toggleTheme").onclick = toggleTheme;
  $("clickBtn").onclick = () => {
    gainClicks(1);
    animateClickEffect();
    playSound("click");
  };
  $("saveScoreBtn").onclick = saveRanking;
  $("resetBtn")?.addEventListener("click", () => resetGame(true));
  $("changeWorldBtn")?.addEventListener("click", changeWorld);

  // Filtros upgrades
  $("upgradeSearch")?.addEventListener("input", e => filterUpgrades(e.target.value));
  $("upgradeFilter")?.addEventListener("change", e => filterUpgrades($("upgradeSearch")?.value || "", e.target.value));

  // Filtros loja
  $("shopFilter")?.addEventListener("change", e => filterShopItems(e.target.value));

  window.addEventListener("beforeunload", saveGame);
  window.addEventListener("load", () => {
    loadGame();
    loadRanking();
    filterUpgrades();
    filterShopItems();
    updatePetsDisplay();
    updateMissionsDisplay();
    updateAchievementsDisplay();
    startAutoClick();
    loadSounds();
  });
}

// --- INICIALIZAÇÃO ---
initGameData();
setupEvents();

// script.js - Parte 2 - Clicker Simulator Supremo Lendário

// --- CONTROLE DE REBIRTHS (Prestígio) ---
function canRebirth() {
  // Exemplo: precisa nível 20 e 1 milhão de clicks
  return gameState.level >= 20 && gameState.clicks >= 1_000_000;
}

function doRebirth() {
  if (!canRebirth()) {
    showNotification("Você ainda não pode fazer Rebirth.", true);
    return;
  }
  gameState.rebirths++;
  // Reset parcial, mantendo upgrades e pets mas resetando clicks, xp e nível
  gameState.clicks = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.currentWorld = 1;
  // Opcional: resetar upgrades e loja ou não, depende do design
  //gameState.upgrades.forEach(u => { u.quantity = 0; u.cost = Math.floor(u.cost / Math.pow(1.4, u.quantity)); });
  //gameState.shopItems.forEach(i => i.owned = false);
  showNotification(`Rebirth realizado! Você tem ${gameState.rebirths} rebirth(s).`);
  updateDisplay();
  saveGame();
}

// --- BARRA DE XP ANIMADA ---
function animateXPBar() {
  const xpFill = $("xpProgressFill");
  if (!xpFill) return;
  const xpPercent = Math.min(100, (gameState.xp / gameState.xpToNext) * 100);
  xpFill.style.transition = "width 0.8s ease-in-out";
  xpFill.style.width = `${xpPercent}%`;
}

// --- SISTEMA DE UNIDADES ABREVIADAS PARA CLICKS ---
function abbreviateNumber(value) {
  const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let suffixIndex = 0;
  while (value >= 1000 && suffixIndex < suffixes.length - 1) {
    value /= 1000;
    suffixIndex++;
  }
  return value.toFixed(2) + suffixes[suffixIndex];
}

// --- SALVAR E CARREGAR LOCAL STORAGE AUTOMÁTICO (SAVE INTERVAL) ---
let autoSaveInterval = null;
function startAutoSave() {
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(() => {
    saveGame();
  }, 30000); // salva a cada 30 segundos
}

// --- DESABILITA BOTÕES SE N TEM CLICK ---
function disableButtonsIfNoClicks() {
  const buyBtns = document.querySelectorAll(".btn-buy-upgrade, .btn-buy-shop-item");
  buyBtns.forEach(btn => {
    const cost = parseInt(btn.parentElement.querySelector(".cost-value")?.textContent.replace(/[^\d]/g, "") || "0");
    btn.disabled = gameState.clicks < cost;
  });
}

// --- SISTEMA DE SOM CONFIGURÁVEL ---
let soundEnabled = true;
function toggleSound() {
  soundEnabled = !soundEnabled;
  $("soundToggle").textContent = soundEnabled ? "🔊" : "🔇";
  saveGame();
}
function playSoundSafe(name) {
  if (soundEnabled) playSound(name);
}

// --- SISTEMA DE NOTIFICAÇÕES AVANÇADO ---
function clearAllNotifications() {
  const area = $("notificationArea");
  if (!area) return;
  area.innerHTML = "";
  gameState.notificationTimeouts.forEach(t => clearTimeout(t));
  gameState.notificationTimeouts = [];
}

// --- ANIMAÇÕES DE PARTICULAS AO CLICAR ---
function createParticleEffect(x, y) {
  const particleContainer = $("particleContainer");
  if (!particleContainer) return;

  for (let i = 0; i < 10; i++) {
    const particle = document.createElement("div");
    particle.className = "particle";
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.animationDuration = `${Math.random() * 0.8 + 0.5}s`;
    particleContainer.appendChild(particle);

    particle.addEventListener("animationend", () => {
      particleContainer.removeChild(particle);
    });
  }
}

// --- EVENTO CLIQUE COM PARTICULAS ---
$("clickBtn").addEventListener("click", e => {
  const rect = e.target.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  createParticleEffect(x, y);
});

// --- SISTEMA DE TUTORIAL SIMPLES ---
let tutorialStep = 0;
function showTutorial() {
  const tutorialBox = $("tutorialBox");
  if (!tutorialBox) return;

  const steps = [
    "Bem-vindo ao Clicker Simulator! Clique no botão para ganhar clicks.",
    "Compre upgrades para aumentar seus clicks por segundo.",
    "Explore a loja para boosts e skins incríveis.",
    "Adquira pets para bônus adicionais.",
    "Complete missões para ganhar recompensas extras.",
    "Faça rebirths para resetar e ganhar benefícios.",
    "Salve seu progresso online com ranking e compete com outros players.",
    "Divirta-se e clique bastante!"
  ];

  if (tutorialStep >= steps.length) {
    tutorialBox.style.display = "none";
    return;
  }

  tutorialBox.textContent = steps[tutorialStep];
  tutorialBox.style.display = "block";
}

function nextTutorialStep() {
  tutorialStep++;
  showTutorial();
}

// --- BOTÃO PARA AVANÇAR TUTORIAL ---
$("tutorialNextBtn")?.addEventListener("click", () => {
  nextTutorialStep();
});

// --- FUNÇÃO PARA EXPORTAR JOGO EM JSON ---
function exportSave() {
  const data = localStorage.getItem("clickerSave");
  if (!data) {
    showNotification("Nada para exportar.", true);
    return;
  }
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "clicker_save.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showNotification("Save exportado com sucesso.");
}

// --- FUNÇÃO PARA IMPORTAR SAVE JSON ---
function importSave(file) {
  if (!file) {
    showNotification("Nenhum arquivo selecionado.", true);
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      localStorage.setItem("clickerSave", JSON.stringify(data));
      loadGame();
      showNotification("Save importado com sucesso.");
    } catch {
      showNotification("Arquivo inválido.", true);
    }
  };
  reader.readAsText(file);
}

// --- INICIALIZAÇÃO E SETUP COMPLETO ---
function setupComplete() {
  // Botões e inputs extras
  $("resetBtn")?.addEventListener("click", () => resetGame(true));
  $("rebirthBtn")?.addEventListener("click", doRebirth);
  $("soundToggle")?.addEventListener("click", toggleSound);
  $("exportSaveBtn")?.addEventListener("click", exportSave);
  $("importSaveInput")?.addEventListener("change", e => importSave(e.target.files[0]));
  $("tutorialNextBtn")?.addEventListener("click", nextTutorialStep);
  $("changeWorldBtn")?.addEventListener("click", changeWorld);

  // Atualizações periódicas
  setInterval(() => {
    updateDisplay();
    animateXPBar();
    disableButtonsIfNoClicks();
  }, 1000);

  // Começa tutorial
  showTutorial();

  // Começa autosave
  startAutoSave();

  // Outros setups que quiser
}

// --- CHAMADAS INICIAIS ---
window.addEventListener("load", () => {
  loadGame();
  loadRanking();
  filterUpgrades();
  filterShopItems();
  updatePetsDisplay();
  updateMissionsDisplay();
  updateAchievementsDisplay();
  setupComplete();
  startAutoClick();
  loadSounds();
});

// =================== Importações Firebase ===================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// =================== Configuração Firebase ===================
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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =================== Estado do jogo ===================
let gameState = {
  clicks: 0,
  totalClicks: 0,
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
  audio: {
    musicVolume: 0.5,
    effectsVolume: 0.7,
    musicPlaying: false
  },
  tutorialShown: false
};

// =================== Utilitários DOM ===================
const $ = id => document.getElementById(id);
const createElement = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const key in attrs) {
    if (key === "className") el.className = attrs[key];
    else if (key.startsWith("aria")) el.setAttribute(key, attrs[key]);
    else if (key === "dataset") {
      for (const dataKey in attrs[key]) {
        el.dataset[dataKey] = attrs[key][dataKey];
      }
    }
    else el.setAttribute(key, attrs[key]);
  }
  children.forEach(child => {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
};

// =================== Formatação de números ===================
function formatNumber(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

// =================== Nome dos mundos ===================
function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

// =================== Inicialização dos dados ===================
function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
    // +5 novos upgrades:
    { id: 4, name: "Mega Cursor", description: "Gera 150 clicks por segundo", cps: 150, quantity: 0, basePrice: 3000 },
    { id: 5, name: "Clicker Turbo", description: "Gera 500 clicks por segundo", cps: 500, quantity: 0, basePrice: 10000 },
    { id: 6, name: "Clicker Supremo", description: "Gera 2000 clicks por segundo", cps: 2000, quantity: 0, basePrice: 50000 },
    { id: 7, name: "Robô Alpha", description: "Gera 10000 clicks por segundo", cps: 10000, quantity: 0, basePrice: 150000 },
    { id: 8, name: "Clicker Final", description: "Gera 50000 clicks por segundo", cps: 50000, quantity: 0, basePrice: 500000 }
  ];

  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra sua produção por 5 minutos", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla sua produção por 2 minutos", owned: false, price: 5000, effectDuration: 120000 },
  ];

  gameState.pets = [
    { id: 1, name: "Gato Clicker", bonusPercent: 5, owned: false },
    { id: 2, name: "Cachorro Robótico", bonusPercent: 15, owned: false },
    { id: 3, name: "Dragão Cibernético", bonusPercent: 30, owned: false },
  ];

  gameState.missions = [
    { id: 1, description: "Clique 100 vezes", goal: 100, progress: 0, rewardXP: 50, completed: false },
    { id: 2, description: "Compre 5 upgrades", goal: 5, progress: 0, rewardXP: 100, completed: false },
    { id: 3, description: "Faça 1 rebirth", goal: 1, progress: 0, rewardXP: 500, completed: false },
  ];

  gameState.achievements = [
    { id: 1, name: "Primeiro Click", description: "Realize seu primeiro click", achieved: false },
    { id: 2, name: "Novato", description: "Alcance nível 10", achieved: false },
    { id: 3, name: "Profissional", description: "Alcance 1000 clicks", achieved: false },
    { id: 4, name: "Veterano", description: "Realize 10 rebirths", achieved: false },
  ];
}

// =================== Salvar estado ===================
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
  } catch (err) {
    console.error("Erro ao salvar:", err);
  }
}

// =================== Carregar estado ===================
function loadGame() {
  const saveData = localStorage.getItem("clickerSave");
  if (saveData) {
    try {
      const parsed = JSON.parse(saveData);
      Object.assign(gameState, parsed);

      // Corrigir arrays para não perder métodos se vierem do localStorage
      if (!gameState.upgrades || !Array.isArray(gameState.upgrades)) initGameData();
      if (!gameState.shopItems || !Array.isArray(gameState.shopItems)) initGameData();
      if (!gameState.pets || !Array.isArray(gameState.pets)) initGameData();
      if (!gameState.missions || !Array.isArray(gameState.missions)) initGameData();
      if (!gameState.achievements || !Array.isArray(gameState.achievements)) initGameData();

    } catch (err) {
      console.error("Erro ao carregar save:", err);
      initGameData();
    }
  } else {
    initGameData();
  }
}

// =================== Atualizar display ===================
function updateDisplay() {
  if (!$("clicksDisplay")) return;

  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS());
  $("cpsStat").textContent = formatNumber(calcCPS());
  $("levelDisplay").textContent = gameState.level;
  $("levelStat").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpStat").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("rebirthsStat").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;
  $("currentWorldDisplay").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;
  $("worldStat").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;

  const activePet = gameState.pets.find(p => p.id === gameState.activePetId);
  $("activePetsStat").textContent = activePet ? activePet.name : "Nenhum";

  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateAchievementsDisplay();
  updateMissionsDisplay();
  updateRankingDisplay();
}

// =================== Calcular CPS ===================
function calcCPS() {
  let baseCPS = 0;
  gameState.upgrades.forEach(upg => {
    baseCPS += upg.cps * upg.quantity;
  });

  let multiplier = 1;
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) multiplier += pet.bonusPercent / 100;
  }

  gameState.shopItems.forEach(item => {
    if (item.owned && item.name.toLowerCase().includes("x5")) multiplier *= 5;
    else if (item.owned && item.name.toLowerCase().includes("x2")) multiplier *= 2;
  });

  return baseCPS * multiplier;
}

// =================== Ganhar XP ===================
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Parabéns! Você chegou ao nível ${gameState.level}!`, "info");
  }
}

// =================== Ganhar clicks ===================
function gainClicks(amount) {
  let gain = amount;
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  gameState.clicks += gain;
  gameState.totalClicks += gain;
  gainXP(gain * 2);
  updateMissionsProgress("clicks", gain);
  updateDisplay();
}

// =================== Atualizar progresso missões ===================
function updateMissionsProgress(type, amount) {
  gameState.missions.forEach(mission => {
    if (!mission.completed) {
      if (type === "clicks" && mission.id === 1) {
        mission.progress += amount;
        if (mission.progress >= mission.goal) {
          mission.completed = true;
          gainXP(mission.rewardXP);
          showNotification(`Missão completada: ${mission.description}`, "success");
        }
      }
      else if (type === "upgrades" && mission.id === 2) {
        const totalUpgrades = gameState.upgrades.reduce((sum, u) => sum + u.quantity, 0);
        if (totalUpgrades >= mission.goal) {
          mission.completed = true;
          gainXP(mission.rewardXP);
          showNotification(`Missão completada: ${mission.description}`, "success");
        }
      }
      else if (type === "rebirths" && mission.id === 3) {
        if (gameState.rebirths >= mission.goal) {
          mission.completed = true;
          gainXP(mission.rewardXP);
          showNotification(`Missão completada: ${mission.description}`, "success");
        }
      }
    }
  });
}

// =================== Atualizar display missões ===================
function updateMissionsDisplay() {
  const missionsList = $("missions");
  if (!missionsList) return;
  missionsList.innerHTML = "";
  gameState.missions.forEach(mission => {
    const li = createElement("li", {
      className: `mission-item ${mission.completed ? "completed" : ""}`,
      tabindex: 0,
      "aria-label": `${mission.description} - Progresso: ${Math.min(mission.progress, mission.goal)} de ${mission.goal}`
    });
    li.textContent = `${mission.description} (${Math.min(mission.progress, mission.goal)} / ${mission.goal})`;
    missionsList.appendChild(li);
  });
}

// =================== Atualizar display conquistas ===================
function updateAchievementsDisplay() {
  const achievementsList = $("achievementsList");
  if (!achievementsList) return;
  achievementsList.innerHTML = "";
  gameState.achievements.forEach(ach => {
    if (!ach.achieved && checkAchievementCriteria(ach)) {
      ach.achieved = true;
      showNotification(`Conquista desbloqueada: ${ach.name}`, "success");
    }
    const li = createElement("li", {
      className: `achievement-item ${ach.achieved ? "achieved" : ""}`,
      tabindex: 0,
      "aria-label": `${ach.name} - ${ach.description}`
    });
    li.textContent = ach.name + (ach.achieved ? " ✔" : "");
    achievementsList.appendChild(li);
  });
}

// =================== Checar critérios conquistas ===================
function checkAchievementCriteria(achievement) {
  switch (achievement.id) {
    case 1: // Primeiro Click
      return gameState.totalClicks > 0;
    case 2: // Nível 10
      return gameState.level >= 10;
    case 3: // 1000 clicks
      return gameState.totalClicks >= 1000;
    case 4: // 10 rebirths
      return gameState.rebirths >= 10;
    default:
      return false;
  }
}

// =================== Atualizar display upgrades ===================
function updateUpgradesDisplay() {
  const upgradesContainer = $("upgrades");
  if (!upgradesContainer) return;
  upgradesContainer.innerHTML = "";

  gameState.upgrades.forEach(upg => {
    const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    const upgDiv = createElement("div", { className: "upgrade-item" });
    const nameEl = createElement("h4", {}, upg.name);
    const descEl = createElement("p", {}, upg.description);
    const qtyEl = createElement("p", {}, `Quantidade: ${upg.quantity}`);
    const priceEl = createElement("p", {}, `Preço: ${formatNumber(price)}`);

    const buyBtn = createElement("button", {
      className: "buy-btn",
      "aria-label": `Comprar upgrade ${upg.name} por ${formatNumber(price)} clicks`
    }, "Comprar");

    buyBtn.disabled = gameState.clicks < price;
    buyBtn.addEventListener("click", () => buyUpgrade(upg.id, price));

    upgDiv.append(nameEl, descEl, qtyEl, priceEl, buyBtn);
    upgradesContainer.appendChild(upgDiv);
  });
}

// =================== Comprar upgrade ===================
function buyUpgrade(id, price) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return;
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upg.quantity++;
    updateMissionsProgress("upgrades", 1);
    showNotification(`Upgrade comprado: ${upg.name}`, "success");
    updateDisplay();
    saveGame();
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

// =================== Atualizar display loja ===================
function updateShopDisplay() {
  const shopContainer = $("shopList");
  if (!shopContainer) return;
  shopContainer.innerHTML = "";

  gameState.shopItems.forEach(item => {
    const itemDiv = createElement("div", { className: "shop-item" });
    const nameEl = createElement("h4", {}, item.name);
    const descEl = createElement("p", {}, item.description);
    const priceEl = createElement("p", {}, `Preço: ${formatNumber(item.price)}`);
    const buyBtn = createElement("button", {
      className: "buy-btn",
      "aria-label": `Comprar item ${item.name} por ${formatNumber(item.price)} clicks`
    }, item.owned ? "Comprado" : "Comprar");

    buyBtn.disabled = item.owned || gameState.clicks < item.price;

    buyBtn.addEventListener("click", () => {
      if (!item.owned && gameState.clicks >= item.price) {
        gameState.clicks -= item.price;
        item.owned = true;
        showNotification(`Item comprado: ${item.name}`, "success");
        updateDisplay();
        saveGame();
      }
    });

    itemDiv.append(nameEl, descEl, priceEl, buyBtn);
    shopContainer.appendChild(itemDiv);
  });
}

// =================== Atualizar display pets ===================
function updatePetsDisplay() {
  const petsContainer = $("pets");
  if (!petsContainer) return;
  petsContainer.innerHTML = "";

  gameState.pets.forEach(pet => {
    const petDiv = createElement("div", { className: "pet-item" });
    const nameEl = createElement("h4", {}, pet.name);
    const bonusEl = createElement("p", {}, `Bônus: ${pet.bonusPercent}% clicks`);
    const ownedEl = createElement("p", {}, pet.owned ? "Obtido" : "Não obtido");
    const selectBtn = createElement("button", {
      className: "select-btn",
      disabled: !pet.owned,
      "aria-label": `Selecionar pet ${pet.name}`
    }, gameState.activePetId === pet.id ? "Selecionado" : "Selecionar");

    selectBtn.addEventListener("click", () => {
      if (pet.owned) {
        gameState.activePetId = pet.id;
        showNotification(`Pet selecionado: ${pet.name}`, "info");
        updateDisplay();
        saveGame();
      }
    });

    petDiv.append(nameEl, bonusEl, ownedEl, selectBtn);
    petsContainer.appendChild(petDiv);
  });
}

// =================== Mostrar notificações ===================
function showNotification(message, type = "info") {
  const notif = $("notification");
  if (!notif) return;
  notif.textContent = message;
  notif.className = `notification ${type}`;
  notif.style.opacity = "1";
  setTimeout(() => {
    notif.style.opacity = "0";
  }, 3000);
}

// =================== Evento clique no botão principal ===================
$("clickBtn")?.addEventListener("click", () => {
  gainClicks(1);
});

// =================== Atualizar ranking ===================
function updateRankingDisplay() {
  const rankingList = $("rankingList");
  if (!rankingList) return;

  // Limpa ranking antes de preencher
  rankingList.innerHTML = "";

  const dbRef = ref(db, "ranking");
  const rankingQuery = query(dbRef, orderByChild("clicks"), limitToLast(10));

  get(rankingQuery).then(snapshot => {
    if (!snapshot.exists()) {
      rankingList.textContent = "Nenhum dado no ranking.";
      return;
    }

    let players = [];
    snapshot.forEach(childSnap => {
      players.push(childSnap.val());
    });

    // Ordenar decrescente
    players.sort((a, b) => b.clicks - a.clicks);

    players.forEach(player => {
      const li = createElement("li", {}, `${player.name || "Anônimo"}: ${formatNumber(player.clicks)} clicks`);
      rankingList.appendChild(li);
    });
  }).catch(err => {
    console.error("Erro ao buscar ranking:", err);
  });
}

// =================== Enviar nome para ranking ===================
$("sendNameBtn")?.addEventListener("click", () => {
  const nameInput = $("playerName");
  if (!nameInput) return;
  const playerName = nameInput.value.trim();
  if (playerName.length === 0) {
    showNotification("Digite um nome válido!", "error");
    return;
  }

  const dbRef = ref(db, "ranking");
  push(dbRef).then(() => {
    const newEntryRef = push(dbRef);
    return set(newEntryRef, {
      name: playerName,
      clicks: gameState.totalClicks,
      level: gameState.level,
      rebirths: gameState.rebirths,
      timestamp: Date.now()
    });
  }).then(() => {
    showNotification("Nome enviado para o ranking!", "success");
    nameInput.value = "";
    updateRankingDisplay();
  }).catch(err => {
    console.error("Erro ao enviar nome:", err);
    showNotification("Erro ao enviar nome.", "error");
  });
});

// =================== Auto save a cada 5 segundos ===================
setInterval(() => {
  saveGame();
  updateDisplay();
}, 5000);

// =================== Inicialização do jogo ===================
function init() {
  loadGame();
  updateDisplay();
}

init();

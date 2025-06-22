// === Importações Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Config Firebase ===
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

// === Utilitários ===
const $ = id => document.getElementById(id);
const createEl = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const k in attrs) {
    if (k === "className") el.className = attrs[k];
    else if (k.startsWith("aria")) el.setAttribute(k, attrs[k]);
    else if (k === "dataset") {
      for (const d in attrs[k]) el.dataset[d] = attrs[k][d];
    } else el.setAttribute(k, attrs[k]);
  }
  children.forEach(c => {
    if (typeof c === "string") el.appendChild(document.createTextNode(c));
    else if (c) el.appendChild(c);
  });
  return el;
};

function formatNumber(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  if (n < 1000) return n.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

// === Estado do jogo ===
const gameState = {
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
  lastChatTimestamp: 0,
  audio: { musicVolume: 0.5, effectsVolume: 0.7, musicPlaying: false },
  tutorialShown: false,
  currentMultiplier: 1,
  multiplierTimeout: null,
};

// === Inicializa dados do jogo ===
function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
    { id: 4, name: "Gerador de Clicks", description: "Mais clicks por segundo", cps: 150, quantity: 0, basePrice: 1500 },
    { id: 5, name: "Clicker Quântico", description: "Clicks quase infinitos", cps: 500, quantity: 0, basePrice: 10000 },
    { id: 6, name: "Mega Clicker", description: "Clicks em grande escala", cps: 2000, quantity: 0, basePrice: 40000 },
    { id: 7, name: "Clicker Supremo", description: "Clicks divinos", cps: 10000, quantity: 0, basePrice: 150000 },
    { id: 8, name: "Deus do Click", description: "Clicks que mudam o universo", cps: 50000, quantity: 0, basePrice: 800000 }
  ];

  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra produção por 5 min", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla produção por 2 min", owned: false, price: 5000, effectDuration: 120000 },
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

// === Salvar e carregar jogo automaticamente ===
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
  } catch (err) {
    console.error("Erro ao salvar:", err);
    showNotification("Falha ao salvar progresso!", "error");
  }
}

function loadGame() {
  const saveData = localStorage.getItem("clickerSave");
  if (saveData) {
    try {
      const parsed = JSON.parse(saveData);

      // Só sobrescreve arrays que existem e são válidos
      if (Array.isArray(parsed.upgrades)) gameState.upgrades = parsed.upgrades;
      if (Array.isArray(parsed.shopItems)) gameState.shopItems = parsed.shopItems;
      if (Array.isArray(parsed.pets)) gameState.pets = parsed.pets;
      if (Array.isArray(parsed.missions)) gameState.missions = parsed.missions;
      if (Array.isArray(parsed.achievements)) gameState.achievements = parsed.achievements;

      // Sobrescrever demais propriedades
      for (const key in parsed) {
        if (!(["upgrades","shopItems","pets","missions","achievements"].includes(key))) {
          gameState[key] = parsed[key];
        }
      }
      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
    }
  }
}

// === Mostrar notificações ===
const notificationEl = $("notification");
let notificationTimeout = null;
function showNotification(text, type = "info") {
  notificationEl.textContent = text;
  notificationEl.style.backgroundColor = type === "error" ? "#e74c3c" : type === "success" ? "#27ae60" : "#0f62fe";
  notificationEl.style.display = "block";
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notificationEl.style.display = "none";
  }, 3500);
}

// === Atualizar tela ===
function updateDisplay() {
  $("clicksDisplay").textContent = `Coins: ${formatNumber(gameState.clicks)}`;
  $("totalClicksStat")?.textContent = `Total Clicks: ${formatNumber(gameState.totalClicks)}`;
  $("cpsDisplay").textContent = `CPS: ${formatNumber(calcCPS() * gameState.currentMultiplier)}`;
  $("levelDisplay").textContent = `Level: ${gameState.level}`;
  $("xpDisplay").textContent = `XP: ${formatNumber(gameState.xp)}`;
  $("rebirthCount")?.textContent = `Rebirths: ${gameState.rebirths}`;
  $("currentWorld")?.textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;
}

// === Calcular CPS total incluindo upgrades e pets ===
function calcCPS() {
  let baseCPS = gameState.upgrades.reduce((sum, u) => sum + (u.cps * u.quantity), 0);
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) baseCPS *= (1 + pet.bonusPercent / 100);
  }
  return baseCPS * gameState.currentMultiplier;
}

// === Função para clicar manualmente ===
function gainClicks(amount = 1) {
  gameState.clicks += amount;
  gameState.totalClicks += amount;

  addXP(amount * 0.5);

  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();

  saveGame();
  checkMissionProgress();
}

// === XP e level up ===
function addXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.1);
    showNotification(`Você subiu para o nível ${gameState.level}!`, "success");
  }
}

// === Upgrades ===
function getUpgradePrice(upgrade) {
  return Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity));
}

function buyUpgrade(upgradeId) {
  const upg = gameState.upgrades.find(u => u.id === upgradeId);
  if (!upg) return;
  const price = getUpgradePrice(upg);
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upg.quantity++;
    showNotification(`Você comprou ${upg.name}!`, "success");
    updateDisplay();
    updateUpgradesDisplay();
    saveGame();
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

function updateUpgradesDisplay() {
  const upgradesDiv = $("upgradesList");
  upgradesDiv.innerHTML = "";
  if (!gameState.upgrades.length) {
    upgradesDiv.textContent = "Nenhum upgrade disponível.";
    return;
  }
  gameState.upgrades.forEach(upg => {
    const price = getUpgradePrice(upg);
    const canBuy = gameState.clicks >= price;
    const div = createEl("div", { className: "upgrade-item" },
      createEl("h4", {}, `${upg.name} (x${upg.quantity})`),
      createEl("p", {}, upg.description),
      createEl("p", {}, `CPS: ${formatNumber(upg.cps)}`),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("button", {
        onclick: () => buyUpgrade(upg.id),
        disabled: !canBuy
      }, canBuy ? "Comprar" : "Sem Clicks")
    );
    upgradesDiv.appendChild(div);
  });
}

// === Loja ===
function buyShopItem(itemId) {
  const item = gameState.shopItems.find(i => i.id === itemId);
  if (!item || item.owned) return;
  if (gameState.clicks < item.price) {
    showNotification("Clicks insuficientes!", "error");
    return;
  }
  gameState.clicks -= item.price;
  item.owned = true;
  showNotification(`Você comprou ${item.name}!`, "success");

  if (item.id === 1) startMultiplierEffect(2, item.effectDuration, item);
  else if (item.id === 2) startMultiplierEffect(5, item.effectDuration, item);

  updateDisplay();
  updateShopDisplay();
  saveGame();
}

function startMultiplierEffect(multiplier, duration, item) {
  if (gameState.multiplierTimeout) clearTimeout(gameState.multiplierTimeout);
  gameState.currentMultiplier = multiplier;
  showNotification(`Multiplicador x${multiplier} ativo por ${duration / 1000} segundos!`);
  gameState.multiplierTimeout = setTimeout(() => {
    gameState.currentMultiplier = 1;
    item.owned = false;
    showNotification(`O efeito do ${item.name} acabou.`, "info");
    updateShopDisplay();
    saveGame();
  }, duration);
}

function updateShopDisplay() {
  const shopDiv = $("shopList");
  shopDiv.innerHTML = "";
  if (!gameState.shopItems.length) {
    shopDiv.textContent = "Nenhum item na loja.";
    return;
  }
  gameState.shopItems.forEach(item => {
    const canBuy = !item.owned && gameState.clicks >= item.price;
    const div = createEl("div", { className: "shop-item" },
      createEl("h4", {}, item.name),
      createEl("p", {}, item.description),
      createEl("p", {}, `Preço: ${formatNumber(item.price)}`),
      createEl("button", {
        onclick: () => buyShopItem(item.id),
        disabled: !canBuy
      }, item.owned ? "Comprado" : canBuy ? "Comprar" : "Sem Clicks")
    );
    shopDiv.appendChild(div);
  });
}

// === Pets ===
function getPetPrice(pet) {
  return 5000 + pet.id * 1000;
}

function petAction(petId) {
  const pet = gameState.pets.find(p => p.id === petId);
  if (!pet) return;

  if (!pet.owned) {
    const price = getPetPrice(pet);
    if (gameState.clicks >= price) {
      gameState.clicks -= price;
      pet.owned = true;
      gameState.activePetId = pet.id;
      showNotification(`Você comprou e ativou o pet ${pet.name}!`, "success");
    } else {
      showNotification("Clicks insuficientes para comprar pet!", "error");
      return;
    }
  } else {
    gameState.activePetId = pet.id;
    showNotification(`Pet ${pet.name} ativado!`, "success");
  }
  updatePetsDisplay();
  updateDisplay();
  saveGame();
}

function updatePetsDisplay() {
  const petsDiv = $("petsList");
  petsDiv.innerHTML = "";
  if (!gameState.pets.length) {
    petsDiv.textContent = "Nenhum pet disponível.";
    return;
  }
  gameState.pets.forEach(pet => {
    const ownedText = pet.owned ? "(Possuído)" : "(Não possui)";
    const isActive = gameState.activePetId === pet.id;
    const btnText = isActive ? "Ativo" : pet.owned ? "Ativar" : "Comprar";
    const canBuy = !pet.owned && gameState.clicks >= getPetPrice(pet);

    const div = createEl("div", { className: "pet-item" },
      createEl("h4", {}, `${pet.name} ${ownedText}`),
      createEl("p", {}, `Bônus: +${pet.bonusPercent}% CPS`),
      createEl("button", {
        onclick: () => petAction(pet.id),
        disabled: !canBuy && !pet.owned
      }, btnText)
    );
    petsDiv.appendChild(div);
  });
}

// === Missões ===
function updateMissions() {
  const missionsUl = $("missions");
  missionsUl.innerHTML = "";

  if (!gameState.missions.length) {
    missionsUl.textContent = "Nenhuma missão disponível.";
    return;
  }

  gameState.missions.forEach(mission => {
    const li = createEl("li", {
      className: mission.completed ? "mission-completed" : ""
    }, `${mission.description} - Progresso: ${mission.progress}/${mission.goal}`);
    missionsUl.appendChild(li);
  });
}

function checkMissionProgress() {
  let updated = false;

  gameState.missions.forEach(mission => {
    if (mission.completed) return;

    if (mission.id === 1) {
      mission.progress = Math.min(gameState.totalClicks, mission.goal);
      if (mission.progress >= mission.goal) {
        mission.completed = true;
        gameState.xp += mission.rewardXP;
        showNotification(`Missão "${mission.description}" concluída! XP ganho: ${mission.rewardXP}`, "success");
        updated = true;
      }
    } else if (mission.id === 2) {
      const totalUpgrades = gameState.upgrades.reduce((sum, u) => sum + u.quantity, 0);
      mission.progress = Math.min(totalUpgrades, mission.goal);
      if (mission.progress >= mission.goal) {
        mission.completed = true;
        gameState.xp += mission.rewardXP;
        showNotification(`Missão "${mission.description}" concluída! XP ganho: ${mission.rewardXP}`, "success");
        updated = true;
      }
    } else if (mission.id === 3) {
      mission.progress = Math.min(gameState.rebirths, mission.goal);
      if (mission.progress >= mission.goal) {
        mission.completed = true;
        gameState.xp += mission.rewardXP;
        showNotification(`Missão "${mission.description}" concluída! XP ganho: ${mission.rewardXP}`, "success");
        updated = true;
      }
    }
  });

  if (updated) {
    updateDisplay();
    updateMissions();
    saveGame();
  }
}

// === Conquistas ===
function updateAchievements() {
  const achUl = $("achievementsList");
  achUl.innerHTML = "";

  if (!gameState.achievements.length) {
    achUl.textContent = "Nenhuma conquista desbloqueada.";
    return;
  }

  gameState.achievements.forEach(ach => {
    if (!ach.achieved) {
      // Verifica condições
      if (ach.id === 1 && gameState.totalClicks >= 1) ach.achieved = true;
      else if (ach.id === 2 && gameState.level >= 10) ach.achieved = true;
      else if (ach.id === 3 && gameState.totalClicks >= 1000) ach.achieved = true;
      else if (ach.id === 4 && gameState.rebirths >= 10) ach.achieved = true;
    }
    if (ach.achieved) {
      const li = createEl("li", { className: "achievement-unlocked" }, `${ach.name} - ${ach.description}`);
      achUl.appendChild(li);
    }
  });
}

// === Atualiza todos os displays ===
function updateAllDisplays() {
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
}

// === Botão clique ===
$("clickButton").addEventListener("click", () => {
  gainClicks(1 * gameState.currentMultiplier);
  checkMissionProgress();
});

// === Compra quantidade selecionada ===
$("buyAmountSelect").addEventListener("change", (e) => {
  gameState.buyAmount = Number(e.target.value);
});

// === Salvar, carregar, resetar ===
$("saveBtn").addEventListener("click", () => {
  saveGame();
  showNotification("Progresso salvo manualmente.", "success");
});

$("loadBtn").addEventListener("click", () => {
  loadGame();
  updateAllDisplays();
});

$("resetBtn").addEventListener("click", () => {
  if (confirm("Tem certeza que quer resetar todo progresso?")) {
    localStorage.removeItem("clickerSave");
    initGameData();
    Object.assign(gameState, {
      clicks: 0, totalClicks: 0, cps: 0, level: 1, xp: 0, xpToNext: 100, rebirths: 0,
      currentWorld: 1, buyAmount: 1, activePetId: null, currentMultiplier: 1
    });
    updateAllDisplays();
    showNotification("Progresso resetado!", "info");
  }
});

// === Auto CPS ===
setInterval(() => {
  const cpsGain = calcCPS() * gameState.currentMultiplier;
  if (cpsGain > 0) {
    gainClicks(cpsGain / 10); // 10x por segundo (100ms)
  }
}, 100);

// === Inicialização principal ===
function main() {
  initGameData();
  loadGame();
  updateAllDisplays();
}

main();

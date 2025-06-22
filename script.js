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
};

function initUpgrades() {
  return [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
    { id: 4, name: "Gerador de Clicks", description: "Mais clicks por segundo", cps: 150, quantity: 0, basePrice: 1500 },
    { id: 5, name: "Clicker Quântico", description: "Clicks quase infinitos", cps: 500, quantity: 0, basePrice: 10000 },
    { id: 6, name: "Mega Clicker", description: "Clicks em grande escala", cps: 2000, quantity: 0, basePrice: 40000 },
    { id: 7, name: "Clicker Supremo", description: "Clicks divinos", cps: 10000, quantity: 0, basePrice: 150000 },
    { id: 8, name: "Deus do Click", description: "Clicks que mudam o universo", cps: 50000, quantity: 0, basePrice: 800000 }
  ];
}

function initShopItems() {
  return [
    { id: 1, name: "Multiplicador x2", description: "Dobra produção por 5 min", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla produção por 2 min", owned: false, price: 5000, effectDuration: 120000 },
  ];
}

function initPets() {
  return [
    { id: 1, name: "Gato Clicker", bonusPercent: 5, owned: false },
    { id: 2, name: "Cachorro Robótico", bonusPercent: 15, owned: false },
    { id: 3, name: "Dragão Cibernético", bonusPercent: 30, owned: false },
  ];
}

function initMissions() {
  return [
    { id: 1, description: "Clique 100 vezes", goal: 100, progress: 0, rewardXP: 50, completed: false },
    { id: 2, description: "Compre 5 upgrades", goal: 5, progress: 0, rewardXP: 100, completed: false },
    { id: 3, description: "Faça 1 rebirth", goal: 1, progress: 0, rewardXP: 500, completed: false },
  ];
}

function initAchievements() {
  return [
    { id: 1, name: "Primeiro Click", description: "Realize seu primeiro click", achieved: false },
    { id: 2, name: "Novato", description: "Alcance nível 10", achieved: false },
    { id: 3, name: "Profissional", description: "Alcance 1000 clicks", achieved: false },
    { id: 4, name: "Veterano", description: "Realize 10 rebirths", achieved: false },
  ];
}

// === Inicializa dados do jogo ===
function initGameData() {
  gameState.upgrades = initUpgrades();
  gameState.shopItems = initShopItems();
  gameState.pets = initPets();
  gameState.missions = initMissions();
  gameState.achievements = initAchievements();
}

// === Função para salvar progresso ===
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
  } catch (err) {
    console.error("Erro ao salvar:", err);
    showNotification("Falha ao salvar progresso!", "error");
  }
}

// === Função para carregar progresso ===
function loadGame() {
  const saveData = localStorage.getItem("clickerSave");
  if (saveData) {
    try {
      const parsed = JSON.parse(saveData);

      // Mesclar upgrades para garantir basePrice e cps intactos
      const baseUpgrades = initUpgrades();
      gameState.upgrades = baseUpgrades.map(base => {
        const savedUpg = (parsed.upgrades || []).find(u => u.id === base.id);
        return {
          ...base,
          quantity: savedUpg ? savedUpg.quantity : 0
        };
      });

      // Mesclar outras propriedades
      gameState.clicks = parsed.clicks ?? 0;
      gameState.totalClicks = parsed.totalClicks ?? 0;
      gameState.level = parsed.level ?? 1;
      gameState.xp = parsed.xp ?? 0;
      gameState.xpToNext = parsed.xpToNext ?? 100;
      gameState.rebirths = parsed.rebirths ?? 0;
      gameState.currentWorld = parsed.currentWorld ?? 1;
      gameState.shopItems = parsed.shopItems && parsed.shopItems.length ? parsed.shopItems : initShopItems();
      gameState.pets = parsed.pets && parsed.pets.length ? parsed.pets : initPets();
      gameState.missions = parsed.missions && parsed.missions.length ? parsed.missions : initMissions();
      gameState.achievements = parsed.achievements && parsed.achievements.length ? parsed.achievements : initAchievements();
      gameState.activePetId = parsed.activePetId ?? null;
      gameState.theme = parsed.theme ?? "dark";
      gameState.lastChatTimestamp = parsed.lastChatTimestamp ?? 0;
      gameState.audio = parsed.audio ?? { musicVolume: 0.5, effectsVolume: 0.7, musicPlaying: false };
      gameState.tutorialShown = parsed.tutorialShown ?? false;

      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
      initGameData();
    }
  } else {
    initGameData();
  }
}

// === Formata preço/upgrades corretamente ===
function getUpgradePrice(upgrade) {
  if (!upgrade || typeof upgrade.basePrice !== "number") return 0;
  return Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity));
}

// === Atualiza display upgrades ===
function updateUpgradesDisplay() {
  const container = $("upgrades");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const price = getUpgradePrice(upg);
    const canBuy = gameState.clicks >= price;
    const div = createEl("div", { className: "upgrade-item" },
      createEl("h4", {}, upg.name),
      createEl("p", {}, upg.description),
      createEl("p", {}, `Quantidade: ${upg.quantity}`),
      createEl("p", {}, `CPS: ${formatNumber(upg.cps)}`),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("button", { disabled: !canBuy }, "Comprar")
    );
    div.querySelector("button").onclick = () => buyUpgrade(upg.id);
    container.appendChild(div);
  });
}

// === Compra upgrade ===
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

// === Calcula CPS total incluindo upgrades e pets ===
function calcCPS() {
  let baseCPS = gameState.upgrades.reduce((sum, u) => sum + (u.cps * u.quantity), 0);
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) baseCPS *= (1 + pet.bonusPercent / 100);
  }
  return baseCPS;
}

// === Atualiza display principal ===
function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS());
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;
}

// === Função para clicar manualmente ===
function gainClicks(amount = 1) {
  gameState.clicks += amount;
  gameState.totalClicks += amount;
  addXP(amount * 0.5);
  updateDisplay();
  updateShopDisplay();
  updateUpgradesDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  saveGame();
}

// === Adiciona XP e trata level up ===
function addXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.1);
    showNotification(`Você subiu para o nível ${gameState.level}!`, "success");
  }
}

// === Atualiza loja (simplificado) ===
function updateShopDisplay() {
  const shopDiv = $("shopList");
  shopDiv.innerHTML = "";
  gameState.shopItems.forEach(item => {
    const canBuy = !item.owned && gameState.clicks >= item.price;
    const btnText = item.owned ? "Comprado" : "Comprar";
    const div = createEl("div", { className: "shop-item" },
      createEl("h4", {}, item.name),
      createEl("p", {}, item.description),
      createEl("p", {}, `Preço: ${formatNumber(item.price)}`),
      createEl("button", { disabled: !canBuy }, btnText)
    );
    div.querySelector("button").onclick = () => buyShopItem(item.id);
    shopDiv.appendChild(div);
  });
}

// === Compra item da loja e ativa efeito temporário ===
let currentMultiplier = 1;
let multiplierTimeout = null;
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

  if (item.id === 1) {
    startMultiplierEffect(2, item.effectDuration, item);
  } else if (item.id === 2) {
    startMultiplierEffect(5, item.effectDuration, item);
  }

  updateDisplay();
  updateShopDisplay();
  saveGame();
}

function startMultiplierEffect(multiplier, duration, item) {
  currentMultiplier = multiplier;
  showNotification(`Multiplicador x${multiplier} ativo por ${duration / 1000} segundos!`, "success");
  if (multiplierTimeout) clearTimeout(multiplierTimeout);
  multiplierTimeout = setTimeout(() => {
    currentMultiplier = 1;
    item.owned = false;
    showNotification(`O efeito do ${item.name} acabou.`, "info");
    updateShopDisplay();
    saveGame();
  }, duration);
}

// === Atualiza pets ===
function updatePetsDisplay() {
  const petsDiv = $("pets");
  petsDiv.innerHTML = "";
  gameState.pets.forEach(pet => {
    const ownedText = pet.owned ? "(Possuído)" : "(Não possui)";
    const isActive = gameState.activePetId === pet.id;
    const btnText = isActive ? "Ativo" : pet.owned ? "Ativar" : "Comprar";
    const canBuy = !pet.owned && gameState.clicks >= getPetPrice(pet);

    const div = createEl("div", { className: "pet-item" },
      createEl("h4", {}, `${pet.name} ${ownedText}`),
      createEl("p", {}, `Bônus CPS: ${pet.bonusPercent}%`),
      createEl("button", { disabled: !canBuy && !pet.owned }, btnText)
    );
    div.querySelector("button").onclick = () => petAction(pet.id);
    petsDiv.appendChild(div);
  });
}

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

// === Atualiza missões ===
function updateMissions() {
  const missionsUL = $("missions");
  missionsUL.innerHTML = "";
  gameState.missions.forEach(mis => {
    if (mis.completed) return;
    const li = createEl("li", { className: "mission-item" }, `${mis.description} (${mis.progress}/${mis.goal})`);
    missionsUL.appendChild(li);
  });
}

// === Atualiza conquistas ===
function updateAchievements() {
  const achDiv = $("achievements");
  achDiv.innerHTML = "";
  gameState.achievements.forEach(ach => {
    if (!ach.achieved) return;
    const div = createEl("div", { className: "achievement-item" }, `${ach.name} - ${ach.description}`);
    achDiv.appendChild(div);
  });
}

// === Atualiza tudo ===
function updateAll() {
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
}

// === Click automático ===
setInterval(() => {
  const cps = calcCPS();
  if (cps > 0) gainClicks(cps * currentMultiplier / 10); // Divide por 10 para ticks a cada 100ms
}, 100);

// === Clique manual ===
$("clickButton").onclick = () => gainClicks(1 * currentMultiplier);

// === Inicialização ===
window.onload = () => {
  loadGame();
  updateAll();
};

// === Notificações simples ===
function showNotification(text, type = "info") {
  const notif = $("notification");
  notif.textContent = text;
  notif.className = "notification " + type;
  notif.style.opacity = "1";
  setTimeout(() => {
    notif.style.opacity = "0";
  }, 3000);
}

// === Eventos adicionais e outras funcionalidades podem ser adicionadas aqui ===


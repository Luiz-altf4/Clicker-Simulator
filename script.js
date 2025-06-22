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
  if (n < 1e3) return n.toString();
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  let u = -1;
  do {
    n /= 1000;
    u++;
  } while (n >= 1000 && u < units.length - 1);
  return n.toFixed(2) + units[u];
}

// === Estado do jogo ===
let gameData = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  rebirths: 0,
  currentWorld: 1,
  upgrades: {},
  shop: {},
  pets: {},
  missions: [],
  achievements: [],
};

// Produtos padrão (sempre id único)
const PRODUCTS = [
  { id: "upgrade_1", name: "Upgrade Click", basePrice: 50, cps: 0.1, description: "Aumenta seu CPS em 0.1" },
  { id: "upgrade_2", name: "Auto Clicker", basePrice: 200, cps: 0.5, description: "Clica automaticamente" },
  { id: "upgrade_3", name: "Mega Click", basePrice: 500, cps: 1, description: "Aumenta CPS em 1" },
  { id: "upgrade_4", name: "Turbo Click", basePrice: 1000, cps: 2, description: "Aumenta CPS em 2" },
  { id: "upgrade_5", name: "Ultra Click", basePrice: 2000, cps: 5, description: "Aumenta CPS em 5" },

  // Loja pode ter outros itens
  { id: "shop_1", name: "Multiplicador x2", basePrice: 500, cps: 0, description: "Multiplica clicks ganhos" },
  { id: "shop_2", name: "Multiplicador x5", basePrice: 2000, cps: 0, description: "Multiplica clicks ganhos" },
];

// Pets
const PETS = [
  { id: "pet_1", name: "Cachorro", basePrice: 1000, cps: 1, description: "Seu cachorro ajuda clicando." },
  { id: "pet_2", name: "Gato", basePrice: 2500, cps: 3, description: "O gato aumenta seu CPS." },
  { id: "pet_3", name: "Papagaio", basePrice: 5000, cps: 7, description: "O papagaio clica para você." },
];

// Missões exemplo
const MISSIONS = [
  { id: "mission_1", description: "Faça 100 cliques", completed: false, rewardXP: 50 },
  { id: "mission_2", description: "Compre 3 upgrades", completed: false, rewardXP: 100 },
  { id: "mission_3", description: "Alcance nível 5", completed: false, rewardXP: 150 },
];

// Conquistas exemplo
const ACHIEVEMENTS = [
  { id: "ach_1", description: "Primeiro clique!", achieved: false },
  { id: "ach_2", description: "1000 clicks acumulados", achieved: false },
];

// Multiplicador global
let globalMultiplier = 1;

// === Elementos DOM ===
const clicksDisplay = $("clicksDisplay");
const totalClicksStat = $("totalClicksStat");
const cpsDisplay = $("cpsDisplay");
const levelDisplay = $("levelDisplay");
const xpDisplay = $("xpDisplay");
const xpToNextLevel = $("xpToNextLevel");
const rebirthCount = $("rebirthCount");
const currentWorld = $("currentWorld");

const clickBtn = $("clickBtn");
const rebirthBtn = $("rebirthBtn");

const upgradesContainer = $("upgrades");
const shopContainer = $("shopList");
const petsContainer = $("pets");

const missionsList = $("missions");
const achievementsList = $("achievementsList");

const notification = $("notification");

const saveBtn = $("saveBtn");
const clearSaveBtn = $("clearSaveBtn");

const toggleThemeBtn = $("toggleTheme");

const playerNameInput = $("playerNameInput");
const saveScoreBtn = $("saveScoreBtn");
const detailedRankingList = $("detailedRankingList");

const chatMessages = $("chatMessages");
const chatInput = $("chatInput");
const chatSendBtn = $("chatSendBtn");

// === Inicialização ===
function initGame() {
  // Carregar dados do localStorage
  const saved = localStorage.getItem("clickerSave");
  if (saved) {
    try {
      gameData = JSON.parse(saved);
    } catch {
      gameData = { ...gameData };
    }
  } else {
    // Inicializar upgrades, shop e pets com 0
    PRODUCTS.forEach(p => gameData.upgrades[p.id] = 0);
    PETS.forEach(p => gameData.pets[p.id] = 0);
    MISSIONS.forEach(m => m.completed = false);
    ACHIEVEMENTS.forEach(a => a.achieved = false);
    gameData.missions = MISSIONS;
    gameData.achievements = ACHIEVEMENTS;
  }

  updateUI();
  setupListeners();
  loadRanking();
  loadChat();
  startAutoClick();
  setupTheme();
}

// === Atualiza interface geral ===
function updateUI() {
  clicksDisplay.textContent = formatNumber(gameData.clicks);
  totalClicksStat.textContent = formatNumber(gameData.totalClicks);
  cpsDisplay.textContent = formatNumber(gameData.cps);
  levelDisplay.textContent = gameData.level;
  xpDisplay.textContent = formatNumber(gameData.xp);
  xpToNextLevel.textContent = formatNumber(gameData.xpToNextLevel);
  rebirthCount.textContent = gameData.rebirths;
  currentWorld.textContent = `${gameData.currentWorld} - Jardim Inicial`;

  // Atualiza upgrades, pets, shop
  renderUpgrades();
  renderShop();
  renderPets();
  renderMissions();
  renderAchievements();

  // Habilita/desabilita botões
  rebirthBtn.disabled = gameData.clicks < 10000; // Exemplo para rebirth
}

// === Renderiza upgrades com preços e botões ===
function renderUpgrades() {
  upgradesContainer.innerHTML = "";
  PRODUCTS.filter(p => p.id.startsWith("upgrade_")).forEach(prod => {
    const level = gameData.upgrades[prod.id] || 0;
    const price = Math.floor(prod.basePrice * Math.pow(1.15, level));
    const item = createEl("div", { className: "upgrade-item" },
      createEl("h4", {}, prod.name),
      createEl("p", {}, prod.description),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("p", {}, `Nível: ${level}`),
      createEl("button", { onclick: () => buyUpgrade(prod.id), disabled: gameData.clicks < price }, "Comprar")
    );
    upgradesContainer.appendChild(item);
  });
}

// === Renderiza itens da loja ===
function renderShop() {
  shopContainer.innerHTML = "";
  PRODUCTS.filter(p => p.id.startsWith("shop_")).forEach(prod => {
    const owned = gameData.shop[prod.id] || 0;
    const price = Math.floor(prod.basePrice * Math.pow(1.2, owned));
    const item = createEl("div", { className: "shop-item" },
      createEl("h4", {}, prod.name),
      createEl("p", {}, prod.description),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("p", {}, `Quantidade: ${owned}`),
      createEl("button", { onclick: () => buyShopItem(prod.id), disabled: gameData.clicks < price }, "Comprar")
    );
    shopContainer.appendChild(item);
  });
}

// === Renderiza pets ===
function renderPets() {
  petsContainer.innerHTML = "";
  PETS.forEach(pet => {
    const owned = gameData.pets[pet.id] || 0;
    const price = Math.floor(pet.basePrice * Math.pow(1.3, owned));
    const item = createEl("div", { className: "pet-item" },
      createEl("h4", {}, pet.name),
      createEl("p", {}, pet.description),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("p", {}, `Quantidade: ${owned}`),
      createEl("button", { onclick: () => buyPet(pet.id), disabled: gameData.clicks < price }, "Comprar")
    );
    petsContainer.appendChild(item);
  });
}

// === Renderiza missões ===
function renderMissions() {
  missionsList.innerHTML = "";
  gameData.missions.forEach(mission => {
    const li = document.createElement("li");
    li.textContent = mission.description + (mission.completed ? " ✅" : "");
    missionsList.appendChild(li);
  });
}

// === Renderiza conquistas ===
function renderAchievements() {
  achievementsList.innerHTML = "";
  gameData.achievements.forEach(ach => {
    const li = document.createElement("li");
    li.textContent = ach.description;
    if (ach.achieved) li.classList.add("achievement-item", "completed");
    achievementsList.appendChild(li);
  });
}

// === Funções de compra ===
function buyUpgrade(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return notify("Upgrade não encontrado!");

  const level = gameData.upgrades[id] || 0;
  const price = Math.floor(prod.basePrice * Math.pow(1.15, level));

  if (gameData.clicks >= price) {
    gameData.clicks -= price;
    gameData.upgrades[id] = level + 1;
    calculateCPS();
    notify(`Comprou ${prod.name}!`);
    updateUI();
  } else {
    notify("Você não tem clicks suficientes!");
  }
}

function buyShopItem(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return notify("Item da loja não encontrado!");

  const owned = gameData.shop[id] || 0;
  const price = Math.floor(prod.basePrice * Math.pow(1.2, owned));

  if (gameData.clicks >= price) {
    gameData.clicks -= price;
    gameData.shop[id] = owned + 1;
    // Exemplo: se for multiplicador, altera globalMultiplier
    if (id === "shop_1") globalMultiplier = 2;
    else if (id === "shop_2") globalMultiplier = 5;
    notify(`Comprou ${prod.name}!`);
    updateUI();
  } else {
    notify("Você não tem clicks suficientes!");
  }
}

function buyPet(id) {
  const pet = PETS.find(p => p.id === id);
  if (!pet) return notify("Pet não encontrado!");

  const owned = gameData.pets[id] || 0;
  const price = Math.floor(pet.basePrice * Math.pow(1.3, owned));

  if (gameData.clicks >= price) {
    gameData.clicks -= price;
    gameData.pets[id] = owned + 1;
    calculateCPS();
    notify(`Comprou pet ${pet.name}!`);
    updateUI();
  } else {
    notify("Você não tem clicks suficientes!");
  }
}

// === Calcula CPS total com upgrades, pets e multiplicadores ===
function calculateCPS() {
  let cpsTotal = 0;

  // Soma upgrades
  for (const [id, level] of Object.entries(gameData.upgrades)) {
    const prod = PRODUCTS.find(p => p.id === id);
    if (prod && level > 0) {
      cpsTotal += prod.cps * level;
    }
  }

  // Soma pets
  for (const [id, owned] of Object.entries(gameData.pets)) {
    const pet = PETS.find(p => p.id === id);
    if (pet && owned > 0) {
      cpsTotal += pet.cps * owned;
    }
  }

  // Aplica multiplicador global (ex: shop items)
  cpsTotal *= globalMultiplier;

  gameData.cps = cpsTotal;
  cpsDisplay.textContent = formatNumber(gameData.cps);
}

// === Clique manual ===
clickBtn.onclick = () => {
  const clicksGained = 1 * globalMultiplier;
  gameData.clicks += clicksGained;
  gameData.totalClicks += clicksGained;
  updateXP(1);
  updateUI();
  checkMissions();
  checkAchievements();
  checkLevelUp();
  saveGame();
};

// === Rebirth ===
rebirthBtn.onclick = () => {
  if (gameData.clicks < 10000) {
    notify("Você precisa de pelo menos 10.000 clicks para rebirth.");
    return;
  }
  gameData.rebirths++;
  gameData.clicks = 0;
  gameData.totalClicks = 0;
  gameData.cps = 0;
  gameData.level = 1;
  gameData.xp = 0;
  gameData.xpToNextLevel = 100;
  gameData.upgrades = {};
  gameData.shop = {};
  gameData.pets = {};
  gameData.missions = MISSIONS.map(m => ({ ...m, completed: false }));
  gameData.achievements = ACHIEVEMENTS.map(a => ({ ...a, achieved: false }));
  globalMultiplier = 1;
  notify("Rebirth realizado! Comece de novo com bônus.");
  updateUI();
  saveGame();
};

// === Auto-click CPS ===
function startAutoClick() {
  setInterval(() => {
    if (gameData.cps > 0) {
      const clicksToAdd = gameData.cps;
      gameData.clicks += clicksToAdd;
      gameData.totalClicks += clicksToAdd;
      updateXP(clicksToAdd);
      updateUI();
      checkMissions();
      checkAchievements();
      checkLevelUp();
      saveGame();
    }
  }, 1000);
}

// === XP e Level Up ===
function updateXP(amount) {
  gameData.xp += amount;
}

function checkLevelUp() {
  while (gameData.xp >= gameData.xpToNextLevel) {
    gameData.xp -= gameData.xpToNextLevel;
    gameData.level++;
    gameData.xpToNextLevel = Math.floor(gameData.xpToNextLevel * 1.3);
    notify(`Parabéns! Você alcançou o nível ${gameData.level}!`);
    updateUI();
  }
}

// === Missões ===
function checkMissions() {
  gameData.missions.forEach(m => {
    if (!m.completed) {
      if (m.id === "mission_1" && gameData.totalClicks >= 100) {
        m.completed = true;
        gameData.xp += m.rewardXP;
        notify(`Missão concluída: ${m.description}`);
      }
      if (m.id === "mission_2" && Object.values(gameData.upgrades).filter(x => x > 0).length >= 3) {
        m.completed = true;
        gameData.xp += m.rewardXP;
        notify(`Missão concluída: ${m.description}`);
      }
      if (m.id === "mission_3" && gameData.level >= 5) {
        m.completed = true;
        gameData.xp += m.rewardXP;
        notify(`Missão concluída: ${m.description}`);
      }
    }
  });
  renderMissions();
}

// === Conquistas ===
function checkAchievements() {
  gameData.achievements.forEach(a => {
    if (!a.achieved) {
      if (a.id === "ach_1" && gameData.totalClicks >= 1) {
        a.achieved = true;
        notify("Conquista desbloqueada: Primeiro clique!");
      }
      if (a.id === "ach_2" && gameData.totalClicks >= 1000) {
        a.achieved = true;
        notify("Conquista desbloqueada: 1000 clicks!");
      }
    }
  });
  renderAchievements();
}

// === Notificações simples ===
let notifyTimeout;
function notify(msg) {
  clearTimeout(notifyTimeout);
  notification.textContent = msg;
  notification.style.display = "block";
  notifyTimeout = setTimeout(() => {
    notification.style.display = "none";
  }, 2500);
}

// === Salvar e carregar jogo ===
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameData));
}

function clearSave() {
  localStorage.removeItem("clickerSave");
  location.reload();
}

// Botões salvar/limpar
saveBtn.onclick = () => {
  saveGame();
  notify("Progresso salvo!");
};
clearSaveBtn.onclick = () => {
  if (confirm("Tem certeza que quer apagar o progresso?")) {
    clearSave();
  }
};

// === Tema claro/escuro ===
function setupTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
    toggleThemeBtn.textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    toggleThemeBtn.textContent = "☀️";
  }
}

toggleThemeBtn.onclick = () => {
  if (document.body.classList.contains("light-theme")) {
    document.body.classList.remove("light-theme");
    localStorage.setItem("theme", "dark");
    toggleThemeBtn.textContent = "☀️";
  } else {
    document.body.classList.add("light-theme");
    localStorage.setItem("theme", "light");
    toggleThemeBtn.textContent = "🌙";
  }
};

// === Ranking Firebase ===
async function loadRanking() {
  detailedRankingList.innerHTML = "Carregando ranking...";
  try {
    const rankRef = ref(db, "ranking");
    const rankQuery = query(rankRef, orderByChild("clicks"), limitToLast(10));
    onValue(rankQuery, (snapshot) => {
      const data = snapshot.val();
      detailedRankingList.innerHTML = "";
      if (!data) {
        detailedRankingList.textContent = "Nenhum ranking disponível.";
        return;
      }
      const entries = Object.entries(data).sort((a,b) => b[1].clicks - a[1].clicks);
      entries.forEach(([key, val], i) => {
        const div = createEl("div", {className:"ranking-item"}, `${i+1}. ${val.name} - ${formatNumber(val.clicks)} clicks`);
        detailedRankingList.appendChild(div);
      });
    });
  } catch (e) {
    detailedRankingList.textContent = "Erro ao carregar ranking.";
  }
}

saveScoreBtn.onclick = async () => {
  const name = playerNameInput.value.trim();
  if (!name) return notify("Digite um nome para salvar no ranking.");
  try {
    const rankRef = ref(db, "ranking");
    const newScoreRef = push(rankRef);
    await set(newScoreRef, { name, clicks: gameData.totalClicks });
    notify("Pontuação salva no ranking!");
    playerNameInput.value = "";
  } catch {
    notify("Erro ao salvar no ranking.");
  }
};

// === Chat Firebase ===
const chatRef = ref(db, "chat");
function loadChat() {
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    chatMessages.innerHTML = "";
    if (!data) {
      chatMessages.textContent = "Nenhuma mensagem ainda.";
      return;
    }
    const messages = Object.values(data);
    messages.forEach(msg => {
      const p = createEl("p", {}, `[${new Date(msg.time).toLocaleTimeString()}] ${msg.name}: ${msg.message}`);
      chatMessages.appendChild(p);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

chatSendBtn.onclick = () => {
  const name = playerNameInput.value.trim() || "Anônimo";
  const message = chatInput.value.trim();
  if (!message) return;
  // Simples prevenção contra spam e comandos
  if (message.length > 200) return notify("Mensagem muito longa!");
  if (/http|https|<|>/.test(message)) return notify("Mensagem contém caracteres inválidos!");
  const newMsgRef = push(chatRef);
  set(newMsgRef, {
    name,
    message,
    time: Date.now()
  });
  chatInput.value = "";
};

// === Setup listeners adicionais e inicialização ===
function setupListeners() {
  // Pode adicionar aqui listeners extras se quiser
}

initGame();

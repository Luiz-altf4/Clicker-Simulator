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

// === Inicializa dados padrão do jogo (só se não tiver save) ===
function initGameData() {
  if (gameState.upgrades.length) return; // já inicializado

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
      // Faz merge dos dados carregados no gameState, só propriedades existentes
      Object.keys(parsed).forEach(key => {
        if (gameState.hasOwnProperty(key)) {
          gameState[key] = parsed[key];
        }
      });
      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
    }
  }
}

// === Notificações ===
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

// === Atualizar todos os displays (UI) ===
function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS() * currentMultiplier);
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;

  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
}

// === Calcular CPS total incluindo upgrades e pets ===
function calcCPS() {
  let baseCPS = gameState.upgrades.reduce((sum, u) => sum + u.cps * u.quantity, 0);

  // bônus de pets (somente se algum ativo)
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) {
      baseCPS *= (1 + pet.bonusPercent / 100);
    }
  }
  return baseCPS * currentMultiplier;
}

// === Variável para fração do CPS acumulada ===
let cpsFraction = 0;
let currentMultiplier = 1;
let multiplierTimeout = null;

// === Ganhar clicks manualmente (clique no botão) ===
function gainClicks(amount = 1) {
  gameState.clicks += amount;
  gameState.totalClicks += amount;

  addXP(amount * 0.5);

  updateMissionProgressOnClick(amount);
  updateAchievementsProgress();

  // Só atualiza a UI e salva em intervalos regulares para performance
}

// === Atualiza progresso das missões relacionadas a clicks e upgrades
function updateMissionProgressOnClick(amount) {
  // Missão 1: Clique 100 vezes
  const mission1 = gameState.missions.find(m => m.id === 1);
  if (mission1 && !mission1.completed) {
    mission1.progress += amount;
    if (mission1.progress >= mission1.goal) {
      mission1.completed = true;
      addXP(mission1.rewardXP);
      showNotification(`Missão completa: ${mission1.description}`, "success");
    }
  }
}

// === Atualiza conquistas de acordo com progresso ===
function updateAchievementsProgress() {
  // Conquista 1: Primeiro click
  if (!gameState.achievements[0].achieved && gameState.totalClicks >= 1) {
    gameState.achievements[0].achieved = true;
    showNotification(`Conquista desbloqueada: ${gameState.achievements[0].name}!`, "success");
  }
  // Conquista 2: nível 10
  if (!gameState.achievements[1].achieved && gameState.level >= 10) {
    gameState.achievements[1].achieved = true;
    showNotification(`Conquista desbloqueada: ${gameState.achievements[1].name}!`, "success");
  }
  // Conquista 3: 1000 clicks
  if (!gameState.achievements[2].achieved && gameState.totalClicks >= 1000) {
    gameState.achievements[2].achieved = true;
    showNotification(`Conquista desbloqueada: ${gameState.achievements[2].name}!`, "success");
  }
  // Conquista 4: 10 rebirths
  if (!gameState.achievements[3].achieved && gameState.rebirths >= 10) {
    gameState.achievements[3].achieved = true;
    showNotification(`Conquista desbloqueada: ${gameState.achievements[3].name}!`, "success");
  }
}

// === Atualiza área de upgrades ===
function updateUpgradesDisplay() {
  const upgradesDiv = $("upgrades");
  upgradesDiv.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const price = getUpgradePrice(upg);
    const div = createEl("div", { className: "upgrade-item" },
      createEl("h4", {}, `${upg.name} (x${upg.quantity})`),
      createEl("p", {}, upg.description),
      createEl("p", {}, `CPS: ${formatNumber(upg.cps)}`),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("button", {
        onclick: () => buyUpgrade(upg.id),
        disabled: gameState.clicks < price,
        className: (gameState.clicks < price) ? "btn-disabled" : ""
      }, "Comprar")
    );
    upgradesDiv.appendChild(div);
  });
}

// === Calcula preço de upgrade com base na quantidade comprada ===
function getUpgradePrice(upgrade) {
  return Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity));
}

// === Compra um upgrade ===
function buyUpgrade(upgradeId) {
  const upg = gameState.upgrades.find(u => u.id === upgradeId);
  const price = getUpgradePrice(upg);
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upg.quantity++;
    showNotification(`Você comprou ${upg.name}!`);

    // Atualiza progresso missão 2: comprar upgrades
    const mission2 = gameState.missions.find(m => m.id === 2);
    if (mission2 && !mission2.completed) {
      const totalUpgrades = gameState.upgrades.reduce((sum, u) => sum + u.quantity, 0);
      mission2.progress = totalUpgrades;
      if (mission2.progress >= mission2.goal) {
        mission2.completed = true;
        addXP(mission2.rewardXP);
        showNotification(`Missão completa: ${mission2.description}`, "success");
      }
    }

    updateDisplay();
    saveGame();
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

// === Atualiza a loja ===
function updateShopDisplay() {
  const shopDiv = $("shopList");
  shopDiv.innerHTML = "";
  gameState.shopItems.forEach(item => {
    const div = createEl("div", { className: "shop-item" },
      createEl("h4", {}, item.name),
      createEl("p", {}, item.description),
      createEl("p", {}, `Preço: ${formatNumber(item.price)}`),
      createEl("button", {
        onclick: () => buyShopItem(item.id),
        disabled: item.owned || gameState.clicks < item.price,
        className: (item.owned || gameState.clicks < item.price) ? "btn-disabled" : ""
      }, item.owned ? "Comprado" : "Comprar")
    );
    shopDiv.appendChild(div);
  });
}

// === Compra item da loja e ativa efeito temporário ===
function buyShopItem(itemId) {
  const item = gameState.shopItems.find(i => i.id === itemId);
  if (!item || item.owned) return;
  if (gameState.clicks < item.price) {
    showNotification("Clicks insuficientes!", "error");
    return;
  }
  gameState.clicks -= item.price;
  item.owned = true;
  showNotification(`Você comprou ${item.name}!`);

  if (item.id === 1) {
    startMultiplierEffect(2, item.effectDuration, item);
  } else if (item.id === 2) {
    startMultiplierEffect(5, item.effectDuration, item);
  }

  updateDisplay();
  saveGame();
}

function startMultiplierEffect(multiplier, duration, item) {
  currentMultiplier = multiplier;
  showNotification(`Multiplicador x${multiplier} ativo por ${duration / 1000} segundos!`);
  if (multiplierTimeout) clearTimeout(multiplierTimeout);
  multiplierTimeout = setTimeout(() => {
    currentMultiplier = 1;
    item.owned = false;
    showNotification(`O efeito do ${item.name} acabou.`);
    updateDisplay();
    saveGame();
  }, duration);
}

// === Atualiza a seção dos pets ===
function updatePetsDisplay() {
  const petsDiv = $("pets");
  petsDiv.innerHTML = "";
  gameState.pets.forEach(pet => {
    const ownedText = pet.owned ? "(Possuído)" : "(Não possui)";
    const isActive = gameState.activePetId === pet.id;
    const btnText = isActive ? "Ativo" : pet.owned ? "Ativar" : "Comprar";

    const div = createEl("div", { className: "pet-item" },
      createEl("h4", {}, `${pet.name} ${ownedText}`),
      createEl("p", {}, `Bônus CPS: ${pet.bonusPercent}%`),
      createEl("button", {
        onclick: () => petAction(pet.id),
        disabled: !pet.owned && gameState.clicks < getPetPrice(pet),
        className: (!pet.owned && gameState.clicks < getPetPrice(pet)) ? "btn-disabled" : ""
      }, btnText)
    );
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
    // comprar pet
    const price = getPetPrice(pet);
    if (gameState.clicks >= price) {
      gameState.clicks -= price;
      pet.owned = true;
      showNotification(`Você comprou o pet ${pet.name}!`);
    } else {
      showNotification("Clicks insuficientes para comprar pet!", "error");
      return;
    }
  }

  // ativar pet
  gameState.activePetId = pet.id;
  showNotification(`Pet ${pet.name} ativado!`);

  updateDisplay();
  saveGame();
}

// === Atualiza as missões e seu progresso na UI ===
function updateMissions() {
  const missionsDiv = $("missions");
  missionsDiv.innerHTML = "";
  gameState.missions.forEach(mission => {
    const progressPercent = Math.min((mission.progress / mission.goal) * 100, 100);
    const statusText = mission.completed ? "Completo" : `Progresso: ${Math.floor(mission.progress)}/${mission.goal}`;
    const div = createEl("div", { className: "mission-item" },
      createEl("p", {}, mission.description),
      createEl("progress", { value: progressPercent, max: 100 }),
      createEl("span", {}, statusText)
    );
    missionsDiv.appendChild(div);
  });
}

// === Atualiza conquistas e exibe status na UI ===
function updateAchievements() {
  const achDiv = $("achievements");
  achDiv.innerHTML = "";
  gameState.achievements.forEach(ach => {
    const div = createEl("div", { className: "achievement-item" },
      createEl("h4", {}, ach.name),
      createEl("p", {}, ach.description),
      createEl("span", { className: ach.achieved ? "achieved" : "not-achieved" }, ach.achieved ? "✓" : "✗")
    );
    achDiv.appendChild(div);
  });
}

// === Sistema de XP e Level Up ===
function addXP(amount) {
  gameState.xp += amount;
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp -= gameState.xpToNext;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
    showNotification(`Você subiu para o nível ${gameState.level}!`, "success");
    updateAchievementsProgress();
  }
}

// === Rebirth (prestígio) ===
function doRebirth() {
  if (gameState.level < 10) {
    showNotification("Você precisa estar no nível 10 para rebirth!", "error");
    return;
  }
  gameState.rebirths++;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  showNotification("Rebirth realizado! Bônus multiplicador concedido por tempo limitado.", "success");

  startMultiplierEffect(3, 300000, { name: "Rebirth" });

  updateDisplay();
  saveGame();
}

// === Controle do botão de clique principal ===
$("clickBtn").onclick = () => {
  gainClicks(gameState.buyAmount);
  updateDisplay();
  saveGame();
};

// === Controle do botão rebirth ===
$("rebirthBtn").onclick = () => {
  doRebirth();
};

// === Controle para alterar quantidade de compra ===
$("buyAmountSelect").onchange = e => {
  const val = parseInt(e.target.value);
  if ([1, 10, 100].includes(val)) gameState.buyAmount = val;
};

// === Chat Global ===
const chatList = $("chatList");
const chatInput = $("chatInput");
const chatSendBtn = $("chatSendBtn");

chatSendBtn.onclick = () => {
  const now = Date.now();
  if (now - gameState.lastChatTimestamp < 3000) {
    showNotification("Aguarde 3 segundos entre mensagens!", "error");
    return;
  }
  const msg = chatInput.value.trim();
  if (msg.length === 0) return;

  sendMessageToFirebase(msg);
  chatInput.value = "";
  gameState.lastChatTimestamp = now;
};

// === Envia mensagem ao Firebase com validação ===
function sendMessageToFirebase(message) {
  const chatRef = ref(db, "clickerChat/");
  const msgData = {
    message,
    timestamp: Date.now(),
    user: "Player" + (Math.floor(Math.random() * 10000)),
  };
  push(chatRef, msgData);
}

// === Recebe mensagens do chat Firebase e exibe ===
function listenChatMessages() {
  const chatRef = query(ref(db, "clickerChat/"), orderByChild("timestamp"), limitToLast(50));
  onValue(chatRef, snapshot => {
    chatList.innerHTML = "";
    snapshot.forEach(childSnap => {
      const msg = childSnap.val();
      const time = new Date(msg.timestamp);
      const timeStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const p = createEl("p", {}, `[${timeStr}] ${msg.user}: ${msg.message}`);
      chatList.appendChild(p);
    });
    chatList.scrollTop = chatList.scrollHeight;
  });
}

// === Auto clicker (CPS) ===
setInterval(() => {
  const cps = calcCPS() * currentMultiplier;
  cpsFraction += cps;
  if (cpsFraction >= 1) {
    const wholeClicks = Math.floor(cpsFraction);
    cpsFraction -= wholeClicks;
    gainClicks(wholeClicks);
    updateDisplay();
  }
}, 1000);

// === Auto save e atualização visual a cada 5 segundos ===
setInterval(() => {
  updateDisplay();
  saveGame();
}, 5000);

// === Inicialização do jogo ===
function init() {
  initGameData();
  loadGame();
  updateDisplay();
  listenChatMessages();

  // Set tema escuro/claro se quiser aqui

  showNotification("Jogo iniciado! Clique para começar!", "success");
}

window.onload = init;

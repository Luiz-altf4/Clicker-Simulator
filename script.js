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
      Object.assign(gameState, parsed);
      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
    }
  }
}

// === Função para exibir notificações ===
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

// === Atualizar todos os displays ===
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
  return baseCPS;
}

// === Função para clicar manualmente ===
function gainClicks(amount = 1) {
  gameState.clicks += amount;
  gameState.totalClicks += amount;

  // dar XP ao clicar
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

// === Atualiza área de upgrades ===
function updateUpgradesDisplay() {
  const upgradesDiv = $("upgrades");
  upgradesDiv.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const div = createEl("div", { className: "upgrade-item" },
      createEl("h4", {}, `${upg.name} (x${upg.quantity})`),
      createEl("p", {}, upg.description),
      createEl("p", {}, `CPS: ${formatNumber(upg.cps)}`),
      createEl("p", {}, `Preço: ${formatNumber(getUpgradePrice(upg))}`),
      createEl("button", {
        onclick: () => buyUpgrade(upg.id),
        disabled: gameState.clicks < getUpgradePrice(upg)
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
    updateDisplay();
    updateUpgradesDisplay();
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
        disabled: item.owned || gameState.clicks < item.price
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

  // Exemplo: multiplica CPS por 2 enquanto o efeito dura
  if (item.id === 1) {
    startMultiplierEffect(2, item.effectDuration, item);
  } else if (item.id === 2) {
    startMultiplierEffect(5, item.effectDuration, item);
  }

  updateDisplay();
  updateShopDisplay();
  saveGame();
}

let currentMultiplier = 1;
let multiplierTimeout = null;
function startMultiplierEffect(multiplier, duration, item) {
  currentMultiplier = multiplier;
  showNotification(`Multiplicador x${multiplier} ativo por ${duration / 1000} segundos!`);
  if (multiplierTimeout) clearTimeout(multiplierTimeout);
  multiplierTimeout = setTimeout(() => {
    currentMultiplier = 1;
    item.owned = false;
    showNotification(`O efeito do ${item.name} acabou.`);
    updateShopDisplay();
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
        disabled: !pet.owned && gameState.clicks < getPetPrice(pet)
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
    const price = getPetPrice(pet);
    if (gameState.clicks >= price) {
      gameState.clicks -= price;
      pet.owned = true;
      gameState.activePetId = pet.id;
      showNotification(`Você comprou e ativou o pet ${pet.name}!`);
    } else {
      showNotification("Clicks insuficientes para comprar pet!", "error");
      return;
    }
  } else {
    // Ativa o pet
    gameState.activePetId = pet.id;
    showNotification(`Pet ${pet.name} ativado!`);
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
    if (mis.completed) return; // ocultar completadas

    const li = createEl("li", { className: "mission-item" },
      `${mis.description} (${mis.progress}/${mis.goal})`
    );
    missionsUL.appendChild(li);
  });
}

// === Atualiza conquistas ===
function updateAchievements() {
  const achUL = $("achievementsList");
  achUL.innerHTML = "";
  gameState.achievements.forEach(ach => {
    const li = createEl("li", {
      className: "achievement-item " + (ach.achieved ? "completed" : "")
    }, `${ach.name} - ${ach.description}`);
    achUL.appendChild(li);
  });
}

// === Tenta completar missões e conquistas a cada clique e evento ===
function checkMissionProgress() {
  gameState.missions.forEach(mis => {
    if (mis.completed) return;
    if (mis.id === 1 && gameState.totalClicks >= mis.goal) {
      mis.completed = true;
      addXP(mis.rewardXP);
      showNotification(`Missão completa: ${mis.description}`, "success");
    }
    if (mis.id === 2) {
      const totalUpgrades = gameState.upgrades.reduce((sum, u) => sum + u.quantity, 0);
      if (totalUpgrades >= mis.goal) {
        mis.completed = true;
        addXP(mis.rewardXP);
        showNotification(`Missão completa: ${mis.description}`, "success");
      }
    }
    if (mis.id === 3 && gameState.rebirths >= mis.goal) {
      mis.completed = true;
      addXP(mis.rewardXP);
      showNotification(`Missão completa: ${mis.description}`, "success");
    }
  });

  // Conquistas básicas
  if (!gameState.achievements[0].achieved && gameState.totalClicks >= 1) {
    gameState.achievements[0].achieved = true;
    showNotification(`Conquista desbloqueada: ${gameState.achievements[0].name}!`, "success");
  }
  if (!gameState.achievements[1].achieved && gameState.level >= 10) {
    gameState.achievements[1].achieved = true;
    showNotification(`Conquista desbloqueada: ${gameState.achievements[1].name}!`, "success");
  }
  if (!gameState.achievements[2].achieved && gameState.totalClicks >= 1000) {
    gameState.achievements[2].achieved = true;
    showNotification(`Conquista desbloqueada: ${gameState.achievements[2].name}!`, "success");
  }
  if (!gameState.achievements[3].achieved && gameState.rebirths >= 10) {
    gameState.achievements[3].achieved = true;
    showNotification(`Conquista desbloqueada: ${gameState.achievements[3].name}!`, "success");
  }
}

// === Função para realizar rebirth ===
function doRebirth() {
  const requiredClicks = 100000;
  if (gameState.clicks < requiredClicks) {
    showNotification(`Você precisa de ${formatNumber(requiredClicks)} clicks para rebirth.`, "error");
    return;
  }

  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  gameState.shopItems.forEach(i => i.owned = false);
  gameState.missions.forEach(m => {
    m.progress = 0;
    m.completed = false;
  });
  showNotification("Rebirth realizado! Progresso reiniciado, mas com bônus!", "success");
  updateDisplay();
  updateUpgradesDisplay();
  updatePetsDisplay();
  updateShopDisplay();
  updateMissions();
  updateAchievements();
  saveGame();
}

// === Atualiza ranking do Firebase ===
function updateRankingDisplay() {
  const rankingDiv = $("detailedRankingList");
  rankingDiv.innerHTML = "Carregando ranking...";

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  get(rankingRef).then(snapshot => {
    const data = snapshot.val();
    if (!data) {
      rankingDiv.textContent = "Nenhum ranking disponível.";
      return;
    }

    // Organizar do maior para menor
    const rankingArr = Object.values(data).sort((a, b) => b.clicks - a.clicks);

    rankingDiv.innerHTML = "";
    rankingArr.forEach((player, i) => {
      const div = createEl("div", { className: "ranking-item" }, `${i + 1}. ${player.name}: ${formatNumber(player.clicks)} clicks`);
      rankingDiv.appendChild(div);
    });
  }).catch(err => {
    rankingDiv.textContent = "Erro ao carregar ranking.";
    console.error(err);
  });
}

// === Salvar score no Firebase ===
function saveScoreToFirebase() {
  const playerName = $("playerNameInput").value.trim();
  if (playerName.length === 0) {
    showNotification("Digite um nome válido.", "error");
    return;
  }
  const newScoreRef = push(ref(db, "ranking"));
  set(newScoreRef, {
    name: playerName,
    clicks: gameState.totalClicks,
    timestamp: Date.now()
  }).then(() => {
    showNotification("Ranking atualizado!");
    $("playerNameInput").value = "";
    updateRankingDisplay();
  }).catch(() => {
    showNotification("Falha ao atualizar ranking.", "error");
  });
}

// === Chat Global Simples ===
function initChat() {
  const chatRef = ref(db, "chat");

  // Ouvir mensagens novas
  onValue(chatRef, snapshot => {
    const messages = snapshot.val();
    const chatMessagesDiv = $("chatMessages");
    chatMessagesDiv.innerHTML = "";

    if (!messages) {
      chatMessagesDiv.textContent = "Nenhuma mensagem ainda.";
      return;
    }

    const msgsArr = Object.values(messages).sort((a,b) => a.timestamp - b.timestamp);
    msgsArr.forEach(msg => {
      const p = createEl("p", {}, `[${new Date(msg.timestamp).toLocaleTimeString()}] ${msg.name}: ${msg.message}`);
      chatMessagesDiv.appendChild(p);
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    });
  });
}

function sendChatMessage() {
  const now = Date.now();
  if (now - gameState.lastChatTimestamp < 3000) {
    showNotification("Aguarde 3 segundos entre mensagens.", "error");
    return;
  }
  const msgInput = $("chatInput");
  const message = msgInput.value.trim();
  if (!message) return;

  const playerName = $("playerNameInput").value.trim();
  if (!playerName) {
    showNotification("Digite seu nome para enviar mensagem.", "error");
    return;
  }

  const chatRef = ref(db, "chat");
  const newMsgRef = push(chatRef);

  set(newMsgRef, {
    name: playerName,
    message,
    timestamp: now
  }).then(() => {
    msgInput.value = "";
    gameState.lastChatTimestamp = now;
    showNotification("Mensagem enviada!");
  }).catch(() => {
    showNotification("Erro ao enviar mensagem.", "error");
  });
}

// === Alternar tema dark/light ===
function toggleTheme() {
  if (gameState.theme === "dark") {
    document.body.classList.add("light-theme");
    gameState.theme = "light";
    $("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    gameState.theme = "dark";
    $("toggleTheme").textContent = "☀️";
  }
  saveGame();
}

// === Inicialização principal ===
function init() {
  initGameData();
  loadGame();
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  updateRankingDisplay();
  initChat();

  // Botões e eventos
  $("clickBtn").addEventListener("click", () => {
    gainClicks(1 * currentMultiplier);
    checkMissionProgress();
  });

  $("rebirthBtn").addEventListener("click", () => {
    doRebirth();
  });

  $("saveBtn").addEventListener("click", () => {
    saveGame();
    showNotification("Progresso salvo manualmente!", "success");
  });

  $("clearSaveBtn").addEventListener("click", () => {
    if (confirm("Deseja realmente limpar o progresso?")) {
      localStorage.removeItem("clickerSave");
      location.reload();
    }
  });

  $("saveScoreBtn").addEventListener("click", saveScoreToFirebase);
  $("chatSendBtn").addEventListener("click", sendChatMessage);
  $("toggleTheme").addEventListener("click", toggleTheme);

  // Salvar automatico a cada 10s
  setInterval(saveGame, 10000);

  // Atualizar CPS e clicks passivos a cada segundo
  setInterval(() => {
    const cps = calcCPS() * currentMultiplier;
    if (cps > 0) gainClicks(cps);
  }, 1000);

  // Ajustar tema inicial
  if (gameState.theme === "light") document.body.classList.add("light-theme");
  else document.body.classList.remove("light-theme");
}

// Rodar init quando DOM carregar
document.addEventListener("DOMContentLoaded", init);

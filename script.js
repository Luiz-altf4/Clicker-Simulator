// ====== Import Firebase =======
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// ====== Config Firebase ======
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

// ====== Util DOM =====
const $ = id => document.getElementById(id);

// ====== Estado do jogo =====
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
  tutorialShown: false,
};

// ====== Variáveis controle =====
let cpsIntervalId = null;
let chatCooldown = false;

// ====== Funções auxiliares =====
function formatNumber(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

// ====== Notificações visuais =====
function showNotification(msg, type = "info") {
  // Cria notificação na tela, simples, auto-destrói após 3s
  const notif = document.createElement("div");
  notif.textContent = msg;
  notif.className = "notification " + type;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// ====== Atualizar display =====
function updateDisplay() {
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

// ====== Inicializar dados do jogo =====
function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
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

// ====== Funções core =====
function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

function calcCPS() {
  let baseCPS = 0;
  gameState.upgrades.forEach(u => {
    baseCPS += u.cps * u.quantity;
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

function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Parabéns! Você chegou ao nível ${gameState.level}!`, "info");
  }
}

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

function updateMissionsDisplay() {
  const missionsList = $("missions");
  missionsList.innerHTML = "";
  gameState.missions.forEach(mission => {
    const li = document.createElement("li");
    li.textContent = `${mission.description} (${Math.min(mission.progress, mission.goal)} / ${mission.goal})`;
    li.className = mission.completed ? "mission-completed" : "";
    missionsList.appendChild(li);
  });
}

function updateAchievementsDisplay() {
  const achievementsList = $("achievementsList");
  achievementsList.innerHTML = "";
  gameState.achievements.forEach(ach => {
    if (!ach.achieved && checkAchievementCriteria(ach)) {
      ach.achieved = true;
      showNotification(`Conquista desbloqueada: ${ach.name}`, "success");
    }
    const li = document.createElement("li");
    li.textContent = ach.name + (ach.achieved ? " ✔" : "");
    li.className = ach.achieved ? "achievement-achieved" : "";
    achievementsList.appendChild(li);
  });
}

function checkAchievementCriteria(achievement) {
  switch (achievement.id) {
    case 1: return gameState.totalClicks > 0;
    case 2: return gameState.level >= 10;
    case 3: return gameState.totalClicks >= 1000;
    case 4: return gameState.rebirths >= 10;
    default: return false;
  }
}

function updateUpgradesDisplay() {
  const upgradesContainer = $("upgrades");
  upgradesContainer.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    const upgDiv = document.createElement("div");
    upgDiv.className = "upgrade-item";
    const nameEl = document.createElement("h4");
    nameEl.textContent = upg.name;
    const descEl = document.createElement("p");
    descEl.textContent = upg.description;
    const qtyEl = document.createElement("p");
    qtyEl.textContent = `Quantidade: ${upg.quantity}`;
    const priceEl = document.createElement("p");
    priceEl.textContent = `Preço: ${formatNumber(price)}`;
    const buyBtn = document.createElement("button");
    buyBtn.className = "buy-btn";
    buyBtn.textContent = "Comprar";
    buyBtn.disabled = gameState.clicks < price;
    buyBtn.setAttribute("aria-label", `Comprar upgrade ${upg.name} por ${formatNumber(price)} clicks`);
    buyBtn.onclick = () => buyUpgrade(upg.id, price);

    upgDiv.append(nameEl, descEl, qtyEl, priceEl, buyBtn);
    upgradesContainer.appendChild(upgDiv);
  });
}

function buyUpgrade(id, price) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return;
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upg.quantity++;
    updateMissionsProgress("upgrades", 1);
    showNotification(`Upgrade comprado: ${upg.name}`, "success");
    updateDisplay();
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

function updateShopDisplay() {
  const shopContainer = $("shopList");
  if (!shopContainer) return;
  shopContainer.innerHTML = "";
  gameState.shopItems.forEach(item => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "shop-item";
    const nameEl = document.createElement("h4");
    nameEl.textContent = item.name;
    const descEl = document.createElement("p");
    descEl.textContent = item.description;
    const priceEl = document.createElement("p");
    priceEl.textContent = `Preço: ${formatNumber(item.price)}`;
    const buyBtn = document.createElement("button");
    buyBtn.className = "buy-btn";
    buyBtn.textContent = item.owned ? "Comprado" : "Comprar";
    buyBtn.disabled = item.owned || gameState.clicks < item.price;
    buyBtn.setAttribute("aria-label", `Comprar item ${item.name} por ${formatNumber(item.price)} clicks`);
    buyBtn.onclick = () => {
      if (!item.owned && gameState.clicks >= item.price) {
        gameState.clicks -= item.price;
        item.owned = true;
        showNotification(`Item comprado: ${item.name}`, "success");
        updateDisplay();
      }
    };

    itemDiv.append(nameEl, descEl, priceEl, buyBtn);
    shopContainer.appendChild(itemDiv);
  });
}

function updatePetsDisplay() {
  const petsContainer = $("pets");
  petsContainer.innerHTML = "";
  gameState.pets.forEach(pet => {
    const petDiv = document.createElement("div");
    petDiv.className = "pet-item";
    const nameEl = document.createElement("h4");
    nameEl.textContent = pet.name;
    const bonusEl = document.createElement("p");
    bonusEl.textContent = `Bônus: +${pet.bonusPercent}% CPS`;
    const ownedEl = document.createElement("p");
    ownedEl.textContent = pet.owned ? "Possuído" : "Não Possuído";
    const selectBtn = document.createElement("button");
    selectBtn.className = "select-pet-btn";
    selectBtn.disabled = !pet.owned && gameState.clicks < 1000;
    selectBtn.textContent = pet.owned ? (gameState.activePetId === pet.id ? "Ativo" : "Selecionar") : "Comprar (1000 clicks)";
    selectBtn.setAttribute("aria-label", pet.owned ? `Selecionar pet ${pet.name}` : `Comprar pet ${pet.name}`);

    selectBtn.onclick = () => {
      if (!pet.owned && gameState.clicks >= 1000) {
        pet.owned = true;
        gameState.clicks -= 1000;
        showNotification(`Pet comprado: ${pet.name}`, "success");
      }
      if (pet.owned) {
        gameState.activePetId = pet.id;
        showNotification(`Pet ativo: ${pet.name}`, "info");
      }
      updateDisplay();
    };

    petDiv.append(nameEl, bonusEl, ownedEl, selectBtn);
    petsContainer.appendChild(petDiv);
  });
}

// ====== Ranking online =====
let rankingListener = null;
function updateRankingDisplay() {
  const rankingContainer = $("detailedRankingList");
  if (!rankingContainer) return;
  rankingContainer.innerHTML = "Carregando ranking...";

  // Remove listener antigo pra não acumular
  if (rankingListener) rankingListener();

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  rankingListener = onValue(rankingRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      rankingContainer.innerHTML = "<p>Nenhum jogador encontrado.</p>";
      return;
    }
    const players = Object.values(data).sort((a,b) => b.clicks - a.clicks);
    rankingContainer.innerHTML = "";
    players.forEach((player, index) => {
      const div = document.createElement("div");
      div.className = "ranking-item";
      div.textContent = `${index + 1}º - ${player.name || "Anônimo"}: ${formatNumber(player.clicks)} clicks`;
      rankingContainer.appendChild(div);
    });
  });
}

// ====== Funções do chat com debounce =====
function sendMessage() {
  if (chatCooldown) {
    showNotification("Aguarde antes de enviar outra mensagem.", "error");
    return;
  }
  const input = $("chatInput");
  const msg = input.value.trim();
  if (!msg) return; // Não enviar vazio
  if (msg.length > 200) {
    showNotification("Mensagem muito longa (máx 200 caracteres).", "error");
    return;
  }
  const playerName = $("playerNameInput").value.trim() || "Anônimo";
  const chatRef = push(ref(db, "chat"));
  set(chatRef, {
    name: playerName,
    message: msg,
    timestamp: Date.now()
  }).then(() => {
    input.value = "";
    chatCooldown = true;
    setTimeout(() => chatCooldown = false, 3000); // Cooldown de 3 segundos
  }).catch(err => {
    console.error("Erro ao enviar mensagem:", err);
    showNotification("Erro ao enviar mensagem.", "error");
  });
}

function updateChatDisplay() {
  const chatContainer = $("chatMessages");
  if (!chatContainer) return;
  chatContainer.innerHTML = "Carregando chat...";
  const chatRef = query(ref(db, "chat"), orderByChild("timestamp"), limitToLast(50));
  onValue(chatRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      chatContainer.innerHTML = "<p>Sem mensagens no chat.</p>";
      return;
    }
    const messages = Object.values(data).sort((a,b) => a.timestamp - b.timestamp);
    chatContainer.innerHTML = "";
    messages.forEach(msg => {
      const div = document.createElement("div");
      div.className = "chat-message";
      div.textContent = `${msg.name}: ${msg.message}`;
      chatContainer.appendChild(div);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    });
  });
}

// ====== Rebirth =====
function doRebirth() {
  if (gameState.clicks >= 100000) {
    gameState.rebirths++;
    gameState.clicks = 0;
    gameState.totalClicks = 0;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.xpToNext = 100;
    gameState.upgrades.forEach(u => u.quantity = 0);
    gameState.shopItems.forEach(i => i.owned = false);
    gameState.activePetId = null;
    showNotification("Rebirth realizado com sucesso!", "info");
    updateDisplay();
    updateMissionsProgress("rebirths", 1);
  } else {
    showNotification("Você precisa de 100.000 clicks para fazer um rebirth!", "error");
  }
}

// ====== Salvar jogo =====
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
    showNotification("Progresso salvo com sucesso!", "success");
  } catch(err) {
    console.error("Erro ao salvar:", err);
    showNotification("Falha ao salvar progresso!", "error");
  }
}

// ====== Carregar jogo =====
function loadGame() {
  const saveData = localStorage.getItem("clickerSave");
  if (saveData) {
    try {
      const parsed = JSON.parse(saveData);
      Object.assign(gameState, parsed);
      showNotification("Progresso carregado!", "success");
    } catch(err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
    }
  }
}

// ====== Botão de clique principal =====
$("clickBtn").onclick = () => gainClicks(1);

// ====== Auto click por segundo =====
function startCPS() {
  if (cpsIntervalId) clearInterval(cpsIntervalId);
  cpsIntervalId = setInterval(() => {
    const cps = calcCPS();
    if (cps > 0) gainClicks(cps);
  }, 1000);
}

// ====== Salvar score no ranking =====
$("saveScoreBtn").onclick = () => {
  const name = $("playerNameInput").value.trim();
  if (!name || name.length < 3) return alert("Nome muito curto!");
  const playerRef = push(ref(db, "ranking"));
  set(playerRef, {
    name,
    clicks: Math.floor(gameState.clicks)
  }).then(() => {
    showNotification("Score salvo no ranking!", "success");
    $("playerNameInput").value = "";
  }).catch(err => {
    console.error("Erro ao salvar score:", err);
    showNotification("Erro ao salvar score!", "error");
  });
};

// ====== Botões ações =====
$("saveBtn").onclick = saveGame;
$("rebirthBtn").onclick = doRebirth;
$("clearSaveBtn").onclick = () => {
  if (confirm("Tem certeza que deseja apagar todo o progresso?")) {
    localStorage.removeItem("clickerSave");
    location.reload();
  }
};
$("sendChatBtn").onclick = sendMessage;

// ====== Tema claro/escuro =====
$("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  gameState.theme = document.body.classList.contains("light-theme") ? "light" : "dark";
  $("toggleTheme").textContent = gameState.theme === "light" ? "🌙" : "☀️";
};

// ====== Antes de sair =====
window.addEventListener("beforeunload", saveGame);

// ====== Iniciar =====
window.addEventListener("load", () => {
  initGameData();
  loadGame();
  updateDisplay();
  updateRankingDisplay();
  updateChatDisplay();
  startCPS();
});

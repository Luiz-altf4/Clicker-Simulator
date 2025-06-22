// =================== Parte 1/3 - Estado, Firebase, Utilidades ===================

// === Importações Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  onValue,
  query,
  orderByChild,
  limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Configuração Firebase ===
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

// === Estado inicial do jogo ===
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

// === Utilitários DOM e helpers ===
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

function getWorldName(id) {
  const worlds = [
    "Jardim Inicial",
    "Cidade Neon",
    "Espaço",
    "Dimensão",
    "Reino Sombrio",
    "Mundo Místico",
    "Terra dos Dragões"
  ];
  return worlds[id - 1] || "???";
}

function showNotification(text, type = "info") {
  const notif = createElement("div", { className: `notif ${type}` }, text);
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
    showNotification("Progresso salvo com sucesso!", "success");
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

// =================== Parte 2/3 - Clique, XP, Display, Missões, Upgrades, Pets ===================

// Ganha XP e sobe nível automaticamente
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Parabéns! Você chegou ao nível ${gameState.level}!`, "info");
  }
}

// Função para ganhar clicks considerando pet e multiplicadores
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
  saveGame();
}

// Atualiza progresso das missões
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

// Atualiza display das missões
function updateMissionsDisplay() {
  const missionsList = $("missions");
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

// Atualiza display das conquistas
function updateAchievementsDisplay() {
  const achievementsList = $("achievementsList");
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

// Checa critérios para conquistas
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

// Atualiza display dos upgrades
function updateUpgradesDisplay() {
  const upgradesContainer = $("upgrades");
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

// Comprar upgrade
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

// Atualiza display da loja
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

// Atualiza display dos pets
function updatePetsDisplay() {
  const petsContainer = $("pets");
  petsContainer.innerHTML = "";

  gameState.pets.forEach(pet => {
    const petDiv = createElement("div", { className: "pet-item" });
    const nameEl = createElement("h4", {}, pet.name);
    const bonusEl = createElement("p", {}, `Bônus: +${pet.bonusPercent}% CPS`);
    const ownedEl = createElement("p", {}, pet.owned ? "Possuído" : "Não Possuído");
    const selectBtn = createElement("button", {
      className: "select-pet-btn",
      "aria-label": pet.owned ? `Selecionar pet ${pet.name}` : `Comprar pet ${pet.name}`,
      disabled: !pet.owned && gameState.clicks < 1000 // preço fictício
    }, pet.owned ? (gameState.activePetId === pet.id ? "Ativo" : "Selecionar") : "Comprar (1000 clicks)");

    selectBtn.addEventListener("click", () => {
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
      saveGame();
    });

    petDiv.append(nameEl, bonusEl, ownedEl, selectBtn);
    petsContainer.appendChild(petDiv);
  });
}

// Botão principal de clique
$("clickBtn").addEventListener("click", () => {
  gainClicks(1);
});

// Auto-click CPS, intervalo único garantido pela inicialização principal
let cpsIntervalId = null;
function startCPS() {
  if (cpsIntervalId) clearInterval(cpsIntervalId);
  cpsIntervalId = setInterval(() => {
    const cps = calcCPS();
    gainClicks(cps);
  }, 1000);
}

// Atualiza tudo no display
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
}

// =================== Parte 3/3 - Ranking, Chat, Rebirth, Tema e Inicialização ===================

// Sistema de Rebirth
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
    saveGame();
  } else {
    showNotification("Você precisa de 100.000 clicks para fazer um rebirth!", "error");
  }
}

// Botões de ações principais
$("saveBtn").addEventListener("click", saveGame);
$("rebirthBtn").addEventListener("click", doRebirth);
$("clearSaveBtn").addEventListener("click", () => {
  if (confirm("Tem certeza que deseja apagar todo o progresso?")) {
    localStorage.removeItem("clickerSave");
    location.reload();
  }
});

// Ranking online: atualizar display do ranking top 10
function updateRankingDisplay() {
  const rankingContainer = $("detailedRankingList");
  if (!rankingContainer) return;
  rankingContainer.innerHTML = "Carregando ranking...";

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(rankingRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      rankingContainer.innerHTML = "<p>Nenhum jogador encontrado.</p>";
      return;
    }

    const players = Object.values(data).sort((a, b) => b.clicks - a.clicks);
    rankingContainer.innerHTML = "";

    players.forEach((player, index) => {
      const div = createElement("div", { className: "ranking-item" },
        `${index + 1}º - ${player.name || "Anônimo"}: ${formatNumber(player.clicks)} clicks`
      );
      rankingContainer.appendChild(div);
    });
  });
}

// Salvar score no ranking com verificação para evitar duplicados
$("saveScoreBtn").addEventListener("click", async () => {
  const name = $("playerNameInput").value.trim();
  if (!name || name.length < 3) return alert("Nome muito curto!");

  try {
    // Buscar entradas existentes do jogador
    const rankingRef = ref(db, "ranking");
    const snapshot = await get(rankingRef);
    let foundKey = null;
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const key in data) {
        if (data[key].name === name) {
          foundKey = key;
          break;
        }
      }
    }

    if (foundKey) {
      // Atualizar score se maior
      const playerRef = ref(db, `ranking/${foundKey}`);
      const currentScoreSnap = await get(playerRef);
      if (currentScoreSnap.exists() && currentScoreSnap.val().clicks < Math.floor(gameState.clicks)) {
        await set(playerRef, { name, clicks: Math.floor(gameState.clicks) });
        showNotification("Score atualizado no ranking!", "success");
      } else {
        showNotification("Seu score atual é menor ou igual ao registrado.", "info");
      }
    } else {
      // Criar nova entrada
      const playerRef = push(ref(db, "ranking"));
      await set(playerRef, { name, clicks: Math.floor(gameState.clicks) });
      showNotification("Score salvo no ranking!", "success");
    }
    $("playerNameInput").value = "";
  } catch (err) {
    console.error("Erro ao salvar score:", err);
    showNotification("Erro ao salvar score!", "error");
  }
});

// Chat global com proteção anti-spam
const chatRef = ref(db, "chat");
const chatMessagesContainer = $("chatMessages");
let lastChatTimestamp = 0;

function sanitizeInput(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function addChatMessage(msg) {
  const msgDiv = createElement("div", { className: "chat-message" });
  msgDiv.innerHTML = `<strong>${sanitizeInput(msg.name)}:</strong> ${sanitizeInput(msg.text)}`;
  chatMessagesContainer.appendChild(msgDiv);
  chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// Escuta chat em tempo real
onValue(chatRef, snapshot => {
  chatMessagesContainer.innerHTML = "";
  const data = snapshot.val();
  if (!data) return;
  const msgs = Object.values(data);
  msgs.forEach(msg => addChatMessage(msg));
});

// Enviar mensagem chat com limite 1 msg a cada 5 segundos
$("chatForm").addEventListener("submit", e => {
  e.preventDefault();
  const nameInput = $("chatName");
  const textInput = $("chatText");
  const now = Date.now();

  if (now - lastChatTimestamp < 5000) {
    showNotification("Aguarde 5 segundos entre mensagens.", "error");
    return;
  }

  const name = nameInput.value.trim();
  const text = textInput.value.trim();

  if (name.length < 3) {
    showNotification("Nome muito curto.", "error");
    return;
  }
  if (text.length < 1) {
    showNotification("Mensagem vazia.", "error");
    return;
  }
  if (text.length > 200) {
    showNotification("Mensagem muito longa.", "error");
    return;
  }

  push(chatRef, { name, text, timestamp: now })
    .then(() => {
      lastChatTimestamp = now;
      textInput.value = "";
    })
    .catch(err => {
      console.error("Erro ao enviar mensagem:", err);
      showNotification("Erro ao enviar mensagem.", "error");
    });
});

// Tema claro/escuro toggle
$("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  gameState.theme = document.body.classList.contains("light-theme") ? "light" : "dark";
  $("toggleTheme").textContent = gameState.theme === "light" ? "🌙" : "☀️";
  saveGame();
});

// Salvar antes de sair
window.addEventListener("beforeunload", () => {
  saveGame();
});

// Inicialização do jogo
window.addEventListener("load", () => {
  initGameData();
  loadGame();

  updateDisplay();
  updateRankingDisplay();
  startCPS();

  // Aplica tema salvo
  if (gameState.theme === "light") {
    document.body.classList.add("light-theme");
    $("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    $("toggleTheme").textContent = "☀️";
  }
});

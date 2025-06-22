// =================== Parte 1/3 do JS Corrigido e Melhorado ===================

// === Importações Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Estado do jogo ===
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

// === DOM Utils ===
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

// === Formatação números com unidades ===
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

// === Funções básicas ===
function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

// === Inicialização dos dados do jogo ===
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

// === Salvar estado no localStorage ===
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
    showNotification("Progresso salvo com sucesso!", "success");
  } catch (err) {
    console.error("Erro ao salvar:", err);
    showNotification("Falha ao salvar progresso!", "error");
  }
}

// === Carregar estado do localStorage ===
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

// === Atualizar display principal ===
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

// === Cálculo de CPS (Clicks Por Segundo) ===
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

// === Ganha XP ===
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Parabéns! Você chegou ao nível ${gameState.level}!`, "info");
    checkAchievements(); // Atualiza conquistas baseadas no nível
  }
}

// === Função para ganhar clicks ===
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

// === Função para atualizar progresso das missões ===
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

// === Atualizar display das missões ===
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

// === Atualizar display das conquistas ===
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

// === Checar critérios para conquistas ===
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

// === Atualizar display dos upgrades ===
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

// === Comprar upgrade ===
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

// === Atualizar display da loja ===
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
      }
    });

    itemDiv.append(nameEl, descEl, priceEl, buyBtn);
    shopContainer.appendChild(itemDiv);
  });
}

// === Atualizar display dos pets ===
function updatePetsDisplay() {
  const petsContainer = $("pets");
  petsContainer.innerHTML = "";

  gameState.pets.forEach(pet => {
    const petDiv = createElement("div", { className: "pet-item" });
    const nameEl = createElement("h4", {}, pet.name);
    const bonusEl = createElement("p", {}, `Bônus: +${pet.bonusPercent}% CPS`);
    const ownedEl = createElement("p", {}, pet.owned ? "Possuído" : "Não Possuído");

    let btnText = "Comprar (1000 clicks)";
    let disabled = gameState.clicks < 1000;
    if (pet.owned) {
      if (gameState.activePetId === pet.id) {
        btnText = "Ativo";
        disabled = true;
      } else {
        btnText = "Selecionar";
        disabled = false;
      }
    }

    const selectBtn = createElement("button", {
      className: "select-pet-btn",
      "aria-label": btnText + " pet " + pet.name,
      disabled: disabled
    }, btnText);

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
    });

    petDiv.append(nameEl, bonusEl, ownedEl, selectBtn);
    petsContainer.appendChild(petDiv);
  });
}

// === Atualizar ranking online (top 10) ===
function updateRankingDisplay() {
  const rankingContainer = $("detailedRankingList");
  if (!rankingContainer) return;
  rankingContainer.innerHTML = "Carregando ranking...";

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(rankingRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      rankingContainer.innerHTML = "<p>Nenhum dado no ranking.</p>";
      return;
    }

    // Ordenar do maior para menor
    const entries = Object.entries(data).sort((a, b) => b[1].clicks - a[1].clicks);

    rankingContainer.innerHTML = "";
    entries.forEach(([key, val], i) => {
      const rankEl = createElement("div", { className: "ranking-entry" });
      rankEl.textContent = `#${i + 1} ${val.name || "Anon"} - Clicks: ${formatNumber(val.clicks)}`;
      rankingContainer.appendChild(rankEl);
    });
  });
}

// === Enviar score para ranking Firebase ===
function sendScoreToFirebase(name, clicks) {
  if (!name) name = "Anon";
  const rankingRef = ref(db, "ranking");

  // Salvar um novo score (push)
  const newScoreRef = push(rankingRef);
  set(newScoreRef, {
    name: name,
    clicks: clicks,
    timestamp: Date.now()
  }).then(() => {
    showNotification("Score enviado ao ranking!", "success");
  }).catch(() => {
    showNotification("Erro ao enviar score!", "error");
  });
}

// === Função de notificações visuais ===
function showNotification(message, type = "info") {
  const container = $("notificationContainer");
  if (!container) return;

  const notif = createElement("div", { className: `notification ${type}` }, message);
  container.appendChild(notif);

  setTimeout(() => {
    notif.classList.add("fadeout");
    setTimeout(() => container.removeChild(notif), 1000);
  }, 3000);
}

// === Função clique principal ===
function handleClick() {
  gainClicks(gameState.buyAmount);
}

// === Intervalo de CPS ===
let cpsInterval;
function startCPS() {
  if (cpsInterval) clearInterval(cpsInterval);
  cpsInterval = setInterval(() => {
    const cps = calcCPS();
    if (cps > 0) gainClicks(cps);
  }, 1000);
}

// === Função rebirth ===
function canRebirth() {
  return gameState.clicks >= 100000; // Rebirth disponível a partir de 100k clicks
}

function doRebirth() {
  if (!canRebirth()) {
    showNotification("Você precisa de pelo menos 100.000 clicks para rebirth!", "error");
    return;
  }
  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.shopItems.forEach(i => i.owned = false);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  showNotification("Você fez rebirth! Seu progresso foi reiniciado, mas você ganhou 1 rebirth!", "success");
  updateDisplay();
}

// =================== Fim da Parte 1/3 ===================

// =================== Parte 2/3 do JS Corrigido e Melhorado ===================

// === Funções para salvar e carregar do Firebase (ranking e perfil) ===

async function saveProfileToFirebase(username) {
  if (!username) username = "Anon";
  try {
    const userRef = ref(db, `profiles/${username}`);
    await set(userRef, {
      clicks: gameState.clicks,
      totalClicks: gameState.totalClicks,
      level: gameState.level,
      rebirths: gameState.rebirths,
      xp: gameState.xp,
      activePetId: gameState.activePetId,
      timestamp: Date.now()
    });
    showNotification("Perfil salvo no Firebase!", "success");
  } catch (error) {
    console.error("Erro ao salvar perfil no Firebase:", error);
    showNotification("Erro ao salvar perfil!", "error");
  }
}

async function loadProfileFromFirebase(username) {
  if (!username) return;
  try {
    const userRef = ref(db, `profiles/${username}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const data = snapshot.val();
      Object.assign(gameState, {
        clicks: data.clicks || 0,
        totalClicks: data.totalClicks || 0,
        level: data.level || 1,
        rebirths: data.rebirths || 0,
        xp: data.xp || 0,
        activePetId: data.activePetId || null
      });
      showNotification(`Perfil ${username} carregado!`, "success");
      updateDisplay();
    } else {
      showNotification("Perfil não encontrado!", "error");
    }
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    showNotification("Erro ao carregar perfil!", "error");
  }
}

// === Tema claro/escuro ===
function toggleTheme() {
  if (gameState.theme === "dark") {
    gameState.theme = "light";
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    gameState.theme = "dark";
    document.documentElement.setAttribute("data-theme", "dark");
  }
  saveGame();
}

function initTheme() {
  if (gameState.theme === "light") {
    document.documentElement.setAttribute("data-theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
  }
}

// === Sons ===
const audioClick = new Audio("sounds/click.mp3");
const audioUpgrade = new Audio("sounds/upgrade.mp3");
audioClick.volume = gameState.audio.effectsVolume;
audioUpgrade.volume = gameState.audio.effectsVolume;

function playClickSound() {
  if (gameState.audio.effectsVolume > 0) audioClick.play().catch(() => {});
}

function playUpgradeSound() {
  if (gameState.audio.effectsVolume > 0) audioUpgrade.play().catch(() => {});
}

// === Eventos dos botões ===

$("clickButton").addEventListener("click", () => {
  handleClick();
  playClickSound();
});

$("buyAmountSelect").addEventListener("change", (e) => {
  gameState.buyAmount = parseInt(e.target.value) || 1;
});

$("rebirthButton").addEventListener("click", () => {
  doRebirth();
});

$("saveButton").addEventListener("click", () => {
  saveGame();
});

$("loadButton").addEventListener("click", () => {
  loadGame();
});

$("toggleThemeButton").addEventListener("click", () => {
  toggleTheme();
});

// === Auto save a cada 30 segundos ===
setInterval(() => {
  saveGame();
}, 30000);

// === Auto save do ranking no Firebase a cada 60 segundos (se nome fornecido) ===
let lastSavedName = "";

$("sendScoreButton").addEventListener("click", () => {
  const username = $("usernameInput").value.trim();
  if (!username) {
    showNotification("Digite um nome para enviar seu score!", "error");
    return;
  }
  sendScoreToFirebase(username, gameState.totalClicks);
  lastSavedName = username;
});

// Auto salvar perfil Firebase a cada 60s, se nome preenchido
setInterval(() => {
  if (lastSavedName) {
    saveProfileToFirebase(lastSavedName);
  }
}, 60000);

// === Inicialização geral ===
function init() {
  initGameData();
  loadGame();
  initTheme();
  updateDisplay();
  startCPS();

  // Mostrar tutorial uma vez
  if (!gameState.tutorialShown) {
    alert("Bem-vindo ao Clicker Simulator! Clique no botão para ganhar clicks. Compre upgrades para aumentar sua produção. Faça rebirth para reiniciar e ganhar bônus!");
    gameState.tutorialShown = true;
  }
}

init();

// === Função para limpar ranking no Firebase (uso dev, cuidado!) ===
function clearRanking() {
  set(ref(db, "ranking"), null)
    .then(() => showNotification("Ranking limpo com sucesso!", "success"))
    .catch(() => showNotification("Erro ao limpar ranking!", "error"));
}

// === Evento para limpar ranking via botão (se houver) ===
const clearRankingBtn = $("clearRankingButton");
if (clearRankingBtn) {
  clearRankingBtn.addEventListener("click", () => {
    if (confirm("Tem certeza que quer limpar o ranking?")) clearRanking();
  });
}

// === Event listeners para salvar/load rápido com teclas ===
window.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    saveGame();
  }
  if (e.ctrlKey && e.key === "l") {
    e.preventDefault();
    loadGame();
  }
});

// =================== Fim da Parte 2/3 ===================

// =================== Parte 3/3 do JS Corrigido e Melhorado ===================

// === Funções para atualizar e mostrar ranking no Firebase ===

function updateRankingDisplay() {
  const rankingContainer = $("rankingContainer");
  if (!rankingContainer) return;

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));

  onValue(rankingRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      rankingContainer.innerHTML = "<p>Nenhum dado no ranking.</p>";
      return;
    }

    // Ordenar do maior para menor clicks
    const entries = Object.entries(data).sort((a, b) => b[1].clicks - a[1].clicks);

    rankingContainer.innerHTML = "";
    entries.forEach(([key, val], i) => {
      const rankEl = createElement("div", { className: "ranking-entry" });
      rankEl.textContent = `#${i + 1} ${val.name || "Anon"} - Clicks: ${formatNumber(val.clicks)}`;
      rankingContainer.appendChild(rankEl);
    });
  });
}

// Atualizar ranking a cada 10 segundos para refletir mudanças
setInterval(() => {
  updateRankingDisplay();
}, 10000);

// Atualizar no carregamento inicial
updateRankingDisplay();

// === Função para sanitizar texto do chat e inputs ===
function sanitizeInput(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// === Chat global via Firebase ===
const chatInput = $("chatInput");
const chatMessages = $("chatMessages");
const chatSendBtn = $("chatSendButton");
const chatRef = ref(db, "chat");

// Limite simples para evitar spam: 1 mensagem a cada 5 segundos por usuário (simples, sem autenticação)
let lastMessageTime = 0;

function sendChatMessage() {
  const now = Date.now();
  if (now - lastMessageTime < 5000) {
    showNotification("Aguarde 5 segundos entre mensagens!", "error");
    return;
  }

  const msg = chatInput.value.trim();
  if (msg.length === 0 || msg.length > 200) {
    showNotification("Mensagem inválida (vazia ou muito longa)!", "error");
    return;
  }

  const sanitizedMsg = sanitizeInput(msg);
  const username = $("usernameInput").value.trim() || "Anon";

  const newMsgRef = push(chatRef);
  set(newMsgRef, {
    name: username,
    message: sanitizedMsg,
    timestamp: now
  }).then(() => {
    chatInput.value = "";
    lastMessageTime = now;
  }).catch(() => {
    showNotification("Erro ao enviar mensagem!", "error");
  });
}

chatSendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendChatMessage();
  }
});

// === Ouvir mensagens de chat em tempo real ===
onValue(chatRef, snapshot => {
  const data = snapshot.val();
  chatMessages.innerHTML = "";
  if (!data) {
    chatMessages.innerHTML = "<p>Nenhuma mensagem no chat.</p>";
    return;
  }

  const messages = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
  messages.forEach(msg => {
    const msgEl = createElement("div", { className: "chat-message" });
    msgEl.innerHTML = `<strong>${sanitizeInput(msg.name)}:</strong> ${sanitizeInput(msg.message)}`;
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
});

// === Melhoria no botão comprar upgrades: feedback e desabilitar botão se insuficiente ===
function updateUpgradeButtons() {
  gameState.upgrades.forEach(upg => {
    const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    const buyBtn = document.querySelector(`button.buy-btn[data-upgrade-id="${upg.id}"]`);
    if (!buyBtn) return;
    buyBtn.disabled = gameState.clicks < price;
  });
}

// === Atualizar display chama updateUpgradeButtons para manter os botões coerentes ===
const originalUpdateDisplay = updateDisplay;
updateDisplay = function() {
  originalUpdateDisplay();
  updateUpgradeButtons();
}

// === Corrigir bug: evitar múltiplos intervalos de CPS ===
if (window.cpsInterval) clearInterval(window.cpsInterval);
window.cpsInterval = setInterval(() => {
  const cps = calcCPS();
  if (cps > 0) gainClicks(cps);
}, 1000);

// === Salvar automaticamente antes de sair ===
window.addEventListener("beforeunload", () => {
  saveGame();
});

// === Inicialização ===
window.addEventListener("load", () => {
  initGameData();
  loadGame();
  initTheme();
  updateDisplay();
  startCPS();
  updateRankingDisplay();
});


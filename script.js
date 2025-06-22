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

// === Função segura de formatar número com unidades (K, M, B, etc) ===
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

// === Função que retorna nome do mundo pelo ID ===
function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

// === Inicializa upgrades, pets, loja, missões, conquistas ===
function initGameData() {
  // Upgrades - id, nome, descrição, CPS, quantidade, preço base
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
  ];

  // Itens da loja (multiplicadores temporários)
  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra produção por 5 minutos", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla produção por 2 minutos", owned: false, price: 5000, effectDuration: 120000 },
  ];

  // Pets com bônus percentual em CPS
  gameState.pets = [
    { id: 1, name: "Gato Clicker", bonusPercent: 5, owned: false },
    { id: 2, name: "Cachorro Robótico", bonusPercent: 15, owned: false },
    { id: 3, name: "Dragão Cibernético", bonusPercent: 30, owned: false },
  ];

  // Missões para ganhar XP e recompensas
  gameState.missions = [
    { id: 1, description: "Clique 100 vezes", goal: 100, progress: 0, rewardXP: 50, completed: false },
    { id: 2, description: "Compre 5 upgrades", goal: 5, progress: 0, rewardXP: 100, completed: false },
    { id: 3, description: "Faça 1 rebirth", goal: 1, progress: 0, rewardXP: 500, completed: false },
  ];

  // Conquistas
  gameState.achievements = [
    { id: 1, name: "Primeiro Click", description: "Realize seu primeiro click", achieved: false },
    { id: 2, name: "Novato", description: "Alcance nível 10", achieved: false },
    { id: 3, name: "Profissional", description: "Alcance 1000 clicks", achieved: false },
    { id: 4, name: "Veterano", description: "Realize 10 rebirths", achieved: false },
  ];
}

// === Salvar jogo no localStorage ===
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
    showNotification("Progresso salvo com sucesso!", "success");
  } catch (err) {
    console.error("Erro ao salvar:", err);
    showNotification("Falha ao salvar progresso!", "error");
  }
}

// === Carregar jogo do localStorage ===
function loadGame() {
  const saveData = localStorage.getItem("clickerSave");
  if (saveData) {
    try {
      const parsed = JSON.parse(saveData);
      // Merge para evitar sobrescrever funções etc
      for (const key in parsed) {
        if (gameState.hasOwnProperty(key)) {
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

// === Atualiza a interface principal com dados atuais ===
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
  updateChatDisplay();
}

// === Cálculo do CPS (Clicks Por Segundo) ===
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

// === Ganhar XP e level up ===
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Parabéns! Você chegou ao nível ${gameState.level}!`, "info");
  }
}

// === Ganhar clicks (manual ou automático) ===
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

// === Atualiza progresso das missões ===
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

// === Atualiza display das missões ===
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

// === Atualiza display das conquistas ===
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

// === Atualiza display dos upgrades ===
function updateUpgradesDisplay() {
  const container = $("upgrades");
  container.innerHTML = "";

  gameState.upgrades.forEach(upg => {
    const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    const upgDiv = createElement("div", { className: "upgrade-item" });
    const nameEl = createElement("h4", {}, upg.name);
    const descEl = createElement("p", {}, upg.description);
    const qtyEl = createElement("p", {}, `Quantidade: ${upg.quantity}`);
    const priceEl = createElement("p", {}, `Preço: ${formatNumber(price)}`);

    const buyBtn = createElement("button", {
      className: "buy-btn",
      "aria-label": `Comprar upgrade ${upg.name} por ${formatNumber(price)} clicks`,
      disabled: gameState.clicks < price
    }, "Comprar");

    buyBtn.addEventListener("click", () => buyUpgrade(upg.id, price));

    upgDiv.append(nameEl, descEl, qtyEl, priceEl, buyBtn);
    container.appendChild(upgDiv);
  });
}

// === Comprar upgrade ===
function buyUpgrade(id, price) {
  if (gameState.clicks >= price) {
    const upg = gameState.upgrades.find(u => u.id === id);
    if (!upg) return;
    gameState.clicks -= price;
    upg.quantity++;
    showNotification(`Upgrade ${upg.name} comprado!`, "success");
    updateMissionsProgress("upgrades");
    updateDisplay();
    saveGame();
  }
}

// === Atualiza display da loja ===
function updateShopDisplay() {
  const shopContainer = $("shopItems");
  shopContainer.innerHTML = "";

  gameState.shopItems.forEach(item => {
    const itemDiv = createElement("div", { className: "shop-item" });
    const nameEl = createElement("h4", {}, item.name);
    const descEl = createElement("p", {}, item.description);
    const priceEl = createElement("p", {}, `Preço: ${formatNumber(item.price)} clicks`);
    const ownedEl = createElement("p", {}, item.owned ? "Ativo" : "Disponível");

    const buyBtn = createElement("button", {
      className: "buy-btn",
      "aria-label": `Comprar item da loja ${item.name} por ${formatNumber(item.price)} clicks`,
      disabled: item.owned || gameState.clicks < item.price
    }, item.owned ? "Comprado" : "Comprar");

    buyBtn.addEventListener("click", () => buyShopItem(item.id));

    itemDiv.append(nameEl, descEl, priceEl, ownedEl, buyBtn);
    shopContainer.appendChild(itemDiv);
  });
}

// === Comprar item da loja ===
function buyShopItem(id) {
  const item = gameState.shopItems.find(i => i.id === id);
  if (!item) return;
  if (gameState.clicks >= item.price && !item.owned) {
    gameState.clicks -= item.price;
    item.owned = true;

    // Remove o efeito após o tempo de duração
    setTimeout(() => {
      item.owned = false;
      showNotification(`O efeito do item ${item.name} terminou.`, "info");
      updateDisplay();
      saveGame();
    }, item.effectDuration);

    showNotification(`Você ativou ${item.name}!`, "success");
    updateDisplay();
    saveGame();
  }
}

// === Atualiza display dos pets ===
function updatePetsDisplay() {
  const petsContainer = $("pets");
  petsContainer.innerHTML = "";

  gameState.pets.forEach(pet => {
    const petDiv = createElement("div", { className: "pet-item" });
    const nameEl = createElement("h4", {}, pet.name);
    const bonusEl = createElement("p", {}, `Bônus CPS: ${pet.bonusPercent}%`);
    const ownedEl = createElement("p", {}, pet.owned ? "Obtido" : "Disponível");

    const buyBtn = createElement("button", {
      className: "buy-btn",
      "aria-label": `Comprar pet ${pet.name}`,
      disabled: pet.owned || gameState.clicks < 500 // preço fixo por pet (pode ajustar)
    }, pet.owned ? "Comprado" : "Comprar (500 clicks)");

    buyBtn.addEventListener("click", () => buyPet(pet.id));

    const selectBtn = createElement("button", {
      className: "select-btn",
      "aria-label": `Selecionar pet ${pet.name}`,
      disabled: !pet.owned || gameState.activePetId === pet.id
    }, "Selecionar");

    selectBtn.addEventListener("click", () => selectPet(pet.id));

    petDiv.append(nameEl, bonusEl, ownedEl, buyBtn, selectBtn);
    petsContainer.appendChild(petDiv);
  });
}

// === Comprar pet ===
function buyPet(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet) return;
  if (gameState.clicks >= 500 && !pet.owned) {
    gameState.clicks -= 500;
    pet.owned = true;
    showNotification(`Você comprou o pet ${pet.name}!`, "success");
    updateDisplay();
    saveGame();
  }
}

// === Selecionar pet ativo ===
function selectPet(id) {
  if (gameState.activePetId === id) return;
  gameState.activePetId = id;
  showNotification(`Pet ${gameState.pets.find(p => p.id === id).name} selecionado!`, "info");
  updateDisplay();
  saveGame();
}

// === Função para rebirth (resetar parte do progresso para ganhar bônus) ===
function doRebirth() {
  if (gameState.clicks < 1000000) {
    showNotification("Você precisa de pelo menos 1.000.000 clicks para rebirth!", "error");
    return;
  }
  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.cps = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.currentWorld = 1;
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  gameState.shopItems.forEach(i => i.owned = false);
  showNotification("Rebirth realizado! Você ganhou bônus de produção!", "success");
  updateDisplay();
  saveGame();
}

// === Função de notificação simples ===
function showNotification(message, type = "info") {
  const notif = createElement("div", { className: `notification ${type}` }, message);
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}

// === Clique manual no botão principal ===
$("clickButton").addEventListener("click", () => {
  gainClicks(1 * gameState.buyAmount);
  updateDisplay();
  saveGame();
});

// === Incremento automático (CPS) a cada segundo ===
setInterval(() => {
  const cps = calcCPS();
  if (cps > 0) gainClicks(cps);
}, 1000);

// === Salvar automático a cada 15 segundos ===
setInterval(() => {
  saveGame();
}, 15000);

// === Inicializa tudo no carregamento da página ===
window.addEventListener("load", () => {
  initGameData();
  loadGame();
  updateDisplay();
});

// === Ranking Firebase - enviar pontuação ===
$("submitScore").addEventListener("click", () => {
  const playerName = $("playerNameInput").value.trim();
  if (!playerName) {
    showNotification("Digite seu nome para enviar o ranking.", "error");
    return;
  }
  const scoreRef = ref(db, "ranking");
  const newScoreRef = push(scoreRef);
  set(newScoreRef, {
    name: playerName,
    clicks: gameState.totalClicks,
    timestamp: Date.now()
  }).then(() => {
    showNotification("Pontuação enviada!", "success");
    $("playerNameInput").value = "";
  }).catch(() => {
    showNotification("Erro ao enviar pontuação!", "error");
  });
});

// === Atualizar ranking na interface (últimos 10) ===
function updateRankingDisplay() {
  const rankingList = $("rankingList");
  rankingList.innerHTML = "<li>Carregando...</li>";

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));

  onValue(rankingRef, (snapshot) => {
    rankingList.innerHTML = "";
    let data = [];
    snapshot.forEach(childSnapshot => {
      data.push(childSnapshot.val());
    });
    // Ordenar decrescente
    data.sort((a, b) => b.clicks - a.clicks);

    if(data.length === 0) {
      rankingList.innerHTML = "<li>Nenhuma pontuação ainda.</li>";
      return;
    }

    data.forEach(entry => {
      const li = createElement("li", {}, `${entry.name} - ${formatNumber(entry.clicks)} clicks`);
      rankingList.appendChild(li);
    });
  });
}

// === Chat global básico com limite simples para evitar spam ===
let chatCooldown = false;

$("sendChatBtn").addEventListener("click", () => {
  if (chatCooldown) {
    showNotification("Espere antes de enviar outra mensagem.", "error");
    return;
  }

  const msgInput = $("chatInput");
  const msg = msgInput.value.trim();
  if (!msg) return;

  const chatRef = ref(db, "chat");
  const newMsgRef = push(chatRef);
  set(newMsgRef, {
    name: $("playerNameInput").value.trim() || "Anônimo",
    message: msg,
    timestamp: Date.now()
  });

  msgInput.value = "";
  chatCooldown = true;
  setTimeout(() => chatCooldown = false, 3000);
});

// === Atualizar chat na interface ===
function updateChatDisplay() {
  const chatList = $("chatList");
  chatList.innerHTML = "<li>Carregando chat...</li>";

  const chatRef = query(ref(db, "chat"), orderByChild("timestamp"), limitToLast(20));

  onValue(chatRef, (snapshot) => {
    chatList.innerHTML = "";
    let messages = [];
    snapshot.forEach(childSnapshot => {
      messages.push(childSnapshot.val());
    });

    // Ordenar do mais antigo para o mais novo
    messages.sort((a, b) => a.timestamp - b.timestamp);

    messages.forEach(msg => {
      const li = createElement("li", {}, `${msg.name}: ${msg.message}`);
      chatList.appendChild(li);
    });
  });
}

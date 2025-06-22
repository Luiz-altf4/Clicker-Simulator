// =================== script.js ===================

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
  limitToLast,
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
  measurementId: "G-ZXXWCDTY9D",
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
    musicPlaying: false,
  },
  tutorialShown: false,
};

// === DOM Utils ===
const $ = (id) => document.getElementById(id);
const createElement = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const key in attrs) {
    if (key === "className") el.className = attrs[key];
    else if (key.startsWith("aria")) el.setAttribute(key, attrs[key]);
    else if (key === "dataset") {
      for (const dataKey in attrs[key]) {
        el.dataset[dataKey] = attrs[key][dataKey];
      }
    } else el.setAttribute(key, attrs[key]);
  }
  children.forEach((child) => {
    if (typeof child === "string") el.appendChild(document.createTextNode(child));
    else if (child) el.appendChild(child);
  });
  return el;
};

// === Formatação números com unidades ===
function formatNumber(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

// === Funções básicas ===
function getWorldName(id) {
  const worlds = [
    "Jardim Inicial",
    "Cidade Neon",
    "Espaço",
    "Dimensão",
    "Reino Sombrio",
    "Mundo Místico",
    "Terra dos Dragões",
  ];
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
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("cpsDisplay").textContent = formatNumber(calcCPS());
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;

  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissionsDisplay();
  updateAchievementsDisplay();
  updateRankingDisplay();
  updateChatDisplay();
}

// === Cálculo de CPS (Clicks Por Segundo) ===
function calcCPS() {
  let baseCPS = 0;
  gameState.upgrades.forEach((upg) => {
    baseCPS += upg.cps * upg.quantity;
  });

  let multiplier = 1;
  if (gameState.activePetId) {
    const pet = gameState.pets.find((p) => p.id === gameState.activePetId);
    if (pet) multiplier += pet.bonusPercent / 100;
  }

  gameState.shopItems.forEach((item) => {
    if (item.owned && item.name.toLowerCase().includes("x5")) multiplier *= 5;
    else if (item.owned && item.name.toLowerCase().includes("x2")) multiplier *= 2;
  });

  return baseCPS * multiplier;
}

// === Ganhar XP ===
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Parabéns! Você chegou ao nível ${gameState.level}!`, "info");
  }
}

// === Ganhar clicks ===
function gainClicks(amount) {
  let gain = amount;
  if (gameState.activePetId) {
    const pet = gameState.pets.find((p) => p.id === gameState.activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  gain = Math.floor(gain);
  gameState.clicks += gain;
  gameState.totalClicks += gain;
  gainXP(gain * 2);
  updateMissionsProgress("clicks", gain);
  updateDisplay();
}

// === Atualizar progresso das missões ===
function updateMissionsProgress(type, amount) {
  gameState.missions.forEach((mission) => {
    if (!mission.completed) {
      if (type === "clicks" && mission.id === 1) {
        mission.progress += amount;
        if (mission.progress >= mission.goal) {
          mission.completed = true;
          gainXP(mission.rewardXP);
          showNotification(`Missão completada: ${mission.description}`, "success");
        }
      } else if (type === "upgrades" && mission.id === 2) {
        const totalUpgrades = gameState.upgrades.reduce((sum, u) => sum + u.quantity, 0);
        if (totalUpgrades >= mission.goal) {
          mission.completed = true;
          gainXP(mission.rewardXP);
          showNotification(`Missão completada: ${mission.description}`, "success");
        }
      } else if (type === "rebirths" && mission.id === 3) {
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
  gameState.missions.forEach((mission) => {
    const li = createElement(
      "li",
      {
        className: `mission-item ${mission.completed ? "completed" : ""}`,
        tabindex: 0,
        "aria-label": `${mission.description} - Progresso: ${Math.min(mission.progress, mission.goal)} de ${mission.goal}`,
      },
      `${mission.description} (${Math.min(mission.progress, mission.goal)} / ${mission.goal})`
    );
    missionsList.appendChild(li);
  });
}

// === Atualizar display das conquistas ===
function updateAchievementsDisplay() {
  const achievementsList = $("achievementsList");
  achievementsList.innerHTML = "";
  gameState.achievements.forEach((ach) => {
    const li = createElement(
      "li",
      {
        className: `achievement-item ${ach.achieved ? "achieved" : ""}`,
        tabindex: 0,
        "aria-label": `${ach.name}: ${ach.description}`,
      },
      `${ach.name} - ${ach.description}`
    );
    achievementsList.appendChild(li);
  });
}

// === Atualizar display dos upgrades ===
function updateUpgradesDisplay() {
  const upgradesList = $("upgrades");
  upgradesList.innerHTML = "";

  gameState.upgrades.forEach((upg) => {
    const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    const canBuy = gameState.clicks >= price;
    const li = createElement(
      "li",
      { className: "upgrade-item", tabindex: 0 },
      createElement("div", {}, `${upg.name} (x${upg.quantity})`),
      createElement("div", {}, upg.description),
      createElement(
        "button",
        {
          className: "buy-btn",
          disabled: !canBuy,
          "aria-label": `Comprar upgrade ${upg.name} por ${formatNumber(price)} clicks`,
          onclick: () => buyUpgrade(upg.id),
        },
        `Comprar - ${formatNumber(price)}`
      )
    );
    upgradesList.appendChild(li);
  });
}

// === Comprar upgrade ===
function buyUpgrade(upgradeId) {
  const upg = gameState.upgrades.find((u) => u.id === upgradeId);
  if (!upg) return;

  const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upg.quantity++;
    updateMissionsProgress("upgrades");
    updateDisplay();
    saveGame();
  } else {
    showNotification("Você não tem clicks suficientes!", "error");
  }
}

// === Atualizar display da loja ===
function updateShopDisplay() {
  const shopList = $("shopList");
  shopList.innerHTML = "";

  gameState.shopItems.forEach((item) => {
    const btnText = item.owned ? "Usando" : `Comprar - ${formatNumber(item.price)}`;
    const canBuy = gameState.clicks >= item.price && !item.owned;

    const li = createElement(
      "li",
      { className: "shop-item", tabindex: 0 },
      createElement("div", {}, `${item.name}`),
      createElement("div", {}, item.description),
      createElement(
        "button",
        {
          className: "buy-btn",
          disabled: !canBuy,
          "aria-label": `${btnText} ${item.name}`,
          onclick: () => buyShopItem(item.id),
        },
        btnText
      )
    );
    shopList.appendChild(li);
  });
}

// === Comprar item da loja ===
function buyShopItem(itemId) {
  const item = gameState.shopItems.find((i) => i.id === itemId);
  if (!item) return;
  if (item.owned) return;

  if (gameState.clicks >= item.price) {
    gameState.clicks -= item.price;
    item.owned = true;
    updateDisplay();
    saveGame();

    showNotification(`Você comprou ${item.name}!`, "success");

    // Desativar outros multiplicadores para não acumular buffs (se quiser)
    gameState.shopItems.forEach((i) => {
      if (i.id !== itemId) i.owned = false;
    });
  } else {
    showNotification("Clicks insuficientes para comprar!", "error");
  }
}

// === Atualizar display dos pets ===
function updatePetsDisplay() {
  const petsList = $("pets");
  petsList.innerHTML = "";

  gameState.pets.forEach((pet) => {
    const isActive = gameState.activePetId === pet.id;
    const btnText = pet.owned ? (isActive ? "Selecionado" : "Selecionar") : `Comprar - ${formatNumber(pet.bonusPercent * 100)}`;
    const canBuy = !pet.owned && gameState.clicks >= pet.bonusPercent * 100;

    const li = createElement(
      "li",
      { className: "pet-item", tabindex: 0 },
      createElement("div", {}, `${pet.name}`),
      createElement("div", {}, `Bônus: +${pet.bonusPercent}% clicks`),
      createElement(
        "button",
        {
          className: "select-pet-btn",
          disabled: (!pet.owned && !canBuy) || (pet.owned && isActive),
          "aria-label": `${btnText} pet ${pet.name}`,
          onclick: () => {
            if (pet.owned) selectPet(pet.id);
            else buyPet(pet.id);
          },
        },
        btnText
      )
    );
    petsList.appendChild(li);
  });
}

// === Comprar pet ===
function buyPet(petId) {
  const pet = gameState.pets.find((p) => p.id === petId);
  if (!pet) return;
  if (pet.owned) return;

  const price = pet.bonusPercent * 100;
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    pet.owned = true;
    selectPet(pet.id);
    updateDisplay();
    saveGame();
    showNotification(`Você comprou o pet ${pet.name}!`, "success");
  } else {
    showNotification("Clicks insuficientes para comprar o pet!", "error");
  }
}

// === Selecionar pet ativo ===
function selectPet(petId) {
  gameState.activePetId = petId;
  updateDisplay();
  saveGame();
  showNotification("Pet selecionado!", "info");
}

// === Atualizar ranking online ===
async function updateRankingDisplay() {
  const rankingList = $("detailedRankingList");
  rankingList.innerHTML = "";

  try {
    const rankingQuery = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
    const snapshot = await get(rankingQuery);
    if (snapshot.exists()) {
      const rankings = [];
      snapshot.forEach((child) => {
        rankings.push(child.val());
      });

      // Ordenar decrescente
      rankings.sort((a, b) => b.clicks - a.clicks);

      rankings.forEach((player, index) => {
        const li = createElement(
          "li",
          { className: "ranking-item", tabindex: 0 },
          `${index + 1}. ${player.name || "Anonimo"} — ${formatNumber(player.clicks)} clicks`
        );
        rankingList.appendChild(li);
      });
    } else {
      rankingList.textContent = "Nenhum dado no ranking ainda.";
    }
  } catch (err) {
    console.error("Erro ao buscar ranking:", err);
    rankingList.textContent = "Erro ao carregar ranking.";
  }
}

// === Salvar no ranking online ===
async function saveScoreOnline() {
  const playerName = $("playerNameInput").value.trim();
  if (!playerName) {
    showNotification("Por favor, insira um nome para o ranking!", "error");
    return;
  }

  try {
    const rankRef = ref(db, "ranking");
    await push(rankRef, {
      name: playerName,
      clicks: gameState.totalClicks,
      timestamp: Date.now(),
    });
    showNotification("Pontuação salva no ranking!", "success");
    updateRankingDisplay();
  } catch (err) {
    console.error("Erro ao salvar no ranking:", err);
    showNotification("Falha ao salvar no ranking.", "error");
  }
}

// === Chat Global ===
let chatCooldown = false;
function addChatMessage(name, msg) {
  const chatMessages = $("chatMessages");
  const div = createElement("div", {}, `[${name}]: ${msg}`);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChat() {
  if (chatCooldown) {
    showNotification("Aguarde para enviar outra mensagem.", "error");
    return;
  }
  const name = $("playerNameInput").value.trim() || "Anonimo";
  const msg = $("chatInput").value.trim();
  if (!msg) return;

  // Validação simples anti-spam e de conteúdo
  if (msg.length > 200) {
    showNotification("Mensagem muito longa.", "error");
    return;
  }
  if (/[^a-zA-Z0-9 .,?!@#$%&*()-_]/.test(msg)) {
    showNotification("Mensagem contém caracteres inválidos.", "error");
    return;
  }

  try {
    const chatRef = ref(db, "chat");
    await push(chatRef, {
      name,
      message: msg,
      timestamp: Date.now(),
    });
    $("chatInput").value = "";
    chatCooldown = true;
    setTimeout(() => (chatCooldown = false), 5000);
  } catch (err) {
    console.error("Erro ao enviar chat:", err);
    showNotification("Erro ao enviar mensagem.", "error");
  }
}

// Atualiza mensagens do chat em tempo real
function updateChatDisplay() {
  const chatMessages = $("chatMessages");
  chatMessages.innerHTML = "";
  const chatRef = ref(db, "chat");
  onValue(
    chatRef,
    (snapshot) => {
      chatMessages.innerHTML = "";
      snapshot.forEach((child) => {
        const chatData = child.val();
        const div = createElement(
          "div",
          {},
          `[${chatData.name || "Anonimo"}]: ${chatData.message}`
        );
        chatMessages.appendChild(div);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    },
    { onlyOnce: false }
  );
}

// === Botão clicar ===
$("clickBtn").addEventListener("click", () => {
  gainClicks(gameState.buyAmount);
});

// === Loop para CPS automático ===
setInterval(() => {
  const cps = calcCPS();
  if (cps > 0) gainClicks(cps / 10); // atualiza 10x por segundo para suavizar
}, 100);

// === Botões loja, upgrades e pets são gerados dinamicamente, já têm handlers no updateDisplay ===

// === Botões salvar, carregar e rebirth ===
$("saveBtn").addEventListener("click", saveGame);
$("clearSaveBtn").addEventListener("click", () => {
  if (confirm("Deseja realmente apagar o progresso?")) {
    localStorage.removeItem("clickerSave");
    location.reload();
  }
});

$("rebirthBtn").addEventListener("click", () => {
  if (gameState.level < 10) {
    showNotification("Você precisa estar no nível 10 para fazer rebirth!", "error");
    return;
  }
  gameState.rebirths++;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.clicks = 0;
  gameState.upgrades.forEach((u) => (u.quantity = 0));
  gameState.shopItems.forEach((i) => (i.owned = false));
  gameState.pets.forEach((p) => (p.owned = false));
  gameState.activePetId = null;
  showNotification("Rebirth realizado com sucesso! Você voltou ao nível 1.", "info");
  saveGame();
  updateDisplay();
});

// === Botão salvar pontuação online ===
$("saveScoreBtn").addEventListener("click", saveScoreOnline);

// === Botão enviar chat ===
$("sendChatBtn").addEventListener("click", sendChat);
$("chatInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendChat();
});

// === Trocar tema claro/escuro ===
$("toggleTheme").addEventListener("click", () => {
  if (gameState.theme === "dark") {
    gameState.theme = "light";
    document.body.classList.add("light-theme");
  } else {
    gameState.theme = "dark";
    document.body.classList.remove("light-theme");
  }
  saveGame();
});

// === Notificações ===
function showNotification(text, type = "info") {
  const notification = createElement("div", { className: `notification ${type}` }, text);
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3500);
}

// === Inicialização ===
function init() {
  initGameData();
  loadGame();
  if (gameState.theme === "light") {
    document.body.classList.add("light-theme");
  }
  updateDisplay();
  updateChatDisplay();
}

window.addEventListener("load", init);

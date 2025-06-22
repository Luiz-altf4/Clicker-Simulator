// =================== script.js completo corrigido ===================

// Importações Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast, update
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Config Firebase
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

// Inicializar app e banco
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Estado do jogo
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

// Utils DOM
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

// Formatação números com unidades
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

// Nome dos mundos
function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

// Iniciar dados básicos
function initGameData() {
  // Upgrades iniciais
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
  ];

  // Itens da loja
  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra sua produção por 5 minutos", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla sua produção por 2 minutos", owned: false, price: 5000, effectDuration: 120000 },
  ];

  // Pets
  gameState.pets = [
    { id: 1, name: "Gato Clicker", bonusPercent: 5, owned: false },
    { id: 2, name: "Cachorro Robótico", bonusPercent: 15, owned: false },
    { id: 3, name: "Dragão Cibernético", bonusPercent: 30, owned: false },
  ];

  // Missões
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

// Salvar localStorage
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
    showNotification("Progresso salvo com sucesso!", "success");
  } catch (err) {
    console.error("Erro ao salvar:", err);
    showNotification("Falha ao salvar progresso!", "error");
  }
}

// Carregar localStorage
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

// Atualiza o display
function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS());
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorldDisplay").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;
  const activePet = gameState.pets.find(p => p.id === gameState.activePetId);
  $("activePetsStat").textContent = activePet ? activePet.name : "Nenhum";

  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateAchievementsDisplay();
  updateMissionsDisplay();
  updateRankingDisplay();
}

// Calcular CPS
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

// Ganhar XP
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    showNotification(`Parabéns! Você chegou ao nível ${gameState.level}!`, "info");
  }
}

// Ganhar clicks
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

// Atualizar progresso missões
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

// Atualizar missões display
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

// Atualizar conquistas display
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

// Checar critérios conquistas
function checkAchievementCriteria(achievement) {
  switch (achievement.id) {
    case 1: return gameState.totalClicks > 0;
    case 2: return gameState.level >= 10;
    case 3: return gameState.totalClicks >= 1000;
    case 4: return gameState.rebirths >= 10;
    default: return false;
  }
}

// Atualizar upgrades display
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
  if (gameState.clicks < price) {
    showNotification("Clicks insuficientes!", "error");
    return;
  }
  gameState.clicks -= price;
  upg.quantity++;
  updateMissionsProgress("upgrades");
  updateDisplay();
  saveGame();
  showNotification(`Upgrade ${upg.name} comprado!`, "success");
}

// Atualizar pets display
function updatePetsDisplay() {
  const petsContainer = $("pets");
  petsContainer.innerHTML = "";

  gameState.pets.forEach(pet => {
    const petDiv = createElement("div", { className: "pet-item" });
    const nameEl = createElement("h4", {}, pet.name);
    const bonusEl = createElement("p", {}, `Bônus: +${pet.bonusPercent}% CPS`);
    const ownedEl = createElement("p", {}, pet.owned ? "Comprado" : "Não comprado");

    const buyBtn = createElement("button", {
      className: "buy-btn",
      disabled: pet.owned,
      "aria-label": pet.owned ? `Pet ${pet.name} comprado` : `Comprar pet ${pet.name}`
    }, pet.owned ? "Comprado" : "Comprar");

    buyBtn.addEventListener("click", () => buyPet(pet.id));

    const selectBtn = createElement("button", {
      className: "select-btn",
      disabled: !pet.owned || gameState.activePetId === pet.id,
      "aria-label": `Selecionar pet ${pet.name}`
    }, "Selecionar");

    selectBtn.addEventListener("click", () => {
      gameState.activePetId = pet.id;
      updateDisplay();
      saveGame();
      showNotification(`Pet ${pet.name} selecionado!`, "success");
    });

    petDiv.append(nameEl, bonusEl, ownedEl, buyBtn, selectBtn);
    petsContainer.appendChild(petDiv);
  });
}

// Comprar pet
function buyPet(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet || pet.owned) return;

  const petPrice = 1000 * id; // exemplo preço simples (pode melhorar)

  if (gameState.clicks < petPrice) {
    showNotification("Clicks insuficientes para comprar pet!", "error");
    return;
  }

  gameState.clicks -= petPrice;
  pet.owned = true;
  updateDisplay();
  saveGame();
  showNotification(`Pet ${pet.name} comprado!`, "success");
}

// Atualizar loja display
function updateShopDisplay() {
  const shopContainer = $("shop");
  shopContainer.innerHTML = "";

  gameState.shopItems.forEach(item => {
    const itemDiv = createElement("div", { className: "shop-item" });
    const nameEl = createElement("h4", {}, item.name);
    const descEl = createElement("p", {}, item.description);
    const priceEl = createElement("p", {}, `Preço: ${formatNumber(item.price)}`);
    const ownedEl = createElement("p", {}, item.owned ? "Ativo" : "Não comprado");

    const buyBtn = createElement("button", {
      className: "buy-btn",
      disabled: item.owned || gameState.clicks < item.price,
      "aria-label": item.owned ? `Item ${item.name} já ativo` : `Comprar item ${item.name}`
    }, item.owned ? "Ativo" : "Comprar");

    buyBtn.addEventListener("click", () => buyShopItem(item.id));

    itemDiv.append(nameEl, descEl, priceEl, ownedEl, buyBtn);
    shopContainer.appendChild(itemDiv);
  });
}

// Comprar item loja
function buyShopItem(id) {
  const item = gameState.shopItems.find(i => i.id === id);
  if (!item || item.owned) return;

  if (gameState.clicks < item.price) {
    showNotification("Clicks insuficientes!", "error");
    return;
  }

  gameState.clicks -= item.price;
  item.owned = true;
  updateDisplay();
  saveGame();
  showNotification(`Item ${item.name} comprado e ativado!`, "success");

  // Pode adicionar lógica para efeito temporário aqui
  if (item.effectDuration) {
    setTimeout(() => {
      item.owned = false;
      updateDisplay();
      saveGame();
      showNotification(`Item ${item.name} expirou!`, "info");
    }, item.effectDuration);
  }
}

// Rebirth
function doRebirth() {
  if (gameState.level < 10) {
    showNotification("Você precisa chegar no nível 10 para fazer rebirth.", "error");
    return;
  }
  gameState.rebirths++;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.shopItems.forEach(i => i.owned = false);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  updateDisplay();
  saveGame();
  showNotification("Rebirth realizado! Comece de novo, mas mais forte!", "success");
}

// Botão click
$("clickBtn").addEventListener("click", () => {
  gainClicks(gameState.buyAmount);
});

// Botões buyAmount
const buyAmountBtns = document.querySelectorAll(".buyAmountBtn");
buyAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    gameState.buyAmount = parseInt(btn.dataset.amount);
    buyAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// Botão rebirth
$("rebirthBtn").addEventListener("click", () => {
  doRebirth();
});

// Salvamento automático a cada 30 segundos
setInterval(saveGame, 30000);

// Clicks automáticos - Executa 1 vez
setInterval(() => {
  gainClicks(calcCPS());
}, 1000);

// ========== Sistema de Ranking Firebase ==========

const rankingRef = ref(db, "ranking");
const playerNameInput = $("playerNameInput");

// Enviar score ao Firebase
function sendScore() {
  const name = playerNameInput.value.trim();
  if (name.length < 3) {
    alert("Digite um nome válido com ao menos 3 caracteres.");
    return;
  }
  const score = Math.floor(gameState.totalClicks);

  // Verificar se jogador já tem score salvo
  get(query(rankingRef, orderByChild("name"))).then(snapshot => {
    const rankingData = snapshot.val();
    if (!rankingData) {
      // Nenhum score ainda - criar
      push(rankingRef, { name, score });
      showNotification("Score enviado!", "success");
    } else {
      // Procura entrada do jogador
      const playerKey = Object.keys(rankingData).find(key => rankingData[key].name === name);
      if (playerKey) {
        // Atualiza se score novo for maior
        if (score > rankingData[playerKey].score) {
          update(ref(db, `ranking/${playerKey}`), { score });
          showNotification("Score atualizado!", "success");
        } else {
          showNotification("Seu score atual é menor que o salvo no ranking.", "info");
        }
      } else {
        // Nova entrada
        push(rankingRef, { name, score });
        showNotification("Score enviado!", "success");
      }
    }
  });
}

$("sendScoreBtn").addEventListener("click", sendScore);

// Mostrar ranking
function updateRankingDisplay() {
  const rankingList = $("rankingList");
  rankingList.innerHTML = "";

  // Pega top 10 scores ordenados
  const top10Query = query(rankingRef, orderByChild("score"), limitToLast(10));
  onValue(top10Query, (snapshot) => {
    const rankingData = snapshot.val();
    if (!rankingData) {
      rankingList.innerHTML = "<li>Nenhum score registrado</li>";
      return;
    }
    // Transforma em array e ordena decrescente
    const players = Object.values(rankingData).sort((a, b) => b.score - a.score);

    rankingList.innerHTML = "";
    players.forEach((p, i) => {
      const li = createElement("li", {}, `${i + 1}. ${p.name} - ${formatNumber(p.score)} clicks`);
      rankingList.appendChild(li);
    });
  });
}

// Atualiza ranking logo no load
updateRankingDisplay();

// ========== Sistema de Chat Global Firebase ==========

const chatRef = ref(db, "chatMessages");

function sanitize(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Atualizar chat mensagens
onValue(chatRef, (snapshot) => {
  const messages = snapshot.val();
  const chatContainer = $("chatMessages");
  chatContainer.innerHTML = "";

  if (!messages) return;

  Object.values(messages).forEach(msg => {
    const p = createElement("p", {}, `${sanitize(msg.name)}: ${sanitize(msg.text)}`);
    chatContainer.appendChild(p);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
});

// Enviar mensagem
$("sendChatBtn").addEventListener("click", () => {
  const name = $("playerNameInput").value.trim();
  const text = $("chatInput").value.trim();

  if (name.length < 3) {
    alert("Digite seu nome válido para o chat (mín 3 caracteres).");
    return;
  }
  if (!text) return;

  // Pode implementar cooldown para evitar spam

  push(chatRef, {
    name,
    text,
    timestamp: Date.now()
  }).then(() => {
    $("chatInput").value = "";
  }).catch(err => {
    console.error("Erro ao enviar mensagem:", err);
  });
});

// ========== Sistema de notificações ==========

function showNotification(message, type = "info") {
  const container = $("notificationContainer");
  if (!container) return;

  const notif = createElement("div", { className: `notification ${type}` }, message);
  container.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 4000);
}

// ========== Inicialização ==========

window.onload = () => {
  initGameData();
  loadGame();
  updateDisplay();

  // Define botão buyAmount ativo
  document.querySelectorAll(".buyAmountBtn").forEach(btn => {
    btn.classList.toggle("active", parseInt(btn.dataset.amount) === gameState.buyAmount);
  });

  // Iniciar música ou sons se quiser
  // ...
};

window.onbeforeunload = () => {
  saveGame();
};

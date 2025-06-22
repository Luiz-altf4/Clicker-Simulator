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

function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Click Básico", description: "Aumenta 1 click a cada clique", cps: 0, quantity: 0, basePrice: 5 },
    { id: 2, name: "Click Avançado", description: "Aumenta 1 click por segundo", cps: 1, quantity: 0, basePrice: 100 },
    { id: 3, name: "Casa de Click", description: "Aumenta 2 clicks por segundo", cps: 2, quantity: 0, basePrice: 500 },
    { id: 4, name: "Prédio de Click", description: "Aumenta 10 clicks por segundo", cps: 10, quantity: 0, basePrice: 2000 },
    { id: 5, name: "Laboratório de Click", description: "Aumenta 20 clicks por segundo", cps: 20, quantity: 0, basePrice: 8000 },
    { id: 6, name: "Fábrica de Click", description: "Aumenta 100 clicks por segundo", cps: 100, quantity: 0, basePrice: 40000 },
    { id: 7, name: "Cidade de Click", description: "Aumenta 500 clicks por segundo", cps: 500, quantity: 0, basePrice: 150000 },
    { id: 8, name: "País de Click", description: "Aumenta 10.000 clicks por segundo", cps: 10000, quantity: 0, basePrice: 800000 }
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
  // Acrescenta o ganho manual + o bônus do upgrade Click Básico
  const clickBasico = gameState.upgrades.find(u => u.id === 1);
  const bonusManual = clickBasico ? clickBasico.quantity : 0;
  const totalGain = amount + bonusManual;

  gameState.clicks += totalGain;
  gameState.totalClicks += totalGain;

  addXP(totalGain * 0.5);

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
    const price = getUpgradePrice(upg);
    const div = createEl("div", { className: "upgrade" },
      createEl("h4", {}, `${upg.name} (x${upg.quantity})`),
      createEl("p", {}, upg.description),
      createEl("p", {}, `CPS: ${formatNumber(upg.cps)}`),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("button", {
        onclick: () => buyUpgrade(upg.id),
        disabled: gameState.clicks < price
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
  if (!upg) return;
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

  // Exemplo: multiplica CPS por 2 ou 5 enquanto o efeito dura
  if (item.id === 1) {
    startMultiplierEffect(2, item.effectDuration);
  } else if (item.id === 2) {
    startMultiplierEffect(5, item.effectDuration);
  }
  updateDisplay();
  updateShopDisplay();
  saveGame();
}

let multiplier = 1;
let multiplierTimeout = null;
function startMultiplierEffect(mult, duration) {
  multiplier = mult;
  if (multiplierTimeout) clearTimeout(multiplierTimeout);
  multiplierTimeout = setTimeout(() => {
    multiplier = 1;
    gameState.shopItems.forEach(i => i.owned = false);
    updateShopDisplay();
    showNotification("O efeito do multiplicador acabou.");
  }, duration);
}

// === Atualiza pets ===
function updatePetsDisplay() {
  const petsDiv = $("petsList");
  petsDiv.innerHTML = "";
  gameState.pets.forEach(pet => {
    const owned = pet.owned;
    const isActive = gameState.activePetId === pet.id;
    const div = createEl("div", { className: "pet" },
      createEl("h4", {}, pet.name),
      createEl("p", {}, `Bônus CPS: +${pet.bonusPercent}%`),
      createEl("button", {
        onclick: () => togglePetOwnership(pet.id),
      }, owned ? (isActive ? "Ativo" : "Desativar") : "Comprar")
    );
    petsDiv.appendChild(div);
  });
}

function togglePetOwnership(petId) {
  const pet = gameState.pets.find(p => p.id === petId);
  if (!pet) return;
  if (!pet.owned) {
    // Comprar pet se possível
    const price = pet.id * 1000; // preço exemplo, pode ajustar
    if (gameState.clicks >= price) {
      gameState.clicks -= price;
      pet.owned = true;
      gameState.activePetId = pet.id;
      showNotification(`Você comprou o pet ${pet.name}!`);
    } else {
      showNotification("Clicks insuficientes para comprar pet!", "error");
      return;
    }
  } else {
    if (gameState.activePetId === pet.id) {
      gameState.activePetId = null;
      showNotification(`Você desativou o pet ${pet.name}.`);
    } else {
      gameState.activePetId = pet.id;
      showNotification(`Você ativou o pet ${pet.name}.`);
    }
  }
  updateDisplay();
  updatePetsDisplay();
  saveGame();
}

// === Atualiza missões (exemplo simples) ===
function updateMissions() {
  // Exemplo: atualiza progresso da missão clique 100 vezes
  const mission = gameState.missions.find(m => !m.completed);
  if (!mission) return;

  if (mission.id === 1) {
    mission.progress = Math.min(mission.goal, gameState.totalClicks);
    if (mission.progress >= mission.goal) {
      mission.completed = true;
      addXP(mission.rewardXP);
      showNotification("Missão completada: " + mission.description, "success");
    }
  }
  // Atualize outras missões conforme lógica do jogo
  updateMissionsDisplay();
}

function updateMissionsDisplay() {
  const missionsDiv = $("missionsList");
  missionsDiv.innerHTML = "";
  gameState.missions.forEach(m => {
    const div = createEl("div", { className: "mission" },
      createEl("p", {}, `${m.description} - ${m.progress}/${m.goal}`),
      createEl("p", {}, m.completed ? "Completa 🏆" : "Em andamento")
    );
    missionsDiv.appendChild(div);
  });
}

// === Atualiza conquistas ===
function updateAchievements() {
  gameState.achievements.forEach(a => {
    if (!a.achieved) {
      if (a.id === 1 && gameState.totalClicks >= 1) a.achieved = true;
      else if (a.id === 2 && gameState.level >= 10) a.achieved = true;
      else if (a.id === 3 && gameState.totalClicks >= 1000) a.achieved = true;
      else if (a.id === 4 && gameState.rebirths >= 10) a.achieved = true;

      if (a.achieved) showNotification(`Conquista desbloqueada: ${a.name}`, "success");
    }
  });

  const achDiv = $("achievementsList");
  achDiv.innerHTML = "";
  gameState.achievements.forEach(a => {
    const div = createEl("div", { className: "achievement" },
      createEl("p", {}, a.name + (a.achieved ? " 🏆" : " ❌"))
    );
    achDiv.appendChild(div);
  });
}

// === Atualiza ranking (exemplo simples com Firebase) ===
function updateRanking() {
  const rankingDiv = $("rankingList");
  rankingDiv.innerHTML = "<p>Carregando ranking...</p>";

  const rankRef = query(ref(db, "players"), orderByChild("clicks"), limitToLast(10));
  get(rankRef).then(snapshot => {
    rankingDiv.innerHTML = "";
    const players = [];
    snapshot.forEach(child => {
      players.push(child.val());
    });
    players.sort((a, b) => b.clicks - a.clicks);
    players.forEach((p, i) => {
      rankingDiv.appendChild(createEl("p", {}, `${i+1}. ${p.name || "Anon"} - ${formatNumber(p.clicks)}`));
    });
  }).catch(() => {
    rankingDiv.innerHTML = "<p>Erro ao carregar ranking.</p>";
  });
}

// === Função para enviar seu score ao ranking ===
function sendScore(name) {
  if (!name) {
    showNotification("Informe seu nome para enviar ao ranking!", "error");
    return;
  }
  const playersRef = ref(db, "players");
  push(playersRef, { name, clicks: gameState.clicks })
    .then(() => {
      showNotification("Score enviado ao ranking!", "success");
      updateRanking();
    })
    .catch(() => {
      showNotification("Falha ao enviar score.", "error");
    });
}

// === Loop automático de clicks por segundo ===
function startAutoClick() {
  setInterval(() => {
    const cpsTotal = calcCPS() * multiplier;
    if (cpsTotal > 0) {
      gainClicks(cpsTotal);
    }
  }, 1000);
}

// === Inicialização do jogo ===
function init() {
  initGameData();
  loadGame();
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  updateRanking();
  startAutoClick();

  // Eventos
  $("clickArea").onclick = () => gainClicks(1);

  $("sendScoreBtn").onclick = () => {
    const name = $("playerName").value.trim();
    sendScore(name);
  };
}

window.onload = init;

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
  $("cpsDisplay").textContent = formatNumber(calcCPS() * currentMultiplier);
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

let currentMultiplier = 1;
let multiplierTimeout = null;

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
    const price = getUpgradePrice(upg);
    const div = createEl("div", { className: "upgrade-item" },
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

    const price = getPetPrice(pet);
    const btnDisabled = !pet.owned && gameState.clicks < price;

    const div = createEl("div", { className: "pet-item" },
      createEl("h4", {}, `${pet.name} ${ownedText}`),
      createEl("p", {}, `Bônus CPS: ${pet.bonusPercent}%`),
      createEl("p", {}, pet.owned ? "" : `Preço: ${formatNumber(price)}`),
      createEl("button", {
        onclick: () => {
          if (!pet.owned) buyPet(pet.id);
          else activatePet(pet.id);
        },
        disabled: btnDisabled || (isActive && pet.owned)
      }, btnText)
    );
    petsDiv.appendChild(div);
  });
}

function getPetPrice(pet) {
  return pet.id * 5000;
}

function buyPet(petId) {
  const pet = gameState.pets.find(p => p.id === petId);
  const price = getPetPrice(pet);
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    pet.owned = true;
    showNotification(`Você comprou o pet ${pet.name}!`);
    updatePetsDisplay();
    updateDisplay();
    saveGame();
  } else {
    showNotification("Clicks insuficientes para comprar pet!", "error");
  }
}

function activatePet(petId) {
  if (gameState.activePetId === petId) return;
  gameState.activePetId = petId;
  showNotification(`Pet ${gameState.pets.find(p => p.id === petId).name} ativado!`);
  updatePetsDisplay();
  updateDisplay();
  saveGame();
}

// === Atualiza as missões e progresso ===
function updateMissions() {
  gameState.missions.forEach(m => {
    if (!m.completed) {
      if (m.id === 1) {
        m.progress = Math.min(gameState.totalClicks, m.goal);
      } else if (m.id === 2) {
        const totalUpgrades = gameState.upgrades.reduce((acc, u) => acc + u.quantity, 0);
        m.progress = Math.min(totalUpgrades, m.goal);
      } else if (m.id === 3) {
        m.progress = Math.min(gameState.rebirths, m.goal);
      }
      if (m.progress >= m.goal) {
        m.completed = true;
        addXP(m.rewardXP);
        showNotification(`Missão concluída: ${m.description}`, "success");
      }
    }
  });

  const missionsUl = $("missions");
  missionsUl.innerHTML = "";
  gameState.missions.forEach(m => {
    const li = createEl("li", {},
      `${m.description} - ${m.completed ? "✅ Concluída" : `${formatNumber(m.progress)}/${formatNumber(m.goal)}`}`
    );
    missionsUl.appendChild(li);
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
      if (a.achieved) {
        showNotification(`Conquista desbloqueada: ${a.name}`, "success");
      }
    }
  });

  const achList = $("achievementsList");
  achList.innerHTML = "";
  gameState.achievements.forEach(a => {
    const li = createEl("li", {}, `${a.name} - ${a.achieved ? "🏆" : "❌"}`);
    achList.appendChild(li);
  });
}

// === Função de rebirth ===
function rebirth() {
  if (gameState.level < 10) {
    showNotification("Você precisa estar no nível 10 para rebirth!", "error");
    return;
  }
  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.cps = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.shopItems.forEach(i => i.owned = false);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  gameState.missions.forEach(m => {
    m.progress = 0;
    m.completed = false;
  });
  gameState.achievements.forEach(a => a.achieved = false);
  showNotification("Rebirth realizado! Seu progresso foi reiniciado com bônus.", "success");
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  saveGame();
}

// === Loop de CPS automático ===
function cpsLoop() {
  const cps = calcCPS() * currentMultiplier;
  gainClicks(cps / 10);
}

// === Salvamento automático a cada 15s ===
setInterval(saveGame, 15000);

// === Eventos ===
window.addEventListener("load", () => {
  initGameData();
  loadGame();
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  setInterval(cpsLoop, 100);

  $("clickBtn").addEventListener("click", () => gainClicks(1));

  $("rebirthBtn").addEventListener("click", rebirth);

  $("saveBtn").addEventListener("click", () => {
    saveGame();
    showNotification("Jogo salvo manualmente!", "success");
  });

  $("clearSaveBtn").addEventListener("click", () => {
    if (confirm("Tem certeza que deseja apagar todo o progresso?")) {
      localStorage.removeItem("clickerSave");
      location.reload();
    }
  });

  // Tema toggle
  $("toggleTheme").addEventListener("click", () => {
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
  });

  // Inicializa tema conforme salvo
  if (gameState.theme === "light") {
    document.body.classList.add("light-theme");
    $("toggleTheme").textContent = "🌙";
  }

  // RANKING E CHAT: Simplificados para evitar bugs
  initRankingAndChat();
});

// === RANKING E CHAT SIMPLIFICADO ===
function initRankingAndChat() {
  const playerNameInput = $("playerNameInput");
  const saveScoreBtn = $("saveScoreBtn");
  const detailedRankingList = $("detailedRankingList");

  saveScoreBtn.addEventListener("click", () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
      showNotification("Digite seu nome antes de enviar a pontuação!", "error");
      return;
    }
    savePlayerScore(playerName, gameState.totalClicks);
  });

  // Atualiza ranking a cada 10 segundos
  setInterval(fetchRanking, 10000);
  fetchRanking();

  // CHAT
  const chatMessages = $("chatMessages");
  const chatInput = $("chatInput");
  const chatSendBtn = $("chatSendBtn");

  chatSendBtn.addEventListener("click", () => sendChatMessage());
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
  });

  function sendChatMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    // Proteção simples contra spam
    const now = Date.now();
    if (now - gameState.lastChatTimestamp < 3000) {
      showNotification("Aguarde antes de enviar outra mensagem.", "error");
      return;
    }
    gameState.lastChatTimestamp = now;

    const playerName = playerNameInput.value.trim() || "Anônimo";
    const chatRef = ref(db, "chat");
    push(chatRef, { name: playerName, message: msg, timestamp: now });
    chatInput.value = "";
  }

  // Escuta mensagens
  const chatRef = ref(db, "chat");
  onValue(chatRef, (snapshot) => {
    const msgs = snapshot.val();
    if (!msgs) {
      chatMessages.textContent = "Nenhuma mensagem ainda.";
      return;
    }
    const arr = Object.values(msgs).sort((a,b) => a.timestamp - b.timestamp);
    chatMessages.innerHTML = arr.map(m => `<b>${sanitizeHTML(m.name)}:</b> ${sanitizeHTML(m.message)}`).join("<br>");
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });

  function savePlayerScore(name, score) {
    const rankRef = ref(db, "ranking");
    const newScoreRef = push(rankRef);
    set(newScoreRef, { name, score, timestamp: Date.now() })
      .then(() => {
        showNotification("Pontuação enviada!", "success");
        fetchRanking();
      })
      .catch(() => showNotification("Erro ao enviar pontuação!", "error"));
  }

  function fetchRanking() {
    const rankRef = query(ref(db, "ranking"), orderByChild("score"), limitToLast(10));
    get(rankRef).then(snapshot => {
      const val = snapshot.val();
      if (!val) {
        detailedRankingList.textContent = "Sem dados no ranking.";
        return;
      }
      const arr = Object.values(val).sort((a,b) => b.score - a.score);
      detailedRankingList.innerHTML = arr.map((r,i) => `<div class="ranking-item">${i+1}. ${sanitizeHTML(r.name)} - ${formatNumber(r.score)}</div>`).join("");
    }).catch(() => {
      detailedRankingList.textContent = "Erro ao carregar ranking.";
    });
  }
}

function sanitizeHTML(str) {
  const temp = document.createElement("div");
  temp.textContent = str;
  return temp.innerHTML;
}

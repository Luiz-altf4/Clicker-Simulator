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

let currentMultiplier = 1;
let multiplierTimeout = null;

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
      // Recria objetos complexos garantindo integridade
      Object.assign(gameState, parsed);
      // Caso arrays não existam ou estejam corrompidos, reinicializa
      if (!Array.isArray(gameState.upgrades)) gameState.upgrades = [];
      if (!Array.isArray(gameState.shopItems)) gameState.shopItems = [];
      if (!Array.isArray(gameState.pets)) gameState.pets = [];
      if (!Array.isArray(gameState.missions)) gameState.missions = [];
      if (!Array.isArray(gameState.achievements)) gameState.achievements = [];
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
  $("buyAmountSelect").value = gameState.buyAmount;
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

  baseCPS *= currentMultiplier;

  return baseCPS;
}

// === Função para clicar manualmente ===
function gainClicks(amount = 1) {
  amount = Math.floor(amount);
  gameState.clicks += amount;
  gameState.totalClicks += amount;

  // dar XP ao clicar
  addXP(amount * 0.5);

  checkMissionProgress();
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
    const price = getUpgradePrice(upg, gameState.buyAmount);
    const canBuy = gameState.clicks >= price;

    const div = createEl("div", { className: "upgrade-item" },
      createEl("h4", {}, `${upg.name} (x${upg.quantity})`),
      createEl("p", {}, upg.description),
      createEl("p", {}, `CPS por unidade: ${formatNumber(upg.cps)}`),
      createEl("p", {}, `Preço para comprar ${gameState.buyAmount}: ${formatNumber(price)}`),
      createEl("button", {
        onclick: () => buyUpgrade(upg.id),
        disabled: !canBuy
      }, canBuy ? "Comprar" : "Clicks insuficientes")
    );
    upgradesDiv.appendChild(div);
  });
}

// === Calcula preço total de upgrade para comprar X unidades ===
function getUpgradePrice(upgrade, amount = 1) {
  // Soma dos preços escalonados para quantidade 'amount'
  let total = 0;
  for (let i = 0; i < amount; i++) {
    total += Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity + i));
  }
  return total;
}

// === Compra um upgrade ===
function buyUpgrade(upgradeId) {
  const upg = gameState.upgrades.find(u => u.id === upgradeId);
  const amount = gameState.buyAmount || 1;
  const price = getUpgradePrice(upg, amount);

  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upg.quantity += amount;
    showNotification(`Você comprou ${amount}x ${upg.name}!`, "success");
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
    const canBuy = !item.owned && gameState.clicks >= item.price;

    const div = createEl("div", { className: "shop-item" },
      createEl("h4", {}, item.name),
      createEl("p", {}, item.description),
      createEl("p", {}, `Preço: ${formatNumber(item.price)}`),
      createEl("button", {
        onclick: () => buyShopItem(item.id),
        disabled: !canBuy
      }, item.owned ? "Comprado" : canBuy ? "Comprar" : "Clicks insuficientes")
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
  showNotification(`Você comprou ${item.name}!`, "success");

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
  showNotification(`Multiplicador x${multiplier} ativo por ${Math.floor(duration / 60000)} min!`, "success");
  if (multiplierTimeout) clearTimeout(multiplierTimeout);
  multiplierTimeout = setTimeout(() => {
    currentMultiplier = 1;
    item.owned = false;
    showNotification(`Multiplicador x${multiplier} terminou!`, "info");
    updateShopDisplay();
    updateDisplay();
    saveGame();
  }, duration);
}

// === Atualiza a lista de pets ===
function updatePetsDisplay() {
  const petsDiv = $("pets");
  petsDiv.innerHTML = "";
  gameState.pets.forEach(pet => {
    const canBuy = !pet.owned && gameState.clicks >= pet.bonusPercent * 200; // preço baseado no bônus

    const div = createEl("div", { className: "pet-item" },
      createEl("h4", {}, pet.name),
      createEl("p", {}, `Bônus CPS: +${pet.bonusPercent}%`),
      createEl("button", {
        onclick: () => buyPet(pet.id),
        disabled: !canBuy && !pet.owned
      }, pet.owned ? (gameState.activePetId === pet.id ? "Ativo" : "Ativar") : canBuy ? "Comprar" : "Clicks insuficientes")
    );
    petsDiv.appendChild(div);
  });
}

// === Compra pet e ativa ===
function buyPet(petId) {
  const pet = gameState.pets.find(p => p.id === petId);
  if (!pet) return;
  if (!pet.owned) {
    const price = pet.bonusPercent * 200;
    if (gameState.clicks < price) {
      showNotification("Clicks insuficientes para comprar pet!", "error");
      return;
    }
    gameState.clicks -= price;
    pet.owned = true;
    gameState.activePetId = pet.id;
    showNotification(`Você comprou e ativou ${pet.name}!`, "success");
  } else {
    if (gameState.activePetId === pet.id) {
      showNotification(`${pet.name} já está ativo!`, "info");
    } else {
      gameState.activePetId = pet.id;
      showNotification(`${pet.name} ativado!`, "success");
    }
  }
  updatePetsDisplay();
  updateDisplay();
  saveGame();
}

// === Atualiza missões visíveis e checa progresso ===
function updateMissions() {
  const missionsUl = $("missions");
  missionsUl.innerHTML = "";
  gameState.missions.forEach(m => {
    const li = createEl("li", { className: m.completed ? "mission-completed" : "" },
      `${m.description} — Progresso: ${formatNumber(m.progress)} / ${formatNumber(m.goal)} ${m.completed ? "✅" : ""}`
    );
    missionsUl.appendChild(li);
  });
}

// === Checa progresso das missões atuais e atualiza ===
function checkMissionProgress() {
  // Exemplo de missões simples, ajuste conforme evolução do jogo
  gameState.missions.forEach(m => {
    if (!m.completed) {
      if (m.id === 1) { // Clique 100 vezes
        m.progress = gameState.totalClicks;
      } else if (m.id === 2) { // Compre 5 upgrades no total
        const totalUpgrades = gameState.upgrades.reduce((sum, u) => sum + u.quantity, 0);
        m.progress = totalUpgrades;
      } else if (m.id === 3) { // Faça 1 rebirth
        m.progress = gameState.rebirths;
      }
      if (m.progress >= m.goal) {
        m.completed = true;
        addXP(m.rewardXP);
        showNotification(`Missão "${m.description}" concluída! XP recebido: ${m.rewardXP}`, "success");
      }
    }
  });
}

// === Atualiza conquistas visíveis ===
function updateAchievements() {
  const achList = $("achievementsList");
  achList.innerHTML = "";

  gameState.achievements.forEach(ach => {
    // Verifica status
    if (!ach.achieved) {
      if (ach.id === 1 && gameState.totalClicks >= 1) ach.achieved = true;
      if (ach.id === 2 && gameState.level >= 10) ach.achieved = true;
      if (ach.id === 3 && gameState.totalClicks >= 1000) ach.achieved = true;
      if (ach.id === 4 && gameState.rebirths >= 10) ach.achieved = true;

      if (ach.achieved) {
        showNotification(`Conquista desbloqueada: ${ach.name}`, "success");
        saveGame();
      }
    }

    const li = createEl("li", { className: ach.achieved ? "achieved" : "" },
      `${ach.name} - ${ach.description} ${ach.achieved ? "🏆" : ""}`
    );
    achList.appendChild(li);
  });
}

// === Rebirth: reset parcial com bônus ===
function doRebirth() {
  if (gameState.clicks < 100000) {
    showNotification("Você precisa de pelo menos 100.000 clicks para rebirth!", "error");
    return;
  }
  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.xp = 0;
  gameState.level = 1;
  gameState.xpToNext = 100;
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.shopItems.forEach(i => i.owned = false);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;
  currentMultiplier = 1;
  showNotification("Rebirth realizado! Você começa novamente, mas mais forte!", "success");
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  saveGame();
}

// === Loop para CPS automático ===
function cpsLoop() {
  const cpsGained = calcCPS();
  if (cpsGained > 0) gainClicks(cpsGained);
  setTimeout(cpsLoop, 1000);
}

// === Evento click no botão principal ===
$("clickButton").addEventListener("click", () => {
  gainClicks(1 * currentMultiplier);
});

// === Seleção de quantidade para comprar upgrades ===
$("buyAmountSelect").addEventListener("change", e => {
  gameState.buyAmount = parseInt(e.target.value);
  updateUpgradesDisplay();
});

// === Botões controles ===
$("rebirthBtn").addEventListener("click", () => doRebirth());
$("saveBtn").addEventListener("click", () => {
  saveGame();
  showNotification("Progresso salvo manualmente!", "success");
});
$("clearSaveBtn").addEventListener("click", () => {
  if (confirm("Deseja realmente limpar o progresso?")) {
    localStorage.clear();
    location.reload();
  }
});

// === Tema claro/escuro toggle ===
$("toggleTheme").addEventListener("click", () => {
  if (gameState.theme === "dark") {
    gameState.theme = "light";
    document.body.classList.add("light-theme");
    $("toggleTheme").textContent = "🌙";
  } else {
    gameState.theme = "dark";
    document.body.classList.remove("light-theme");
    $("toggleTheme").textContent = "☀️";
  }
  saveGame();
});

// === Ranking Firebase ===
const rankingRef = ref(db, "ranking");
const MAX_RANKING_DISPLAY = 10;

async function fetchRanking() {
  const q = query(rankingRef, orderByChild("clicks"), limitToLast(MAX_RANKING_DISPLAY));
  const snapshot = await get(q);
  if (!snapshot.exists()) {
    $("detailedRankingList").textContent = "Nenhum ranking disponível.";
    return;
  }
  const ranking = [];
  snapshot.forEach(child => {
    ranking.push(child.val());
  });
  ranking.sort((a, b) => b.clicks - a.clicks);
  displayRanking(ranking);
}

function displayRanking(list) {
  const container = $("detailedRankingList");
  container.innerHTML = "";
  list.forEach((entry, index) => {
    const div = createEl("div", { className: "ranking-entry" },
      `${index + 1}. ${entry.name} — Clicks: ${formatNumber(entry.clicks)}`
    );
    container.appendChild(div);
  });
}

$("saveScoreBtn").addEventListener("click", async () => {
  const playerName = $("playerNameInput").value.trim();
  if (!playerName) {
    showNotification("Digite seu nome para salvar no ranking!", "error");
    return;
  }
  try {
    const newRef = push(rankingRef);
    await set(newRef, {
      name: playerName,
      clicks: gameState.totalClicks,
      timestamp: Date.now()
    });
    showNotification("Ranking salvo com sucesso!", "success");
    $("playerNameInput").value = "";
    fetchRanking();
  } catch (err) {
    showNotification("Erro ao salvar ranking.", "error");
  }
});

// === Chat Firebase ===
const chatRef = ref(db, "chat");
const chatMessagesDiv = $("chatMessages");

function listenChat() {
  onValue(chatRef, snapshot => {
    if (!snapshot.exists()) {
      chatMessagesDiv.innerHTML = "<p>Sem mensagens</p>";
      return;
    }
    const messages = [];
    snapshot.forEach(child => {
      messages.push(child.val());
    });
    messages.sort((a, b) => a.timestamp - b.timestamp);
    renderChat(messages);
  });
}

function renderChat(messages) {
  chatMessagesDiv.innerHTML = "";
  messages.forEach(msg => {
    const time = new Date(msg.timestamp).toLocaleTimeString();
    const p = createEl("p", {}, `[${time}] ${msg.name}: ${msg.text}`);
    chatMessagesDiv.appendChild(p);
  });
  chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

async function sendChatMessage(name, text) {
  if (!name || !text) {
    showNotification("Digite seu nome e mensagem!", "error");
    return;
  }
  // Anti spam: só pode enviar mensagem a cada 3s
  const now = Date.now();
  if (now - gameState.lastChatTimestamp < 3000) {
    showNotification("Aguarde antes de enviar outra mensagem.", "error");
    return;
  }
  gameState.lastChatTimestamp = now;

  // Limitar tamanho da mensagem
  if (text.length > 150) text = text.slice(0, 150);

  try {
    const newChatRef = push(chatRef);
    await set(newChatRef, {
      name: name,
      text: text,
      timestamp: now
    });
    $("chatInput").value = "";
  } catch {
    showNotification("Erro ao enviar mensagem.", "error");
  }
}

$("chatSendBtn").addEventListener("click", () => {
  const name = $("playerNameInput").value.trim() || "Anon";
  const msg = $("chatInput").value.trim();
  sendChatMessage(name, msg);
});

$("chatInput").addEventListener("keydown", e => {
  if (e.key === "Enter") $("chatSendBtn").click();
});

// === Inicialização completa ===
function init() {
  initGameData();
  loadGame();
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  fetchRanking();
  listenChat();
  cpsLoop();

  if (gameState.theme === "light") {
    document.body.classList.add("light-theme");
    $("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    $("toggleTheme").textContent = "☀️";
  }
}

window.addEventListener("load", init);

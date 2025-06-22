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
  chatMessages: []
};

// === Dados base ===

// Upgrades (valores e efeitos)
const upgradesData = [
  { id: "click_basic", name: "Click básico", description: "Aumenta 1 por clique", price: 10, type: "clickPower", power: 1, unlocked: true },
  { id: "click_advanced", name: "Click avançado", description: "Aumenta 1 por segundo", price: 100, type: "cps", power: 1, unlocked: false },
  { id: "click_house", name: "Casa de click", description: "Aumenta 2 por segundo", price: 500, type: "cps", power: 2, unlocked: false },
  { id: "click_building", name: "Prédio de click", description: "Aumenta 10 por segundo", price: 3000, type: "cps", power: 10, unlocked: false },
  { id: "click_lab", name: "Laboratório de click", description: "Aumenta 20 por segundo", price: 8000, type: "cps", power: 20, unlocked: false },
  { id: "click_factory", name: "Fábrica de click", description: "Aumenta 100 por segundo", price: 25000, type: "cps", power: 100, unlocked: false },
  { id: "click_city", name: "Cidade de click", description: "Aumenta 500 por segundo", price: 120000, type: "cps", power: 500, unlocked: false },
  { id: "click_country", name: "País de click", description: "Aumenta 10000 por segundo", price: 700000, type: "cps", power: 10000, unlocked: false }
];

// Pets (simples)
const petsData = [
  { id: "cat", name: "Gato", description: "Gera 1 click por segundo", price: 500, cps: 1, unlocked: false },
  { id: "dog", name: "Cachorro", description: "Gera 3 clicks por segundo", price: 2000, cps: 3, unlocked: false }
];

// Loja simples
const shopData = [
  { id: "skin_dark", name: "Skin Dark", description: "Tema Dark Gamer", price: 1000 },
  { id: "skin_light", name: "Skin Light", description: "Tema Claro", price: 1000 }
];

// Missões
const missionsData = [
  { id: "mission1", description: "Faça 50 clicks", goal: 50, completed: false, rewardXP: 20 },
  { id: "mission2", description: "Compre 3 upgrades", goal: 3, completed: false, rewardXP: 30 },
  { id: "mission3", description: "Alcance 500 clicks totais", goal: 500, completed: false, rewardXP: 50 },
  { id: "mission4", description: "Tenha 2 pets", goal: 2, completed: false, rewardXP: 40 }
];

// Conquistas
const achievementsData = [
  { id: "achv_click100", description: "Clique 100 vezes no total", achieved: false },
  { id: "achv_rebirth1", description: "Faça seu 1º rebirth", achieved: false },
  { id: "achv_level5", description: "Alcance nível 5", achieved: false }
];

// === Funções principais ===

function saveGame() {
  localStorage.setItem("clickerGameSave", JSON.stringify(gameState));
  showNotification("Jogo salvo!");
}

function loadGame() {
  const save = localStorage.getItem("clickerGameSave");
  if (save) {
    Object.assign(gameState, JSON.parse(save));
    unlockItems();
    updateUI();
  } else {
    // Inicializa dados
    gameState.upgrades = upgradesData.map(u => ({ ...u, owned: 0 }));
    gameState.pets = petsData.map(p => ({ ...p }));
    gameState.shopItems = shopData.map(s => ({ ...s }));
    gameState.achievements = achievementsData.map(a => ({ ...a }));
    gameState.missions = missionsData.map(m => ({ ...m }));
  }
}

function showNotification(msg, duration = 2000) {
  const notif = $("notification");
  notif.textContent = msg;
  notif.style.display = "block";
  notif.style.backgroundColor = "#00ffcc";
  notif.style.color = "#111";
  setTimeout(() => {
    notif.style.display = "none";
  }, duration);
}

function updateUI() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(gameState.cps);
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;

  renderUpgrades();
  renderPets();
  renderShop();
  renderMissions();
  renderAchievements();
  renderRanking();
}

function unlockItems() {
  gameState.upgrades.forEach(u => {
    if (u.price <= gameState.clicks) u.unlocked = true;
  });
}

function gainClicks(amount) {
  gameState.clicks += amount;
  gameState.totalClicks += amount;
  gainXP(amount);
  updateUI();
}

function gainXP(amount) {
  gameState.xp += amount;
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp -= gameState.xpToNext;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.2);
    showNotification(`Você subiu para o nível ${gameState.level}!`);
  }
}

function buyUpgrade(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return;
  if (gameState.clicks < upg.price) {
    showNotification("Clique insuficiente!");
    return;
  }
  gameState.clicks -= upg.price;
  upg.owned = (upg.owned || 0) + 1;

  if (upg.type === "clickPower") {
    // aumenta power de clique base
    baseClickPower = 1 + upg.power * upg.owned;
  } else if (upg.type === "cps") {
    // acumula cps
    recalcCPS();
  }

  unlockItems();
  updateUI();
}

function recalcCPS() {
  // Soma cps dos upgrades + pets
  let totalCPS = 0;
  gameState.upgrades.forEach(u => {
    if (u.type === "cps") totalCPS += (u.power || 0) * (u.owned || 0);
  });
  gameState.pets.forEach(p => {
    if (p.unlocked) totalCPS += p.cps;
  });
  gameState.cps = totalCPS;
}

function renderUpgrades() {
  const container = $("upgrades");
  container.innerHTML = "";
  gameState.upgrades.forEach(u => {
    if (!u.unlocked) return;
    const div = createEl("div", { className: "upgrade" },
      createEl("h4", {}, `${u.name}`),
      createEl("p", {}, u.description),
      createEl("p", {}, `Preço: ${formatNumber(u.price)}`),
      createEl("p", {}, `Possuídos: ${u.owned || 0}`),
      (() => {
        const btn = createEl("button", {}, "Comprar");
        btn.disabled = gameState.clicks < u.price;
        btn.onclick = () => buyUpgrade(u.id);
        return btn;
      })()
    );
    container.appendChild(div);
  });
}

function buyPet(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet) return;
  if (gameState.clicks < pet.price) {
    showNotification("Clique insuficiente!");
    return;
  }
  if (pet.unlocked) {
    showNotification("Você já possui este pet!");
    return;
  }
  gameState.clicks -= pet.price;
  pet.unlocked = true;
  recalcCPS();
  updateUI();
}

function renderPets() {
  const container = $("pets");
  container.innerHTML = "";
  gameState.pets.forEach(p => {
    const div = createEl("div", { className: "pet" },
      createEl("h4", {}, p.name),
      createEl("p", {}, p.description),
      createEl("p", {}, `Preço: ${formatNumber(p.price)}`),
      (() => {
        const btn = createEl("button", {}, p.unlocked ? "Comprado" : "Comprar");
        btn.disabled = p.unlocked || gameState.clicks < p.price;
        btn.onclick = () => buyPet(p.id);
        return btn;
      })()
    );
    container.appendChild(div);
  });
}

// Render loja
function renderShop() {
  const container = $("shopList");
  container.innerHTML = "";
  gameState.shopItems.forEach(item => {
    const div = createEl("div", { className: "shop-item" },
      createEl("h4", {}, item.name),
      createEl("p", {}, item.description),
      createEl("p", {}, `Preço: ${formatNumber(item.price)}`),
      (() => {
        const btn = createEl("button", {}, "Comprar");
        btn.disabled = gameState.clicks < item.price;
        btn.onclick = () => {
          // Exemplo: aplicar skin no tema
          if(item.id === "skin_dark") {
            setTheme("dark");
            showNotification("Tema Dark ativado!");
          } else if(item.id === "skin_light") {
            setTheme("light");
            showNotification("Tema Claro ativado!");
          }
        };
        return btn;
      })()
    );
    container.appendChild(div);
  });
}

// Missões
function renderMissions() {
  const container = $("missions");
  container.innerHTML = "";
  gameState.missions.forEach(m => {
    const li = createEl("li", { className: "mission-item" }, `${m.description} - ${m.completed ? "✅" : "❌"}`);
    container.appendChild(li);
  });
}

// Conquistas
function renderAchievements() {
  const container = $("achievementsList");
  container.innerHTML = "";
  gameState.achievements.forEach(a => {
    const li = createEl("li", {
      className: "achievement-item " + (a.achieved ? "completed" : "")
    }, a.description + (a.achieved ? " ✅" : ""));
    container.appendChild(li);
  });
}

function checkMissions() {
  gameState.missions.forEach(m => {
    if (m.completed) return;
    if (m.id === "mission1" && gameState.totalClicks >= m.goal) m.completed = true;
    if (m.id === "mission2") {
      const upgradesOwned = gameState.upgrades.reduce((acc, u) => acc + (u.owned || 0), 0);
      if (upgradesOwned >= m.goal) m.completed = true;
    }
    if (m.id === "mission3" && gameState.totalClicks >= m.goal) m.completed = true;
    if (m.id === "mission4") {
      const petsOwned = gameState.pets.filter(p => p.unlocked).length;
      if (petsOwned >= m.goal) m.completed = true;
    }
    if (m.completed) {
      gainXP(m.rewardXP);
      showNotification(`Missão concluída! +${m.rewardXP} XP`);
    }
  });
}

function checkAchievements() {
  gameState.achievements.forEach(a => {
    if (a.achieved) return;
    if (a.id === "achv_click100" && gameState.totalClicks >= 100) a.achieved = true;
    if (a.id === "achv_rebirth1" && gameState.rebirths >= 1) a.achieved = true;
    if (a.id === "achv_level5" && gameState.level >= 5) a.achieved = true;
    if (a.achieved) {
      showNotification(`Conquista desbloqueada: ${a.description}`);
    }
  });
}

// Ranking Firebase
const rankingRef = ref(db, "ranking");
async function saveScore() {
  const name = $("playerNameInput").value.trim() || "Anônimo";
  if (gameState.totalClicks <= 0) {
    showNotification("Você ainda não fez nenhum clique!");
    return;
  }
  const scoreData = {
    name,
    score: gameState.totalClicks,
    timestamp: Date.now()
  };
  const newScoreRef = push(rankingRef);
  await set(newScoreRef, scoreData);
  showNotification("Pontuação salva!");
  $("playerNameInput").value = "";
  loadRanking();
}

function renderRanking() {
  // inicial vazio, o conteúdo será carregado via Firebase
  $("detailedRankingList").textContent = "Carregando ranking...";
}

function loadRanking() {
  const q = query(rankingRef, orderByChild("score"), limitToLast(10));
  onValue(q, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      $("detailedRankingList").textContent = "Sem dados no ranking.";
      return;
    }
    const list = Object.values(data).sort((a, b) => b.score - a.score);
    const container = $("detailedRankingList");
    container.innerHTML = "";
    list.forEach((entry, i) => {
      const div = createEl("div", {}, `${i + 1}º - ${entry.name}: ${formatNumber(entry.score)}`);
      container.appendChild(div);
    });
  });
}

// Chat Global Firebase
const chatRef = ref(db, "chat");

function sendChatMessage() {
  const msg = $("chatInput").value.trim();
  if (!msg) return;
  const newMsgRef = push(chatRef);
  const data = {
    name: $("playerNameInput").value.trim() || "Anônimo",
    message: msg,
    timestamp: Date.now()
  };
  set(newMsgRef, data);
  $("chatInput").value = "";
}

function loadChat() {
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    const container = $("chatMessages");
    container.innerHTML = "";
    const msgs = Object.values(data).sort((a,b) => a.timestamp - b.timestamp);
    msgs.forEach(m => {
      const div = createEl("div", {}, `${m.name}: ${m.message}`);
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  });
}

// Rebirth (reset progress com bônus)
function doRebirth() {
  if (gameState.clicks < 100000) {
    showNotification("Você precisa de 100.000 clicks para rebirth!");
    return;
  }
  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.cps = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  gameState.upgrades.forEach(u => u.owned = 0);
  gameState.pets.forEach(p => p.unlocked = false);
  showNotification("Rebirth feito! Bônus ativado.");
  updateUI();
}

// Tema claro/escuro
function setTheme(theme) {
  gameState.theme = theme;
  if (theme === "dark") {
    document.body.style.background = "linear-gradient(45deg, #0a0a0a, #111111)";
    document.body.style.color = "#eee";
  } else {
    document.body.style.background = "#f0f0f0";
    document.body.style.color = "#222";
  }
  saveGame();
}

function toggleTheme() {
  if (gameState.theme === "dark") setTheme("light");
  else setTheme("dark");
}

// Eventos iniciais
window.onload = () => {
  loadGame();
  updateUI();
  loadRanking();
  loadChat();

  // Clique botão
  $("clickBtn").onclick = () => gainClicks(baseClickPower);

  // Salvar progresso
  $("saveBtn").onclick = saveGame;

  // Limpar save
  $("clearSaveBtn").onclick = () => {
    localStorage.removeItem("clickerGameSave");
    location.reload();
  };

  // Salvar ranking
  $("saveScoreBtn").onclick = saveScore;

  // Chat
  $("chatSendBtn").onclick = sendChatMessage;
  $("chatInput").addEventListener("keydown", e => {
    if (e.key === "Enter") sendChatMessage();
  });

  // Rebirth
  $("rebirthBtn").onclick = doRebirth;

  // Tema
  $("toggleTheme").onclick = toggleTheme;

  // CPS automático (intervalo 1s)
  setInterval(() => {
    gainClicks(gameState.cps);
    checkMissions();
    checkAchievements();
    saveGame();
  }, 1000);
};

// Base click power inicial
let baseClickPower = 1;

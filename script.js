// === script.js completo e corrigido ===

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Config Firebase - mantenha seus dados aqui
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

const $ = id => document.getElementById(id);

let notificationTimeout = null;
const notificationEl = $("notification");

function showNotification(text, type = "info") {
  notificationEl.textContent = text;
  notificationEl.style.backgroundColor = type === "error" ? "#e74c3c" : type === "success" ? "#27ae60" : "#0f62fe";
  notificationEl.style.display = "block";
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notificationEl.style.display = "none";
  }, 3500);
}

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

// === Estado global ===
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
  activePetId: null,
  theme: "dark",
  lastChatTimestamp: 0,
  audio: { musicVolume: 0.5, effectsVolume: 0.7, musicPlaying: false },
  tutorialShown: false,
};

// Inicializa upgrades, pets, loja, missões e conquistas
function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Click Básico", description: "Aumenta +1 a cada clique", cps: 0, quantity: 0, basePrice: 10 },
    { id: 2, name: "Click Avançado", description: "Aumenta +1 click por segundo", cps: 1, quantity: 0, basePrice: 100 },
    { id: 3, name: "Casa de Click", description: "Aumenta +2 clicks por segundo", cps: 2, quantity: 0, basePrice: 500 },
    { id: 4, name: "Prédio de Click", description: "Aumenta +10 clicks por segundo", cps: 10, quantity: 0, basePrice: 3000 },
    { id: 5, name: "Laboratório de Click", description: "Aumenta +20 clicks por segundo", cps: 20, quantity: 0, basePrice: 10000 },
    { id: 6, name: "Fábrica de Click", description: "Aumenta +100 clicks por segundo", cps: 100, quantity: 0, basePrice: 50000 },
    { id: 7, name: "Cidade de Click", description: "Aumenta +500 clicks por segundo", cps: 500, quantity: 0, basePrice: 250000 },
    { id: 8, name: "País de Click", description: "Aumenta +10000 clicks por segundo", cps: 10000, quantity: 0, basePrice: 1000000 }
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
    { id: 4, description: "Tenha 3 pets ativos", goal: 3, progress: 0, rewardXP: 300, completed: false },
    { id: 5, description: "Gere 1M clicks no total", goal: 1_000_000, progress: 0, rewardXP: 1000, completed: false }
  ];

  gameState.achievements = [
    { id: 1, name: "Primeiro Click", description: "Realize seu primeiro click", achieved: false },
    { id: 2, name: "Novato", description: "Alcance nível 10", achieved: false },
    { id: 3, name: "Profissional", description: "Alcance 1000 clicks", achieved: false },
    { id: 4, name: "Veterano", description: "Realize 10 rebirths", achieved: false },
    { id: 5, name: "Colecionador", description: "Possua todos os pets", achieved: false },
  ];
}

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

      // Para arrays que podem estar incompletas, garantimos que existem todos os campos
      if (!gameState.upgrades || !Array.isArray(gameState.upgrades)) initGameData();
      if (!gameState.shopItems || !Array.isArray(gameState.shopItems)) initGameData();
      if (!gameState.pets || !Array.isArray(gameState.pets)) initGameData();
      if (!gameState.missions || !Array.isArray(gameState.missions)) initGameData();
      if (!gameState.achievements || !Array.isArray(gameState.achievements)) initGameData();

      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
      initGameData();
    }
  } else {
    initGameData();
  }
}

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

function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

function calcCPS() {
  // Soma os CPS dos upgrades
  let baseCPS = gameState.upgrades.reduce((sum, u) => sum + (u.cps * u.quantity), 0);

  // Aplica bônus do pet ativo
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) baseCPS *= 1 + pet.bonusPercent / 100;
  }

  // Aplica bônus dos multiplicadores da loja
  if (currentMultiplier) baseCPS *= currentMultiplier;

  return baseCPS;
}

function gainClicks(amount = 1) {
  gameState.clicks += amount;
  gameState.totalClicks += amount;

  addXP(amount * 0.5);

  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();

  saveGame();
  checkMissionProgress();
}

function addXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.15);
    showNotification(`Subiu para nível ${gameState.level}! 🎉`, "success");
  }
}

function updateUpgradesDisplay() {
  const container = $("upgrades");
  container.innerHTML = "";
  gameState.upgrades.forEach(upgrade => {
    const price = Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity));
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <h3>${upgrade.name}</h3>
      <p>${upgrade.description}</p>
      <p>Quantidade: ${upgrade.quantity}</p>
      <p>Preço: ${formatNumber(price)} clicks</p>
      <button ${gameState.clicks < price ? "disabled" : ""} data-id="${upgrade.id}">Comprar</button>
    `;
    container.appendChild(div);
  });

  // Eventos compra
  container.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      const id = +btn.getAttribute("data-id");
      buyUpgrade(id);
    };
  });
}

function buyUpgrade(id) {
  const upgrade = gameState.upgrades.find(u => u.id === id);
  if (!upgrade) return showNotification("Upgrade inválido!", "error");

  const price = Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity));
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upgrade.quantity++;
    showNotification(`Você comprou ${upgrade.name}!`, "success");
    updateDisplay();
    updateUpgradesDisplay();
    saveGame();
  } else {
    showNotification("Clique insuficiente para comprar!", "error");
  }
}

function updateShopDisplay() {
  const container = $("shopList");
  container.innerHTML = "";
  gameState.shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shopItem";
    div.innerHTML = `
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <p>Preço: ${formatNumber(item.price)} clicks</p>
      <button ${item.owned || gameState.clicks < item.price ? "disabled" : ""} data-id="${item.id}">
        ${item.owned ? "Comprado" : "Comprar"}
      </button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      const id = +btn.getAttribute("data-id");
      buyShopItem(id);
    };
  });
}

let currentMultiplier = 1;
let multiplierTimeout = null;

function buyShopItem(id) {
  const item = gameState.shopItems.find(i => i.id === id);
  if (!item) return showNotification("Item inválido!", "error");
  if (item.owned) return showNotification("Item já comprado!", "info");
  if (gameState.clicks < item.price) return showNotification("Clique insuficiente para comprar!", "error");

  gameState.clicks -= item.price;
  item.owned = true;
  currentMultiplier = id === 1 ? 2 : 5;

  if (multiplierTimeout) clearTimeout(multiplierTimeout);
  multiplierTimeout = setTimeout(() => {
    currentMultiplier = 1;
    item.owned = false;
    showNotification("Multiplicador acabou!", "info");
    updateShopDisplay();
  }, item.effectDuration);

  showNotification(`Você comprou ${item.name}! Multiplicador ativo!`, "success");
  updateDisplay();
  updateShopDisplay();
  saveGame();
}

function updatePetsDisplay() {
  const container = $("pets");
  container.innerHTML = "";
  gameState.pets.forEach(pet => {
    const owned = pet.owned ? " (Obtido)" : "";
    const active = pet.id === gameState.activePetId ? " (Ativo)" : "";
    const div = document.createElement("div");
    div.className = "pet";
    div.innerHTML = `
      <h3>${pet.name}${owned}${active}</h3>
      <p>Bônus: +${pet.bonusPercent}% CPS</p>
      <button ${pet.owned ? "" : (gameState.clicks < 1000 ? "disabled" : "")} data-id="${pet.id}">
        ${pet.owned ? (active ? "Ativo" : "Ativar") : "Comprar (1000 clicks)"}
      </button>
    `;
    container.appendChild(div);
  });

  container.querySelectorAll("button").forEach(btn => {
    btn.onclick = () => {
      const id = +btn.getAttribute("data-id");
      buyOrActivatePet(id);
    };
  });
}

function buyOrActivatePet(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet) return showNotification("Pet inválido!", "error");
  if (pet.owned) {
    gameState.activePetId = pet.id;
    showNotification(`${pet.name} ativado!`, "success");
  } else {
    if (gameState.clicks >= 1000) {
      gameState.clicks -= 1000;
      pet.owned = true;
      gameState.activePetId = pet.id;
      showNotification(`Você comprou e ativou ${pet.name}!`, "success");
    } else {
      showNotification("Clique insuficiente para comprar pet!", "error");
    }
  }
  updateDisplay();
  updatePetsDisplay();
  saveGame();
}

function updateMissions() {
  const container = $("missions");
  container.innerHTML = "";
  gameState.missions.forEach(mission => {
    const progressPercent = Math.min((mission.progress / mission.goal) * 100, 100);
    const completedMark = mission.completed ? "✅" : "⏳";
    const li = document.createElement("li");
    li.innerHTML = `
      ${completedMark} ${mission.description} — ${formatNumber(mission.progress)} / ${formatNumber(mission.goal)}
      <div style="background:#333; width:100%; height:10px; border-radius:5px; margin-top:5px;">
        <div style="background:#0f62fe; width:${progressPercent}%; height:100%; border-radius:5px;"></div>
      </div>
    `;
    container.appendChild(li);
  });
}

function checkMissionProgress() {
  let updated = false;
  gameState.missions.forEach(mission => {
    if (!mission.completed) {
      // Atualiza progresso dependendo do tipo
      switch (mission.id) {
        case 1: // Clique 100 vezes
          if (gameState.totalClicks >= mission.goal) {
            mission.completed = true;
            updated = true;
            gainXP(mission.rewardXP);
            showNotification(`Missão concluída: ${mission.description}!`, "success");
          } else {
            mission.progress = gameState.totalClicks;
          }
          break;
        case 2: // Compre 5 upgrades
          const totalUpgrades = gameState.upgrades.reduce((sum, u) => sum + u.quantity, 0);
          if (totalUpgrades >= mission.goal) {
            mission.completed = true;
            updated = true;
            gainXP(mission.rewardXP);
            showNotification(`Missão concluída: ${mission.description}!`, "success");
          } else {
            mission.progress = totalUpgrades;
          }
          break;
        case 3: // Faça 1 rebirth
          if (gameState.rebirths >= mission.goal) {
            mission.completed = true;
            updated = true;
            gainXP(mission.rewardXP);
            showNotification(`Missão concluída: ${mission.description}!`, "success");
          } else {
            mission.progress = gameState.rebirths;
          }
          break;
        case 4: // Tenha 3 pets ativos (modifiquei para "possuídos")
          const ownedPets = gameState.pets.filter(p => p.owned).length;
          if (ownedPets >= mission.goal) {
            mission.completed = true;
            updated = true;
            gainXP(mission.rewardXP);
            showNotification(`Missão concluída: ${mission.description}!`, "success");
          } else {
            mission.progress = ownedPets;
          }
          break;
        case 5: // Gere 1M clicks no total
          if (gameState.totalClicks >= mission.goal) {
            mission.completed = true;
            updated = true;
            gainXP(mission.rewardXP);
            showNotification(`Missão concluída: ${mission.description}!`, "success");
          } else {
            mission.progress = gameState.totalClicks;
          }
          break;
      }
    }
  });
  if (updated) updateMissions();
}

function updateAchievements() {
  const container = $("achievementsList");
  container.innerHTML = "";
  gameState.achievements.forEach(ach => {
    const achieved = ach.achieved ? "🏅" : "🔒";
    const li = document.createElement("li");
    li.textContent = `${achieved} ${ach.name} — ${ach.description}`;
    container.appendChild(li);
  });

  // Verifica conquistas a desbloquear
  if (!gameState.achievements[0].achieved && gameState.totalClicks >= 1) {
    gameState.achievements[0].achieved = true;
    showNotification("Conquista desbloqueada: Primeiro Click!", "success");
  }
  if (!gameState.achievements[1].achieved && gameState.level >= 10) {
    gameState.achievements[1].achieved = true;
    showNotification("Conquista desbloqueada: Novato!", "success");
  }
  if (!gameState.achievements[2].achieved && gameState.totalClicks >= 1000) {
    gameState.achievements[2].achieved = true;
    showNotification("Conquista desbloqueada: Profissional!", "success");
  }
  if (!gameState.achievements[3].achieved && gameState.rebirths >= 10) {
    gameState.achievements[3].achieved = true;
    showNotification("Conquista desbloqueada: Veterano!", "success");
  }
  if (!gameState.achievements[4].achieved && gameState.pets.every(p => p.owned)) {
    gameState.achievements[4].achieved = true;
    showNotification("Conquista desbloqueada: Colecionador!", "success");
  }
  saveGame();
}

function saveRanking() {
  const name = $("playerNameInput").value.trim();
  if (!name) {
    showNotification("Digite seu nome para salvar o ranking!", "error");
    return;
  }

  const dataRef = ref(db, "ranking");
  push(dataRef).then(pushRef => {
    return set(pushRef, {
      name,
      clicks: gameState.totalClicks,
      level: gameState.level,
      timestamp: Date.now()
    });
  }).then(() => {
    showNotification("Ranking salvo com sucesso!", "success");
    loadRanking();
  }).catch(() => {
    showNotification("Falha ao salvar ranking!", "error");
  });
}

function loadRanking() {
  const rankingContainer = $("detailedRankingList");
  rankingContainer.innerHTML = "Carregando ranking...";

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  get(rankingRef).then(snapshot => {
    if (!snapshot.exists()) {
      rankingContainer.textContent = "Nenhum dado no ranking ainda.";
      return;
    }

    const data = [];
    snapshot.forEach(childSnap => {
      data.push(childSnap.val());
    });

    // Ordenar desc
    data.sort((a, b) => b.clicks - a.clicks);

    rankingContainer.innerHTML = "<ol>";
    data.forEach(player => {
      rankingContainer.innerHTML += `<li>${player.name} — ${formatNumber(player.clicks)} clicks — Nível ${player.level}</li>`;
    });
    rankingContainer.innerHTML += "</ol>";
  }).catch(() => {
    rankingContainer.textContent = "Erro ao carregar ranking.";
  });
}

function clearSave() {
  if (confirm("Tem certeza que deseja apagar seu progresso?")) {
    localStorage.removeItem("clickerSave");
    location.reload();
  }
}

function rebirth() {
  if (gameState.clicks < 10000) {
    showNotification("Você precisa de pelo menos 10.000 clicks para fazer Rebirth!", "error");
    return;
  }
  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.level = 1;
  gameState.xp = 0;
  gameState.xpToNext = 100;
  // Reset upgrades, pets, loja
  initGameData();
  showNotification("Rebirth realizado! Comece de novo com bônus!", "success");
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  saveGame();
}

function toggleTheme() {
  if (gameState.theme === "dark") {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
    $("toggleTheme").textContent = "🌙";
    gameState.theme = "light";
  } else {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
    $("toggleTheme").textContent = "☀️";
    gameState.theme = "dark";
  }
  saveGame();
}

function mainLoop() {
  const cps = calcCPS();
  if (cps > 0) gainClicks(cps / 10); // 10 vezes por segundo para suavizar
  updateDisplay();
}

function init() {
  loadGame();

  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  loadRanking();

  $("clickBtn").onclick = () => {
    gainClicks(1);
  };

  $("saveBtn").onclick = saveGame;
  $("clearSaveBtn").onclick = clearSave;
  $("rebirthBtn").onclick = rebirth;
  $("saveScoreBtn").onclick = saveRanking;
  $("toggleTheme").onclick = toggleTheme;

  $("chatSendBtn").onclick = sendChatMessage;

  setInterval(mainLoop, 100); // loop a cada 100ms

  // Aplica tema salvo
  if (gameState.theme === "light") {
    document.body.classList.add("light");
    $("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.add("dark");
    $("toggleTheme").textContent = "☀️";
  }
}

// Chat global (simples)
function sendChatMessage() {
  const msg = $("chatInput").value.trim();
  if (!msg) return;

  const now = Date.now();
  if (now - gameState.lastChatTimestamp < 2000) { // Anti spam 2s
    showNotification("Espere 2 segundos para enviar outra mensagem!", "error");
    return;
  }

  gameState.lastChatTimestamp = now;
  $("chatInput").value = "";

  // Mostra na tela só (sem servidor real, pois não temos backend)
  const chatMessages = $("chatMessages");
  const msgEl = document.createElement("div");
  msgEl.textContent = `Você: ${msg}`;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  saveGame();
}

window.onload = init;

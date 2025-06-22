// =================== Parte 1: Setup e estado ===================

// Firebase imports (ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// Atalhos DOM
const $ = id => document.getElementById(id);

// Função formatar número
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

// Mundo pelo id
function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

// Inicializar dados
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

// Salvar localStorage
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
    showNotification("Progresso salvo!", "success");
  } catch (err) {
    console.error(err);
    showNotification("Erro ao salvar!", "error");
  }
}

// Carregar localStorage
function loadGame() {
  const saved = localStorage.getItem("clickerSave");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(gameState, parsed);
      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error(err);
      showNotification("Erro ao carregar progresso!", "error");
    }
  }
}

// Atualizar display principal
function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS());
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;

  const activePet = gameState.pets.find(p => p.id === gameState.activePetId);
  $("activePetsStat").textContent = activePet ? activePet.name : "Nenhum";

  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissionsDisplay();
  updateAchievementsDisplay();
  updateRankingDisplay();
}

// Calcular CPS
function calcCPS() {
  let baseCPS = 0;
  gameState.upgrades.forEach(upg => baseCPS += upg.cps * upg.quantity);

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

// Atualizar progresso das missões
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

// Atualizar display das missões
function updateMissionsDisplay() {
  const missionsList = $("missions");
  missionsList.innerHTML = "";
  gameState.missions.forEach(mission => {
    const li = document.createElement("li");
    li.textContent = `${mission.description} (${Math.min(mission.progress, mission.goal)} / ${mission.goal})`;
    li.className = mission.completed ? "mission-completed" : "";
    missionsList.appendChild(li);
  });
}

// Atualizar display das conquistas
function updateAchievementsDisplay() {
  const achievementsList = $("achievementsList");
  achievementsList.innerHTML = "";
  gameState.achievements.forEach(ach => {
    if (!ach.achieved && checkAchievementCriteria(ach)) {
      ach.achieved = true;
      showNotification(`Conquista desbloqueada: ${ach.name}`, "success");
    }
    const li = document.createElement("li");
    li.textContent = ach.name + (ach.achieved ? " ✔" : "");
    li.className = ach.achieved ? "achievement-achieved" : "";
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

// Atualizar upgrades
function updateUpgradesDisplay() {
  const container = $("upgrades");
  container.innerHTML = "";

  gameState.upgrades.forEach(upg => {
    const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    const div = document.createElement("div");
    div.className = "upgrade-item";

    const title = document.createElement("h4");
    title.textContent = upg.name;

    const desc = document.createElement("p");
    desc.textContent = upg.description;

    const qty = document.createElement("p");
    qty.textContent = `Quantidade: ${upg.quantity}`;

    const priceP = document.createElement("p");
    priceP.textContent = `Preço: ${formatNumber(price)}`;

    const btn = document.createElement("button");
    btn.textContent = "Comprar";
    btn.disabled = gameState.clicks < price;
    btn.addEventListener("click", () => {
      buyUpgrade(upg.id, price);
    });

    div.append(title, desc, qty, priceP, btn);
    container.appendChild(div);
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
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

// Atualizar loja
function updateShopDisplay() {
  const container = $("shopList");
  container.innerHTML = "";

  gameState.shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shop-item";

    const title = document.createElement("h4");
    title.textContent = item.name;

    const desc = document.createElement("p");
    desc.textContent = item.description;

    const priceP = document.createElement("p");
    priceP.textContent = `Preço: ${formatNumber(item.price)}`;

    const btn = document.createElement("button");
    btn.textContent = item.owned ? "Comprado" : "Comprar";
    btn.disabled = item.owned || gameState.clicks < item.price;
    btn.addEventListener("click", () => {
      if (!item.owned && gameState.clicks >= item.price) {
        gameState.clicks -= item.price;
        item.owned = true;
        showNotification(`Item comprado: ${item.name}`, "success");
        updateDisplay();
      }
    });

    div.append(title, desc, priceP, btn);
    container.appendChild(div);
  });
}

// Atualizar pets
function updatePetsDisplay() {
  const container = $("pets");
  container.innerHTML = "";

  gameState.pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "pet-item";

    const title = document.createElement("h4");
    title.textContent = pet.name;

    const bonus = document.createElement("p");
    bonus.textContent = `Bônus: +${pet.bonusPercent}% CPS`;

    const owned = document.createElement("p");
    owned.textContent = pet.owned ? "Possuído" : "Não Possuído";

    const btn = document.createElement("button");
    btn.textContent = pet.owned ? (gameState.activePetId === pet.id ? "Ativo" : "Selecionar") : "Comprar (1000 clicks)";
    btn.disabled = !pet.owned && gameState.clicks < 1000;
    btn.addEventListener("click", () => {
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

    div.append(title, bonus, owned, btn);
    container.appendChild(div);
  });
}

// Atualizar ranking online
function updateRankingDisplay() {
  const container = $("detailedRankingList");
  container.textContent = "Carregando ranking...";

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(rankingRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      container.innerHTML = "<p>Nenhum jogador encontrado.</p>";
      return;
    }
    const players = Object.values(data).sort((a,b) => b.clicks - a.clicks);
    container.innerHTML = "";
    players.forEach((player, i) => {
      const div = document.createElement("div");
      div.className = "ranking-item";
      div.textContent = `${i+1}º - ${player.name || "Anônimo"}: ${formatNumber(player.clicks)} clicks`;
      container.appendChild(div);
    });
  });
}

// Mostrar notificações simples
function showNotification(message, type="info") {
  // Aqui você pode implementar um sistema melhor de notificação,
  // por enquanto só um alert (mas alerta bloqueia fluxo e é ruim)
  // Para algo melhor, crie um div que aparece e desaparece
  console.log(`[${type.toUpperCase()}] ${message}`);
}

// Fazer Rebirth
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
  } else {
    showNotification("Você precisa de 100.000 clicks para fazer um rebirth!", "error");
  }
}

// =================== Eventos ===================

$("clickButton").addEventListener("click", () => gainClicks(1));
$("saveBtn").addEventListener("click", saveGame);
$("rebirthBtn").addEventListener("click", doRebirth);
$("clearSaveBtn").addEventListener("click", () => {
  if(confirm("Deseja apagar todo o progresso?")) {
    localStorage.removeItem("clickerSave");
    location.reload();
  }
});
$("saveScoreBtn").addEventListener("click", () => {
  const name = $("playerNameInput").value.trim();
  if (!name || name.length < 3) return alert("Nome muito curto!");
  const playerRef = push(ref(db, "ranking"));
  set(playerRef, { name, clicks: Math.floor(gameState.clicks) })
    .then(() => {
      showNotification("Score salvo no ranking!", "success");
      $("playerNameInput").value = "";
    })
    .catch(err => {
      console.error(err);
      showNotification("Erro ao salvar score!", "error");
    });
});
$("toggleThemeButton").addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  gameState.theme = document.body.classList.contains("light-theme") ? "light" : "dark";
  $("toggleThemeButton").textContent = gameState.theme === "light" ? "🌙" : "☀️";
});

// Auto-click CPS
setInterval(() => {
  const cps = calcCPS();
  gainClicks(cps);
}, 1000);

// Salvar antes de sair
window.addEventListener("beforeunload", saveGame);

// Iniciar o jogo
window.addEventListener("load", () => {
  initGameData();
  loadGame();
  updateDisplay();
  updateRankingDisplay();
});

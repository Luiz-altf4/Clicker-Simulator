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
  // Efeitos temporários ativos
  activeEffects: {
    multiplier: 1,
    turboClick: false,
    xpBoost: false,
    autoClickerBonus: 0,
  }
};

// === Inicializa dados do jogo ===
function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Click básico", description: "Aumenta 1 click por clique", cps: 0, quantity: 0, basePrice: 10 },
    { id: 2, name: "Click avançado", description: "Aumenta 1 click por segundo", cps: 1, quantity: 0, basePrice: 50 },
    { id: 3, name: "Casa de click", description: "Aumenta 2 clicks por segundo", cps: 2, quantity: 0, basePrice: 200 },
    { id: 4, name: "Prédio de click", description: "Aumenta 10 clicks por segundo", cps: 10, quantity: 0, basePrice: 1000 },
    { id: 5, name: "Laboratório de click", description: "Aumenta 20 clicks por segundo", cps: 20, quantity: 0, basePrice: 3000 },
    { id: 6, name: "Fábrica de click", description: "Aumenta 100 clicks por segundo", cps: 100, quantity: 0, basePrice: 10000 },
    { id: 7, name: "Cidade de click", description: "Aumenta 500 clicks por segundo", cps: 500, quantity: 0, basePrice: 50000 },
    { id: 8, name: "País de click", description: "Aumenta 10000 clicks por segundo", cps: 10000, quantity: 0, basePrice: 200000 }
  ];

  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra produção por 5 min", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla produção por 2 min", owned: false, price: 5000, effectDuration: 120000 },
    { id: 3, name: "Click Turbo", description: "Clique manual gera +5 clicks por 1 min", owned: false, price: 3000, effectDuration: 60000 },
    { id: 4, name: "XP Boost", description: "XP ganha 2x por 3 min", owned: false, price: 7000, effectDuration: 180000 },
    { id: 5, name: "Auto Clicker", description: "Gera +50 clicks por segundo por 4 min", owned: false, price: 15000, effectDuration: 240000 },
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
    { id: 4, description: "Acumule 1000 clicks totais", goal: 1000, progress: 0, rewardXP: 200, completed: false },
    { id: 5, description: "Ative 1 pet", goal: 1, progress: 0, rewardXP: 150, completed: false },
    { id: 6, description: "Use 3 itens da loja", goal: 3, progress: 0, rewardXP: 300, completed: false },
  ];

  gameState.achievements = [
    { id: 1, name: "Primeiro Click", description: "Realize seu primeiro click", achieved: false },
    { id: 2, name: "Novato", description: "Alcance nível 10", achieved: false },
    { id: 3, name: "Profissional", description: "Alcance 1000 clicks", achieved: false },
    { id: 4, name: "Veterano", description: "Realize 10 rebirths", achieved: false },
    { id: 5, name: "Colecionador", description: "Compre todos os pets", achieved: false },
    { id: 6, name: "Consumista", description: "Use todos os itens da loja ao menos uma vez", achieved: false },
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
  updateShopDisplay();
  updateUpgradesDisplay();
  updatePetsDisplay();
  updateMissions();
  updateAchievements();
  updateRankingDisplay();
}

// === Calcular CPS total incluindo upgrades, pets e efeitos ===
function calcCPS() {
  let baseCPS = 0;

  // Upgrades
  gameState.upgrades.forEach(u => {
    baseCPS += u.cps * u.quantity;
  });

  // Pets bônus
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) {
      baseCPS *= (1 + pet.bonusPercent / 100);
    }
  }

  // Efeito multiplicador da loja
  baseCPS *= gameState.activeEffects.multiplier;

  // Efeito auto clicker extra
  baseCPS += gameState.activeEffects.autoClickerBonus;

  return baseCPS;
}

// === Função para clicar manualmente ===
function gainClicks(amount = 1) {
  // Se turbo click ativo, adiciona +5 por clique
  if (gameState.activeEffects.turboClick) amount += 5;

  gameState.clicks += amount;
  gameState.totalClicks += amount;

  // XP boost ativo?
  let xpGain = amount * 0.5;
  if (gameState.activeEffects.xpBoost) xpGain *= 2;
  addXP(xpGain);

  checkMissionProgress();

  updateDisplay();
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

// === Atualiza display dos upgrades e permite comprar ===
function updateUpgradesDisplay() {
  const container = $("upgradesList");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const price = getUpgradePrice(upg);
    const div = createEl("div", { className: "upgrade" },
      createEl("h3", {}, upg.name),
      createEl("p", {}, upg.description),
      createEl("p", {}, `Quantidade: ${upg.quantity}`),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("button", {
        onclick: () => buyUpgrade(upg.id)
      }, "Comprar")
    );
    container.appendChild(div);
  });
}

function getUpgradePrice(upg) {
  // Preço escala com quantidade
  return Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
}

function buyUpgrade(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return;

  const price = getUpgradePrice(upg);
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upg.quantity++;
    showNotification(`Você comprou ${upg.name}!`, "success");

    // Missões: compra upgrades
    const mission = gameState.missions.find(m => m.id === 2);
    if (mission && !mission.completed) {
      mission.progress++;
      if (mission.progress >= mission.goal) {
        mission.completed = true;
        showNotification(`Missão "${mission.description}" concluída! +${mission.rewardXP} XP`, "success");
        addXP(mission.rewardXP);
      }
    }
  } else {
    showNotification("Você não tem clicks suficientes!", "error");
  }
  updateDisplay();
  saveGame();
}

// === Atualiza lista da loja, permite comprar itens com efeitos temporários ===
function updateShopDisplay() {
  const shopDiv = $("shopList");
  shopDiv.innerHTML = "";

  gameState.shopItems.forEach(item => {
    const div = createEl("div", { className: "shop-item" },
      createEl("h4", {}, item.name),
      createEl("p", {}, item.description),
      createEl("p", {}, `Preço: ${formatNumber(item.price)}`),
      createEl("button", {
        onclick: () => buyShopItem(item.id)
      }, item.owned ? "Usar" : "Comprar")
    );
    shopDiv.appendChild(div);
  });
}

function buyShopItem(id) {
  const item = gameState.shopItems.find(i => i.id === id);
  if (!item) return;

  if (gameState.clicks >= item.price) {
    gameState.clicks -= item.price;

    // Se não era owned, passa a owned e aplica efeito
    if (!item.owned) {
      item.owned = true;
      applyShopItemEffect(item);
      showNotification(`Você comprou ${item.name}!`, "success");
    } else {
      // Se já owned, apenas reaplica efeito (usar)
      applyShopItemEffect(item);
      showNotification(`Você usou ${item.name}!`, "success");
    }

    // Missões: usar itens da loja
    const mission = gameState.missions.find(m => m.id === 6);
    if (mission && !mission.completed) {
      mission.progress++;
      if (mission.progress >= mission.goal) {
        mission.completed = true;
        showNotification(`Missão "${mission.description}" concluída! +${mission.rewardXP} XP`, "success");
        addXP(mission.rewardXP);
      }
    }
  } else {
    showNotification("Clicks insuficientes para comprar!", "error");
  }
  updateDisplay();
  saveGame();
}

function applyShopItemEffect(item) {
  // Reseta timers e efeitos ao aplicar
  clearTimeout(item.effectTimeout);

  switch (item.id) {
    case 1: // Multiplicador x2 por 5min
      gameState.activeEffects.multiplier = 2;
      item.effectTimeout = setTimeout(() => {
        gameState.activeEffects.multiplier = 1;
        showNotification("Multiplicador x2 terminou!", "info");
        updateDisplay();
      }, item.effectDuration);
      break;

    case 2: // Multiplicador x5 por 2min
      gameState.activeEffects.multiplier = 5;
      item.effectTimeout = setTimeout(() => {
        gameState.activeEffects.multiplier = 1;
        showNotification("Multiplicador x5 terminou!", "info");
        updateDisplay();
      }, item.effectDuration);
      break;

    case 3: // Click Turbo +5 clicks por clique 1min
      gameState.activeEffects.turboClick = true;
      item.effectTimeout = setTimeout(() => {
        gameState.activeEffects.turboClick = false;
        showNotification("Click Turbo terminou!", "info");
        updateDisplay();
      }, item.effectDuration);
      break;

    case 4: // XP Boost 2x XP por 3min
      gameState.activeEffects.xpBoost = true;
      item.effectTimeout = setTimeout(() => {
        gameState.activeEffects.xpBoost = false;
        showNotification("XP Boost terminou!", "info");
        updateDisplay();
      }, item.effectDuration);
      break;

    case 5: // Auto Clicker +50 clicks/s por 4min
      gameState.activeEffects.autoClickerBonus = 50;
      item.effectTimeout = setTimeout(() => {
        gameState.activeEffects.autoClickerBonus = 0;
        showNotification("Auto Clicker terminou!", "info");
        updateDisplay();
      }, item.effectDuration);
      break;
  }
}

// === Atualiza pets, permite ativar ===
function updatePetsDisplay() {
  const petsDiv = $("petsList");
  petsDiv.innerHTML = "";

  gameState.pets.forEach(pet => {
    const isActive = gameState.activePetId === pet.id;
    const div = createEl("div", { className: "pet" },
      createEl("h4", {}, pet.name),
      createEl("p", {}, `Bônus: ${pet.bonusPercent}% CPS`),
      createEl("button", {
        onclick: () => togglePet(pet.id)
      }, isActive ? "Desativar" : (pet.owned ? "Ativar" : "Comprar"))
    );
    petsDiv.appendChild(div);
  });
}

function togglePet(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet) return;

  if (pet.owned) {
    if (gameState.activePetId === id) {
      gameState.activePetId = null;
      showNotification(`Pet ${pet.name} desativado`, "info");
    } else {
      gameState.activePetId = id;
      showNotification(`Pet ${pet.name} ativado`, "success");
    }
  } else {
    // Comprar pet custa 5000 clicks fixo
    if (gameState.clicks >= 5000) {
      gameState.clicks -= 5000;
      pet.owned = true;
      gameState.activePetId = id;
      showNotification(`Você comprou e ativou o pet ${pet.name}!`, "success");
    } else {
      showNotification("Clicks insuficientes para comprar pet!", "error");
    }
  }
  updateDisplay();
  saveGame();
}

// === Atualiza missões na tela ===
function updateMissions() {
  const missionsDiv = $("missionsList");
  missionsDiv.innerHTML = "";

  gameState.missions.forEach(m => {
    const div = createEl("div", { className: "mission" },
      createEl("p", {}, `${m.description} (${m.progress}/${m.goal}) - ${m.completed ? "Concluído" : "Em progresso"}`)
    );
    missionsDiv.appendChild(div);
  });
}

// === Verifica progresso das missões automaticamente ===
function checkMissionProgress() {
  // Missão 1: clique 100 vezes
  const mission1 = gameState.missions.find(m => m.id === 1);
  if (mission1 && !mission1.completed) {
    mission1.progress = Math.min(gameState.totalClicks, mission1.goal);
    if (mission1.progress >= mission1.goal) {
      mission1.completed = true;
      showNotification(`Missão "${mission1.description}" concluída! +${mission1.rewardXP} XP`, "success");
      addXP(mission1.rewardXP);
    }
  }
  // Missão 3: rebirths
  const mission3 = gameState.missions.find(m => m.id === 3);
  if (mission3 && !mission3.completed) {
    mission3.progress = gameState.rebirths;
    if (mission3.progress >= mission3.goal) {
      mission3.completed = true;
      showNotification(`Missão "${mission3.description}" concluída! +${mission3.rewardXP} XP`, "success");
      addXP(mission3.rewardXP);
    }
  }
  // Missão 4: total clicks
  const mission4 = gameState.missions.find(m => m.id === 4);
  if (mission4 && !mission4.completed) {
    mission4.progress = Math.min(gameState.totalClicks, mission4.goal);
    if (mission4.progress >= mission4.goal) {
      mission4.completed = true;
      showNotification(`Missão "${mission4.description}" concluída! +${mission4.rewardXP} XP`, "success");
      addXP(mission4.rewardXP);
    }
  }
  // Missão 5: pet ativo
  const mission5 = gameState.missions.find(m => m.id === 5);
  if (mission5 && !mission5.completed) {
    mission5.progress = gameState.activePetId ? 1 : 0;
    if (mission5.progress >= mission5.goal) {
      mission5.completed = true;
      showNotification(`Missão "${mission5.description}" concluída! +${mission5.rewardXP} XP`, "success");
      addXP(mission5.rewardXP);
    }
  }
}

// === Atualiza conquistas e mostra notificações ===
function updateAchievements() {
  gameState.achievements.forEach(a => {
    if (!a.achieved) {
      switch (a.id) {
        case 1:
          if (gameState.totalClicks >= 1) {
            a.achieved = true;
            showNotification(`Conquista desbloqueada: ${a.name}`, "success");
          }
          break;
        case 2:
          if (gameState.level >= 10) {
            a.achieved = true;
            showNotification(`Conquista desbloqueada: ${a.name}`, "success");
          }
          break;
        case 3:
          if (gameState.totalClicks >= 1000) {
            a.achieved = true;
            showNotification(`Conquista desbloqueada: ${a.name}`, "success");
          }
          break;
        case 4:
          if (gameState.rebirths >= 10) {
            a.achieved = true;
            showNotification(`Conquista desbloqueada: ${a.name}`, "success");
          }
          break;
        case 5:
          if (gameState.pets.every(p => p.owned)) {
            a.achieved = true;
            showNotification(`Conquista desbloqueada: ${a.name}`, "success");
          }
          break;
        case 6:
          const allShopUsed = gameState.shopItems.every(i => i.owned);
          if (allShopUsed) {
            a.achieved = true;
            showNotification(`Conquista desbloqueada: ${a.name}`, "success");
          }
          break;
      }
    }
  });
}

// === Rebirth: reset parcial do jogo com bônus ===
function doRebirth() {
  if (gameState.clicks < 1000000) {
    showNotification("Você precisa de pelo menos 1.000.000 clicks para fazer Rebirth!", "error");
    return;
  }

  gameState.rebirths++;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.xp = 0;
  gameState.level = 1;
  gameState.xpToNext = 100;

  // Reset upgrades e pets
  gameState.upgrades.forEach(u => u.quantity = 0);
  gameState.pets.forEach(p => p.owned = false);
  gameState.activePetId = null;

  // Reset loja
  gameState.shopItems.forEach(i => i.owned = false);

  // Reset missões e conquistas
  gameState.missions.forEach(m => {
    m.progress = 0;
    m.completed = false;
  });
  gameState.achievements.forEach(a => a.achieved = false);

  showNotification("Rebirth realizado! Você ganhou bônus especial!", "success");

  updateDisplay();
  saveGame();
}

// === Ranking ===
function updateRankingDisplay() {
  const rankingDiv = $("rankingList");
  rankingDiv.innerHTML = "Carregando ranking...";

  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));

  get(rankingRef).then(snapshot => {
    const data = snapshot.val();

    if (!data) {
      rankingDiv.textContent = "Nenhum ranking disponível.";
      return;
    }

    const rankingArr = Object.values(data).sort((a, b) => b.clicks - a.clicks);

    rankingDiv.innerHTML = "";

    rankingArr.forEach((player, i) => {
      const div = createEl("div", { className: "ranking-item" }, `${i + 1}. ${player.name}: ${formatNumber(player.clicks)} clicks`);
      rankingDiv.appendChild(div);
    });
  }).catch(err => {
    rankingDiv.textContent = "Erro ao carregar ranking.";
    console.error(err);
  });
}

// === Submete seu nome e pontuação para o ranking ===
function submitScore() {
  const playerName = prompt("Digite seu nome para o ranking:");
  if (!playerName) return;

  const rankRef = ref(db, "ranking");
  const playerData = {
    name: playerName,
    clicks: gameState.totalClicks,
    level: gameState.level,
    rebirths: gameState.rebirths,
  };

  push(rankRef, playerData).then(() => {
    showNotification("Pontuação enviada para o ranking!", "success");
    updateRankingDisplay();
  }).catch(err => {
    showNotification("Erro ao enviar pontuação.", "error");
    console.error(err);
  });
}

// === Auto CPS adiciona clicks a cada segundo ===
function autoClick() {
  const cps = calcCPS();
  gainClicks(cps);
}

setInterval(autoClick, 1000);

// === Eventos principais ===
window.onload = () => {
  initGameData();
  loadGame();
  updateDisplay();

  $("clickArea").onclick = () => gainClicks(getClickPower());

  $("btnRebirth").onclick = doRebirth;
  $("btnSubmitScore").onclick = submitScore;
};

// === Click power manual (baseado em upgrades) ===
function getClickPower() {
  const clickBasic = gameState.upgrades.find(u => u.id === 1);
  let baseClick = clickBasic ? clickBasic.quantity : 1;
  if (baseClick < 1) baseClick = 1;

  if (gameState.activeEffects.turboClick) baseClick += 5;
  baseClick *= gameState.activeEffects.multiplier;

  return baseClick;
}

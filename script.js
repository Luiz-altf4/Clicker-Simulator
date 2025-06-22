// == Firebase Config e Inicialização ==
// Usando Firebase CDN (firebase-app, firebase-database, firebase-auth)
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
  measurementId: "G-ZXXWCDTY9D",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com/"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// == Variáveis de Estado do Jogo ==
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNext = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;
let activePetId = null;

let upgrades = [
  { id: 1, name: "Click Básico", cps: 0.1, price: 50, quantity: 0, description: "Aumenta seus clicks automáticos." },
  { id: 2, name: "Click Turbo", cps: 1, price: 500, quantity: 0, description: "Muito mais clicks por segundo!" },
  { id: 3, name: "Click Supremo", cps: 10, price: 5000, quantity: 0, description: "Clicks automáticos de outro nível." }
];

let shopItems = [
  { id: 1, name: "x2 Booster", price: 1000, owned: false, description: "Multiplica seus clicks por 2." },
  { id: 2, name: "x5 Booster", price: 5000, owned: false, description: "Multiplica seus clicks por 5." }
];

let pets = [
  { id: 1, name: "Pet Fofo", bonusPercent: 5, price: 1000, owned: false, description: "Aumenta seus clicks em 5%." },
  { id: 2, name: "Pet Poderoso", bonusPercent: 15, price: 7500, owned: false, description: "Aumenta seus clicks em 15%." }
];

let missions = [
  { id: 1, description: "Clique 100 vezes", goal: 100, progress: 0, reward: 100, completed: false },
  { id: 2, description: "Compre 5 upgrades", goal: 5, progress: 0, reward: 500, completed: false }
];

let achievements = [
  { id: 1, name: "Iniciante", requirement: 100, achieved: false, description: "Alcance 100 clicks." },
  { id: 2, name: "Avançado", requirement: 1000, achieved: false, description: "Alcance 1000 clicks." }
];

// == DOM Helpers ==
const el = id => document.getElementById(id);

// == Formatação de Números ==
function formatNumber(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while(n >= 1000 && i < units.length-1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

// == Atualização da UI ==
function updateDisplay() {
  el("clicksDisplay").textContent = formatNumber(clicks);
  el("cpsDisplay").textContent = formatNumber(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = formatNumber(xp);
  el("xpToNextLevel").textContent = formatNumber(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;

  // Atualiza upgrades
  renderUpgrades();

  // Atualiza loja
  renderShop();

  // Atualiza pets
  renderPets();

  // Atualiza missões e conquistas
  renderMissions();
  renderAchievements();
  
  // Atualiza ranking online (chamado a cada vez que salvar)
  loadRanking();
}

// == Mundo por índice ==
function getWorldName() {
  const worlds = ["Jardim Inicial","Cidade Neon","Espaço","Dimensão"];
  return worlds[currentWorld - 1] || "???";
}

// == Calcula CPS total com upgrades e pets ==
function calcCPS() {
  let baseCPS = 0;
  upgrades.forEach(u => {
    baseCPS += u.cps * u.quantity;
  });
  let multiplier = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId && p.owned);
    if (pet) multiplier += pet.bonusPercent / 100;
  }
  shopItems.forEach(item => {
    if (item.owned) {
      if (item.name.includes("x5")) multiplier *= 5;
      else if (item.name.includes("x2")) multiplier *= 2;
    }
  });
  return baseCPS * multiplier;
}

// == Ganhar XP e subir nível ==
function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.3);
  }
}

// == Renderiza lista de upgrades ==
function renderUpgrades() {
  const container = el("upgradesList");
  container.innerHTML = "";
  upgrades.forEach(u => {
    const div = document.createElement("div");
    div.className = "upgrade-item";
    div.title = u.description;
    div.innerHTML = `
      <span class="upgrade-name">${u.name}</span>
      <span class="upgrade-qty">x${u.quantity}</span>
      <span class="upgrade-price">${formatNumber(u.price)} Clicks</span>
      <button class="buy-upgrade-btn" data-id="${u.id}" ${clicks < u.price ? "disabled" : ""}>Comprar</button>
    `;
    container.appendChild(div);
  });

  // Botões de compra upgrades
  const buttons = container.querySelectorAll(".buy-upgrade-btn");
  buttons.forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      buyUpgrade(id);
    };
  });
}

// == Comprar upgrade ==
function buyUpgrade(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return;
  if (clicks >= upgrade.price) {
    clicks -= upgrade.price;
    upgrade.quantity++;
    upgrade.price = Math.floor(upgrade.price * 1.15);
    gainXP(10);
    updateDisplay();
    logEvent(`Upgrade comprado: ${upgrade.name}`);
  } else {
    alert("Clicks insuficientes!");
  }
}

// == Renderiza loja ==
function renderShop() {
  const container = el("shopList");
  container.innerHTML = "";
  shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shop-item";
    div.title = item.description;
    div.innerHTML = `
      <span class="shop-name">${item.name}</span>
      <span class="shop-price">${formatNumber(item.price)} Clicks</span>
      <button class="buy-shop-btn" data-id="${item.id}" ${item.owned || clicks < item.price ? "disabled" : ""}>
        ${item.owned ? "Comprado" : "Comprar"}
      </button>
    `;
    container.appendChild(div);
  });

  // Botões comprar itens da loja
  const buttons = container.querySelectorAll(".buy-shop-btn");
  buttons.forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      buyShopItem(id);
    };
  });
}

// == Comprar item da loja ==
function buyShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item || item.owned) return;
  if (clicks >= item.price) {
    clicks -= item.price;
    item.owned = true;
    gainXP(20);
    updateDisplay();
    logEvent(`Item da loja comprado: ${item.name}`);
  } else {
    alert("Clicks insuficientes!");
  }
}

// == Renderiza pets ==
function renderPets() {
  const container = el("petsList");
  container.innerHTML = "";
  pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "pet-item";
    div.title = pet.description;
    div.innerHTML = `
      <span class="pet-name">${pet.name}</span>
      <span class="pet-bonus">Bônus: +${pet.bonusPercent}%</span>
      <span class="pet-price">${formatNumber(pet.price)} Clicks</span>
      <button class="buy-pet-btn" data-id="${pet.id}" ${pet.owned || clicks < pet.price ? "disabled" : ""}>
        ${pet.owned ? (activePetId === pet.id ? "Ativo" : "Selecionar") : "Comprar"}
      </button>
    `;
    container.appendChild(div);
  });

  // Botões pets
  const buttons = container.querySelectorAll(".buy-pet-btn");
  buttons.forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      const pet = pets.find(p => p.id === id);
      if (!pet) return;
      if (pet.owned) {
        activePetId = id;
        logEvent(`Pet selecionado: ${pet.name}`);
        updateDisplay();
      } else if (clicks >= pet.price) {
        clicks -= pet.price;
        pet.owned = true;
        activePetId = id;
        gainXP(25);
        logEvent(`Pet comprado: ${pet.name}`);
        updateDisplay();
      } else {
        alert("Clicks insuficientes!");
      }
    };
  });
}

// == Renderiza missões ==
function renderMissions() {
  const container = el("missionsList");
  container.innerHTML = "";
  missions.forEach(mission => {
    const progressPercent = Math.min(100, (mission.progress / mission.goal) * 100);
    const div = document.createElement("div");
    div.className = "mission-item";
    div.innerHTML = `
      <span class="mission-desc">${mission.description}</span>
      <progress value="${mission.progress}" max="${mission.goal}"></progress>
      <span class="mission-progress">${mission.progress} / ${mission.goal}</span>
      <button class="claim-mission-btn" data-id="${mission.id}" ${mission.completed ? "disabled" : ""}>${mission.completed ? "Concluído" : "Reivindicar"}</button>
    `;
    container.appendChild(div);
  });

  // Botões reivindicar missões
  const buttons = container.querySelectorAll(".claim-mission-btn");
  buttons.forEach(btn => {
    btn.onclick = () => {
      const id = Number(btn.dataset.id);
      claimMission(id);
    };
  });
}

// == Reivindicar missão ==
function claimMission(id) {
  const mission = missions.find(m => m.id === id);
  if (!mission || mission.completed) return;
  if (mission.progress >= mission.goal) {
    clicks += mission.reward;
    mission.completed = true;
    gainXP(50);
    updateDisplay();
    logEvent(`Missão concluída: ${mission.description}`);
  } else {
    alert("Missão ainda não concluída.");
  }
}

// == Renderiza conquistas ==
function renderAchievements() {
  const container = el("achievementsList");
  container.innerHTML = "";
  achievements.forEach(a => {
    const div = document.createElement("div");
    div.className = "achievement-item";
    div.innerHTML = `
      <span class="achievement-name">${a.name}</span>
      <span class="achievement-desc">${a.description}</span>
      <span class="achievement-status">${a.achieved ? "✔️" : "❌"}</span>
    `;
    container.appendChild(div);
  });
}

// == Verifica conquistas ==
function checkAchievements() {
  achievements.forEach(a => {
    if (!a.achieved && clicks >= a.requirement) {
      a.achieved = true;
      gainXP(100);
      logEvent(`Conquista desbloqueada: ${a.name}`);
      updateDisplay();
    }
  });
}

// == Clique manual ==
el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  clicks += gain;
  missions.forEach(m => {
    if (!m.completed) {
      m.progress += gain;
      if (m.progress >= m.goal) m.progress = m.goal;
    }
  });
  gainXP(5);
  checkAchievements();
  updateDisplay();
  logEvent(`Click manual: +${gain.toFixed(2)} clicks`);
};

// == CPS automático ==
setInterval(() => {
  const gain = calcCPS();
  clicks += gain;
  missions.forEach(m => {
    if (!m.completed) {
      m.progress += gain;
      if (m.progress >= m.goal) m.progress = m.goal;
    }
  });
  gainXP(gain);
  checkAchievements();
  updateDisplay();
  logEvent(`CPS automático: +${gain.toFixed(2)} clicks`);
}, 1000);

// == Salvar no LocalStorage ==
function saveGame() {
  const saveData = {
    clicks,
    level,
    xp,
    xpToNext,
    rebirths,
    currentWorld,
    upgrades,
    shopItems,
    pets,
    missions,
    achievements,
    activePetId
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
  logEvent("Jogo salvo localmente.");
}

// == Carregar do LocalStorage ==
function loadGame() {
  const saveData = JSON.parse(localStorage.getItem("clickerSave"));
  if (!saveData) return;
  clicks = saveData.clicks || 0;
  level = saveData.level || 1;
  xp = saveData.xp || 0;
  xpToNext = saveData.xpToNext || 100;
  rebirths = saveData.rebirths || 0;
  currentWorld = saveData.currentWorld || 1;
  upgrades = saveData.upgrades || upgrades;
  shopItems = saveData.shopItems || shopItems;
  pets = saveData.pets || pets;
  missions = saveData.missions || missions;
  achievements = saveData.achievements || achievements;
  activePetId = saveData.activePetId || null;
  logEvent("Jogo carregado do armazenamento local.");
}

// == Eventos para salvar automaticamente ao sair ==
window.addEventListener("beforeunload", saveGame);
window.addEventListener("load", () => {
  loadGame();
  updateDisplay();
  loadRanking();
  loadChat();
  logEvent("Jogo iniciado.");
});

// == Ranking Firebase ==
function saveScore() {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) {
    alert("Nome inválido. Use ao menos 3 caracteres.");
    return;
  }
  const rankingRef = db.ref("ranking");
  const newEntry = rankingRef.push();
  newEntry.set({ name, score: Math.floor(clicks) });
  el("playerNameInput").value = "";
  logEvent(`Score salvo: ${name} - ${Math.floor(clicks)}`);
}
el("saveScoreBtn").onclick = saveScore;

function loadRanking() {
  const list = el("rankingList");
  const rankingRef = db.ref("ranking");
  rankingRef.off(); // Remove event listeners anteriores
  rankingRef.on("value", snapshot => {
    const data = [];
    snapshot.forEach(child => {
      data.push(child.val());
    });
    data.sort((a,b) => b.score - a.score);
    const top10 = data.slice(0, 10);
    list.innerHTML = top10.map((e, i) => `<div>#${i+1} ${e.name}: ${formatNumber(e.score)}</div>`).join("");
  });
}

// == Logging do sistema ==
const logs = [];
const maxLogs = 100;
function logEvent(msg) {
  const timestamp = new Date().toLocaleTimeString();
  logs.push(`[${timestamp}] ${msg}`);
  if (logs.length > maxLogs) logs.shift();
  const logArea = el("debugLogs");
  if (logArea) {
    logArea.value = logs.join("\n");
    logArea.scrollTop = logArea.scrollHeight;
  }
}

// == Botão limpar logs ==
el("clearLogsBtn").onclick = () => {
  logs.length = 0;
  el("debugLogs").value = "";
  logEvent("Logs limpos.");
};

// == Chat Global Firebase (simples) ==
const chatInput = el("chatInput");
const chatList = el("chatList");

function sendMessage() {
  const msg = chatInput.value.trim();
  if (msg.length === 0) return;
  const chatRef = db.ref("chat");
  const message = {
    user: el("playerNameInput").value || "Anon",
    message: msg,
    timestamp: Date.now()
  };
  chatRef.push(message);
  chatInput.value = "";
}

el("chatSendBtn").onclick = sendMessage;

function loadChat() {
  const chatRef = db.ref("chat");
  chatRef.off();
  chatRef.limitToLast(50).on("child_added", snapshot => {
    const msg = snapshot.val();
    const div = document.createElement("div");
    div.className = "chat-message";
    const time = new Date(msg.timestamp).toLocaleTimeString();
    div.textContent = `[${time}] ${msg.user}: ${msg.message}`;
    chatList.appendChild(div);
    chatList.scrollTop = chatList.scrollHeight;
  });
}

// == Função para reiniciar o jogo ==
function resetGame() {
  if (!confirm("Tem certeza que deseja resetar o jogo?")) return;
  clicks = 0;
  cps = 0;
  level = 1;
  xp = 0;
  xpToNext = 100;
  rebirths = 0;
  currentWorld = 1;
  buyAmount = 1;
  activePetId = null;
  upgrades.forEach(u => { u.quantity = 0; u.price = Math.floor(u.price / Math.pow(1.15, u.quantity)); });
  shopItems.forEach(i => i.owned = false);
  pets.forEach(p => p.owned = false);
  missions.forEach(m => { m.progress = 0; m.completed = false; });
  achievements.forEach(a => a.achieved = false);
  localStorage.removeItem("clickerSave");
  updateDisplay();
  logEvent("Jogo resetado.");
}

// == Botão resetar jogo ==
el("resetGameBtn")?.addEventListener("click", resetGame);

// == Inicialização da interface e eventos gerais ==
function init() {
  // Cria containers para upgrades, shop, pets, missions e achievements
  if (!el("upgradesList")) {
    const upgradesDiv = el("upgrades");
    const upgradesList = document.createElement("div");
    upgradesList.id = "upgradesList";
    upgradesDiv.appendChild(upgradesList);
  }
  if (!el("shopList")) {
    const shopDiv = el("shop");
    const shopList = document.createElement("div");
    shopList.id = "shopList";
    shopDiv.appendChild(shopList);
  }
  if (!el("petsList")) {
    const petsDiv = el("pets");
    const petsList = document.createElement("div");
    petsList.id = "petsList";
    petsDiv.appendChild(petsList);
  }
  if (!el("missionsList")) {
    const missionsDiv = el("missions");
    const missionsList = document.createElement("div");
    missionsList.id = "missionsList";
    missionsDiv.appendChild(missionsList);
  }
  if (!el("achievementsList")) {
    const achDiv = el("achievements");
    const achList = document.createElement("div");
    achList.id = "achievementsList";
    achDiv.appendChild(achList);
  }
  
  // Tema claro/escuro
  el("toggleTheme").onclick = () => {
    document.body.classList.toggle("light-theme");
    el("toggleTheme").textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
    logEvent("Tema alternado.");
  };

  // Inicializa
  loadGame();
  updateDisplay();
  loadRanking();
  loadChat();
  logEvent("Jogo iniciado.");
}

// Chama init após DOM estar pronto
document.addEventListener("DOMContentLoaded", init);

// == Parte 2 do JS - Expansão de funcionalidades ==

// == Sistema de Rebirths / Prestígio ==

function canRebirth() {
  // Exemplo: só permite rebirth após alcançar nível 50
  return level >= 50;
}

function doRebirth() {
  if (!canRebirth()) {
    alert("Você precisa estar no nível 50 para realizar o Rebirth!");
    return;
  }
  if (!confirm("Tem certeza que quer reiniciar com Rebirth? Você ganhará bônus especiais!")) return;

  rebirths++;
  // Reseta estado mas mantém rebirths e bônus
  clicks = 0;
  level = 1;
  xp = 0;
  xpToNext = 100;
  currentWorld = 1;

  // Reseta upgrades e loja (preços base)
  upgrades.forEach(u => {
    u.quantity = 0;
    u.price = Math.floor(u.price / Math.pow(1.15, u.quantity));
  });
  shopItems.forEach(i => i.owned = false);
  pets.forEach(p => p.owned = false);

  // Reseta missões e conquistas (missões ficam zeradas, conquistas mantidas)
  missions.forEach(m => {
    m.progress = 0;
    m.completed = false;
  });

  // Bônus por rebirth: ganha multiplicador de XP e clicks por rebirths
  xpMultiplier = 1 + rebirths * 0.15;
  clicksMultiplier = 1 + rebirths * 0.2;

  saveGame();
  updateDisplay();
  logEvent(`Rebirth realizado! Total de rebirths: ${rebirths}`);
}

// Botão Rebirth (criar botão no HTML)
const rebirthBtn = document.createElement("button");
rebirthBtn.id = "rebirthBtn";
rebirthBtn.textContent = "Rebirth";
rebirthBtn.title = "Reinicie o jogo para ganhar bônus!";
rebirthBtn.style.margin = "10px";
rebirthBtn.onclick = doRebirth;
el("container").appendChild(rebirthBtn);

// == Multiplicadores globais (afetam clicks, xp, cps) ==
let xpMultiplier = 1;
let clicksMultiplier = 1;

// == Atualizar ganhos com multiplicadores ==
function gainXP(amount) {
  xp += amount * xpMultiplier;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.3);
  }
}

function calcCPS() {
  let baseCPS = 0;
  upgrades.forEach(u => {
    baseCPS += u.cps * u.quantity;
  });
  let multiplier = clicksMultiplier;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId && p.owned);
    if (pet) multiplier += pet.bonusPercent / 100;
  }
  shopItems.forEach(item => {
    if (item.owned) {
      if (item.name.includes("x5")) multiplier *= 5;
      else if (item.name.includes("x2")) multiplier *= 2;
    }
  });
  return baseCPS * multiplier;
}

// == Sistema de múltiplos mundos ==

function unlockNextWorld() {
  if (currentWorld < 4 && level >= currentWorld * 30) {
    currentWorld++;
    logEvent(`Novo mundo desbloqueado: ${getWorldName()}`);
    alert(`Parabéns! Você desbloqueou o mundo: ${getWorldName()}`);
    saveGame();
    updateDisplay();
  }
}

// Check de desbloqueio de mundos a cada level up
function checkWorldUnlock() {
  unlockNextWorld();
}

// Ajusta gainXP para checar unlock do mundo
function gainXP(amount) {
  xp += amount * xpMultiplier;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.3);
    checkWorldUnlock();
  }
}

// == Sistema de sons e efeitos ==

const sounds = {
  click: new Audio("sounds/click.mp3"),
  upgrade: new Audio("sounds/upgrade.mp3"),
  buy: new Audio("sounds/buy.mp3"),
  rebirth: new Audio("sounds/rebirth.mp3"),
  levelUp: new Audio("sounds/levelup.mp3")
};

let soundEnabled = true;

function playSound(name) {
  if (soundEnabled && sounds[name]) {
    sounds[name].currentTime = 0;
    sounds[name].play().catch(() => {});
  }
}

// Botão toggle som
const toggleSoundBtn = document.createElement("button");
toggleSoundBtn.id = "toggleSoundBtn";
toggleSoundBtn.textContent = "Som: On";
toggleSoundBtn.style.margin = "10px";
toggleSoundBtn.onclick = () => {
  soundEnabled = !soundEnabled;
  toggleSoundBtn.textContent = `Som: ${soundEnabled ? "On" : "Off"}`;
  logEvent(`Som ${soundEnabled ? "ativado" : "desativado"}`);
};
el("container").appendChild(toggleSoundBtn);

// == Sistema de animações ao clicar ==

function animateClick() {
  const clickBtn = el("clickBtn");
  clickBtn.classList.add("clicked");
  setTimeout(() => clickBtn.classList.remove("clicked"), 150);
}

// Modifica evento do clickBtn para tocar som e animação
el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  gain *= clicksMultiplier;
  clicks += gain;

  // Atualiza progresso das missões
  missions.forEach(m => {
    if (!m.completed) {
      m.progress += gain;
      if (m.progress >= m.goal) m.progress = m.goal;
    }
  });

  gainXP(gain);
  checkAchievements();
  updateDisplay();
  playSound("click");
  animateClick();
  logEvent(`Click manual: +${gain.toFixed(2)} clicks`);
};

// == CPS automático atualizado para usar multiplicadores ==

setInterval(() => {
  const gain = calcCPS();
  clicks += gain;

  missions.forEach(m => {
    if (!m.completed) {
      m.progress += gain;
      if (m.progress >= m.goal) m.progress = m.goal;
    }
  });

  gainXP(gain);
  checkAchievements();
  updateDisplay();
  playSound("click");
  logEvent(`CPS automático: +${gain.toFixed(2)} clicks`);
}, 1000);

// == Sistema de notificações visuais ==

function showNotification(text, duration = 3000) {
  let notif = document.createElement("div");
  notif.className = "notification";
  notif.textContent = text;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), duration);
}

// == Botão para resetar o jogo ==

el("resetGameBtn")?.addEventListener("click", () => {
  if (confirm("Tem certeza que deseja resetar o jogo?")) {
    resetGame();
    showNotification("Jogo resetado!");
  }
});

// == Salvamento automático a cada 10 segundos ==

setInterval(() => {
  saveGame();
  logEvent("Jogo salvo automaticamente.");
}, 10000);

// == Gerenciamento de compra rápida ==

const buyAmountInput = document.createElement("input");
buyAmountInput.type = "number";
buyAmountInput.min = 1;
buyAmountInput.value = 1;
buyAmountInput.id = "buyAmountInput";
buyAmountInput.title = "Quantidade para comprar";
buyAmountInput.style.margin = "10px";
el("container").appendChild(buyAmountInput);

// == Sistema de tooltips ==

document.body.addEventListener("mouseover", e => {
  const target = e.target;
  if (target.title) {
    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    tooltip.textContent = target.title;
    document.body.appendChild(tooltip);
    const rect = target.getBoundingClientRect();
    tooltip.style.top = (rect.top - 30) + "px";
    tooltip.style.left = rect.left + "px";
    target.addEventListener("mouseleave", () => {
      tooltip.remove();
    }, { once: true });
  }
});

// == Sistema de tema claro/escuro com animação ==

el("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  el("toggleTheme").textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
  showNotification(`Tema alterado para ${document.body.classList.contains("light-theme") ? "claro" : "escuro"}`);
  logEvent("Tema alternado.");
};

// == Configurações adicionais ==

const settingsPanel = document.createElement("div");
settingsPanel.id = "settingsPanel";
settingsPanel.style.display = "none";
settingsPanel.style.position = "fixed";
settingsPanel.style.top = "10%";
settingsPanel.style.right = "10%";
settingsPanel.style.backgroundColor = "#222";
settingsPanel.style.color = "#eee";
settingsPanel.style.padding = "20px";
settingsPanel.style.borderRadius = "10px";
settingsPanel.style.zIndex = 1000;

// Botão abrir configurações
const settingsBtn = document.createElement("button");
settingsBtn.textContent = "Configurações";
settingsBtn.style.position = "fixed";
settingsBtn.style.top = "10px";
settingsBtn.style.right = "10px";
settingsBtn.style.zIndex = 1000;
settingsBtn.onclick = () => {
  settingsPanel.style.display = settingsPanel.style.display === "none" ? "block" : "none";
};
document.body.appendChild(settingsBtn);
document.body.appendChild(settingsPanel);

// Dentro do painel configurações: controles de som, tema, reset

settingsPanel.innerHTML = `
  <h3>Configurações</h3>
  <label>
    <input type="checkbox" id="soundToggle" checked /> Som ativado
  </label>
  <br/>
  <label>
    <input type="checkbox" id="notificationsToggle" checked /> Notificações ativadas
  </label>
  <br/>
  <button id="resetGameSettingsBtn">Resetar jogo</button>
`;

// Eventos configuração

el("soundToggle").onchange = e => {
  soundEnabled = e.target.checked;
  logEvent(`Som ${soundEnabled ? "ativado" : "desativado"} via config.`);
};
el("notificationsToggle").onchange = e => {
  notificationsEnabled = e.target.checked;
  logEvent(`Notificações ${notificationsEnabled ? "ativadas" : "desativadas"} via config.`);
};
el("resetGameSettingsBtn").onclick = () => {
  if(confirm("Quer resetar o jogo agora?")) {
    resetGame();
    showNotification("Jogo resetado!");
    settingsPanel.style.display = "none";
  }
};

// == Notificações ativadas por padrão ==
let notificationsEnabled = true;

// == Logging avançado ==

function detailedLog(msg) {
  console.log(`[LOG][${new Date().toLocaleTimeString()}]: ${msg}`);
}

// == Chamadas no final para inicializar ===
loadGame();
updateDisplay();
loadRanking();
loadChat();
logEvent("Segunda parte do script carregada.");

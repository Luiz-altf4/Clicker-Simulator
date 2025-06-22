// === Firebase Config ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue, remove } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Estado do Jogo ===
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNext = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;

let upgrades = [];
let shopItems = [];
let pets = [];
let achievements = [];
let missions = [];

let activePetId = null;
let notifications = [];
let theme = "dark"; // default

// === DOM Helper ===
const el = id => document.getElementById(id);

// === Formatar números em K, M, B, ... ===
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

// === Nome dos Mundos ===
function getWorldName(id = currentWorld) {
  const names = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão"];
  return names[id - 1] || "???";
}

// === Atualiza a exibição dos stats ===
function updateDisplay() {
  el("clicksDisplay").textContent = formatNumber(clicks);
  el("cpsDisplay").textContent = formatNumber(calculateCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = formatNumber(xp);
  el("xpToNextLevel").textContent = formatNumber(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName(currentWorld)}`;

  updateUpgradesUI();
  updateShopUI();
  updatePetsUI();
  updateMissionsUI();
  updateAchievementsUI();
  updateRankingUI();
  updateNotifications();
}

// === Calcula CPS total com upgrades, pets e boosts ===
function calculateCPS() {
  let base = 0;
  upgrades.forEach(u => {
    base += u.cps * u.quantity;
  });
  let multiplier = 1;

  if (activePetId !== null) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) multiplier += pet.bonusPercent / 100;
  }

  // Boosts da loja
  if (shopItems.some(item => item.name.includes("x5") && item.owned)) multiplier *= 5;
  else if (shopItems.some(item => item.name.includes("x2") && item.owned)) multiplier *= 2;

  return base * multiplier;
}

// === Incrementa cliques e ganha XP ===
function gainClicks(amount) {
  let gain = amount;
  if (activePetId !== null) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= (1 + pet.bonusPercent / 100);
  }
  clicks += gain;
  gainXP(gain * 5);
  updateDisplay();
}

// === Função de clique no botão ===
el("clickBtn").onclick = () => {
  gainClicks(1);
  playSound("click");
  el("clickBtn").classList.add("glow");
  setTimeout(() => el("clickBtn").classList.remove("glow"), 300);
};

// === Ganho automático por segundo ===
setInterval(() => {
  const gain = calculateCPS();
  gainClicks(gain);
}, 1000);

// === Ganha XP e sobe de nível ===
function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.3);
    playSound("levelUp");
    showNotification(`Parabéns! Você subiu para o nível ${level}`, "success");
  }
}

// === Salvar estado no localStorage ===
function saveGame() {
  const saveData = {
    clicks, cps, level, xp, xpToNext,
    rebirths, currentWorld, buyAmount,
    upgrades, shopItems, pets,
    achievements, missions,
    activePetId, theme
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

// === Carregar estado do localStorage ===
function loadGame() {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    try {
      const data = JSON.parse(save);
      clicks = data.clicks || 0;
      cps = data.cps || 0;
      level = data.level || 1;
      xp = data.xp || 0;
      xpToNext = data.xpToNext || 100;
      rebirths = data.rebirths || 0;
      currentWorld = data.currentWorld || 1;
      buyAmount = data.buyAmount || 1;

      upgrades = data.upgrades || [];
      shopItems = data.shopItems || [];
      pets = data.pets || [];
      achievements = data.achievements || [];
      missions = data.missions || [];

      activePetId = data.activePetId !== undefined ? data.activePetId : null;
      theme = data.theme || "dark";

      applyTheme(theme);
    } catch (e) {
      console.error("Erro ao carregar save:", e);
      resetGame();
    }
  } else {
    resetGame();
  }
}

// === Reset do jogo para padrão ===
function resetGame() {
  clicks = 0;
  cps = 0;
  level = 1;
  xp = 0;
  xpToNext = 100;
  rebirths = 0;
  currentWorld = 1;
  buyAmount = 1;

  upgrades = getDefaultUpgrades();
  shopItems = getDefaultShopItems();
  pets = getDefaultPets();
  achievements = getDefaultAchievements();
  missions = getDefaultMissions();

  activePetId = null;
  theme = "dark";
  applyTheme(theme);
  saveGame();
  updateDisplay();
  showNotification("Jogo reiniciado.", "info");
}

// === Definir tema visual ===
function applyTheme(newTheme) {
  theme = newTheme;
  if (theme === "light") {
    document.body.classList.add("light-theme");
    el("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    el("toggleTheme").textContent = "☀️";
  }
  saveGame();
}

// === Alternar tema pelo botão ===
el("toggleTheme").onclick = () => {
  applyTheme(theme === "dark" ? "light" : "dark");
};

// === Dados padrões iniciais das Upgrades ===
function getDefaultUpgrades() {
  return [
    { id: 1, name: "Clicker Básico", cps: 0.5, price: 100, quantity: 0, description: "Gera 0.5 clicks por segundo." },
    { id: 2, name: "Clicker Avançado", cps: 2, price: 500, quantity: 0, description: "Gera 2 clicks por segundo." },
    { id: 3, name: "Clicker Robótico", cps: 10, price: 2500, quantity: 0, description: "Gera 10 clicks por segundo." },
    { id: 4, name: "Clicker Espacial", cps: 50, price: 12500, quantity: 0, description: "Gera 50 clicks por segundo." },
    { id: 5, name: "Clicker Dimensional", cps: 200, price: 60000, quantity: 0, description: "Gera 200 clicks por segundo." },
  ];
}

// === Dados padrões iniciais da Loja ===
function getDefaultShopItems() {
  return [
    { id: 1, name: "Boost x2", price: 10000, owned: false, description: "Dobra seus clicks por segundo." },
    { id: 2, name: "Boost x5", price: 50000, owned: false, description: "Quinque seus clicks por segundo." },
  ];
}

// === Dados padrões dos Pets ===
function getDefaultPets() {
  return [
    { id: 1, name: "Cachorro", bonusPercent: 10, description: "Aumenta seus clicks em 10%." },
    { id: 2, name: "Gato", bonusPercent: 15, description: "Aumenta seus clicks em 15%." },
    { id: 3, name: "Dragão", bonusPercent: 30, description: "Aumenta seus clicks em 30%." },
  ];
}

// === Dados padrões das Conquistas ===
function getDefaultAchievements() {
  return [
    { id: 1, name: "Iniciante", description: "Clique 100 vezes.", completed: false, check: () => clicks >= 100 },
    { id: 2, name: "Experiente", description: "Clique 1.000 vezes.", completed: false, check: () => clicks >= 1000 },
    { id: 3, name: "Veterano", description: "Clique 10.000 vezes.", completed: false, check: () => clicks >= 10000 },
    { id: 4, name: "Level Up", description: "Alcance o nível 10.", completed: false, check: () => level >= 10 },
    { id: 5, name: "Rebirth", description: "Realize seu primeiro rebirth.", completed: false, check: () => rebirths >= 1 },
  ];
}

// === Dados padrões das Missões ===
function getDefaultMissions() {
  return [
    { id: 1, name: "Começar a Jornada", description: "Clique 50 vezes.", completed: false, reward: 100, check: () => clicks >= 50 },
    { id: 2, name: "Crescimento Rápido", description: "Alcance 5 de nível.", completed: false, reward: 250, check: () => level >= 5 },
    { id: 3, name: "Primeira Recompensa", description: "Compre um upgrade.", completed: false, reward: 500, check: () => upgrades.some(u => u.quantity > 0) },
    { id: 4, name: "Rebirth Inicial", description: "Realize seu primeiro rebirth.", completed: false, reward: 1000, check: () => rebirths >= 1 },
  ];
}

// === Atualiza a lista de upgrades na UI ===
function updateUpgradesUI() {
  const container = el("upgrades");
  if (!container) return;
  let html = "<ul>";
  upgrades.forEach(u => {
    const affordable = clicks >= u.price;
    html += `<li class="${affordable ? "affordable" : "unaffordable"}" onclick="buyUpgrade(${u.id})" title="${u.description}">
      ${u.name} (${u.quantity}) - Preço: ${formatNumber(u.price)} - CPS: ${u.cps}
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Compra upgrade pelo id ===
function buyUpgrade(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return;
  if (clicks < upgrade.price) {
    showNotification("Você não tem clicks suficientes para comprar esse upgrade.", "error");
    playSound("error");
    return;
  }
  clicks -= upgrade.price;
  upgrade.quantity++;
  // Incrementa preço para balancear progressão
  upgrade.price = Math.floor(upgrade.price * 1.25);
  playSound("buy");
  showNotification(`Upgrade "${upgrade.name}" comprado!`, "success");
  saveGame();
  updateDisplay();
}

// === Atualiza a lista da loja na UI ===
function updateShopUI() {
  const container = el("shop");
  if (!container) return;
  let html = "<ul>";
  shopItems.forEach(item => {
    const affordable = clicks >= item.price;
    const ownedClass = item.owned ? "owned" : "";
    html += `<li class="${ownedClass} ${affordable && !item.owned ? "affordable" : "unaffordable"}" 
    onclick="buyShopItem(${item.id})" title="${item.description}">
      ${item.name} ${item.owned ? "(Comprado)" : `(Preço: ${formatNumber(item.price)})`}
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Compra item da loja ===
function buyShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;
  if (item.owned) {
    showNotification("Você já possui esse item.", "info");
    return;
  }
  if (clicks < item.price) {
    showNotification("Clicks insuficientes para comprar este item.", "error");
    playSound("error");
    return;
  }
  clicks -= item.price;
  item.owned = true;
  playSound("buy");
  showNotification(`Item "${item.name}" comprado!`, "success");
  saveGame();
  updateDisplay();
}

// === Atualiza lista de pets na UI ===
function updatePetsUI() {
  const container = el("pets");
  if (!container) return;
  let html = "<ul>";
  pets.forEach(pet => {
    const activeClass = pet.id === activePetId ? "active" : "";
    html += `<li class="${activeClass}" onclick="selectPet(${pet.id})" title="${pet.description}">
      <img src="assets/pets/${pet.name.toLowerCase()}.png" alt="${pet.name}" class="pet-avatar" />
      ${pet.name} (+${pet.bonusPercent}%) 
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Seleciona pet ativo ===
function selectPet(id) {
  if (activePetId === id) {
    activePetId = null;
    showNotification("Pet desativado.", "info");
  } else {
    activePetId = id;
    showNotification(`Pet ativado: ${pets.find(p => p.id === id)?.name}`, "success");
  }
  playSound("petSelect");
  saveGame();
  updateDisplay();
}

// === Atualiza missões na UI ===
function updateMissionsUI() {
  const container = el("missions");
  if (!container) return;
  let html = "<ul>";
  missions.forEach(mission => {
    const completedClass = mission.completed ? "completed" : "";
    html += `<li class="${completedClass}" onclick="claimMission(${mission.id})" title="${mission.description}">
      ${mission.name} ${mission.completed ? "(Concluído)" : ""}
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Revisa e marca missões completadas, permite reclamar recompensa ===
function checkMissions() {
  missions.forEach(mission => {
    if (!mission.completed && mission.check && mission.check()) {
      mission.completed = true;
      showNotification(`Missão concluída: ${mission.name}`, "success");
      playSound("missionComplete");
    }
  });
  saveGame();
  updateDisplay();
}

// === Reivindica recompensa da missão ===
function claimMission(id) {
  const mission = missions.find(m => m.id === id);
  if (!mission || !mission.completed || mission.rewardClaimed) {
    showNotification("Missão não disponível para recompensa.", "error");
    return;
  }
  clicks += mission.reward;
  mission.rewardClaimed = true;
  showNotification(`Recompensa de ${formatNumber(mission.reward)} clicks recebida!`, "success");
  playSound("reward");
  saveGame();
  updateDisplay();
}

// === Atualiza conquistas na UI ===
function updateAchievementsUI() {
  const container = el("achievements");
  if (!container) return;
  let html = "<ul>";
  achievements.forEach(ach => {
    const completedClass = ach.completed ? "completed" : "";
    html += `<li class="${completedClass}" title="${ach.description}">
      ${ach.name} ${ach.completed ? "(Completado)" : ""}
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Checa conquistas e marca completadas ===
function checkAchievements() {
  achievements.forEach(ach => {
    if (!ach.completed && ach.check && ach.check()) {
      ach.completed = true;
      showNotification(`Conquista desbloqueada: ${ach.name}`, "success");
      playSound("achievement");
    }
  });
  saveGame();
  updateDisplay();
}

// === Sons do jogo ===
const sounds = {
  click: new Audio("assets/sounds/click.wav"),
  levelUp: new Audio("assets/sounds/levelup.wav"),
  buy: new Audio("assets/sounds/buy.wav"),
  error: new Audio("assets/sounds/error.wav"),
  missionComplete: new Audio("assets/sounds/mission_complete.wav"),
  reward: new Audio("assets/sounds/reward.wav"),
  petSelect: new Audio("assets/sounds/pet_select.wav"),
  achievement: new Audio("assets/sounds/achievement.wav"),
};

function playSound(name) {
  if (!sounds[name]) return;
  sounds[name].currentTime = 0;
  sounds[name].play().catch(() => {});
}

// === Sistema de notificações ===
const notificationQueue = [];
let isNotificationShowing = false;

function showNotification(message, type = "info") {
  notificationQueue.push({ message, type });
  if (!isNotificationShowing) displayNextNotification();
}

function displayNextNotification() {
  if (notificationQueue.length === 0) {
    isNotificationShowing = false;
    return;
  }
  isNotificationShowing = true;
  const { message, type } = notificationQueue.shift();

  const notifEl = document.createElement("div");
  notifEl.className = `notification ${type}`;
  notifEl.textContent = message;
  document.body.appendChild(notifEl);

  setTimeout(() => {
    notifEl.classList.add("visible");
  }, 50);

  setTimeout(() => {
    notifEl.classList.remove("visible");
    setTimeout(() => {
      document.body.removeChild(notifEl);
      displayNextNotification();
    }, 300);
  }, 3500);
}

// === Ranking Firebase ===
const rankingRef = ref(db, "ranking");

function submitScore() {
  const username = prompt("Digite seu nome para o ranking:");
  if (!username) return;
  const newEntryRef = push(rankingRef);
  set(newEntryRef, {
    name: username,
    clicks,
    level,
    rebirths,
    timestamp: Date.now(),
  }).then(() => {
    showNotification("Pontuação enviada ao ranking!", "success");
    loadRanking();
  }).catch(() => {
    showNotification("Erro ao enviar pontuação.", "error");
  });
}

let rankingData = [];

function loadRanking() {
  get(rankingRef).then(snapshot => {
    if (snapshot.exists()) {
      rankingData = Object.values(snapshot.val());
      rankingData.sort((a, b) => b.clicks - a.clicks);
      updateRankingUI();
    }
  });
}

// === Atualiza ranking na UI ===
function updateRankingUI() {
  const container = el("rankingList");
  if (!container) return;
  let html = "";
  rankingData.slice(0, 20).forEach((entry, i) => {
    html += `<div title="Nível: ${entry.level} | Rebirths: ${entry.rebirths}">
      ${i+1}. ${entry.name} - Clicks: ${formatNumber(entry.clicks)}
    </div>`;
  });
  container.innerHTML = html;
}

// === Função principal init ===
function init() {
  loadGame();
  loadRanking();
  updateDisplay();
  setInterval(() => {
    checkAchievements();
    checkMissions();
    saveGame();
  }, 3000);
}

window.onload = init;

// === Continuação do script.js - Parte 2/4 ===

// === Expansão dos upgrades com níveis e efeitos visuais ===
function upgradeEffect(upgrade) {
  // Exemplo: efeito visual para upgrades específicos
  switch (upgrade.id) {
    case 1:
      // Piscar botão click
      el("clickBtn").classList.add("upgrade-flash");
      setTimeout(() => el("clickBtn").classList.remove("upgrade-flash"), 500);
      break;
    case 3:
      // Animação de brilho no contador de clicks
      el("clicksDisplay").classList.add("glow");
      setTimeout(() => el("clicksDisplay").classList.remove("glow"), 700);
      break;
    // Adicione mais efeitos conforme desejar
  }
}

// === Comprar upgrade com efeitos e animação ===
function buyUpgrade(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return;
  if (clicks < upgrade.price) {
    showNotification("Você não tem clicks suficientes para comprar esse upgrade.", "error");
    playSound("error");
    return;
  }
  clicks -= upgrade.price;
  upgrade.quantity++;
  upgrade.price = Math.floor(upgrade.price * 1.25);
  playSound("buy");
  showNotification(`Upgrade "${upgrade.name}" comprado!`, "success");
  upgradeEffect(upgrade);
  saveGame();
  updateDisplay();
}

// === Sistema de rebirths: reinicia o jogo mas mantém bônus especiais ===
function canRebirth() {
  return level >= 50 && clicks >= 100000;
}

function doRebirth() {
  if (!canRebirth()) {
    showNotification("Você ainda não pode realizar rebirth.", "error");
    return;
  }

  rebirths++;
  clicks = 0;
  cps = 0;
  level = 1;
  xp = 0;
  xpToNext = 100;
  currentWorld = 1;
  buyAmount = 1;

  // Resetar upgrades mas aumentar bônus permanentes
  upgrades.forEach(u => {
    u.quantity = 0;
    u.price = Math.floor(u.price / Math.pow(1.25, u.quantity)); // reset price base
  });

  // Recompensa por rebirth: incremento permanente
  upgrades.forEach(u => {
    u.cps *= 1 + rebirths * 0.05; // +5% CPS por rebirth
  });

  showNotification(`Rebirth realizado! Você agora tem ${rebirths} rebirth(s) e +${(rebirths * 5).toFixed(0)}% CPS bônus permanente!`, "success");
  playSound("rebirth");
  saveGame();
  updateDisplay();
}

// === Botão para rebirth (adicionar no HTML e ligar aqui) ===
const rebirthBtn = document.createElement("button");
rebirthBtn.textContent = "Rebirth";
rebirthBtn.id = "rebirthBtn";
rebirthBtn.title = "Reinicia com bônus, desbloqueia mais poder";
rebirthBtn.onclick = doRebirth;
document.getElementById("container").appendChild(rebirthBtn);

// === Gerenciamento de mundos e desbloqueio ===
const worldsData = [
  { id: 1, name: "Jardim Inicial", unlockLevel: 1 },
  { id: 2, name: "Cidade Neon", unlockLevel: 20 },
  { id: 3, name: "Espaço", unlockLevel: 40 },
  { id: 4, name: "Dimensão", unlockLevel: 60 },
];

// Checa se jogador pode avançar para próximo mundo
function checkWorldUnlock() {
  const nextWorld = worldsData.find(w => w.id === currentWorld + 1);
  if (!nextWorld) return; // último mundo
  if (level >= nextWorld.unlockLevel) {
    currentWorld++;
    showNotification(`Novo mundo desbloqueado: ${nextWorld.name}!`, "success");
    playSound("worldUnlock");
    saveGame();
    updateDisplay();
  }
}

// === Atualização periódica para verificar desbloqueios ===
setInterval(() => {
  checkAchievements();
  checkMissions();
  checkWorldUnlock();
  checkPetsUnlock();
  saveGame();
}, 5000);

// === Sistema de compra rápida (botão para escolher quantos comprar) ===
function createBuyAmountSelector() {
  const container = document.createElement("div");
  container.id = "buyAmountSelector";

  [1, 10, 100].forEach(amount => {
    const btn = document.createElement("button");
    btn.textContent = `Comprar x${amount}`;
    btn.onclick = () => {
      buyAmount = amount;
      showNotification(`Quantidade para compra definida: x${amount}`, "info");
    };
    container.appendChild(btn);
  });

  document.getElementById("container").appendChild(container);
}

createBuyAmountSelector();

// === Compra múltipla para upgrades ===
function buyMultipleUpgrades(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return;
  const totalPrice = calculateTotalPrice(upgrade.price, buyAmount, 1.25);
  if (clicks < totalPrice) {
    showNotification("Clicks insuficientes para comprar essa quantidade.", "error");
    playSound("error");
    return;
  }
  clicks -= totalPrice;
  upgrade.quantity += buyAmount;
  upgrade.price = Math.floor(upgrade.price * Math.pow(1.25, buyAmount));
  playSound("buy");
  showNotification(`Comprou ${buyAmount}x ${upgrade.name}!`, "success");
  saveGame();
  updateDisplay();
}

// === Calcula preço total para compras múltiplas ===
function calculateTotalPrice(basePrice, quantity, factor) {
  let total = 0;
  for (let i = 0; i < quantity; i++) {
    total += Math.floor(basePrice * Math.pow(factor, i));
  }
  return total;
}

// === Atualiza upgrades UI para múltiplas compras ===
function updateUpgradesUI() {
  const container = el("upgrades");
  if (!container) return;
  let html = "<ul>";
  upgrades.forEach(u => {
    const affordable = clicks >= u.price;
    html += `<li class="${affordable ? "affordable" : "unaffordable"}" title="${u.description}">
      <div><strong>${u.name} (${u.quantity})</strong></div>
      <div>Preço: ${formatNumber(u.price)}</div>
      <div>CPS: ${u.cps}</div>
      <button onclick="buyMultipleUpgrades(${u.id})">Comprar x${buyAmount}</button>
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Pets avançados com níveis e buffs especiais ===
pets = getDefaultPets().map(p => ({ ...p, level: 1, experience: 0 }));

// Seleciona pet com experiência e level up
function gainPetXP(petId, amount) {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;
  pet.experience += amount;
  const expToLevel = pet.level * 100;
  if (pet.experience >= expToLevel) {
    pet.level++;
    pet.experience -= expToLevel;
    pet.bonusPercent += 2; // aumenta bônus do pet a cada level
    showNotification(`Seu pet ${pet.name} subiu para o nível ${pet.level}!`, "success");
    playSound("levelUp");
    saveGame();
    updateDisplay();
  }
}

// Atualiza UI dos pets com barra de xp
function updatePetsUI() {
  const container = el("pets");
  if (!container) return;
  let html = "<ul>";
  pets.forEach(pet => {
    const activeClass = pet.id === activePetId ? "active" : "";
    const expPercent = Math.min(100, (pet.experience / (pet.level * 100)) * 100);
    html += `<li class="${activeClass}" onclick="selectPet(${pet.id})" title="${pet.description}">
      <img src="assets/pets/${pet.name.toLowerCase()}.png" alt="${pet.name}" class="pet-avatar" />
      ${pet.name} (+${pet.bonusPercent.toFixed(1)}%) - Nível: ${pet.level}
      <div class="pet-xp-bar">
        <div class="pet-xp-fill" style="width:${expPercent}%;"></div>
      </div>
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// Verifica e desbloqueia novos pets com base em critérios
function checkPetsUnlock() {
  // Exemplo: desbloqueia novo pet a partir do level 10
  if (!pets.some(p => p.id === 4)) {
    if (level >= 10) {
      pets.push({ id: 4, name: "Fênix", bonusPercent: 50, description: "Desperta do fogo para aumentar seus clicks!", level: 1, experience: 0 });
      showNotification("Novo pet desbloqueado: Fênix!", "success");
      playSound("petUnlock");
      saveGame();
      updateDisplay();
    }
  }
}

// === Animações visuais para click no botão ===
function animateClickEffect() {
  const clickBtn = el("clickBtn");
  clickBtn.classList.add("click-effect");
  setTimeout(() => {
    clickBtn.classList.remove("click-effect");
  }, 400);
}

el("clickBtn").addEventListener("click", () => {
  animateClickEffect();
});

// === Salvar automático a cada 15 segundos ===
setInterval(() => {
  saveGame();
  showNotification("Jogo salvo automaticamente.", "info");
}, 15000);

// === Salvar manual pelo botão ===
const saveBtn = document.createElement("button");
saveBtn.id = "saveGameBtn";
saveBtn.textContent = "Salvar Jogo";
saveBtn.title = "Salva seu progresso manualmente";
saveBtn.onclick = () => {
  saveGame();
  showNotification("Jogo salvo manualmente.", "success");
};
document.getElementById("container").appendChild(saveBtn);

// === Carregar manual pelo botão ===
const loadBtn = document.createElement("button");
loadBtn.id = "loadGameBtn";
loadBtn.textContent = "Carregar Jogo";
loadBtn.title = "Carrega seu progresso salvo";
loadBtn.onclick = () => {
  loadGame();
  updateDisplay();
  showNotification("Jogo carregado manualmente.", "success");
};
document.getElementById("container").appendChild(loadBtn);

// === Auto salvar quando perder foco (fechar aba, trocar de aba) ===
window.addEventListener("beforeunload", () => {
  saveGame();
});

// === Evento de clique para fechar modais (se tiver algum) ===
document.body.addEventListener("click", e => {
  const modal = el("modal");
  if (modal && e.target === modal) {
    modal.style.display = "none";
  }
});

// === Exemplo Modal para instruções ou dicas ===
function openModal(text) {
  let modal = el("modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "modal";
    modal.className = "modal";
    modal.innerHTML = `<div class="modal-content">
      <span id="modalClose" class="close">&times;</span>
      <p id="modalText"></p>
    </div>`;
    document.body.appendChild(modal);
    el("modalClose").onclick = () => {
      modal.style.display = "none";
    };
  }
  el("modalText").textContent = text;
  modal.style.display = "block";
}

// === Abrir modal com dica ao iniciar o jogo ===
window.onload = () => {
  openModal("Bem-vindo ao Clicker Simulator! Clique no botão para ganhar clicks, compre upgrades, desbloqueie pets e avance pelos mundos!");
};

// === Função para resetar conquistas e missões (útil para debugging) ===
function resetAchievementsMissions() {
  achievements.forEach(a => { a.completed = false; });
  missions.forEach(m => { m.completed = false; m.rewardClaimed = false; });
  saveGame();
  updateDisplay();
  showNotification("Conquistas e missões resetadas.", "info");
}

// === Teste rápido (remover em produção) ===
window.resetAchievementsMissions = resetAchievementsMissions;

// === Debug: Forçar rebirth (remove depois) ===
window.forceRebirth = () => {
  rebirths = 0;
  doRebirth();
};

// === Adiciona botão debug rebirth (remover antes da release) ===
const debugBtn = document.createElement("button");
debugBtn.id = "debugRebirthBtn";
debugBtn.textContent = "Debug Rebirth";
debugBtn.title = "Forçar rebirth para testes";
debugBtn.onclick = () => {
  window.forceRebirth();
};
document.getElementById("container").appendChild(debugBtn);

// === Continuação do script.js - Parte 3/4 ===

// === Sistema de Missões Avançado ===
missions = [
  { id: 1, description: "Clique 100 vezes", target: 100, progress: 0, completed: false, reward: 50, rewardClaimed: false },
  { id: 2, description: "Alcance level 10", target: 10, progress: 0, completed: false, reward: 100, rewardClaimed: false },
  { id: 3, description: "Compre 10 upgrades", target: 10, progress: 0, completed: false, reward: 150, rewardClaimed: false },
  { id: 4, description: "Realize 1 rebirth", target: 1, progress: 0, completed: false, reward: 500, rewardClaimed: false },
  // Adicione mais missões conforme necessidade
];

// Atualiza progresso e checa se missão foi completada
function checkMissions() {
  missions.forEach(m => {
    if (m.completed) return;
    switch (m.id) {
      case 1:
        m.progress = clicks;
        break;
      case 2:
        m.progress = level;
        break;
      case 3:
        m.progress = upgrades.reduce((sum, u) => sum + u.quantity, 0);
        break;
      case 4:
        m.progress = rebirths;
        break;
    }
    if (m.progress >= m.target) {
      m.completed = true;
      showNotification(`Missão concluída: ${m.description}! Recompensa disponível!`, "success");
      playSound("missionComplete");
    }
  });
  updateMissionsUI();
}

// Marca recompensa da missão como recebida
function claimMissionReward(id) {
  const mission = missions.find(m => m.id === id);
  if (!mission || !mission.completed || mission.rewardClaimed) return;
  clicks += mission.reward;
  mission.rewardClaimed = true;
  showNotification(`Recompensa de ${mission.reward} clicks recebida!`, "success");
  playSound("reward");
  saveGame();
  updateDisplay();
  updateMissionsUI();
}

// Atualiza UI das missões com botão para recompensa
function updateMissionsUI() {
  const container = el("missions");
  if (!container) return;
  let html = "<ul>";
  missions.forEach(m => {
    html += `<li class="${m.completed ? "completed" : ""}">
      ${m.description} — ${formatNumber(m.progress)} / ${formatNumber(m.target)}
      ${m.completed && !m.rewardClaimed ? `<button onclick="claimMissionReward(${m.id})">Recompensa</button>` : ""}
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Sistema de Conquistas Avançado ===
achievements = [
  { id: 1, name: "Iniciante", description: "Faça seu primeiro clique", condition: () => clicks >= 1, completed: false },
  { id: 2, name: "Primeiro Milhão", description: "Alcance 1 milhão de clicks", condition: () => clicks >= 1e6, completed: false },
  { id: 3, name: "Rebirth Master", description: "Faça 10 rebirths", condition: () => rebirths >= 10, completed: false },
  { id: 4, name: "Veterano", description: "Alcance level 100", condition: () => level >= 100, completed: false },
  // Adicione mais conquistas conforme desejado
];

// Checa e marca conquistas
function checkAchievements() {
  achievements.forEach(a => {
    if (!a.completed && a.condition()) {
      a.completed = true;
      showNotification(`Conquista desbloqueada: ${a.name}!`, "success");
      playSound("achievement");
      saveGame();
      updateAchievementsUI();
    }
  });
}

// Atualiza UI das conquistas
function updateAchievementsUI() {
  const container = el("achievements");
  if (!container) return;
  let html = "<ul>";
  achievements.forEach(a => {
    html += `<li class="${a.completed ? "completed" : ""}" title="${a.description}">
      ${a.name} ${a.completed ? "✔️" : ""}
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Sistema de Loja com Buffs Temporários ===
shopItems = [
  { id: 1, name: "x2 Clicks", description: "Multiplica clicks por 2 por 5 minutos", price: 1000, owned: false, active: false, duration: 5*60*1000, timer: null },
  { id: 2, name: "x5 CPS", description: "Multiplica CPS por 5 por 3 minutos", price: 5000, owned: false, active: false, duration: 3*60*1000, timer: null },
  { id: 3, name: "Pet XP Boost", description: "Dobro de XP para pets por 10 minutos", price: 3000, owned: false, active: false, duration: 10*60*1000, timer: null },
  // Mais itens
];

// Ativa buff da loja
function activateShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return;
  if (clicks < item.price) {
    showNotification("Clicks insuficientes para comprar buff.", "error");
    playSound("error");
    return;
  }
  if (item.active) {
    showNotification("Buff já ativo.", "info");
    return;
  }
  clicks -= item.price;
  item.owned = true;
  item.active = true;
  playSound("buy");
  showNotification(`Buff ${item.name} ativado por ${item.duration/60000} minutos!`, "success");

  // Ativa timer para desativar buff
  if (item.timer) clearTimeout(item.timer);
  item.timer = setTimeout(() => {
    item.active = false;
    item.owned = false;
    showNotification(`Buff ${item.name} expirou.`, "info");
    updateShopUI();
    saveGame();
  }, item.duration);

  saveGame();
  updateDisplay();
  updateShopUI();
}

// Atualiza UI da loja com botões ativar
function updateShopUI() {
  const container = el("shop");
  if (!container) return;
  let html = "<ul>";
  shopItems.forEach(i => {
    html += `<li class="${i.active ? "active-buff" : ""}" title="${i.description}">
      ${i.name} — Preço: ${formatNumber(i.price)}
      <button onclick="activateShopItem(${i.id})" ${i.active ? "disabled" : ""}>${i.active ? "Ativo" : "Comprar"}</button>
    </li>`;
  });
  html += "</ul>";
  container.innerHTML = html;
}

// === Modifica CPS e clicks com buffs ativos ===
function calcBuffMultiplier() {
  let mult = 1;
  if (shopItems.find(i => i.id === 2 && i.active)) mult *= 5; // x5 CPS
  if (shopItems.find(i => i.id === 1 && i.active)) mult *= 2; // x2 clicks
  return mult;
}

// Ajusta ganho de clicks e CPS com buffs e pets
function calcCPS() {
  let base = 0;
  upgrades.forEach(u => base += u.cps * u.quantity);
  let mult = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) mult += pet.bonusPercent / 100;
  }
  mult *= calcBuffMultiplier();
  return base * mult;
}

function gainClicks(amount) {
  let gain = amount;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  if (shopItems.find(i => i.id === 1 && i.active)) gain *= 2; // buff x2 clicks
  clicks += gain;
  gainPetXP(activePetId, gain * 0.1);
  gainXP(gain);
}

// Override do clique para ganhar clicks com buffs e pets
el("clickBtn").onclick = () => {
  gainClicks(1);
  updateDisplay();
  animateClickEffect();
  playSound("click");
};

// === Sistema de Sons Completo com controle de volume ===
const audioContext = new AudioContext();
let globalVolume = 0.5;

function setGlobalVolume(value) {
  globalVolume = value;
  Object.values(sounds).forEach(snd => {
    snd.volume = globalVolume;
  });
}

const volumeControl = document.createElement("input");
volumeControl.type = "range";
volumeControl.min = 0;
volumeControl.max = 1;
volumeControl.step = 0.01;
volumeControl.value = globalVolume;
volumeControl.id = "volumeControl";
volumeControl.title = "Controle de volume";
volumeControl.oninput = e => {
  setGlobalVolume(parseFloat(e.target.value));
};

document.getElementById("container").appendChild(volumeControl);

// === Atualiza UI das missões, conquistas e loja a cada 10 segundos ===
setInterval(() => {
  updateMissionsUI();
  updateAchievementsUI();
  updateShopUI();
}, 10000);

// === Função para formatar números legíveis (exemplo 1.23M) ===
function formatNumber(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while(n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2)+units[i];
}

// === Atualização da UI principal ===
function updateDisplay() {
  el("clicksDisplay").textContent = formatNumber(clicks);
  el("cpsDisplay").textContent = formatNumber(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = formatNumber(xp);
  el("xpToNextLevel").textContent = formatNumber(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;

  updateUpgradesUI();
  updatePetsUI();
  updateMissionsUI();
  updateAchievementsUI();
  updateShopUI();
}

// === Ranking online aprimorado com Firebase ===
function submitScore() {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) {
    showNotification("Por favor, insira um nome válido (mín 3 caracteres).", "error");
    return;
  }
  const newRef = push(ref(db, "ranking"));
  set(newRef, {
    name,
    clicks: Math.floor(clicks),
    level,
    rebirths,
    timestamp: Date.now(),
  }).then(() => {
    showNotification("Score enviado com sucesso!", "success");
    loadRanking();
  }).catch(() => {
    showNotification("Erro ao enviar score.", "error");
  });
}

el("saveScoreBtn").onclick = submitScore;

function loadRanking() {
  get(ref(db, "ranking")).then(snapshot => {
    if (snapshot.exists()) {
      const data = Object.values(snapshot.val());
      data.sort((a,b) => b.clicks - a.clicks);
      rankingData = data.slice(0, 20);
      updateRankingUI();
    }
  });
}

function updateRankingUI() {
  const container = el("rankingList");
  if (!container) return;
  let html = "";
  rankingData.forEach((entry, i) => {
    html += `<div title="Level: ${entry.level} | Rebirths: ${entry.rebirths}">
      ${i + 1}. ${entry.name} - Clicks: ${formatNumber(entry.clicks)}
    </div>`;
  });
  container.innerHTML = html;
}

// === Parte 4/4 - script.js (finalização suprema lendária) ===

// === Sistema de Tutorial Interativo ===
const tutorialSteps = [
  "Bem-vindo ao Clicker Simulator! Clique no botão para ganhar clicks.",
  "Ótimo! Agora compre seu primeiro upgrade para aumentar seu CPS.",
  "Use os buffs da loja para acelerar seu progresso temporariamente.",
  "Ative seu pet para ganhar bônus adicionais.",
  "Confira as missões e conquistas para ganhar recompensas extras.",
  "Não esqueça de salvar seu score no ranking online!",
  "Boa sorte e divirta-se!",
];

let tutorialIndex = 0;
const tutorialEl = document.createElement("div");
tutorialEl.id = "tutorialBox";
tutorialEl.style.cssText = `
  position: fixed; bottom: 20px; right: 20px; background: rgba(0,0,0,0.8);
  color: #fff; padding: 15px; border-radius: 10px; max-width: 300px;
  font-family: 'Arial', sans-serif; font-size: 14px; z-index: 9999;
  cursor: pointer; user-select: none;
  box-shadow: 0 0 10px rgba(255,255,255,0.2);
  transition: opacity 0.3s ease-in-out;
`;
tutorialEl.title = "Clique para avançar o tutorial";
tutorialEl.textContent = tutorialSteps[tutorialIndex];
document.body.appendChild(tutorialEl);

tutorialEl.onclick = () => {
  tutorialIndex++;
  if (tutorialIndex >= tutorialSteps.length) {
    tutorialEl.style.opacity = "0";
    setTimeout(() => tutorialEl.remove(), 500);
  } else {
    tutorialEl.textContent = tutorialSteps[tutorialIndex];
  }
};

// === Animação no clique — efeito partículas simples ===
function animateClickEffect() {
  const btn = el("clickBtn");
  const rect = btn.getBoundingClientRect();
  const particle = document.createElement("div");
  particle.className = "click-particle";
  particle.style.left = `${rect.left + rect.width/2}px`;
  particle.style.top = `${rect.top + rect.height/2}px`;
  document.body.appendChild(particle);

  setTimeout(() => {
    particle.style.transform = `translate(${(Math.random()-0.5)*100}px, ${(Math.random()-0.5)*100}px) scale(0)`;
    particle.style.opacity = "0";
  }, 10);

  setTimeout(() => {
    particle.remove();
  }, 500);
}

// === Efeito CSS para partículas ===
const style = document.createElement("style");
style.textContent = `
.click-particle {
  position: fixed;
  width: 10px; height: 10px;
  background: radial-gradient(circle, #ffd700 60%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
  transition: transform 0.5s ease-out, opacity 0.5s ease-out;
  z-index: 10000;
}
`;
document.head.appendChild(style);

// === Salvamento e carregamento avançado com backup ===
function saveGame() {
  const saveData = {
    clicks, cps, level, xp, xpToNext, rebirths, currentWorld, buyAmount,
    upgrades, shopItems, pets, achievements, missions, activePetId,
    timestamp: Date.now()
  };
  try {
    localStorage.setItem("clickerSave", JSON.stringify(saveData));
    // Backup para outra chave por segurança
    localStorage.setItem("clickerSaveBackup", JSON.stringify(saveData));
    showNotification("Jogo salvo com sucesso.", "success");
  } catch (e) {
    showNotification("Erro ao salvar o jogo.", "error");
  }
}

function loadGame() {
  try {
    let data = localStorage.getItem("clickerSave");
    if (!data) {
      // Tenta backup se não existir o principal
      data = localStorage.getItem("clickerSaveBackup");
    }
    if (data) {
      const s = JSON.parse(data);
      clicks = s.clicks || 0;
      cps = s.cps || 0;
      level = s.level || 1;
      xp = s.xp || 0;
      xpToNext = s.xpToNext || 100;
      rebirths = s.rebirths || 0;
      currentWorld = s.currentWorld || 1;
      buyAmount = s.buyAmount || 1;
      upgrades = s.upgrades || upgrades;
      shopItems = s.shopItems || shopItems;
      pets = s.pets || pets;
      achievements = s.achievements || achievements;
      missions = s.missions || missions;
      activePetId = s.activePetId || null;
      showNotification("Jogo carregado com sucesso.", "success");
    }
  } catch (e) {
    showNotification("Erro ao carregar o jogo.", "error");
  }
}

// === Auto save a cada 30 segundos ===
setInterval(saveGame, 30000);

// === Notificações flutuantes ===
function showNotification(message, type = "info") {
  const colors = {
    success: "#4caf50",
    error: "#f44336",
    info: "#2196f3",
    warning: "#ff9800"
  };
  const notif = document.createElement("div");
  notif.textContent = message;
  notif.style.position = "fixed";
  notif.style.bottom = "30px";
  notif.style.right = "30px";
  notif.style.backgroundColor = colors[type] || colors.info;
  notif.style.color = "#fff";
  notif.style.padding = "12px 20px";
  notif.style.borderRadius = "8px";
  notif.style.boxShadow = "0 0 10px rgba(0,0,0,0.3)";
  notif.style.zIndex = 99999;
  notif.style.opacity = "0";
  notif.style.transition = "opacity 0.5s ease-in-out";

  document.body.appendChild(notif);
  setTimeout(() => notif.style.opacity = "1", 10);
  setTimeout(() => {
    notif.style.opacity = "0";
    setTimeout(() => notif.remove(), 500);
  }, 4000);
}

// === Otimizações gerais ===
// Roda verificação de missões e conquistas a cada 3 segundos para garantir atualização correta
setInterval(() => {
  checkMissions();
  checkAchievements();
}, 3000);

// Exemplo de função utilitária para debouncing
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Debounce na função updateDisplay para evitar excesso de chamadas
const debouncedUpdateDisplay = debounce(updateDisplay, 100);
document.addEventListener("click", debouncedUpdateDisplay);

// Inicialização
window.addEventListener("load", () => {
  loadGame();
  updateDisplay();
  loadRanking();
});

// === Atalhos de teclado para ações rápidas ===
window.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  switch (e.key) {
    case "c":
      el("clickBtn").click();
      break;
    case "u":
      // Ativa primeiro upgrade disponível
      const firstUpgrade = upgrades.find(u => u.price <= clicks);
      if (firstUpgrade) buyUpgrade(firstUpgrade.id);
      break;
    case "r":
      performRebirth();
      break;
  }
});

// === Sistema de ajuda avançado (tooltips) ===
document.querySelectorAll("[data-tooltip]").forEach(elm => {
  elm.addEventListener("mouseenter", () => {
    const tip = document.createElement("div");
    tip.className = "tooltip";
    tip.textContent = elm.getAttribute("data-tooltip");
    document.body.appendChild(tip);
    const rect = elm.getBoundingClientRect();
    tip.style.top = rect.top - tip.offsetHeight - 5 + "px";
    tip.style.left = rect.left + (rect.width - tip.offsetWidth) / 2 + "px";
    elm._tooltip = tip;
  });
  elm.addEventListener("mouseleave", () => {
    if (elm._tooltip) {
      elm._tooltip.remove();
      elm._tooltip = null;
    }
  });
});

// === Estilo Tooltip (adicionado via JS para garantir compatibilidade) ===
const tooltipStyle = document.createElement("style");
tooltipStyle.textContent = `
.tooltip {
  position: fixed;
  background: rgba(0,0,0,0.75);
  color: white;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 12px;
  pointer-events: none;
  z-index: 99999;
  transition: opacity 0.3s ease;
  user-select: none;
}
`;
document.head.appendChild(tooltipStyle);

// Clicker Simulator - Script.js lendário supremo - Parte 1/2
// Versão completa e funcional, com comentários e estrutura organizada

// === Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// === Estado do jogador ===
const player = {
  clicks: 0,
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
  soundsEnabled: true,
  settings: {
    particles: true,
    animations: true,
    autoSave: true,
    music: false,
  },
  unlockedWorlds: [1],
  prestige: 0,
};

// === Utilitários ===
const el = id => document.getElementById(id);

function format(n) {
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
  const names = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão Sombria", "Laboratório X"];
  return names[id - 1] || "???";
}

// Função para tocar sons (se ativados)
function playSound(src) {
  if (!player.soundsEnabled) return;
  const audio = new Audio(src);
  audio.volume = 0.4;
  audio.play();
}

// Função para mostrar notificações
function notify(text, time = 3000) {
  const n = document.createElement("div");
  n.className = "notification";
  n.textContent = text;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), time);
}

// Função para criar partículas ao clicar
function createClickParticle() {
  if (!player.settings.particles) return;
  const p = document.createElement("div");
  p.className = "click-particle";
  p.textContent = "+1";
  p.style.left = Math.random() * 90 + "%";
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1000);
}

// Atualizar exibição dos valores
function updateDisplay() {
  el("clicksDisplay").textContent = format(player.clicks);
  el("cpsDisplay").textContent = format(calcCPS());
  el("levelDisplay").textContent = player.level;
  el("xpDisplay").textContent = format(player.xp);
  el("xpToNextLevel").textContent = format(player.xpToNext);
  el("rebirthCount").textContent = player.rebirths;
  el("currentWorld").textContent = `${player.currentWorld} - ${getWorldName(player.currentWorld)}`;
  updateThemeToggle();
  updateUpgradesUI();
  updatePetsUI();
  updateMissionsUI();
  updateAchievementsUI();
  updateRankingUI();
  updateShopUI();
  updateSettingsUI();
}

// Alterar tema (claro/escuro)
function toggleTheme() {
  player.theme = player.theme === "light" ? "dark" : "light";
  document.body.classList.toggle("light-theme", player.theme === "light");
  updateThemeToggle();
  saveGame();
}

function updateThemeToggle() {
  const btn = el("toggleTheme");
  if (btn) btn.textContent = player.theme === "light" ? "🌙" : "☀️";
}

// Salvar estado do jogo no localStorage
function saveGame() {
  if (!player.settings.autoSave) return;
  localStorage.setItem("clickerSave", JSON.stringify(player));
}

// Carregar estado do jogo do localStorage
function loadGame() {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    const s = JSON.parse(save);
    Object.assign(player, s);
  }
}

// Cálculo do CPS
function calcCPS() {
  let total = 0;
  player.upgrades.forEach(u => total += u.cps * u.quantity);
  let mult = 1;
  if (player.activePetId) {
    const pet = player.pets.find(p => p.id === player.activePetId);
    if (pet) mult += pet.bonusPercent / 100;
  }
  const multItem = player.shopItems.find(i => i.owned && i.name.includes("x"));
  if (multItem) mult *= parseInt(multItem.name.replace("x", ""));
  return total * mult;
}

// Função para ganhar XP
function gainXP(amount) {
  player.xp += amount;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(player.xpToNext * 1.35);
    notify(`🎉 Level up! Agora você está no nível ${player.level}`);
  }
}

// Função para manipular clique do botão
function handleClick() {
  let gain = 1;
  if (player.activePetId) {
    const pet = player.pets.find(p => p.id === player.activePetId);
    if (pet) gain *= 1 + (pet.bonusPercent / 100);
  }
  player.clicks += gain;
  gainXP(5);
  updateDisplay();
  createClickParticle();
  playSound("click.mp3");
}

// Loop para CPS automático
setInterval(() => {
  const gain = calcCPS();
  player.clicks += gain;
  gainXP(gain);
  updateDisplay();
}, 1000);

// === Upgrades ===
const allUpgrades = [];
for(let i=1; i<=39; i++) {
  allUpgrades.push({ id: i, name: `Upgrade ${i}`, cost: 100 * i * i, cps: i * 2, quantity: 0 });
}

function buyUpgrade(id) {
  const upgrade = allUpgrades.find(u => u.id === id);
  if (!upgrade) return;
  if (player.clicks < upgrade.cost) {
    notify("Você não tem clicks suficientes!");
    return;
  }
  player.clicks -= upgrade.cost;
  upgrade.quantity++;
  upgrade.cost = Math.floor(upgrade.cost * 1.5);
  player.upgrades = allUpgrades;
  updateDisplay();
  notify(`Comprado: ${upgrade.name}`);
}

function updateUpgradesUI() {
  const container = el("upgrades");
  container.innerHTML = allUpgrades.map(upg => `
    <div class="upgrade">
      <strong>${upg.name}</strong><br/>
      Custo: ${format(upg.cost)} | CPS: ${upg.cps} | Quantidade: ${upg.quantity}<br/>
      <button onclick="buyUpgrade(${upg.id})">Comprar</button>
    </div>
  `).join("");
}

// === Pets ===
const petList = [];
for(let i=1; i<=29; i++) {
  petList.push({ id: i, name: `Pet ${i}`, bonusPercent: i });
}

function selectPet(id) {
  if (player.pets.find(p => p.id === id)) {
    player.activePetId = id;
    notify(`🐾 Pet selecionado: ${petList.find(p => p.id === id).name}`);
    updateDisplay();
  }
}

function buyPet(id) {
  const pet = petList.find(p => p.id === id);
  if (!pet) return;
  if (player.pets.find(p => p.id === id)) {
    notify("Você já possui esse pet!");
    return;
  }
  if (player.clicks < 2000) {
    notify("Clicks insuficientes para comprar o pet!");
    return;
  }
  player.clicks -= 2000;
  player.pets.push(pet);
  updateDisplay();
  notify(`Pet adotado: ${pet.name}`);
}

function updatePetsUI() {
  const container = el("pets");
  container.innerHTML = petList.map(pet => `
    <div class="pet ${player.activePetId === pet.id ? 'active' : ''}">
      <strong>${pet.name}</strong> (+${pet.bonusPercent}% CPS)
      <button onclick="${player.pets.find(p => p.id === pet.id) ? `selectPet(${pet.id})` : `buyPet(${pet.id})`}">
        ${player.pets.find(p => p.id === pet.id) ? 'Selecionar' : 'Comprar (2.000 clicks)'}
      </button>
    </div>
  `).join("");
}

// === Missões ===
const missions = [];
for(let i=1; i<=19; i++) {
  missions.push({ id: i, name: `Missão ${i}`, goal: i * 100, reward: i * 200, completed: false });
}

function updateMissionsUI() {
  const container = el("missions");
  container.innerHTML = missions.map(m => `
    <div class="mission ${m.completed ? 'done' : ''}">
      ${m.name} - ${m.completed ? '✅' : ''}
    </div>
  `).join("");
}

// Atualiza status de missão
function checkMissions() {
  missions.forEach(m => {
    if (!m.completed && player.clicks >= m.goal) {
      m.completed = true;
      player.clicks += m.reward;
      notify(`Missão concluída! Você ganhou ${format(m.reward)} clicks!`);
    }
  });
}

// === Conquistas ===
const achievements = [];
for(let i=1; i<=14; i++) {
  achievements.push({ id: i, name: `Conquista ${i}`, check: () => player.clicks >= i * 1000 });
}

function updateAchievementsUI() {
  const container = el("achievements");
  container.innerHTML = achievements.map(a => `
    <div class="achievement ${a.check() ? 'unlocked' : ''}">
      ${a.name} ${a.check() ? '🏆' : ''}
    </div>
  `).join("");
}

// === Loja ===
const shop = [
  { id: 1, name: "Multiplicador x2", cost: 1000, owned: false },
  { id: 2, name: "Multiplicador x5", cost: 5000, owned: false }
];

function buyShopItem(id) {
  const item = shop.find(i => i.id === id);
  if (!item) return;
  if (item.owned) {
    notify("Você já comprou este item!");
    return;
  }
  if (player.clicks < item.cost) {
    notify("Clicks insuficientes para comprar!");
    return;
  }
  player.clicks -= item.cost;
  item.owned = true;
  player.shopItems = shop;
  updateDisplay();
  notify(`Item comprado: ${item.name}`);
}

function updateShopUI() {
  const container = el("shop");
  container.innerHTML = shop.map(item => `
    <div class="shop-item">
      <strong>${item.name}</strong> - Custo: ${format(item.cost)}
      <button onclick="buyShopItem(${item.id})" ${item.owned ? "disabled" : ""}>${item.owned ? "Comprado" : "Comprar"}</button>
    </div>
  `).join("");
}

// === Ranking Firebase ===
function saveScore() {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) return alert("Nome inválido!");
  const userRef = push(ref(db, "ranking"));
  set(userRef, { name, score: Math.floor(player.clicks) });
  el("playerNameInput").value = "";
  notify("Score salvo no ranking!");
}

function loadRanking() {
  const list = el("rankingList");
  onValue(ref(db, "ranking"), snap => {
    const data = [];
    snap.forEach(child => data.push(child.val()));
    const sorted = data.sort((a,b) => b.score - a.score).slice(0, 10);
    list.innerHTML = sorted.map((e,i) => `<div>#${i+1} ${e.name}: ${format(e.score)}</div>`).join("");
  });
}

// === Eventos e Inicialização ===
window.onload = () => {
  loadGame();
  updateDisplay();
  loadRanking();
};

el("clickBtn").onclick = () => {
  handleClick();
  checkMissions();
};
el("toggleTheme").onclick = toggleTheme;
el("saveScoreBtn").onclick = saveScore;

// Expor funções para uso no HTML
window.buyUpgrade = buyUpgrade;
window.buyPet = buyPet;
window.selectPet = selectPet;
window.buyShopItem = buyShopItem;

// Clicker Simulator - Script.js lendário supremo - Parte 2/2
// Continuação da versão completa, funcionalidades extras, organização e melhorias

// === Sistema de rebirths (renascimento/prestígio) ===

function canRebirth() {
  return player.clicks >= 100000 * (player.rebirths + 1);
}

function doRebirth() {
  if (!canRebirth()) {
    notify("Você não atingiu clicks suficientes para renascer!");
    return;
  }
  player.rebirths++;
  player.prestige++;
  player.clicks = 0;
  player.level = 1;
  player.xp = 0;
  player.xpToNext = 100;
  player.upgrades.forEach(u => u.quantity = 0);
  player.shopItems.forEach(i => i.owned = false);
  player.pets = [];
  player.activePetId = null;
  player.currentWorld = 1;
  notify(`✨ Você renasceu! Total de renascimentos: ${player.rebirths}`);
  updateDisplay();
  saveGame();
}

el("rebirthBtn")?.addEventListener("click", doRebirth);

// === Sistema de múltiplos mundos ===

const worlds = [
  { id: 1, name: "Jardim Inicial", unlockClicks: 0 },
  { id: 2, name: "Cidade Neon", unlockClicks: 50000 },
  { id: 3, name: "Espaço", unlockClicks: 250000 },
  { id: 4, name: "Dimensão Sombria", unlockClicks: 1000000 },
  { id: 5, name: "Laboratório X", unlockClicks: 5000000 },
];

function canUnlockWorld(id) {
  const world = worlds.find(w => w.id === id);
  if (!world) return false;
  return player.clicks >= world.unlockClicks && !player.unlockedWorlds.includes(id);
}

function unlockWorld(id) {
  if (!canUnlockWorld(id)) {
    notify("Você ainda não pode desbloquear esse mundo.");
    return;
  }
  player.unlockedWorlds.push(id);
  notify(`🌍 Mundo desbloqueado: ${getWorldName(id)}`);
  updateDisplay();
  saveGame();
}

function changeWorld(id) {
  if (!player.unlockedWorlds.includes(id)) {
    notify("Você não desbloqueou esse mundo ainda!");
    return;
  }
  player.currentWorld = id;
  notify(`Você mudou para o mundo: ${getWorldName(id)}`);
  updateDisplay();
  saveGame();
}

function updateWorldsUI() {
  const container = el("worlds");
  if (!container) return;
  container.innerHTML = worlds.map(w => `
    <div class="world ${player.currentWorld === w.id ? 'active' : ''}">
      <strong>${w.name}</strong><br/>
      ${player.unlockedWorlds.includes(w.id) ? 
        `<button onclick="changeWorld(${w.id})" ${player.currentWorld === w.id ? 'disabled' : ''}>Entrar</button>` : 
        `Desbloqueie com ${format(w.unlockClicks)} clicks`}
    </div>
  `).join("");
}

// === Sistema de saves manuais e automáticos ===

function manualSave() {
  saveGame();
  notify("Jogo salvo manualmente.");
}
el("saveBtn")?.addEventListener("click", manualSave);

function manualLoad() {
  loadGame();
  updateDisplay();
  notify("Jogo carregado manualmente.");
}
el("loadBtn")?.addEventListener("click", manualLoad);

// === Sistema de sons e música ===

function toggleSounds() {
  player.soundsEnabled = !player.soundsEnabled;
  updateSettingsUI();
  notify(`Sons ${(player.soundsEnabled) ? 'ativados' : 'desativados'}`);
  saveGame();
}
el("toggleSoundsBtn")?.addEventListener("click", toggleSounds);

function toggleMusic() {
  player.settings.music = !player.settings.music;
  const music = el("bgMusic");
  if (music) {
    if (player.settings.music) {
      music.play();
    } else {
      music.pause();
    }
  }
  updateSettingsUI();
  notify(`Música ${(player.settings.music) ? 'ativada' : 'desativada'}`);
  saveGame();
}
el("toggleMusicBtn")?.addEventListener("click", toggleMusic);

// === Sistema de configurações ===

function updateSettingsUI() {
  const particlesBtn = el("toggleParticlesBtn");
  if (particlesBtn) particlesBtn.textContent = player.settings.particles ? "Partículas: ON" : "Partículas: OFF";

  const animationsBtn = el("toggleAnimationsBtn");
  if (animationsBtn) animationsBtn.textContent = player.settings.animations ? "Animações: ON" : "Animações: OFF";

  const soundsBtn = el("toggleSoundsBtn");
  if (soundsBtn) soundsBtn.textContent = player.soundsEnabled ? "Sons: ON" : "Sons: OFF";

  const musicBtn = el("toggleMusicBtn");
  if (musicBtn) musicBtn.textContent = player.settings.music ? "Música: ON" : "Música: OFF";

  const autoSaveBtn = el("toggleAutoSaveBtn");
  if (autoSaveBtn) autoSaveBtn.textContent = player.settings.autoSave ? "Auto Save: ON" : "Auto Save: OFF";
}

function toggleParticles() {
  player.settings.particles = !player.settings.particles;
  updateSettingsUI();
  saveGame();
  notify(`Partículas ${(player.settings.particles) ? 'ativadas' : 'desativadas'}`);
}
el("toggleParticlesBtn")?.addEventListener("click", toggleParticles);

function toggleAnimations() {
  player.settings.animations = !player.settings.animations;
  updateSettingsUI();
  saveGame();
  notify(`Animações ${(player.settings.animations) ? 'ativadas' : 'desativadas'}`);
}
el("toggleAnimationsBtn")?.addEventListener("click", toggleAnimations);

function toggleAutoSave() {
  player.settings.autoSave = !player.settings.autoSave;
  updateSettingsUI();
  notify(`Auto Save ${(player.settings.autoSave) ? 'ativado' : 'desativado'}`);
  if (player.settings.autoSave) saveGame();
}
el("toggleAutoSaveBtn")?.addEventListener("click", toggleAutoSave);

// === Sistema de feedback visual ===

function addClickEffect() {
  if (!player.settings.animations) return;
  const effect = document.createElement("div");
  effect.className = "click-effect";
  effect.style.left = (Math.random() * 80 + 10) + "%";
  effect.style.top = (Math.random() * 80 + 10) + "%";
  document.body.appendChild(effect);
  setTimeout(() => effect.remove(), 1200);
}

// === Sistema de notificações aprimorado ===

const notificationContainer = (() => {
  let container = el("notificationContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "notificationContainer";
    document.body.appendChild(container);
  }
  return container;
})();

function notify(text, duration = 3500) {
  const n = document.createElement("div");
  n.className = "notification";
  n.textContent = text;
  notificationContainer.appendChild(n);
  setTimeout(() => n.remove(), duration);
}

// === Sistema de conquistas avançado ===

class Achievement {
  constructor(id, name, description, checkFunc, rewardFunc) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.unlocked = false;
    this.checkFunc = checkFunc;
    this.rewardFunc = rewardFunc;
  }

  check() {
    if (!this.unlocked && this.checkFunc()) {
      this.unlocked = true;
      this.rewardFunc();
      notify(`🏆 Conquista desbloqueada: ${this.name}`);
      updateAchievementsUI();
      saveGame();
    }
  }
}

const achievementsList = [
  new Achievement(
    1,
    "Primeiros passos",
    "Clique 100 vezes",
    () => player.clicks >= 100,
    () => player.clicks += 50
  ),
  new Achievement(
    2,
    "Caçador de upgrades",
    "Compre 10 upgrades",
    () => player.upgrades.reduce((sum, u) => sum + u.quantity, 0) >= 10,
    () => gainXP(500)
  ),
  new Achievement(
    3,
    "Amigo dos pets",
    "Adote 3 pets",
    () => player.pets.length >= 3,
    () => player.clicks += 1000
  ),
  // Adicione mais conquistas aqui...
];

function checkAchievements() {
  achievementsList.forEach(a => a.check());
}

function updateAchievementsUI() {
  const container = el("achievements");
  container.innerHTML = achievementsList.map(a => `
    <div class="achievement ${a.unlocked ? "unlocked" : ""}">
      <strong>${a.name}</strong> - ${a.description} ${a.unlocked ? "✅" : ""}
    </div>
  `).join("");
}

// === Função para atualizar ranking com debounce ===

let rankingTimeout;
function updateRankingUI() {
  clearTimeout(rankingTimeout);
  rankingTimeout = setTimeout(() => {
    const list = el("rankingList");
    if (!list) return;
    onValue(ref(db, "ranking"), snap => {
      const data = [];
      snap.forEach(child => data.push(child.val()));
      const sorted = data.sort((a, b) => b.score - a.score).slice(0, 10);
      list.innerHTML = sorted.map((e, i) => `<div>#${i + 1} ${e.name}: ${format(e.score)}</div>`).join("");
    });
  }, 1000);
}

// === Eventos periódicos ===

setInterval(() => {
  checkMissions();
  checkAchievements();
  saveGame();
}, 5000);

// === Salvamento antes de fechar ===

window.addEventListener("beforeunload", () => {
  if (player.settings.autoSave) saveGame();
});

// === Exposição global para botão HTML ===

window.buyUpgrade = buyUpgrade;
window.buyPet = buyPet;
window.selectPet = selectPet;
window.buyShopItem = buyShopItem;
window.changeWorld = changeWorld;
window.unlockWorld = unlockWorld;
window.doRebirth = doRebirth;

// === Inicialização ===

window.onload = () => {
  loadGame();
  updateDisplay();
  updateWorldsUI();
  updateSettingsUI();
  loadRanking();
  notify("Bem-vindo ao Clicker Simulator Supremos!");
};



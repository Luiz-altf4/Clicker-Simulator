import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const el = id => document.getElementById(id);

// Estado do jogo - inicializado com exemplos para testes
let clicks = 0;
let level = 1;
let xp = 0;
let xpToNext = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;

let upgrades = [
  { id: 1, name: "Upgrade 1", cps: 1, quantity: 0, cost: 10 },
  { id: 2, name: "Upgrade 2", cps: 5, quantity: 0, cost: 50 }
];

let shopItems = [
  { id: 1, name: "Multiplicador x2", owned: false, cost: 500 },
  { id: 2, name: "Multiplicador x5", owned: false, cost: 2000 }
];

let pets = [
  { id: 1, name: "Pet 1", bonusPercent: 10, owned: false },
  { id: 2, name: "Pet 2", bonusPercent: 25, owned: false }
];

let achievements = [
  { id: 1, name: "First Click", unlocked: false, requirement: () => clicks >= 1 }
];

let missions = [
  { id: 1, name: "Clique 100 vezes", completed: false, requirement: () => clicks >= 100 }
];

let activePetId = null;

let cpsIntervalId = null;

// === Função para formatar números com unidades ===
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

function getWorldName() {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão"];
  return worlds[currentWorld - 1] || "???";
}

// === Atualiza os valores na tela ===
function display() {
  el("clicksDisplay").textContent = format(clicks);
  el("cpsDisplay").textContent = format(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = format(xp);
  el("xpToNextLevel").textContent = format(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;

  // Atualizar listas dinâmicas
  updateUpgradesUI();
  updateShopUI();
  updatePetsUI();
  updateMissionsUI();
  updateAchievementsUI();
}

// === Cálculo do CPS ===
function calcCPS() {
  let base = 0;
  upgrades.forEach(u => {
    base += (u.cps || 0) * (u.quantity || 0);
  });
  let mult = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) mult += (pet.bonusPercent || 0) / 100;
  }
  const hasX5 = shopItems.find(i => i.name.includes("x5") && i.owned);
  const hasX2 = shopItems.find(i => i.name.includes("x2") && i.owned);
  if (hasX5) mult *= 5;
  else if (hasX2) mult *= 2;
  return base * mult;
}

// === Ganhar XP e subir níveis ===
function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.3);
  }
}

// === Salvar jogo com debounce ===
let saveTimeout = null;
function saveGame() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const saveData = {
        clicks, level, xp, xpToNext, rebirths, currentWorld, buyAmount,
        upgrades, shopItems, pets, achievements, missions, activePetId
      };
      localStorage.setItem("clickerSave", JSON.stringify(saveData));
      //console.log("Jogo salvo");
    } catch (e) {
      console.error("Erro ao salvar o jogo:", e);
    }
  }, 500);
}

// === Carregar jogo do localStorage ===
function loadGame() {
  try {
    const save = localStorage.getItem("clickerSave");
    if (!save) return;
    const data = JSON.parse(save);
    clicks = data.clicks ?? 0;
    level = data.level ?? 1;
    xp = data.xp ?? 0;
    xpToNext = data.xpToNext ?? 100;
    rebirths = data.rebirths ?? 0;
    currentWorld = data.currentWorld ?? 1;
    buyAmount = data.buyAmount ?? 1;
    upgrades = Array.isArray(data.upgrades) ? data.upgrades : upgrades;
    shopItems = Array.isArray(data.shopItems) ? data.shopItems : shopItems;
    pets = Array.isArray(data.pets) ? data.pets : pets;
    achievements = Array.isArray(data.achievements) ? data.achievements : achievements;
    missions = Array.isArray(data.missions) ? data.missions : missions;
    activePetId = data.activePetId ?? activePetId;
  } catch (e) {
    console.error("Erro ao carregar jogo:", e);
  }
}

// === Animação do botão clique ===
function animateClickBtn() {
  const btn = el("clickBtn");
  btn.classList.add("clicked");
  setTimeout(() => btn.classList.remove("clicked"), 150);
}

// === Eventos ===

// Clique principal
el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= 1 + (pet.bonusPercent || 0) / 100;
  }
  clicks += gain;
  gainXP(5);
  display();
  saveGame();
  animateClickBtn();
};

// CPS automático
let cpsIntervalId = null;
function startCPSInterval() {
  if (cpsIntervalId) clearInterval(cpsIntervalId);
  cpsIntervalId = setInterval(() => {
    const gain = calcCPS();
    clicks += gain;
    gainXP(gain);
    display();
    saveGame();
  }, 1000);
}

// Toggle tema claro/escuro
function updateThemeIcon() {
  const toggleBtn = el("toggleTheme");
  if (document.body.classList.contains("light-theme")) {
    toggleBtn.textContent = "☀️";
    toggleBtn.title = "Modo claro";
  } else {
    toggleBtn.textContent = "🌙";
    toggleBtn.title = "Modo escuro";
  }
}

el("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  updateThemeIcon();
  saveGame();
};

// --- Firebase: salvar score ---
let saveBtnLocked = false;
async function saveScore() {
  if (saveBtnLocked) return;
  const nameInput = el("playerNameInput");
  const saveBtn = el("saveScoreBtn");
  const name = nameInput.value.trim();

  if (!name || name.length < 3) {
    alert("Nome inválido! Use pelo menos 3 caracteres.");
    return;
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
    alert("Nome deve conter apenas letras, números e espaços.");
    return;
  }

  saveBtnLocked = true;
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    const userRef = push(ref(db, "ranking"));
    await set(userRef, { name, score: Math.floor(clicks) });
    nameInput.value = "";
    alert("Score salvo com sucesso!");
    await loadRanking();
  } catch (e) {
    console.error("Erro ao salvar score:", e);
    alert("Erro ao salvar score. Tente novamente.");
  } finally {
    saveBtnLocked = false;
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar Score";
  }
}

// --- Firebase: carregar ranking ---
async function loadRanking() {
  const list = el("rankingList");
  list.textContent = "Carregando ranking...";

  try {
    const snapshot = await get(ref(db, "ranking"));
    if (!snapshot.exists()) {
      list.textContent = "Nenhum score salvo ainda.";
      return;
    }
    const data = [];
    snapshot.forEach(child => data.push(child.val()));
    const sorted = data.sort((a, b) => b.score - a.score).slice(0, 10);
    list.innerHTML = sorted.map((e, i) => `<div>#${i + 1} ${e.name}: ${format(e.score)}</div>`).join("");
  } catch (e) {
    console.error("Erro ao carregar ranking:", e);
    list.textContent = "Erro ao carregar ranking.";
  }
}

// === Atualiza a UI das upgrades
function updateUpgradesUI() {
  const container = el("upgrades");
  if (!container) return;
  let html = "";
  upgrades.forEach(u => {
    html += `
      <div class="upgrade-item">
        <strong>${u.name}</strong> (CPS: ${u.cps}) - Qtd: ${u.quantity} - Custo: ${format(u.cost)}
        <button onclick="buyUpgrade(${u.id})">Comprar</button>
      </div>`;
  });
  container.innerHTML = html;
}

// === Atualiza a UI da loja
function updateShopUI() {
  const container = el("shop");
  if (!container) return;
  let html = "";
  shopItems.forEach(item => {
    html += `
      <div class="shop-item">
        <strong>${item.name}</strong> - ${item.owned ? "Comprado" : `Custo: ${format(item.cost)}`}
        <button onclick="buyShopItem(${item.id})" ${item.owned ? "disabled" : ""}>
          ${item.owned ? "Comprado" : "Comprar"}
        </button>
      </div>`;
  });
  container.innerHTML = html;
}

// === Atualiza UI dos pets
function updatePetsUI() {
  const container = el("pets");
  if (!container) return;
  let html = "";
  pets.forEach(p => {
    html += `
      <div class="pet-item">
        <strong>${p.name}</strong> - Bônus: ${p.bonusPercent}%
        <button onclick="togglePet(${p.id})">${p.owned ? (activePetId === p.id ? "Ativo" : "Ativar") : "Comprar"}</button>
      </div>`;
  });
  container.innerHTML = html;
}

// === Atualiza UI das missões
function updateMissionsUI() {
  const container = el("missions");
  if (!container) return;
  let html = "";
  missions.forEach(m => {
    const status = m.completed ? "Concluída" : "Em progresso";
    html += `<div class="mission-item"><strong>${m.name}</strong> - ${status}</div>`;
  });
  container.innerHTML = html;
}

// === Atualiza UI das conquistas
function updateAchievementsUI() {
  const container = el("achievements");
  if (!container) return;
  let html = "";
  achievements.forEach(a => {
    const status = a.unlocked ? "Desbloqueada" : "Trancada";
    html += `<div class="achievement-item"><strong>${a.name}</strong> - ${status}</div>`;
  });
  container.innerHTML = html;
}

// Funções globais para comprar/upgrades (necessárias para os botões inline)
window.buyUpgrade = function(id) {
  const upgrade = upgrades.find(u => u.id === id);
  if (!upgrade) return alert("Upgrade não encontrado!");
  if (clicks < upgrade.cost) return alert("Clicks insuficientes!");
  clicks -= upgrade.cost;
  upgrade.quantity++;
  upgrade.cost = Math.floor(upgrade.cost * 1.3);
  display();
  saveGame();
};

window.buyShopItem = function(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item) return alert("Item da loja não encontrado!");
  if (item.owned) return alert("Você já possui este item!");
  if (clicks < item.cost) return alert("Clicks insuficientes!");
  clicks -= item.cost;
  item.owned = true;
  display();
  saveGame();
};

window.togglePet = function(id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return alert("Pet não encontrado!");
  if (!pet.owned) {
    if (clicks < 100) return alert("Clicks insuficientes para comprar o pet! (Custo fixo 100)");
    clicks -= 100;
    pet.owned = true;
    activePetId = id;
  } else {
    activePetId = (activePetId === id) ? null : id;
  }
  display();
  saveGame();
};

// Atualiza status de conquistas e missões
function updateGameProgress() {
  achievements.forEach(a => {
    if (!a.unlocked && a.requirement && a.requirement()) a.unlocked = true;
  });
  missions.forEach(m => {
    if (!m.completed && m.requirement && m.requirement()) m.completed = true;
  });
}

// Loop para atualizar progresso de conquistas e missões a cada segundo
setInterval(() => {
  updateGameProgress();
  display();
}, 1000);

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadGame();
  display();
  loadRanking();
  startCPSInterval();
  updateThemeIcon();
  el("saveScoreBtn").addEventListener("click", saveScore);
});

// Salvar antes de sair
window.addEventListener("beforeunload", () => {
  saveGame();
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Configuração Firebase
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

// Estado do jogo
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNext = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;

const upgrades = [
  { id: 1, name: "Clicker Básico", cps: 0.5, quantity: 0, basePrice: 15 },
  { id: 2, name: "Clicker Avançado", cps: 2, quantity: 0, basePrice: 100 },
  { id: 3, name: "Clicker Supremo", cps: 10, quantity: 0, basePrice: 500 }
];

const shopItems = [
  { id: 1, name: "Multiplicador x2", owned: false, price: 1000 },
  { id: 2, name: "Multiplicador x5", owned: false, price: 5000 }
];

const pets = [
  { id: 1, name: "Pet Mágico", bonusPercent: 10, owned: false },
  { id: 2, name: "Dragão", bonusPercent: 25, owned: false }
];

const achievements = [
  { id: 1, name: "Primeiro Click", description: "Clique uma vez", unlocked: false },
  { id: 2, name: "100 Clicks", description: "Alcance 100 clicks", unlocked: false }
];

const missions = [
  { id: 1, name: "Missão Inicial", description: "Clique 50 vezes", completed: false }
];

let activePetId = null;

// DOM helpers
const el = id => document.getElementById(id);

function format(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while(n >= 1000 && i < units.length-1) { n /= 1000; i++; }
  return n.toFixed(2)+units[i];
}

function getWorldName() {
  const worlds = ["Jardim Inicial","Cidade Neon","Espaço","Dimensão"];
  return worlds[currentWorld-1] || "???";
}

function calcCPS() {
  let base = 0;
  upgrades.forEach(u => base += u.cps * u.quantity);
  let mult = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) mult += pet.bonusPercent / 100;
  }
  if (shopItems.find(i => i.name.includes("x5") && i.owned)) mult *= 5;
  else if (shopItems.find(i => i.name.includes("x2") && i.owned)) mult *= 2;
  return base * mult;
}

function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.3);
  }
}

function display() {
  el("clicksDisplay").textContent = format(clicks);
  el("cpsDisplay").textContent = format(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = format(xp);
  el("xpToNextLevel").textContent = format(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;

  renderUpgrades();
  renderShop();
  renderPets();
  renderMissions();
  renderAchievements();
}

function renderUpgrades() {
  const container = el("upgradesList");
  container.innerHTML = "";
  upgrades.forEach(u => {
    const li = document.createElement("li");
    li.className = "upgrade-item";
    li.innerHTML = `
      <div>
        <strong>${u.name}</strong><br>
        Quantidade: ${u.quantity}<br>
        CPS: ${u.cps} cada<br>
        Preço: ${format(getUpgradePrice(u))} clicks
      </div>
      <button aria-label="Comprar ${u.name}" class="btn-buy" data-id="${u.id}">Comprar</button>
    `;
    container.appendChild(li);
  });
  // Adiciona eventos
  container.querySelectorAll(".btn-buy").forEach(btn => {
    btn.onclick = () => buyUpgrade(parseInt(btn.dataset.id));
  });
}

function getUpgradePrice(upgrade) {
  return Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity));
}

function buyUpgrade(id) {
  const upg = upgrades.find(u => u.id === id);
  if (!upg) return;
  const price = getUpgradePrice(upg);
  if (clicks >= price) {
    clicks -= price;
    upg.quantity++;
    cps = calcCPS();
    gainXP(price / 2);
    display();
  } else {
    alert("Clique insuficiente para comprar upgrade!");
  }
}

function renderShop() {
  const container = el("shopList");
  container.innerHTML = "";
  shopItems.forEach(item => {
    const li = document.createElement("li");
    li.className = "shop-item";
    li.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        Preço: ${format(item.price)} clicks<br>
        Status: ${item.owned ? "Comprado" : "Disponível"}
      </div>
      <button aria-label="Comprar ${item.name}" class="btn-buy" data-id="${item.id}" ${item.owned ? "disabled" : ""}>Comprar</button>
    `;
    container.appendChild(li);
  });
  container.querySelectorAll(".btn-buy").forEach(btn => {
    btn.onclick = () => buyShopItem(parseInt(btn.dataset.id));
  });
}

function buyShopItem(id) {
  const item = shopItems.find(i => i.id === id);
  if (!item || item.owned) return;
  if (clicks >= item.price) {
    clicks -= item.price;
    item.owned = true;
    cps = calcCPS();
    display();
  } else {
    alert("Clique insuficiente para comprar item da loja!");
  }
}

function renderPets() {
  const container = el("petsList");
  container.innerHTML = "";
  pets.forEach(pet => {
    const li = document.createElement("li");
    li.className = "pet-item";
    li.innerHTML = `
      <div>
        <strong>${pet.name}</strong><br>
        Bônus: +${pet.bonusPercent}% CPS<br>
        Status: ${pet.owned ? "Comprado" : "Disponível"}
      </div>
      <button aria-label="Comprar ou ativar pet ${pet.name}" class="btn-buy" data-id="${pet.id}">
        ${pet.owned ? (activePetId === pet.id ? "Ativo" : "Ativar") : "Comprar"}
      </button>
    `;
    container.appendChild(li);
  });
  container.querySelectorAll(".btn-buy").forEach(btn => {
    btn.onclick = () => togglePet(parseInt(btn.dataset.id));
  });
}

function togglePet(id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return;
  if (!pet.owned) {
    if (clicks >= 1000) { // preço fixo para pets por exemplo
      clicks -= 1000;
      pet.owned = true;
      activePetId = id;
    } else {
      alert("Clique insuficiente para comprar pet!");
      return;
    }
  } else {
    if (activePetId === id) {
      activePetId = null;
    } else {
      activePetId = id;
    }
  }
  cps = calcCPS();
  display();
}

function renderMissions() {
  const container = el("missionsList");
  container.innerHTML = "";
  missions.forEach(m => {
    const li = document.createElement("li");
    li.className = "mission-item";
    li.textContent = `${m.name} - ${m.description} [${m.completed ? "Completa" : "Incompleta"}]`;
    container.appendChild(li);
  });
}

function renderAchievements() {
  const container = el("achievementsList");
  container.innerHTML = "";
  achievements.forEach(a => {
    const li = document.createElement("li");
    li.className = "achievement-item";
    li.textContent = `${a.name} - ${a.description} ${a.unlocked ? "✔️" : ""}`;
    container.appendChild(li);
  });
}

// Atualiza ranking online
function loadRanking() {
  const list = el("rankingList");
  onValue(ref(db, "ranking"), snap => {
    const data = [];
    snap.forEach(child => data.push(child.val()));
    const sorted = data.sort((a,b) => b.score - a.score).slice(0, 10);
    list.innerHTML = sorted.map((e,i) => `<div>#${i+1} ${e.name}: ${format(e.score)}</div>`).join("");
  });
}

el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  clicks += gain;
  gainXP(5);
  display();
};

setInterval(() => {
  const gain = calcCPS();
  clicks += gain;
  gainXP(gain);
  display();
}, 1000);

el("saveScoreBtn").onclick = () => {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) {
    alert("Nome inválido! Use pelo menos 3 caracteres.");
    return;
  }
  const userRef = push(ref(db, "ranking"));
  set(userRef, { name, score: Math.floor(clicks) });
  el("playerNameInput").value = "";
};

el("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  el("toggleTheme").textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
};

el("resetBtn").onclick = () => {
  if (confirm("Tem certeza que deseja resetar todo o progresso?")) {
    clicks = 0;
    cps = 0;
    level = 1;
    xp = 0;
    xpToNext = 100;
    rebirths = 0;
    currentWorld = 1;
    activePetId = null;
    upgrades.forEach(u => u.quantity = 0);
    shopItems.forEach(i => i.owned = false);
    pets.forEach(p => p.owned = false);
    display();
    localStorage.removeItem("clickerSave");
  }
};

window.addEventListener("beforeunload", () => {
  localStorage.setItem("clickerSave", JSON.stringify({
    clicks, level, xp, xpToNext, rebirths, currentWorld,
    upgrades: upgrades.map(u => u.quantity),
    shopItems: shopItems.map(i => i.owned),
    pets: pets.map(p => p.owned),
    activePetId
  }));
});

window.addEventListener("load", () => {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    try {
      const s = JSON.parse(save);
      clicks = s.clicks ?? 0;
      level = s.level ?? 1;
      xp = s.xp ?? 0;
      xpToNext = s.xpToNext ?? 100;
      rebirths = s.rebirths ?? 0;
      currentWorld = s.currentWorld ?? 1;
      activePetId = s.activePetId ?? null;

      if (Array.isArray(s.upgrades)) {
        s.upgrades.forEach((q, i) => {
          if (upgrades[i]) upgrades[i].quantity = q;
        });
      }
      if (Array.isArray(s.shopItems)) {
        s.shopItems.forEach((owned, i) => {
          if (shopItems[i]) shopItems[i].owned = owned;
        });
      }
      if (Array.isArray(s.pets)) {
        s.pets.forEach((owned, i) => {
          if (pets[i]) pets[i].owned = owned;
        });
      }
    } catch(e) {
      console.error("Erro ao carregar save:", e);
    }
  }
  display();
  loadRanking();
});

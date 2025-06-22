// === Firebase Config ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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
let clicks = 0,
  cps = 0,
  level = 1,
  xp = 0,
  xpToNext = 100,
  rebirths = 0,
  currentWorld = 1,
  buyAmount = 1,
  activePetId = null;

// === Itens do jogo (completos) ===
let upgrades = [
  { id: 1, name: "Cursor", cps: 1, quantity: 0, price: 10 },
  { id: 2, name: "Auto Clicker", cps: 5, quantity: 0, price: 100 },
  { id: 3, name: "Grandma", cps: 10, quantity: 0, price: 500 },
  { id: 4, name: "Farm", cps: 50, quantity: 0, price: 2500 },
  { id: 5, name: "Mine", cps: 100, quantity: 0, price: 10000 },
];

let shopItems = [
  { id: 1, name: "x2 Multiplier", owned: false, price: 1000 },
  { id: 2, name: "x5 Multiplier", owned: false, price: 5000 },
];

let pets = [
  { id: 1, name: "Doggo", bonusPercent: 10, price: 1000, owned: false },
  { id: 2, name: "Catto", bonusPercent: 25, price: 5000, owned: false },
  { id: 3, name: "Dragon", bonusPercent: 50, price: 25000, owned: false },
];

let achievements = [
  { id: 1, name: "First Click", condition: () => clicks >= 1, unlocked: false, rewardXP: 10 },
  { id: 2, name: "Click Master", condition: () => clicks >= 10000, unlocked: false, rewardXP: 100 },
  { id: 3, name: "Level Up", condition: () => level >= 10, unlocked: false, rewardXP: 50 },
];

let missions = [
  { id: 1, description: "Click 100 times", target: 100, progress: 0, completed: false, rewardClicks: 500 },
  { id: 2, description: "Reach level 5", target: 5, progress: level, completed: false, rewardClicks: 1000 },
];

// === DOM Elements ===
const el = id => document.getElementById(id);

const display = () => {
  el("clicksDisplay").textContent = format(clicks);
  el("cpsDisplay").textContent = format(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = format(xp);
  el("xpToNextLevel").textContent = format(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;

  // Atualiza upgrades na loja
  const upgradesDiv = el("upgrades");
  upgradesDiv.innerHTML = upgrades.map(u => `
    <div>
      <b>${u.name}</b> - CPS: ${u.cps} - Qtd: ${u.quantity} - Preço: ${format(u.price)} 
      <button onclick="buyUpgrade(${u.id})">Comprar</button>
    </div>
  `).join("");

  // Atualiza shopItems
  const shopDiv = el("shop");
  shopDiv.innerHTML = shopItems.map(i => `
    <div>
      <b>${i.name}</b> - ${i.owned ? "Comprado" : `Preço: ${format(i.price)}`}
      ${i.owned ? "" : `<button onclick="buyShopItem(${i.id})">Comprar</button>`}
    </div>
  `).join("");

  // Atualiza pets
  const petsDiv = el("pets");
  petsDiv.innerHTML = pets.map(p => `
    <div>
      <b>${p.name}</b> - Bônus: +${p.bonusPercent}% - ${p.owned ? "Possuído" : `Preço: ${format(p.price)}`}
      ${p.owned ? `<button onclick="equipPet(${p.id})" ${activePetId === p.id ? "disabled" : ""}>${activePetId === p.id ? "Equipado" : "Equipar"}</button>` : `<button onclick="buyPet(${p.id})">Comprar</button>`}
    </div>
  `).join("");

  // Atualiza conquistas
  const achievementsDiv = el("achievements");
  achievementsDiv.innerHTML = achievements.map(a => `
    <div style="color:${a.unlocked ? 'green' : 'gray'}">${a.name}</div>
  `).join("");

  // Atualiza missões
  const missionsDiv = el("missions");
  missionsDiv.innerHTML = missions.map(m => `
    <div style="color:${m.completed ? 'green' : 'black'}">
      ${m.description} - ${m.completed ? "Completada" : `${format(m.progress)} / ${format(m.target)}`}
    </div>
  `).join("");
};

// === Utilidades ===
function format(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while(n >= 1000 && i < units.length-1) { n /= 1000; i++; }
  return n.toFixed(2)+units[i];
}
function getWorldName() {
  const w = ["Jardim Inicial","Cidade Neon","Espaço","Dimensão"];
  return w[currentWorld-1] || "???";
}

// === Clicks ===
el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if(pet) gain *= 1 + pet.bonusPercent / 100;
  }
  clicks += gain;
  gainXP(5);
  updateMissions(1);
  checkAchievements();
  display();
};

// === Compra de upgrades ===
window.buyUpgrade = function(id) {
  const u = upgrades.find(x => x.id === id);
  if(!u) return;
  if(clicks >= u.price){
    clicks -= u.price;
    u.quantity++;
    u.price = Math.floor(u.price * 1.15);
    display();
  } else {
    alert("Você não tem clicks suficientes para comprar esse upgrade.");
  }
};

// === Compra de itens da loja ===
window.buyShopItem = function(id) {
  const item = shopItems.find(x => x.id === id);
  if(!item) return;
  if(item.owned){
    alert("Item já comprado.");
    return;
  }
  if(clicks >= item.price){
    clicks -= item.price;
    item.owned = true;
    display();
  } else {
    alert("Você não tem clicks suficientes para comprar esse item.");
  }
};

// === Compra de pets ===
window.buyPet = function(id) {
  const pet = pets.find(p => p.id === id);
  if(!pet) return;
  if(pet.owned){
    alert("Você já possui esse pet.");
    return;
  }
  if(clicks >= pet.price){
    clicks -= pet.price;
    pet.owned = true;
    activePetId = pet.id; // Equipa automaticamente ao comprar
    display();
  } else {
    alert("Você não tem clicks suficientes para comprar esse pet.");
  }
};

// === Equipar pet ===
window.equipPet = function(id) {
  if(activePetId === id) return;
  activePetId = id;
  display();
};

// === CPS Auto ===
setInterval(() => {
  const gain = calcCPS();
  clicks += gain;
  gainXP(gain);
  updateMissions(gain);
  checkAchievements();
  display();
}, 1000);

function calcCPS() {
  let base = 0;
  upgrades.forEach(u => base += u.cps * u.quantity);
  let mult = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if(pet) mult += pet.bonusPercent / 100;
  }
  if (shopItems.find(i => i.name.includes("x5 Multiplier"))?.owned) mult *= 5;
  else if (shopItems.find(i => i.name.includes("x2 Multiplier"))?.owned) mult *= 2;
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

// === Verifica conquistas ===
function checkAchievements() {
  achievements.forEach(a => {
    if (!a.unlocked && a.condition()) {
      a.unlocked = true;
      alert(`Conquista desbloqueada: ${a.name} +${a.rewardXP} XP!`);
      xp += a.rewardXP;
    }
  });
}

// === Atualiza missões ===
function updateMissions(amount) {
  missions.forEach(m => {
    if (!m.completed) {
      if (m.id === 1) m.progress += amount;           // Para clicks
      if (m.id === 2) m.progress = level;             // Para level
      if (m.progress >= m.target) {
        m.completed = true;
        clicks += m.rewardClicks;
        alert(`Missão completada: ${m.description} +${format(m.rewardClicks)} clicks!`);
      }
    }
  });
}

// === Firebase Ranking ===
el("saveScoreBtn").onclick = () => {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) return alert("Nome inválido!");
  const userRef = push(ref(db, "ranking"));
  set(userRef, { name, score: Math.floor(clicks) });
  el("playerNameInput").value = "";
};

function loadRanking() {
  const list = el("rankingList");
  onValue(ref(db, "ranking"), snap => {
    const data = [];
    snap.forEach(child => data.push(child.val()));
    const sorted = data.sort((a,b) => b.score - a.score).slice(0, 10);
    list.innerHTML = sorted.map((e,i) => `<div>#${i+1} ${e.name}: ${format(e.score)}</div>`).join("");
  });
}

// === Outros (tema, salvar, carregar) ===
el("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  el("toggleTheme").textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
};

// Salvamento completo
window.addEventListener("beforeunload", () => {
  localStorage.setItem("clickerSave", JSON.stringify({
    clicks, level, xp, xpToNext, rebirths, currentWorld, activePetId,
    upgrades, shopItems, pets, achievements, missions
  }));
});

// Carregamento do jogo
window.addEventListener("load", () => {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    const s = JSON.parse(save);
    clicks = s.clicks ?? clicks;
    level = s.level ?? level;
    xp = s.xp ?? xp;
    xpToNext = s.xpToNext ?? xpToNext;
    rebirths = s.rebirths ?? rebirths;
    currentWorld = s.currentWorld ?? currentWorld;
    activePetId = s.activePetId ?? activePetId;

    // Para listas, precaução: se existir no save, atualiza, senão mantém as originais
    upgrades = s.upgrades?.length ? s.upgrades : upgrades;
    shopItems = s.shopItems?.length ? s.shopItems : shopItems;
    pets = s.pets?.length ? s.pets : pets;
    achievements = s.achievements?.length ? s.achievements : achievements;
    missions = s.missions?.length ? s.missions : missions;
  }
  display();
  loadRanking();
});

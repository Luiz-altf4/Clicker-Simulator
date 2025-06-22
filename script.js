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
let clicks = 0, level = 1, xp = 0, xpToNext = 100, rebirths = 0, currentWorld = 1, buyAmount = 1;
let upgrades = [
  { id: 1, name: "Cursor", cps: 1, price: 50, quantity: 0 },
  { id: 2, name: "Mouse", cps: 5, price: 200, quantity: 0 },
  { id: 3, name: "Teclado", cps: 20, price: 800, quantity: 0 },
  { id: 4, name: "Monitor", cps: 50, price: 2000, quantity: 0 }
];
let shopItems = [
  { id: 1, name: "x2 Multiplier", price: 5000, owned: false },
  { id: 2, name: "x5 Multiplier", price: 15000, owned: false }
];
let pets = [
  { id: 1, name: "Dog", bonusPercent: 10 },
  { id: 2, name: "Cat", bonusPercent: 20 },
  { id: 3, name: "Dragon", bonusPercent: 50 }
];
let achievements = [
  { id: 1, name: "Primeiro Click", achieved: false, condition: () => clicks >= 1 },
  { id: 2, name: "100 Clicks", achieved: false, condition: () => clicks >= 100 },
  { id: 3, name: "Level 10", achieved: false, condition: () => level >= 10 }
];
let missions = [
  { id: 1, description: "Clique 50 vezes", completed: false, progress: 0, goal: 50 },
  { id: 2, description: "Alcance o nível 5", completed: false, progress: 0, goal: 5 }
];
let activePetId = null;

// === DOM Elements ===
const el = id => document.getElementById(id);

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

// === Display ===
function display() {
  el("clicksDisplay").textContent = format(clicks);
  el("cpsDisplay").textContent = format(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = format(xp);
  el("xpToNextLevel").textContent = format(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;

  displayUpgrades();
  displayShop();
  displayPets();
  displayAchievements();
  displayMissions();
  updateSaveButtonState();
}

// === Click ===
el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  clicks += gain;
  gainXP(5);
  updateMissionsOnClick();
  checkAchievements();
  display();
};

// === Auto Clicks (CPS) ===
setInterval(() => {
  const gain = calcCPS();
  clicks += gain;
  gainXP(gain);
  updateMissionsOnClick();
  checkAchievements();
  display();
}, 1000);

function calcCPS() {
  let base = 0;
  upgrades.forEach(u => base += u.cps * u.quantity);
  let mult = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) mult += pet.bonusPercent / 100;
  }
  if (shopItems.find(i => i.name.includes("x5"))?.owned) mult *= 5;
  else if (shopItems.find(i => i.name.includes("x2"))?.owned) mult *= 2;
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

function updateMissionsOnClick() {
  missions.forEach(m => {
    if (!m.completed) {
      if (m.id === 1) { // Clique 50 vezes
        m.progress++;
        if (m.progress >= m.goal) m.completed = true;
      }
      if (m.id === 2 && level >= m.goal) { // Alcance nível 5
        m.completed = true;
      }
    }
  });
}

function checkAchievements() {
  achievements.forEach(a => {
    if (!a.achieved && a.condition()) a.achieved = true;
  });
}

// === Display funções ===
function displayUpgrades() {
  const container = el("upgrades");
  container.innerHTML = "";
  upgrades.forEach(u => {
    const btn = document.createElement("button");
    btn.textContent = `Comprar ${u.name} (${format(u.price)} clicks) [${u.quantity}]`;
    btn.disabled = clicks < u.price;
    btn.onclick = () => {
      if (clicks >= u.price) {
        clicks -= u.price;
        u.quantity++;
        u.price = Math.floor(u.price * 1.15);
        display();
      }
    };
    const div = document.createElement("div");
    div.className = "upgrade-item";
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function displayShop() {
  const container = el("shop");
  container.innerHTML = "";
  shopItems.forEach(i => {
    const btn = document.createElement("button");
    btn.textContent = `${i.name} (${format(i.price)} clicks) ${i.owned ? "[Comprado]" : ""}`;
    btn.disabled = i.owned || clicks < i.price;
    btn.onclick = () => {
      if (!i.owned && clicks >= i.price) {
        clicks -= i.price;
        i.owned = true;
        display();
      }
    };
    const div = document.createElement("div");
    div.className = "shop-item";
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function displayPets() {
  const container = el("pets");
  container.innerHTML = "";
  pets.forEach(p => {
    const btn = document.createElement("button");
    const selected = activePetId === p.id;
    btn.textContent = `${p.name} (+${p.bonusPercent}%) ${selected ? "[Ativo]" : ""}`;
    btn.disabled = selected;
    btn.onclick = () => {
      activePetId = p.id;
      display();
    };
    const div = document.createElement("div");
    div.className = "pet-item";
    div.appendChild(btn);
    container.appendChild(div);
  });
}

function displayAchievements() {
  const container = el("achievements");
  container.innerHTML = "";
  achievements.forEach(a => {
    const div = document.createElement("div");
    div.className = "achievement-item";
    div.textContent = `${a.achieved ? "✓" : "✗"} ${a.name}`;
    container.appendChild(div);
  });
}

function displayMissions() {
  const container = el("missions");
  container.innerHTML = "";
  missions.forEach(m => {
    const div = document.createElement("div");
    div.className = "mission-item";
    const status = m.completed ? "✅" : `(${m.progress} / ${m.goal})`;
    div.textContent = `${status} ${m.description}`;
    container.appendChild(div);
  });
}

// === Firebase Ranking ===
el("saveScoreBtn").onclick = () => {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) {
    alert("Nome inválido! Mínimo 3 caracteres.");
    return;
  }
  const userRef = push(ref(db, "ranking"));
  set(userRef, { name, score: Math.floor(clicks) })
    .then(() => {
      alert("Score salvo com sucesso!");
      el("playerNameInput").value = "";
    })
    .catch(() => alert("Erro ao salvar score."));
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

function updateSaveButtonState() {
  el("saveScoreBtn").disabled = clicks < 1;
}

window.addEventListener("beforeunload", () => {
  const saveData = {
    clicks, level, xp, xpToNext, rebirths, currentWorld, upgrades, shopItems, pets, activePetId, achievements, missions
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
});

window.addEventListener("load", () => {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    try {
      const s = JSON.parse(save);
      clicks = s.clicks ?? clicks;
      level = s.level ?? level;
      xp = s.xp ?? xp;
      xpToNext = s.xpToNext ?? xpToNext;
      rebirths = s.rebirths ?? rebirths;
      currentWorld = s.currentWorld ?? currentWorld;

      if (s.upgrades) upgrades = s.upgrades;
      if (s.shopItems) shopItems = s.shopItems;
      if (s.pets) pets = s.pets;
      if (s.activePetId) activePetId = s.activePetId;

      if (s.achievements) achievements = s.achievements;
      if (s.missions) missions = s.missions;
    } catch (err) {
      console.warn("Falha ao carregar save:", err);
    }
  }
  display();
  loadRanking();
  updateSaveButtonState();
});

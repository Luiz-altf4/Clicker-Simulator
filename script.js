// === Firebase Modular Imports ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue,
  query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Firebase Config ===
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

// === Helper Functions ===
const $ = id => document.getElementById(id);
const format = num => {
  if (num >= 1e33) return (num / 1e33).toFixed(2) + ' Dc';
  if (num >= 1e30) return (num / 1e30).toFixed(2) + ' Oc';
  if (num >= 1e27) return (num / 1e27).toFixed(2) + ' Sp';
  if (num >= 1e24) return (num / 1e24).toFixed(2) + ' Sx';
  if (num >= 1e21) return (num / 1e21).toFixed(2) + ' Qi';
  if (num >= 1e18) return (num / 1e18).toFixed(2) + ' Qd';
  if (num >= 1e15) return (num / 1e15).toFixed(2) + ' T';
  if (num >= 1e12) return (num / 1e12).toFixed(2) + ' B';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' M';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + ' K';
  return Math.floor(num);
};

function notify(msg) {
  const div = document.createElement('div');
  div.className = 'notify';
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

function createParticle(x, y, text = "+1") {
  const particle = document.createElement('div');
  particle.className = 'particle';
  particle.style.left = `${x}px`;
  particle.style.top = `${y}px`;
  particle.textContent = text;
  document.getElementById("particlesContainer").appendChild(particle);
  setTimeout(() => particle.remove(), 1000);
}

// === Game State ===
let gameState = {
  clicks: 0,
  cps: 0,
  totalClicks: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  multiplier: 1,
  rebirths: 0,
  upgrades: [],
  pets: [],
  chatName: '',
};

// === Upgrades (17 itens!) ===
const upgradesData = [
  { id: 1, name: "🖱️ Clique Básico", cps: 0, bonus: 1, price: 10 },
  { id: 2, name: "⚙️ Clique Avançado", cps: 1, bonus: 0, price: 100 },
  { id: 3, name: "🏠 Casa de Clique", cps: 5, bonus: 0, price: 500 },
  { id: 4, name: "🏢 Prédio de Clique", cps: 10, bonus: 0, price: 1500 },
  { id: 5, name: "🧪 Laboratório", cps: 20, bonus: 0, price: 3500 },
  { id: 6, name: "🏭 Fábrica", cps: 100, bonus: 0, price: 8000 },
  { id: 7, name: "🌆 Cidade", cps: 300, bonus: 0, price: 20000 },
  { id: 8, name: "🌍 País", cps: 1000, bonus: 0, price: 60000 },
  { id: 9, name: "🚀 Satélite", cps: 5000, bonus: 0, price: 150000 },
  { id: 10, name: "🪐 Estação Espacial", cps: 10000, bonus: 0, price: 350000 },
  { id: 11, name: "🌌 Galáxia", cps: 25000, bonus: 0, price: 800000 },
  { id: 12, name: "🌠 Buraco Negro", cps: 60000, bonus: 0, price: 2000000 },
  { id: 13, name: "🧠 Super Cérebro", cps: 150000, bonus: 0, price: 5000000 },
  { id: 14, name: "🛸 Frota Alien", cps: 500000, bonus: 0, price: 12000000 },
  { id: 15, name: "🧬 Dimensão Quântica", cps: 1e6, bonus: 0, price: 30000000 },
  { id: 16, name: "💥 Big Bang", cps: 2e6, bonus: 0, price: 70000000 },
  { id: 17, name: "🌟 Multiverso", cps: 5e6, bonus: 0, price: 150000000 }
];

// === Pets (em breve com bônus reais) ===
const petsData = [
  { id: 1, name: "🐶 Cão Clicker", bonus: 1.05, price: 5000, owned: false },
  { id: 2, name: "🐱 Gato Gamer", bonus: 1.10, price: 15000, owned: false },
  { id: 3, name: "🐉 Dragão Lendário", bonus: 1.25, price: 50000, owned: false }
];

// Inicializa upgrades e pets
function initGameData() {
  upgradesData.forEach(u => gameState.upgrades.push({ ...u, owned: 0 }));
  petsData.forEach(p => gameState.pets.push({ ...p }));
}

// === Init & DOM Ready ===
document.addEventListener("DOMContentLoaded", () => {
  initGameData();
  setupClicker();
  setupChat();
  loadGame();
  updateAllDisplays();
  renderAll();
  startIntervals();
});

// === Render All Elements ===
function renderAll() {
  renderUpgrades();
  renderPets();
  renderRanking();
}

// === Update Display ===
function updateAllDisplays() {
  $("clicks").textContent = format(gameState.clicks);
  $("cps").textContent = format(gameState.cps);
  $("level").textContent = gameState.level;
  $("xp").textContent = gameState.xp;
  $("xpToNext").textContent = gameState.xpToNext;
  const fill = (gameState.xp / gameState.xpToNext) * 100;
  $("xpFill").style.width = `${fill}%`;
}

// === Click System ===
function gainClick(e) {
  const bonus = gameState.multiplier * getPetBonus();
  gameState.clicks += bonus;
  gameState.totalClicks += bonus;
  gameState.xp += 1;
  if (e?.clientX) createParticle(e.clientX, e.clientY, `+${bonus}`);

  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp = 0;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
    notify(`⚡ Level Up! Agora você é nível ${gameState.level}`);
  }

  updateAllDisplays();
}
$("clickArea").addEventListener("click", gainClick);

// === Upgrade System ===
function renderUpgrades() {
  const container = $("upgradesList");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${upg.name}</h3>
      <p>Preço: ${format(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      <button onclick="buyUpgrade(${upg.id})" ${gameState.clicks < upg.price ? "disabled" : ""}>Comprar</button>
    `;
    container.appendChild(div);
  });
}

window.buyUpgrade = function(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg || gameState.clicks < upg.price) return;

  gameState.clicks -= upg.price;
  upg.owned++;
  gameState.cps += upg.cps;
  gameState.multiplier += upg.bonus;
  upg.price = Math.floor(upg.price * 1.35);

  updateAllDisplays();
  renderUpgrades();
  saveGame();
};

// === Pet System ===
function getPetBonus() {
  return gameState.pets.reduce((bonus, pet) => {
    return pet.owned ? bonus * pet.bonus : bonus;
  }, 1);
}

function renderPets() {
  const container = $("petsList");
  if (!container) return;
  container.innerHTML = "";

  gameState.pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${pet.name}</h3>
      <p>Bônus: x${pet.bonus}</p>
      <p>Preço: ${format(pet.price)}</p>
      <button ${pet.owned ? "disabled" : ""} onclick="buyPet(${pet.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

window.buyPet = function(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet || gameState.clicks < pet.price || pet.owned) return;
  gameState.clicks -= pet.price;
  pet.owned = true;
  notify(`🎉 Pet ${pet.name} adquirido!`);
  updateAllDisplays();
  renderPets();
  saveGame();
};

// === Rebirth System ===
$("rebirthBtn").addEventListener("click", () => {
  if (gameState.clicks >= 1e6) {
    gameState.rebirths++;
    gameState.clicks = 0;
    gameState.cps = 0;
    gameState.totalClicks = 0;
    gameState.level = 1;
    gameState.xp = 0;
    gameState.xpToNext = 100;
    gameState.multiplier = 1 + gameState.rebirths;
    gameState.upgrades.forEach(u => {
      u.owned = 0;
      u.price = upgradesData.find(up => up.id === u.id).price;
    });
    notify(`🔥 Rebirth feito! Rebirths: ${gameState.rebirths}`);
    renderAll();
    updateAllDisplays();
    saveGame();
  } else {
    notify("Você precisa de pelo menos 1 milhão de cliques para fazer Rebirth.");
  }
});

// === Auto Click + Save ===
function startIntervals() {
  setInterval(() => {
    gameState.clicks += gameState.cps * getPetBonus();
    updateAllDisplays();
  }, 1000);

  setInterval(saveGame, 5000);
}

// === Save & Load ===
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(gameState, saved);
  }
}

// === Chat System ===
function setupChat() {
  const name = prompt("Digite seu nome para o chat:");
  if (!name || name.length < 2) {
    gameState.chatName = "Anônimo";
  } else {
    gameState.chatName = name.substring(0, 20);
  }

  const chatRef = ref(db, "chat");
  $("chatSendBtn").addEventListener("click", () => {
    const text = $("chatInput").value.trim();
    if (text && text.length <= 120) {
      push(chatRef, {
        user: gameState.chatName,
        msg: text,
        time: Date.now()
      });
      $("chatInput").value = "";
    }
  });

  onValue(chatRef, snapshot => {
    const data = snapshot.val();
    const container = $("chatMessages");
    container.innerHTML = "";

    if (data) {
      const msgs = Object.values(data).slice(-20);
      msgs.forEach(entry => {
        const div = document.createElement("div");
        const date = new Date(entry.time).toLocaleTimeString();
        div.innerHTML = `<strong>[${entry.user}]</strong> ${entry.msg} <span style="font-size:0.75em;color:#666;">(${date})</span>`;
        container.appendChild(div);
      });
      container.scrollTop = container.scrollHeight;
    }
  });
}

// === Ranking System ===
function renderRanking() {
  const refRank = query(ref(db, "rank"), orderByChild("clicks"), limitToLast(20));
  onValue(refRank, snapshot => {
    const data = snapshot.val();
    if (!data) return;
    const list = Object.values(data).sort((a, b) => b.clicks - a.clicks);
    const container = $("rankContainer");
    container.innerHTML = "";

    list.forEach((entry, i) => {
      const div = document.createElement("div");
      div.className = "rank-item";
      div.textContent = `#${i + 1} - ${entry.name}: ${format(entry.clicks)} cliques`;
      container.appendChild(div);
    });
  });

  // Salvar rank atual
  setInterval(() => {
    const refUser = ref(db, `rank/${gameState.chatName}`);
    set(refUser, {
      name: gameState.chatName,
      clicks: gameState.totalClicks
    });
  }, 10000);
}

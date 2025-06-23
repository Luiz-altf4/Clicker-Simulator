// Clicker Simulator dos Deuses - script.js COMPLETO E FUNCIONAL ⚡
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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
const $ = id => document.getElementById(id);

let state = {
  clicks: 0,
  cps: 0,
  totalClicks: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,
  prestige: 1,
  upgrades: [],
  pets: [],
  shopItems: [],
  achievements: [],
  multiplier: 1,
  sound: true,
  name: localStorage.getItem("username") || prompt("Digite seu nome:") || "Player"
};
localStorage.setItem("username", state.name);

const upgrades = [
  { id: 1, name: "Click Básico", cps: 0, bonus: 1, price: 10 },
  { id: 2, name: "Mouse Gamer", cps: 1, bonus: 0, price: 50 },
  { id: 3, name: "Auto Clicker", cps: 5, bonus: 0, price: 150 },
  { id: 4, name: "Central de Clicks", cps: 10, bonus: 0, price: 400 },
  { id: 5, name: "Fábrica", cps: 25, bonus: 0, price: 1000 }
];

const pets = [
  { id: 1, name: "🐱 Gato Rápido", bonus: 2, price: 500 },
  { id: 2, name: "🐶 Cão Clicker", bonus: 5, price: 1000 }
];

const shopItems = [
  { id: 1, name: "Cofre Secreto", effect: () => state.clicks += 500, price: 200 },
  { id: 2, name: "Poder Místico", effect: () => state.multiplier *= 2, price: 1000 }
];

const achievements = [
  { id: 1, name: "Primeiro Clique", check: () => state.totalClicks >= 1, earned: false },
  { id: 2, name: "Mil Cliques", check: () => state.totalClicks >= 1000, earned: false },
  { id: 3, name: "Level 10", check: () => state.level >= 10, earned: false }
];

function init() {
  upgrades.forEach(u => state.upgrades.push({ ...u, owned: 0 }));
  pets.forEach(p => state.pets.push({ ...p, owned: 0 }));
  shopItems.forEach(i => state.shopItems.push(i));
  achievements.forEach(a => state.achievements.push({ ...a }));
  loadGame();
  updateUI();
  renderAll();
  setupListeners();
  startLoops();
  loadRanking();
  loadChat();
}

function updateUI() {
  $("clicksDisplay").textContent = `Cliques: ${state.clicks}`;
  $("cpsDisplay").textContent = `CPS: ${state.cps}`;
  $("levelDisplay").textContent = `Nível: ${state.level}`;
  $("rebirthDisplay").textContent = `Rebirths: ${state.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${state.prestige}x`;
  $("xpText").textContent = `XP: ${state.xp} / ${state.xpToNext}`;
  $("xpFill").style.width = `${(state.xp / state.xpToNext) * 100}%`;
}

function renderAll() {
  renderUpgrades();
  renderPets();
  renderShop();
  renderAchievements();
}

$("clickBtn").addEventListener("click", () => {
  state.clicks += state.multiplier;
  state.totalClicks += state.multiplier;
  state.xp++;
  levelUp();
  spawnParticle();
  updateUI();
  checkAchievements();
});

function levelUp() {
  if (state.xp >= state.xpToNext) {
    state.level++;
    state.xp = 0;
    state.xpToNext = Math.floor(state.xpToNext * 1.25);
  }
}

function spawnParticle() {
  const p = document.createElement("div");
  p.className = "particle";
  p.style.left = `${Math.random() * 100}%`;
  p.style.top = `${Math.random() * 100}%`;
  p.textContent = `+${state.multiplier}`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1000);
}

function renderUpgrades() {
  const container = $("upgradesList");
  container.innerHTML = "";
  state.upgrades.forEach(up => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${up.name}</h3>
      <p>CPS: ${up.cps} | Bônus: ${up.bonus}</p>
      <p>Possui: ${up.owned}</p>
      <p>Preço: ${up.price}</p>
      <button onclick="buyUpgrade(${up.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

window.buyUpgrade = function(id) {
  const up = state.upgrades.find(u => u.id === id);
  if (!up || state.clicks < up.price) return;
  state.clicks -= up.price;
  up.owned++;
  state.cps += up.cps;
  state.multiplier += up.bonus;
  up.price = Math.floor(up.price * 1.35);
  saveGame();
  renderUpgrades();
  updateUI();
};

function renderPets() {
  const container = $("petsList");
  container.innerHTML = "";
  state.pets.forEach(p => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>Bônus: ${p.bonus}</p>
      <p>Possui: ${p.owned}</p>
      <p>Preço: ${p.price}</p>
      <button onclick="buyPet(${p.id})">Adotar</button>
    `;
    container.appendChild(div);
  });
}

window.buyPet = function(id) {
  const pet = state.pets.find(p => p.id === id);
  if (!pet || state.clicks < pet.price) return;
  state.clicks -= pet.price;
  pet.owned++;
  state.multiplier += pet.bonus;
  pet.price = Math.floor(pet.price * 2);
  saveGame();
  renderPets();
  updateUI();
};

function renderShop() {
  const container = $("shopItems");
  container.innerHTML = "";
  state.shopItems.forEach(i => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${i.name}</h3>
      <p>Preço: ${i.price}</p>
      <button onclick="buyItem(${i.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

window.buyItem = function(id) {
  const item = state.shopItems.find(i => i.id === id);
  if (!item || state.clicks < item.price) return;
  state.clicks -= item.price;
  item.effect();
  saveGame();
  renderShop();
  updateUI();
};

function renderAchievements() {
  const container = $("achievementsList");
  container.innerHTML = "";
  state.achievements.forEach(a => {
    const div = document.createElement("div");
    div.className = "item";
    if (a.earned) div.classList.add("completed");
    div.innerHTML = `🏅 ${a.name}`;
    container.appendChild(div);
  });
}

function checkAchievements() {
  state.achievements.forEach(a => {
    if (!a.earned && a.check()) {
      a.earned = true;
      alert(`🏅 Conquista desbloqueada: ${a.name}`);
    }
  });
  renderAchievements();
}

function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(state));
  saveRanking();
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) Object.assign(state, JSON.parse(data));
}

function setupListeners() {
  $("toggleSound").addEventListener("change", e => state.sound = e.target.checked);
  $("themeBtn").addEventListener("click", () => document.body.classList.toggle("rgb-theme"));
  $("sendChat").addEventListener("click", sendChat);
  $("chatInput").addEventListener("keydown", e => { if (e.key === "Enter") sendChat(); });
}

function startLoops() {
  setInterval(() => {
    state.clicks += state.cps;
    updateUI();
  }, 1000);

  setInterval(saveGame, 10000);
}

function saveRanking() {
  if (!state.name) return;
  const rankRef = ref(db, "ranking/" + state.name);
  set(rankRef, {
    name: state.name,
    clicks: state.totalClicks,
    level: state.level
  });
}

function loadRanking() {
  const rankRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(rankRef, snap => {
    const container = $("rankingContainer");
    container.innerHTML = "";
    const list = [];
    snap.forEach(s => list.push(s.val()));
    list.reverse().forEach(r => {
      const div = document.createElement("div");
      div.textContent = `${r.name}: ${r.clicks} cliques (Lvl ${r.level})`;
      container.appendChild(div);
    });
  });
}

function sendChat() {
  const input = $("chatInput");
  if (!input.value.trim()) return;
  push(ref(db, "chat"), {
    name: state.name,
    msg: input.value.trim(),
    time: Date.now()
  });
  input.value = "";
}

function loadChat() {
  const chatRef = query(ref(db, "chat"), limitToLast(25));
  onValue(chatRef, snap => {
    const chat = $("chatMessages");
    chat.innerHTML = "";
    snap.forEach(s => {
      const msg = s.val();
      const p = document.createElement("p");
      p.innerHTML = `<b>${msg.name}:</b> ${msg.msg}`;
      chat.appendChild(p);
    });
    chat.scrollTop = chat.scrollHeight;
  });
}

document.addEventListener("DOMContentLoaded", init);

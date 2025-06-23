// Clicker Simulator Divino - Versão Final dos Deuses 🔥 Luiz 🔥
// Firebase + Sistema Completo: Upgrades, Pets, Conquistas, Loja, Ranking, Chat, Partículas, Sons, XP, Temas, Responsivo

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let state = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,
  prestige: 1,
  multiplier: 1,
  upgrades: [],
  pets: [],
  achievements: [],
  shopItems: [],
  equippedPet: null,
  lastMessageTime: 0
};

const $ = id => document.getElementById(id);
const format = n => {
  if (n < 1000) return n;
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  let u = -1;
  while (n >= 1000 && ++u < units.length) n /= 1000;
  return n.toFixed(2) + units[u];
};

const upgradesData = [
  { id: 1, name: "Click Básico", bonusClick: 1, cps: 0, price: 10 },
  { id: 2, name: "Click Pro", bonusClick: 0, cps: 1, price: 100 },
  { id: 3, name: "Click Turbo", bonusClick: 0, cps: 5, price: 1000 },
  { id: 4, name: "Click Ultra", bonusClick: 2, cps: 10, price: 3000 },
  { id: 5, name: "Fábrica de Cliques", bonusClick: 0, cps: 100, price: 10000 }
];

const petsData = [
  { id: 1, name: "🐶 Doguinho", multiplier: 1.2, price: 1000 },
  { id: 2, name: "🐱 Gatinho", multiplier: 1.5, price: 3000 },
  { id: 3, name: "🐉 Dragão", multiplier: 2.5, price: 10000 }
];

const shopItemsData = [
  { id: 1, name: "XP Boost +100", price: 300, action: () => state.xp += 100 },
  { id: 2, name: "Prestígio x2", price: 15000, action: () => state.prestige *= 2 }
];

const achievementsData = [
  { id: 1, name: "Primeiro Clique", condition: () => state.totalClicks >= 1 },
  { id: 2, name: "100 Cliques", condition: () => state.totalClicks >= 100 },
  { id: 3, name: "1k Cliques", condition: () => state.totalClicks >= 1000 },
  { id: 4, name: "Milionário", condition: () => state.clicks >= 1000000 }
];

document.addEventListener("DOMContentLoaded", () => {
  setup();
  loadGame();
  startLoops();
});

function setup() {
  $("clickBtn").addEventListener("click", click);
  $("themeBtn").addEventListener("click", toggleTheme);
  $("sendChat").addEventListener("click", sendChat);
  $("chatInput").addEventListener("keydown", e => e.key === "Enter" && sendChat());
  initUpgrades();
  initPets();
  initShop();
  initAchievements();
  listenChat();
  loadRanking();
}

function startLoops() {
  setInterval(() => {
    state.clicks += state.cps * state.prestige;
    updateUI();
  }, 1000);
  setInterval(saveGame, 5000);
}

function click() {
  const gain = state.multiplier * state.prestige;
  state.clicks += gain;
  state.totalClicks += gain;
  state.xp++;
  playSound("click");
  spawnParticle();
  if (state.xp >= state.xpToNext) {
    state.level++;
    state.xp = 0;
    state.xpToNext = Math.floor(state.xpToNext * 1.3);
  }
  checkAchievements();
  updateUI();
}

function updateUI() {
  $("clicksDisplay").textContent = `Cliques: ${format(state.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${format(state.cps * state.prestige)}`;
  $("levelDisplay").textContent = `Nível: ${state.level}`;
  $("rebirthDisplay").textContent = `Rebirths: ${state.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${state.prestige.toFixed(2)}x`;
  $("xpFill").style.width = (state.xp / state.xpToNext * 100) + "%";
  $("xpText").textContent = `XP: ${state.xp} / ${state.xpToNext}`;
}

function playSound(type) {
  const audio = new Audio(`sounds/${type}.mp3`);
  audio.volume = 0.3;
  audio.play();
}

function spawnParticle() {
  const p = document.createElement("div");
  p.className = "particle";
  p.style.left = Math.random() * 80 + 10 + "%";
  p.style.top = Math.random() * 80 + 10 + "%";
  p.textContent = "+" + format(state.multiplier * state.prestige);
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 1000);
}

function toggleTheme() {
  document.body.classList.toggle("rgb-theme");
}

function initUpgrades() {
  state.upgrades = upgradesData.map(u => ({ ...u, owned: 0 }));
  const container = $("upgradesList");
  container.innerHTML = "";
  state.upgrades.forEach(u => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${u.name}</h3>
      <p>Preço: ${format(u.price)}</p>
      <p>Possui: ${u.owned}</p>
      <button onclick="buyUpgrade(${u.id})">Comprar</button>`;
    container.appendChild(div);
  });
}

window.buyUpgrade = function(id) {
  const u = state.upgrades.find(x => x.id === id);
  if (!u || state.clicks < u.price) return;
  state.clicks -= u.price;
  u.owned++;
  state.cps += u.cps;
  state.multiplier += u.bonusClick;
  u.price = Math.floor(u.price * 1.5);
  initUpgrades();
  updateUI();
};

function initPets() {
  const container = $("petsList");
  container.innerHTML = "";
  petsData.forEach(p => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <p>Preço: ${format(p.price)}</p>
      <button onclick="buyPet(${p.id})">Comprar</button>`;
    container.appendChild(div);
  });
}

window.buyPet = function(id) {
  const pet = petsData.find(p => p.id === id);
  if (!pet || state.clicks < pet.price) return;
  state.clicks -= pet.price;
  state.multiplier *= pet.multiplier;
  state.equippedPet = pet.name;
  updateUI();
};

function initShop() {
  const container = $("shopItems");
  container.innerHTML = "";
  shopItemsData.forEach(s => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <h3>${s.name}</h3>
      <p>Preço: ${format(s.price)}</p>
      <button onclick="buyItem(${s.id})">Comprar</button>`;
    container.appendChild(div);
  });
}

window.buyItem = function(id) {
  const s = shopItemsData.find(x => x.id === id);
  if (!s || state.clicks < s.price) return;
  state.clicks -= s.price;
  s.action();
  updateUI();
};

function initAchievements() {
  const container = $("achievementsList");
  container.innerHTML = achievementsData.map(a => `<div class="item" id="ach-${a.id}">${a.name}</div>`).join("");
}

function checkAchievements() {
  achievementsData.forEach(a => {
    if (a.condition() && !state.achievements.includes(a.id)) {
      state.achievements.push(a.id);
      const el = $("ach-" + a.id);
      if (el) el.classList.add("completed");
    }
  });
}

function loadRanking() {
  const refRank = ref(db, "ranking");
  onValue(refRank, snap => {
    const data = [];
    snap.forEach(child => data.push(child.val()));
    const top = data.sort((a, b) => b.clicks - a.clicks).slice(0, 20);
    $("rankingContainer").innerHTML = top.map(p => `<p><b>${p.name}</b>: ${format(p.clicks)}</p>`).join("");
  });
}

function listenChat() {
  onValue(ref(db, "chat"), snap => {
    const messages = [];
    snap.forEach(child => messages.push(child.val()));
    $("chatMessages").innerHTML = messages.slice(-50).map(m => `<p><b>${m.name}</b>: ${m.text}</p>`).join("");
  });
}

function sendChat() {
  let now = Date.now();
  if (now - state.lastMessageTime < 2000) return alert("Aguarde antes de enviar novamente.");
  let name = localStorage.getItem("playerName") || prompt("Nome para o chat:") || "Jogador";
  localStorage.setItem("playerName", name);
  const text = $("chatInput").value.trim();
  if (!text) return;
  push(ref(db, "chat"), { name, text, time: now });
  state.lastMessageTime = now;
  $("chatInput").value = "";
}

function saveGame() {
  localStorage.setItem("save", JSON.stringify(state));
  const name = localStorage.getItem("playerName") || "Jogador";
  set(ref(db, `ranking/${name}`), { name, clicks: state.totalClicks });
}

function loadGame() {
  const s = localStorage.getItem("save");
  if (s) Object.assign(state, JSON.parse(s));
  updateUI();
}

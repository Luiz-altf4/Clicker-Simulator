// === Firebase Imports ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Firebase Config ===
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com", // CORRIGIDO
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Utilitários ===
const $ = id => document.getElementById(id);
const format = n => {
  const suffixes = ["", "K", "M", "B", "T", "Qd", "Qi", "Sx", "Sp", "Oc", "Dc"];
  let tier = Math.log10(n) / 3 | 0;
  if(tier === 0) return n;
  const scale = Math.pow(10, tier * 3);
  return (n / scale).toFixed(2) + suffixes[tier];
};

// === Estado do Jogo ===
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
  upgrades: []
};

const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonus: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonus: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonus: 0, cps: 5, price: 300 },
  { id: 4, name: "🏢 Prédio de Click", bonus: 0, cps: 15, price: 1000 },
  { id: 5, name: "🧪 Laboratório", bonus: 0, cps: 50, price: 2500 },
  { id: 6, name: "🏭 Fábrica de Click", bonus: 0, cps: 150, price: 5000 },
  { id: 7, name: "🌆 Cidade de Click", bonus: 0, cps: 500, price: 15000 },
  { id: 8, name: "🌍 País de Click", bonus: 0, cps: 1500, price: 50000 }
];

// === Inicialização ===
function init() {
  upgradesData.forEach(upg => {
    state.upgrades.push({ ...upg, owned: 0 });
  });

  $("clickBtn").addEventListener("click", handleClick);
  $("rebirthBtn").addEventListener("click", handleRebirth);
  $("saveBtn").addEventListener("click", saveGame);
  $("themeBtn").addEventListener("click", toggleTheme);
  $("sendChat").addEventListener("click", sendChat);

  $("chatInput").addEventListener("keydown", e => {
    if (e.key === "Enter") sendChat();
  });

  setInterval(() => {
    state.clicks += state.cps * state.prestige;
    updateDisplay();
  }, 1000);

  setInterval(saveGame, 5000);

  loadGame();
  renderUpgrades();
  updateDisplay();
  loadRanking();
  listenChat();
}

// === Clique ===
function handleClick() {
  const bonus = state.multiplier * state.prestige;
  state.clicks += bonus;
  state.totalClicks += bonus;
  state.xp += 1;
  if (state.xp >= state.xpToNext) {
    state.level++;
    state.xp = 0;
    state.xpToNext = Math.floor(state.xpToNext * 1.2);
  }
  updateDisplay();
}

// === Upgrades ===
function renderUpgrades() {
  const container = $("upgradesContainer");
  container.innerHTML = "";
  state.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <h3>${upg.name}</h3>
      <p>Preço: ${format(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      <button onclick="buyUpgrade(${upg.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

window.buyUpgrade = function(id) {
  const upg = state.upgrades.find(u => u.id === id);
  if (!upg || state.clicks < upg.price) return;
  state.clicks -= upg.price;
  upg.owned++;
  state.cps += upg.cps;
  state.multiplier += upg.bonus;
  upg.price = Math.floor(upg.price * 1.4);
  renderUpgrades();
  updateDisplay();
};

// === Rebirth ===
function handleRebirth() {
  if (state.totalClicks < 10000) return alert("Você precisa de 10.000 cliques totais!");
  state.rebirths++;
  state.prestige = 1 + state.rebirths * 0.25;
  state.clicks = 0;
  state.totalClicks = 0;
  state.cps = 0;
  state.xp = 0;
  state.level = 1;
  state.xpToNext = 100;
  state.multiplier = 1;
  state.upgrades.forEach(u => {
    u.owned = 0;
    u.price = upgradesData.find(data => data.id === u.id).price;
  });
  renderUpgrades();
  updateDisplay();
}

// === Tema claro/escuro ===
function toggleTheme() {
  document.body.classList.toggle("light-theme");
}

// === Ranking ===
function loadRanking() {
  const topRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(topRef, snapshot => {
    const list = [];
    snapshot.forEach(child => {
      list.unshift(child.val());
    });
    $("rankingContainer").innerHTML = list.map(p =>
      `<p><b>${p.name}</b>: ${format(p.clicks)}</p>`
    ).join("");
  });
}

// === Chat ===
function listenChat() {
  const chatRef = ref(db, "chat");
  onValue(chatRef, snapshot => {
    const msgs = [];
    snapshot.forEach(msg => msgs.push(msg.val()));
    $("chatMessages").innerHTML = msgs.map(m =>
      `<p><b>${m.name}</b>: ${m.text}</p>`
    ).join("");
    $("chatMessages").scrollTop = $("chatMessages").scrollHeight;
  });
}

function sendChat() {
  const name = prompt("Digite seu nome para o chat:") || "Jogador";
  const text = $("chatInput").value.trim();
  if (!text || text.length > 100) return;
  push(ref(db, "chat"), {
    name, text, time: Date.now()
  });
  $("chatInput").value = "";
}

// === Save/Load ===
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(state));
  set(ref(db, `ranking/${state.username || "Jogador"}`), {
    name: state.username || "Jogador",
    clicks: state.totalClicks
  });
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const parsed = JSON.parse(data);
    Object.assign(state, parsed);
  } else {
    state.username = prompt("Digite seu nome:") || "Jogador";
  }
}

// === Atualizar Tela ===
function updateDisplay() {
  $("clicksDisplay").textContent = `Cliques: ${format(state.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${format(state.cps * state.prestige)}`;
  $("levelDisplay").textContent = `Nível: ${state.level}`;
  $("rebirthDisplay").textContent = `Rebirths: ${state.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${state.prestige.toFixed(2)}x`;

  const xpPercent = Math.floor((state.xp / state.xpToNext) * 100);
  $("xpFill").style.width = xpPercent + "%";
  $("xpText").textContent = `XP: ${state.xp} / ${state.xpToNext}`;
}

document.addEventListener("DOMContentLoaded", init);

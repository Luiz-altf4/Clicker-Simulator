// === Firebase Imports ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Firebase Config ===
// ATENÇÃO: confirme que este databaseURL está correto e sem "/" no final
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

// === Utilitários ===
const $ = id => document.getElementById(id);

// Formata números grandes: 1234 => 1.23K, etc
function formatNumber(n) {
  if (n < 1000) return n.toString();
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  let unitIndex = -1;
  let num = n;
  while (num >= 1000 && unitIndex < units.length -1) {
    num /= 1000;
    unitIndex++;
  }
  return num.toFixed(2) + units[unitIndex];
}

// === Estado do jogo ===
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
  // Inicializa upgrades no estado (se ainda não tem)
  if (!state.upgrades.length) {
    upgradesData.forEach(u => {
      state.upgrades.push({ ...u, owned: 0 });
    });
  }

  // Eventos
  $("clickBtn").addEventListener("click", handleClick);
  $("rebirthBtn").addEventListener("click", handleRebirth);
  $("saveBtn").addEventListener("click", saveGame);
  $("themeBtn").addEventListener("click", toggleTheme);
  $("sendChat").addEventListener("click", sendChat);
  $("chatInput").addEventListener("keydown", e => {
    if (e.key === "Enter") sendChat();
  });

  // Loop que soma CPS a cada segundo
  setInterval(() => {
    state.clicks += state.cps * state.prestige;
    updateDisplay();
  }, 1000);

  // Auto save a cada 5 segundos
  setInterval(saveGame, 5000);

  loadGame();
  renderUpgrades();
  updateDisplay();
  loadRanking();
  listenChat();
}

// === Clique manual ===
function handleClick() {
  const bonus = state.multiplier * state.prestige;
  state.clicks += bonus;
  state.totalClicks += bonus;
  state.xp++;
  if (state.xp >= state.xpToNext) {
    state.level++;
    state.xp = 0;
    state.xpToNext = Math.floor(state.xpToNext * 1.2);
  }
  updateDisplay();
}

// === Renderiza upgrades na UI ===
function renderUpgrades() {
  const container = $("upgradesContainer");
  container.innerHTML = "";
  state.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <h3>${upg.name}</h3>
      <p>Preço: ${formatNumber(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      <button ${state.clicks < upg.price ? "disabled" : ""} onclick="buyUpgrade(${upg.id})">Comprar</button>
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
  if (state.totalClicks < 10000) {
    alert("Você precisa de 10.000 cliques totais para fazer Rebirth!");
    return;
  }
  state.rebirths++;
  state.prestige = 1 + state.rebirths * 0.25;
  state.clicks = 0;
  state.totalClicks = 0;
  state.cps = 0;
  state.xp = 0;
  state.level = 1;
  state.xpToNext = 100;
  state.multiplier = 1;
  // Reset upgrades
  state.upgrades = [];
  upgradesData.forEach(u => {
    state.upgrades.push({ ...u, owned: 0 });
  });
  renderUpgrades();
  updateDisplay();
}

// === Tema claro/escuro ===
function toggleTheme() {
  document.body.classList.toggle("light-theme");
}

// === Ranking: carregar e mostrar top 10 ===
function loadRanking() {
  const rankingRef = query(ref(db, "ranking"), orderByChild("clicks"), limitToLast(10));
  onValue(rankingRef, snapshot => {
    const players = [];
    snapshot.forEach(child => players.unshift(child.val())); // inverte ordem para maior no topo
    const container = $("rankingContainer");
    container.innerHTML = players.map(p => `<p><b>${p.name}</b>: ${formatNumber(p.clicks)}</p>`).join("");
  });
}

// === Chat ===
function listenChat() {
  const chatRef = ref(db, "chat");
  onValue(chatRef, snapshot => {
    const messages = [];
    snapshot.forEach(child => messages.push(child.val()));
    const container = $("chatMessages");
    container.innerHTML = messages.map(m => `<p><b>${m.name}</b>: ${sanitize(m.text)}</p>`).join("");
    container.scrollTop = container.scrollHeight;
  });
}

function sendChat() {
  let name = localStorage.getItem("playerName");
  if (!name) {
    name = prompt("Digite seu nome para o chat (máx 15 caracteres):") || "Jogador";
    name = name.substring(0, 15);
    localStorage.setItem("playerName", name);
  }
  const text = $("chatInput").value.trim();
  if (!text) return alert("Digite uma mensagem para enviar!");
  if (text.length > 100) return alert("Mensagem muito longa!");
  push(ref(db, "chat"), {
    name,
    text,
    time: Date.now()
  });
  $("chatInput").value = "";
}

// Escapa caracteres HTML para evitar injection no chat
function sanitize(str) {
  return str.replace(/[&<>"']/g, m => {
    switch (m) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      case "'": return "&#39;";
      default: return m;
    }
  });
}

// === Salvar jogo local + ranking online ===
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(state));

  let name = localStorage.getItem("playerName") || "Jogador";
  set(ref(db, `ranking/${name}`), {
    name,
    clicks: state.totalClicks
  }).catch(console.error);
}

// === Carregar jogo do localStorage ===
function loadGame() {
  const saveData = localStorage.getItem("clickerSave");
  if (saveData) {
    const data = JSON.parse(saveData);
    Object.assign(state, data);
  } else {
    // Pergunta nome só uma vez
    if (!localStorage.getItem("playerName")) {
      const name = prompt("Digite seu nome (máx 15 caracteres):") || "Jogador";
      localStorage.setItem("playerName", name.substring(0, 15));
    }
  }
}

// === Atualizar display da UI ===
function updateDisplay() {
  $("clicksDisplay").textContent = `Cliques: ${formatNumber(state.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${formatNumber(state.cps * state.prestige)}`;
  $("levelDisplay").textContent = `Nível: ${state.level}`;
  $("rebirthDisplay").textContent = `Rebirths: ${state.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${state.prestige.toFixed(2)}x`;

  // Atualiza barra de XP
  const xpPercent = (state.xp / state.xpToNext) * 100;
  $("xpFill").style.width = xpPercent + "%";
  $("xpText").textContent = `XP: ${state.xp} / ${state.xpToNext}`;

  // Atualiza botões comprar upgrades habilitados/desabilitados
  renderUpgrades();
}

// === Start ===
window.addEventListener("DOMContentLoaded", init);

// script.js - clicker simulator completo e avançado

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
  query,
  orderByChild,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "COLOQUE_SUA_API_KEY_AQUI",
  authDomain: "SEU_AUTH_DOMAIN",
  databaseURL: "SUA_DATABASE_URL",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SEU_MEASUREMENT_ID",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const $ = (id) => document.getElementById(id);

function abreviarNum(num) {
  const sufixos = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  let i = 0;
  while (num >= 1000 && i < sufixos.length - 1) {
    num /= 1000;
    i++;
  }
  return num.toFixed(2).replace(/\.00$/, "") + sufixos[i];
}

const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonusClick: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonusClick: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonusClick: 0, cps: 5, price: 500 },
  { id: 4, name: "🏢 Prédio de Click", bonusClick: 0, cps: 20, price: 2000 },
  { id: 5, name: "🧪 Laboratório de Click", bonusClick: 0, cps: 50, price: 10000 },
];

let gameState = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  multiplier: 1,
  xp: 0,
  level: 1,
  xpToNext: 100,
  upgrades: [],
  rebirths: 0,
  prestigeMultiplier: 1,
  playerName: "",
};

function initUpgrades() {
  gameState.upgrades = upgradesData.map((u) => ({ ...u, owned: 0 }));
}

function renderUpgrades() {
  const container = $("upgradesContainer");
  container.innerHTML = "";
  gameState.upgrades.forEach((upg) => {
    const canBuy = gameState.clicks >= upg.price;
    const btnDisabled = canBuy ? "" : "disabled";
    container.innerHTML += `
      <div class="upgrade">
        <h3>${upg.name}</h3>
        <p>Preço: ${abreviarNum(upg.price)}</p>
        <p>Possui: ${upg.owned}</p>
        <button onclick="buyUpgrade(${upg.id})" ${btnDisabled}>Comprar</button>
      </div>
    `;
  });
}

window.buyUpgrade = function (id) {
  const upg = gameState.upgrades.find((u) => u.id === id);
  if (!upg) return;
  if (gameState.clicks < upg.price) return alert("Clique insuficiente!");
  gameState.clicks -= upg.price;
  upg.owned++;
  gameState.cps += upg.cps;
  gameState.multiplier += upg.bonusClick;
  upg.price = Math.floor(upg.price * 1.35);
  updateDisplay();
  renderUpgrades();
  saveGame();
};

function gainClick() {
  gameState.clicks += gameState.multiplier;
  gameState.totalClicks += gameState.multiplier;
  gainXP(gameState.multiplier);
  updateDisplay();
}

function gainXP(amount) {
  gameState.xp += amount;
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp -= gameState.xpToNext;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
  }
  updateXPBar();
}

function updateDisplay() {
  $("clicksDisplay").textContent = `Cliques: ${abreviarNum(gameState.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${abreviarNum(gameState.cps)}`;
  $("levelDisplay").textContent = `Nível: ${gameState.level}`;
  $("rebirthDisplay").textContent = `Rebirths: ${gameState.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${gameState.prestigeMultiplier.toFixed(2)}x`;
  updateXPBar();
}

function updateXPBar() {
  const xpFill = $("xpFill");
  const percent = Math.min((gameState.xp / gameState.xpToNext) * 100, 100);
  xpFill.style.width = percent + "%";
  $("xpText").textContent = `XP: ${abreviarNum(gameState.xp)} / ${abreviarNum(gameState.xpToNext)}`;
}

function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
  saveRanking();
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(gameState, saved);
  } else {
    initUpgrades();
  }
  renderUpgrades();
  updateDisplay();
}

// CPS automático
function startCPS() {
  setInterval(() => {
    gameState.clicks += gameState.cps * gameState.prestigeMultiplier;
    gameState.totalClicks += gameState.cps * gameState.prestigeMultiplier;
    gainXP(gameState.cps * gameState.prestigeMultiplier);
    updateDisplay();
  }, 1000);
}

// Rebirth / Prestígio
function doRebirth() {
  if (gameState.clicks < 100000) {
    alert("Você precisa de pelo menos 100.000 clicks para fazer Rebirth!");
    return;
  }
  gameState.rebirths++;
  gameState.prestigeMultiplier += 0.25;
  gameState.clicks = 0;
  gameState.totalClicks = 0;
  gameState.cps = 0;
  gameState.multiplier = 1;
  gameState.xp = 0;
  gameState.level = 1;
  gameState.xpToNext = 100;
  initUpgrades();
  renderUpgrades();
  updateDisplay();
  saveGame();
  alert("Rebirth realizado! Prestígio aumentado.");
}

// Firebase Ranking e Chat

const rankingRef = ref(db, "ranking");
const chatRef = ref(db, "chat");

function saveRanking() {
  if (!gameState.playerName) return;
  const playerRef = push(rankingRef);
  set(playerRef, {
    name: gameState.playerName,
    clicks: gameState.totalClicks,
    level: gameState.level,
    timestamp: Date.now(),
  });
}

function loadRanking() {
  const q = query(rankingRef, orderByChild("clicks"), limitToLast(10));
  onValue(q, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    const arr = Object.values(data).sort((a, b) => b.clicks - a.clicks);
    const container = $("rankingContainer");
    container.innerHTML = "";
    arr.forEach((p, i) => {
      const div = document.createElement("div");
      div.textContent = `${i + 1}. ${p.name} — ${abreviarNum(p.clicks)} clicks`;
      container.appendChild(div);
    });
  });
}

function sendMessage(msg) {
  if (!gameState.playerName) {
    alert("Defina seu nome antes de enviar mensagens!");
    return;
  }
  if (!msg.trim()) return;
  const newMsgRef = push(chatRef);
  set(newMsgRef, {
    name: gameState.playerName,
    message: msg,
    timestamp: Date.now(),
  });
}

function loadChat() {
  onValue(chatRef, (snapshot) => {
    const data = snapshot.val();
    const container = $("chatMessages");
    container.innerHTML = "";
    if (!data) return;
    const arr = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
    arr.forEach(({ name, message }) => {
      const div = document.createElement("div");
      div.textContent = `${name}: ${message}`;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    });
  });
}

// Setup inicial

function setup() {
  // Perguntar nome do jogador
  gameState.playerName =
    localStorage.getItem("playerName") || prompt("Digite seu nome:");

  if (!gameState.playerName) {
    gameState.playerName = "Jogador";
  }
  localStorage.setItem("playerName", gameState.playerName);

  $("clickBtn").addEventListener("click", gainClick);
  $("rebirthBtn").addEventListener("click", doRebirth);
  $("saveBtn").addEventListener("click", saveGame);
  $("themeBtn").addEventListener("click", toggleTheme);
  $("sendChat").addEventListener("click", () => {
    sendMessage($("chatInput").value);
    $("chatInput").value = "";
  });
  $("chatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage($("chatInput").value);
      $("chatInput").value = "";
    }
  });

  loadGame();
  loadRanking();
  loadChat();
  startCPS();

  setInterval(saveGame, 15000);

  // Tema
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.add("light-theme");
  }
}

function toggleTheme() {
  document.body.classList.toggle("light-theme");
  localStorage.setItem(
    "theme",
    document.body.classList.contains("light-theme") ? "light" : "dark"
  );
}

window.addEventListener("DOMContentLoaded", setup);

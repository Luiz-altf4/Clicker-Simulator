// === Firebase Imports ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast
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

// === Utilidades ===
const $ = id => document.getElementById(id);

function abreviar(n) {
  const sufixos = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "Dc"];
  let i = 0;
  while (n >= 1000 && i < sufixos.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(1) + sufixos[i];
}

// === Estado do Jogo ===
let gameState = {
  clicks: 0,
  cps: 0,
  totalClicks: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  upgrades: [],
  playerName: '',
  multiplier: 1
};

// === Dados dos Upgrades ===
const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonusClick: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonusClick: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonusClick: 0, cps: 2, price: 300 },
  { id: 4, name: "🏢 Prédio de Click", bonusClick: 0, cps: 10, price: 1000 },
  { id: 5, name: "🧪 Laboratório de Click", bonusClick: 0, cps: 20, price: 2500 },
  { id: 6, name: "🏭 Fábrica de Click", bonusClick: 0, cps: 100, price: 5000 },
  { id: 7, name: "🌆 Cidade de Click", bonusClick: 0, cps: 500, price: 15000 },
  { id: 8, name: "🌍 País de Click", bonusClick: 0, cps: 10000, price: 50000 }
];

// === Inicialização do Jogo ===
function init() {
  upgradesData.forEach(u => {
    gameState.upgrades.push({ ...u, owned: 0 });
  });

  carregarRanking();
  loadGame();
  renderUpgrades();
  updateDisplay();
  startIntervals();
}

function updateDisplay() {
  $("clicksDisplay").textContent = `Cliques: ${abreviar(gameState.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${abreviar(gameState.cps)}`;
  $("xpFill").style.width = `${(gameState.xp / gameState.xpToNext) * 100}%`;
  $("xpText").textContent = `XP: ${gameState.xp} / ${gameState.xpToNext}`;
}

function renderUpgrades() {
  const container = $("upgradesContainer");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <h3>${upg.name}</h3>
      <p>Preço: ${abreviar(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      <button onclick="buyUpgrade(${upg.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

window.buyUpgrade = function (id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg || gameState.clicks < upg.price) return;
  gameState.clicks -= upg.price;
  upg.owned++;
  gameState.cps += upg.cps;
  gameState.multiplier += upg.bonusClick;
  upg.price = Math.floor(upg.price * 1.35);
  saveGame();
  renderUpgrades();
  updateDisplay();
};

function gainClick() {
  gameState.clicks += gameState.multiplier;
  gameState.totalClicks += gameState.multiplier;
  gameState.xp += 1;
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp = 0;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
  }
  updateDisplay();
}

$("clickBtn").addEventListener("click", gainClick);

function startIntervals() {
  setInterval(() => {
    gameState.clicks += gameState.cps;
    updateDisplay();
  }, 1000);

  setInterval(() => {
    saveGame();
    enviarParaRanking();
  }, 5000);
}

// === Salvamento Local ===
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(gameState, saved);
    renderUpgrades();
    updateDisplay();
  }
}

// === Firebase: Ranking ===
function enviarParaRanking() {
  if (!gameState.playerName) return;

  const rankRef = ref(db, "ranking");
  const novo = push(rankRef);
  set(novo, {
    nome: gameState.playerName,
    cliques: gameState.totalClicks,
    data: Date.now()
  });
}

function carregarRanking() {
  const rankRef = query(ref(db, "ranking"), orderByChild("cliques"), limitToLast(10));
  onValue(rankRef, snapshot => {
    const container = $("rankingContainer");
    container.innerHTML = "";
    const dados = [];
    snapshot.forEach(child => dados.push(child.val()));
    dados.reverse().forEach((jogador, i) => {
      const div = document.createElement("div");
      div.textContent = `${i + 1}. ${jogador.nome} - ${abreviar(jogador.cliques)} cliques`;
      container.appendChild(div);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  gameState.playerName = prompt("Digite seu nome para entrar no ranking:");
  if (!gameState.playerName) gameState.playerName = "Jogador";
  init();
});

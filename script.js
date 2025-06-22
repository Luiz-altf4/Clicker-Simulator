// === Import Firebase SDKs ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Config Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com/",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
  measurementId: "G-ZXXWCDTY9D",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Estado do jogo ===
let gameState = {
  clicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,
  currentWorld: 1,
  buyAmount: 1,
  upgrades: [],
  shopItems: [],
  pets: [],
  achievements: [],
  missions: [],
  activePetId: null,
};

// === DOM shortcuts ===
const el = id => document.getElementById(id);

// === Utils ===
function formatNumber(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão"];
  return worlds[id - 1] || "???";
}

// === Display Atualização ===
function updateDisplay() {
  el("clicksDisplay").textContent = formatNumber(gameState.clicks);
  el("cpsDisplay").textContent = formatNumber(calcCPS());
  el("levelDisplay").textContent = gameState.level;
  el("xpDisplay").textContent = formatNumber(gameState.xp);
  el("xpToNextLevel").textContent = formatNumber(gameState.xpToNext);
  el("rebirthCount").textContent = gameState.rebirths;
  el("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;
}

// === Calcula CPS ===
function calcCPS() {
  let baseCPS = 0;
  for (const upgrade of gameState.upgrades) {
    baseCPS += (upgrade.cps || 0) * (upgrade.quantity || 0);
  }
  let multiplier = 1;

  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) multiplier += pet.bonusPercent / 100;
  }

  const shopX5 = gameState.shopItems.find(i => i.name.includes("x5") && i.owned);
  const shopX2 = gameState.shopItems.find(i => i.name.includes("x2") && i.owned);

  if (shopX5) multiplier *= 5;
  else if (shopX2) multiplier *= 2;

  return baseCPS * multiplier;
}

// === Ganho de XP ===
function gainXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.3);
  }
}

// === Função de click principal ===
function handleClick() {
  let gain = 1;
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) gain *= 1 + pet.bonusPercent / 100;
  }
  gameState.clicks += gain;
  gainXP(5);
  updateDisplay();
  saveGame();
  triggerClickEffect();
}

// === Salvar no localStorage ===
function saveGame() {
  try {
    const saveData = JSON.stringify(gameState);
    localStorage.setItem("clickerSave", saveData);
  } catch (e) {
    console.warn("Erro ao salvar jogo:", e);
  }
}

// === Carregar do localStorage ===
function loadGame() {
  try {
    const saveStr = localStorage.getItem("clickerSave");
    if (!saveStr) return;
    const save = JSON.parse(saveStr);
    Object.assign(gameState, save);
  } catch (e) {
    console.warn("Erro ao carregar jogo:", e);
  }
}

// === Auto Clicker ===
let autoClickerInterval = null;

function startAutoClicker() {
  if (autoClickerInterval) return;
  autoClickerInterval = setInterval(() => {
    handleClick();
  }, 1000);
}

function stopAutoClicker() {
  if (!autoClickerInterval) return;
  clearInterval(autoClickerInterval);
  autoClickerInterval = null;
}

// === Ranking Firebase ===
function saveScoreToFirebase(name) {
  if (!name || name.trim().length < 3) {
    alert("Nome inválido! Insira pelo menos 3 caracteres.");
    return;
  }
  const rankingRef = ref(db, "ranking");
  const userRef = push(rankingRef);
  set(userRef, { name: name.trim(), score: Math.floor(gameState.clicks) })
    .then(() => {
      alert("Score salvo com sucesso!");
      el("playerNameInput").value = "";
    })
    .catch(err => {
      alert("Erro ao salvar score. Tente novamente.");
      console.error(err);
    });
}

function loadRankingFromFirebase() {
  const listEl = el("rankingList");
  const rankingRef = ref(db, "ranking");
  onValue(rankingRef, snapshot => {
    const data = [];
    snapshot.forEach(childSnap => {
      data.push(childSnap.val());
    });
    const sorted = data.sort((a, b) => b.score - a.score).slice(0, 10);
    listEl.innerHTML = sorted
      .map((item, i) => `<div>#${i + 1} - ${item.name}: ${formatNumber(item.score)}</div>`)
      .join("");
  }, { onlyOnce: false });
}

// === Partículas e efeitos ao clicar ===
function triggerClickEffect() {
  // Se quiser, aqui pode adicionar animação/partículas visuais
  // Exemplo simples:
  const container = el("container");
  if (!container) return;
  const particle = document.createElement("span");
  particle.className = "click-particle";
  particle.style.left = `${Math.random() * 80 + 10}%`;
  particle.style.top = `${Math.random() * 80 + 10}%`;
  container.appendChild(particle);
  setTimeout(() => container.removeChild(particle), 800);
}

// === Eventos dos botões ===
function setupEventListeners() {
  el("clickBtn").addEventListener("click", handleClick);

  el("saveScoreBtn").addEventListener("click", () => {
    const name = el("playerNameInput").value;
    saveScoreToFirebase(name);
  });

  el("toggleTheme").addEventListener("click", () => {
    document.body.classList.toggle("light-theme");
    el("toggleTheme").textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
  });
}

// === Inicialização ===
function init() {
  loadGame();
  updateDisplay();
  setupEventListeners();
  loadRankingFromFirebase();

  // Auto clicks passivos (CPS)
  setInterval(() => {
    const cps = calcCPS();
    gameState.clicks += cps;
    gainXP(cps);
    updateDisplay();
    saveGame();
  }, 1000);
}

window.addEventListener("load", init);
window.addEventListener("beforeunload", saveGame);

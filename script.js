import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

const el = id => document.getElementById(id);

let clicks = 0;
let level = 1;
let xp = 0;
let xpToNext = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;

let upgrades = [];
let shopItems = [];
let pets = [];
let achievements = [];
let missions = [];
let activePetId = null;

let cpsIntervalId = null;

// --- Formatar números com unidades ---
function format(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while(n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

function getWorldName() {
  const worlds = ["Jardim Inicial","Cidade Neon","Espaço","Dimensão"];
  return worlds[currentWorld - 1] || "???";
}

function display() {
  el("clicksDisplay").textContent = format(clicks);
  el("cpsDisplay").textContent = format(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = format(xp);
  el("xpToNextLevel").textContent = format(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;
}

function calcCPS() {
  let base = 0;
  if (!Array.isArray(upgrades)) upgrades = [];
  if (!Array.isArray(pets)) pets = [];
  if (!Array.isArray(shopItems)) shopItems = [];

  upgrades.forEach(u => {
    base += (u.cps || 0) * (u.quantity || 0);
  });

  let mult = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) mult += (pet.bonusPercent || 0) / 100;
  }

  const hasX5 = shopItems.find(i => i.name?.includes("x5") && i.owned);
  const hasX2 = shopItems.find(i => i.name?.includes("x2") && i.owned);
  if (hasX5) mult *= 5;
  else if (hasX2) mult *= 2;

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

// --- Função para salvar jogo no localStorage com debounce ---
let saveTimeout = null;
function saveGame() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const saveData = {
        clicks, level, xp, xpToNext, rebirths, currentWorld, buyAmount,
        upgrades, shopItems, pets, achievements, missions, activePetId
      };
      localStorage.setItem("clickerSave", JSON.stringify(saveData));
      //console.log("Jogo salvo");
    } catch(e) {
      console.error("Erro ao salvar jogo:", e);
    }
  }, 500); // Salva 0.5s após última chamada
}

function loadGame() {
  try {
    const save = localStorage.getItem("clickerSave");
    if (!save) return;
    const data = JSON.parse(save);
    clicks = data.clicks ?? 0;
    level = data.level ?? 1;
    xp = data.xp ?? 0;
    xpToNext = data.xpToNext ?? 100;
    rebirths = data.rebirths ?? 0;
    currentWorld = data.currentWorld ?? 1;
    buyAmount = data.buyAmount ?? 1;
    upgrades = Array.isArray(data.upgrades) ? data.upgrades : [];
    shopItems = Array.isArray(data.shopItems) ? data.shopItems : [];
    pets = Array.isArray(data.pets) ? data.pets : [];
    achievements = Array.isArray(data.achievements) ? data.achievements : [];
    missions = Array.isArray(data.missions) ? data.missions : [];
    activePetId = data.activePetId ?? null;
  } catch(e) {
    console.error("Erro ao carregar jogo:", e);
  }
}

// --- Botão clique principal com animação ---
function animateClickBtn() {
  const btn = el("clickBtn");
  btn.classList.add("clicked");
  setTimeout(() => btn.classList.remove("clicked"), 150);
}

// --- Evento do clique ---
el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) gain *= 1 + (pet.bonusPercent || 0) / 100;
  }
  clicks += gain;
  gainXP(5);
  display();
  saveGame();
  animateClickBtn();
};

// --- CPS automático ---
function startCPSInterval() {
  if (cpsIntervalId) clearInterval(cpsIntervalId);
  cpsIntervalId = setInterval(() => {
    const gain = calcCPS();
    clicks += gain;
    gainXP(gain);
    display();
    saveGame();
  }, 1000);
}

// --- Firebase salvar score ---
let saveBtnLocked = false;
async function saveScore() {
  if (saveBtnLocked) return;
  const nameInput = el("playerNameInput");
  const saveBtn = el("saveScoreBtn");
  const name = nameInput.value.trim();

  if (!name || name.length < 3) {
    alert("Nome inválido! Use pelo menos 3 caracteres.");
    return;
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(name)) {
    alert("Nome deve conter apenas letras, números e espaços.");
    return;
  }

  saveBtnLocked = true;
  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    const userRef = push(ref(db, "ranking"));
    await set(userRef, { name, score: Math.floor(clicks) });
    nameInput.value = "";
    alert("Score salvo com sucesso!");
    await loadRanking();
  } catch (e) {
    console.error("Erro ao salvar score:", e);
    alert("Erro ao salvar score. Tente novamente.");
  } finally {
    saveBtnLocked = false;
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar Score";
  }
}

// --- Firebase carregar ranking ---
async function loadRanking() {
  const list = el("rankingList");
  list.textContent = "Carregando ranking...";

  try {
    const snapshot = await get(ref(db, "ranking"));
    if (!snapshot.exists()) {
      list.textContent = "Nenhum score salvo ainda.";
      return;
    }
    const data = [];
    snapshot.forEach(child => data.push(child.val()));
    const sorted = data.sort((a,b) => b.score - a.score).slice(0, 10);
    list.innerHTML = sorted.map((e,i) => `<div>#${i+1} ${e.name}: ${format(e.score)}</div>`).join("");
  } catch (e) {
    console.error("Erro ao carregar ranking:", e);
    list.textContent = "Erro ao carregar ranking.";
  }
}

// --- Toggle tema claro/escuro ---
function updateThemeIcon() {
  const toggleBtn = el("toggleTheme");
  if (document.body.classList.contains("light-theme")) {
    toggleBtn.textContent = "☀️";
    toggleBtn.title = "Modo claro";
  } else {
    toggleBtn.textContent = "🌙";
    toggleBtn.title = "Modo escuro";
  }
}

el("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  updateThemeIcon();
  saveGame();
};

document.addEventListener("DOMContentLoaded", () => {
  loadGame();
  display();
  loadRanking();
  startCPSInterval();
  updateThemeIcon();

  el("saveScoreBtn").addEventListener("click", saveScore);
});

// --- Salvar jogo antes de fechar/atualizar a página ---
window.addEventListener("beforeunload", () => {
  saveGame();
});

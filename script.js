import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Config Firebase
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

// DOM helpers
const el = id => document.getElementById(id);

// Estado inicial do jogo
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNext = 100;
let rebirths = 0;
let currentWorld = 1;
let buyAmount = 1;

let upgrades = [];  // Preencha seus upgrades aqui ou carregue dinamicamente
let shopItems = [];
let pets = [];
let achievements = [];
let missions = [];

let activePetId = null;

// === Formatação de números
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

// === Nome dos mundos
function getWorldName() {
  const worlds = ["Jardim Inicial","Cidade Neon","Espaço","Dimensão"];
  return worlds[currentWorld - 1] || "???";
}

// === Atualiza a tela com valores atuais
function display() {
  el("clicksDisplay").textContent = format(clicks);
  el("cpsDisplay").textContent = format(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = format(xp);
  el("xpToNextLevel").textContent = format(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;
}

// === Cálculo de clicks por segundo (CPS)
function calcCPS() {
  let base = 0;
  upgrades.forEach(u => base += (u.cps || 0) * (u.quantity || 0));
  let mult = 1;
  if (activePetId) {
    const pet = pets.find(p => p.id === activePetId);
    if (pet) mult += (pet.bonusPercent || 0) / 100;
  }
  if (shopItems.find(i => i.name?.includes("x5") && i.owned)) mult *= 5;
  else if (shopItems.find(i => i.name?.includes("x2") && i.owned)) mult *= 2;
  return base * mult;
}

// === Ganhar XP e subir de nível
function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level++;
    xpToNext = Math.floor(xpToNext * 1.3);
  }
}

// === Salvar estado no localStorage
function saveGame() {
  const saveData = {
    clicks, cps, level, xp, xpToNext, rebirths, currentWorld, buyAmount,
    upgrades, shopItems, pets, achievements, missions, activePetId
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

// === Carregar estado do localStorage
function loadGame() {
  const save = localStorage.getItem("clickerSave");
  if (!save) return;
  try {
    const data = JSON.parse(save);
    clicks = data.clicks ?? 0;
    cps = data.cps ?? 0;
    level = data.level ?? 1;
    xp = data.xp ?? 0;
    xpToNext = data.xpToNext ?? 100;
    rebirths = data.rebirths ?? 0;
    currentWorld = data.currentWorld ?? 1;
    buyAmount = data.buyAmount ?? 1;
    upgrades = data.upgrades ?? [];
    shopItems = data.shopItems ?? [];
    pets = data.pets ?? [];
    achievements = data.achievements ?? [];
    missions = data.missions ?? [];
    activePetId = data.activePetId ?? null;
  } catch(e) {
    console.error("Erro ao carregar save:", e);
  }
}

// === Eventos do botão de clique
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
};

// === Incremento automático (CPS)
setInterval(() => {
  const gain = calcCPS();
  clicks += gain;
  gainXP(gain);
  display();
  saveGame();
}, 1000);

// === Firebase: salvar score com async/await e validação
async function saveScore() {
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

  saveBtn.disabled = true;
  saveBtn.textContent = "Salvando...";

  try {
    const userRef = push(ref(db, "ranking"));
    await set(userRef, { name, score: Math.floor(clicks) });
    nameInput.value = "";
    alert("Score salvo com sucesso!");
    await loadRanking();
  } catch (err) {
    console.error("Erro ao salvar score:", err);
    alert("Erro ao salvar score. Tente novamente.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Salvar Score";
  }
}

// === Firebase: carregar ranking
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
    snapshot.forEach(child => {
      data.push(child.val());
    });

    const sorted = data.sort((a,b) => b.score - a.score).slice(0, 10);

    list.innerHTML = sorted
      .map((e,i) => `<div>#${i+1} ${e.name}: ${format(e.score)}</div>`)
      .join("");

  } catch (err) {
    console.error("Erro ao carregar ranking:", err);
    list.textContent = "Erro ao carregar ranking.";
  }
}

// === Tema claro/escuro
el("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  el("toggleTheme").textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
};

// === Inicialização da página
window.addEventListener("load", () => {
  loadGame();
  display();
  loadRanking();

  el("saveScoreBtn").addEventListener("click", saveScore);
});

// === Firebase imports e instanciações
// Você precisa manter essas linhas no topo do arquivo:
// import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
// import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// const app = initializeApp(firebaseConfig);
// const db = getDatabase(app);

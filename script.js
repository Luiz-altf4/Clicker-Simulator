// === Firebase Config ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// === Estado do Jogo ===
let clicks = 0, cps = 0, level = 1, xp = 0, xpToNext = 100, rebirths = 0, currentWorld = 1, buyAmount = 1;
let upgrades = [...]; // Use seus upgrades
let shopItems = [...]; // Itens da loja
let pets = [...]; // Lista de pets
let achievements = [...];
let missions = [...];
let activePetId = null;

// === DOM Elements ===
const el = id => document.getElementById(id);
const display = () => {
  el("clicksDisplay").textContent = format(clicks);
  el("cpsDisplay").textContent = format(calcCPS());
  el("levelDisplay").textContent = level;
  el("xpDisplay").textContent = format(xp);
  el("xpToNextLevel").textContent = format(xpToNext);
  el("rebirthCount").textContent = rebirths;
  el("currentWorld").textContent = `${currentWorld} - ${getWorldName()}`;
};

// === Utilidades ===
function format(n) {
  if (n < 1000) return n.toFixed(0);
  const units = ["K","M","B","T","Qa","Qi","Sx","Sp","Oc","No","De"];
  let i = -1;
  while(n >= 1000 && i < units.length-1) { n /= 1000; i++; }
  return n.toFixed(2)+units[i];
}
function getWorldName() {
  const w = ["Jardim Inicial","Cidade Neon","Espaço","Dimensão"];
  return w[currentWorld-1] || "???";
}

// === Clicks ===
el("clickBtn").onclick = () => {
  let gain = 1;
  if (activePetId) gain *= 1 + pets.find(p => p.id === activePetId).bonusPercent / 100;
  clicks += gain;
  gainXP(5);
  display();
};

// === CPS Auto ===
setInterval(() => {
  const gain = calcCPS();
  clicks += gain;
  gainXP(gain);
  display();
}, 1000);

function calcCPS() {
  let base = 0;
  upgrades.forEach(u => base += u.cps * u.quantity);
  let mult = 1;
  if (activePetId) mult += pets.find(p => p.id === activePetId).bonusPercent / 100;
  if (shopItems.find(i => i.name.includes("x5"))?.owned) mult *= 5;
  else if (shopItems.find(i => i.name.includes("x2"))?.owned) mult *= 2;
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

// === Firebase Ranking ===
el("saveScoreBtn").onclick = () => {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) return alert("Nome inválido!");
  const userRef = push(ref(db, "ranking"));
  set(userRef, { name, score: Math.floor(clicks) });
  el("playerNameInput").value = "";
};

function loadRanking() {
  const list = el("rankingList");
  onValue(ref(db, "ranking"), snap => {
    const data = [];
    snap.forEach(child => data.push(child.val()));
    const sorted = data.sort((a,b) => b.score - a.score).slice(0, 10);
    list.innerHTML = sorted.map((e,i) => `<div>#${i+1} ${e.name}: ${format(e.score)}</div>`).join("");
  });
}

// === Outros (tema, salvar, carregar) ===
el("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  el("toggleTheme").textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
};

window.addEventListener("beforeunload", () => {
  localStorage.setItem("clickerSave", JSON.stringify({ clicks, level, xp, xpToNext, rebirths }));
});

window.addEventListener("load", () => {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    const s = JSON.parse(save);
    clicks = s.clicks;
    level = s.level;
    xp = s.xp;
    xpToNext = s.xpToNext;
    rebirths = s.rebirths;
  }
  display();
  loadRanking();
});

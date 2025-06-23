// Importações Firebase (coloque no seu index.html ou adapte seu firebase.js separado)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// --- CONFIGURAÇÃO FIREBASE ---
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  databaseURL: "SUA_DATABASE_URL",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID",
  measurementId: "SEU_MEASUREMENT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- FUNÇÃO UTILITÁRIA DE ABREVIAÇÃO DE NÚMEROS ---
function abreviarNum(num) {
  const sufixos = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No"];
  let i = 0;
  while (num >= 1000 && i < sufixos.length - 1) {
    num /= 1000;
    i++;
  }
  return num.toFixed(2).replace(/\.00$/, "") + sufixos[i];
}

// --- ATALHO PARA ID ---
const $ = id => document.getElementById(id);

// --- ESTADO DO JOGO ---
const gameState = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  multiplier: 1,
  xp: 0,
  level: 1,
  xpToNext: 100,
  rebirths: 0,
  prestigeBonus: 1,
  upgrades: [],
  playerName: '',
  lastChatTimestamp: 0,
  theme: "dark",
};

// --- DADOS DOS UPGRADES ---
const upgradesData = [
  { id: 1, name: "🖱️ Click Básico", bonusClick: 1, cps: 0, price: 10 },
  { id: 2, name: "⚙️ Click Avançado", bonusClick: 0, cps: 1, price: 100 },
  { id: 3, name: "🏠 Casa de Click", bonusClick: 0, cps: 5, price: 500 },
  { id: 4, name: "🏢 Prédio de Click", bonusClick: 0, cps: 20, price: 2000 },
  { id: 5, name: "🧪 Laboratório de Click", bonusClick: 0, cps: 50, price: 10000 },
  { id: 6, name: "🏭 Fábrica de Click", bonusClick: 0, cps: 150, price: 50000 },
  { id: 7, name: "🌆 Cidade de Click", bonusClick: 0, cps: 500, price: 250000 },
  { id: 8, name: "🌍 País de Click", bonusClick: 0, cps: 2500, price: 1_000_000 }
];

// --- INICIALIZAÇÃO DE UPGRADES ---
function initUpgrades() {
  gameState.upgrades = upgradesData.map(u => ({ ...u, owned: 0 }));
}

// --- RENDERIZAÇÃO DE UPGRADES ---
function renderUpgrades() {
  const container = $("upgradesContainer");
  container.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const podeComprar = gameState.clicks >= upg.price;
    const btn = `
      <button ${podeComprar ? "" : "disabled"} onclick="buyUpgrade(${upg.id})">
        Comprar
      </button>
    `;
    const div = document.createElement("div");
    div.className = "upgrade";
    div.innerHTML = `
      <h3>${upg.name}</h3>
      <p>Preço: ${abreviarNum(upg.price)}</p>
      <p>Possui: ${upg.owned}</p>
      ${btn}
    `;
    container.appendChild(div);
  });
}

// --- FUNÇÃO PARA COMPRAR UPGRADE ---
window.buyUpgrade = function(id) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg) return;
  if (gameState.clicks < upg.price) return alert("Você não tem clicks suficientes!");
  
  gameState.clicks -= upg.price;
  upg.owned++;
  
  // Atualiza cps e multiplicador
  recalcStats();
  
  // Aumenta o preço com fator exponencial
  upg.price = Math.floor(upg.price * 1.35);

  renderUpgrades();
  updateDisplay();
  saveGame();
}

// --- RECALCULA CPS E MULTIPLICADOR COM BASE NOS UPGRADES E REBIRTHS ---
function recalcStats() {
  let cps = 0;
  let multiplier = 1 + gameState.prestigeBonus * 0.1; // bônus por prestígio
  gameState.upgrades.forEach(u => {
    cps += u.cps * u.owned;
    multiplier += u.bonusClick * u.owned;
  });
  gameState.cps = cps;
  gameState.multiplier = multiplier;
}

// --- ATUALIZA DISPLAY ---
function updateDisplay() {
  $("clicksDisplay").textContent = `Cliques: ${abreviarNum(gameState.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${abreviarNum(gameState.cps)}`;
  $("levelDisplay").textContent = `Nível: ${gameState.level}`;
  $("xpFill").style.width = `${Math.min(100, (gameState.xp / gameState.xpToNext) * 100)}%`;
  $("xpText").textContent = `XP: ${abreviarNum(gameState.xp)} / ${abreviarNum(gameState.xpToNext)}`;
  $("rebirthDisplay").textContent = `Rebirths: ${gameState.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${gameState.prestigeBonus.toFixed(2)}x`;
}

// --- GANHAR CLIQUE ---
function gainClick() {
  gameState.clicks += gameState.multiplier;
  gameState.totalClicks += gameState.multiplier;
  gainXP(1 * gameState.multiplier);
  updateDisplay();
}

// --- GANHAR XP ---
function gainXP(amount) {
  gameState.xp += amount;
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp -= gameState.xpToNext;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
  }
}

// --- REBIRTH / PRESTÍGIO ---
function rebirth() {
  if (gameState.level < 10) return alert("Alcance nível 10 para rebirth!");
  const bonusGanhos = Math.floor(gameState.level / 10);
  gameState.rebirths++;
  gameState.prestigeBonus += bonusGanhos;
  // Resetar estado
  gameState.clicks = 0;
  gameState.cps = 0;
  gameState.multiplier = 1;
  gameState.xp = 0;
  gameState.level = 1;
  gameState.xpToNext = 100;
  initUpgrades();
  recalcStats();
  updateDisplay();
  renderUpgrades();
  saveGame();
  alert(`Rebirth realizado! Prestígio aumentado em ${bonusGanhos}x.`);
}

// --- SALVAR JOGO ---
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

// --- CARREGAR JOGO ---
function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(gameState, saved);

    // Corrigir upgrades para manter estrutura correta
    gameState.upgrades = upgradesData.map(u => {
      const su = saved.upgrades?.find(s => s.id === u.id);
      return su ? su : { ...u, owned: 0 };
    });
  } else {
    initUpgrades();
  }
  recalcStats();
}

// --- INTERVALO PARA GERAR CPS AUTOMÁTICO ---
function startCPSInterval() {
  setInterval(() => {
    gameState.clicks += gameState.cps;
    gainXP(gameState.cps);
    updateDisplay();
  }, 1000);
}

// --- FUNÇÕES FIREBASE RANKING ---

function enviarRanking() {
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
    dados.sort((a,b) => b.cliques - a.cliques); // Descendente
    dados.forEach((jogador, i) => {
      const div = document.createElement("div");
      div.textContent = `${i + 1}. ${jogador.nome} - ${abreviarNum(jogador.cliques)} cliques`;
      container.appendChild(div);
    });
  });
}

// --- CHAT GLOBAL FIREBASE ---
function enviarChat(msg) {
  if (!msg.trim()) return;
  if (Date.now() - gameState.lastChatTimestamp < 3000) {
    alert("Aguarde 3 segundos entre mensagens para evitar spam!");
    return;
  }
  gameState.lastChatTimestamp = Date.now();

  const chatRef = ref(db, "chat");
  const novo = push(chatRef);
  set(novo, {
    nome: gameState.playerName,
    mensagem: msg,
    data: Date.now()
  });
}

function carregarChat() {
  const chatRef = query(ref(db, "chat"), orderByChild("data"), limitToLast(50));
  onValue(chatRef, snapshot => {
    const container = $("chatMessages");
    container.innerHTML = "";
    snapshot.forEach(child => {
      const msg = child.val();
      const div = document.createElement("div");
      div.textContent = `[${new Date(msg.data).toLocaleTimeString()}] ${msg.nome}: ${msg.mensagem}`;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    });
  });
}

// --- CONTROLE DE TEMA (Claro/Escuro) ---
function loadTheme() {
  const tema = localStorage.getItem("theme") || "dark";
  gameState.theme = tema;
  document.body.classList.toggle("light-theme", tema === "light");
}

function toggleTheme() {
  if (gameState.theme === "dark") {
    gameState.theme = "light";
    document.body.classList.add("light-theme");
  } else {
    gameState.theme = "dark";
    document.body.classList.remove("light-theme");
  }
  localStorage.setItem("theme", gameState.theme);
}

// --- BOTÕES E EVENTOS ---
function setupButtons() {
  $("clickBtn").addEventListener("click", gainClick);
  $("rebirthBtn").addEventListener("click", rebirth);
  $("saveBtn").addEventListener("click", () => {
    saveGame();
    alert("Jogo salvo!");
  });
  $("themeBtn").addEventListener("click", toggleTheme);

  $("sendChat").addEventListener("click", () => {
    const msg = $("chatInput").value;
    enviarChat(msg);
    $("chatInput").value = "";
  });

  $("chatInput").addEventListener("keypress", e => {
    if (e.key === "Enter") {
      $("sendChat").click();
    }
  });
}

// --- INICIALIZAÇÃO GERAL ---
function init() {
  gameState.playerName = prompt("Digite seu nome para o ranking:") || "Jogador";

  loadTheme();
  loadGame();
  renderUpgrades();
  updateDisplay();
  carregarRanking();
  carregarChat();
  setupButtons();
  startCPSInterval();

  // Atualizar ranking e salvar jogo a cada 10 segundos
  setInterval(() => {
    enviarRanking();
    saveGame();
  }, 10000);
}

window.addEventListener("DOMContentLoaded", init);

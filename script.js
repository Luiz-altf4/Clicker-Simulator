import {
  getDatabase, ref, push, set, onValue, query, orderByChild, limitToLast
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// Utils
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

// Game State
const gameState = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  multiplier: 1,
  xp: 0,
  level: 1,
  xpToNext: 100,
  rebirths: 0,
  prestigePoints: 0,
  upgrades: [],
  playerName: '',
  lastChatTimestamp: 0
};

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

// Firebase DB ref - já inicializado no firebase.js
const db = getDatabase();

// Inicializa upgrades no gameState
function initUpgrades() {
  gameState.upgrades = upgradesData.map(u => ({ ...u, owned: 0 }));
}

// Renderização de upgrades
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
      <button ${gameState.clicks < upg.price ? "disabled" : ""} onclick="buyUpgrade(${upg.id})">Comprar</button>
    `;
    container.appendChild(div);
  });
}

// Comprar upgrade
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

// Atualizar display geral
function updateDisplay() {
  $("clicksDisplay").textContent = `Cliques: ${abreviar(gameState.clicks)}`;
  $("cpsDisplay").textContent = `CPS: ${abreviar(gameState.cps)}`;
  $("rebirthsDisplay").textContent = `Rebirths: ${gameState.rebirths}`;
  $("prestigeDisplay").textContent = `Prestígio: ${gameState.prestigePoints}`;
  $("xpFill").style.width = `${(gameState.xp / gameState.xpToNext) * 100}%`;
  $("xpText").textContent = `XP: ${gameState.xp} / ${gameState.xpToNext}`;
}

// Ganhar clique
function gainClick() {
  gameState.clicks += gameState.multiplier;
  gameState.totalClicks += gameState.multiplier;
  gainXP(1);
  updateDisplay();
}

function gainXP(amount) {
  gameState.xp += amount;
  if (gameState.xp >= gameState.xpToNext) {
    gameState.level++;
    gameState.xp = 0;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.25);
  }
}

// Intervalo de CPS
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

// Salvamento local
function saveGame() {
  localStorage.setItem("clickerSave", JSON.stringify(gameState));
}

function loadGame() {
  const data = localStorage.getItem("clickerSave");
  if (data) {
    const saved = JSON.parse(data);
    Object.assign(gameState, saved);
    // Atualiza upgrades preço e owned pra garantir estrutura correta
    gameState.upgrades.forEach(u => {
      const savedU = saved.upgrades?.find(su => su.id === u.id);
      if (savedU) {
        u.owned = savedU.owned || 0;
        u.price = savedU.price || u.price;
      }
    });
  } else {
    initUpgrades();
  }
}

// Ranking Firebase
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

// Chat Firebase
function enviarChat(msg) {
  if (!msg.trim()) return;
  if (Date.now() - gameState.lastChatTimestamp < 3000) {
    alert("Espere 3 segundos entre mensagens para evitar spam!");
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

// Abas (tabs)
function initTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      document.querySelectorAll(".tab-content").forEach(tc => tc.style.display = "none");
      const activeContent = document.getElementById(tab.dataset.tab);
      if (activeContent) activeContent.style.display = "block";
    });
  });
}

// Tema claro / escuro
function toggleTheme() {
  document.body.classList.toggle("light-theme");
  const isLight = document.body.classList.contains("light-theme");
  localStorage.setItem("theme", isLight ? "light" : "dark");
}

function loadTheme() {
  const theme = localStorage.getItem("theme") || "dark";
  if (theme === "light") document.body.classList.add("light-theme");
}

// Resetar progresso
function resetGame() {
  if (!confirm("Tem certeza que quer resetar todo o progresso?")) return;
  localStorage.removeItem("clickerSave");
  location.reload();
}

// Inicialização geral
function init() {
  gameState.playerName = prompt("Digite seu nome para entrar no ranking:") || "Jogador";
  loadTheme();
  loadGame();
  renderUpgrades();
  updateDisplay();
  carregarRanking();
  carregarChat();
  initTabs();

  $("clickBtn").addEventListener("click", gainClick);
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
  $("toggleTheme").addEventListener("click", toggleTheme);
  $("manualSave").addEventListener("click", () => {
    saveGame();
    alert("Jogo salvo manualmente!");
  });
  $("resetProgress").addEventListener("click", resetGame);

  startIntervals();
}

window.addEventListener("DOMContentLoaded", init);

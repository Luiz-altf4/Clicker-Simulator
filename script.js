// =======================
// 🔥 Configuração Firebase
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getDatabase, ref, set, get, onValue, update, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.firebasestorage.app",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
  measurementId: "G-ZXXWCDTY9D"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

// ============================
// 🎮 Variáveis Globais do Jogo
// ============================
let clicks = 0;
let cps = 0;
let xp = 0;
let nivel = 1;
let rebirths = 0;
let pets = [];
let upgrades = [];
let conquistas = [];
let missoes = [];
let nomeUsuario = `Player${Math.floor(Math.random() * 10000)}`;
let theme = "dark";
let xpPorClique = 1;
let clicksPorClique = 1;

// =====================
// 🎯 Elementos do DOM
// =====================
const clickBtn = document.getElementById("clickBtn");
const clicksText = document.getElementById("clicks");
const levelText = document.getElementById("level");
const xpFill = document.getElementById("xpFill");
const xpText = document.getElementById("xpText");
const rankingList = document.getElementById("rankingList");

// ==========================
// 🖱️ Sistema de Clique
// ==========================
clickBtn.addEventListener("click", () => {
  clicks += clicksPorClique;
  xp += xpPorClique;
  atualizarInterface();
  verificarLevelUp();
  verificarMissoes();
  animarClique();
});

function atualizarInterface() {
  clicksText.textContent = `Cliques: ${clicks}`;
  xpText.textContent = `XP: ${xp} / ${nivel * 100}`;
  levelText.textContent = `Nível: ${nivel}`;
  xpFill.style.width = `${(xp / (nivel * 100)) * 100}%`;
}

function verificarLevelUp() {
  if (xp >= nivel * 100) {
    xp -= nivel * 100;
    nivel++;
    xpPorClique++;
  }
}

function animarClique() {
  clickBtn.classList.add("clicked");
  setTimeout(() => clickBtn.classList.remove("clicked"), 100);
}

// =============================
// 💾 Salvamento Automático Local
// =============================
setInterval(() => salvarProgresso(), 10000);

function salvarProgresso() {
  const saveData = {
    clicks, cps, xp, nivel, rebirths,
    pets, upgrades, conquistas, missoes,
    nomeUsuario, theme
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

function carregarProgresso() {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    const data = JSON.parse(save);
    clicks = data.clicks;
    cps = data.cps;
    xp = data.xp;
    nivel = data.nivel;
    rebirths = data.rebirths;
    pets = data.pets;
    upgrades = data.upgrades;
    conquistas = data.conquistas;
    missoes = data.missoes;
    nomeUsuario = data.nomeUsuario;
    theme = data.theme;
    atualizarInterface();
  }
}

carregarProgresso();

// ===========================
// 🛠️ Sistema de Upgrades
// ===========================
const upgradeList = document.getElementById("upgradeList");

const upgradeData = [
  { nome: "Clique +1", preco: 50, efeito: () => clicksPorClique++ },
  { nome: "XP +1", preco: 100, efeito: () => xpPorClique++ },
  { nome: "AutoClick +1 CPS", preco: 200, efeito: () => cps++ },
  { nome: "XP Boost 2x", preco: 400, efeito: () => xpPorClique *= 2 },
  { nome: "Clique Boost 2x", preco: 800, efeito: () => clicksPorClique *= 2 },
  { nome: "XP por Tempo +5", preco: 1200, efeito: () => xp += 5 },
  { nome: "Dedo Turbo (3x)", preco: 1500, efeito: () => clicksPorClique *= 3 },
  { nome: "Explosão de XP", preco: 2000, efeito: () => xp += 100 },
  { nome: "CPS Boost x2", preco: 2500, efeito: () => cps *= 2 },
  { nome: "Super Clique +10", preco: 3000, efeito: () => clicksPorClique += 10 },
  { nome: "XP Imediato +500", preco: 3500, efeito: () => xp += 500 },
  { nome: "Auto XP +20", preco: 4000, efeito: () => xp += 20 },
  { nome: "Clique Divino +50", preco: 5000, efeito: () => clicksPorClique += 50 },
  { nome: "XP Supremo +1000", preco: 6000, efeito: () => xp += 1000 },
  { nome: "Modo Insano (CPS x3)", preco: 7000, efeito: () => cps *= 3 }
];

function renderizarUpgrades() {
  upgradeList.innerHTML = "";
  upgradeData.forEach(upg => {
    const btn = document.createElement("button");
    btn.textContent = `${upg.nome} (${upg.preco} cliques)`;
    btn.onclick = () => {
      if (clicks >= upg.preco) {
        clicks -= upg.preco;
        upg.efeito();
        upgrades.push(upg.nome);
        atualizarInterface();
        renderizarUpgrades();
      }
    };
    upgradeList.appendChild(btn);
  });
}

// ===========================
// 🐾 Sistema de Pets
// ===========================
const petList = document.getElementById("petList");

const petData = [
  { nome: "Gato 🐱", preco: 500, efeito: () => { clicksPorClique += 2; } },
  { nome: "Cachorro 🐶", preco: 1000, efeito: () => { xpPorClique += 2; } },
  { nome: "Dragão 🐉", preco: 2500, efeito: () => { clicksPorClique += 5; xpPorClique += 5; } },
  { nome: "Fênix 🔥", preco: 5000, efeito: () => { cps += 5; } },
  { nome: "Robô 🤖", preco: 7500, efeito: () => { clicksPorClique *= 2; } },
  { nome: "Alien 👽", preco: 10000, efeito: () => { xpPorClique *= 2; } }
];

function renderizarPets() {
  petList.innerHTML = "";
  petData.forEach(pet => {
    const btn = document.createElement("button");
    btn.textContent = `${pet.nome} (${pet.preco} cliques)`;
    btn.onclick = () => {
      if (clicks >= pet.preco) {
        clicks -= pet.preco;
        pet.efeito();
        pets.push(pet.nome);
        atualizarInterface();
        renderizarPets();
      }
    };
    petList.appendChild(btn);
  });
}

// Inicializar Upgrades e Pets
renderizarUpgrades();
renderizarPets();

// Parte 3 - Rebirth
const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthCount = document.getElementById("rebirthCount");

rebirthBtn.addEventListener("click", () => {
  const preco = nivel * 500;
  if (clicks >= preco) {
    clicks = 0;
    xp = 0;
    nivel = 1;
    xpPorClique = 1;
    clicksPorClique = 1;
    rebirths++;
    rebirthCount.textContent = `Rebirths: ${rebirths}`;
    atualizarInterface();
  }
});

// Parte 4 - Missões e Conquistas
const missionList = document.getElementById("missionList");
const achievementList = document.getElementById("achievementList");

const missoesData = [
  { nome: "Clique 50x", tipo: "cliques", alvo: 50, feito: false },
  { nome: "Ganhe 3 níveis", tipo: "nivel", alvo: 3, feito: false },
];

const conquistasData = [
  { nome: "Primeiro Pet", cond: () => pets.length >= 1 },
  { nome: "5 Upgrades", cond: () => upgrades.length >= 5 },
];

function verificarMissoes() {
  missoesData.forEach((m, i) => {
    if (!m.feito) {
      if ((m.tipo === "cliques" && clicks >= m.alvo) ||
          (m.tipo === "nivel" && nivel >= m.alvo)) {
        m.feito = true;
        alert(`Missão completa: ${m.nome}`);
        missoes.push(m.nome);
        renderizarMissoes();
      }
    }
  });
}

function renderizarMissoes() {
  missionList.innerHTML = "";
  missoesData.forEach(m => {
    const item = document.createElement("p");
    item.textContent = m.nome + (m.feito ? " ✅" : "");
    missionList.appendChild(item);
  });
}

function renderizarConquistas() {
  achievementList.innerHTML = "";
  conquistasData.forEach(c => {
    if (c.cond() && !conquistas.includes(c.nome)) {
      conquistas.push(c.nome);
      alert(`Conquista desbloqueada: ${c.nome}`);
    }
    const item = document.createElement("p");
    item.textContent = c.nome + (conquistas.includes(c.nome) ? " 🏆" : "");
    achievementList.appendChild(item);
  });
}

// Parte 5 - Ranking Online Firebase
function enviarParaRanking() {
  const usuarioRef = ref(db, `ranking/${nomeUsuario}`);
  set(usuarioRef, {
    nome: nomeUsuario,
    cliques: clicks,
    nivel: nivel,
    rebirths: rebirths
  });
}

function carregarRanking() {
  const rankingRef = ref(db, "ranking");
  onValue(rankingRef, snapshot => {
    rankingList.innerHTML = "";
    const dados = snapshot.val();
    const lista = Object.values(dados || {}).sort((a, b) => b.cliques - a.cliques);
    lista.forEach(jogador => {
      const item = document.createElement("li");
      item.textContent = `${jogador.nome} - ${jogador.cliques} cliques`;
      rankingList.appendChild(item);
    });
  });
}

setInterval(() => {
  enviarParaRanking();
  carregarRanking();
}, 10000);

// Parte 6 - Chat Global
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");
const chatMessages = document.getElementById("chatMessages");

chatSend.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (msg.length < 2 || msg.length > 100) return;
  if (msg.includes("http") || msg.includes("<")) return; // antispam básico

  const novaMsg = {
    usuario: nomeUsuario,
    texto: msg,
    horario: new Date().toLocaleTimeString()
  };
  push(ref(db, "chat"), novaMsg);
  chatInput.value = "";
});

onValue(ref(db, "chat"), snapshot => {
  chatMessages.innerHTML = "";
  const msgs = snapshot.val();
  Object.values(msgs || {}).slice(-20).forEach(m => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${m.usuario}</strong>: ${m.texto}`;
    chatMessages.appendChild(div);
  });
});

// Parte 7 - Tema Escuro/Claro e Sons
const toggleTheme = document.getElementById("toggleTheme");

toggleTheme.addEventListener("click", () => {
  theme = theme === "dark" ? "light" : "dark";
  document.body.className = theme + "-theme";
});

// Parte 8 - Botões de Configuração
document.getElementById("saveBtn").addEventListener("click", salvarProgresso);
document.getElementById("clearSave").addEventListener("click", () => {
  if (confirm("Apagar tudo mesmo?")) {
    localStorage.clear();
    location.reload();
  }
});

// Parte 9 - Auto XP/Clique Loop + Conquistas
setInterval(() => {
  clicks += cps;
  xp += cps;
  atualizarInterface();
  verificarMissoes();
  renderizarConquistas();
}, 1000);

// Inicialização
rebirthCount.textContent = `Rebirths: ${rebirths}`;
renderizarMissoes();
renderizarConquistas();

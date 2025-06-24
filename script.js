import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getDatabase, ref, set, get, onValue, push } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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

// Variáveis globais
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

// Elementos DOM
const clickBtn = document.getElementById("clickBtn");
const clicksText = document.getElementById("clicks");
const levelText = document.getElementById("level");
const xpFill = document.getElementById("xpFill");
const xpText = document.getElementById("xpText");
const rankingList = document.getElementById("rankingList");
const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const chatSend = document.getElementById("chatSend");

// Atualizar interface (cliques, XP, nível)
function atualizarInterface() {
  clicksText.textContent = `Cliques: ${clicks}`;
  xpText.textContent = `XP: ${xp} / ${nivel * 100}`;
  levelText.textContent = `Nível: ${nivel}`;
  xpFill.style.width = `${Math.min(100, (xp / (nivel * 100)) * 100)}%`;
}

// Verificar se subiu de nível
function verificarLevelUp() {
  while (xp >= nivel * 100) {
    xp -= nivel * 100;
    nivel++;
    xpPorClique++;
    // Aqui pode colocar efeitos ou notificações
  }
}

// Animação clique
function animarClique() {
  clickBtn.classList.add("clicked");
  setTimeout(() => clickBtn.classList.remove("clicked"), 100);
}

// Salvar localStorage
function salvarProgresso() {
  const saveData = {
    clicks, cps, xp, nivel, rebirths,
    pets, upgrades, conquistas, missoes,
    nomeUsuario, theme, xpPorClique, clicksPorClique
  };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
}

// Carregar save localStorage
function carregarProgresso() {
  const save = localStorage.getItem("clickerSave");
  if (!save) return;
  try {
    const data = JSON.parse(save);
    clicks = data.clicks || 0;
    cps = data.cps || 0;
    xp = data.xp || 0;
    nivel = data.nivel || 1;
    rebirths = data.rebirths || 0;
    pets = data.pets || [];
    upgrades = data.upgrades || [];
    conquistas = data.conquistas || [];
    missoes = data.missoes || [];
    nomeUsuario = data.nomeUsuario || nomeUsuario;
    theme = data.theme || theme;
    xpPorClique = data.xpPorClique || 1;
    clicksPorClique = data.clicksPorClique || 1;
  } catch (e) {
    console.error("Erro ao carregar save:", e);
  }
}

// Clique botão principal
clickBtn.addEventListener("click", () => {
  clicks += clicksPorClique;
  xp += xpPorClique;
  atualizarInterface();
  verificarLevelUp();
  animarClique();
  salvarProgresso();
});

carregarProgresso();
atualizarInterface();

// Função para enviar jogador ao ranking
function enviarParaRanking() {
  if (!nomeUsuario) return;
  const usuarioRef = ref(db, `ranking/${nomeUsuario}`);
  set(usuarioRef, {
    nome: nomeUsuario,
    cliques: clicks,
    nivel,
    rebirths
  });
}

// Função para carregar ranking do Firebase e renderizar
function carregarRanking() {
  const rankingRef = ref(db, "ranking");
  onValue(rankingRef, snapshot => {
    rankingList.innerHTML = "";
    const dados = snapshot.val();
    if (!dados) {
      rankingList.innerHTML = "<li>Nenhum dado no ranking ainda.</li>";
      return;
    }
    const lista = Object.values(dados);
    lista.sort((a, b) => (b.cliques || 0) - (a.cliques || 0));
    lista.forEach(jogador => {
      const item = document.createElement("li");
      item.textContent = `${jogador.nome || "Anônimo"} - ${jogador.cliques || 0} cliques - Nível: ${jogador.nivel || 1} - Rebirths: ${jogador.rebirths || 0}`;
      rankingList.appendChild(item);
    });
  });
}

// Atualizar ranking a cada 10 segundos
setInterval(() => {
  enviarParaRanking();
  carregarRanking();
}, 10000);

// Inicial carregamento ranking
carregarRanking();

// Enviar mensagem no chat
chatSend.addEventListener("click", () => {
  const msg = chatInput.value.trim();
  if (msg.length < 2 || msg.length > 100) return alert("Mensagem deve ter entre 2 e 100 caracteres.");
  if (msg.includes("http") || msg.includes("<") || msg.includes(">")) return alert("Mensagem inválida.");

  const novaMsg = {
    usuario: nomeUsuario,
    texto: msg,
    horario: new Date().toLocaleTimeString()
  };

  push(ref(db, "chat"), novaMsg);
  chatInput.value = "";
});

// Atualizar mensagens do chat ao vivo
onValue(ref(db, "chat"), snapshot => {
  chatMessages.innerHTML = "";
  const msgs = snapshot.val();
  if (!msgs) return;
  const listaMsgs = Object.values(msgs);
  // Pega as últimas 20 mensagens
  const ultimasMsgs = listaMsgs.slice(-20);
  ultimasMsgs.forEach(m => {
    const div = document.createElement("div");
    div.innerHTML = `<strong>${m.usuario}:</strong> ${m.texto} <span style="font-size:0.7em; color:#666;">${m.horario}</span>`;
    chatMessages.appendChild(div);
  });
  // Scroll para baixo
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

const upgradeList = document.getElementById("upgradeList");
const petList = document.getElementById("petList");

const upgradeData = [
  { nome: "Clique +1", preco: 50, efeito: () => clicksPorClique++ },
  { nome: "XP +1", preco: 100, efeito: () => xpPorClique++ },
  { nome: "AutoClick +1 CPS", preco: 200, efeito: () => cps++ },
  // ... outros upgrades ...
];

const petData = [
  { nome: "Gato 🐱", preco: 500, efeito: () => { clicksPorClique += 2; } },
  { nome: "Cachorro 🐶", preco: 1000, efeito: () => { xpPorClique += 2; } },
  // ... outros pets ...
];

function renderizarUpgrades() {
  upgradeList.innerHTML = "";
  upgradeData.forEach(upg => {
    const btn = document.createElement("button");
    btn.textContent = `${upg.nome} (${upg.preco} cliques)`;
    btn.disabled = clicks < upg.preco; // desabilita botão se sem grana
    btn.onclick = () => {
      if (clicks >= upg.preco) {
        clicks -= upg.preco;
        upg.efeito();
        upgrades.push(upg.nome);
        atualizarInterface();
        salvarProgresso();
        renderizarUpgrades();
        alert(`Upgrade comprado: ${upg.nome}`);
      }
    };
    upgradeList.appendChild(btn);
  });
}

function renderizarPets() {
  petList.innerHTML = "";
  petData.forEach(pet => {
    const btn = document.createElement("button");
    btn.textContent = `${pet.nome} (${pet.preco} cliques)`;
    btn.disabled = clicks < pet.preco;
    btn.onclick = () => {
      if (clicks >= pet.preco) {
        clicks -= pet.preco;
        pet.efeito();
        pets.push(pet.nome);
        atualizarInterface();
        salvarProgresso();
        renderizarPets();
        alert(`Pet comprado: ${pet.nome}`);
      }
    };
    petList.appendChild(btn);
  });
}

renderizarUpgrades();
renderizarPets();

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
  missoesData.forEach(m => {
    if (!m.feito) {
      if ((m.tipo === "cliques" && clicks >= m.alvo) ||
          (m.tipo === "nivel" && nivel >= m.alvo)) {
        m.feito = true;
        missoes.push(m.nome);
        alert(`Missão concluída: ${m.nome}`);
        renderizarMissoes();
      }
    }
  });
}

function renderizarMissoes() {
  missionList.innerHTML = "";
  missoesData.forEach(m => {
    const p = document.createElement("p");
    p.textContent = `${m.nome} ${m.feito ? "✅" : ""}`;
    missionList.appendChild(p);
  });
}

function renderizarConquistas() {
  achievementList.innerHTML = "";
  conquistasData.forEach(c => {
    if (c.cond() && !conquistas.includes(c.nome)) {
      conquistas.push(c.nome);
      alert(`Conquista desbloqueada: ${c.nome}`);
    }
    const p = document.createElement("p");
    p.textContent = `${c.nome} ${conquistas.includes(c.nome) ? "🏆" : ""}`;
    achievementList.appendChild(p);
  });
}

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
    salvarProgresso();
    alert("Rebirth realizado com sucesso!");
  } else {
    alert(`Você precisa de ${preco} cliques para fazer rebirth.`);
  }
});

renderizarMissoes();
renderizarConquistas();
rebirthCount.textContent = `Rebirths: ${rebirths}`;

setInterval(() => {
  clicks += cps;
  xp += cps;
  atualizarInterface();
  verificarLevelUp();
  verificarMissoes();
  renderizarConquistas();
  salvarProgresso();
}, 1000);

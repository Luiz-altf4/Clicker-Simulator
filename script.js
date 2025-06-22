// == Imports Firebase ==
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, onValue } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// == Config Firebase (Sua config, confirme que está correta) ==
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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// == Variáveis globais e estado do jogo ==
const SAVE_VERSION = 2;

let player = {
  clicks: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,
  currentWorld: 1,
  buyAmount: 1,
  theme: "dark",
  upgrades: [],
  shopItems: [],
  pets: [],
  achievements: [],
  missions: [],
  activePetId: null
};

// Estruturas exemplo (pode ser substituído/extendido)
const defaultUpgrades = [
  { id: 1, name: "Auto Clicker", cps: 1, cost: 50, quantity: 0 },
  { id: 2, name: "Click Multiplier", cps: 5, cost: 250, quantity: 0 },
  { id: 3, name: "Mega Clicker", cps: 20, cost: 1000, quantity: 0 },
];

const defaultShopItems = [
  { id: 1, name: "x2 Multiplier", cost: 5000, owned: false },
  { id: 2, name: "x5 Multiplier", cost: 20000, owned: false }
];

const defaultPets = [
  { id: 1, name: "Dragão", bonusPercent: 10, owned: false },
  { id: 2, name: "Fênix", bonusPercent: 25, owned: false }
];

const defaultAchievements = [
  { id: 1, name: "Primeiro clique", desc: "Faça seu primeiro clique", done: false },
  { id: 2, name: "1000 clicks", desc: "Acumule 1000 clicks", done: false }
];

const defaultMissions = [
  { id: 1, desc: "Clique 100 vezes", goal: 100, progress: 0, done: false }
];

// == DOM Helpers ==
const el = id => document.getElementById(id);

// == Formatação números grandes (K, M, B, etc) ==
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

// == Obtém nome do mundo atual ==
function getWorldName(world = player.currentWorld) {
  const names = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão"];
  return names[world - 1] || "???";
}

// == Inicializa dados do jogador, se vazio ==
function initializePlayerData() {
  if (player.upgrades.length === 0) player.upgrades = defaultUpgrades.map(u => ({ ...u }));
  if (player.shopItems.length === 0) player.shopItems = defaultShopItems.map(i => ({ ...i }));
  if (player.pets.length === 0) player.pets = defaultPets.map(p => ({ ...p }));
  if (player.achievements.length === 0) player.achievements = defaultAchievements.map(a => ({ ...a }));
  if (player.missions.length === 0) player.missions = defaultMissions.map(m => ({ ...m }));
}

// == Atualiza UI completa ==
function display() {
  el("clicksDisplay").textContent = formatNumber(player.clicks);
  el("cpsDisplay").textContent = formatNumber(calcCPS());
  el("levelDisplay").textContent = player.level;
  el("xpDisplay").textContent = formatNumber(player.xp);
  el("xpToNextLevel").textContent = formatNumber(player.xpToNext);
  el("rebirthCount").textContent = player.rebirths;
  el("currentWorld").textContent = `${player.currentWorld} - ${getWorldName()}`;

  // Atualiza barra XP
  const xpBar = el("xpBar");
  if (xpBar) {
    xpBar.max = player.xpToNext;
    xpBar.value = player.xp;
  }

  // Atualiza upgrades, loja, pets, conquistas, missões
  renderUpgrades();
  renderShop();
  renderPets();
  renderAchievements();
  renderMissions();
}

// == Calcula CPS total ==
function calcCPS() {
  let baseCPS = 0;
  player.upgrades.forEach(u => {
    baseCPS += (u.cps || 0) * (u.quantity || 0);
  });

  let multiplier = 1;
  // Pet bonus
  if (player.activePetId) {
    const pet = player.pets.find(p => p.id === player.activePetId);
    if (pet && pet.owned) multiplier += pet.bonusPercent / 100;
  }

  // Shop multipliers
  if (player.shopItems.find(i => i.name.includes("x5") && i.owned)) multiplier *= 5;
  else if (player.shopItems.find(i => i.name.includes("x2") && i.owned)) multiplier *= 2;

  return baseCPS * multiplier;
}

// == Ganha XP e sobe nível ==
function gainXP(amount) {
  player.xp += amount;
  let leveledUp = false;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level++;
    player.xpToNext = Math.floor(player.xpToNext * 1.3);
    leveledUp = true;
  }
  if (leveledUp) {
    notify(`Você subiu para o nível ${player.level}!`);
  }
}

// == Renderiza lista upgrades ==
function renderUpgrades() {
  const container = el("upgrades-list");
  container.innerHTML = "";
  player.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade-item";

    div.innerHTML = `
      <div class="upgrade-info">
        <strong>${upg.name}</strong> <br/>
        CPS: ${upg.cps} | Quantidade: ${upg.quantity} <br/>
        Custo: ${formatNumber(upg.cost)}
      </div>
      <button class="btn-buy" aria-label="Comprar ${upg.name}" ${player.clicks < upg.cost ? "disabled" : ""}>Comprar</button>
    `;

    div.querySelector("button").onclick = () => buyUpgrade(upg.id);
    container.appendChild(div);
  });
}

// == Comprar upgrade ==
function buyUpgrade(id) {
  const upg = player.upgrades.find(u => u.id === id);
  if (!upg) return;

  if (player.clicks >= upg.cost) {
    player.clicks -= upg.cost;
    upg.quantity++;
    upg.cost = Math.floor(upg.cost * 1.2); // aumenta custo a cada compra

    notify(`Você comprou ${upg.name}!`);

    display();
  } else {
    alert("Clique insuficiente para comprar esse upgrade.");
  }
}

// == Renderiza loja ==
function renderShop() {
  const container = el("shop-list");
  container.innerHTML = "";
  player.shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shop-item";

    div.innerHTML = `
      <div class="shop-info">
        <strong>${item.name}</strong> <br/>
        Custo: ${formatNumber(item.cost)} <br/>
        Status: ${item.owned ? "<span class='owned'>Comprado</span>" : "<span class='not-owned'>Disponível</span>"}
      </div>
      <button class="btn-buy" aria-label="Comprar ${item.name}" ${item.owned || player.clicks < item.cost ? "disabled" : ""}>Comprar</button>
    `;

    div.querySelector("button").onclick = () => buyShopItem(item.id);
    container.appendChild(div);
  });
}

// == Comprar item da loja ==
function buyShopItem(id) {
  const item = player.shopItems.find(i => i.id === id);
  if (!item) return;

  if (player.clicks >= item.cost && !item.owned) {
    player.clicks -= item.cost;
    item.owned = true;
    notify(`Você comprou ${item.name}!`);

    display();
  } else {
    alert("Não tem clicks suficientes ou já comprado.");
  }
}

// == Renderiza pets ==
function renderPets() {
  const container = el("pets-list");
  container.innerHTML = "";
  player.pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "pet-item";

    const isActive = player.activePetId === pet.id;

    div.innerHTML = `
      <div class="pet-info">
        <strong>${pet.name}</strong> <br/>
        Bônus: +${pet.bonusPercent}% CPS <br/>
        Status: ${pet.owned ? "<span class='owned'>Comprado</span>" : "<span class='not-owned'>Disponível</span>"}
      </div>
      <button class="btn-buy" aria-label="${isActive ? 'Desativar' : 'Ativar'} pet ${pet.name}" 
        ${!pet.owned ? "disabled" : ""}>${isActive ? "Desativar" : "Ativar"}</button>
    `;

    div.querySelector("button").onclick = () => togglePetActive(pet.id);
    container.appendChild(div);
  });
}

// == Ativa/desativa pet ==
function togglePetActive(id) {
  if (player.activePetId === id) {
    player.activePetId = null;
    notify("Pet desativado.");
  } else {
    player.activePetId = id;
    notify("Pet ativado.");
  }
  display();
}

// == Renderiza conquistas ==
function renderAchievements() {
  const container = el("achievements-list");
  container.innerHTML = "";

  player.achievements.forEach(ach => {
    const div = document.createElement("div");
    div.className = "achievement-item " + (ach.done ? "done" : "locked");
    div.innerHTML = `
      <strong>${ach.name}</strong> <br/>
      <small>${ach.desc}</small> <br/>
      Status: ${ach.done ? "<span class='done'>Concluído</span>" : "<span class='locked'>Bloqueado</span>"}
    `;
    container.appendChild(div);
  });
}

// == Renderiza missões ==
function renderMissions() {
  const container = el("missions-list");
  container.innerHTML = "";

  player.missions.forEach(miss => {
    const div = document.createElement("div");
    div.className = "mission-item " + (miss.done ? "done" : "active");

    const progressPercent = Math.min(100, (miss.progress / miss.goal) * 100);

    div.innerHTML = `
      <div class="mission-desc"><strong>${miss.desc}</strong></div>
      <progress value="${miss.progress}" max="${miss.goal}" aria-label="Progresso da missão"></progress>
      <div class="mission-progress">${miss.progress} / ${miss.goal} (${progressPercent.toFixed(1)}%)</div>
      <div>Status: ${miss.done ? "<span class='done'>Concluído</span>" : "<span class='active'>Em progresso</span>"}</div>
    `;

    container.appendChild(div);
  });
}

// == Atualiza missões ao clicar ou receber clicks ==
function updateMissionsOnClick() {
  player.missions.forEach(miss => {
    if (!miss.done) {
      miss.progress++;
      if (miss.progress >= miss.goal) {
        miss.done = true;
        notify(`Missão concluída: ${miss.desc}`);
      }
    }
  });
}

// == Checa conquistas para atualizar estado ==
function checkAchievements() {
  player.achievements.forEach(ach => {
    if (!ach.done) {
      switch (ach.id) {
        case 1: // Primeiro clique
          if (player.clicks >= 1) ach.done = true;
          break;
        case 2: // 1000 clicks
          if (player.clicks >= 1000) ach.done = true;
          break;
        // Adicione outras condições conforme quiser
      }
      if (ach.done) {
        notify(`Conquista desbloqueada: ${ach.name}`);
      }
    }
  });
}

// == Notificações visuais no topo da tela ==
function notify(msg) {
  const container = el("notifications");
  if (!container) return;

  const notif = document.createElement("div");
  notif.className = "notification";
  notif.textContent = msg;

  container.appendChild(notif);

  setTimeout(() => {
    notif.classList.add("fade-out");
    notif.addEventListener("transitionend", () => notif.remove());
  }, 3500);
}

// == Clique principal handler ==
el("clickBtn").onclick = () => {
  let gain = 1;
  if (player.activePetId) {
    const pet = player.pets.find(p => p.id === player.activePetId);
    if (pet && pet.owned) gain *= 1 + pet.bonusPercent / 100;
  }

  player.clicks += gain;
  gainXP(5);
  updateMissionsOnClick();
  checkAchievements();
  display();

  // Feedback visual clique botão
  const btn = el("clickBtn");
  btn.classList.add("clicked");
  setTimeout(() => btn.classList.remove("clicked"), 100);
};

// == Clique automático por segundo ==
setInterval(() => {
  const gain = calcCPS();
  player.clicks += gain;
  gainXP(gain);
  updateMissionsOnClick();
  checkAchievements();
  display();
}, 1000);

// == Salvar progresso localStorage ==
window.addEventListener("beforeunload", () => {
  const saveData = { ...player, saveVersion: SAVE_VERSION };
  localStorage.setItem("clickerSave", JSON.stringify(saveData));
});

// == Carregar progresso localStorage ==
window.addEventListener("load", () => {
  const save = localStorage.getItem("clickerSave");
  if (save) {
    try {
      const data = JSON.parse(save);
      if (data.saveVersion === SAVE_VERSION) {
        player = data;
      } else {
        console.warn("Versão do save diferente, ignorando...");
      }
    } catch (e) {
      console.error("Erro ao carregar save:", e);
    }
  }
  initializePlayerData();
  display();
  loadRanking();
  updateTheme();
  updateSaveButtonState();
});

// == Salvar score no Firebase ==
el("saveScoreBtn").onclick = () => {
  const name = el("playerNameInput").value.trim();
  if (!name || name.length < 3) {
    alert("Nome inválido! Use ao menos 3 caracteres.");
    return;
  }

  const userRef = push(ref(db, "ranking"));
  set(userRef, { name, score: Math.floor(player.clicks) })
    .then(() => {
      alert("Score salvo com sucesso!");
      el("playerNameInput").value = "";
      loadRanking();
    })
    .catch(() => alert("Erro ao salvar score."));
};

// == Carregar ranking Firebase ==
function loadRanking() {
  const list = el("rankingList");
  onValue(ref(db, "ranking"), snap => {
    const data = [];
    snap.forEach(child => data.push(child.val()));

    const sorted = data.sort((a, b) => b.score - a.score).slice(0, 10);
    list.innerHTML = sorted
      .map((e, i) => `<div class="ranking-item">#${i + 1} <strong>${e.name}</strong>: ${formatNumber(e.score)}</div>`)
      .join("");
  });
}

// == Atualizar tema (claro/escuro) no carregamento ==
function updateTheme() {
  if (player.theme === "light") {
    document.body.classList.add("light-theme");
    el("toggleTheme").textContent = "🌙";
  } else {
    document.body.classList.remove("light-theme");
    el("toggleTheme").textContent = "☀️";
  }
}

// == Toggle tema botão ==
el("toggleTheme").onclick = () => {
  if (player.theme === "dark") {
    player.theme = "light";
  } else {
    player.theme = "dark";
  }
  updateTheme();
};

// == Habilitar/desabilitar botão salvar score baseado no input ==
function updateSaveButtonState() {
  const nameInput = el("playerNameInput");
  const saveBtn = el("saveScoreBtn");
  saveBtn.disabled = !(nameInput.value.trim().length >= 3 && nameInput.value.trim().length <= 16);
}

// Evento para atualizar botão salvar conforme digita
el("playerNameInput").addEventListener("input", updateSaveButtonState);

// == Inicializa estado do botão salvar score na carga ==
window.addEventListener("load", updateSaveButtonState);

// == Teclas de atalho (exemplo: R para rebirth) ==
window.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "r") {
    attemptRebirth();
  }
});

// == Função de Rebirth ==
function attemptRebirth() {
  if (player.clicks >= 100000) { // exemplo custo
    player.clicks = 0;
    player.level = 1;
    player.xp = 0;
    player.xpToNext = 100;
    player.rebirths++;
    notify("Você fez Rebirth!");
    display();
  } else {
    alert("Você precisa de 100000 clicks para fazer Rebirth!");
  }
}

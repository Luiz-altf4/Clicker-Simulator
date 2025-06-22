// Firebase Config (substitua pelos seus dados do Firebase)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Estado do jogo
let clicks = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let rebirths = 0;
let currentWorld = 1;

let buyAmount = 1;
let activePetId = null;

const upgrades = [
  { id: 1, name: "Cursor", basePrice: 15, price: 15, quantity: 0, cps: 0.1 },
  { id: 2, name: "Grandes Mãos", basePrice: 100, price: 100, quantity: 0, cps: 1 },
  { id: 3, name: "Robô Auxiliar", basePrice: 1100, price: 1100, quantity: 0, cps: 8 },
  { id: 4, name: "Fábrica", basePrice: 12000, price: 12000, quantity: 0, cps: 47 },
  { id: 5, name: "Laboratório", basePrice: 130000, price: 130000, quantity: 0, cps: 260 },
];

const shopItems = [
  { id: 1, name: "Multiplicador x2", price: 1000000, description: "Dobra seus clicks e CPS", owned: false },
  { id: 2, name: "Multiplicador x5", price: 5000000, description: "Multiplica seus clicks e CPS por 5", owned: false },
];

const pets = [
  { id: 1, name: "Robozinho", bonusPercent: 5, price: 5000, owned: false, emoji: "🤖" },
  { id: 2, name: "Gatinho", bonusPercent: 12, price: 15000, owned: false, emoji: "🐱" },
  { id: 3, name: "Dragão", bonusPercent: 30, price: 50000, owned: false, emoji: "🐉" },
];

const worlds = [
  { id: 1, name: "Jardim Inicial", unlockReq: 0 },
  { id: 2, name: "Cidade Neon", unlockReq: 100000 },
  { id: 3, name: "Espaço Sideral", unlockReq: 10000000 },
  { id: 4, name: "Dimensão Paralela", unlockReq: 1000000000 },
];

// Missões exemplo
const missions = [
  { id: 1, description: "Clique 100 vezes", progress: 0, goal: 100, reward: 100 },
  { id: 2, description: "Compre 10 Cursors", progress: 0, goal: 10, reward: 500 },
  { id: 3, description: "Alcance o nível 5", progress: 0, goal: 5, reward: 1000 },
];

// Conquistas exemplo
const achievements = [
  { id: 1, description: "Primeiro clique!", achieved: false },
  { id: 2, description: "Compre seu primeiro upgrade!", achieved: false },
  { id: 3, description: "Faça seu primeiro prestígio!", achieved: false },
];

// DOM Elements
const clicksDisplay = document.getElementById("clicksDisplay");
const cpsDisplay = document.getElementById("cpsDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const xpDisplay = document.getElementById("xpDisplay");
const xpToNextLevelDisplay = document.getElementById("xpToNextLevel");
const rebirthCountDisplay = document.getElementById("rebirthCount");
const currentWorldDisplay = document.getElementById("currentWorld");

const clickBtn = document.getElementById("clickBtn");
const upgradesList = document.getElementById("upgradesList");
const shopItemsList = document.getElementById("shopItemsList");
const petsList = document.getElementById("petsList");
const activePetDisplay = document.getElementById("activePet");
const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthInfo = document.getElementById("rebirthInfo");
const worldsList = document.getElementById("worldsList");
const missionsList = document.getElementById("missionsList");
const achievementsList = document.getElementById("achievementsList");
const rankingList = document.getElementById("rankingList");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
const toggleThemeBtn = document.getElementById("toggleTheme");

// Número abreviado (K, M, B, ...)
function formatNumber(num) {
  if (num < 1000) return num.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let unitIndex = -1;
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  return num.toFixed(2) + units[unitIndex];
}

// Calcula CPS total com bônus
function calculateCPS() {
  let baseCPS = 0;
  upgrades.forEach(u => baseCPS += u.cps * u.quantity);

  // Bônus pets
  const petBonus = activePetId ? pets.find(p => p.id === activePetId).bonusPercent : 0;
  let totalCPS = baseCPS * (1 + petBonus / 100);

  // Bônus loja
  if (shopItems.find(i => i.name.includes("x5") && i.owned)) totalCPS *= 5;
  else if (shopItems.find(i => i.name.includes("x2") && i.owned)) totalCPS *= 2;

  // Bônus prestígio
  totalCPS *= (1 + 0.1 * rebirths);

  return totalCPS;
}

// Atualiza interface
function updateDisplay() {
  clicksDisplay.textContent = formatNumber(clicks);
  cpsDisplay.textContent = formatNumber(calculateCPS());
  levelDisplay.textContent = level;
  xpDisplay.textContent = formatNumber(xp);
  xpToNextLevelDisplay.textContent = formatNumber(xpToNextLevel);
  rebirthCountDisplay.textContent = rebirths;
  currentWorldDisplay.textContent = `${currentWorld} - ${worlds.find(w => w.id === currentWorld).name}`;

  updateUpgradesList();
  updateShopList();
  renderPets();
  renderWorlds();
  renderMissions();
  renderAchievements();
  updateRebirthInfo();
  renderRanking();
  updateActivePetText();
}

// Atualiza lista de upgrades
function updateUpgradesList() {
  upgradesList.innerHTML = "";
  upgrades.forEach(u => {
    const row = document.createElement("div");
    row.className = "upgrade-row";

    const name = document.createElement("div");
    name.textContent = `${u.name} (Qtd: ${u.quantity})`;
    name.style.fontWeight = "700";

    const price = document.createElement("div");
    price.textContent = `Preço: ${formatNumber(u.price)}`;

    const buyBtn = document.createElement("button");
    buyBtn.className = "btn";
    buyBtn.textContent = "Comprar";
    buyBtn.disabled = clicks < u.price;
    buyBtn.addEventListener("click", () => buyUpgrade(u.id, buyAmount));

    row.appendChild(name);
    row.appendChild(price);
    row.appendChild(buyBtn);

    upgradesList.appendChild(row);
  });
}

// Atualiza lista da loja
function updateShopList() {
  shopItemsList.innerHTML = "";
  shopItems.forEach(i => {
    const div = document.createElement("div");
    div.className = "shop-item";

    const title = document.createElement("h3");
    title.textContent = i.name;

    const desc = document.createElement("p");
    desc.textContent = i.description;

    const btn = document.createElement("button");
    btn.className = "shop-buy-btn";
    btn.textContent = i.owned ? "Comprado" : `Comprar (${formatNumber(i.price)})`;
    btn.disabled = i.owned || clicks < i.price;

    btn.addEventListener("click", () => {
      if (!i.owned && clicks >= i.price) {
        clicks -= i.price;
        i.owned = true;
        saveGame();
        updateDisplay();
      }
    });

    div.appendChild(title);
    div.appendChild(desc);
    div.appendChild(btn);

    shopItemsList.appendChild(div);
  });
}

// Render pets
function renderPets() {
  petsList.innerHTML = "";
  pets.forEach(p => {
    const card = document.createElement("div");
    card.className = "pet-card";
    if (p.id === activePetId) card.classList.add("active");
    if (!p.owned && clicks < p.price) card.classList.add("disabled");

    const emojiDiv = document.createElement("div");
    emojiDiv.className = "pet-emoji";
    emojiDiv.textContent = p.emoji;

    const nameDiv = document.createElement("div");
    nameDiv.className = "pet-name";
    nameDiv.textContent = p.name;

    const bonusDiv = document.createElement("div");
    bonusDiv.className = "pet-bonus";
    bonusDiv.textContent = `+${p.bonusPercent}% clicks`;

    const priceDiv = document.createElement("div");
    priceDiv.className = "pet-price";
    priceDiv.textContent = `Preço: ${formatNumber(p.price)}`;

    const btn = document.createElement("button");
    btn.className = "btn pet-btn";
    btn.textContent = p.owned ? (p.id === activePetId ? "Ativo" : "Ativar") : "Comprar";
    btn.disabled = (p.id === activePetId) || (!p.owned && clicks < p.price);

    btn.addEventListener("click", () => {
      if (p.owned) {
        activePetId = p.id;
        saveGame();
        updateDisplay();
      } else {
        buyPet(p.id);
      }
    });

    card.appendChild(emojiDiv);
    card.appendChild(nameDiv);
    card.appendChild(bonusDiv);
    card.appendChild(priceDiv);
    card.appendChild(btn);

    petsList.appendChild(card);
  });
}

function updateActivePetText() {
  activePetDisplay.textContent = activePetId
    ? `Pet ativo: ${pets.find(p => p.id === activePetId).name} ${pets.find(p => p.id === activePetId).emoji}`
    : "Pet ativo: Nenhum";
}

function buyPet(petId) {
  const pet = pets.find(p => p.id === petId);
  if (!pet) return;
  if (clicks >= pet.price) {
    clicks -= pet.price;
    pet.owned = true;
    activePetId = petId;
    saveGame();
    updateDisplay();
  } else {
    alert("Você não tem cliques suficientes para comprar esse pet!");
  }
}

// Render mundos
function renderWorlds() {
  worldsList.innerHTML = "";
  worlds.forEach(w => {
    const card = document.createElement("div");
    card.className = "world-card";
    card.textContent = `${w.id} - ${w.name}`;

    if (currentWorld === w.id) card.classList.add("active");

    if (clicks < w.unlockReq) {
      card.classList.add("disabled");
      card.style.opacity = "0.4";
      card.title = `Desbloqueie com ${formatNumber(w.unlockReq)} cliques`;
      card.style.cursor = "not-allowed";
    } else {
      card.title = `Clique para ir para o mundo: ${w.name}`;
      card.addEventListener("click", () => {
        if (clicks >= w.unlockReq) {
          currentWorld = w.id;
          saveGame();
          updateDisplay();
        }
      });
    }

    worldsList.appendChild(card);
  });
}

// Atualiza missões
function renderMissions() {
  missionsList.innerHTML = "";
  missions.forEach(m => {
    const div = document.createElement("div");
    div.className = "mission";

    const desc = document.createElement("div");
    desc.textContent = m.description;

    const progress = document.createElement("div");
    progress.textContent = `Progresso: ${m.progress} / ${m.goal}`;

    const reward = document.createElement("div");
    reward.textContent = `Recompensa: ${formatNumber(m.reward)} cliques`;

    div.appendChild(desc);
    div.appendChild(progress);
    div.appendChild(reward);

    missionsList.appendChild(div);
  });
}

// Atualiza conquistas
function renderAchievements() {
  achievementsList.innerHTML = "";
  achievements.forEach(a => {
    const div = document.createElement("div");
    div.className = "achievement";
    div.textContent = `${a.achieved ? "🏆" : "❌"} ${a.description}`;
    achievementsList.appendChild(div);
  });
}

// Atualiza info prestígio
function updateRebirthInfo() {
  rebirthInfo.textContent = `Prestígios feitos: ${rebirths}. Cada prestígio aumenta seus clicks e CPS em 10%.`;
  rebirthBtn.disabled = clicks < 100000; // requisito exemplo
}

// Função para fazer rebirth
function doRebirth() {
  if (clicks < 100000) {
    alert("Você não tem cliques suficientes para fazer prestígio!");
    return;
  }
  rebirths++;
  clicks = 0;
  level = 1;
  xp = 0;
  xpToNextLevel = 100;
  currentWorld = 1;
  upgrades.forEach(u => { u.quantity = 0; u.price = u.basePrice; });
  shopItems.forEach(i => { i.owned = false; });
  pets.forEach(p => { p.owned = false; });
  activePetId = null;
  missions.forEach(m => m.progress = 0);
  achievements.forEach(a => a.achieved = false);
  saveGame();
  updateDisplay();
}

// Comprar upgrade
function buyUpgrade(upgradeId, amount) {
  const upgrade = upgrades.find(u => u.id === upgradeId);
  if (!upgrade) return;

  let totalPrice = 0;
  let affordableAmount = 0;

  if (amount === "max") {
    // Compra máxima possível
    for (let i = 0; ; i++) {
      const price = upgrade.price * Math.pow(1.15, i);
      if (price > clicks) break;
      totalPrice += price;
      affordableAmount++;
    }
  } else {
    // Compra quantidade normal
    for (let i = 0; i < amount; i++) {
      totalPrice += upgrade.price * Math.pow(1.15, i);
    }
    affordableAmount = amount;
  }

  if (clicks >= totalPrice && affordableAmount > 0) {
    clicks -= totalPrice;
    upgrade.quantity += affordableAmount;
    upgrade.price *= Math.pow(1.15, affordableAmount);
    saveGame();
    updateDisplay();
  } else {
    alert("Você não tem cliques suficientes para essa compra.");
  }
}

// Atualiza progresso missões e conquistas
function updateMissionsAndAchievements() {
  missions.forEach(m => {
    switch(m.id) {
      case 1: // Clique 100 vezes
        if (clicks >= 100) m.progress = 100;
        break;
      case 2: // Compre 10 Cursors
        const cursor = upgrades.find(u => u.name === "Cursor");
        if (cursor) m.progress = Math.min(cursor.quantity, m.goal);
        break;
      case 3: // Alcançar nível 5
        m.progress = Math.min(level, m.goal);
        break;
    }
  });

  achievements[0].achieved = clicks >= 1;
  achievements[1].achieved = upgrades.some(u => u.quantity >= 1);
  achievements[2].achieved = rebirths >= 1;
}

// Atualiza ranking Firebase
function renderRanking() {
  rankingList.innerHTML = "";
  database.ref("ranking").orderByChild("score").limitToLast(10).once("value", snapshot => {
    const data = snapshot.val();
    if (!data) {
      rankingList.innerHTML = "<li>Nenhum jogador no ranking ainda.</li>";
      return;
    }
    // transforma objeto em array e ordena decrescente
    const sorted = Object.entries(data).sort((a, b) => b[1].score - a[1].score);
    sorted.forEach(([key, player]) => {
      const li = document.createElement("li");
      li.textContent = `${player.name}: ${formatNumber(player.score)}`;
      rankingList.appendChild(li);
    });
  });
}

// Salva progresso no localStorage
function saveGame() {
  const saveData = {
    clicks,
    level,
    xp,
    xpToNextLevel,
    rebirths,
    currentWorld,
    buyAmount,
    activePetId,
    upgrades: upgrades.map(u => ({ id: u.id, quantity: u.quantity, price: u.price })),
    shopItems: shopItems.map(i => ({ id: i.id, owned: i.owned })),
    pets: pets.map(p => ({ id: p.id, owned: p.owned })),
    missions: missions.map(m => ({ id: m.id, progress: m.progress })),
    achievements: achievements.map(a => ({ id: a.id, achieved: a.achieved })),
  };
  localStorage.setItem("clickerSimulatorSave", JSON.stringify(saveData));
}

// Carrega progresso do localStorage
function loadGame() {
  const saved = localStorage.getItem("clickerSimulatorSave");
  if (!saved) return;
  try {
    const data = JSON.parse(saved);
    clicks = data.clicks || 0;
    level = data.level || 1;
    xp = data.xp || 0;
    xpToNextLevel = data.xpToNextLevel || 100;
    rebirths = data.rebirths || 0;
    currentWorld = data.currentWorld || 1;
    buyAmount = data.buyAmount || 1;
    activePetId = data.activePetId || null;

    if (data.upgrades) {
      data.upgrades.forEach(su => {
        const u = upgrades.find(up => up.id === su.id);
        if (u) {
          u.quantity = su.quantity || 0;
          u.price = su.price || u.basePrice;
        }
      });
    }
    if (data.shopItems) {
      data.shopItems.forEach(si => {
        const i = shopItems.find(it => it.id === si.id);
        if (i) i.owned = si.owned || false;
      });
    }
    if (data.pets) {
      data.pets.forEach(sp => {
        const p = pets.find(pt => pt.id === sp.id);
        if (p) p.owned = sp.owned || false;
      });
    }
    if (data.missions) {
      data.missions.forEach(sm => {
        const m = missions.find(ms => ms.id === sm.id);
        if (m) m.progress = sm.progress || 0;
      });
    }
    if (data.achievements) {
      data.achievements.forEach(sa => {
        const a = achievements.find(ac => ac.id === sa.id);
        if (a) a.achieved = sa.achieved || false;
      });
    }
  } catch (e) {
    console.error("Erro ao carregar save:", e);
  }
}

// Atualiza nível e XP
function updateLevel() {
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.2);
  }
}

// Evento clicar
clickBtn.addEventListener("click", () => {
  clicks++;
  xp++;
  updateMissionsAndAchievements();
  updateLevel();
  saveGame();
  updateDisplay();
});

// Rebirth
rebirthBtn.addEventListener("click", () => {
  doRebirth();
});

// Comprar quantidade
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    buyAmount = btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
  });
});

// Atualização automática CPS
setInterval(() => {
  const cps = calculateCPS();
  clicks += cps;
  xp += cps;
  updateMissionsAndAchievements();
  updateLevel();
  saveGame();
  updateDisplay();
}, 1000);

// Alternar tema
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  toggleThemeBtn.textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
});

// Enviar pontuação para o ranking
function sendScoreToRanking() {
  let playerName = prompt("Digite seu nome para o ranking:").trim();
  if (!playerName) playerName = "Anon";

  const score = clicks;

  const playerRef = database.ref("ranking").push();
  playerRef.set({
    name: playerName,
    score: score
  }, (error) => {
    if (error) alert("Erro ao enviar pontuação.");
    else alert("Pontuação enviada ao ranking!");
  });
}

// Botão para enviar pontuação
const sendScoreBtn = document.createElement("button");
sendScoreBtn.textContent = "Enviar Pontuação para Ranking";
sendScoreBtn.className = "btn";
sendScoreBtn.style.width = "100%";
sendScoreBtn.style.marginTop = "10px";
sendScoreBtn.addEventListener("click", sendScoreToRanking);
document.querySelector(".ranking").appendChild(sendScoreBtn);

// Carregar jogo e atualizar interface
loadGame();
updateDisplay();

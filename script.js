// -------------------- Estado do Jogo --------------------
let state = {
  clicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
  rebirths: 0,
  currentWorld: 1,
  buyAmount: 1,
  activePetId: null,
  upgrades: [
    { id: 1, name: "Cursor", basePrice: 15, price: 15, quantity: 0, cps: 0.1 },
    { id: 2, name: "Grandes Mãos", basePrice: 100, price: 100, quantity: 0, cps: 1 },
    { id: 3, name: "Robô Auxiliar", basePrice: 1100, price: 1100, quantity: 0, cps: 8 },
    { id: 4, name: "Fábrica", basePrice: 12000, price: 12000, quantity: 0, cps: 47 },
    { id: 5, name: "Laboratório", basePrice: 130000, price: 130000, quantity: 0, cps: 260 },
  ],
  shopItems: [
    { id: 1, name: "Multiplicador x2", price: 1_000_000, description: "Dobra seus clicks e CPS", owned: false },
    { id: 2, name: "Multiplicador x5", price: 5_000_000, description: "Multiplica seus clicks e CPS por 5", owned: false },
  ],
  pets: [
    { id: 1, name: "Robozinho", bonusPercent: 5, price: 5000, owned: false, emoji: "🤖" },
    { id: 2, name: "Gatinho", bonusPercent: 12, price: 15000, owned: false, emoji: "🐱" },
    { id: 3, name: "Dragão", bonusPercent: 30, price: 50000, owned: false, emoji: "🐉" },
  ],
  worlds: [
    { id: 1, name: "Jardim Inicial", unlockReq: 0 },
    { id: 2, name: "Cidade Neon", unlockReq: 100000 },
    { id: 3, name: "Espaço Sideral", unlockReq: 10000000 },
    { id: 4, name: "Dimensão Paralela", unlockReq: 1000000000 },
  ],
};

// -------------------- Função para formatar números --------------------
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

// -------------------- Salvamento e carregamento --------------------
function saveGame() {
  localStorage.setItem('clickerState', JSON.stringify(state));
}

function loadGame() {
  const saved = localStorage.getItem('clickerState');
  if (saved) {
    state = JSON.parse(saved);
  }
}

// -------------------- Atualização da Interface --------------------
function updateDisplay() {
  // Atualiza elementos no DOM - IDs devem existir no HTML
  document.getElementById("clicksDisplay").textContent = formatNumber(state.clicks);
  document.getElementById("cpsDisplay").textContent = formatNumber(calculateCPS());
  document.getElementById("levelDisplay").textContent = state.level;
  document.getElementById("xpDisplay").textContent = formatNumber(state.xp);
  document.getElementById("xpToNextLevel").textContent = formatNumber(state.xpToNextLevel);
  document.getElementById("rebirthCount").textContent = state.rebirths;
  const currentWorldName = state.worlds.find(w => w.id === state.currentWorld)?.name || "";
  document.getElementById("currentWorld").textContent = `${state.currentWorld} - ${currentWorldName}`;

  updateUpgradesList();
  updateShopList();
  renderPets();
  renderWorlds();
  updateRebirthInfo();

  saveGame();
}

// -------------------- Calcula CPS total --------------------
function calculateCPS() {
  let baseCPS = 0;
  state.upgrades.forEach(upg => {
    baseCPS += upg.cps * upg.quantity;
  });

  const petBonusPercent = state.activePetId ? state.pets.find(p => p.id === state.activePetId).bonusPercent : 0;
  let totalCPS = baseCPS * (1 + petBonusPercent / 100);

  if (state.shopItems.find(item => item.name.includes("x5") && item.owned)) totalCPS *= 5;
  else if (state.shopItems.find(item => item.name.includes("x2") && item.owned)) totalCPS *= 2;

  return totalCPS;
}

// -------------------- Compra upgrades --------------------
function buyUpgrade(id, amount) {
  const upg = state.upgrades.find(u => u.id === id);
  if (!upg) return;

  if (amount === "max") {
    // Comprar máximo possível
    let maxAffordable = 0;
    let price = upg.price;
    while (state.clicks >= price) {
      state.clicks -= price;
      maxAffordable++;
      price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity + maxAffordable));
    }
    if (maxAffordable > 0) {
      upg.quantity += maxAffordable;
      upg.price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    }
  } else {
    // Comprar quantidade exata
    for (let i = 0; i < amount; i++) {
      if (state.clicks >= upg.price) {
        state.clicks -= upg.price;
        upg.quantity++;
        upg.price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
      } else break;
    }
  }
  updateDisplay();
}

// -------------------- Compra pets --------------------
function buyPet(petId) {
  const pet = state.pets.find(p => p.id === petId);
  if (!pet) return;
  if (state.clicks >= pet.price) {
    state.clicks -= pet.price;
    pet.owned = true;
    state.activePetId = petId;
    updateDisplay();
  } else {
    alert("Clique insuficiente para comprar o pet!");
  }
}

// -------------------- Funções de renderização --------------------
function updateUpgradesList() {
  const upgradesList = document.getElementById("upgradesList");
  upgradesList.innerHTML = "";
  state.upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade-row";

    const name = document.createElement("div");
    name.textContent = `${upg.name} (Qtd: ${upg.quantity})`;
    name.style.fontWeight = "700";

    const price = document.createElement("div");
    price.textContent = `Preço: ${formatNumber(upg.price)}`;

    const buyBtn = document.createElement("button");
    buyBtn.className = "btn";
    buyBtn.textContent = "Comprar";
    buyBtn.disabled = state.clicks < upg.price;
    buyBtn.onclick = () => buyUpgrade(upg.id, state.buyAmount);

    div.appendChild(name);
    div.appendChild(price);
    div.appendChild(buyBtn);

    upgradesList.appendChild(div);
  });
}

function updateShopList() {
  const shopItemsList = document.getElementById("shopItemsList");
  shopItemsList.innerHTML = "";
  state.shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shop-item";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const desc = document.createElement("p");
    desc.textContent = item.description;

    const btn = document.createElement("button");
    btn.className = "shop-buy-btn";
    btn.textContent = item.owned ? "Comprado" : `Comprar (${formatNumber(item.price)})`;
    btn.disabled = item.owned || state.clicks < item.price;
    btn.onclick = () => {
      if (state.clicks >= item.price && !item.owned) {
        state.clicks -= item.price;
        item.owned = true;
        updateDisplay();
      }
    };

    div.appendChild(title);
    div.appendChild(desc);
    div.appendChild(btn);

    shopItemsList.appendChild(div);
  });
}

function renderPets() {
  const petsList = document.getElementById("petsList");
  const activePetDisplay = document.getElementById("activePet");
  petsList.innerHTML = "";

  state.pets.forEach(pet => {
    const card = document.createElement("div");
    card.className = "pet-card";
    if (pet.id === state.activePetId) card.classList.add("active");
    if (!pet.owned && state.clicks < pet.price) card.classList.add("disabled");

    const emojiDiv = document.createElement("div");
    emojiDiv.className = "pet-emoji";
    emojiDiv.textContent = pet.emoji;

    const nameDiv = document.createElement("div");
    nameDiv.className = "pet-name";
    nameDiv.textContent = pet.name;

    const bonusDiv = document.createElement("div");
    bonusDiv.className = "pet-bonus";
    bonusDiv.textContent = `+${pet.bonusPercent}% clicks`;

    const priceDiv = document.createElement("div");
    priceDiv.className = "pet-price";
    priceDiv.textContent = `Preço: ${formatNumber(pet.price)}`;

    const btn = document.createElement("button");
    btn.className = "btn pet-btn";
    btn.textContent = pet.owned ? (pet.id === state.activePetId ? "Ativo" : "Ativar") : "Comprar";
    btn.disabled = (pet.id === state.activePetId) || (!pet.owned && state.clicks < pet.price);

    btn.onclick = () => {
      if (pet.owned) {
        state.activePetId = pet.id;
        updateDisplay();
      } else {
        buyPet(pet.id);
      }
    };

    card.appendChild(emojiDiv);
    card.appendChild(nameDiv);
    card.appendChild(bonusDiv);
    card.appendChild(priceDiv);
    card.appendChild(btn);

    petsList.appendChild(card);
  });

  activePetDisplay.textContent = state.activePetId
    ? `Pet ativo: ${state.pets.find(p => p.id === state.activePetId).name} ${state.pets.find(p => p.id === state.activePetId).emoji}`
    : "Pet ativo: Nenhum";
}

function renderWorlds() {
  const worldsList = document.getElementById("worldsList");
  worldsList.innerHTML = "";

  state.worlds.forEach(world => {
    const card = document.createElement("div");
    card.className = "world-card";
    card.textContent = `${world.id} - ${world.name}`;

    if (state.currentWorld === world.id) card.classList.add("active");

    if (state.clicks < world.unlockReq) {
      card.classList.add("disabled");
      card.style.opacity = "0.4";
      card.title = `Desbloqueie com ${formatNumber(world.unlockReq)} cliques`;
      card.style.cursor = "not-allowed";
    } else {
      card.title = `Clique para ir para o mundo: ${world.name}`;
      card.onclick = () => {
        if (state.clicks >= world.unlockReq) {
          state.currentWorld = world.id;
          updateDisplay();
        }
      };
    }

    worldsList.appendChild(card);
  });
}

// -------------------- Rebirth --------------------
function rebirth() {
  if (state.clicks >= 1_000_000) {
    state.clicks = 0;
    state.cps = 0;
    state.level = 1;
    state.xp = 0;
    state.xpToNextLevel = 100;
    state.upgrades.forEach(u => {
      u.quantity = 0;
      u.price = u.basePrice;
    });
    state.shopItems.forEach(i => { i.owned = false; });
    state.pets.forEach(p => { p.owned = false; });
    state.activePetId = null;
    state.rebirths++;
    state.currentWorld = 1;
    updateDisplay();
  } else {
    alert("Você precisa de pelo menos 1.000.000 cliques para fazer Rebirth!");
  }
}

function updateRebirthInfo() {
  document.getElementById("rebirthInfo").textContent = `Rebirths feitos: ${state.rebirths}. Rebirth reseta progresso mas aumenta multiplicadores futuros.`;
}

// -------------------- Ganho de XP --------------------
function gainXP(amount) {
  state.xp += amount;
  while (state.xp >= state.xpToNextLevel) {
    state.xp -= state.xpToNextLevel;
    state.level++;
    state.xpToNextLevel = Math.floor(state.xpToNextLevel * 1.3);
  }
}

// -------------------- Clique manual --------------------
document.getElementById("clickBtn").onclick = () => {
  const petBonusPercent = state.activePetId ? state.pets.find(p => p.id === state.activePetId).bonusPercent : 0;
  let clickGain = 1 * (1 + petBonusPercent / 100);

  if (state.shopItems.find(item => item.name.includes("x5") && item.owned)) clickGain *= 5;
  else if (state.shopItems.find(item => item.name.includes("x2") && item.owned)) clickGain *= 2;

  state.clicks += clickGain;
  gainXP(5);
  updateDisplay();
};

// -------------------- Buy amount buttons --------------------
document.querySelectorAll(".upgradeAmountBtn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".upgradeAmountBtn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.buyAmount = btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
  };
});

// -------------------- Toggle tema --------------------
document.getElementById("toggleTheme").onclick = () => {
  document.body.classList.toggle("light-theme");
  const btn = document.getElementById("toggleTheme");
  btn.textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
};

// -------------------- Loop Auto CPS --------------------
setInterval(() => {
  const cps = calculateCPS();
  state.clicks += cps;
  gainXP(cps);
  updateDisplay();
}, 1000);

// -------------------- Botão rebirth --------------------
document.getElementById("rebirthBtn").onclick = rebirth;

// -------------------- Inicialização --------------------
loadGame();
updateDisplay();

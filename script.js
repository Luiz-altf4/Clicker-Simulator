// Estado do jogo
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let rebirths = 0;
let currentWorld = 1;

// Quantidade que o jogador vai comprar (1,10,100,1000,max)
let buyAmount = 1;

// Dados dos upgrades
const upgrades = [
  { id: 1, name: "Cursor", basePrice: 15, price: 15, quantity: 0, cps: 0.1 },
  { id: 2, name: "Grandes Mãos", basePrice: 100, price: 100, quantity: 0, cps: 1 },
  { id: 3, name: "Robô Auxiliar", basePrice: 1100, price: 1100, quantity: 0, cps: 8 },
  { id: 4, name: "Fábrica", basePrice: 12000, price: 12000, quantity: 0, cps: 47 },
  { id: 5, name: "Laboratório", basePrice: 130000, price: 130000, quantity: 0, cps: 260 },
];

// Dados da loja - itens que dão bônus extras ou especiais
const shopItems = [
  { id: 1, name: "Multiplicador x2", price: 1000000, description: "Dobra seus clicks e CPS", owned: false },
  { id: 2, name: "Multiplicador x5", price: 5000000, description: "Multiplica seus clicks e CPS por 5", owned: false },
];

// Pets com bônus em %
const pets = [
  { id: 1, name: "Robozinho", bonusPercent: 5, price: 5000, owned: false, emoji: "🤖" },
  { id: 2, name: "Gatinho", bonusPercent: 12, price: 15000, owned: false, emoji: "🐱" },
  { id: 3, name: "Dragão", bonusPercent: 30, price: 50000, owned: false, emoji: "🐉" },
];

let activePetId = null;

// Mundos desbloqueáveis
const worlds = [
  { id: 1, name: "Jardim Inicial", unlockReq: 0 },
  { id: 2, name: "Cidade Neon", unlockReq: 100000 },
  { id: 3, name: "Espaço Sideral", unlockReq: 10000000 },
  { id: 4, name: "Dimensão Paralela", unlockReq: 1000000000 },
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

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");

const toggleThemeBtn = document.getElementById("toggleTheme");

// Formatação números com abreviação
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

// Atualiza dados na tela
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
  updateRebirthInfo();
}

// Calcula CPS base + upgrades + bônus pets + shop
function calculateCPS() {
  let baseCPS = 0;
  upgrades.forEach(upg => {
    baseCPS += upg.cps * upg.quantity;
  });

  // Bônus dos pets
  const petBonus = activePetId ? pets.find(p => p.id === activePetId).bonusPercent : 0;
  let totalCPS = baseCPS * (1 + petBonus / 100);

  // Bônus da loja
  if (shopItems.find(item => item.name.includes("x5"))?.owned) totalCPS *= 5;
  else if (shopItems.find(item => item.name.includes("x2"))?.owned) totalCPS *= 2;

  return totalCPS;
}

// Clique manual
clickBtn.addEventListener("click", () => {
  const petBonus = activePetId ? pets.find(p => p.id === activePetId).bonusPercent : 0;
  let clickGain = 1 * (1 + petBonus / 100);

  // Bônus loja
  if (shopItems.find(item => item.name.includes("x5"))?.owned) clickGain *= 5;
  else if (shopItems.find(item => item.name.includes("x2"))?.owned) clickGain *= 2;

  clicks += clickGain;
  gainXP(5);
  updateDisplay();
});

// Compra upgrades
function buyUpgrade(id, amount) {
  const upg = upgrades.find(u => u.id === id);
  if (!upg) return;

  if (amount === "max") {
    let maxAffordable = 0;
    let price = upg.price;
    while (clicks >= price) {
      clicks -= price;
      maxAffordable++;
      price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity + maxAffordable));
    }
    if (maxAffordable > 0) {
      upg.quantity += maxAffordable;
      upg.price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    }
  } else {
    for (let i = 0; i < amount; i++) {
      if (clicks >= upg.price) {
        clicks -= upg.price;
        upg.quantity++;
        upg.price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
      } else {
        break;
      }
    }
  }
  updateDisplay();
}

// Atualiza lista de upgrades e botões
function updateUpgradesList() {
  upgradesList.innerHTML = "";
  upgrades.forEach(upg => {
    const row = document.createElement("div");
    row.className = "upgrade-row";

    const name = document.createElement("div");
    name.textContent = `${upg.name} (Qtd: ${upg.quantity})`;
    name.style.fontWeight = "700";

    const price = document.createElement("div");
    price.textContent = `Preço: ${formatNumber(upg.price)}`;

    const buyBtn = document.createElement("button");
    buyBtn.className = "btn";
    buyBtn.textContent = "Comprar";
    buyBtn.disabled = clicks < upg.price;
    buyBtn.addEventListener("click", () => buyUpgrade(upg.id, buyAmount));

    row.appendChild(name);
    row.appendChild(price);
    row.appendChild(buyBtn);

    upgradesList.appendChild(row);
  });
}

// Atualiza lista da loja
function updateShopList() {
  shopItemsList.innerHTML = "";
  shopItems.forEach(item => {
    const div = document.createElement("div");
    div.className = "shop-item";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const desc = document.createElement("p");
    desc.textContent = item.description;

    const btn = document.createElement("button");
    btn.className = "shop-buy-btn";
    btn.textContent = item.owned ? "Comprado" : `Comprar (${formatNumber(item.price)})`;
    btn.disabled = item.owned || clicks < item.price;

    btn.addEventListener("click", () => {
      if (clicks >= item.price && !item.owned) {
        clicks -= item.price;
        item.owned = true;
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
  pets.forEach(pet => {
    const card = document.createElement("div");
    card.className = "pet-card";
    if (pet.id === activePetId) card.classList.add("active");
    if (!pet.owned && clicks < pet.price) card.classList.add("disabled");

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
    btn.textContent = pet.owned ? (pet.id === activePetId ? "Ativo" : "Ativar") : "Comprar";
    btn.disabled = (pet.id === activePetId) || (!pet.owned && clicks < pet.price);

    btn.addEventListener("click", () => {
      if (pet.owned) {
        activePetId = pet.id;
        updateDisplay();
      } else {
        buyPet(pet.id);
      }
    });

    card.appendChild(emojiDiv);
    card.appendChild(nameDiv);
    card.appendChild(bonusDiv);
    card.appendChild(priceDiv);
    card.appendChild(btn);

    petsList.appendChild(card);
  });

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
    updateDisplay();
  } else {
    alert("Você não tem cliques suficientes para comprar esse pet!");
  }
}

// XP e Level up
function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.3);
  }
}

// Rebirth
rebirthBtn.addEventListener("click", () => {
  if (clicks >= 1000000) {
    clicks = 0;
    cps = 0;
    level = 1;
    xp = 0;
    xpToNextLevel = 100;
    upgrades.forEach(u => { u.quantity = 0; u.price = u.basePrice; });
    shopItems.forEach(i => { i.owned = false; });
    pets.forEach(p => { p.owned = false; });
    activePetId = null;
    rebirths++;
    currentWorld = 1;
    updateDisplay();
  } else {
    alert("Você precisa de pelo menos 1.000.000 cliques para fazer Rebirth!");
  }
});

function updateRebirthInfo() {
  rebirthInfo.textContent = `Rebirths feitos: ${rebirths}. Rebirth reseta progresso mas aumenta multiplicadores futuros.`;
}

// Mundos
function renderWorlds() {
  worldsList.innerHTML = "";
  worlds.forEach(world => {
    const card = document.createElement("div");
    card.className = "world-card";
    card.textContent = `${world.id} - ${world.name}`;

    if (currentWorld === world.id) card.classList.add("active");

    // Desbloqueio
    if (clicks < world.unlockReq) {
      card.classList.add("disabled");
      card.style.opacity = "0.4";
      card.title = `Desbloqueie com ${formatNumber(world.unlockReq)} cliques`;
      card.style.cursor = "not-allowed";
    } else {
      card.title = `Clique para ir para o mundo: ${world.name}`;
      card.addEventListener("click", () => {
        if (clicks >= world.unlockReq) {
          currentWorld = world.id;
          updateDisplay();
        }
      });
    }

    worldsList.appendChild(card);
  });
}

// Botões para escolher quantidade compra upgrades
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    buyAmount = btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
  });
});

// Tema claro / escuro
function toggleTheme() {
  document.body.classList.toggle("light-theme");
  if(document.body.classList.contains("light-theme")){
    toggleThemeBtn.textContent = "🌙";
  } else {
    toggleThemeBtn.textContent = "☀️";
  }
}

toggleThemeBtn.addEventListener("click", toggleTheme);

// Auto CPS a cada segundo
setInterval(() => {
  const cpsValue = calculateCPS();
  clicks += cpsValue;
  gainXP(cpsValue);
  updateDisplay();
}, 1000);

// Inicialização
updateDisplay();

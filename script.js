// === Variáveis principais ===
let clicks = 0;
let cps = 0;
let gems = 0;
let rebirths = 0;
let multiplier = 1;
let currentWorld = 'Default';
let xp = 0;
let xpToLevel = 100;

let upgrades = [
  { id: 1, name: "Upgrade Click", cost: 50, cps: 0, clickPower: 1, quantity: 0 },
  { id: 2, name: "Auto Clicker", cost: 500, cps: 5, clickPower: 0, quantity: 0 },
  { id: 3, name: "Mega Click", cost: 2000, cps: 0, clickPower: 10, quantity: 0 },
  { id: 4, name: "Ultra Click", cost: 10000, cps: 0, clickPower: 50, quantity: 0 },
];

let shopItems = [
  { id: 1, name: "Multiplier Booster", cost: 5000, quantity: 0 },
  { id: 2, name: "Gemas x2", cost: 10000, quantity: 0 },
];

let buyAmount = 1;

// === Elementos DOM ===
const clickBtn = document.getElementById('clickBtn');
const clickCount = document.getElementById('clickCount');
const cpsDisplay = document.getElementById('cps');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const xpBar = document.getElementById('xpBar');
const xpDisplay = document.getElementById('xpDisplay');
const gemsCount = document.getElementById('gemsCount');
const rebirthCount = document.getElementById('rebirthCount');
const currentWorldDisplay = document.getElementById('currentWorld');
const upgradesContainer = document.getElementById('upgradesContainer');
const shopPanel = document.getElementById('shopPanel');
const rebirthBtn = document.getElementById('rebirthBtn');
const resetBtn = document.getElementById('resetBtn');
const worldsSelect = document.getElementById('worldsSelect');
const buyAmountBtns = document.querySelectorAll('.upgradeAmountBtn');
const themeBtn = document.getElementById('themeBtn');

// === Funções ===

function formatNumber(num) {
  // Formatação compacta com suffix (ex: 1k, 1M, 1B...)
  if (num < 1000) return num.toFixed(0);
  const units = ["k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  let unitIndex = -1;
  let n = num;
  while (n >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }
  return n.toFixed(2) + units[unitIndex];
}

function updateDisplay() {
  clickCount.textContent = formatNumber(clicks);
  cpsDisplay.textContent = `CPS: ${formatNumber(cps * multiplier)}`;
  multiplierDisplay.textContent = `Multiplicador: x${multiplier.toFixed(2)}`;
  gemsCount.textContent = `Gemas: ${formatNumber(gems)}`;
  rebirthCount.textContent = `Rebirths: ${rebirths}`;
  currentWorldDisplay.textContent = `Mundo: ${currentWorld}`;
  xpDisplay.textContent = `XP: ${xp} / ${xpToLevel}`;

  const xpPercent = Math.min((xp / xpToLevel) * 100, 100);
  xpBar.style.width = `${xpPercent}%`;
}

function renderUpgrades() {
  upgradesContainer.innerHTML = '';
  upgrades.forEach(upg => {
    const canBuy = clicks >= upg.cost;
    const buyQty = buyAmount === 'max' ? Math.floor(clicks / upg.cost) : buyAmount;
    const totalCost = upg.cost * buyQty;

    const upgradeRow = document.createElement('div');
    upgradeRow.className = 'upgrade-row';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = `${upg.name} (x${upg.quantity})`;

    const costSpan = document.createElement('span');
    costSpan.className = 'cost';
    costSpan.textContent = `Preço: ${formatNumber(totalCost)}`;

    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Comprar';
    buyBtn.disabled = totalCost > clicks;
    buyBtn.addEventListener('click', () => {
      buyUpgrade(upg, buyQty);
    });

    upgradeRow.appendChild(nameSpan);
    upgradeRow.appendChild(costSpan);
    upgradeRow.appendChild(buyBtn);

    upgradesContainer.appendChild(upgradeRow);
  });
}

function renderShop() {
  shopPanel.innerHTML = '';
  shopItems.forEach(item => {
    const canBuy = clicks >= item.cost;

    const shopItem = document.createElement('div');
    shopItem.className = 'shop-item';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = `${item.name} (x${item.quantity})`;

    const costSpan = document.createElement('span');
    costSpan.className = 'cost';
    costSpan.textContent = `Preço: ${formatNumber(item.cost)}`;

    const buyBtn = document.createElement('button');
    buyBtn.textContent = 'Comprar';
    buyBtn.disabled = !canBuy;
    buyBtn.addEventListener('click', () => {
      buyShopItem(item);
    });

    shopItem.appendChild(nameSpan);
    shopItem.appendChild(costSpan);
    shopItem.appendChild(buyBtn);

    shopPanel.appendChild(shopItem);
  });
}

function buyUpgrade(upg, quantity) {
  const totalCost = upg.cost * quantity;
  if (clicks >= totalCost) {
    clicks -= totalCost;
    upg.quantity += quantity;
    // Aplicar efeitos do upgrade
    if (upg.cps > 0) {
      cps += upg.cps * quantity;
    }
    if (upg.clickPower > 0) {
      multiplier += upg.clickPower * quantity;
    }
    // Aumenta custo progressivamente
    upg.cost = Math.floor(upg.cost * (1.15 ** quantity));
    updateDisplay();
    renderUpgrades();
    saveGame();
  }
}

function buyShopItem(item) {
  if (clicks >= item.cost) {
    clicks -= item.cost;
    item.quantity++;
    if (item.name === "Multiplier Booster") {
      multiplier += 0.5;
    }
    if (item.name === "Gemas x2") {
      gems *= 2;
    }
    updateDisplay();
    renderShop();
    saveGame();
  }
}

const worlds = ['Default', 'Sun', 'Moon', 'Galaxy'];

function renderWorlds() {
  worldsSelect.innerHTML = '';
  worlds.forEach(w => {
    const option = document.createElement('option');
    option.value = w;
    option.textContent = w;
    if (w === currentWorld) option.selected = true;
    worldsSelect.appendChild(option);
  });
}

worldsSelect.addEventListener('change', () => {
  currentWorld = worldsSelect.value;
  updateDisplay();
  saveGame();
});

clickBtn.addEventListener('click', () => {
  clicks += 1 * multiplier;
  xp += 1 * multiplier;
  checkLevelUp();
  updateDisplay();
  saveGame();
});

setInterval(() => {
  clicks += cps * multiplier;
  xp += cps * multiplier;
  checkLevelUp();
  updateDisplay();
  saveGame();
}, 1000);

function checkLevelUp() {
  if (xp >= xpToLevel) {
    xp -= xpToLevel;
    xpToLevel = Math.floor(xpToLevel * 1.2);
    // Aqui você pode adicionar recompensas por subir de nível
  }
}

rebirthBtn.addEventListener('click', () => {
  if (clicks < 100000) {
    alert('Você precisa de pelo menos 100.000 clicks para fazer Rebirth!');
    return;
  }
  rebirths++;
  clicks = 0;
  cps = 0;
  multiplier = 1 + rebirths; // Exemplo: multiplicador cresce com rebirths
  xp = 0;
  xpToLevel = 100;

  upgrades.forEach(u => {
    u.cost = Math.floor(u.cost / (1.15 ** u.quantity));
    u.quantity = 0;
  });

  shopItems.forEach(i => {
    i.quantity = 0;
  });

  updateDisplay();
  renderUpgrades();
  renderShop();
  saveGame();
});

resetBtn.addEventListener('click', () => {
  if (confirm('Tem certeza que quer resetar todo o progresso?')) {
    clicks = 0;
    cps = 0;
    gems = 0;
    rebirths = 0;
    multiplier = 1;
    currentWorld = 'Default';
    xp = 0;
    xpToLevel = 100;

    upgrades.forEach(u => {
      u.cost = Math.floor(u.cost / (1.15 ** u.quantity));
      u.quantity = 0;
    });
    shopItems.forEach(i => i.quantity = 0);

    updateDisplay();
    renderUpgrades();
    renderShop();
    renderWorlds();
    saveGame();
  }
});

// Botões quantidade comprar
buyAmountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    buyAmountBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const val = btn.getAttribute('data-amount');
    buyAmount = val === 'max' ? 'max' : parseInt(val);
    renderUpgrades();
  });
});

// Botão tema dark/light
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light-theme');
  if (document.body.classList.contains('light-theme')) {
    themeBtn.textContent = '🌞';
  } else {
    themeBtn.textContent = '🌙';
  }
});

function saveGame() {
  const saveData = {
    clicks,
    cps,
    gems,
    rebirths,
    multiplier,
    currentWorld,
    xp,
    xpToLevel,
    upgrades,
    shopItems,
  };
  localStorage.setItem('clickerSave', JSON.stringify(saveData));
}

function loadGame() {
  const saveData = JSON.parse(localStorage.getItem('clickerSave'));
  if (saveData) {
    clicks = saveData.clicks || 0;
    cps = saveData.cps || 0;
    gems = saveData.gems || 0;
    rebirths = saveData.rebirths || 0;
    multiplier = saveData.multiplier || 1;
    currentWorld = saveData.currentWorld || 'Default';
    xp = saveData.xp || 0;
    xpToLevel = saveData.xpToLevel || 100;
    upgrades = saveData.upgrades || upgrades;
    shopItems = saveData.shopItems || shopItems;
  }
}

// Inicialização
function init() {
  loadGame();
  renderUpgrades();
  renderShop();
  renderWorlds();
  updateDisplay();
  buyAmountBtns[0].classList.add('active');
}

init();

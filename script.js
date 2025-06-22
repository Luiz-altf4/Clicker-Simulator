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
  // Adicione outros upgrades que quiser
];

let shopItems = [
  { id: 1, name: "Gems Pack", cost: 1000, quantity: 0 },
  { id: 2, name: "Multiplier Booster", cost: 5000, quantity: 0 },
  // Adicione outros itens da loja
];

// Variável para controlar quantidade de compra (1,10,100,1000,max)
let buyAmount = 1;

// === Elementos DOM ===
const clickBtn = document.getElementById('clickBtn');
const clickCountDisplay = document.getElementById('clickCount');
const cpsDisplay = document.getElementById('cps');
const gemsDisplay = document.getElementById('gemsCount');
const rebirthDisplay = document.getElementById('rebirthCount');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const currentWorldDisplay = document.getElementById('currentWorld');
const xpBar = document.getElementById('xpBar');

const upgradesContainer = document.getElementById('upgradesContainer');
const shopPanel = document.getElementById('shopPanel');
const worldsSelect = document.getElementById('worldsSelect');
const rebirthBtn = document.getElementById('rebirthBtn');
const resetBtn = document.getElementById('resetBtn');
const buyAmountBtns = document.querySelectorAll('.upgradeAmountBtn');

// === Função para salvar progresso no localStorage ===
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
    shopItems
  };
  localStorage.setItem('clickerSave', JSON.stringify(saveData));
}

// === Função para carregar progresso do localStorage ===
function loadGame() {
  const saved = localStorage.getItem('clickerSave');
  if (saved) {
    const data = JSON.parse(saved);
    clicks = data.clicks || 0;
    cps = data.cps || 0;
    gems = data.gems || 0;
    rebirths = data.rebirths || 0;
    multiplier = data.multiplier || 1;
    currentWorld = data.currentWorld || 'Default';
    xp = data.xp || 0;
    xpToLevel = data.xpToLevel || 100;
    upgrades = data.upgrades || upgrades;
    shopItems = data.shopItems || shopItems;
  }
}

// === Atualiza os displays na tela ===
function updateDisplay() {
  clickCountDisplay.textContent = formatNumber(clicks);
  cpsDisplay.textContent = `CPS: ${formatNumber(cps)}`;
  gemsDisplay.textContent = `Gems: ${formatNumber(gems)}`;
  rebirthDisplay.textContent = `Rebirths: ${rebirths}`;
  multiplierDisplay.textContent = `Multiplier: x${multiplier.toFixed(1)}`;
  currentWorldDisplay.textContent = `World: ${currentWorld}`;
  xpBar.style.width = `${Math.min(100, (xp / xpToLevel) * 100)}%`;
}

// === Função para formatar números grandes com unidades (ex: 1k, 1m) ===
function formatNumber(num) {
  if (num < 1000) return num.toString();
  const units = ["k", "m", "b", "t", "q", "Qn", "s", "Sn", "O", "N"];
  let unitIndex = -1;
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  return num.toFixed(2) + units[unitIndex];
}

// === Cria e mostra os upgrades na tela ===
function renderUpgrades() {
  upgradesContainer.innerHTML = '';
  upgrades.forEach(upg => {
    const row = document.createElement('div');
    row.className = 'upgrade-row';

    const name = document.createElement('span');
    name.textContent = `${upg.name} (Lvl: ${upg.quantity})`;
    name.style.flex = '1';

    const cost = document.createElement('span');
    cost.textContent = `Cost: ${formatNumber(upg.cost)}`;
    cost.style.minWidth = '90px';
    cost.style.textAlign = 'right';

    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = `Buy x${buyAmount === 'max' ? 'Max' : buyAmount}`;
    btn.style.minWidth = '100px';

    btn.addEventListener('click', () => buyUpgrade(upg));

    row.appendChild(name);
    row.appendChild(cost);
    row.appendChild(btn);

    upgradesContainer.appendChild(row);
  });
}

// === Função para comprar upgrade ===
function buyUpgrade(upg) {
  let amountToBuy = buyAmount === 'max' ? calculateMaxAffordable(upg) : buyAmount;
  if (amountToBuy <= 0) return;

  let totalCost = 0;
  let tempCost = upg.cost;
  for (let i = 0; i < amountToBuy; i++) {
    totalCost += tempCost;
    tempCost = Math.floor(tempCost * 1.15); // custo aumenta 15% a cada compra
  }

  if (clicks < totalCost) return; // Não tem clicks suficientes

  clicks -= totalCost;
  upg.cost = tempCost;
  upg.quantity += amountToBuy;

  // Atualiza stats conforme upgrade
  if (upg.cps > 0) {
    cps += upg.cps * amountToBuy;
  }
  if (upg.clickPower > 0) {
    multiplier += upg.clickPower * amountToBuy;
  }

  updateDisplay();
  renderUpgrades();
  saveGame();
}

// === Calcula quantos upgrades dá pra comprar com clicks atuais ===
function calculateMaxAffordable(upg) {
  let max = 0;
  let totalCost = 0;
  let tempCost = upg.cost;
  while (clicks >= totalCost + tempCost) {
    totalCost += tempCost;
    tempCost = Math.floor(tempCost * 1.15);
    max++;
  }
  return max;
}

// === Renderiza loja ===
function renderShop() {
  shopPanel.innerHTML = '';
  shopItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item';

    const name = document.createElement('span');
    name.textContent = `${item.name} (Owned: ${item.quantity})`;
    name.style.flex = '1';

    const cost = document.createElement('span');
    cost.textContent = `Cost: ${formatNumber(item.cost)}`;
    cost.style.minWidth = '90px';
    cost.style.textAlign = 'right';

    const btn = document.createElement('button');
    btn.className = 'btn shop-buy';
    btn.textContent = 'Buy';
    btn.addEventListener('click', () => buyShopItem(item));

    div.appendChild(name);
    div.appendChild(cost);
    div.appendChild(btn);

    shopPanel.appendChild(div);
  });
}

// === Comprar item da loja ===
function buyShopItem(item) {
  if (clicks < item.cost) return;
  clicks -= item.cost;
  item.quantity++;

  // Exemplo: se for booster, aumenta multiplicador
  if (item.name === "Multiplier Booster") {
    multiplier += 0.5;
  }

  updateDisplay();
  renderShop();
  saveGame();
}

// === Gerencia mundos ===
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

// === Clique manual ===
clickBtn.addEventListener('click', () => {
  clicks += 1 * multiplier;
  xp += 1 * multiplier;
  checkLevelUp();
  updateDisplay();
  saveGame();
});

// === Loop automático (CPS) ===
setInterval(() => {
  clicks += cps * multiplier;
  xp += cps * multiplier;
  checkLevelUp();
  updateDisplay();
  saveGame();
}, 1000);

// === Checa level up ===
function checkLevelUp() {
  if (xp >= xpToLevel) {
    xp -= xpToLevel;
    xpToLevel = Math.floor(xpToLevel * 1.2);
    // Aqui pode dar recompensa por level up
  }
}

// === Rebirth ===
rebirthBtn.addEventListener('click', () => {
  if (clicks < 100000) {
    alert('Você precisa de pelo menos 100.000 clicks para rebirth!');
    return;
  }
  rebirths++;
  clicks = 0;
  cps = 0;
  multiplier *= 2;
  xp = 0;
  xpToLevel = 100;

  upgrades.forEach(u => {
    u.cost = Math.floor(u.cost / (1.15 ** u.quantity)); // reset custo
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

// === Reset total ===
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
      u.cost = u.cost / (1.15 ** u.quantity);
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

// === Botões de quantidade de compra ===
buyAmountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    buyAmountBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const val = btn.getAttribute('data-amount');
    buyAmount = val === 'max' ? 'max' : parseInt(val);
    renderUpgrades();
  });
});

// Inicializa botão ativo quantidade
buyAmountBtns[0].classList.add('active');

// === Inicia o jogo ===
function init() {
  loadGame();
  renderUpgrades();
  renderShop();
  renderWorlds();
  updateDisplay();
}

init();

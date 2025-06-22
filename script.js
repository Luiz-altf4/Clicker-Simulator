// == Variáveis principais ==
let clicks = 0;
let cps = 0; // clicks per second (autoclickers)
let clickPower = 1;
let gems = 0;
let rebirths = 0;
let multiplier = 1; // rebirth multiplier (1x, 2x, 4x, 8x...)
let currentWorld = 'Default';
let worlds = ['Default', 'Sun'];

// Upgrades e loja (exemplo básico, pode adicionar mais)
const upgrades = [
  { id: 'clickPower', name: 'Click Power', basePrice: 10, quantity: 0, power: 1 },
  { id: 'autoClicker', name: 'Auto Clicker', basePrice: 100, quantity: 0, power: 0.5 },
  { id: 'doubleGems', name: 'Double Gems', basePrice: 500, quantity: 0, power: 0 }, // só exemplo
];

const shopItems = [
  { id: 'boostSpeed', name: 'Speed Boost', price: 1000, description: 'Doubles CPS for 30s', duration: 30000, active: false },
  { id: 'gemMine', name: 'Gem Mine', price: 5000, description: 'Generate gems passively', gemsPerSec: 1, quantity: 0 }
];

// Estado compra múltipla
let buyAmount = 1;

// === Unidade de número mega completa ===
const numberUnits = [
  '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
  'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod', 'Vg', 'Uv',
  'Dv', 'Tv', 'Qav', 'Qiv', 'Sxv', 'Spv', 'Ocv', 'Nov', 'Tg', 'Utg', 'Dtg',
  'Ttg', 'Qatg', 'Qitg', 'Sxtg', 'Sptg', 'Octg', 'Notg', 'Qag', 'Uqag', 'Dqag',
  'Tqag', 'Qaqag', 'Qiqag', 'Sxqag', 'Spqag', 'Ocqag', 'Noqag', 'Qg', 'Uqg',
  'Dqg', 'Tqg', 'Qaqg', 'Qiqg', 'Sxqg', 'Spqg', 'Ocqg', 'Noqg', 'Qg', 'UQg',
  'DQg', 'TQg', 'QaQg', 'QiQg', 'SxQg', 'SpQg', 'OcQg', 'NoQg', 'Rg', 'URg',
  'DRg', 'TRg', 'QaRg', 'QiRg', 'SxRg', 'SpRg', 'OcRg', 'NoRg', 'Cg', 'UCg'
];

function formatNumber(num) {
  if (num < 1000) return Math.floor(num).toString();

  let tier = Math.floor((Math.log10(num)) / 3);
  if (tier >= numberUnits.length) tier = numberUnits.length -1;

  let suffix = numberUnits[tier];
  let scale = Math.pow(10, tier * 3);
  let scaled = num / scale;

  return scaled.toFixed(2) + suffix;
}

// === DOM Elements ===
const clickBtn = document.getElementById('clickBtn');
const clickCountDisplay = document.getElementById('clickCount');
const cpsDisplay = document.getElementById('cps');
const gemsCountDisplay = document.getElementById('gemsCount');
const rebirthCountDisplay = document.getElementById('rebirthCount');
const multiplierDisplay = document.getElementById('multiplierDisplay');
const worldNameDisplay = document.getElementById('currentWorld');
const upgradesContainer = document.getElementById('upgradesContainer');
const shopPanel = document.getElementById('shopPanel');
const buyAmountBtns = document.querySelectorAll('.upgradeAmountBtn');
const xpBar = document.getElementById('xpBar');
const rebirthBtn = document.getElementById('rebirthBtn');
const resetBtn = document.getElementById('resetBtn');
const worldsSelect = document.getElementById('worldsSelect');

// === Inicialização ===
function init() {
  loadGame();
  renderUpgrades();
  renderShop();
  renderWorlds();
  updateUI();
  setupBuyAmountButtons();
  setupEvents();

  // Loop automático para autoclickers e XP bar
  setInterval(gameLoop, 1000);
}

// === Loop do jogo 1s ===
function gameLoop() {
  clicks += cps * multiplier;
  gainGems();
  updateUI();
  saveGame();
  updateXPBar();
}

// === Ganhar gems (exemplo simples) ===
function gainGems() {
  // Gems passivos pelo gemMine
  const gemMine = shopItems.find(item => item.id === 'gemMine');
  if (gemMine && gemMine.quantity > 0) {
    gems += gemMine.gemsPerSec * gemMine.quantity * multiplier;
  }
}

// === Atualiza a barra de XP (só visual) ===
function updateXPBar() {
  const xpPercent = (clicks % 100) / 100 * 100;
  xpBar.style.width = xpPercent + '%';
}

// === Atualiza a UI ===
function updateUI() {
  clickCountDisplay.textContent = formatNumber(clicks);
  cpsDisplay.textContent = 'CPS: ' + formatNumber(cps * multiplier);
  gemsCountDisplay.textContent = 'Gems: ' + formatNumber(gems);
  rebirthCountDisplay.textContent = 'Rebirths: ' + rebirths;
  multiplierDisplay.textContent = 'Multiplier: x' + multiplier;
  worldNameDisplay.textContent = 'World: ' + currentWorld;

  // Atualiza botões de upgrade preço e estado
  upgrades.forEach(upg => {
    const btn = document.getElementById('buy-' + upg.id);
    if (!btn) return;

    let price = getUpgradePrice(upg);
    btn.textContent = `Buy ${upg.name} (${formatNumber(price)}) x${upg.quantity}`;
    btn.disabled = clicks < price;
  });

  // Atualiza botões da loja
  shopItems.forEach(item => {
    const btn = document.getElementById('buyShop-' + item.id);
    if (!btn) return;

    btn.textContent = `${item.name} (${formatNumber(item.price)})`;
    btn.disabled = clicks < item.price;
  });

  // Rebirth e reset habilitação
  rebirthBtn.disabled = clicks < 100000;
  resetBtn.disabled = clicks === 0 && gems === 0 && rebirths === 0;
}

// === Calcula preço do upgrade com base na quantidade ===
function getUpgradePrice(upg) {
  // Crescimento exponencial 15% por unidade
  return Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity) * buyAmount);
}

// === Compra upgrade ===
function buyUpgrade(id) {
  let upg = upgrades.find(u => u.id === id);
  if (!upg) return;

  let price = getUpgradePrice(upg);
  if (clicks >= price) {
    clicks -= price;
    upg.quantity += buyAmount;

    if (id === 'clickPower') {
      clickPower += upg.power * buyAmount;
    } else if (id === 'autoClicker') {
      cps += upg.power * buyAmount;
    }
    updateUI();
  }
}

// === Compra item da loja ===
function buyShopItem(id) {
  let item = shopItems.find(i => i.id === id);
  if (!item) return;

  if (clicks >= item.price) {
    clicks -= item.price;
    if (item.quantity !== undefined) {
      item.quantity += buyAmount;
    }
    // efeitos especiais por item podem ser adicionados aqui
    updateUI();
  }
}

// === Botão de clique principal ===
clickBtn?.addEventListener('click', () => {
  clicks += clickPower * multiplier;
  updateUI();
  saveGame();
});

// === Configura botões de compra múltipla ===
function setupBuyAmountButtons() {
  buyAmountBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      buyAmountBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const val = btn.getAttribute('data-amount');
      if (val === 'max') {
        buyAmount = Number.MAX_SAFE_INTEGER;
      } else {
        buyAmount = parseInt(val);
      }
    });
  });
  // Ativa botão 1 inicialmente
  buyAmountBtns[0].classList.add('active');
  buyAmount = 1;
}

// === Renderiza upgrades na tela ===
function renderUpgrades() {
  upgradesContainer.innerHTML = '';
  upgrades.forEach(upg => {
    const div = document.createElement('div');
    div.classList.add('upgrade-row');

    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.id = 'buy-' + upg.id;
    btn.textContent = `Buy ${upg.name} (${formatNumber(upg.basePrice)}) x0`;
    btn.addEventListener('click', () => buyUpgrade(upg.id));

    div.appendChild(btn);
    upgradesContainer.appendChild(div);
  });
}

// === Renderiza loja ===
function renderShop() {
  shopPanel.innerHTML = '';
  shopItems.forEach(item => {
    const div = document.createElement('div');
    div.className = 'shop-item';

    const btn = document.createElement('button');
    btn.className = 'shop-buy btn';
    btn.id = 'buyShop-' + item.id;
    btn.textContent = `${item.name} (${formatNumber(item.price)})`;
    btn.addEventListener('click', () => buyShopItem(item.id));

    const desc = document.createElement('p');
    desc.textContent = item.description;
    desc.style.color = '#aaa';
    desc.style.fontSize = '0.85rem';
    desc.style.marginTop = '-10px';
    desc.style.marginBottom = '12px';

    div.appendChild(btn);
    div.appendChild(desc);
    shopPanel.appendChild(div);
  });
}

// === Rebirth (prestígio) ===
rebirthBtn?.addEventListener('click', () => {
  if (clicks < 100000) return alert('Você precisa de pelo menos 100.000 clicks para Rebirth!');
  rebirths++;
  multiplier = Math.pow(2, rebirths); // dobrando cada rebirth
  clicks = 0;
  cps = 0;
  clickPower = 1;
  upgrades.forEach(u => u.quantity = 0);
  shopItems.forEach(i => i.quantity = 0);
  updateUI();
  saveGame();
});

// === Reset total ===
resetBtn?.addEventListener('click', () => {
  if (!confirm('Tem certeza que quer resetar tudo?')) return;
  clicks = 0;
  cps = 0;
  clickPower = 1;
  gems = 0;
  rebirths = 0;
  multiplier = 1;
  upgrades.forEach(u => u.quantity = 0);
  shopItems.forEach(i => i.quantity = 0);
  currentWorld = 'Default';
  updateUI();
  saveGame();
});

// === Renderiza lista de mundos ===
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

// === Trocar mundo ===
worldsSelect?.addEventListener('change', e => {
  currentWorld = e.target.value;
  updateUI();
  saveGame();
});

// === Salvar estado no localStorage ===
function saveGame() {
  const data = {
    clicks,
    cps,
    clickPower,
    gems,
    rebirths,
    multiplier,
    upgrades,
    shopItems,
    currentWorld,
  };
  localStorage.setItem('clickerSimSave', JSON.stringify(data));
}

// === Carregar estado do localStorage ===
function loadGame() {
  const save = localStorage.getItem('clickerSimSave');
  if (!save) return;
  try {
    const data = JSON.parse(save);
    clicks = data.clicks || 0;
    cps = data.cps || 0;
    clickPower = data.clickPower || 1;
    gems = data.gems || 0;
    rebirths = data.rebirths || 0;
    multiplier = data.multiplier || 1;
    if (data.upgrades) {
      upgrades.forEach(upg => {
        let found = data.upgrades.find(u => u.id === upg.id);
        if (found) upg.quantity = found.quantity || 0;
      });
    }
    if (data.shopItems) {
      shopItems.forEach(item => {
        let found = data.shopItems.find(i => i.id === item.id);
        if (found) item.quantity = found.quantity || 0;
      });
    }
    currentWorld = data.currentWorld || 'Default';
  } catch (e) {
    console.error('Erro ao carregar save:', e);
  }
}

// === Setup eventos iniciais ===
function setupEvents() {
  // Clique já foi setado no init
}

// === Inicializa o jogo ===
init();

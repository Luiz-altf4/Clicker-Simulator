const scoreDisplay = document.getElementById('score');
const cpsDisplay = document.getElementById('cps');
const clickBtn = document.getElementById('clickBtn');

const clickPowerDisplay = document.getElementById('clickPower');
const upgradeClickPowerBtn = document.getElementById('upgradeClickPowerBtn');
const upgradeClickPowerCostDisplay = document.getElementById('upgradeClickPowerCost');

const autoClickersDisplay = document.getElementById('autoClickers');
const buyAutoClickerBtn = document.getElementById('buyAutoClickerBtn');
const autoClickerCostDisplay = document.getElementById('autoClickerCost');

const multiplierCountDisplay = document.getElementById('multiplierCount');
const buyMultiplierBtn = document.getElementById('buyMultiplierBtn');
const multiplierCostDisplay = document.getElementById('multiplierCost');

// Variáveis do jogo
let score = 0;
let clickPower = 1;
let upgradeClickPowerCost = 10;

let autoClickers = 0;
let autoClickerCost = 50;

let multiplierCount = 0;
let multiplierCost = 100;
let multiplierEffect = 1;

// Salva no localStorage
function saveGame() {
  localStorage.setItem('score', score);
  localStorage.setItem('clickPower', clickPower);
  localStorage.setItem('upgradeClickPowerCost', upgradeClickPowerCost);
  localStorage.setItem('autoClickers', autoClickers);
  localStorage.setItem('autoClickerCost', autoClickerCost);
  localStorage.setItem('multiplierCount', multiplierCount);
  localStorage.setItem('multiplierCost', multiplierCost);
  localStorage.setItem('multiplierEffect', multiplierEffect);
}

// Carrega do localStorage
function loadGame() {
  const savedScore = localStorage.getItem('score');
  const savedClickPower = localStorage.getItem('clickPower');
  const savedUpgradeClickPowerCost = localStorage.getItem('upgradeClickPowerCost');
  const savedAutoClickers = localStorage.getItem('autoClickers');
  const savedAutoClickerCost = localStorage.getItem('autoClickerCost');
  const savedMultiplierCount = localStorage.getItem('multiplierCount');
  const savedMultiplierCost = localStorage.getItem('multiplierCost');
  const savedMultiplierEffect = localStorage.getItem('multiplierEffect');

  if (savedScore !== null) score = parseFloat(savedScore);
  if (savedClickPower !== null) clickPower = parseInt(savedClickPower, 10);
  if (savedUpgradeClickPowerCost !== null) upgradeClickPowerCost = parseInt(savedUpgradeClickPowerCost, 10);
  if (savedAutoClickers !== null) autoClickers = parseInt(savedAutoClickers, 10);
  if (savedAutoClickerCost !== null) autoClickerCost = parseInt(savedAutoClickerCost, 10);
  if (savedMultiplierCount !== null) multiplierCount = parseInt(savedMultiplierCount, 10);
  if (savedMultiplierCost !== null) multiplierCost = parseInt(savedMultiplierCost, 10);
  if (savedMultiplierEffect !== null) multiplierEffect = parseFloat(savedMultiplierEffect);

  updateDisplay();
}

// Atualiza a interface e desabilita botões quando não pode comprar
function updateDisplay() {
  // Mostrar score com 1 casa decimal (remove .0 se for inteiro)
  scoreDisplay.textContent = score % 1 === 0 ? score.toString() : score.toFixed(1);
  clickPowerDisplay.textContent = clickPower * multiplierEffect;
  upgradeClickPowerCostDisplay.textContent = upgradeClickPowerCost;
  autoClickersDisplay.textContent = autoClickers;
  autoClickerCostDisplay.textContent = autoClickerCost;
  multiplierCountDisplay.textContent = multiplierCount;
  multiplierCostDisplay.textContent = multiplierCost;

  cpsDisplay.textContent = `Clicks por segundo: ${(autoClickers * clickPower * multiplierEffect).toFixed(1)}`;

  upgradeClickPowerBtn.disabled = score < upgradeClickPowerCost;
  buyAutoClickerBtn.disabled = score < autoClickerCost;
  buyMultiplierBtn.disabled = score < multiplierCost;
}

// Animação do score
function animateScore() {
  scoreDisplay.classList.add('pulse');
  setTimeout(() => {
    scoreDisplay.classList.remove('pulse');
  }, 300);
}

// Clique principal
clickBtn.addEventListener('click', () => {
  score += clickPower * multiplierEffect;
  updateDisplay();
  animateScore();
  saveGame();
});

// Comprar upgrade de click power
upgradeClickPowerBtn.addEventListener('click', () => {
  if (score >= upgradeClickPowerCost) {
    score -= upgradeClickPowerCost;
    clickPower++;
    upgradeClickPowerCost = Math.floor(upgradeClickPowerCost * 1.7);
    updateDisplay();
    saveGame();
  }
});

// Comprar auto clicker
buyAutoClickerBtn.addEventListener('click', () => {
  if (score >= autoClickerCost) {
    score -= autoClickerCost;
    autoClickers++;
    autoClickerCost = Math.floor(autoClickerCost * 2);
    updateDisplay();
    saveGame();
  }
});

// Comprar multiplicador x2
buyMultiplierBtn.addEventListener('click', () => {
  if (score >= multiplierCost) {
    score -= multiplierCost;
    multiplierCount++;
    multiplierEffect *= 2;
    multiplierCost = Math.floor(multiplierCost * 3);
    updateDisplay();
    saveGame();
  }
});

// Função que gera clicks automáticos a cada 1000ms (1 segundo)
function autoClickerInterval() {
  if (autoClickers > 0) {
    score += autoClickers * clickPower * multiplierEffect;
    updateDisplay();
    saveGame();
    animateScore();
  }
}

setInterval(autoClickerInterval, 1000);

// Inicializa jogo
loadGame();

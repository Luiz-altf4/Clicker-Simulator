let score = 0;
let clickPower = 1;
let upgradeCost = 10;

const scoreDisplay = document.getElementById('score');
const clickBtn = document.getElementById('clickBtn');
const clickPowerDisplay = document.getElementById('clickPower');
const upgradeBtn = document.getElementById('upgradeBtn');
const upgradeCostDisplay = document.getElementById('upgradeCost');

// Carregar do localStorage
function loadGame() {
  const savedScore = localStorage.getItem('score');
  const savedClickPower = localStorage.getItem('clickPower');
  const savedUpgradeCost = localStorage.getItem('upgradeCost');

  if (savedScore) score = parseInt(savedScore, 10);
  if (savedClickPower) clickPower = parseInt(savedClickPower, 10);
  if (savedUpgradeCost) upgradeCost = parseInt(savedUpgradeCost, 10);

  updateDisplay();
}

// Salvar no localStorage
function saveGame() {
  localStorage.setItem('score', score);
  localStorage.setItem('clickPower', clickPower);
  localStorage.setItem('upgradeCost', upgradeCost);
}

function updateDisplay() {
  scoreDisplay.textContent = score;
  clickPowerDisplay.textContent = clickPower;
  upgradeCostDisplay.textContent = upgradeCost;
}

// Anima o score quando clica
function animateScore() {
  scoreDisplay.style.transform = 'scale(1.2)';
  setTimeout(() => {
    scoreDisplay.style.transform = 'scale(1)';
  }, 150);
}

// Ao clicar no botão principal
clickBtn.addEventListener('click', () => {
  score += clickPower;
  updateDisplay();
  animateScore();
  saveGame();
});

// Comprar upgrade
upgradeBtn.addEventListener('click', () => {
  if (score >= upgradeCost) {
    score -= upgradeCost;
    clickPower++;
    upgradeCost = Math.floor(upgradeCost * 1.7);
    updateDisplay();
    saveGame();
  } else {
    alert('Você não tem pontos suficientes para comprar o upgrade!');
  }
});

// Iniciar o jogo carregando dados
loadGame();


// Elementos DOM
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

const gemsCountDisplay = document.getElementById('gemsCount');
const buyGemsBtn = document.getElementById('buyGemsBtn');

const speedBoostBtn = document.getElementById('speedBoostBtn');
const multiplierBoostBtn = document.getElementById('multiplierBoostBtn');

const missionsList = document.getElementById('missionsList');
const achievementsList = document.getElementById('achievementsList');

const toggleThemeBtn = document.getElementById('toggleThemeBtn');

const clickSound = document.getElementById('clickSound');
const buySound = document.getElementById('buySound');
const boostSound = document.getElementById('boostSound');

// Variáveis do jogo
let score = 0;
let clickPower = 1;
let upgradeClickPowerCost = 10;

let autoClickers = 0;
let autoClickerCost = 50;

let multiplierCount = 0;
let multiplierCost = 100;
let multiplierEffect = 1;

let gems = 0;

let level = 1;
let xp = 0;
const xpPerLevel = 100;

let speedBoostActive = false;
let speedBoostTimeout;

let multiplierBoostActive = false;
let multiplierBoostTimeout;

let cps = 0; // clicks por segundo calculado

// Missões e conquistas (simples)
const missions = [
  { id: 1, text: "Clique 50 vezes", target: 50, progress: 0, done: false },
  { id: 2, text: "Compre 3 upgrades de click power", target: 3, progress: 0, done: false },
  { id: 3, text: "Tenha 5 auto clickers", target: 5, progress: 0, done: false },
];

const achievements = [
  { id: 1, text: "Primeiro clique!", done: false, condition: () => score >= 1 },
  { id: 2, text: "50 cliques acumulados", done: false, condition: () => score >= 50 },
  { id: 3, text: "Compre 10 upgrades de click power", done: false, condition: () => clickPower >= 10 },
];

// Funções

function saveGame() {
  localStorage.setItem('score', score);
  localStorage.setItem('clickPower', clickPower);
  localStorage.setItem('upgradeClickPowerCost', upgradeClickPowerCost);
  localStorage.setItem('autoClickers', autoClickers);
  localStorage.setItem('autoClickerCost', autoClickerCost);
  localStorage.setItem('multiplierCount', multiplierCount);
  localStorage.setItem('multiplierCost', multiplierCost);
  localStorage.setItem('multiplierEffect', multiplierEffect);
  localStorage.setItem('gems', gems);
  localStorage.setItem('level', level);
  localStorage.setItem('xp', xp);
  localStorage.setItem('speedBoostActive', speedBoostActive);
  localStorage.setItem('multiplierBoostActive', multiplierBoostActive);
  localStorage.setItem('missions', JSON.stringify(missions));
  localStorage.setItem('achievements', JSON.stringify(achievements));
  localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  localStorage.setItem('lastSaveTime', Date.now());
}

function loadGame() {
  const savedScore = localStorage.getItem('score');
  if (savedScore !== null) score = parseFloat(savedScore);

  const savedClickPower = localStorage.getItem('clickPower');
  if (savedClickPower !== null) clickPower = parseInt(savedClickPower, 10);

  const savedUpgradeClickPowerCost = localStorage.getItem('upgradeClickPowerCost');
  if (savedUpgradeClickPowerCost !== null) upgradeClickPowerCost = parseInt(savedUpgradeClickPowerCost, 10);

  const savedAutoClickers = localStorage.getItem('autoClickers');
  if (savedAutoClickers !== null) autoClickers = parseInt(savedAutoClickers, 10);

  const savedAutoClickerCost = localStorage.getItem('autoClickerCost');
  if (savedAutoClickerCost !== null) autoClickerCost = parseInt(savedAutoClickerCost, 10);

  const savedMultiplierCount = localStorage.getItem('multiplierCount');
  if (savedMultiplierCount !== null) multiplierCount = parseInt(savedMultiplierCount, 10);

  const savedMultiplierCost = localStorage.getItem('multiplierCost');
  if (savedMultiplierCost !== null) multiplierCost = parseInt(savedMultiplierCost, 10);

  const savedMultiplierEffect = localStorage.getItem('multiplierEffect');
  if (savedMultiplierEffect !== null) multiplierEffect = parseFloat(savedMultiplierEffect);

  const savedGems = localStorage.getItem('gems');
  if (savedGems !== null) gems = parseInt(savedGems, 10);

  const savedLevel = localStorage.getItem('level');
  if (savedLevel !== null) level = parseInt(savedLevel, 10);

  const savedXp = localStorage.getItem('xp');
  if (savedXp !== null) xp = parseInt(savedXp, 10);

  const savedSpeedBoost = localStorage.getItem('speedBoostActive');
  speedBoostActive = savedSpeedBoost === 'true';

  const savedMultiplierBoost = localStorage.getItem('multiplierBoostActive');
  multiplierBoostActive = savedMultiplierBoost === 'true';

  const savedMissions = localStorage.getItem('missions');
  if (savedMissions !== null) {
    const loadedMissions = JSON.parse(savedMissions);
    loadedMissions.forEach(lm => {
      const mission = missions.find(m => m.id === lm.id);
      if (mission) {
        mission.progress = lm.progress;
        mission.done = lm.done;
      }
    });
  }

  const savedAchievements = localStorage.getItem('achievements');
  if (savedAchievements !== null) {
    const loadedAchievements = JSON.parse(savedAchievements);
    loadedAchievements.forEach(la => {
      const achievement = achievements.find(a => a.id === la.id);
      if (achievement) {
        achievement.done = la.done;
      }
    });
  }

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') document.body.classList.add('dark-theme');
  else document.body.classList.remove('dark-theme');

  // Offline progress
  const lastSaveTime = localStorage.getItem('lastSaveTime');
  if(lastSaveTime) {
    const now = Date.now();
    const diffSeconds = Math.floor((now - lastSaveTime) / 1000);
    if(diffSeconds > 0){
      const offlineScore = diffSeconds * autoClickers * clickPower * multiplierEffect * (speedBoostActive ? 2 : 1);
      score += offlineScore;
      xp += Math.floor(offlineScore / 5);
    }
  }

  updateDisplay();
  renderMissions();
  renderAchievements();
}

function updateDisplay() {
  scoreDisplay.textContent = Math.floor(score);
  clickPowerDisplay.textContent = Math.floor(clickPower * multiplierEffect * (multiplierBoostActive ? 5 : 1));
  upgradeClickPowerCostDisplay.textContent = upgradeClickPowerCost;
  autoClickersDisplay.textContent = autoClickers;
  autoClickerCostDisplay.textContent = autoClickerCost;
  multiplierCountDisplay.textContent = multiplierCount;
  multiplierCostDisplay.textContent = multiplierCost;
  gemsCountDisplay.textContent = gems;
  cps = autoClickers * clickPower * multiplierEffect * (speedBoostActive ? 2 : 1) * (multiplierBoostActive ? 5 : 1);
  cpsDisplay.textContent = `Clicks por segundo: ${Math.floor(cps)}`;
  updateXpBar();
  updateButtons();
}

function updateButtons() {
  upgradeClickPowerBtn.disabled = score < upgradeClickPowerCost;
  buyAutoClickerBtn.disabled = score < autoClickerCost;
  buyMultiplierBtn.disabled = score < multiplierCost;
  speedBoostBtn.disabled = gems < 20 || speedBoostActive;
  multiplierBoostBtn.disabled = gems < 50 || multiplierBoostActive;
}

function updateXpBar() {
  const xpPercent = Math.min((xp / xpPerLevel) * 100, 100);
  const xpBar = document.getElementById('xpBar');
  const levelDisplay = document.getElementById('levelDisplay');
  xpBar.style.width = `${xpPercent}%`;
  levelDisplay.textContent = `Nível: ${level}`;
}

function addXp(amount) {
  xp += amount;
  while (xp >= xpPerLevel) {
    xp -= xpPerLevel;
    level++;
  }
  updateXpBar();
}

function animateScore() {
  scoreDisplay.classList.add('pulse');
  setTimeout(() => scoreDisplay.classList.remove('pulse'), 300);
}

function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

// Eventos dos botões
clickBtn.addEventListener('click', () => {
  score += clickPower * multiplierEffect * (multiplierBoostActive ? 5 : 1);
  addXp(1);
  updateDisplay();
  animateScore();
  playSound(clickSound);
  updateMissionsOnClick();
  checkAchievements();
  saveGame();
});

upgradeClickPowerBtn.addEventListener('click', () => {
  if (score >= upgradeClickPowerCost) {
    score -= upgradeClickPowerCost;
    clickPower++;
    upgradeClickPowerCost = Math.floor(upgradeClickPowerCost * 1.7);
    updateDisplay();
    playSound(buySound);
    updateMissionsOnUpgrade();
    checkAchievements();
    saveGame();
  }
});

buyAutoClickerBtn.addEventListener('click', () => {
  if (score >= autoClickerCost) {
    score -= autoClickerCost;
    autoClickers++;
    autoClickerCost = Math.floor(autoClickerCost * 2);
    updateDisplay();
    playSound(buySound);
    updateMissionsOnAutoClicker();
    checkAchievements();
    saveGame();
  }
});

buyMultiplierBtn.addEventListener('click', () => {
  if (score >= multiplierCost) {
    score -= multiplierCost;
    multiplierCount++;
    multiplierEffect *= 2;
    multiplierCost = Math.floor(multiplierCost * 3);
    updateDisplay();
    playSound(buySound);
    saveGame();
  }
});

// Boosts temporários
speedBoostBtn.addEventListener('click', () => {
  if (gems >= 20 && !speedBoostActive) {
    gems -= 20;
    speedBoostActive = true;
    updateDisplay();
    playSound(boostSound);
    speedBoostBtn.disabled = true;

    speedBoostTimeout = setTimeout(() => {
      speedBoostActive = false;
      updateDisplay();
      saveGame();
    }, 30000); // 30 segundos
  }
});

multiplierBoostBtn.addEventListener('click', () => {
  if (gems >= 50 && !multiplierBoostActive) {
    gems -= 50;
    multiplierBoostActive = true;
    updateDisplay();
    playSound(boostSound);
    multiplierBoostBtn.disabled = true;

    multiplierBoostTimeout = setTimeout(() => {
      multiplierBoostActive = false;
      updateDisplay();
      saveGame();
    }, 30000); // 30 segundos
  }
});

// Comprar gemas simulado
buyGemsBtn.addEventListener('click', () => {
  gems += 100;
  updateDisplay();
  playSound(buySound);
  saveGame();
});

// Auto clicker automático
function autoClickerInterval() {
  if (autoClickers > 0) {
    score += cps;
    addXp(Math.floor(cps / 5));
    updateDisplay();
    animateScore();
    saveGame();
    updateMissionsOnClick();
    checkAchievements();
  }
}
setInterval(autoClickerInterval, speedBoostActive ? 500 : 1000);

// Missões

function renderMissions() {
  missionsList.innerHTML = '';
  missions.forEach(mission => {
    const li = document.createElement('li');
    li.textContent = mission.text + ` (${mission.progress}/${mission.target})`;
    if (mission.done) li.classList.add('done');
    missionsList.appendChild(li);
  });
}

function updateMissionsOnClick() {
  missions.forEach(mission => {
    if (mission.done) return;
    if (mission.id === 1) {
      mission.progress++;
      if (mission.progress >= mission.target) mission.done = true;
    }
  });
  renderMissions();
  saveGame();
}

function updateMissionsOnUpgrade() {
  missions.forEach(mission => {
    if (mission.done) return;
    if (mission.id === 2) {
      mission.progress++;
      if (mission.progress >= mission.target) mission.done = true;
    }
  });
  renderMissions();
  saveGame();
}

function updateMissionsOnAutoClicker() {
  missions.forEach(mission => {
    if (mission.done) return;
    if (mission.id === 3) {
      mission.progress++;
      if (mission.progress >= mission.target) mission.done = true;
    }
  });
  renderMissions();
  saveGame();
}

// Conquistas

function renderAchievements() {
  achievementsList.innerHTML = '';
  achievements.forEach(ach => {
    const li = document.createElement('li');
    li.textContent = ach.text;
    if (ach.done) li.classList.add('done');
    achievementsList.appendChild(li);
  });
}

function checkAchievements() {
  achievements.forEach(ach => {
    if (!ach.done && ach.condition()) {
      ach.done = true;
      renderAchievements();
      saveGame();
      alert(`🎉 Conquista desbloqueada: ${ach.text}`);
    }
  });
}

// Tema claro/escuro
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
  saveGame();
});

// Inicialização
loadGame();


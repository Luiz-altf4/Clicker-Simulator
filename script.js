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
    const diffSeconds = Math.floor((now

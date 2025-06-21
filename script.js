let score = 0;
let clickPower = 1;
let autoClickers = 0;
let multiplier = 1;
let multiplierCount = 0;
let cps = 0;
let level = 1;
let xp = 0;
let gems = 0;

// Sons
const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

// Elementos
const scoreDisplay = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");
const clickPowerSpan = document.getElementById("clickPower");
const upgradeClickPowerBtn = document.getElementById("upgradeClickPowerBtn");
const upgradeClickPowerCostSpan = document.getElementById("upgradeClickPowerCost");

const autoClickersSpan = document.getElementById("autoClickers");
const autoClickerCostSpan = document.getElementById("autoClickerCost");
const buyAutoClickerBtn = document.getElementById("buyAutoClickerBtn");

const multiplierCostSpan = document.getElementById("multiplierCost");
const multiplierCountSpan = document.getElementById("multiplierCount");
const buyMultiplierBtn = document.getElementById("buyMultiplierBtn");

const cpsDisplay = document.getElementById("cps");
const xpBar = document.getElementById("xpBar");
const levelDisplay = document.getElementById("levelDisplay");
const gemsDisplay = document.getElementById("gemsCount");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

const missionsList = document.getElementById('missionsList');
const achievementsList = document.getElementById('achievementsList');

// --- CLICKER ---
clickBtn.addEventListener("click", () => {
  score += clickPower * multiplier;
  xp += 1;
  clickSound.play();
  atualizar();
});

// --- UPGRADE: CLICK POWER ---
upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = Math.floor(10 * Math.pow(1.5, clickPower - 1));
  if (score >= cost) {
    score -= cost;
    clickPower++;
    buySound.play();
    atualizar();
  }
});

// --- UPGRADE: AUTOCLICKER ---
buyAutoClickerBtn.addEventListener("click", () => {
  const cost = 50 * (autoClickers + 1);
  if (score >= cost) {
    score -= cost;
    autoClickers++;
    buySound.play();
    atualizar();
  }
});

// --- UPGRADE: MULTIPLICADOR ---
buyMultiplierBtn.addEventListener("click", () => {
  const cost = 100 * (multiplierCount + 1);
  if (score >= cost) {
    score -= cost;
    multiplier *= 2;
    multiplierCount++;
    buySound.play();
    atualizar();
  }
});

// --- BOOST: VELOCIDADE ---
speedBoostBtn.addEventListener("click", () => {
  if (gems >= 20) {
    gems -= 20;
    buySound.play();
    let boost = setInterval(() => {
      score += clickPower * multiplier;
      atualizar();
    }, 100);
    setTimeout(() => clearInterval(boost), 30000);
  }
});

// --- BOOST: MULTIPLICADOR x5 ---
multiplierBoostBtn.addEventListener("click", () => {
  if (gems >= 50) {
    gems -= 50;
    buySound.play();
    multiplier *= 5;
    setTimeout(() => {
      multiplier /= 5;
    }, 30000);
  }
});

// --- LOJA ---
buyGemsBtn.addEventListener("click", () => {
  gems += 100;
  buySound.play();
  atualizar();
});

// --- AUTOCLICK ---
setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
}, 1000);

// --- LEVEL UP ---
function verificarLevelUp() {
  if (xp >= level * 100) {
    xp = 0;
    level++;
    gems += 10;
    buySound.play();
  }
}

// --- MISSÕES DIÁRIAS ---
const dailyMissions = [
  { id: 1, desc: "Clique 100 vezes", target: 100, reward: 10, completed: false },
  { id: 2, desc: "Compre 3 upgrades de clique", target: 3, reward: 15, completed: false },
  { id: 3, desc: "Tenha 5 autoclickers", target: 5, reward: 20, completed: false },
];

// Atualiza e exibe missões
function atualizarMissions() {
  missionsList.innerHTML = '';
  dailyMissions.forEach(mission => {
    const progress = pegarProgressoMission(mission.id);
    const li = document.createElement('li');
    li.textContent = `${mission.desc} (${progress}/${mission.target})`;
    if (mission.completed) li.classList.add('completed');
    missionsList.appendChild(li);
  });
}

// Verifica progresso e recompensa
function verificarMissions() {
  dailyMissions.forEach(mission => {
    if (!mission.completed) {
      let progress = pegarProgressoMission(mission.id);

      if (mission.id === 1) progress = xp;
      if (mission.id === 2) progress = clickPower - 1;
      if (mission.id === 3) progress = autoClickers;

      salvarProgressoMission(mission.id, progress);

      if (progress >= mission.target) {
        mission.completed = true;
        gems += mission.reward;
        alert(`Missão cumprida: "${mission.desc}". Você ganhou ${mission.reward} gemas!`);
        buySound.play();
      }
    }
  });
  atualizarMissions();
}

// --- CONQUISTAS ---
const achievements = [
  { id: 1, desc: "Primeiro clique", unlocked: false },
  { id: 2, desc: "1000 pontos", unlocked: false },
  { id: 3, desc: "10 autoclickers", unlocked: false },
];

// Atualiza e exibe conquistas
function atualizarAchievements() {
  achievementsList.innerHTML = '';
  achievements.forEach(ach => {
    const li = document.createElement('li');
    li.textContent = ach.desc;
    if (ach.unlocked) li.classList.add('completed');
    achievementsList.appendChild(li);
  });
}

// Verifica conquistas
function verificarAchievements() {
  if (!achievements[0].unlocked && score > 0) {
    achievements[0].unlocked = true;
    alert("Conquista desbloqueada: Primeiro clique!");
    buySound.play();
  }
  if (!achievements[1].unlocked && score >= 1000) {
    achievements[1].unlocked = true;
    alert("Conquista desbloqueada: 1000 pontos!");
    buySound.play();
  }
  if (!achievements[2].unlocked && autoClickers >= 10) {
    achievements[2].unlocked = true;
    alert("Conquista desbloqueada: 10 autoclickers!");
    buySound.play();
  }
  atualizarAchievements();
}

// --- SALVAR PROGRESSO ---
function salvarProgresso() {
  const data = {
    score,
    clickPower,
    autoClickers,
    multiplier,
    multiplierCount,
    cps,
    level,
    xp,
    gems,
    dailyMissions,
    achievements
  };
  localStorage.setItem('clickerSave', JSON.stringify(data));
}

// --- CARREGAR PROGRESSO ---
function carregarProgresso() {
  const data = JSON.parse(localStorage.getItem('clickerSave'));
  if (data) {
    score = data.score || 0;
    clickPower = data.clickPower || 1;
    autoClickers = data.autoClickers || 0;
    multiplier = data.multiplier || 1;
    multiplierCount = data.multiplierCount || 0;
    cps = data.cps || 0;
    level = data.level || 1;
    xp = data.xp || 0;
    gems = data.gems || 0;

    // Recarrega missões e conquistas
    if (data.dailyMissions) {
      dailyMissions.forEach(mission => {
        const savedMission = data.dailyMissions.find(m => m.id === mission.id);
        if (savedMission) {
          mission.completed = savedMission.completed;
        }
      });
    }
    if (data.achievements) {
      achievements.forEach(ach => {
        const savedAch = data.achievements.find(a => a.id === ach.id);
        if (savedAch) {
          ach.unlocked = savedAch.unlocked;
        }
      });
    }
  }
}

// --- Funções para salvar progresso específico das missões (progress counters) ---
function salvarProgressoMission(id, progress) {
  let saved = JSON.parse(localStorage.getItem('clickerMissionsProgress')) || {};
  saved[id] = progress;
  localStorage.setItem('clickerMissionsProgress', JSON.stringify(saved));
}

function pegarProgressoMission(id) {
  let saved = JSON.parse(localStorage.getItem('clickerMissionsProgress')) || {};
  return saved[id] || 0;
}

// --- ATUALIZA INTERFACE ---
function atualizar() {
  verificarLevelUp();

  scoreDisplay.textContent = Math.floor(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = Math.floor(10 * Math.pow(1.5, clickPower - 1));

  autoClickersSpan.textContent = autoClickers;
  autoClickerCostSpan.textContent = 50 * (autoClickers + 1);

  multiplierCountSpan.textContent = multiplierCount;
  multiplierCostSpan.textContent = 100 * (multiplierCount + 1);

  cpsDisplay.textContent = `Clicks por segundo: ${cps}`;
  gemsDisplay.textContent = gems;

  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / (level * 100)) * 100}%`;

  verificarMissions();
  verificarAchievements();

  salvarProgresso();
}

// --- TEMA ---
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// --- Inicializa ---
window.addEventListener("load", () => {
  carregarProgresso();
  atualizar();
});

// --- AUTOCLICK ---
setInterval(() => {
  score += autoClickers * multiplier;
  cps = autoClickers * multiplier;
  atualizar();
}, 1000);

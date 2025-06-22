// Variáveis iniciais
let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let gems = 0;
let rebirths = 0;
let currentWorldIndex = 0;
const worlds = [
  { name: "Terra", bonus: 0 },
  { name: "Marte", bonus: 10 },
  { name: "Saturno", bonus: 25 },
  { name: "Netuno", bonus: 50 },
];
const upgrades = [
  { id: 1, name: "Auto Clicker", cost: 10, cps: 1, level: 0 },
  { id: 2, name: "Click Booster", cost: 100, cps: 5, level: 0 },
  { id: 3, name: "Mega Click", cost: 1000, cps: 25, level: 0 },
  { id: 4, name: "Ultra Click", cost: 10000, cps: 100, level: 0 },
  { id: 5, name: "Hyper Click", cost: 100000, cps: 500, level: 0 },
];
const pets = [
  { id: 1, name: "Robozinho", bonus: 5, owned: false },
  { id: 2, name: "Gatinho", bonus: 12, owned: false },
  { id: 3, name: "Dragão", bonus: 30, owned: false },
];
let activePetId = null;

const clickBtn = document.getElementById("clickBtn");
const clicksDisplay = document.getElementById("clicksDisplay");
const cpsDisplay = document.getElementById("cps");
const levelDisplay = document.getElementById("levelDisplay");
const xpBar = document.getElementById("xpBar");
const gemsCount = document.createElement("div");
const rebirthCount = document.createElement("div");
const upgradesList = document.getElementById("upgradesList");
const petsList = document.getElementById("petsList");
const activePetDisplay = document.getElementById("activePet");
const currentWorldDisplay = document.getElementById("currentWorld");
const worldBonusesDisplay = document.getElementById("worldBonuses");
const changeWorldBtn = document.getElementById("changeWorldBtn");
const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");

let upgradeBuyAmount = 1;

// Mostrar gems e rebirths no painel principal
gemsCount.id = "gemsCount";
rebirthCount.id = "rebirthCount";
document.getElementById("mainPanel").appendChild(gemsCount);
document.getElementById("mainPanel").appendChild(rebirthCount);
updateGemsRebirthDisplay();

// Função para atualizar o display principal
function updateDisplay() {
  clicksDisplay.textContent = `Cliques: ${formatNumber(clicks)}`;
  cpsDisplay.textContent = `Clicks por segundo: ${formatNumber(cps)}`;
  levelDisplay.textContent = `Nível: ${level}`;
  xpBar.style.width = `${(xp / xpToNextLevel) * 100}%`;
  currentWorldDisplay.textContent = `Mundo Atual: ${worlds[currentWorldIndex].name}`;
  worldBonusesDisplay.textContent = `Bônus: +${worlds[currentWorldIndex].bonus}% clicks`;
  activePetDisplay.textContent = `Pet ativo: ${getActivePetName()}`;
}

function updateGemsRebirthDisplay() {
  gemsCount.textContent = `Gemas: ${formatNumber(gems)}`;
  rebirthCount.textContent = `Rebirths: ${formatNumber(rebirths)}`;
}

// Formatação de números grandes
function formatNumber(num) {
  if (num < 1000) return num.toString();
  const units = ["k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let unitIndex = -1;
  let n = num;
  while (n >= 1000 && unitIndex < units.length - 1) {
    n /= 1000;
    unitIndex++;
  }
  return n.toFixed(2) + units[unitIndex];
}

// Atualiza o valor de CPS somando bônus de upgrades, pet e mundo
function calculateCPS() {
  let baseCPS = 0;
  for (const upg of upgrades) {
    baseCPS += upg.cps * upg.level;
  }
  const petBonus = activePetId ? pets.find(p => p.id === activePetId).bonus : 0;
  const worldBonusPercent = worlds[currentWorldIndex].bonus;
  return baseCPS * (1 + petBonus / 100) * (1 + worldBonusPercent / 100);
}

// Criar upgrades na tela
function renderUpgrades() {
  upgradesList.innerHTML = "";
  upgrades.forEach(upg => {
    const div = document.createElement("div");
    div.className = "upgrade-row";

    const name = document.createElement("span");
    name.textContent = `${upg.name} (Lvl ${upg.level})`;

    const cost = document.createElement("span");
    cost.textContent = `Custo: ${formatNumber(upg.cost)}`;

    const buyBtn = document.createElement("button");
    buyBtn.className = "btn";
    buyBtn.textContent = "Comprar";
    buyBtn.onclick = () => buyUpgrade(upg.id);

    div.appendChild(name);
    div.appendChild(cost);
    div.appendChild(buyBtn);

    upgradesList.appendChild(div);
  });
}

// Comprar upgrade com base na quantidade selecionada
function buyUpgrade(id) {
  const upg = upgrades.find(u => u.id === id);
  if (!upg) return;

  let amount = upgradeBuyAmount;
  if (amount === "max") {
    amount = Math.floor(clicks / upg.cost);
  }

  let totalCost = 0;
  for (let i = 0; i < amount; i++) {
    totalCost += upg.cost * Math.pow(1.15, upg.level + i);
  }
  totalCost = Math.floor(totalCost);

  if (clicks >= totalCost && amount > 0) {
    clicks -= totalCost;
    upg.level += amount;
    upg.cost = Math.floor(upg.cost * Math.pow(1.15, amount));
    updateDisplay();
    renderUpgrades();
  }
}

// Renderizar pets
function renderPets() {
  petsList.innerHTML = "";
  pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "pet-card";
    if (pet.owned) div.classList.add("owned");
    if (pet.id === activePetId) div.classList.add("active");

    const name = document.createElement("div");
    name.className = "pet-name";
    name.textContent = pet.name;

    const bonus = document.createElement("div");
    bonus.textContent = `+${pet.bonus}% clicks`;

    const btn = document.createElement("button");
    btn.className = "btn";
    btn.textContent = pet.owned ? (pet.id === activePetId ? "Ativo" : "Ativar") : "Comprar";
    btn.disabled = (pet.id === activePetId);

    btn.onclick = () => {
      if (pet.owned) {
        activePetId = pet.id;
        updateDisplay();
        renderPets();
      } else {
        buyPet(pet.id);
      }
    };

    div.appendChild(name);
    div.appendChild(bonus);
    div.appendChild(btn);

    petsList.appendChild(div);
  });
}

// Comprar pet
function buyPet(id) {
  const pet = pets.find(p => p.id === id);
  if (!pet) return;
  const cost = 5000 * (pet.id); // exemplo custo escalonado
  if (clicks >= cost) {
    clicks -= cost;
    pet.owned = true;
    activePetId = pet.id;
    updateDisplay();
    renderPets();
  } else {
    alert(`Você precisa de ${formatNumber(cost)} cliques para comprar este pet.`);
  }
}

// Pet ativo nome
function getActivePetName() {
  if (!activePetId) return "Nenhum";
  const pet = pets.find(p => p.id === activePetId);
  return pet ? pet.name : "Nenhum";
}

// Trocar mundo
changeWorldBtn.onclick = () => {
  currentWorldIndex++;
  if (currentWorldIndex >= worlds.length) currentWorldIndex = 0;
  updateDisplay();
};

// Atualiza display e upgrades inicial
renderUpgrades();
renderPets();
updateDisplay();

// Clique manual
clickBtn.onclick = () => {
  clicks += 1 * (1 + (worlds[currentWorldIndex].bonus / 100));
  xp += 10;
  checkLevelUp();
  updateDisplay();
};

// Seleção quantidade compra upgrade
upgradeAmountBtns.forEach(btn => {
  btn.onclick = () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    upgradeBuyAmount = btn.dataset.amount === "max" ? "max" : parseInt(btn.dataset.amount);
  };
});

// Calcula CPS a cada segundo e adiciona clicks
setInterval(() => {
  cps = calculateCPS();
  clicks += cps;
  xp += cps * 10;
  checkLevelUp();
  updateDisplay();
}, 1000);

// Level up
function checkLevelUp() {
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.25);
  }
}

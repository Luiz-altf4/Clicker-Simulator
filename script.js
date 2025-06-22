// === Utilitários ===
const $ = id => document.getElementById(id);
const createEl = (tag, attrs = {}, ...children) => {
  const el = document.createElement(tag);
  for (const k in attrs) {
    if (k === "className") el.className = attrs[k];
    else if (k.startsWith("aria")) el.setAttribute(k, attrs[k]);
    else if (k === "dataset") {
      for (const d in attrs[k]) el.dataset[d] = attrs[k][d];
    } else el.setAttribute(k, attrs[k]);
  }
  children.forEach(c => {
    if (typeof c === "string") el.appendChild(document.createTextNode(c));
    else if (c) el.appendChild(c);
  });
  return el;
};

function formatNumber(n) {
  if (typeof n !== "number" || isNaN(n)) return "0";
  if (n < 1000) return n.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let i = -1;
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000;
    i++;
  }
  return n.toFixed(2) + units[i];
}

function getWorldName(id) {
  const worlds = ["Jardim Inicial", "Cidade Neon", "Espaço", "Dimensão", "Reino Sombrio", "Mundo Místico", "Terra dos Dragões"];
  return worlds[id - 1] || "???";
}

// === Estado do jogo ===
const gameState = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,
  currentWorld: 1,
  buyAmount: 1,
  currentMultiplier: 1,
  upgrades: [],
  shopItems: [],
  pets: [],
  missions: [],
  achievements: [],
  activePetId: null,
  lastChatTimestamp: 0,
  theme: "dark",
};

// === Inicializa dados do jogo ===
function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Canhão de Clicks", description: "Gera muitos clicks por segundo", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Clicker", description: "Trabalha para você", cps: 50, quantity: 0, basePrice: 500 },
    { id: 4, name: "Gerador de Clicks", description: "Mais clicks por segundo", cps: 150, quantity: 0, basePrice: 1500 },
    { id: 5, name: "Clicker Quântico", description: "Clicks quase infinitos", cps: 500, quantity: 0, basePrice: 10000 },
    { id: 6, name: "Mega Clicker", description: "Clicks em grande escala", cps: 2000, quantity: 0, basePrice: 40000 },
    { id: 7, name: "Clicker Supremo", description: "Clicks divinos", cps: 10000, quantity: 0, basePrice: 150000 },
    { id: 8, name: "Deus do Click", description: "Clicks que mudam o universo", cps: 50000, quantity: 0, basePrice: 800000 }
  ];

  gameState.shopItems = [
    { id: 1, name: "Multiplicador x2", description: "Dobra produção por 5 min", owned: false, price: 1000, effectDuration: 300000 },
    { id: 2, name: "Multiplicador x5", description: "Quíntupla produção por 2 min", owned: false, price: 5000, effectDuration: 120000 },
  ];

  gameState.pets = [
    { id: 1, name: "Gato Clicker", bonusPercent: 5, owned: false },
    { id: 2, name: "Cachorro Robótico", bonusPercent: 15, owned: false },
    { id: 3, name: "Dragão Cibernético", bonusPercent: 30, owned: false },
  ];

  gameState.missions = [
    { id: 1, description: "Clique 100 vezes", goal: 100, progress: 0, rewardXP: 50, completed: false },
    { id: 2, description: "Compre 5 upgrades", goal: 5, progress: 0, rewardXP: 100, completed: false },
    { id: 3, description: "Faça 1 rebirth", goal: 1, progress: 0, rewardXP: 500, completed: false },
  ];

  gameState.achievements = [
    { id: 1, name: "Primeiro Click", description: "Realize seu primeiro click", achieved: false },
    { id: 2, name: "Novato", description: "Alcance nível 10", achieved: false },
    { id: 3, name: "Profissional", description: "Alcance 1000 clicks", achieved: false },
    { id: 4, name: "Veterano", description: "Realize 10 rebirths", achieved: false },
  ];
}

// === Salvar e carregar jogo automaticamente ===
function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
  } catch (err) {
    console.error("Erro ao salvar:", err);
    showNotification("Falha ao salvar progresso!", "error");
  }
}

function loadGame() {
  const saveData = localStorage.getItem("clickerSave");
  if (saveData) {
    try {
      const parsed = JSON.parse(saveData);
      Object.assign(gameState, parsed);
      showNotification("Progresso carregado!", "success");
    } catch (err) {
      console.error("Erro ao carregar save:", err);
      showNotification("Falha ao carregar progresso!", "error");
    }
  }
}

// === Função para exibir notificações ===
const notificationEl = $("notification");
let notificationTimeout = null;
function showNotification(text, type = "info") {
  notificationEl.textContent = text;
  notificationEl.style.backgroundColor = type === "error" ? "#e74c3c" : type === "success" ? "#27ae60" : "#0f62fe";
  notificationEl.style.display = "block";
  clearTimeout(notificationTimeout);
  notificationTimeout = setTimeout(() => {
    notificationEl.style.display = "none";
  }, 3500);
}

// === Atualizar todos os displays ===
function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS());
  $("levelDisplay").textContent = gameState.level;
  $("xpDisplay").textContent = formatNumber(gameState.xp);
  $("rebirthCount").textContent = gameState.rebirths;
  $("currentWorld").textContent = `${gameState.currentWorld} - ${getWorldName(gameState.currentWorld)}`;
}

// === Atualizar upgrades ===
function updateUpgradesDisplay() {
  const upgradesDiv = $("upgradesList");
  upgradesDiv.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const price = getUpgradePrice(upg);
    const canBuy = gameState.clicks >= price;
    const div = createEl("div", { className: "upgrade-item" },
      createEl("h4", {}, `${upg.name} (x${upg.quantity})`),
      createEl("p", {}, upg.description),
      createEl("p", {}, `CPS: ${formatNumber(upg.cps)}`),
      createEl("p", {}, `Preço: ${formatNumber(price)}`),
      createEl("button", {
        onclick: () => buyUpgrade(upg.id),
        disabled: !canBuy
      }, canBuy ? "Comprar" : "Sem clicks")
    );
    upgradesDiv.appendChild(div);
  });
}

// === Calcula preço de upgrade com base na quantidade comprada ===
function getUpgradePrice(upgrade) {
  return Math.floor(upgrade.basePrice * Math.pow(1.15, upgrade.quantity));
}

// === Compra upgrade ===
function buyUpgrade(upgradeId) {
  const upg = gameState.upgrades.find(u => u.id === upgradeId);
  const price = getUpgradePrice(upg);
  if (gameState.clicks >= price) {
    gameState.clicks -= price;
    upg.quantity += gameState.buyAmount;
    showNotification(`Você comprou ${upg.name} x${gameState.buyAmount}!`, "success");
    updateDisplay();
    updateUpgradesDisplay();
    saveGame();
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

// === Atualizar loja ===
function updateShopDisplay() {
  const shopDiv = $("shopList");
  shopDiv.innerHTML = "";
  gameState.shopItems.forEach(item => {
    const canBuy = gameState.clicks >= item.price && !item.owned;
    const div = createEl("div", { className: "shop-item" },
      createEl("h4", {}, item.name),
      createEl("p", {}, item.description),
      createEl("p", {}, `Preço: ${formatNumber(item.price)}`),
      createEl("button", {
        onclick: () => buyShopItem(item.id),
        disabled: !canBuy
      }, canBuy ? "Comprar" : item.owned ? "Comprado" : "Clicks insuficientes")
    );
    shopDiv.appendChild(div);
  });
}

// === Comprar item da loja ===
function buyShopItem(itemId) {
  const item = gameState.shopItems.find(i => i.id === itemId);
  if (!item || item.owned) return;
  if (gameState.clicks >= item.price) {
    gameState.clicks -= item.price;
    item.owned = true;
    showNotification(`Você comprou ${item.name}!`, "success");
    updateDisplay();
    updateShopDisplay();
    saveGame();
  } else {
    showNotification("Clicks insuficientes!", "error");
  }
}

// === Atualizar pets ===
function updatePetsDisplay() {
  const petsDiv = $("petsList");
  petsDiv.innerHTML = "";
  gameState.pets.forEach(pet => {
    const canBuy = gameState.clicks >= pet.price && !pet.owned;
    const div = createEl("div", { className: "pet-item" },
      createEl("h4", {}, pet.name),
      createEl("p", {}, `Bônus: +${pet.bonusPercent}% CPS`),
      createEl("button", {
        onclick: () => buyPet(pet.id),
        disabled: pet.owned ? false : (gameState.clicks < (pet.price || 5000))
      }, pet.owned ? (gameState.activePetId === pet.id ? "Ativo" : "Ativar") : "Comprar")
    );
    petsDiv.appendChild(div);
  });
}

// === Comprar pet ===
function buyPet(petId) {
  const pet = gameState.pets.find(p => p.id === petId);
  if (!pet) return;
  if (!pet.owned) {
    if (gameState.clicks >= (pet.price || 5000)) {
      gameState.clicks -= (pet.price || 5000);
      pet.owned = true;
      gameState.activePetId = pet.id;
      showNotification(`Você comprou e ativou o pet ${pet.name}!`, "success");
      updatePetsDisplay();
      updateDisplay();
      saveGame();
    } else {
      showNotification("Clicks insuficientes!", "error");
    }
  } else {
    // Ativar pet já comprado
    gameState.activePetId = pet.id;
    showNotification(`Pet ${pet.name} ativado!`, "success");
    updatePetsDisplay();
    saveGame();
  }
}

// === Calcular CPS total ===
function calcCPS() {
  let cpsTotal = 0;
  gameState.upgrades.forEach(u => {
    cpsTotal += u.cps * u.quantity;
  });
  // Bônus do pet ativo
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet && pet.owned) {
      cpsTotal *= 1 + (pet.bonusPercent / 100);
    }
  }
  // Bônus multiplicador da loja (simulação)
  gameState.shopItems.forEach(item => {
    if (item.owned) {
      if (item.name.includes("x2")) cpsTotal *= 2;
      if (item.name.includes("x5")) cpsTotal *= 5;
    }
  });
  return cpsTotal;
}

// === Incrementa clicks pelo CPS a cada segundo ===
function autoClickerTick() {
  const cps = calcCPS();
  if (cps > 0) {
    gameState.clicks += cps;
    gameState.totalClicks += cps;
    addXP(cps / 2);
    updateDisplay();
    updateMissionsProgress(cps);
    saveGame();
  }
}

// === Atualizar missões na tela ===
function updateMissionsDisplay() {
  const missionsUl = $("missions");
  missionsUl.innerHTML = "";
  gameState.missions.forEach(m => {
    const li = createEl("li", { className: m.completed ? "mission-completed" : "" },
      `${m.description} - ${m.progress}/${m.goal} ${m.completed ? "✓" : ""}`
    );
    missionsUl.appendChild(li);
  });
}

// === Atualizar progresso das missões ===
function updateMissionsProgress(amount) {
  gameState.missions.forEach(m => {
    if (!m.completed) {
      m.progress += amount;
      if (m.progress >= m.goal) {
        m.completed = true;
        addXP(m.rewardXP);
        showNotification(`Missão concluída: ${m.description}`, "success");
      }
    }
  });
  updateMissionsDisplay();
}

// === Atualizar conquistas na tela ===
function updateAchievementsDisplay() {
  const achUl = $("achievementsList");
  achUl.innerHTML = "";
  gameState.achievements.forEach(a => {
    const li = createEl("li", { className: a.achieved ? "achieved" : "" },
      `${a.name} - ${a.description} ${a.achieved ? "✓" : ""}`
    );
    achUl.appendChild(li);
  });
}

// === Verificar e atualizar conquistas automaticamente ===
function checkAchievements() {
  gameState.achievements.forEach(a => {
    if (!a.achieved) {
      if (a.id === 1 && gameState.totalClicks >= 1) a.achieved = true;
      else if (a.id === 2 && gameState.level >= 10) a.achieved = true;
      else if (a.id === 3 && gameState.totalClicks >= 1000) a.achieved = true;
      else if (a.id === 4 && gameState.rebirths >= 10) a.achieved = true;
      if (a.achieved) showNotification(`Conquista desbloqueada: ${a.name}`, "success");
    }
  });
  updateAchievementsDisplay();
}

// === Adicionar XP e subir nível ===
function addXP(amount) {
  gameState.xp += amount;
  while (gameState.xp >= gameState.xpToNext) {
    gameState.xp -= gameState.xpToNext;
    gameState.level++;
    gameState.xpToNext = Math.floor(gameState.xpToNext * 1.2);
    showNotification(`Parabéns! Você subiu para o nível ${gameState.level}`, "success");
  }
  updateDisplay();
  checkAchievements();
}

// === Reseta o jogo ===
function resetGame() {
  if (confirm("Tem certeza que deseja resetar seu progresso?")) {
    localStorage.removeItem("clickerSave");
    location.reload();
  }
}

// === Eventos ===
$("clickButton").addEventListener("click", () => {
  gameState.clicks += gameState.currentMultiplier;
  gameState.totalClicks++;
  addXP(1);
  updateDisplay();
  updateMissionsProgress(1);
  saveGame();
});

$("buyAmountSelect").addEventListener("change", e => {
  gameState.buyAmount = parseInt(e.target.value);
  updateUpgradesDisplay();
});

$("saveBtn").addEventListener("click", () => {
  saveGame();
  showNotification("Jogo salvo!", "success");
});

$("loadBtn").addEventListener("click", () => {
  loadGame();
  updateAllDisplays();
});

$("resetBtn").addEventListener("click", resetGame);

// Atualiza todas as seções visuais
function updateAllDisplays() {
  updateDisplay();
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
  updateMissionsDisplay();
  updateAchievementsDisplay();
}

// === Inicialização ===
function main() {
  initGameData();
  loadGame();
  updateAllDisplays();
  setInterval(autoClickerTick, 1000);
}

main();

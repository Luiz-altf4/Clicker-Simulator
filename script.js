// Firebase Config e Inicialização
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.firebasestorage.app",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
  measurementId: "G-ZXXWCDTY9D"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();
const auth = firebase.auth();

auth.signInAnonymously().catch(error => {
  console.error("Erro na autenticação anônima:", error);
});

// --- Estado do jogo (simplificado para foco no ranking) ---

let clicks = 0;
let cps = 0;
let level = 1;
let xp = 0;
let xpToNextLevel = 100;
let rebirths = 0;
let currentWorld = 1;

let buyAmount = 1;

// Dados (simplificado para o exemplo, você pode colocar seus dados originais aqui)

const upgrades = [
  { id: 1, name: "Cursor", basePrice: 15, price: 15, quantity: 0, cps: 0.1 },
  { id: 2, name: "Grandes Mãos", basePrice: 100, price: 100, quantity: 0, cps: 1 },
  { id: 3, name: "Robô Auxiliar", basePrice: 1100, price: 1100, quantity: 0, cps: 8 },
  { id: 4, name: "Fábrica", basePrice: 12000, price: 12000, quantity: 0, cps: 47 },
  { id: 5, name: "Laboratório", basePrice: 130000, price: 130000, quantity: 0, cps: 260 },
];

// Elementos DOM
const clicksDisplay = document.getElementById("clicksDisplay");
const cpsDisplay = document.getElementById("cpsDisplay");
const levelDisplay = document.getElementById("levelDisplay");
const xpDisplay = document.getElementById("xpDisplay");
const xpToNextLevelDisplay = document.getElementById("xpToNextLevel");
const rebirthCountDisplay = document.getElementById("rebirthCount");
const currentWorldDisplay = document.getElementById("currentWorld");

const clickBtn = document.getElementById("clickBtn");
const upgradesList = document.getElementById("upgradesList");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");

const toggleThemeBtn = document.getElementById("toggleTheme");

// Ranking elements
const rankingList = document.getElementById("rankingList");
const playerNameInput = document.getElementById("playerNameInput");
const saveScoreBtn = document.getElementById("saveScoreBtn");

// Função para formatar números com unidades (K, M, B, T...)
function formatNumber(num) {
  if (num < 1000) return num.toFixed(0);
  const units = ["K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "De"];
  let unitIndex = -1;
  while (num >= 1000 && unitIndex < units.length - 1) {
    num /= 1000;
    unitIndex++;
  }
  return num.toFixed(2) + units[unitIndex];
}

// Atualiza a tela do jogo
function updateDisplay() {
  clicksDisplay.textContent = formatNumber(clicks);
  cpsDisplay.textContent = formatNumber(calculateCPS());
  levelDisplay.textContent = level;
  xpDisplay.textContent = formatNumber(xp);
  xpToNextLevelDisplay.textContent = formatNumber(xpToNextLevel);
  rebirthCountDisplay.textContent = rebirths;
  currentWorldDisplay.textContent = `${currentWorld} - Jardim Inicial`; // simplificado

  updateUpgradesList();
}

// Calcula CPS
function calculateCPS() {
  let baseCPS = 0;
  upgrades.forEach(upg => {
    baseCPS += upg.cps * upg.quantity;
  });
  return baseCPS;
}

// Clique manual
clickBtn.addEventListener("click", () => {
  clicks += 1;
  gainXP(5);
  updateDisplay();
});

// Compra upgrades
function buyUpgrade(id, amount) {
  const upg = upgrades.find(u => u.id === id);
  if (!upg) return;

  if (amount === "max") {
    let maxAffordable = 0;
    let price = upg.price;
    while (clicks >= price) {
      clicks -= price;
      maxAffordable++;
      price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity + maxAffordable));
    }
    if (maxAffordable > 0) {
      upg.quantity += maxAffordable;
      upg.price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    }
  } else {
    for (let i = 0; i < amount; i++) {
      if (clicks >= upg.price) {
        clicks -= upg.price;
        upg.quantity++;
        upg.price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
      } else {
        break;
      }
    }
  }
  updateDisplay();
}

// Atualiza lista de upgrades e botões
function updateUpgradesList() {
  upgradesList.innerHTML = "";
  upgrades.forEach(upg => {
    const row = document.createElement("div");
    row.className = "upgrade-row";

    const name = document.createElement("div");
    name.textContent = `${upg.name} (Qtd: ${upg.quantity})`;
    name.style.fontWeight = "700";

    const price = document.createElement("div");
    price.textContent = `Preço: ${formatNumber(upg.price)}`;

    const buyBtn = document.createElement("button");
    buyBtn.className = "btn";
    buyBtn.textContent = "Comprar";
    buyBtn.disabled = clicks < upg.price;
    buyBtn.addEventListener("click", () => buyUpgrade(upg.id, buyAmount));

    row.appendChild(name);
    row.appendChild(price);
    row.appendChild(buyBtn);

    upgradesList.appendChild(row);
  });
}

// Controle dos botões de quantidade para compra
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const val = btn.getAttribute("data-amount");
    buyAmount = val === "max" ? "max" : parseInt(val);
  });
});

// Loop para ganhar clicks por segundo automaticamente
setInterval(() => {
  const autoClicks = calculateCPS();
  clicks += autoClicks;
  gainXP(autoClicks * 2);
  updateDisplay();
}, 1000);

// Sistema simples de XP e level up
function gainXP(amount) {
  xp += amount;
  while (xp >= xpToNextLevel) {
    xp -= xpToNextLevel;
    level++;
    xpToNextLevel = Math.floor(xpToNextLevel * 1.2);
  }
}

// Rebirth simplificado
const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthInfo = document.getElementById("rebirthInfo");

rebirthBtn.addEventListener("click", () => {
  if (clicks >= 100000) { // requisito para rebirth (exemplo)
    rebirths++;
    clicks = 0;
    level = 1;
    xp = 0;
    xpToNextLevel = 100;
    upgrades.forEach(u => {
      u.quantity = 0;
      u.price = u.basePrice;
    });
    rebirthInfo.textContent = `Rebirth feito! Total: ${rebirths}`;
    updateDisplay();
  } else {
    rebirthInfo.textContent = "Você precisa de 100.000 clicks para fazer Rebirth.";
  }
});

// Tema claro/escuro
toggleThemeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-theme");
  toggleThemeBtn.textContent = document.body.classList.contains("light-theme") ? "🌙" : "☀️";
});

// ---------- RANKING ONLINE ----------

// Atualiza ranking na tela
function updateRankingUI(players) {
  rankingList.innerHTML = "";
  players.forEach(player => {
    const li = document.createElement("li");
    li.textContent = `${player.name}: ${formatNumber(player.score)} clicks`;
    rankingList.appendChild(li);
  });
}

// Salva a pontuação do jogador no Firebase
saveScoreBtn.addEventListener("click", () => {
  const name = playerNameInput.value.trim();
  if (!name) {
    alert("Digite um nome válido!");
    return;
  }

  const score = clicks;

  db.collection("rankings").doc(name).set({
    name: name,
    score: score,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    alert("Pontuação salva!");
    playerNameInput.value = "";
    fetchRanking();
  }).catch(err => {
    console.error("Erro ao salvar pontuação:", err);
  });
});

// Busca ranking no Firebase (top 10)
function fetchRanking() {
  db.collection("rankings")
    .orderBy("score", "desc")
    .limit(10)
    .get()
    .then(snapshot => {
      const players = [];
      snapshot.forEach(doc => {
        players.push(doc.data());
      });
      updateRankingUI(players);
    })
    .catch(err => {
      console.error("Erro ao buscar ranking:", err);
    });
}

// Atualiza ranking a cada 30 segundos
setInterval(fetchRanking, 30000);

// Busca ranking na inicialização
fetchRanking();

// Inicializa display
updateDisplay();

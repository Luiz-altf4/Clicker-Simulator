// =================== script.js Corrigido e Completo ===================

// === Importações Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getDatabase, ref, push, set, get, onValue, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

// === Configuração Firebase ===
const firebaseConfig = {
  apiKey: "AIzaSyA4iTIlOQbfvtEQd27R5L6Z7y_oXeatBF8",
  authDomain: "clickersimulatorrank.firebaseapp.com",
  databaseURL: "https://clickersimulatorrank-default-rtdb.firebaseio.com/",
  projectId: "clickersimulatorrank",
  storageBucket: "clickersimulatorrank.appspot.com",
  messagingSenderId: "487285841132",
  appId: "1:487285841132:web:e855fc761b7d2c420d99c9",
  measurementId: "G-ZXXWCDTY9D"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// === Estado do Jogo ===
let gameState = {
  clicks: 0,
  totalClicks: 0,
  cps: 0,
  level: 1,
  xp: 0,
  xpToNext: 100,
  rebirths: 0,
  currentWorld: 1,
  buyAmount: 1,
  upgrades: [],
  shopItems: [],
  pets: [],
  achievements: [],
  missions: [],
  activePetId: null,
  theme: "dark"
};

const $ = id => document.getElementById(id);

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

function initGameData() {
  gameState.upgrades = [
    { id: 1, name: "Cursor", description: "Gera clicks automaticamente", cps: 1, quantity: 0, basePrice: 10 },
    { id: 2, name: "Click Bot", description: "Gera muitos clicks", cps: 10, quantity: 0, basePrice: 100 },
    { id: 3, name: "Robô Supremo", description: "Gera clicks massivos", cps: 100, quantity: 0, basePrice: 1000 }
  ];

  gameState.shopItems = [
    { id: 1, name: "Boost x2", description: "Dobra a produção por 1min", owned: false, price: 1000, effectDuration: 60000 },
    { id: 2, name: "Boost x5", description: "Multiplica por 5 por 30s", owned: false, price: 2500, effectDuration: 30000 }
  ];

  gameState.pets = [
    { id: 1, name: "Gato Clicker", bonusPercent: 5, owned: false },
    { id: 2, name: "Cachorro Robô", bonusPercent: 15, owned: false },
    { id: 3, name: "Dragão Cibernético", bonusPercent: 30, owned: false }
  ];
}

function calcCPS() {
  let cps = 0;
  gameState.upgrades.forEach(u => cps += u.cps * u.quantity);
  if (gameState.activePetId) {
    const pet = gameState.pets.find(p => p.id === gameState.activePetId);
    if (pet) cps *= 1 + pet.bonusPercent / 100;
  }
  return cps;
}

function gainClicks(amount) {
  gameState.clicks += amount;
  gameState.totalClicks += amount;
  updateDisplay();
}

function updateDisplay() {
  $("clicksDisplay").textContent = formatNumber(gameState.clicks);
  $("totalClicksStat").textContent = formatNumber(gameState.totalClicks);
  $("cpsDisplay").textContent = formatNumber(calcCPS());
  $("rebirthCount").textContent = gameState.rebirths;
  updateUpgradesDisplay();
  updateShopDisplay();
  updatePetsDisplay();
}

function updateUpgradesDisplay() {
  const upgradesDiv = $("upgrades");
  if (!upgradesDiv) return;
  upgradesDiv.innerHTML = "";
  gameState.upgrades.forEach(upg => {
    const price = Math.floor(upg.basePrice * Math.pow(1.15, upg.quantity));
    const div = document.createElement("div");
    div.className = "upgrade-item";
    div.innerHTML = `
      <h4>${upg.name}</h4>
      <p>${upg.description}</p>
      <p>Qtd: ${upg.quantity}</p>
      <p>Preço: ${formatNumber(price)}</p>
      <button ${gameState.clicks < price ? "disabled" : ""} onclick="buyUpgrade(${upg.id}, ${price})">Comprar</button>
    `;
    upgradesDiv.appendChild(div);
  });
}

function buyUpgrade(id, price) {
  const upg = gameState.upgrades.find(u => u.id === id);
  if (!upg || gameState.clicks < price) return;
  gameState.clicks -= price;
  upg.quantity++;
  updateDisplay();
}

function updateShopDisplay() {
  const shop = $("shopList");
  if (!shop) return;
  shop.innerHTML = "";
  gameState.shopItems.forEach(item => {
    const price = typeof item.price === "number" ? item.price : 0;
    const div = document.createElement("div");
    div.className = "shop-item";
    div.innerHTML = `
      <h4>${item.name}</h4>
      <p>${item.description}</p>
      <p>Preço: ${formatNumber(price)}</p>
      <button ${item.owned || gameState.clicks < price ? "disabled" : ""}>${item.owned ? "Comprado" : "Comprar"}</button>
    `;
    shop.appendChild(div);
  });
}

function updatePetsDisplay() {
  const petsDiv = $("pets");
  if (!petsDiv) return;
  petsDiv.innerHTML = "";
  gameState.pets.forEach(pet => {
    const div = document.createElement("div");
    div.className = "pet-item";
    const owned = pet.owned ? "Sim" : "Não";
    div.innerHTML = `
      <h4>${pet.name}</h4>
      <p>Bônus: +${pet.bonusPercent}% CPS</p>
      <p>Possuído: ${owned}</p>
      <button onclick="selectPet(${pet.id})">${gameState.activePetId === pet.id ? "Ativo" : pet.owned ? "Selecionar" : "Comprar (1000)"}</button>
    `;
    petsDiv.appendChild(div);
  });
}

function selectPet(id) {
  const pet = gameState.pets.find(p => p.id === id);
  if (!pet) return;
  if (!pet.owned && gameState.clicks >= 1000) {
    gameState.clicks -= 1000;
    pet.owned = true;
  }
  if (pet.owned) gameState.activePetId = id;
  updateDisplay();
}

$("clickBtn").addEventListener("click", () => gainClicks(1));
setInterval(() => gainClicks(calcCPS()), 1000);

function saveGame() {
  try {
    localStorage.setItem("clickerSave", JSON.stringify(gameState));
  } catch (e) {
    console.error("Erro ao salvar:", e);
  }
}

function loadGame() {
  try {
    const data = JSON.parse(localStorage.getItem("clickerSave"));
    if (data) Object.assign(gameState, data);
  } catch (e) {
    console.error("Erro ao carregar save:", e);
  }
}

window.addEventListener("load", () => {
  initGameData();
  loadGame();
  updateDisplay();
});

window.addEventListener("beforeunload", saveGame);

// --- VARIÁVEIS GLOBAIS ---
let score = 0, clickPower = 1, autoClickers = 0, multiplier = 1, multiplierCount = 0;
let cps = 0, level = 1, xp = 0, gems = 0, rebirths = 0;
let currentWorld = "Earth";

const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");
const boostSound = document.getElementById("boostSound");

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
const rebirthCountSpan = document.getElementById("rebirthCount");
const worldNameSpan = document.getElementById("worldName");
const currentWorldSpan = document.getElementById("currentWorld");

const speedBoostBtn = document.getElementById("speedBoostBtn");
const multiplierBoostBtn = document.getElementById("multiplierBoostBtn");
const buyGemsBtn = document.getElementById("buyGemsBtn");

const rebirthBtn = document.getElementById("rebirthBtn");
const resetBtn = document.getElementById("resetBtn");
const nextWorldBtn = document.getElementById("nextWorldBtn");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
let upgradeAmount = 1;

// --- FORMATAR NÚMEROS GRANDES ---
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["", "K", "M", "B", "T", "Q", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
  let ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

// --- SALVAR & CARREGAR ESTADO ---
function salvarEstado() {
  const estado = { score, clickPower, autoClickers, multiplier, multiplierCount, cps, level, xp, gems, rebirths, currentWorld };
  localStorage.setItem("clickerSave", JSON.stringify(estado));
}

function carregarEstado() {
  const estado = JSON.parse(localStorage.getItem("clickerSave"));
  if (estado) {
    Object.assign(window, estado);
    multiplier = (multiplierCount + 1) * (rebirths * 2 || 1);
  }
}

// --- FUNÇÕES DE CUSTO ---
function custoUpgradeClickPower() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
}
function custoAutoClicker() {
  return 50 * (autoClickers + 1) * upgradeAmount;
}
function custoMultiplicador() {
  let total = 0;
  for (let i = 0; i < upgradeAmount; i++) {
    total += 100 * (multiplierCount + i + 1);
  }
  return total;
}

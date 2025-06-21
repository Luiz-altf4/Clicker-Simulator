// Variáveis do jogo
let score = 0;
let clickPower = 1;
let rebirths = 0;

const clickSound = document.getElementById("clickSound");
const buySound = document.getElementById("buySound");

const scoreDisplay = document.getElementById("score");
const clickBtn = document.getElementById("clickBtn");
const clickPowerSpan = document.getElementById("clickPower");

const upgradeClickPowerBtn = document.getElementById("upgradeClickPowerBtn");
const upgradeClickPowerCostSpan = document.getElementById("upgradeClickPowerCost");

const rebirthBtn = document.getElementById("rebirthBtn");
const rebirthCountSpan = document.getElementById("rebirthCount");

const resetBtn = document.getElementById("resetBtn");

const upgradeAmountBtns = document.querySelectorAll(".upgradeAmountBtn");
let upgradeAmount = 1;

// Calcula custo da melhoria do clique
function custoUpgrade() {
  return Math.floor(10 * Math.pow(1.5, clickPower - 1)) * upgradeAmount;
}

// Formata números para abreviações
function formatarNumero(num) {
  if (num < 1000) return num.toFixed(0);
  const unidades = ["", "K", "M", "B", "T"];
  let ordem = Math.min(Math.floor(Math.log10(num) / 3), unidades.length - 1);
  let valor = num / Math.pow(1000, ordem);
  return valor.toFixed(2) + unidades[ordem];
}

// Salva estado no localStorage
function salvarEstado() {
  const estado = { score, clickPower, rebirths };
  localStorage.setItem("clickerSimEstado", JSON.stringify(estado));
}

// Carrega estado do localStorage
function carregarEstado() {
  const estado = localStorage.getItem("clickerSimEstado");
  if (estado) {
    const obj = JSON.parse(estado);
    score = obj.score || 0;
    clickPower = obj.clickPower || 1;
    rebirths = obj.rebirths || 0;
  }
}

// Atualiza display e botões
function atualizar() {
  scoreDisplay.textContent = formatarNumero(score);
  clickPowerSpan.textContent = clickPower;
  upgradeClickPowerCostSpan.textContent = formatarNumero(custoUpgrade());
  rebirthCountSpan.textContent = rebirths;
  salvarEstado();
}

// Clique principal
clickBtn.addEventListener("click", () => {
  score += clickPower * upgradeAmount;
  if (clickSound) clickSound.play();
  atualizar();
});

// Comprar upgrade do clique
upgradeClickPowerBtn.addEventListener("click", () => {
  const cost = custoUpgrade();
  if (score >= cost) {
    score -= cost;
    clickPower += upgradeAmount;
    if (buySound) buySound.play();
    atualizar();
  } else {
    alert("Pontos insuficientes para comprar!");
  }
});

// Alterar quantidade para comprar
upgradeAmountBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    upgradeAmount = parseInt(btn.dataset.amount);
    upgradeAmountBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    atualizar();
  });
});

// Rebirth
rebirthBtn.addEventListener("click", () => {
  // Custo básico exemplo: 1000 * 10^rebirths
  let custo = 1000 * Math.pow(10, rebirths);
  if (score >= custo) {
    score = 0;
    clickPower = 1;
    rebirths++;
    if (buySound) buySound.play();
    atualizar();
  } else {
    alert(`Rebirth custa ${formatarNumero(custo)} pontos!`);
  }
});

// Resetar jogo
resetBtn.addEventListener("click", () => {
  if (confirm("Tem certeza que quer resetar o jogo?")) {
    localStorage.clear();
    location.reload();
  }
});

// Tema escuro / claro
document.getElementById("toggleThemeBtn").addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

// Inicialização
window.onload = () => {
  carregarEstado();
  atualizar();
};
